/*
 * tests/cat-legend-gate.test.mjs — فيدباك 6: رموز التصنيف والتقرير
 * ---------------------------------------------------------------------------
 * البلاغ الثابت: كل رمز من قياس القياس إما مشروح أو موقف علنه
 * بصيغة‌ — لا ثالث ولا مادً.
 *
 * قاعدة: قبل الإصلاح كان المفتاح «S.ph» والبيانات تكتب «S.Ph»
 * والمطابقة كانت حرفية‌ ⇒ فيلا رموز «غير مشروح» تعرض للمزارع والدليل يشرحها.
 * الإصلاح: طي الفاصل عند بحث الطلب، لا عتبات ولا منطق قبول‌ — S.Ph = S Ph = SPh.
 *
 * ماذا يقيس: يقرأ رموز التصنيف سطراً سطراً من data/libya-500.json
 * و libya-248.json بالقواعدات القائمة للفصل (، / + والنقطة في حالة معيّنة) ويقاعل كل رمز:
 *   · مشروح — يُوجد شرحه في الواجهة حالياً بالمعنى
 *   · غير مشروح — ملا فتح واحد أسرعها في data/
 *
 * قاعدة الإصلاح: لا \ ثالث أًضع. أي رمز غير مفهوم وجد ولا مذكور × · · الواجهة تقول نفسها والمرارع «رمز غير مشروح».
 */
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  << ' + extra));
  ok ? pass++ : fail++;
};

/* the declared list: codes no source guide explains. Kept here so the gate
 * fails if the DATA grows a new unexplained code without a decision. */
const DECLARED_UNEXPLAINED = [
  /* libya-500 */
  'B', 'I.Ph', 'Igr', 'R.S', 'gr',
  /* libya-248 */
  'FM', 'FM\n[I', 'FM]\n[I', 'Mi', 'RP', 'R]', 'T'
];

const app = readFileSync('src/app.js', 'utf8');
const i18n = readFileSync('src/i18n.js', 'utf8');
const judge = readFileSync('src/judge.js', 'utf8');

/* ---- the split rule, read out of the source so it cannot drift ---- */
const HARD = /[\/,+]/;
const keys = [...app.match(/const LEGEND_CAT_KEYS = \{([\s\S]*?)\};/)[1]
  .matchAll(/'([^']+)':\s*'legend/g)].map(m => m[1]);
const fold = x => String(x == null ? '' : x).toLowerCase().replace(/[.\s]/g, '');
const foldKeys = new Set(keys.map(fold));
function catParts(code) {
  const c = String(code || '').trim();
  if (!c) return [];
  return c.split(HARD).map(p => p.trim()).filter(Boolean)
    .flatMap(p => p.includes('.') && p.split('.').every(q => keys.includes(q.trim()))
      ? p.split('.').map(q => q.trim()).filter(Boolean)
      : [p]);
}

/* ---- 1) the whole measured set, from data/ ---- */
const counts = new Map();
for (const f of ['data/libya-500.json', 'data/libya-248.json']) {
  for (const row of JSON.parse(readFileSync(f, 'utf8')).rows) {
    for (const t of catParts(row.category)) counts.set(t, (counts.get(t) || 0) + 1);
  }
}
check('the measurement is not empty', counts.size > 0, String(counts.size));

/* the raw 248 rows, kept aside: the two guides differ, and that difference is
 * part of the claim (the 500 guide explains V, the 248 guide does not). */
const rows248 = JSON.parse(readFileSync('data/libya-248.json', 'utf8')).rows;

/* ---- 2) every code is explained OR declared: no third state ---- */
const unexplained = [...counts.keys()].filter(t => !(keys.includes(t) || foldKeys.has(fold(t))));
const undeclared = unexplained.filter(t => !DECLARED_UNEXPLAINED.includes(t));
const vanished = DECLARED_UNEXPLAINED.filter(t => !counts.has(t));
check('every category code is explained or on the declared list (no third state)',
      undeclared.length === 0, 'undeclared: ' + JSON.stringify(undeclared));
check('the declared list still matches the data (nothing silently explained away)',
      vanished.length === 0, 'declared but no longer in data: ' + JSON.stringify(vanished));

/* ---- 3) the reported failure is the one that was fixed ---- */
check('S.Ph is explained and S.Ph is the code 34 rows actually carry',
      foldKeys.has(fold('S.Ph')) && counts.has('S.Ph') && counts.get('S.Ph') === 34,
      'S.Ph rows=' + counts.get('S.Ph') + ' folded table has it=' + foldKeys.has(fold('S.Ph')));

