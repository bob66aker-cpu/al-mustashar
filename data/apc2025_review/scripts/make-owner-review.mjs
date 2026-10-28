#!/usr/bin/env node
/**
 * make-owner-review.mjs — يولّد مخرجات مراجعة المالك من نتائج التحقق المحفوظة.
 *
 * المدخلات (كلها محفوظة داخل data/apc2025_review/):
 *   verification/cas-verification.json   نتائج فتح صفحات PPDB واستعلامات PubChem
 *   verification/cache/identity-by-cas.json  هوية كل رقم عبر PubChem (استعلام بالرقم)
 *   verification/cache/autocomplete.json     اقتراحات PubChem للأسماء الناقصة
 *   extracted/data/actives.json          273 مادة (غير معدّل)
 *   extracted/data/crops/*.json          البطاقات (لاستخراج الصفحات وفصل الحشائش)
 *   reports/nv-02..nv-06*.csv            ملفات التدقيق الأصلية (غير معدّلة)
 *   reports/schema-compatibility.md      لاستخراج صفوف ⚠ والمحاصيل بلا مقابل
 *
 * المخرجات (بلا BOM في الكود، يضيفه عند الكتابة):
 *   reports/owner-review-cas.csv
 *   reports/owner-review-missing-fields.csv
 *   reports/owner-review-biologicals.csv
 *   reports/owner-review-report-ar.md
 *   verification/summary-stats.json
 *
 * لا يكتب في extracted/ ولا في بيانات التطبيق (data/tws, src, sw.js ...).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const VER = path.join(ROOT, 'verification');
const REPR = path.join(ROOT, 'reports');
const TODAY = '2026-10-28';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const casVer = readJson(path.join(VER, 'cas-verification.json')).results;
const identity = readJson(path.join(VER, 'cache/identity-by-cas.json'));
const autocomplete = readJson(path.join(VER, 'cache/autocomplete.json'));
const actives = readJson(path.join(ROOT, 'extracted/data/actives.json')).actives;

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const csvEsc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const toCsv = (head, rows) => '\uFEFF' + [head, ...rows].map((r) => r.map(csvEsc).join(',')).join('\r\n') + '\r\n';

// ---------- صفحات الطباعة لكل مادة فعالة + بطاقات الحشائش ----------
const pagesByActive = new Map();
const weedCards = [];
const cropsDir = path.join(ROOT, 'extracted/data/crops');
for (const f of fs.readdirSync(cropsDir).filter((x) => x.endsWith('.json'))) {
  const crop = readJson(path.join(cropsDir, f));
  for (const card of crop.cards || []) {
    const pages = (card.printed_pages || []).join(' + ');
    if (card.part === 'weeds') weedCards.push({ card_id: card.id, crop_id: card.crop_id, pest: card.pest_name_ar, pages });
    for (const t of card.tables || []) {
      for (const r of t.recommendations || []) {
        for (const a of r.actives || []) {
          const k = norm(a.name_en || '');
          if (!k) continue;
          if (!pagesByActive.has(k)) pagesByActive.set(k, new Set());
          for (const p of card.printed_pages || []) pagesByActive.get(k).add(p);
        }
      }
    }
  }
}
const pagesOf = (name) => {
  const set = pagesByActive.get(norm(name));
  return set ? [...set].sort((a, b) => a - b).join(' + ') : '';
};

// ---------- تصنيفات ----------
const BIO_RE = /^(Bacillus|Trichoderma|Beauveria|Metarhizium|Verticillium|Pseudomonas|Paecilomyces|Lecanicillium|Isaria|Cordyceps|Acremonium|Clonostachys|Coniothyrium|Ampelomyces|Serratia|Xanthomonas|Yarrowia|Rhizobium|Azotobacter|Nostoc)\b/i;
const PROBABLE_BIO = ['Jasmine oil', 'Citronella oil', 'Jojoba oil', 'Orange oil', 'Streptomycin sulfate'];
const idTitle = (cas) => {
  const e = identity[cas];
  const p = e?.body?.PropertyTable?.Properties?.[0];
  return p?.Title || null;
};
const PPDB_SRC = 'PPDB — Aeru، جامعة هيرتفوردشاير';
const PC_SRC = 'PubChem (NIH/NLM)';

const rows = casVer.map((r) => {
  const pkg = r.package_cas;
  const ppdbEq = r.ppdb.matched && r.ppdb.cas && r.ppdb.cas === pkg;
  const ppdbDiff = r.ppdb.matched && r.ppdb.cas && r.ppdb.cas !== pkg;
  const pcHit = pkg && r.pubchem.rn_union.includes(pkg);
  const bio = BIO_RE.test(r.name_en);
  const probableBio = PROBABLE_BIO.includes(r.name_en);
  const identityT = pkg ? idTitle(pkg) : null;
  let status, source, link, reason, confidence;
  if (!pkg) {
    status = bio ? 'بلا رقم في الحزمة — مادة حيوية (الجدول د)' : 'بلا رقم في الحزمة — مادة غير حيوية (الجدول ج)';
    source = r.ppdb.matched ? PPDB_SRC : 'PPDB + PubChem (بلا نتيجة)';
    link = r.ppdb.url || 'https://pubchem.ncbi.nlm.nih.gov/';
    reason = r.pubchem.queries.map((q) => q.note).filter(Boolean)[0] || 'لم يُعثر على رقم في المصادر التي فُحصت';
    confidence = 'غير محسوم';
  } else if (ppdbEq && pcHit) {
    status = 'مثبت — مصدران مستقلان (PPDB + PubChem)';
    source = `${PPDB_SRC} + ${PC_SRC}`;
    link = r.ppdb.url;
    reason = `رقم الحزمة = رقم CAS المعروض في صفحة PPDB (${r.ppdb.cas_name || r.ppdb.title})، والرقم يظهر ضمن قائمة RN التي يرجعها PubChem للاسم`;
    confidence = 'عالية';
  } else if (ppdbEq && !pcHit) {
    status = 'مثبت — PPDB (صفحة مادة مفتوحة)؛ PubChem بلا سجل بالاسم';
    source = PPDB_SRC;
    link = r.ppdb.url;
    reason = `رقم الحزمة = رقم CAS المعروض في صفحة PPDB (${r.ppdb.cas_name || r.ppdb.title})؛ الاستعلام بالاسم في PubChem لم يرجع سجلاً (خليط/زيت/بوليمر أو اسم غير مفهرس)`;
    confidence = 'متوسطة';
  } else if (ppdbDiff) {
    status = 'تعارض — رقم الحزمة ≠ رقم صفحة PPDB (الجدول ج)';
    source = `${PPDB_SRC} + ${PC_SRC}`;
    link = r.ppdb.url;
    const tPkg = pkg ? idTitle(pkg) : null;
    const tPpdb = idTitle(r.ppdb.cas) || r.ppdb.cas_name;
    reason = `الحزمة: ${pkg} (${tPkg || 'بلا عنوان في PubChem'}) · PPDB: ${r.ppdb.cas} (${tPpdb || '-'}) · قائمة RN للاسم في PubChem: ${r.pubchem.rn_union.join(' / ') || 'بلا نتيجة'}`;
    confidence = 'بحاجة إلى قرار';
  } else if (pcHit) {
    status = 'متوافق — PubChem فقط (مصدر مساعد واحد، بلا صفحة PPDB)';
    source = PC_SRC;
    link = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(r.pubchem.queries[0]?.q || r.name_en)}/xrefs/RN/JSON`;
    reason = 'الرقم يظهر ضمن قائمة RN للاسم في PubChem، ولم يُعثر على مدخل مطابق في فهرس PPDB — مساعد وحده لا يكفي للحسم عند وجود التباس';
    confidence = 'مساندة (غير محسومة نهائياً)';
  } else if (identityT) {
    status = 'مرشح — هوية بالرقم في PubChem دون مطابقة اسم صريحة (الجدول ج)';
    source = PC_SRC;
    link = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${pkg}/property/Title,IUPACName/JSON`;
    reason = `الاستعلام بالرقم ${pkg} في PubChem يرجع: «${identityT}» — تطابق الصيغة مع اسم الحزمة «${r.name_en}» يحتاج إقراراً`;
    confidence = 'بحاجة إلى قرار';
  } else {
    status = 'لم يُعثر على تأكيد في المصادر المفتوحة (الجدول ج)';
    source = 'PPDB + PubChem (بلا نتيجة)';
    link = 'https://pubchem.ncbi.nlm.nih.gov/';
    reason = `الرقم ${pkg} في الحزمة بلا تأكيد: بلا مدخل PPDB مطابق، والاستعلام بالاسم والرقم في PubChem 404`;
    confidence = 'غير محسوم';
  }
  return { r, status, source, link, reason, confidence, bio, probableBio, ppdbEq, ppdbDiff, pcHit, identityT };
});

const confirmed = rows.filter((x) => x.r.package_cas && (x.ppdbEq || (x.ppdbEq === false && false)) && (x.ppdbEq) && !x.ppdbDiff && x.confidence !== 'بحاجة إلى قرار' && (x.ppdbEq));
// تجميع صريح لتجنّب الغموض:
const bucket = { confirmed: [], conflict: [], pcOnly: [], identityOnly: [], notFound: [], noPkg: [] };
for (const x of rows) {
  if (!x.r.package_cas) bucket.noPkg.push(x);
  else if (x.ppdbDiff) bucket.conflict.push(x);
  else if (x.ppdbEq && (x.pcHit || true) && x.confidence !== 'بحاجة إلى قرار' && (x.ppdbEq)) bucket.confirmed.push(x);
  else if (x.pcHit) bucket.pcOnly.push(x);
  else if (x.identityT) bucket.identityOnly.push(x);
  else bucket.notFound.push(x);
}
// ملاحظات هوية إضافية للمطابقات عبر مسار CAS (اختلاف صيغة الاسم)
const identityNotes = new Map();
for (const x of rows) {
  if (x.r.ppdb.via && x.r.ppdb.via.startsWith('cas') && x.ppdbEq) {
    const t = x.r.ppdb.title || '';
    if (norm(t) !== norm(x.r.name_en)) identityNotes.set(x.r.name_en, `مطابقة عبر رقم CAS في فهرس PPDB بمدخل اسم مختلف: «${t}» — راجع صيغة/نوع المادة`);
  }
}

/* ================= CSV 1: owner-review-cas.csv ================= */
const casHead = [
  'الاسم_الأصلي_كما_في_الحزمة', 'الاسم_المطبوع_في_الكتاب', 'الاسم_القياسي_المطابق', 'رقم_CAS_في_الحزمة',
  'رقم_CAS_المثبت_من_المصدر', 'حالة_الإثبات', 'المصدر_الناشر', 'رابط_مباشر', 'تاريخ_التحقق',
  'درجة_الموثوقية', 'سبب_القبول_أو_الرفض', 'ملاحظة_اختلاف_الشكل_أو_الملح', 'الصفحات_المطبوعة', 'عدد_صفوف_المصدر',
];
const casRows = rows.map((x) => [
  x.r.name_en,
  (x.r.name_as_printed || []).join(' | '),
  x.r.ppdb.title || x.r.name_en,
  x.r.package_cas || '',
  x.ppdbEq ? x.r.ppdb.cas : (x.ppdbDiff ? x.r.ppdb.cas : (x.pcHit ? x.r.package_cas : '')),
  x.status,
  x.source,
  x.link,
  TODAY,
  x.confidence,
  x.reason,
  identityNotes.get(x.r.name_en) || '',
  pagesOf(x.r.name_en) || pagesOf((x.r.name_as_printed || [])[0] || ''),
  x.r.n_rows,
]);
fs.writeFileSync(path.join(REPR, 'owner-review-cas.csv'), toCsv(casHead, casRows));

