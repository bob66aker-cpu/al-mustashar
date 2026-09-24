/*
 * tests/ocr-latin-gate.test.mjs — Latin-ratio rejection gate (2026-09-23).
 *
 * Round: Arabic-hallucination follow-up (docs/ocr-arabic-hallucination-diagnosis.md).
 * The engine must reject, wholesale and with «لم يُستخرج نص موثوق», any merged
 * text whose Latin letters are below 60% of non-space characters — foreign
 * (English) label photos can only produce Arabic-heavy output through
 * hallucination leakage. Rotated/inverted passes stay untouched (ب), the noise
 * hang stays an open separate item (د), and future ara re-enablement needs the
 * stricter per-line gate documented in the diagnosis (هـ).
 *
 * Imports src/ocr.js as a real module and exercises OcrModule.latinRatio /
 * OcrModule.rejectedTextReason — the exact functions used as the final gate of
 * recognize() and scan(). No Tesseract worker is started here (browser probes
 * cover the live path; see tests/probe-ocr-blank.mjs).
 * Run: node tests/ocr-latin-gate.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

await import(new URL('../src/ocr.js', import.meta.url));
const M = globalThis.OcrModule;
if (!M || typeof M.rejectedTextReason !== 'function') {
  console.error('FAIL OcrModule did not export latinRatio/rejectedTextReason');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

/* 1) empty text (blank probe case) — nothing to judge, not a leak */
{
  const r = M.rejectedTextReason('');
  check('empty text is not rejected', r === null);
  const l = M.latinRatio('');
  check('latinRatio of empty text is ratio=1 ok', l.ratio === 1 && l.ok === true);
}

/* 2) pure English — the expected foreign-label case must never be rejected */
{
  const text = ('ACTIVE INGREDIENT: CHLORPYRIFOS 480 g/L EMULSIFIABLE CONCENTRATE\n'
    + 'KEEP OUT OF REACH OF CHILDREN Batch no. 2341A EXP 09/2028\n').repeat(6);
  const l = M.latinRatio(text);
  check('pure English text passes (digits dilute ratio, still well above gate)',
    l.ok && l.ratio > 0.8, 'ratio=' + l.ratio);
  check('pure English text is not rejected', M.rejectedTextReason(text) === null);
}

/* 3) exact 60% boundary — accepted (>= 0.6) */
{
  const text = 'a'.repeat(60) + 'ب'.repeat(40); /* 60 Latin + 40 Arabic */
  const l = M.latinRatio(text);
  check('exactly 60% Latin passes the gate', l.ok && l.ratio === 0.6,
    'ratio=' + l.ratio);
}

/* 4) just under the gate (digits dilute the ratio) — rejected wholesale */
{
  const text = 'a'.repeat(52) + '0'.repeat(6) + 'مرحبا'.repeat(8); /* 52L + 6d + 42ar */
  const l = M.latinRatio(text);
  const r = M.rejectedTextReason(text);
  check('52% Latin (digits dilution) fails the gate', !l.ok,
    'ratio=' + l.ratio);
  check('sub-gate text is rejected wholesale', !!r && r.arabicLeak === true);
}

/* 5) pure Arabic — the reported hallucination shape */
{
  const text = 'مرحبا'.repeat(40); /* 200 Arabic chars */
  const l = M.latinRatio(text);
  const r = M.rejectedTextReason(text);
  check('pure Arabic text fails the gate', !l.ok && l.ratio === 0);
  check('pure Arabic text is rejected with arabicLeak flag',
    !!r && r.arabicLeak === true && r.ratio === 0);
}

/* 6) pure digits (barcode-stripe shape) — rejected */
{
  const text = '1'.repeat(60);
  const r = M.rejectedTextReason(text);
  check('pure digits are rejected (barcode-stripe shape)', !!r && r.ratio === 0);
}

/* 7) rejection payload shape consumed by the UI */
{
  const r = M.rejectedTextReason('مرحبا'.repeat(8));
  check('rejection carries the literal i18n key', r.key === 'ocr.rejected.mixed');
  check('rejection carries the literal Arabic message', r.message === 'لم يُستخرج نص موثوق');
  check('rejection exposes latin + nonSpace counts for diagnostics',
    typeof r.latin === 'number' && typeof r.nonSpace === 'number'
    && r.nonSpace === 40 && r.latin === 0);
  check('rejection ratio is rounded to 2 decimals', r.ratio === 0);
}

/* 8) recognition result shape on rejection (static contract) */
{
  const ocr = readFileSync(join(root, 'src/ocr.js'), 'utf8');
  check('recognized rejection returns empty text/cas/candidates',
    /const rejected = rejectedTextReason\(text, \{[\s\S]{0,500}if \(rejected\) \{\s*\n\s*status\('ocr\.done', 1\);/.test(ocr)
    || (/const rejected = rejectedTextReason\(text, \{[\s\S]{0,300}cas: \[\.\.\.fusionCAS\]/.test(ocr)
        && /if \(rejected\) \{[\s\S]{0,200}text: ''/.test(ocr)));
  check('the gate is the final barrier of recognize() and runs once',
    (ocr.match(/rejectedTextReason\(/g) || []).length >= 2);
}

/* 9) message keys present in all four dictionaries */
{
  const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
  check('ocr.rejected.mixed exists in all 4 dictionaries',
    (i18n.match(/'ocr\.rejected\.mixed':/g) || []).length === 4);
  check('ocr.loadDone says /7 files (eng-only asset count, 4 dicts)',
    (i18n.match(/\{n\}\/7/g) || []).length === 4);
  check('no dictionary still advertises /8 files', !/\/8\)/.test(i18n));
}

/* 10) renderer wires the rejection through i18n.t, not the engine string */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  check('app.js renders the rejection via t(ocr.rejected.*)',
    /t\(rejKey, /u.test(app) && app.includes("'ocr.rejected.mixed'") && app.includes("'ocr.rejected.conf'"));
  check('ocr.rejected.* are in the engine-message fan-out list',
    app.includes("'ocr.rotate','ocr.done','ocr.rejected.mixed','ocr.rejected.conf'"));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
console.log('==============================');
process.exit(fail ? 1 : 0);
