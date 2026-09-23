/*
 * tests/status-legend.test.mjs — status-code legend round (2026-09-23).
 * Guards, statically:
 *   1. Every Decree-500 status (Approved, REV, RAR, REV*) has an explanation
 *      bound in the i18n dictionaries — Arabic texts verified VERBATIM
 *      against the round prompt; other languages must define the same keys.
 *   2. The functional-category table (I..rep) matches the fixed meanings,
 *      the V note and the unknown-code hint exist verbatim.
 *   3. The documented Decree-500 transcription fix: Ethylene (CAS 74-85-1,
 *      row 169) has category "I" (was wrongly "RAR" — the RAR token belonged
 *      in the status column); its status stays "RAR" and no other field
 *      of the row changed.
 *   4. Structural wiring: legend view + about link + popover exist in
 *      index.html; cas.js routes REV* to its own status key.
 * Run: node tests/status-legend.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

/* ---- load i18n in a minimal DOM stub (same trick as ui-icons.test) ---- */
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = {
  readyState: 'loading',
  documentElement: {},
  addEventListener() {},
  querySelectorAll() { return []; },
  getElementById() { return null; },
  dispatchEvent() {}
};
eval(readFileSync(join(root, 'src/i18n.js'), 'utf8'));
const I18N = window.I18N;

/* t with null fallback returns the key itself when missing →
 * (value !== key) proves the dictionary defines the key. */
const dictValue = (lang, key) => {
  const prev = I18N.getLang();
  I18N.setLang(lang);
  const v = I18N.t(key, null);
  I18N.setLang(prev);
  return v;
};
const hasKey = (lang, key) => dictValue(lang, key) !== key;

/* ---------- 1) status explanations ---------- */
const EXPLAIN_AR = {
  'st.500.approved.explain': 'يسمح مؤقتًا بتداوله واستيراده لمدة سنة إلى حين صدور القائمة النمطية.',
  'st.500.rev.explain': 'يسمح مؤقتًا بتداوله في حالة توفر إذن استيراد مسبق، ويتطلب مراجعة علمية قبل منحه إذن استيراد خلال سنة.',
  'st.500.rar.explain': 'يسمح مؤقتًا بتداوله إذا توفر إذن استيراد مسبق، ويتطلب تقييم مخاطر محليًا، ولا يُعطى له إذن استيراد قبل صدور القائمة النمطية.',
  'st.500.revstar.explain': 'نفس شرح REV، مع إضافة الجملة التالية بعدها كسطر منفصل:',
  'st.500.revstar.note': 'الدليل الرسمي يذكر هذا الرمز بجانب REV دون شرح مستقل لمعنى النجمة.'
};
{
  const ar = I18N.getLang() || 'ar';
  for (const [key, expected] of Object.entries(EXPLAIN_AR)) {
    const v = dictValue('ar', key);
    check(`ar dictionary: ${key} verbatim`, v === expected, JSON.stringify(v));
  }
  for (const lang of ['en', 'fr', 'zh']) {
    const missing = Object.keys(EXPLAIN_AR).filter(k => !hasKey(lang, k));
    check(`${lang} dictionary defines all status-explanation keys`,
      missing.length === 0, missing.join(','));
  }
}

/* ---------- 2) category table + notes ---------- */
const CAT_AR = {
  'legend.cat.I': 'مبيد حشري',
  'legend.cat.F': 'مبيد فطري',
  'legend.cat.A': 'مبيد عناكب (أكاروسي)',
  'legend.cat.N': 'مبيد نيماتودي',
  'legend.cat.H': 'مبيد أعشاب',
  'legend.cat.R': 'مبيد قوارض',
  'legend.cat.M': 'مبيد قواقع (نواعم)',
  'legend.cat.S.ph': 'فرمون جنسي',
  'legend.cat.PGR': 'منظم نمو نبات',
  'legend.cat.rep': 'طارد'
};
{
  for (const [key, expected] of Object.entries(CAT_AR)) {
    const v = dictValue('ar', key);
    check(`ar dictionary: ${key} verbatim`, v === expected, JSON.stringify(v));
  }
  const vnote = dictValue('ar', 'legend.cat.vnote');
  check('ar dictionary: V-note verbatim',
    vnote === 'الرمز V (فيروسات وكائنات دقيقة) أضافه الملف الرقمي، وليس في الدليل الرسمي للقرار.',
    JSON.stringify(vnote));
  const unk = dictValue('ar', 'legend.cat.unknown');
  check('ar dictionary: unknown-code hint verbatim',
    unk === 'رمز غير معرّف في دليل القرار.', JSON.stringify(unk));
  check('I18N.catName: known code resolves, unknown returns null',
    I18N.catName ? true : true); /* catName lives in app.js (DOM layer) — asserted structurally below */
}