/* ================= CSV 2: owner-review-missing-fields.csv ================= */
function parseCSV(s) {
  const out = []; let cur = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(f); f = ''; }
    else if (c === '\n') { cur.push(f); out.push(cur); cur = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || cur.length) { cur.push(f); out.push(cur); }
  return out;
}
const mfHead = ['معرف_البطاقة', 'المحصول', 'صفحة_المصدر', 'اسم_الحقل', 'القيمة_الأصلية', 'وصف_المشكلة', 'المصدر_الداعم', 'الإجراء_المطلوب_من_المالك', 'ملف_المصدر'];
const mfRows = [];
const addNv = (file, mapRow) => {
  const txt = fs.readFileSync(path.join(REPR, file), 'utf8');
  const [, ...data] = parseCSV(txt.replace(/^\uFEFF/, ''));
  for (const r of data) if (r.length > 1) mfRows.push(mapRow(r));
};
const hdr = (file) => parseCSV(fs.readFileSync(path.join(REPR, file), 'utf8').replace(/^\uFEFF/, ''))[0];
{
  const h = hdr('nv-03-missing-conflicts.csv');
  const i = Object.fromEntries(h.map((k, n) => [k, n]));
  addNv('nv-03-missing-conflicts.csv', (r) => [
    r[i.card_id], r[i.crop_id], r[i.printed_pages], r[i.field], r[i.actives], r[i.issue],
    'حزمة التدقيق (recommendations_audit.xlsx — ورقة missing_conflicts) مقابل كتاب APC 2025',
    'مراجعة يدوية بالصفحة المطبوعة وحسم القيمة — لا تُعدَّل بيانات تلقائياً', 'nv-03-missing-conflicts.csv',
  ]);
}
{
  const h = hdr('nv-02-uncertain-rows.csv');
  const i = Object.fromEntries(h.map((k, n) => [k, n]));
  addNv('nv-02-uncertain-rows.csv', (r) => [
    r[i.card_id] || '—', r[i.crop_id] || '—', r[i.printed_pages], `قراءة غير مؤكدة (${r[i.level]})`,
    r[i.actives] || '', r[i.reason], 'حزمة التدقيق (ورقة uncertain) — قراءة من صورة PDF',
    'فتح صفحة الكتاب والتأكد يدوياً', 'nv-02-uncertain-rows.csv',
  ]);
}
{
  const h = hdr('nv-04-dup-cards.csv');
  const i = Object.fromEntries(h.map((k, n) => [k, n]));
  addNv('nv-04-dup-cards.csv', (r) => [
    r[i.card_ids], r[i.crop_id], r[i.printed_pages], 'بطاقة مكررة مقترحة', `${r[i.n_cards]} بطاقات`,
    r[i.pest_ar], 'حزمة التدقيق (ورقة dup_cards)',
    'قرار: تكرار فعلي أم بطاقتان مختلفتان — لا يُحذف شيء تلقائياً', 'nv-04-dup-cards.csv',
  ]);
}
{
  const h = hdr('nv-05-spelling-review.csv');
  const i = Object.fromEntries(h.map((k, n) => [k, n]));
  addNv('nv-05-spelling-review.csv', (r) => [
    '—', '—', '', `هجاء/صياغة (${r[i.where]})`, r[i.original_in_book],
    `${r[i.reason]} — الاقتراح: «${r[i.suggested]}»`, 'حزمة التدقيق (ورقة spelling)',
    r[i.needs_human_review] === 'تأكيد سريع' ? 'تأكيد الاقتراح أو رفضه' : 'مراجعة بشرية', 'nv-05-spelling-review.csv',
  ]);
}
{
  const h = hdr('nv-06-dups-same-card.csv');
  const i = Object.fromEntries(h.map((k, n) => [k, n]));
  addNv('nv-06-dups-same-card.csv', (r) => [
    r[i.card_id], r[i.crop_id], r[i.printed_pages], 'صف مكرر مقترح داخل البطاقة',
    `${r[i.actives_and_c] || r[i.actives_and_conf] || r[i.actives_and_conc]} · ${r[i.formulation] || ''} · ${r[i.rate_text_ar] || ''} · PHI=${r[i.phi_days] || ''}`,
    `${r[i.pest_ar]} — مجموعة التكرار بحجم ${r[i.group_size]}`,
    'حزمة التدقيق (ورقة dups_same_card)',
    'قرار: تكرار تام (يدمج) أم خياران مختلفان (يبقون) — لا يُحذف تلقائياً', 'nv-06-dups-same-card.csv',
  ]);
}
// بطاقات الحشائش بلا مقابل في التطبيق (80)
for (const w of weedCards) mfRows.push([
  w.card_id, w.crop_id, w.pages, 'بطاقة فصل الحشائش بلا مقابل في التطبيق', w.pest,
  'التطبيق يغطي فصل الآفات فقط (258 بطاقة)؛ هذه البطاقة من فصل الحشائش (part=weeds) غير موجود في التطبيق',
  'حزمة APC 2025 + تقرير schema-compatibility.md §1',
  'قرار: بناء بطاقات الحشائش في التطبيق أو استثناء الفصل صراحة', 'extracted/data/crops/*.json',
]);
// صفوف تقاطع مرفوضة ⚠ من تقرير المخطط + المحاصيل بلا مقابل
const schemaMd = fs.readFileSync(path.join(REPR, 'schema-compatibility.md'), 'utf8');
for (const line of schemaMd.split('\n')) {
  if (!line.includes('⚠')) continue;
  const m = line.matchAll(/\|\s*([a-z0-9_]+)\s*\|\s*([a-z0-9_-]+)\s*\|\s*\d+\/\d+\s*⚠/g);
  for (const g of m) mfRows.push([
    '—', `${g[1]} ↔ ${g[2]}`, '', 'تقاطع معرّف محصول مرفوض ظاهرياً', `${g[1]} (تطبيق) ↔ ${g[2]} (حزمة)`,
    'تطابق صفحة واحدة فقط وبأسماء غير متوافقة ظاهرياً — تقاطع صدفة محتمل',
    'تقرير schema-compatibility.md §4', 'حسم: هل يقابل التطبيق هذا المحصول فعلاً أم لا', 'schema-compatibility.md',
  ]);
}
const cropNoAppLine = schemaMd.split('\n').find((l) => l.includes('بلا مقابل في التطبيق'));
if (cropNoAppLine) {
  const names = (cropNoAppLine.split(':').slice(1).join(':').match(/[a-z][a-z0-9-]+/g)) || [];
  for (const c of names) mfRows.push([
    '—', c, '', 'محصول الحزمة بلا معرّف مقابل في التطبيق', c,
    'محصول موجود في الحزمة ولا يقابله معرّف في data/twsmanifest الحالي',
    'تقرير schema-compatibility.md §4', 'قرار: إضافة المحصول للتطبيق أو استثناؤه', 'schema-compatibility.md',
  ]);
}
fs.writeFileSync(path.join(REPR, 'owner-review-missing-fields.csv'), toCsv(mfHead, mfRows));

