#!/usr/bin/env node
/*
 * near-pairs.mjs — حصر الأزواج المتقاربة عبر القواعد الأربع (قراءة فقط)
 * ---------------------------------------------------------------------
 * يسرد كل زوج سجلين برقمَي CAS مختلفين يحملان:
 *   (أ) اسماً متطابقاً بعد التطبيع (نفس الاسم، CAS مختلف)، أو
 *   (ب) تشابهاً نصياً ≥ 80% بأسلوب SearchCore (احتواء بنسبة ≥ 0.72،
 *       أو Levenshtein ≥ 80% مع نطاق مقيّد للسرعة).
 *
 * المخرجات: docs/near-pairs.md — تقرير بالأزواج (مُسقّ للعرض) + إحصاء كامل.
 * لا يكتب في مجلد البيانات ولا يعدّل أي سجل.
 *
 * تشغيل: node scripts/near-pairs.mjs
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

const KEYS = ['libya-248', 'libya-500', 'eu', 'epa'];
const dbs = {};
for (const k of KEYS) dbs[k] = JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows;

/* flatten: {k, r, nc (compact name), cn (compact cas list sig)} */
const flat = [];
for (const k of KEYS) {
  for (const r of dbs[k]) {
    if (!r || !r.name) continue;
    const nc = SC.compact(r.name);
    const cass = SC.extractCass(r.cas);
    flat.push({ k, r, nc, casSig: cass.join(',') || 'noCAS' });
  }
}
console.log('rows:', flat.length);

/* banded levenshtein with early abandon above maxDist */
function levWithin(a, b, maxDist) {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    const lo = Math.max(1, i - maxDist), hi = Math.min(b.length, i + maxDist);
    for (let j = 1; j < lo; j++) cur[j] = maxDist + 1;
    for (let j = lo; j <= hi; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    for (let j = hi + 1; j <= b.length; j++) cur[j] = maxDist + 1;
    if (rowMin > maxDist) return maxDist + 1;
    prev = cur;
  }
  return prev[b.length];
}

const pairs = [];
const seen = new Set();
const N = flat.length;
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const A = flat[i];
  for (let j = i + 1; j < N; j++) {
    const B = flat[j];
    if (A.casSig === B.casSig) continue;                    // same CAS → not a pair
    if (A.nc === B.nc) {                                     // identical name, diff CAS
      const key = A.k + ':' + A.r.row + '~' + B.k + ':' + B.r.row;
      if (!seen.has(key)) { seen.add(key); pairs.push({ type: 'same-name', a: A, b: B, v: 100 }); }
      continue;
    }
    /* containment: shorter inside longer, ratio >= 0.72 (mirrors SearchCore) */
    const [s, l] = A.nc.length <= B.nc.length ? [A, B] : [B, A];
    if (s.nc.length >= 4 && l.nc.includes(s.nc)) {
      const ratio = s.nc.length / l.nc.length;
      if (ratio >= 0.72) {
        const key = A.k + ':' + A.r.row + '~' + B.k + ':' + B.r.row;
        if (!seen.has(key)) { seen.add(key); pairs.push({ type: 'containment', a: A, b: B, v: Math.round(ratio * 96) }); }
        continue;
      }
    }
    /* fuzzy: length-window prefilter + banded lev, threshold 80% */
    const maxLen = Math.max(A.nc.length, B.nc.length);
    if (maxLen < 8) continue;
    const maxDist = Math.floor(maxLen * 0.2);
    if (Math.abs(A.nc.length - B.nc.length) > maxDist) continue;
    const d = levWithin(A.nc, B.nc, maxDist);
    if (d <= maxDist) {
      const v = Math.round(100 - (d / maxLen) * 100);
      if (v >= 80) {
        const key = A.k + ':' + A.r.row + '~' + B.k + ':' + B.r.row;
        if (!seen.has(key)) { seen.add(key); pairs.push({ type: 'fuzzy', a: A, b: B, v }); }
      }
    }
  }
  if ((i & 511) === 0 && Date.now() - t0 > 150000) { console.log('time-boxed stop at row', i); break; }
}

console.log('pairs found:', pairs.length, 'in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
const byType = {};
for (const p of pairs) byType[p.type] = (byType[p.type] || 0) + 1;
console.log('by type:', JSON.stringify(byType));

/* ---- report ---- */
const SHOW = 250;
const fmt = p =>
  '- `' + p.a.k + '#' + p.a.r.row + '` ' + String(p.a.r.name).split('\n')[0].slice(0, 48) +
  ' [' + (p.a.casSig || 'noCAS') + ']  ↔  `' + p.b.k + '#' + p.b.r.row + '` ' +
  String(p.b.r.name).split('\n')[0].slice(0, 48) + ' [' + (p.b.casSig || 'noCAS') + '] — ' + p.v + '%';
let md = '# الأزواج المتقاربة (تقرير آلي — ' + new Date().toISOString().slice(0, 10) + ')\n\n';
md += '> أزواج سجلين برقمَي CAS مختلفين قد يظهر أحدهما نتيجةً للآخر. ' +
  'قاعدة الأمان: لا يُعرض أي زوج منها كتطابق مؤكد دون لافتة ملتبس/احتمالي ' +
  '(اختبار `tests/namepairs.test.mjs` يفشل إن خالفه العرض).\n\n';
md += '- الإجمالي: **' + pairs.length + '** زوجًا\n';
md += '- same-name (اسم متطابق، CAS مختلف): ' + (byType['same-name'] || 0) + '\n';
md += '- containment (احتواء ≥72%): ' + (byType['containment'] || 0) + '\n';
md += '- fuzzy (تشابه ≥80%): ' + (byType['fuzzy'] || 0) + '\n\n';
if (pairs.length > SHOW) md += '> (عرض أول ' + SHOW + ' زوجًا فقط؛ الإحصاء أعلاه كامل)\n\n';
md += pairs.slice(0, SHOW).map(fmt).join('\n') + '\n';
fs.writeFileSync('docs/near-pairs.md', md);
console.log('report written: docs/near-pairs.md');

/* persist the machine list for the regression test (bounded) */
fs.writeFileSync('tests/near-pairs.json', JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  total: pairs.length,
  byType,
  pairs: pairs.slice(0, 400).map(p => ({
    type: p.type, v: p.v,
    a: { k: p.a.k, row: p.a.r.row, cas: p.a.casSig },
    b: { k: p.b.k, row: p.b.r.row, cas: p.b.casSig }
  }))
}, null, 1));
console.log('machine list written: tests/near-pairs.json');