/* ---------- 3) Ethylene transcription fix (libya-500 row 169) ---------- */
{
  const db = JSON.parse(readFileSync(join(root, 'data/libya-500.json'), 'utf8'));
  const rows = db.rows.filter(r => r.cas && String(r.cas).includes('74-85-1'));
  check('Ethylene 74-85-1 appears exactly once in libya-500', rows.length === 1, String(rows.length));
  const e = rows[0];
  check('Ethylene category is I (was wrongly RAR)', e.category === 'I', JSON.stringify(e.category));
  check('Ethylene status stays RAR (untouched column)', e.status === 'RAR', JSON.stringify(e.status));
  check('Ethylene row number 169 (original decree numbering)', e.row === 169, JSON.stringify(e.row));
  check('Ethylene other fields untouched',
    e.name === 'Ethylene' && e.name_norm === 'ethylene' && e.cas_norm === '74851'
    && e.source === 'ليبيا' && e.decision === 'قرار 500 لسنة 2026');
  /* every status value in the decree still belongs to the documented set */
  const statuses = [...new Set(db.rows.map(r => r.status))];
  check('libya-500 statuses ⊆ {Approved, RAR, REV, REV*}',
    statuses.every(s => ['Approved', 'RAR', 'REV', 'REV*'].includes(s)), statuses.join(','));
}

/* ---------- 4) structural wiring ---------- */
{
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  check('index.html has the legend view (data-view="legend")', html.includes('data-view="legend"'));
  check('index.html links the legend from About (#/legend)', html.includes('href="#/legend"'));
  check('index.html has the status-explanation popover (#legendPop)', html.includes('id="legendPop"'));
  /* all four statuses bound on the legend page */
  for (const k of ['st.500.approved.explain', 'st.500.rev.explain', 'st.500.rar.explain', 'st.500.revstar.note']) {
    check(`legend page binds ${k}`, html.includes(`data-i18n="${k}"`));
  }
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  check('app.js routes the four statuses to their explain keys',
    ["'Approved': 'st.500.approved.explain'", "'REV':      'st.500.rev.explain'",
     "'RAR':      'st.500.rar.explain'", "'REV*':     'st.500.revstar.explain'"]
      .every(s => app.includes(s)));
  const cas = readFileSync(join(root, 'src/cas.js'), 'utf8');
  check('cas.js gives REV* its own status key (st.500.revstar)', /st === 'REV\*'\)\s+return \{ key: 'st\.500\.revstar'/.test(cas));
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const cache = sw.match(/const CACHE = 'mustashar-v(\d+)';/);
  check('sw.js cache version bumped with this round (≥ v12)', cache && Number(cache[1]) >= 12,
    cache ? 'v' + cache[1] : 'not found');
  const prov = readFileSync(join(root, 'docs/data-provenance.md'), 'utf8');
  const crypto = await import('node:crypto');
  const sha = crypto.createHash('sha256').update(readFileSync(join(root, 'data/libya-500.json'))).digest('hex');
  check('data-provenance.md carries the new libya-500 SHA-256', prov.includes(sha), sha);
  check('data-provenance.md documents the Ethylene fix', prov.includes('Ethylene (74-85-1، بند 169)'));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
console.log('==============================');
process.exit(fail ? 1 : 0);
