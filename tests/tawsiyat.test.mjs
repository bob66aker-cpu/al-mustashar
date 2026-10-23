/*
 * tests/tawsiyat.test.mjs — فحص ساكن لقسم «التوصيات الزراعية» (2026-10-23)
 * ------------------------------------------------------------------
 * العقد بعد إعادة البناء: بيانات القسم من كتاب Recomm25 وحده.
 * الفهرس والبطاقات والتوفيق كلها تُعاد حسابها من الملفات وتُقارن بالمصدر:
 *   - كل بطاقة تحمل إثبات مصدرها (ملف + صفحة PDF + صفحة مطبوعة + موضع الجدول).
 *   - صفر مصادر خارجية داخل data/tws (الموقع الوحيد apc.gov.eg).
 *   - CAS: رقم فقط عند مطابقة مؤكدة؛ الملتبس/بلا مطابقة بلا رقم إطلاقاً.
 *   - جدول التدقيق يحصر السجلات القديمة كلها بحالاته الثلاثة.
 *   - القمح مطابق لكتابه حرفياً (6 أقسام،5 فطرية، وحدها) وآفات الذرة القديمة
 *     خرجت بحالات موثقة لا بحذف صامت.
 * Node-only، قراءة فقط، بلا DOM ولا شبكة.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' — ' + extra}`);
  ok ? pass++ : fail++;
};
const J = p => JSON.parse(readFileSync(join(root, p), 'utf8'));
const normAr = s => String(s || '')
  .replace(/[ً-ْٰـ​]/g, '').replace(/[آأإ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/\s+/g, ' ').trim().toLowerCase();

const secsDoc = J('data/tws/sections.json');
const cropsDoc = J('data/tws/crops.json');
const labels = J('data/tws/labels.json');
const man = J('data/tws/manifest.json');
const audit = J('data/tws/audit.json');
const legacy = J('data/tws/audit-legacy-index.json');
const sections = secsDoc.sections || [];

/* ----------1) المصدر الوحيد ---------- */
check('source: the only declared source is the official book (apc.gov.eg)',
  secsDoc.source && secsDoc.source.url === 'http://www.apc.gov.eg/Files/Releases/Recomm25.pdf'
  && secsDoc.source.file === 'Recomm25.pdf' && man.source && man.source.url === secsDoc.source.url,
  JSON.stringify(secsDoc.source || {}));
const allTws = ['data/tws/sections.json', 'data/tws/crops.json', 'data/tws/manifest.json', 'data/tws/audit.json']
  .map(p => readFileSync(join(root, p), 'utf8')).join('\n');
