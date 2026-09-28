#!/usr/bin/env node
/*
 * tests/ocr-ladder-report.mjs — يقرأ ocr-ladder-rows.jsonl ويطبع جدول قبل/بعد.
 * لا يقيس شيئًا: يجمع فقط. node tests/ocr-ladder-report.mjs [rowsFile]
 */
import { readFileSync, writeFileSync } from 'fs';

const ROWS = process.argv[2] || 'tests/fixtures/labels/ocr-ladder-rows.jsonl';
const lines = readFileSync(ROWS, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const env = lines.find(l => l.kind === 'env') || {};
/* a batch may be re-run after an interrupted session: keep the LAST
   measurement per (mode, n) so no label is counted twice */
const seen = new Map();
for (const l of lines) { if (l.kind !== 'env') seen.set(l.mode + ':' + l.n, l); }
const rows = [...seen.values()];
const before = rows.filter(r => r.mode === 'before');
const after = rows.filter(r => r.mode === 'after');
if (!before.length || !after.length) {
  console.log('INCOMPLETE before=' + before.length + ' after=' + after.length);
  process.exit(1);
}
const grade = e => (e.error ? 'HANG' : (e.cas.length ? 'ACCEPT' : (e.raw ? 'REJECT' : 'EMPTY')));
const stat = rs => {
  const ms = rs.map(r => r.ms);
  return {
    n: rs.length,
    avgMs: Math.round(ms.reduce((a, b) => a + b, 0) / ms.length),
    maxMs: Math.max(...ms),
    avgPasses: +(rs.reduce((a, r) => a + r.passes, 0) / rs.length).toFixed(2),
    ACCEPT: rs.filter(r => grade(r) === 'ACCEPT').length,
    REJECT: rs.filter(r => grade(r) === 'REJECT').length,
    EMPTY: rs.filter(r => grade(r) === 'EMPTY').length,
    HANG: rs.filter(r => grade(r) === 'HANG').length
  };
};
const b = stat(before), a = stat(after);
const dPct = (((a.avgMs - b.avgMs) / b.avgMs) * 100).toFixed(1);
const summary = {
  measuredAt: new Date().toISOString().slice(0, 10),
  deviceMemory: env.deviceMemory === undefined ? 'undefined' : env.deviceMemory,
  rung: env.rung, beforeDim: 1600, afterDim: env.rung && env.rung.dim,
  before: b, after: a, avgMsDelta: dPct + '%',
  verdict: a.ACCEPT >= b.ACCEPT ? 'ACCEPT-NOT-LOWERED' : 'ACCEPT-LOWERED',
  rows: before.map(r => {
    const m = after.find(x => x.n === r.n) || {};
    return { n: r.n, name: r.name, beforeMs: r.ms, afterMs: m.ms, beforeGrade: grade(r), afterGrade: grade(m), beforeTop: r.top, afterTop: m.top };
  })
};
writeFileSync('tests/fixtures/labels/ocr-ladder-summary.json', JSON.stringify(summary, null, 1));
console.log('deviceMemory=' + summary.deviceMemory + '  rung=' + JSON.stringify(env.rung));
console.log('BEFORE maxDim=1600 n=' + b.n + ' avgMs=' + b.avgMs + ' maxMs=' + b.maxMs + ' avgPasses=' + b.avgPasses + ' ACCEPT=' + b.ACCEPT + ' REJECT=' + b.REJECT + ' EMPTY=' + b.EMPTY + ' HANG=' + b.HANG);
console.log('AFTER  maxDim=' + summary.afterDim + ' n=' + a.n + ' avgMs=' + a.avgMs + ' maxMs=' + a.maxMs + ' avgPasses=' + a.avgPasses + ' ACCEPT=' + a.ACCEPT + ' REJECT=' + a.REJECT + ' EMPTY=' + a.EMPTY + ' HANG=' + a.HANG);
console.log('DELTA avgMs ' + b.avgMs + ' → ' + a.avgMs + ' (' + dPct + '%)   ACCEPT ' + b.ACCEPT + ' → ' + a.ACCEPT);
console.log('VERDICT ' + summary.verdict);
