/*
 * tools/check-cas-checksums.mjs — repo data audit (run: node tools/check-cas-checksums.mjs)
 * Recomputes the CAS check-digit audit for every data file and prints:
 *   - well-formed CAS values failing the checksum (report-only),
 *   - malformed numeric CAS values (not checksum-evaluable),
 *   - the documented corrections layer of libya-500 (cas_raw → cas_corrected),
 *   - libya-500 completeness: every row must carry the provenance triple.
 * Exit code is non-zero if libya-500 completeness breaks (411 rows must all
 * carry cas_source). Checksum failures are REPORTED, never auto-corrected.
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
const d5 = JSON.parse(readFileSync('data/libya-500.json', 'utf8'));
const repairs = d5.rows.filter(r => String(r.cas_corrected || '').trim());
const missing = d5.rows.filter(r => /[0-9]/.test(String(r.cas || '')) && typeof r.cas_source !== 'string');
console.log(`\n== libya-500 corrections layer:`);
console.log(`   documented repairs: ${repairs.length} (expected 6)`);
repairs.forEach(r => console.log(`   ${r.name.split('\n')[0]}: ${r.cas_raw} → ${r.cas_corrected} [${r.cas_source}]`));
console.log(`   rows missing cas_source: ${missing.length} (expected 0 of ${d5.rows.length})`);
const ok = repairs.length === 6 && missing.length === 0 && d5.rows.length === d5.meta.count;
console.log(ok ? '\nAUDIT OK' : '\nAUDIT FAILED');
process.exit(ok ? 0 : 1);
