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

/* D43: the explained/declared split is no longer a table in app.js — it lives
 * in data/reference.json per section, which is what the display now reads. The
 * literal list below stays the PINNED value: if the reference ever changes its
 * unexplained set, this gate says so instead of following it silently. */
const REF = JSON.parse(readFileSync('data/reference.json', 'utf8'));
const refText = (section, key, lang) => {
  const e = REF.sections[section].texts[key];
  return e ? e[lang] : '';
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
/* the codes AND the printed shapes the 500 section of the reference records */
const keys = Object.keys(REF.sections.libya500.categories).flatMap(k => {
  const e = REF.sections.libya500.categories[k];
  return [k].concat(e.shapes || []);
});
const nonExplainedKeys = Object.keys(REF.sections.libya500.categories)
  .filter(k => !REF.sections.libya500.categories[k].explained).sort();
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
check('the reference explains exactly the codes the old app.js table did',
      JSON.stringify(nonExplainedKeys) === JSON.stringify(['B', 'F.rep', 'I.Ph', 'Igr', 'R.S', 'gr']),
      JSON.stringify(nonExplainedKeys));
check('the reference declares exactly the unexplained codes this gate declared',
      JSON.stringify([...REF.sections.libya500.unexplainedCodes].sort()) === JSON.stringify(['B', 'I.Ph', 'Igr', 'R.S', 'gr'])
      && JSON.stringify([...REF.sections.libya248.unexplainedCodes].sort()) === JSON.stringify(['FM', 'FM\n[I', 'FM]\n[I', 'Mi', 'RP', 'R]', 'T']),
      JSON.stringify([REF.sections.libya500.unexplainedCodes, REF.sections.libya248.unexplainedCodes]));
check('V is explained in the 500 legend table, not on the unexplained list',
      keys.includes('V') && !DECLARED_UNEXPLAINED.includes('V'),
      'keys has V=' + keys.includes('V') + ' / declared has V=' + DECLARED_UNEXPLAINED.includes('V'));
check('the legend wording for V is the guide wording, verbatim',
      refText('libya500', 'legend.cat.V', 'ar') === 'فيروسات أو كائنات دقيقة مكافحة'
      && !/'legend\.cat\.V':/.test(i18n),
      'the reference carries the source sentence; i18n keeps no second copy');
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
/* a code the guide does NOT explain IS in the reference — recorded explicitly
   as unexplained — and carries no meaning, so the lookup resolves it to the
   hint. What must never happen is a meaning appearing for it. */
check('a code no source explains resolves to NOTHING (no invented reading)',
      ['Igr', 'R.S'].every(c => {
        const e = REF.sections.libya500.categories[c];
        return e && e.explained === false && !e.i18nKey && !e.meaning
          && REF.sections.libya500.unexplainedCodes.includes(c);
      })
      && ['Mi', 'RP'].every(c => !REF.sections.libya500.categories[c])
      /* V is the converse case: the guide DOES explain it, so it must resolve */
      && foldKeys.has(fold('V')) && REF.sections.libya500.categories.V.explained === true);

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
      /if \(catFold\(shapes\[j\]\) === fold\) return e;/.test(app)
      && /return t\(refCatKey\(sec, parts\[0\]\), ''\);/.test(app),
      'the lookup must go through the reference shapes with the fold, not a local table');
check('no threshold or accept constant was touched by this round',
      !/catFold[^\n]*\b(THRESH|MIN_|MAX_|ACCEPT|CONF)\b/.test(app));
check('judge.js folds the same way and adds no new invented code',
      /fold\(k\) === fold\(token\)/.test(judge)
      && /'P\.G\.R':/.test(judge) && /'Rep':/.test(judge));

/* ---- 7) the four dictionaries all carry the meanings used ---- */
const langBlocks = [...i18n.matchAll(/^\s+(ar|en|fr|zh)\s*:\s*\{/gm)].map(m => m[1]);
check('all four dictionaries are present', langBlocks.length === 4, langBlocks.join(','));
for (const key of ['legend.cat.S.ph', 'legend.cat.PGR', 'legend.cat.rep', 'legend.cat.V']) {
  check(key + ' is defined in all four reference languages',
        ['ar', 'en', 'fr', 'zh'].every(l => !!refText('libya500', key, l))
        && (i18n.match(new RegExp("'" + key.replace(/\./g, '\\.') + "':", 'g')) || []).length === 0,
        'the reference is the only copy');
}
/* the no-guessing hint itself stays display chrome in the dictionaries */
for (const key of ['legend.cat.unknown', 'legend.cat.unknownNamed']) {
  const n = (i18n.match(new RegExp("'" + key.replace(/\./g, '\\.') + "':", 'g')) || []).length;
  check(key + ' (the hint) is defined in all four dictionaries', n === 4, 'found ' + n);
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