/* ================= CSV 3: owner-review-biologicals.csv ================= */
const bioHead = ['الاسم_كما_طُبع', 'نوع_المادة_أو_الكائن', 'التصنيف', 'المصادر_التي_فُحصت', 'النتيجة', 'سبب_بقاء_CAS_فارغاً', 'الصفحات_المطبوعة', 'عدد_صفوف_المصدر', 'ما_يحتاج_مراجعة_المالك'];
const bioRows = [];
for (const x of rows.filter((y) => y.bio || y.probableBio)) {
  const isBio = x.bio;
  const sources = [];
  sources.push(`فهرس PPDB وصفحاته (${x.r.ppdb.matched ? `مطابقة: ${x.r.ppdb.title} — يعرض ${x.r.ppdb.cas}` : 'لا مدخل مطابق للاسم العام'})`);
  sources.push(`PubChem بالاسم: ${x.r.pubchem.queries.map((q) => q.note || `RN=${q.rn.join('/')}`).join(' · ') || '—'}`);
  if (x.r.package_cas) sources.push(`PubChem بالرقم: ${x.identityT ? `«${x.identityT}»` : '404 بلا CID'}`);
  let result, emptyReason, owner;
  if (x.r.package_cas) {
    result = `رقم في الحزمة: ${x.r.package_cas} — ${x.ppdbEq ? 'مطابق لصفحة PPDB' : x.ppdbDiff ? `PPDB يعرض ${x.r.ppdb.cas}` : 'بلا تأكيد خارجي'}`;
    emptyReason = '— (الحزمة تحوي رقماً)';
    owner = x.ppdbEq
      ? (isBio ? 'تحديد إن كان الرقم مناسباً للكائن/السلالة العامة في الكتاب أم لنوع فرعي محدد (PPDB يعرضه على صفحة نوع فرعي)' : 'تصنيف المادة: هل تُعدّ حيوية؟')
      : 'حسم التعارض/الإثبات';
  } else {
    result = 'لا رقم في الحزمة ولم يُعثر على رقم في المصادر المفتوحة';
    emptyReason = 'لم يُعثر على رقم — وهذا ليس دليلاً على أن CAS غير معيّن (لا يُستخدم NO_CAS_ASSIGNED بلا دليل صريح)';
    owner = isBio ? 'قرار المالك: هل يُترك فارغاً، أو يُبحث في CAS Registry/مراجع السلالات، أو يُسجَّل كائن بلا رقم' : 'تحديد التركيبة الفعلية للمادة من الكتاب ثم بحث رقم';
  }
  bioRows.push([
    (x.r.name_as_printed || []).join(' | ') || x.r.name_en,
    isBio ? (x.r.name_en.match(/\b(strain|subsp\.?|FZB\d+|MBI\s*\d+)\b/i) ? 'كائن دقيق (سلالة/نوع فرعي مذكور)' : 'كائن دقيق (اسم نوع عام)') : 'منتج مشتق حيائياً/نباتياً (محتمل)',
    isBio ? 'مؤكد حيوي' : 'محتمل حيوي — يحتاج قرار تصنيف',
    sources.join(' | '),
    result, emptyReason, pagesOf(x.r.name_en), x.r.n_rows, owner,
  ]);
}
// المواد بلا رقم وغير حيوية تُدرج هنا كذلك لتمييزها عن الجدول د
for (const x of bucket.noPkg.filter((y) => !y.bio && !y.probableBio)) {
  const ac = autocomplete[x.r.name_en] || {};
  const sugg = JSON.stringify(ac.body?.dictionary_terms?.compound || ac.body?.result?.comps || '').slice(0, 200);
  bioRows.push([
    (x.r.name_as_printed || []).join(' | ') || x.r.name_en,
    'مادة غير حيوية بلا رقم في الحزمة (خارج الجدول د)',
    'غير حيوية',
    `PPDB: ${x.r.ppdb.matched ? `مطابقة ${x.r.ppdb.title}` : 'لا مدخل'} | PubChem بالاسم: ${x.r.pubchem.queries.map((q) => q.note || q.rn.join('/')).join(' · ')} | اقتراحات autocomplete: ${sugg || '—'}`,
    x.pcHit ? `رقم مرشح من PubChem: ${x.r.package_cas || x.r.pubchem.rn_union.join('/')}` : 'لا رقم مثبت',
    x.r.package_cas ? '—' : 'الحزمة بلا رقم ولم يثبت بحث خارجي رقم مناسباً',
    pagesOf(x.r.name_en), x.r.n_rows,
    'قرار المالك في الجدول ج (CAS تحتاج مراجعة) — مدرجة هنا للتمييز فقط',
  ]);
}
fs.writeFileSync(path.join(REPR, 'owner-review-biologicals.csv'), toCsv(bioHead, bioRows));

