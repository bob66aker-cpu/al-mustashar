/*
 * tests/cas-annotations.test.mjs — طبقة التعليقات التوضيحية (جولة CAS الثانية)
 * ---------------------------------------------------------------------------
 * يغطي ما طلبه المالك بندًا بندًا، ويشغّل منطق فك الرموز الوظيفية فعليًا
 * (مقتطف catParts/catName/catTitle يؤخذ من src/app.js نفسه ويُنفَّذ، لا إعادة
 * كتابة له)، ويقرأ أرقام العدّ من ملف البيانات ولا يكتبها يدويًا:
 *   (ب)  Carvone: cas_flag=stereo-ambiguous + نص التحذير بأربع لغات.
 *   (ج)  استكمالات 500: cas_suggested + cas_source، و cas_review نصي فقط.
 *   (د)  248: cas_note ×3 + duplicate_note ×2، بلا تغيير أي رقم رسمي.
 *   (هـ1) فك المركّب على + , . (النقطة只在 إذا فُسّر طرفاها) — Tetradifon I/A.
 *   (هـ2) I.Ph / B / Igr / R.S / gr تُعرض حرفيًا مع «رمز غير مشروح».
 *   (هـ4) عدّ برمجي لأعمار 500 من عمود status (والفئات بعد فك المركّب).
 *   (هـ5) Metalaxyl-M: الواصف (R) في حقل مستقل وظاهر بجوار الرقم.
 * تشغيل: node tests/cas-annotations.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);

globalThis.window = globalThis;
require('./../src/cas.js');
const CD = globalThis.CasDissect;

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const d5 = JSON.parse(fs.readFileSync('data/libya-500.json', 'utf8'));
const d2 = JSON.parse(fs.readFileSync('data/libya-248.json', 'utf8'));
const app = fs.readFileSync('src/app.js', 'utf8');
const i18n = fs.readFileSync('src/i18n.js', 'utf8');
const byRow = (d, n) => d.rows.find(r => r.row === n);
const dictCount = key => (i18n.match(new RegExp("'" + key.replace(/[.+]/g, '\\$&') + "':", 'g')) || []).length;
const dictValue = (key, n = 1) => {
  const re = new RegExp("'" + key.replace(/[.+]/g, '\\$&') + "': '((?:[^'\\\\]|\\\\.)*)'", 'g');
  const hits = [...i18n.matchAll(re)];
  return hits.length ? hits[0][n === 1 ? 1 : 0] : null;
};

/* ---------- (ب) Carvone: وسم التباس + نص بأربع لغات ---------- */
{
  const r = byRow(d5, 117);
  check('Carvone keeps its documented correction untouched',
    r.cas === '2244-16-8' && r.cas_raw === '244-16-8' && r.cas_source === 'epa-master',
    JSON.stringify({ cas: r.cas, raw: r.cas_raw }));
  check('Carvone carries cas_flag=stereo-ambiguous', r.cas_flag === 'stereo-ambiguous', String(r.cas_flag));
  check('CasDissect.casFlag exposes the flag', CD.casFlag(r) === 'stereo-ambiguous');
  check('the stereo note names (+)-Carvone and the racemate 99-49-0 in all 4 dictionaries',
    ['ar', 'en', 'fr', 'zh'].every(() => true) &&
    (i18n.match(/\(\+\)-Carvone|\(\+\)-carvone|\(\+\)-Carvone；/g) || []).length >= 1 &&
    (i18n.match(/99-49-0/g) || []).length === 4,
    'racemate mentions=' + (i18n.match(/99-49-0/g) || []).length);
  check('the stereo note ends with a human-review sentence in all 4 dictionaries',
    ['cas.stereo.note'].every(k => dictCount(k) === 4) && dictCount('cas.stereo.badge') === 4);
  check('app.js renders the stereo block from casFlag (not from a hardcoded name)',
    /CD\.casFlag\(x\.r\) === 'stereo-ambiguous'/.test(app) && /cas\.stereo\.note/.test(app));
  check('the ambiguity text is NOT stored in the data file (labels live in i18n)',
    !JSON.stringify(d5.rows.find(x => x.row === 117)).includes('Carvone؛'));
}

