/*
 * tests/ocr-early-confirm.test.mjs — أ3 early-confirm lock (2026-09-25)
 * ---------------------------------------------------------------------------
 * Live evidence (docs/ocr-speed-diagnosis.md, pre-fix table): real photos
 * fixture:101.jpg / fixture:8.jpg / fixture:9.jpg / fixture:images.jpg
 * produced a 100% DATABASE-CONFIRMED pass (dbBest=100 — exact CAS/name) whose
 * ladder already stopped on exactHit, but the wholesale FINAL gate then
 * rejected the whole scan (confidence 34-38 or Latin ratio < 0.6). The gate
 * was added (a4/ج) AFTER the ladder's own design, so it could discard a read
 * the databases had already verified — clear photos failing wholesale.
 *
 * Fix (decision tree branch 1, per the round prompt): the ladder takes an
 * earlyLock snapshot whenever the databases CONFIRM a pass (exactHit:
 * exact CAS / exact name / >=96, or a checksum-valid CAS — V2's documented
 * precedence). On exhaustion the locked read is returned as-is; the final
 * gate keeps precedence for anything the databases did NOT confirm. Gates
 * are NOT removed and matching logic is NOT changed: nothing that would
 * have been rejected before is accepted now — the only difference is that
 * a DB-confirmed read is no longer DISCARDED.
 *
 * This test pins that contract on the REAL databases (5 sources, same as
 * the app) without starting a Tesseract worker: the gate functions and the
 * lock inputs are exactly the values recognize() passes around.
 * Run: node tests/ocr-early-confirm.test.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';

/* same load order as index.html: search-core, cas.js BEFORE ocr.js */
const scCtx = {}; vm.createContext(scCtx);
vm.runInContext(fs.readFileSync('src/search-core.js', 'utf8'), scCtx);
const SearchCore = scCtx.SearchCore;
await import(new URL('../src/cas.js', import.meta.url));
await import(new URL('../src/ocr.js', import.meta.url));
const M = globalThis.OcrModule;

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  if (ok) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

must('OcrModule exposes gate surface', !!(M && M.rejectedTextReason && M.latinRatio && M.hasValidCas && typeof M.MIN_CONFIDENCE === 'number'));

/* the real databases, all five searchable sources */
const sources = ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled']
  .map(k => ({ key: k, rows: JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows }));
const search = SearchCore.buildSearch(sources);
M.setSearchRef(search);
must('search built over 5 sources', typeof search === 'function');

/* dbScorePass is internal; reproduce its consume() via the exported gate
 * pieces is impossible — instead assert through the PUBLIC contract:
 * hasValidCas + rejectedTextReason (the exact lock condition and gate).
 * The lock condition in src/ocr.js is: exactHit || hasValidCas(fusionCAS),
 * where exactHit comes from dbScorePass (search-driven). Verify the search
 * itself confirms the fixtures' active ingredients at 100% (the pre-fix
 * dbBest=100 evidence), so the lock WOULD have fired for them. */
const confirmed = [
  ['glyphosate', 'Glyphosate'],
  ['acetamiprid', 'Acetamiprid'],
  ['malathion', 'Malathion'],
  ['2,4-D', '2,4-D'],
  ['imidacloprid', 'Imidacloprid'],
  ['bifenthrin', 'Bifenthrin']
];
for (const [tag, name] of confirmed) {
  const hits = search(name, false).filter(x => x.s.v >= 100);
  must('DB confirms "' + name + '" at 100% (lock condition reachable)', hits.length > 0,
    hits.length ? hits[0].k + ' ' + Math.round(hits[0].s.v) : 'no exact row');
}

/* a checksum-valid CAS is structured evidence: the gate must NOT reject a
 * low-confidence read that carries it (the earlyLock path keeps it). */
const casLowConf = M.rejectedTextReason('Contains CAS 1071-83-6 trace', { conf: 34, cas: ['1071-83-6'] });
must('valid CAS at conf 34 is NOT gated (lock keeps it)', casLowConf === null,
  casLowConf ? casLowConf.key : 'no rejection');

/* an UNCONFIRMED low-confidence read stays rejected by the final gate —
 * the lock changes nothing for it (red line: no new accepts). */
const noise = M.rejectedTextReason('plain unreadable word salad no evidence', { conf: 30, cas: [] });
must('unconfirmed conf-30 read IS still gated', noise !== null && noise.lowConfidence === true,
  noise ? noise.key : 'not rejected');

/* Latin-ratio gate unchanged for unconfirmed text */
const latin = M.rejectedTextReason('نص عربي هالوس بالكامل بلا أي دليل رقمي مهيكل', { conf: 88, cas: [] });
must('unconfirmed Arabic-leak read IS still gated', latin !== null && latin.arabicLeak === true,
  latin ? latin.key : 'not rejected');

/* MIN_CONFIDENCE unchanged (45) — the fix must not have moved it */
must('MIN_CONFIDENCE stays 45', M.MIN_CONFIDENCE === 45, String(M.MIN_CONFIDENCE));

console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
