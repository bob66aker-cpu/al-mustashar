/*
 * tests/data-health.test.mjs — data health & provenance checks (read-only)
 * -------------------------------------------------------------------------
 *   - provenance: docs/data-provenance.md counts + SHA-256 match the files
 *   - no empty names; ambiguous duplicate names (same name_norm, different
 *     CAS across DBs) are REPORTED (count must stay stable unless data
 *     deliberately changes)
 *   - status vocabulary validity per source (verbatim values)
 *   - CAS check-digit failures are reported (never corrected)
 * Run: node tests/data-health.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);

globalThis.window = globalThis;
require('./../src/search-core.js');
require('./../src/cas.js');
const SC = globalThis.SearchCore;
const CD = globalThis.CasDissect;

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) pass++; else fail++;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('\n== provenance vs files ==');
const prov = fs.readFileSync('docs/data-provenance.md', 'utf8');
const FILES = {
  'libya-248': { rows: 77,  sha: '764108e27ca0fd412792a2979f86a1d7496df2e693dcbb246f9bfa8979ceb65d' },
  'libya-500': { rows: 411, sha: '372a5faf4a574728eeff4f9f587f94c4d110a4c5a35da38d7af53149f4df3672' },
  'eu':        { rows: 1483, sha: 'ef629525c2dae8f741e1697faaecf2319e1a646e4e011d2754ef66e23844101e' },
  'epa':       { rows: 2199, sha: '7b72bd38f804750f11acab74c2a44300ee3c2531770c6040fb2938c8763ba1d8' }
};
const DBS = {};
for (const [k, exp] of Object.entries(FILES)) {
  const raw = fs.readFileSync('data/' + k + '.json');
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  const data = JSON.parse(raw.toString('utf8'));
  DBS[k] = data.rows;
  check(k + ': count matches provenance', data.rows.length === exp.rows, data.rows.length + ' vs ' + exp.rows);
  check(k + ': sha matches provenance', sha === exp.sha, sha.slice(0, 12));
  check(k + ': sha documented in provenance', prov.includes(exp.sha));
}

console.log('\n== content sanity ==');
let emptyNames = 0, dupAmbiguous = 0;
const byNorm = new Map();
for (const [k, rows] of Object.entries(DBS)) {
  for (const r of rows) {
    if (!r.name || !String(r.name).trim()) emptyNames++;
    const nm = (r.name_norm || SC.norm(r.name || '')).trim();
    const casSig = SC.extractCass(r.cas).join(',') || 'noCAS';
    const key = nm;
    if (byNorm.has(key)) {
      const prev = byNorm.get(key);
      if (prev.casSig !== casSig) dupAmbiguous++;
    } else byNorm.set(key, { k, casSig });
  }
}
check('no empty names', emptyNames === 0, String(emptyNames));
check('ambiguous duplicates stable (48 known; regression = count grows)',
  dupAmbiguous === 48, 'found ' + dupAmbiguous);

console.log('\n== status vocabulary (verbatim per source) ==');
const OK500 = new Set(['Approved', 'RAR', 'REV', 'REV*']);
let bad500 = 0, badEu = 0, badEpa = 0;
for (const r of DBS['libya-500']) if (!OK500.has(String(r.status))) bad500++;
for (const r of DBS.eu) {
  const raw = String(r.status_raw || '');
  if (raw && !['Approved', 'Not approved', 'Pending'].includes(raw)) badEu++;
  if (!['محظور', 'مقيد', 'قيد المراجعة', 'مسموح'].includes(String(r.status))) badEu++;
}
for (const r of DBS.epa) {
  if (!['محظور', 'مقيد', 'مسموح'].includes(String(r.status))) badEpa++;
  const parts = String(r.status_raw || '').split(';').map(s => s.trim()).filter(Boolean);
  if (parts.length && !parts.every(p => /^(Active|Inactive) - /.test(p))) badEpa++;
}
check('libya-500 codes are exactly the 4 known codes', bad500 === 0, String(bad500));
check('eu status_raw in known set', badEu === 0, String(badEu));
check('epa status_raw parts well-formed', badEpa === 0, String(badEpa));

console.log('\n== CAS check-digit failures (report-only) ==');
let evaluable = 0, failures = [];
for (const [k, rows] of Object.entries(DBS)) {
  for (const r of rows) {
    for (const c of SC.extractCass(r.cas)) {
      const v = CD.casChecksum(c);
      if (v === null) continue;
      evaluable++;
      if (!v) failures.push(k + ' ' + c + ' — ' + String(r.name).split('\n')[0].slice(0, 36));
    }
  }
}
check('CAS checksum failures stable at 13 (report-only, never corrected)',
  failures.length === 13, failures.length + ' — ' + failures.slice(0, 3).join(' | '));
console.log('  failures: ' + JSON.stringify(failures));

console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