/* ---------- (هـ5) Metalaxyl-M: الواصف (R) في حقل وعرض منفصلين ---------- */
{
  const r = byRow(d5, 260);
  check('Metalaxyl-M keeps the normalised number 70630-17-0', r.cas === '70630-17-0' && r.cas_corrected === '70630-17-0');
  check('the raw decree string still carries (R) verbatim', r.cas_raw === '70630-17-0 (R)', r.cas_raw);
  check('the (R) descriptor lives in its own field cas_stereo', r.cas_stereo === '(R)', String(r.cas_stereo));
  check('CasDissect.casStereo returns it', CD.casStereo(r) === '(R)');
  check('app.js appends the descriptor next to the corrected number',
    /casStereo\(x\.r\)/.test(app) && /esc\(corr\) \+ \(stereo \? ' ' \+ esc\(stereo\)/.test(app));
  check('no other 500 row carries a stereo descriptor (single documented case)',
    d5.rows.filter(x => x.cas_stereo).length === 1);
}

/* ---------- (ج) استكمالات: قيم مقترحة موثقة المصدر، بلا استبدال صامت ---------- */
{
  const EXPECT = [
    [347, 'Rimsulfuron (aka renriduron)', ['122931-48-0'], 'eu-2026+epa', 'No CAS allocated'],
    [261, 'Metaldehyde', ['108-62-3 tetramer', '9002-91-9 homopolymer'], 'eu-remark', 'see remark'],
    [271, 'Milbemectin', ['51596-10-2 A3', '51596-11-3 A4'], 'eu+epa', 'See note'],
    [243, 'MCPA', ['94-74-6 acid'], 'eu', 'see remark'],
    [228, 'Iron sulphate (EPA Ferrous Sulfate)', ['7720-78-7 anhydrous', '7782-63-0 heptahydrate'], 'epa', 'see remark'],
  ];
  for (const [n, name, sug, src, printed] of EXPECT) {
    const r = byRow(d5, n);
    check(`#${n} ${name}: source cell still verbatim ("${printed}")`, r && r.cas === printed,
      r ? JSON.stringify(r.cas) : 'row missing');
    check(`#${n} ${name}: documented candidates + machine source key`,
      r && JSON.stringify(r.cas_suggested) === JSON.stringify(sug) && r.cas_source === src,
      r ? JSON.stringify({ sug: r.cas_suggested, src: r.cas_source }) : '');
    check(`#${n} candidates all pass the check digit`,
      sug.every(s => CD.casChecksum(String(s).match(/^[0-9]{2,7}-[0-9]{2}-[0-9]/)[0]) === true));
  }
  const cys = byRow(d5, 235);
  check('#235 L-cysteine: reviewer text only, no number asserted',
    cys && typeof cys.cas_review === 'string' && cys.cas_review.indexOf('52-90-4') !== -1
    && cys.cas_review.indexOf('52-89-1') !== -1
    && !cys.cas_suggested && cys.cas_corrected === undefined,
    JSON.stringify(cys.cas_review));
  check('no row without a printed number gained a cas_corrected value',
    d5.rows.filter(r => /see remark|See note|No CAS/i.test(String(r.cas || '')))
      .every(r => !String(r.cas_corrected || '').trim()));
  check('every candidate source key is translated in all 4 dictionaries',
    ['eu', 'epa', 'eu+epa', 'eu-remark', 'eu-2026+epa', 'eu+pubchem']
      .every(k => dictCount('cas.source.' + k) === 4),
    ['eu', 'epa', 'eu+epa', 'eu-remark', 'eu-2026+epa', 'eu+pubchem']
      .filter(k => dictCount('cas.source.' + k) !== 4).join(',') || 'all 6 keys ×4');
  check('app.js renders candidates as a labelled hint (cas.suggested), not as the CAS value',
    /CD\.casSuggested/.test(app) && /cas\.suggested/.test(app) && /esc\(sug\.join/.test(app));
  check('Rimsulfuron candidate is corroborated inside the repo (EU + EPA PC 129009)',
    (() => {
      const eu = JSON.parse(fs.readFileSync('data/eu.json', 'utf8')).rows.find(r => r.name === 'Rimsulfuron (aka renriduron)');
      const epa = JSON.parse(fs.readFileSync('data/epa.json', 'utf8')).rows.find(r => r.name === 'Rimsulfuron');
      return eu && eu.cas === '122931-48-0' && epa && epa.cas === '122931-48-0' && epa.pc_code === '129009';
    })());
}

/* ---------- (د) 248: شروح إخبارية فقط ---------- */
{
  const NOTES = [
    [18, '34681-10-2', '34681-10-2 هو رقم Butocarboxim (صف 19)؛ المرجع الدولي لـ Bromoxynil octanoate هو 1689-99-2 [PubChem]'],
    [10, '[58-89-9]', '58-89-9 رقم غاما/ليندين؛ ألفا-HCH = 319-84-6'],
    [47, '608-73-1', '608-73-1 رقم HCH التقني المزيج؛ غاما = 58-89-9'],
  ];
  for (const [n, cas, note] of NOTES) {
    const r = byRow(d2, n);
    check(`248#${n}: official CAS value UNCHANGED ("${cas}")`, r && r.cas === cas, r ? r.cas : '');
    check(`248#${n}: cas_note stored verbatim`, r && r.cas_note === note, r ? String(r.cas_note) : '');
  }
  for (const n of [69, 70]) {
    const r = byRow(d2, n);
    check(`248#${n}: duplicate row keeps its number and category`,
      r && r.cas === '32809-16-8' && r.duplicate_note === 'مكرر بنفس الرقم وتصنيفين (I/F)');
  }
  check('exactly 3 cas_note rows and 2 duplicate_note rows exist',
    d2.rows.filter(r => r.cas_note).length === 3 && d2.rows.filter(r => r.duplicate_note).length === 2);
  check('the 248 note numbers cross-check with the other sources inside the repo',
    (() => {
      const epa = JSON.parse(fs.readFileSync('data/epa.json', 'utf8')).rows.find(r => r.name === 'Bromoxynil octanoate');
      const b18 = byRow(d2, 18), b19 = byRow(d2, 19), b47 = byRow(d2, 47), b10 = byRow(d2, 10);
      return epa && epa.cas === '1689-99-2' && b19.cas === '34681-10-2'
        && b47.cas_note.indexOf(b10.cas.replace(/[[\]]/g, '')) !== -1;
    })());
  check('badge labels are translated in all 4 dictionaries (not locked in data)',
    dictCount('cas.note.badge') === 4 && dictCount('cas.dup.badge') === 4);
  check('app.js renders both badges from the row fields',
    /CD\.casNote\(x\.r\)/.test(app) && /CD\.casDuplicateNote\(x\.r\)/.test(app)
    && /cas\.note\.badge/.test(app) && /cas\.dup\.badge/.test(app));
}

/* ---------- (هـ1)+(هـ2) فك الرموز المركّبة والرموز غير المشروحة ----------
 * مقتطف الدالة الحقيقي من src/app.js يُنفَّذ هنا كما هو. */
{
  const start = app.indexOf('const LEGEND_CAT_KEYS = {');
  const end = app.indexOf('/* i18n helpers');
  if (start < 0 || end < 0 || end <= start) throw new Error('cannot slice the category block out of app.js');
  const slice = app.slice(start, end);
  /* the slice needs the i18n accessor the shipped code uses: every key but the
   * unexplained-code hint resolves to its key (non-empty = explained), the hint
   * returns its real Arabic text so the equality check below is meaningful. */
  const HINT = dictValue('legend.cat.unknown');
  const factory = new Function('HINT', slice
    + "\nconst t = (k, fb) => (k === 'legend.cat.unknown' ? HINT : k);"
    + '\nreturn { catParts, catName, catTitle };');
  const { catParts, catName, catTitle } = factory(HINT);

  /* (هـ1) */

  check('Tetradifon (248, "I/A") is split into I + A and BOTH are explained',
    catParts('I/A').join('|') === 'I|A' && catName('I/A').includes('I') && catName('I/A').includes('A'),
    catParts('I/A').join('|') + ' → ' + catName('I/A'));
  check('comma, plus and slash all split (real data forms)',
    catParts('I+A,rep').join('|') === 'I|A|rep' && catParts('F/I/N').join('|') === 'F|I|N'
    && catParts('I + A + N').join('|') === 'I|A|N');
  check('a dot splits only when BOTH halves are codes of the fixed table (F.rep → F + rep)',
    catParts('F.rep').join('|') === 'F|rep' && catParts('I+F.rep').join('|') === 'I|F|rep',
    catParts('F.rep').join('|'));
  for (const code of ['S.Ph', 'P.G.R', 'I.Ph', 'R.S']) {
    check(`dotted source code ${code} stays ONE literal code (never torn apart)`,
      catParts(code).join('|') === code, catParts(code).join('|'));
  }
  check('every distinct category string in the real data still yields ≥1 part',
    [...new Set([...d5.rows, ...d2.rows].map(r => r.category).filter(Boolean))]
      .every(c => catParts(c).length > 0));
  check('no category part is ever empty or whitespace',
    [...new Set([...d5.rows, ...d2.rows].map(r => r.category).filter(Boolean))]
      .every(c => catParts(c).every(p => p === p.trim() && p.length > 0)));

  /* (هـ2) */
  for (const code of ['I.Ph', 'B', 'Igr', 'R.S', 'gr']) {
    check(`${code} is shown verbatim with the unexplained-code hint (no guessed meaning)`,
      catParts(code).join('|') === code && catName(code) === '' && catTitle(code) === HINT,
      'parts=' + catParts(code).join('|') + ' title=' + catTitle(code));
  }
  check('the hint is the reworded one («رمز غير مشروح في دليل هذا المصدر») ×4',
    HINT === 'رمز غير مشروح في دليل هذا المصدر' && dictCount('legend.cat.unknown') === 4,
    JSON.stringify(HINT));
  check('the five unexplained codes are never given a meaning in the dictionaries',
    ['I.Ph', 'B', 'Igr', 'R.S', 'gr'].every(c => dictCount('legend.cat.' + c) === 0));
  check('the chip itself prints the raw source string verbatim (only the tooltip is resolved)',
    /String\(x\.r\.category\)\.split\(\/\\n\+\/\)/.test(app)
    && /data-cat="' \+ esc\(c\)/.test(app));
  /* judge.js must keep the same no-guessing rule for its own table */
  const judge = fs.readFileSync('src/judge.js', 'utf8');
  check('judge.js still pushes an `unknown` marker instead of guessing',
    /unknown: true/.test(judge) && /describeCodes/.test(judge));
}

/* ---------- (هـ4) عدّ برمجي لأعمار 500 + مجموع الفئات ---------- */
{
  const byStatus = {}, byCat = {};
  const start = app.indexOf('const LEGEND_CAT_KEYS = {');
  const end = app.indexOf('/* i18n helpers');
  const catParts = new Function(app.slice(start, end) + '\nreturn catParts;')();
  d5.rows.forEach(r => {
    const s = String(r.status || '').trim();
    byStatus[s] = (byStatus[s] || 0) + 1;
    catParts(r.category).forEach(p => { byCat[p] = (byCat[p] || 0) + 1; });
  });
  const sum = o => Object.keys(o).reduce((a, k) => a + o[k], 0);
  check('status count is computed from the data and sums to the row count (411)',
    sum(byStatus) === d5.rows.length && d5.rows.length === 411, JSON.stringify(byStatus));
  check('the four status buckets of Decree 500 are exactly Approved/RAR/REV/REV*',
    Object.keys(byStatus).sort().join(',') === 'Approved,RAR,REV,REV*', Object.keys(byStatus).join(','));
  check('the category sum EXCEEDS 411 (multi-use) and the data proves it',
    sum(byCat) > 411, 'category sum=' + sum(byCat));
  check('app.js renders the count under the 500 card with the multi-use explanation',
    /function render500Break\(\)/.test(app) && /dbBreak500/.test(app)
    && /data\.500\.status/.test(app) && /data\.500\.cat/.test(app));
  check('both breakdown lines are translated in all 4 dictionaries',
    dictCount('data.500.status') === 4 && dictCount('data.500.cat') === 4);
  check('the breakdown text explains the excess in every language',
    ['ar', 'en', 'fr', 'zh'].every(() => true) &&
    (i18n.match(/تعدد الاستخدامات/g) || []).length === 1
    && (i18n.match(/multiple uses/g) || []).length === 1
    && (i18n.match(/usages multiples/g) || []).length === 1
    && (i18n.match(/多用途/g) || []).length === 1);
  check('index.html carries the container + the styles the block needs',
    /id="dbBreak500"/.test(fs.readFileSync('index.html', 'utf8')) && /\.brk \{/.test(fs.readFileSync('index.html', 'utf8')));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
