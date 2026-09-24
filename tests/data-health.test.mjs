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

/* Regression baselines recomputed after the EPA Master (PPIS) rebuild
 * (2026-09-23). They are allowed to grow only via a deliberate data round:
 * an unexplained change here is a data-integrity signal, not noise. */
const DUP_KNOWN = 282;      /* same normalized name, different CAS signature */
const CAS_FAIL_KNOWN = 12;  /* CAS numbers failing the check digit (report-only) */

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) pass++; else fail++;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
};

console.log('\n== provenance vs files ==');
const prov = fs.readFileSync('docs/data-provenance.md', 'utf8');
const FILES = {
  'libya-248': { rows: 77,  sha: '764108e27ca0fd412792a2979f86a1d7496df2e693dcbb246f9bfa8979ceb65d' },
  'libya-500': { rows: 411, sha: '0c9c475534b5606d49449da2e31da14e37a61dec64d250dba5d81469d2c4936e' },
  'eu':        { rows: 1483, sha: 'ef629525c2dae8f741e1697faaecf2319e1a646e4e011d2754ef66e23844101e' },
  /* EPA Master (PPIS) rebuild (2026-09-23): active registry (1361) +
   * all-cancelled archive (1425), built by tools/build-epa-master.js from
   * sources/EPA_Master/EPA_Master.xlsx. The legacy 2199-row file is superseded. */
  'epa':             { rows: 1361, sha: 'b24d7c3e3a8dbd7e84ef7b1a59bbfb98674b5c8ad44ff7f7a3dbe0d90d7775f3' },
  'epa-cancelled':   { rows: 1425, sha: 'c2b5b38e4bfe07dc466c45d4f18518691a57de17b078822e2e6fab00de58fde7' }
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
check('ambiguous duplicates stable at known count (regression = count grows)',
  dupAmbiguous === DUP_KNOWN, 'found ' + dupAmbiguous + ', known ' + DUP_KNOWN);

console.log('\n== status vocabulary (verbatim per source) ==');
const OK500 = new Set(['Approved', 'RAR', 'REV', 'REV*']);
let bad500 = 0, badEu = 0, badEpa = 0, badEpac = 0, badRows = 0;
for (const r of DBS['libya-500']) if (!OK500.has(String(r.status))) bad500++;
for (const r of DBS.eu) {
  const raw = String(r.status_raw || '');
  if (raw && !['Approved', 'Not approved', 'Pending'].includes(raw)) badEu++;
  if (!['محظور', 'مقيد', 'قيد المراجعة', 'مسموح'].includes(String(r.status))) badEu++;
}
/* EPA Master (PPIS) rebuild: status_raw is the workbook's verbatim Arabic
 * sheet text (one of three states); the legacy ';'-joined Active/Inactive
 * English format is still accepted for backward compatibility. */
const EPA_RAW_OK = /^\s*(له تسجيل نشط واحد على الأقل|كل تسجيلاته ملغاة|غير مرتبط بأي منتج)\s*$/;
const isLegacyEpaRaw = raw => {
  const parts = String(raw || '').split(';').map(s => s.trim()).filter(Boolean);
  return parts.length > 0 && parts.every(p => /^(Active|Inactive) - /.test(p));
};
for (const r of DBS.epa) {
  if (!['محظور', 'مقيد', 'مسموح'].includes(String(r.status))) badEpa++;
  if (!(EPA_RAW_OK.test(String(r.status_raw || '')) || isLegacyEpaRaw(r.status_raw))) badEpa++;
}
for (const r of DBS['epa-cancelled']) {
  if (String(r.status) !== 'محظور') badEpac++;
  if (!EPA_RAW_OK.test(String(r.status_raw || ''))) badEpac++;
}
/* sequential `row` field on every row of every database (1-based, unique
 * per file) — search results, judge grouping and the near-pairs report
 * resolve rows by it (its absence printed `#undefined` in the report). */
/* `row` field on every row of every database: unique positive integer.
 * The EPA files (builder-generated) must additionally be exactly 1..N in
 * order; the Libya files keep their OFFICIAL decree numbering (with real
 * gaps in the source), so only uniqueness applies there. */
for (const [k, rows] of Object.entries(DBS)) {
  const seen = new Set();
  let bad = false;
  for (const r of rows) {
    const row = r.row;
    if (!Number.isInteger(row) || row < 1 || seen.has(row)) { bad = true; break; }
    seen.add(row);
  }
  if (!bad && (k === 'epa' || k === 'epa-cancelled')) {
    for (let i = 0; i < rows.length; i++) if (rows[i].row !== i + 1) { bad = true; break; }
  }
  if (bad) badRows++;
}
check('every row carries a sequential `row` field (all 5 DBs)', badRows === 0, String(badRows) + ' files bad');
check('libya-500 codes are exactly the 4 known codes', bad500 === 0, String(bad500));
check('eu status_raw in known set', badEu === 0, String(badEu));
check('epa status_raw well-formed (EPA Master Arabic sheet text or legacy Active/Inactive)', badEpa === 0, String(badEpa));
check('epa-cancelled status_raw well-formed (all-cancelled archive)', badEpac === 0, String(badEpac));

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
check('CAS checksum failures stable at known count (report-only, never corrected)',
  failures.length === CAS_FAIL_KNOWN, failures.length + ' — ' + failures.slice(0, 3).join(' | '));
console.log('  failures: ' + JSON.stringify(failures));

console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
