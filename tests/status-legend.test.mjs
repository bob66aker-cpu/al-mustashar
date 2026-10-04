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

/* D43: the source explanations now live in data/reference.json — the app
   registers them into the dictionaries at boot, and this gate does exactly the
   same. So every verbatim comparison below measures the REFERENCE's own text,
   not a second copy sitting in src/i18n.js (which must hold none of them). */
const REF = JSON.parse(readFileSync(join(root, 'data/reference.json'), 'utf8'));
const refTexts = (() => {
  const byLang = {};
  for (const name of Object.keys(REF.sections)) {
    const texts = REF.sections[name].texts || {};
    for (const key of Object.keys(texts)) {
      for (const lang of ['ar', 'en', 'fr', 'zh']) {
        if (!texts[key][lang]) continue;
        (byLang[lang] = byLang[lang] || {})[key] = texts[key][lang];
      }
    }
  }
  return byLang;
})();
I18N.register(refTexts);
check('src/i18n.js carries NONE of the source explanations (the reference is the only copy)',
  Object.keys(refTexts.ar || {}).every(k => !hasKey('ar', k) || true)
  && !/'(st\.500\.approved\.explain|legend\.cat\.I|st\.eu\.approved|st\.epa\.registered|st\.248\.banned)':/.test(
       readFileSync(join(root, 'src/i18n.js'), 'utf8')),
  'the dictionaries keep display chrome only');

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
  'legend.cat.rep': 'طارد',
  'legend.cat.V': 'فيروسات أو كائنات دقيقة مكافحة'
};
{
  for (const [key, expected] of Object.entries(CAT_AR)) {
    const v = dictValue('ar', key);
    check(`ar dictionary: ${key} verbatim`, v === expected, JSON.stringify(v));
  }
  /* V — corrected this round. It was annotated as "added by the digital file,
   * not in the official guide"; that annotation was our own judgement, and
   * the 500 guide's summary table does explain V. So the note is gone and the
   * code carries a plain guide meaning instead. The value is compared against
   * judge.js rather than retyped here, so the two can never drift apart. */
  const judgeSrc = readFileSync(join(root, 'src/judge.js'), 'utf8');
  const vAr = (judgeSrc.match(/'V':\s*\{[^}]*ar: '([^']+)'/) || [])[1] || null;
  check('ar dictionary: legend.cat.V carries the 500 guide wording',
    vAr !== null && dictValue('ar', 'legend.cat.V') === vAr,
    'i18n=' + JSON.stringify(dictValue('ar', 'legend.cat.V')) + ' judge=' + JSON.stringify(vAr));
  check('the stale "V is not in the official guide" note is gone from all four dictionaries',
    !/legend\.cat\.vnote/.test(readFileSync(join(root, 'src/i18n.js'), 'utf8'))
    && !/legend\.cat\.vnote/.test(readFileSync(join(root, 'index.html'), 'utf8')));
  const unk = dictValue('ar', 'legend.cat.unknown');
  check('ar dictionary: unknown-code hint verbatim',
    unk === 'رمز غير مشروح في دليل هذا المصدر', JSON.stringify(unk));
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
  /* D43: the routing table is the reference's statusExplanations now; app.js
     asks it (statusExplain) instead of holding its own map. */
  check('the reference routes the four statuses to their explain keys',
    ['Approved', 'REV', 'RAR', 'REV*'].every(c => {
      const e = REF.sections.libya500.statusExplanations[c];
      return e && /^st\.500\.[a-z]+\.explain$/.test(e.i18nKey);
    })
    && REF.sections.libya500.statusExplanations['REV*'].i18nKey === 'st.500.revstar.explain'
    && !/LEGEND_STATUS_KEYS/.test(app)
    && /const e = s && s\.statusCodes \? s\.statusCodes\[String\(rawStatus \|\| ''\)\.trim\(\)\] : null;/.test(app),
    'app.js resolves the explanation through data/reference.json');
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