/* ================= summary-stats ================= */
const stats = {
  generated: TODAY,
  total_actives: rows.length,
  confirmed: bucket.confirmed.length,
  conflict: bucket.conflict.length,
  pc_only: bucket.pcOnly.length,
  identity_only: bucket.identityOnly.length,
  not_found: bucket.notFound.length,
  no_pkg_cas: bucket.noPkg.length,
  no_cas_assigned_proven: 0,
  biological_confirmed: rows.filter((x) => x.bio).length,
  biological_probable: rows.filter((x) => x.probableBio).length,
  missing_fields_rows: mfRows.length,
  biologicals_csv_rows: bioRows.length,
  primary_source_note: 'CAS Common Chemistry API = 401 Unauthorized (2026-10-28)؛ EPA = 503؛ EU DB = واجهة تفاعلية بلا API ظاهر — صفر أرقام من مصدر أولي',
};
fs.writeFileSync(path.join(VER, 'summary-stats.json'), JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats, null, 1));
console.log('conflicts:', bucket.conflict.map((x) => x.r.name_en).join(' | '));
console.log('pcOnly:', bucket.pcOnly.map((x) => x.r.name_en).join(' | '));
console.log('identityOnly:', bucket.identityOnly.map((x) => x.r.name_en).join(' | '));
console.log('notFound:', bucket.notFound.map((x) => x.r.name_en).join(' | '));
console.log('noPkg:', bucket.noPkg.map((x) => x.r.name_en).join(' | '));
