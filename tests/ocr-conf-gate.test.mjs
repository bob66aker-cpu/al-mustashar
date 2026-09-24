/*
 * tests/ocr-conf-gate.test.mjs — confidence floor for unstructured reads
 * (أ4, 2026-09-23).
 *
 * The 60% Latin gate accepted dense-noise output that completed at raw
 * confidence 24 (documented live: docs/ocr-arabic-hallucination-diagnosis.md,
 * post-gate run). This gate rejects any UNSTRUCTURED read whose overall
 * confidence is below MIN_CONFIDENCE (45), with the same wholesale contract:
 * empty text, no candidates, no CAS — «لم يُستخرج نص موثوق — القراءة
 * منخفضة الثقة.» via t('ocr.rejected.conf') in all four dictionaries.
 *
 * Precedence preserved: structured evidence (any extracted CAS or an
 * ACTIVE INGREDIENT region) is never gated by confidence — V2's documented
 * rule that the databases outrank raw confidence (CAS +250).
 *
 * Imports src/ocr.js as a real module and exercises the exact functions used
 * as the final gate of recognize() and scan(). No Tesseract worker is started
 * here (browser probes cover the live path; see tests/probe-ocr-blank.mjs).
 * Run: node tests/ocr-conf-gate.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* same load order as index.html: cas.js (checksum source) BEFORE ocr.js */
