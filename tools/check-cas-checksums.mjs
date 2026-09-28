/*
 * tools/check-cas-checksums.mjs — repo data audit (run: node tools/check-cas-checksums.mjs)
 * Recomputes the CAS check-digit audit for every data file and prints:
 *   - well-formed CAS values failing the checksum (report-only),
 *   - malformed numeric CAS values (not checksum-evaluable),
 *   - the documented corrections layer of libya-500 (cas_raw → cas_corrected),
 *   - libya-500 completeness: every row must carry the provenance triple.
 * Exit code is non-zero if libya-500 completeness breaks (411 rows must all
 * carry cas_source). Checksum failures are REPORTED, never auto-corrected.
 *
 * المرحلة الثانية: the two OPTIONAL packs (Canada / Australia) are audited by
 * the SAME rules — a failing check digit is reported and left alone, and a
 * source that publishes no CAS at all prints that number instead of passing
 * silently.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
process.chdir(root);
globalThis.window = globalThis;
require('./../src/cas.js');
const { casChecksum } = globalThis.CasDissect;

const WELL = /^[0-9]{2,7}-[0-9]{2}-[0-9]$/;
const files = ['libya-500', 'libya-248', 'eu', 'epa', 'epa-cancelled'];
let failCount = 0;

for (const f of files) {
  const d = JSON.parse(readFileSync(`data/${f}.json`, 'utf8'));
  let well = 0, bad = [], malformed = [];
  for (const r of d.rows) {
    for (const c of String(r.cas || '').split(/[\n[\]]/).map(s => s.trim()).filter(Boolean)) {
      if (!/^[0-9]/.test(c)) continue;
      if (WELL.test(c)) {
        well++;
        if (casChecksum(c) === false) bad.push(`${r.name.split('\n')[0]} | ${c}`);
      } else if (!/No CAS|See |allocated/i.test(c)) malformed.push(`${r.name.split('\n')[0]} | ${JSON.stringify(c)}`);
    }
  }
  failCount += bad.length;
  console.log(`== ${f}: rows=${d.rows.length} well-formed=${well} checksum-fail=${bad.length} malformed=${malformed.length}`);
  bad.forEach(x => console.log('   FAIL', x));
  malformed.slice(0, 8).forEach(x => console.log('   MALF', x));
}

/* libya-500 corrections layer completeness */
/* ---------- optional packs: same policy, reported not corrected ---------- */
for (const f of ['canada', 'australia']) {
  let d;
  try { d = JSON.parse(readFileSync('data-optional/' + f + '.json', 'utf8')); }
  catch (e) { console.log('== ' + f + ': pack absent — run scripts/build-' + f + '.mjs'); continue; }
  let well = 0, bad = [], malformed = [];
  for (const r of d.rows) {
    for (const c of String(r.cas || '').split(/[\n[\]]/).map(s => s.trim()).filter(Boolean)) {
      if (!/^[0-9]/.test(c)) continue;
      if (WELL.test(c)) {
        well++;
        if (casChecksum(c) === false) bad.push(r.name.split('\n')[0] + ' | ' + c);
      } else if (!/No CAS|See |allocated/i.test(c)) malformed.push(r.name.split('\n')[0] + ' | ' + JSON.stringify(c));
    }
  }
  failCount += bad.length;
  console.log('== ' + f + ': rows=' + d.rows.length + ' well-formed=' + well + ' checksum-fail=' + bad.length + ' malformed=' + malformed.length + ' license=' + d.meta.license + ' retrieved=' + d.meta.retrieved_date);
  bad.slice(0, 20).forEach(x => console.log('   FAIL', x));
  malformed.slice(0, 8).forEach(x => console.log('   MALF', x));
  if (well === 0) console.log('   NOTE ' + f + ': the source publishes no CAS numbers — nothing to check, and none were invented');
}

const d5 = JSON.parse(readFileSync('data/libya-500.json', 'utf8'));
const repairs = d5.rows.filter(r => String(r.cas_corrected || '').trim());
const missing = d5.rows.filter(r => /[0-9]/.test(String(r.cas || '')) && typeof r.cas_source !== 'string');
console.log(`\n== libya-500 corrections layer:`);
console.log(`   documented repairs: ${repairs.length} (expected 8)`);
repairs.forEach(r => console.log(`   ${r.name.split('\n')[0]}: ${r.cas_raw} → ${r.cas_corrected} [${r.cas_source}]`));
const badFixed = repairs.filter(r => casChecksum(String(r.cas_corrected).trim()) !== true);
console.log(`   corrected values failing the check digit: ${badFixed.length} (expected 0)`);
badFixed.forEach(r => console.log('   FAIL-CORR', r.name.split('\n')[0], r.cas_corrected));
console.log(`   rows missing cas_source: ${missing.length} (expected 0 of ${d5.rows.length})`);
const ok = repairs.length === 8 && missing.length === 0 && badFixed.length === 0
  && d5.rows.length === d5.meta.count;
console.log(ok ? '\nAUDIT OK' : '\nAUDIT FAILED');
process.exit(ok ? 0 : 1);