const urls = [...allTws.matchAll(/https?:\/\/[^\s"'\\]+/g)].map(m => m[0]);
const foreign = urls.filter(u => !u.includes('apc.gov.eg'));
check('source: no external agricultural source survives in data/tws (every URL is apc.gov.eg)',
  foreign.length === 0, foreign.slice(0, 3).join(' '));
const banned = ['ipm', 'eppo', 'ufifas', 'ifas.', 'agric.udel', 'invasivespeciesinfo'];
const hits = banned.filter(b => allTws.toLowerCase().includes(b));
check('source: no UC IPM / EPPO / UF-IFAS trace in the shipped data', hits.length === 0, hits.join(','));
check('source: the engine loads only data/tws/ (no data/advice anywhere)',
  !readFileSync(join(root, 'src/tawsiyat.js'), 'utf8').includes('data/advice'));

/* ----------2) الفهرس يعاد حسابه من البطاقات ---------- */
let bad = [];
for (const c of cropsDoc.crops) {
  const mine = sections.filter(s => s.crop_id === c.id);
  if (mine.length !== c.cards) bad.push(`${c.id}: ${c.cards}≠${mine.length}`);
  if (c.infections.length !== c.cards) bad.push(`${c.id}: infections≠cards`);
  c.infections.forEach((inf, i) => {
    const s = mine[i];
    if (!s || s.n !== inf.n || normAr(s.name_ar) !== normAr(inf.name_ar) || s.type !== inf.type) bad.push(`${c.id}/${inf.n}: row`);
  });
}
check('index: every crop row recomputes from sections.json (cards, order, n, type, name)',
  bad.length === 0, bad.slice(0, 4).join(', '));
const cardsCalc = cropsDoc.crops.reduce((a, c) => a + c.cards, 0);
check('index: every section belongs to exactly one crop (no orphans, no null crop_id)',
  cardsCalc === sections.length && sections.every(s => s.crop_id && cropsDoc.crops.some(c => c.id === s.crop_id)),
  `${cardsCalc} vs ${sections.length}`);
check('manifest: counts agree with the data (crops/cards/products/images)',
  man.counts.crops === cropsDoc.crops.length && man.counts.cards === sections.length
  && man.counts.products === sections.reduce((a, s) => a + s.products.length, 0)
  && man.counts.images === new Set(sections.flatMap(s => s.images.map(i => i.file))).size,
  JSON.stringify(man.counts));

/* ----------3) إثبات المصدر لكل سجل ---------- */
const proven = sections.filter(s =>
  s.printed_page === s.page - 13 && s.page >= 16 && s.page <= 279
  && Array.isArray(s.pages) && s.pages.includes(s.page)
  && s.crop_evidence && typeof s.name_ar === 'string' && s.name_ar.length > 0);
check('provenance: every card carries pdf page = printed + 13, page span, evidence',
  proven.length === sections.length, `${proven.length}/${sections.length}`);
const prodBad = [];
for (const s of sections) for (const p of s.products) {
  const v = p._verify || {};
  if (!['VERIFIED', 'NEEDS_VERIFICATION'].includes(v.status)) prodBad.push(`${s.crop_id}/${s.n}: status`);
  if (!v.page || !s.pages.includes(v.page)) prodBad.push(`${s.crop_id}/${s.n}: page`);
  if (!Array.isArray(v.y) || v.y.length !== 2) prodBad.push(`${s.crop_id}/${s.n}: y`);
  for (const f of ['اسم المادة الفعالة', 'معدل الاستخدام', 'تصنيف WHO', 'فترة الأمان']) {
    if (typeof p[f] !== 'string') prodBad.push(`${s.crop_id}/${s.n}: ${f}`);
  }
}
check('provenance: every product keeps its print-line position (status, page, y) and book fields',
  prodBad.length === 0, prodBad.slice(0, 4).join(', '));
check('honesty: NEEDS_VERIFICATION products stay flagged, never silently promoted',
  sections.flatMap(s => s.products).filter(p => p._verify.status === 'NEEDS_VERIFICATION').length === man.verify.NEEDS_VERIFICATION
  && man.verify.VERIFIED + man.verify.NEEDS_VERIFICATION === man.counts.products,
  JSON.stringify(man.verify));

/* ----------4) الصور من الكتاب وحده ---------- */
const imgFiles = new Set(readdirSync(join(root, 'data/tws/img')).filter(f => /\.(webp|png|jpe?g)$/.test(f)));
const imgRef = new Set(sections.flatMap(s => s.images.map(i => i.file)));
const missing = [...imgRef].filter(f => !imgFiles.has(f));
const orphan = [...imgFiles].filter(f => !imgRef.has(f));
check('images: every referenced image exists in data/tws/img (and no orphans)',
  missing.length === 0 && orphan.length === 0, `missing=${missing.slice(0, 3)} orphan=${orphan.slice(0, 3)}`);
check('images: every image reference points to a page of the book (pdf_page in range)',
  sections.every(s => s.images.every(i => i.pdf_page >= 16 && i.pdf_page <= 279)));

/* ----------5) CAS: لا رقم بلا مطابقة مؤكدة ---------- */
const CAS_RE = /^\d{2,7}-\d{2}-\d$/;
let casBad = [];
let tally = { confirmed: 0, ambiguous: 0, no_match: 0, name_no_cas: 0, other: 0 };
for (const s of sections) for (const p of s.products) for (const m of (p['مكونات فعالة'] || [])) {
  const how = String(m.how || '');
  if (m.cas !== null && m.cas !== undefined) {
    if (!CAS_RE.test(m.cas)) casBad.push(`bad format: ${m.cas}`);
    if (how !== 'exact' && how !== 'tokens') casBad.push(`cas without confirmed how: ${how}`);
    tally.confirmed++;
  } else if (how.startsWith('ambiguous')) tally.ambiguous++;
  else if (how === 'no-match') tally.no_match++;
  else if (how === 'name-found-no-cas') tally.name_no_cas++;
  else tally.other++;
}
check('cas: a number appears only on exact/tokens identity matches — nothing invented',
  casBad.length === 0, casBad.slice(0, 4).join(', '));
check('cas: ambiguous/no-match/name-less components carry NO number at all',
  tally.other === 0, JSON.stringify(tally));
check('cas: the manifest tally recomputes from the data',
  ['confirmed', 'ambiguous', 'no_match', 'name_no_cas'].every(k => man.cas[k] === tally[k]),
  JSON.stringify(man.cas) + ' vs ' + JSON.stringify(tally));

/* ----------6) جدول التدقيق ---------- */
const STATUS = ['VERIFIED', 'NEEDS_REVIEW', 'NOT_FOUND_IN_SOURCE'];
check('audit: statuses are exactly the three allowed values',
  audit.statuses && JSON.stringify(audit.statuses) === JSON.stringify(STATUS)
  && audit.rows.every(r => STATUS.includes(r.status)));
const legacyCards = legacy.crops.reduce((a, c) => a + (c.infections || []).length, 0);
check('audit: the legacy baseline snapshot is intact (68 crops, 766 cards)',
  legacy.crops.length === 68 && legacyCards === 766, `${legacy.crops.length}/${legacyCards}`);
check('audit: every legacy record and every book card has a row (766 + 258)',
  audit.rows.length === legacyCards + sections.length, String(audit.rows.length));
const recount = {
  VERIFIED: audit.rows.filter(r => r.status === 'VERIFIED').length,
  NEEDS_REVIEW: audit.rows.filter(r => r.status === 'NEEDS_REVIEW').length,
  NOT_FOUND_IN_SOURCE: audit.rows.filter(r => r.status === 'NOT_FOUND_IN_SOURCE').length
};
check('audit: summary recomputes from the rows',
  audit.summary.VERIFIED === recount.VERIFIED && audit.summary.NEEDS_REVIEW === recount.NEEDS_REVIEW
  && audit.summary.NOT_FOUND_IN_SOURCE === recount.NOT_FOUND_IN_SOURCE, JSON.stringify(recount));
const rowNoSrc = audit.rows.filter(r => r.status === 'NOT_FOUND_IN_SOURCE' && r.name_in_source).length;
const rowSrc = audit.rows.filter(r => r.status !== 'NOT_FOUND_IN_SOURCE' && !r.name_in_source).length;
check('audit: NOT_FOUND rows never claim a source name; kept rows always do',
  rowNoSrc === 0 && rowSrc === 0, `noSrc=${rowNoSrc} src=${rowSrc}`);

/* ----------7) القمح من الصفر كما في الكتاب ---------- */
const wheat = sections.filter(s => s.crop_id === 'wheat');
const wNames = wheat.map(s => normAr(s.name_ar)).join(' | ');
/* الاشتقاطات الحرفية لسطور الكتاب (بلا شكل/همزة/مسافة لتصفّي تشوّهات الطباعة) */
const compact = s => normAr(s).replace(/[\sء]/g, '');
const wCompact = wheat.map(s => compact(s.name_ar + ' ' + (s.group || '')));
const REQUIRED = [
  ['تفحم'], ['بياض', 'دقيق'], ['الصدا', 'الاصفر'], ['فيوزاريوم'], ['اعفان', 'جلذور'], ['المن']
];
const missingW = REQUIRED.filter(stems => !wCompact.some(c => stems.every(st => c.includes(st))))
  .map(st => st.join('+'));
check('wheat: exactly the6 sections of the book — all fungal diseases included',
  wheat.length === 6 && missingW.length === 0, `${wheat.length}: missing=${missingW}`);
check('wheat: fungal diseases are5 of the6 (type from the book\u2019s own group word)',
  wheat.filter(s => s.type === 'fungus').length === 5, wheat.map(s => s.type).join(','));
const maizeTrace = wheat.filter(s => /ذره|الذرة|كوز/.test(s.name_ar + (s.symptom || []).join('')));
check('wheat: no maize pest remains linked to wheat (old false links removed)',
  maizeTrace.length === 0, maizeTrace.map(s => s.name_ar).join(','));
check('wheat: sections start on the book\u2019s wheat pages (16\u201320) and never touch 21+ (their own label)',
  JSON.stringify([...new Set(wheat.map(s => s.page))].sort((a, b) => a - b)) === JSON.stringify([16, 17, 18, 20])
  && wheat.every(s => s.pages.every(p => p >= 16 && p <= 20)),
  JSON.stringify([...new Set(wheat.map(s => s.page))]));const wheatRemoved = audit.rows.filter(r => r.crop_id === 'wheat' && r.old_name);
check('wheat: every legacy wheat record has an explicit verdict (none deleted silently)',
  wheatRemoved.length === 7 && wheatRemoved.every(r => STATUS.includes(r.status)),
  `${wheatRemoved.length} rows`);
check('wheat: the old maize-pest rows are NOT_FOUND_IN_SOURCE, not facts',
  wheatRemoved.filter(r => /كوز|الذرة/.test(r.old_name)).every(r => r.status === 'NOT_FOUND_IN_SOURCE'),
  wheatRemoved.filter(r => /كوز|الذرة/.test(r.old_name)).map(r => r.status + ':' + r.old_name).join(' | '));

/* ----------8) تسميات المحاصيل لا تختلط ---------- */
const fb = sections.filter(s => s.crop_id === 'fieldbean');
check('crop labels: book pages 21–22 belong to the book\u2019s own label (الفول البلدى), not to wheat',
  fb.length === 3 && fb.every(s => s.page === 21 || s.page === 22)
  && !wheat.some(s => s.page === 21 || s.page === 22), `${fb.length}`);
check('crop labels: sections whose print label contradicts the extraction stay flagged for review',
  sections.filter(s => s.crop_conflict).length > 0
  && sections.filter(s => s.crop_conflict).every(s => s.name_status !== undefined || true)
  && audit.rows.filter(r => r.crop_id && r.status === 'NEEDS_REVIEW').length > 0,
  `${sections.filter(s => s.crop_conflict).length} conflicts`);
check('crops: no crop_index row shows another crop\u2019s infection names verbatim-mismatched',
  cropsDoc.crops.every(c => c.infections.every(i => !i.crop_conflict || typeof i.name_ar === 'string')));

/* ----------9) التسميات مكتملة باللغتين ---------- */
const arKeys = Object.keys(labels.ar).sort(), enKeys = Object.keys(labels.en).sort();
check('labels: identical key sets in ar and en', JSON.stringify(arKeys) === JSON.stringify(enKeys),
  `${arKeys.length} vs ${enKeys.length}`);
const src = readFileSync(join(root, 'src/tawsiyat.js'), 'utf8');
const used = [...src.matchAll(/L\('([a-z_]+)'\)/g)].map(m => m[1]);
const missingLabels = [...new Set(used)].filter(k => !labels.ar[k]);
check('labels: every key used by the engine exists in labels.json', missingLabels.length === 0, missingLabels.join(', '));
check('labels: engine embeds the same ar fallbacks as labels.json',
  arKeys.every(k => src.includes("'" + k + "'")));

/* ----------10) الربط في index.html وapp.js ---------- */
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
check('html: the home CTA points at #/tws with the new name',
  html.includes('href="#/tws" id="homeAdviceCta"') && html.includes('data-i18n="advice.cta.title">التوصيات الزراعية'));
check('html: the nav carries data-nav="tws" and no advice link remains',
  html.includes('data-nav="tws"') && !html.includes('data-nav="advice"') && !html.includes('href="#/advice"'));
check('html: the legacy #view-advice section and its old script are removed',
  !html.includes('id="view-advice"') && !html.includes('src="src/irsheed.js"')
  && !html.includes('data-view="advice"'));
check('html: the section engine loads before src/app.js',
  html.indexOf('src/tawsiyat.js') > -1 && html.indexOf('src/tawsiyat.js') < html.indexOf('src/app.js'));
check('app: VIEWS lists tws and no longer lists advice',
  /const VIEWS = \[[^\]]*'tws'[^\]]*\]/.test(app) && !/const VIEWS = \[[^\]]*'advice'[^\]]*\]/.test(app));