/* ---- 3b) V is explained, because the 500 GUIDE explains it ----
 * Correction of the previous round: V was on the unexplained list on the
 * strength of judge.js's own note saying it came from the digital file. That
 * was self-judgement, not the source. The 500 guide's summary table carries
 * the row «V | Viruses / Microbials | فيروسات أو كائنات دقيقة مكافحة»
 * and 6 rows of data/libya-500.json actually carry the code. What makes a
 * code explained is the source guide, never our own note about the source. */
check('V is explained in the 500 legend table, not on the unexplained list',
      keys.includes('V') && !DECLARED_UNEXPLAINED.includes('V'),
      'keys has V=' + keys.includes('V') + ' / declared has V=' + DECLARED_UNEXPLAINED.includes('V'));
check('the legend wording for V is the guide wording, verbatim',
      /'legend\.cat\.V': 'فيروسات أو كائنات دقيقة مكافحة'/.test(i18n),
      'the ar dictionary must carry the source sentence, not a paraphrase');
check('V is no longer annotated as absent from the official guide',
      !/تعريف الملف الرقمي/.test(judge) && !/vnote/.test(i18n + app));
check('V is explained in judge.js CODES too, and 6 rows really carry it',
      /'V':\s*\{ en: 'Viruses \/ Microbials', ar: 'فيروسات أو كائنات دقيقة مكافحة' \}/.test(judge)
      && counts.get('V') === 6, 'V rows=' + counts.get('V'));
check('the 248 guide defines no V, so no V key is claimed for it',
      !rows248.some(r => String(r.category || '').split(/[\/,+]/).map(x => x.trim()).includes('V')));

/* ---- 4) the separator rule, all three forms ---- */
for (const form of ['S.Ph', 'S Ph', 'SPh']) {
  check('the separator form ' + form + ' resolves to the same meaning',
        foldKeys.has(fold(form)), form);
}
/* and it does NOT invent a meaning for a code no guide explains */
check('a code no source explains still fails the lookup (no invented reading)',
      !foldKeys.has(fold('Igr')) && !foldKeys.has(fold('Mi')) && !foldKeys.has(fold('R.S'))
      /* V is the converse case: the guide DOES explain it, so it must resolve */
      && foldKeys.has(fold('V')));

/* ---- 5) splitting is untouched: S.Ph is NOT torn into S + Ph ---- */
const sPhParts = catParts('S.Ph');
check('S.Ph stays one literal code, not S + Ph',
      sPhParts.length === 1 && sPhParts[0] === 'S.Ph', JSON.stringify(sPhParts));
/* while a genuinely compound dotted code still splits, as before */
const fRepParts = catParts('F.rep');
check('F.rep still splits into its two real codes',
      fRepParts.length === 2 && fRepParts[0] === 'F' && fRepParts[1] === 'rep',
      JSON.stringify(fRepParts));

/* ---- 6) the normalisation is at the dictionary lookup only ---- */
check('the fold is applied at the legend lookup, nowhere else',
      /LEGEND_CAT_KEYS\[parts\[0\]\] \|\| CAT_FOLD_KEYS\[catFold\(parts\[0\]\)\]/.test(app),
      'the catName lookup must fall back to the folded table');
check('no threshold or accept constant was touched by this round',
      !/catFold[^\n]*\b(THRESH|MIN_|MAX_|ACCEPT|CONF)\b/.test(app));
check('judge.js folds the same way and adds no new invented code',
      /fold\(k\) === fold\(token\)/.test(judge)
      && /'P\.G\.R':/.test(judge) && /'Rep':/.test(judge));

/* ---- 7) the four dictionaries all carry the meanings used ---- */
const langBlocks = [...i18n.matchAll(/^\s+(ar|en|fr|zh)\s*:\s*\{/gm)].map(m => m[1]);
check('all four dictionaries are present', langBlocks.length === 4, langBlocks.join(','));
for (const key of ['legend.cat.S.ph', 'legend.cat.PGR', 'legend.cat.rep',
                   'legend.cat.V', 'legend.cat.unknown']) {
  const n = (i18n.match(new RegExp("'" + key.replace(/\./g, '\\.') + "':", 'g')) || []).length;
  check(key + ' is defined in all four dictionaries', n === 4, 'found ' + n);
}
/* the added spellings borrow an existing key — they add no new translation */
check('P.G.R and Rep borrow existing meanings and add no new translation string',
      !/legend\.cat\.(P\.G\.R|Rep)'/.test(i18n));

/* ---- 8) the documented source defect stays as the data has it ---- */
const row500 = JSON.parse(readFileSync('data/libya-500.json', 'utf8')).rows
  .find(r => r.cas === '74-85-1');
check('Ethylene keeps its data value: category I with status RAR (source defect, not corrected)',
      row500 && row500.category.trim() === 'I' && row500.status === 'RAR',
      row500 ? row500.category + '/' + row500.status : 'row not found');

console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
