#!/usr/bin/env node
/*
 * rebaseline-intl.mjs — يحدّث بصمة وعدد صفوف القواعد الدولية المُجدَّدة (eu, epa, epa-cancelled) في
 * tests/data-baseline.json بعد تحديث الـ15 يومًا المعتمد. يرفض القاعدتين الليبيتين رفضًا قاطعًا.
 *   node scripts/rebaseline-intl.mjs eu epa epa-cancelled
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require('../src/search-core.js'); require('../src/cas.js');
const SC = globalThis.SearchCore;
const ALLOWED = ['eu', 'epa', 'epa-cancelled'];
const dbs = process.argv.slice(2);
const bad = dbs.filter(d => !ALLOWED.includes(d));
if (!dbs.length || bad.length) { console.error('refused: ' + (bad.join(', ') || 'no db given') + ' (allowed: ' + ALLOWED.join(', ') + '; Libya is never rebaselined here)'); process.exit(2); }
const f = 'tests/data-baseline.json';
const b = JSON.parse(fs.readFileSync(f, 'utf8'));
const date = new Date().toISOString().slice(0, 10);
for (const d of dbs) {
  const p = 'data/' + d + '.json';
  const raw = fs.readFileSync(p);
  const rows = JSON.parse(raw.toString('utf8')).rows.length;
  b.files[p] = { sha256: crypto.createHash('sha256').update(raw).digest('hex'), rows };
  console.log(p + ' -> ' + rows + ' rows');
}
b._comment = String(b._comment).replace(/ \| \d{4}-\d{2}-\d{2} 15-day refresh \(automated\):[^|]*$/, '') +
  ' | ' + date + ' 15-day refresh (automated): ' + dbs.join(', ') + ' rebaselined by scripts/rebaseline-intl.mjs after the approved periodic update; Libya untouched.';
/* same duplicate-name count as tests/data-health.test.mjs (reported, not corrected) */
{
  let dup = 0; const byNorm = new Map();
  for (const k of ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled']) {
    for (const r of JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows) {
      const nm = (r.name_norm || SC.norm(r.name || '')).trim();
      const sig = SC.extractCass(r.cas).join(',') || 'noCAS';
      if (byNorm.has(nm)) { if (byNorm.get(nm) !== sig) dup++; } else byNorm.set(nm, sig);
    }
  }
  b.dup_ambiguous_known = dup;
  console.log('dup_ambiguous_known = ' + dup);
}
fs.writeFileSync(f, JSON.stringify(b, null, 2) + '\n');
/* provenance change-log line (tests require every pinned sha to be documented) */
const pv = 'docs/data-provenance.md';
const sh = d => b.files['data/' + d + '.json'].sha256.slice(0, 8) + '…';
fs.appendFileSync(pv, '\n| ' + date + ' | ' + dbs.join(' + ') + ' | تجديد دوري آلي كل 15 يومًا من المصادر الرسمية (EU: واجهة المفوضية v3؛ EPA: ملفات PPIS الخمسة): ' +
  dbs.map(d => d + ' ' + b.files['data/' + d + '.json'].rows + ' (بصمة `' + b.files['data/' + d + '.json'].sha256 + '`)').join('، ') + ' | `scripts/build-eu.mjs` + `tools/build-epa-master.js --from-ppis` |\n');