await import(new URL('../src/cas.js', import.meta.url));
await import(new URL('../src/ocr.js', import.meta.url));
const M = globalThis.OcrModule;
if (!M || typeof M.rejectedTextReason !== 'function') {
  console.error('FAIL OcrModule did not export rejectedTextReason/MIN_CONFIDENCE');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

/* Latin-rich sample that passes the 60% ratio gate (isolates the conf gate) */
const LABELISH = 'ACTIVE INGREDIENT: CHLORPYRIFOS 480 g/L EMULSIFIABLE CONCENTRATE\n'
  + 'KEEP OUT OF REACH OF CHILDREN Batch no. 2341A EXP 09/2028\n'.repeat(4);

/* 1) the floor and its export */
check('MIN_CONFIDENCE is exported and equals 45', M.MIN_CONFIDENCE === 45, String(M.MIN_CONFIDENCE));

/* 2) the documented noise shape: conf 24 → rejected with lowConfidence */
{
  const r = M.rejectedTextReason(LABELISH, { conf: 24 });
  check('unstructured read at confidence 24 is rejected', !!r && r.lowConfidence === true,
    r ? JSON.stringify(r).slice(0, 120) : 'not rejected');
  check('rejection carries the conf gate key and message',
    !!r && r.key === 'ocr.rejected.conf' && r.message === 'لم يُستخرج نص موثوق — القراءة منخفضة الثقة.');
  check('rejection exposes conf + threshold for diagnostics',
    !!r && r.conf === 24 && r.threshold === 45);
  check('rejection is NOT an arabicLeak (distinct reason)', !!r && r.arabicLeak === undefined);
}

/* 3) healthy label confidence passes */
check('unstructured read at confidence 90 passes', M.rejectedTextReason(LABELISH, { conf: 90 }) === null);
check('unstructured read at confidence null (no conf info) passes', M.rejectedTextReason(LABELISH, { conf: null }) === null);
check('no meta at all passes (legacy callers unaffected)', M.rejectedTextReason(LABELISH) === null);

/* 4) the 45 boundary: 44 rejected, 45 passes */
check('confidence 44 is rejected (boundary)', !!(M.rejectedTextReason(LABELISH, { conf: 44 }) || {}).lowConfidence);
check('confidence 45 passes (boundary)', M.rejectedTextReason(LABELISH, { conf: 45 }) === null);

/* 5) الأدلة المهيكلة حصرًا: رقم CAS اجتاز فحص رقم التحقق (مُضيَّق بقرار
 *    المستخدم 2026-09-23) — منطقة المادة الفعالة وحدها لا تُعفي، ورقم فاشل
 *    الفحص لا يُعفي. */
check('low confidence WITH checksum-VALID CAS is not gated (CAS outranks confidence)',
  M.rejectedTextReason(LABELISH, { conf: 24, cas: ['1071-83-6'] }) === null);
check('low confidence with checksum-INVALID CAS only is gated',
  !!(M.rejectedTextReason(LABELISH, { conf: 24, cas: ['1071-85-6'] }) || {}).lowConfidence);
check('AI region without a valid CAS no longer exempts (narrowed contract)',
  !!(M.rejectedTextReason(LABELISH, { conf: 10, cas: [] }) || {}).lowConfidence);
check('hasValidCas exported and true only for checksum-valid entries',
  M.hasValidCas(['1071-83-6']) === true && M.hasValidCas(['1071-85-6']) === false
  && M.hasValidCas([]) === false && M.hasValidCas(undefined) === false);
check('missing CasDissect (standalone import) defaults to NO exemption (safe)',
  (() => { const saved = globalThis.CasDissect; globalThis.CasDissect = undefined;
    const r = M.rejectedTextReason(LABELISH, { conf: 24, cas: ['1071-83-6'] });
    globalThis.CasDissect = saved; return !!(r || {}).lowConfidence; })());
check('valid CAS exempts the Latin-ratio gate too (CAS-only reads stay alive)',
  M.rejectedTextReason('Contains: CAS 1071-83-6', { cas: ['1071-83-6'], conf: null }) === null);

/* 6) Arabic leak still wins first (ratio gate precedes the conf gate) */
{
  const r = M.rejectedTextReason('مرحبا'.repeat(40), { conf: 90 });
  check('pure Arabic at high confidence still rejected as arabicLeak',
    !!r && r.arabicLeak === true && r.lowConfidence === undefined);
  const r2 = M.rejectedTextReason('مرحبا'.repeat(40), { conf: 24 });
  check('pure Arabic at low confidence reports the leak (ratio gate first)',
    !!r2 && r2.arabicLeak === true);
}

/* 7) recognize()/scan() wiring (static contract over the real module) */
{
  const ocr = readFileSync(join(root, 'src/ocr.js'), 'utf8');
  check('recognize() passes the extracted-CAS list to the gate',
    /rejectedTextReason\(text, \{\s*\n\s*conf: bestResult\.conf,\s*\n\s*cas: \[\.\.\.fusionCAS\]\s*\n\s*\}\)/.test(ocr));
  check('scan() re-derives the gate with its own CAS list',
    /res\.rejected \|\| rejectedTextReason\(res\.text, \{/.test(ocr)
    && /cas: res\.cas/.test(ocr));
  check('exemption is decided by hasValidCas (checksum gate), not by pattern presence',
    /const structured = hasValidCas\(meta && meta\.cas\)/.test(ocr)
    && /function hasValidCas\(/.test(ocr));
  check('rejectedTextReason is defined once and gated in recognize() + scan()',
    (ocr.match(/function rejectedTextReason\(/g) || []).length === 1
    && (ocr.match(/const rejected = rejectedTextReason\(/g) || []).length === 1
    && (ocr.match(/res\.rejected \|\| rejectedTextReason\(/g) || []).length === 1,
    JSON.stringify({
      def: (ocr.match(/function rejectedTextReason\(/g) || []).length,
      rec: (ocr.match(/const rejected = rejectedTextReason\(/g) || []).length,
      scan: (ocr.match(/res\.rejected \|\| rejectedTextReason\(/g) || []).length
    }));
}

/* 8) i18n: the conf message exists verbatim in all four dictionaries */
{
  const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
  check('ocr.rejected.conf exists in all 4 dictionaries',
    (i18n.match(/'ocr\.rejected\.conf':/g) || []).length === 4);
  check('the Arabic conf message is the literal agreed text',
    i18n.includes('لم يُستخرج نص موثوق — القراءة منخفضة الثقة.'));
}

/* 9) renderer wires both rejection messages through i18n */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  check('app.js picks the message by rejection type',
    app.includes("res.rejected.lowConfidence ? 'ocr.rejected.conf' : 'ocr.rejected.mixed'"));
  check('ocr.rejected.conf is in the engine-message fan-out list',
    app.includes("'ocr.rejected.mixed','ocr.rejected.conf'"));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
console.log('==============================');
process.exit(fail ? 1 : 0);
