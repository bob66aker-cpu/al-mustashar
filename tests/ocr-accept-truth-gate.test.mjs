/* tests/ocr-accept-truth-gate.test.mjs — بوابة «القبول الخاطئ» لكل عينة
 * ---------------------------------------------------------------------------
 * المرحلة صفر من الجولة الليلية: قبل تشغيل أي اختبار قبول، لكل عينة في
 * خط الأساس معياران مكتوبان في tests/fixtures/labels/night-gold-standard.csv:
 *   1) النص الصحيح المتوقع — مصدره إما شكوى المالك بنفسه (فيدباك 2/3)،
 *      أو «غير معروف» حين لم يملأ المالك ورقة الحقيقة المرجعية؛
 *   2) شرط القبول الخاطئ الخاص بهذه العينة.
 * هذا الملف يحوّل المعيارين إلى فحوص قابلة للتنفيذ:
 *
 *   (أ) لكل مادة مؤكَّدة اليوم: صفّها في السجلات الليبية يجب أن يطابق ما
 *       يقوله data/ بالضبط (حظر / RAR / Approved / لا صفّ Libyan إطلاقاً)،
 *       ورقم CAS المعروض يجب أن يكون رقمها برقم تحقّق صحيح.
 *   (ب) وضع المزارع (pro=false) لا يُرجع إلا المصادر الليبية — وهذا ما يجعل
 *       «الحظر» معقولاً للمزارع أصلاً.
 *   (ج) ساق OCR اختيارية: إن مُرّر مسار خط أساس كوسيط ثانٍ قورنت العينة
 *       بسطرها: لا عينة تنتقل من «بلا نتيجة» إلى «نتيجة»، ولا مادة تتغيّر.
 *       أي فرق = قبول خاطئ جديد، وهو سبب إيقاف الجولة.
 *
 * ما لا يُقاس هنا بصراحة: صحة المادة في الصور التي لم يملأ المالك الحقيقة
 * المرجعية عنها. لا يُختلق لها صحيح ولا خطأ — تُقاس بأمانها لا بدقتها.
 * التشغيل: node tests/ocr-accept-truth-gate.test.mjs [baseline.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);
globalThis.window = globalThis;
require('./../src/search-core.js');
const SC = globalThis.SearchCore;

let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? ' :: ' + d : '')); };

/* ---------- the written standard ---------- */
const CSV = 'tests/fixtures/labels/night-gold-standard.csv';
const rows = fs.readFileSync(CSV, 'utf8').split('\n')
  .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('n,image'))
  .map(l => {
    const m = l.match(/^(\d+),("[^"]*"|[^,]*),("[^"]*"|[^,]*),("[^"]*"|[^,]*),("[^"]*"|[^,]*),("[^"]*"|[^,]*),("[^"]*"|[^,]*)$/);
    if (!m) throw new Error('gold-standard row not parseable: ' + l);
    const un = s => s.replace(/^"|"$/g, '');
    return { n: +m[1], image: un(m[2]), truth: un(m[3]), src: un(m[4]), confirmed: un(m[5]), libya: un(m[6]) };
  });
const ownerRows = rows.filter(r => r.src.startsWith('owner')).map(r => r.image).sort();
check('gold standard: 17 baseline samples + 1 documented substitute', rows.length === 18, String(rows.length));
check('gold standard: owner-attested truth exists for exactly the two reported samples',
  ownerRows.join('|') === ['images (2).jpg', 'images.jpg', 'SUBSTITUTE-ground-aluminium-sulphate.png'].sort().join('|'),
  ownerRows.join(','));
check('gold standard: no sample claims a truth nobody attested',
  rows.every(r => r.truth === '' || r.src.startsWith('owner')), 'a truth without an owner source');

/* ---------- the databases ---------- */
const KEYS = ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled'];
const dbs = {};
for (const k of KEYS) dbs[k] = JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows;
const search = SC.buildSearch(KEYS.map(k => ({ key: k, rows: dbs[k] })));
const LYBYA = ['libya-248', 'libya-500'];
const libyaStatus = (name) => {
  const hits = [];
  for (const k of LYBYA) for (const r of dbs[k]) {
    if (String(r.name || '').trim().toLowerCase() === name.trim().toLowerCase())
      hits.push(k === 'libya-248' ? 'ban' : String(r.status || ''));
  }
  return hits.length ? hits.join('+') : 'none';
};
const casOk = (cas) => {
  const d = String(cas || '').replace(/[^0-9]/g, '');
  if (d.length < 5) return false;
  let sum = 0;
  for (let i = 0; i < d.length - 1; i++) sum += Number(d[d.length - 2 - i]) * (i + 1);
  return sum % 10 === Number(d[d.length - 1]);
};

