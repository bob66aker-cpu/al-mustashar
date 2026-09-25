/*
 * ocr-diagnostics.js — opt-in OCR attempt recorder (أ1, no production effect)
 * ---------------------------------------------------------------------------
 * A light logger attached to every recognition attempt inside the progressive
 * ladder in src/ocr.js. The engine records into it ONLY when a run has been
 * explicitly started with OcrDiagnostics.start(label) — in production the
 * module stays inert (isEnabled() === false, recordAttempt is a no-op), so
 * scanning behavior, pass order and timings are unchanged.
 *
 * Purpose (docs/ocr-speed-diagnosis.md): per-attempt evidence of WHICH gate
 * (Latin 60% / confidence 45) rejects WHAT, WHEN — to decide the slow-scan
 * fix from measurements, not guesses.
 */
(function (global) {
  'use strict';

  const OcrDiagnostics = (function () {
    let enabled = false;
    let currentRun = null;

    function start(imageLabel) {
      enabled = true;
      currentRun = {
        image: imageLabel,
        startedAt: (global.performance || Date).now(),
        attempts: [],
        finishedAt: null,
        outcome: null, // 'accepted' | 'rejected' | 'exhausted'
      };
      return currentRun;
    }

    // يُستدعى بعد كل محاولة قراءة منفردة داخل السلّم
    function recordAttempt(meta) {
      if (!enabled || !currentRun) return;
      currentRun.attempts.push({
        index: currentRun.attempts.length + 1,
        variant: meta.variant,          // اسم المعالجة المستخدمة (psm11, deep1, ...)
        elapsedMs: Math.round((global.performance || Date).now() - currentRun.startedAt),
        rawText: String(meta.rawText || '').slice(0, 200),
        latinRatio: meta.latinRatio ?? null,
        confidence: meta.confidence ?? null,
        extractedCas: meta.cas || [],
        casValid: meta.casValid ?? null,
        gateResult: meta.gateResult,    // 'passed' | 'rejected_latin' | 'rejected_conf' | 'exempt_cas'
        wouldHaveBeenAcceptedByOldRule: meta.legacyWouldAccept ?? null,
      });
    }

    function finish(outcome) {
      if (!enabled || !currentRun) return null;
      currentRun.finishedAt = (global.performance || Date).now();
      currentRun.totalMs = Math.round(currentRun.finishedAt - currentRun.startedAt);
      currentRun.outcome = outcome;
      const result = currentRun;
      currentRun = null;
      /* armed state persists across runs (batch diagnosis over many images);
       * the caller disarms explicitly with disable(). */
      return result;
    }

    function isEnabled() { return enabled; }

    /* explicit arming for the diag harness (production never calls these,
     * so the engine's guarded start() never fires and the module is inert) */
    function enable() { enabled = true; }
    function disable() { enabled = false; currentRun = null; }

    return { start, recordAttempt, finish, isEnabled, enable, disable };
  })();

  if (typeof window !== 'undefined') window.OcrDiagnostics = OcrDiagnostics;
  if (typeof module !== 'undefined') module.exports = OcrDiagnostics;
})(typeof window !== 'undefined' ? window : globalThis);