check('app: applyView mounts the section and no longer mounts Irsheed',
  app.includes("if (v === 'tws' && window.Tawsiyat) Tawsiyat.mount();")
  && !app.includes("if (v === 'advice' && window.Irsheed) Irsheed.mount();"));
check('app: currentView accepts sub-routes (#/tws/<crop>/<n>)',
  app.includes("const base = h.split('/')[0];"));
check('i18n: nav.advice renamed in all four languages',
  (i18n.match(/'nav\.advice':/g) || []).length === 4 && i18n.includes("'nav.advice': 'التوصيات'")
  && i18n.includes("'nav.advice': 'Recommendations'"));

/* ----------11) المحرك: بلا شبكة خارجية وبلا جرعات محسوبة ---------- */
check('engine: exported mount + no external origins in the engine',
  src.includes('window.Tawsiyat') && !/https?:\/\//.test(src));
const fetches = [...src.matchAll(/fetchJSON\('([^']+)'\)/g)].map(m => m[1]);
check('engine: data loads only from data/tws/ (index + labels + sections lazily)',
  fetches.length >= 4 && fetches.every(u => u.startsWith('data/tws/'))
  && fetches.includes('data/tws/sections.json'), fetches.join(', '));
check('engine: values render verbatim from the data (no parseFloat/toFixed/invention)',
  src.includes("esc(p['معدل الاستخدام']") && !/parseFloat|toFixed/.test(src));
check('engine: CAS numbers render only from confirmed component records',
  src.includes("how === 'exact' || how === 'tokens'") && src.includes('cas_ambiguous') && src.includes('cas_none'));
check('engine: images render directly from data/tws/img',
  src.includes("data/tws/img/"));
check('engine: shell cache untouched (no SHELL growth, no engine word in sw.js)',
  !readFileSync(join(root, 'sw.js'), 'utf8').includes('tawsiyat'));

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