console.log('\n== (a)+(b) the decision layer over every substance confirmed on 2026-10-01 ==');
const confirmed = rows.filter(r => r.confirmed);
const confirmed17 = rows.filter(r => r.confirmed && r.n <= 17);
check('the standard lists 8 confirming samples out of 17', confirmed17.length === 8, String(confirmed17.length));
for (const r of confirmed17.concat(rows.filter(r => r.n > 17 && r.confirmed))) {
  const real = libyaStatus(r.confirmed);
  check('#' + r.n + ' ' + r.image + ' — the Libyan status is what data/ says (' + r.libya + ')',
    real === r.libya, 'data says ' + real);
  /* farmer mode = Libyan sources only. The filter itself lives in the render
   * layer (src/app.js) and is pinned there by tests/mode-split.test.mjs at the
   * DOM level; here the same rule is applied to the engine's own output. */
  const libyan = search(r.confirmed, true).filter(x => LYBYA.indexOf(x.k) >= 0);
  check('#' + r.n + ' farmer mode keeps exactly the Libyan rows of the engine output',
    r.libya === 'none' ? libyan.length === 0 : libyan.length > 0,
    r.libya === 'none' ? 'no Libyan row expected, got ' + libyan.length
                       : 'expected a Libyan row for ' + r.confirmed + ', got none');
  check('#' + r.n + ' farmer mode carries the expected Libyan row', (libyan.length > 0) === (r.libya !== 'none'),
    libyan.map(x => x.k + ':' + x.s.v).join(','));
  const cases = [...new Set(libyan.flatMap(x => String(x.r.cas || '').split(/[\n,]/).map(s => s.trim()).filter(Boolean)))];
  check('#' + r.n + ' every Libyan CAS shown has a valid check digit', cases.every(casOk), cases.join(','));
  if (r.libya === 'ban') {
    check('#' + r.n + ' the Decree-248 ban is present and confirmed (100) — the red line',
      libyan.some(x => x.k === 'libya-248' && x.s.v === 100), libyan.map(x => x.k + ':' + x.s.v).join(','));
  }
}

/* the near-miss that must never be accepted for the aluminium sample */
const alu = search('Aluminium sulfate', true);
const ammonium = alu.filter(x => String(x.r.name).toLowerCase().indexOf('ammonium') >= 0);
check('Aluminium sulfate query: Ammonium sulfate is never a decisive (100) hit',
  ammonium.every(x => x.s.v < 100), ammonium.map(x => x.r.name + ':' + x.s.v).join(','));

/* ---------- (c) the OCR leg, only when a measured baseline is handed in ---------- */
const base = process.argv[2];
if (base && fs.existsSync(base)) {
  console.log('\n== (c) the OCR leg against ' + base + ' ==');
  const measured = JSON.parse(fs.readFileSync(base, 'utf8'));
  check('the baseline file has 17 rows', measured.length === 17, String(measured.length));
  for (const r of rows.filter(x => x.n <= 17)) {
    const m = measured.find(x => x.n === r.n);
    if (!m) { check('#' + r.n + ' present in the baseline', false); continue; }
    const got = (m.top || []).map(t => String(t.name || (t.r && t.r.name) || '')).filter(Boolean);
    const first = got[0] || '';
    check('#' + r.n + ' ' + m.name + ' — the confirmed substance did not change',
      r.confirmed ? first.toLowerCase().indexOf(r.confirmed.toLowerCase()) >= 0 : got.length === 0,
      r.confirmed ? 'expected ' + r.confirmed + ', got [' + got.join(', ') + ']' : 'expected NO result, got [' + got.join(', ') + ']');
  }
  const nAcc = measured.filter(x => (x.top || []).length).length;
  check('the ACCEPT count did not drop below the measured floor of 8', nAcc >= 8, String(nAcc));
} else {
  console.log('\n== (c) the OCR leg was NOT run (no baseline path given) ==\n    pass a measured baseline as the second argument to enforce it');
}

console.log('\n==============================\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
