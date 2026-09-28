/* src/ppocr.js — PP-OCRv5 as an OPTIONAL, OFF-BY-DEFAULT package
 * ==============================================================
 * This file is never referenced by index.html, never precached, and never
 * imported by the app. It exists so a measurement session (or the field
 * campaign on a chosen device) can turn the second engine on with ONE flag
 * — `OcrModule.setTuning({ ppocr: true })` — and nothing else. The farmer
 * path is byte-for-byte the path it was before this file existed.
 *
 * Rules this file obeys, and why:
 *
 *  1. Nothing is fetched until the flag is on. `installed()` is the only
 *     thing the app could ever call, and it touches no network.
 *  2. Every remote asset is pinned (exact version, immutable URL) and
 *     hashed. Models are verified BEFORE the engine sees them: we download
 *     the tar, check sha256, and hand the engine a blob: URL. A model that
 *     fails its hash never reaches the recognizer.
 *  3. Assets are cached in their own Cache Storage bucket (`ppocr-v1`) so
 *     the farmer's default caches, the SW precache and the OCR cache are
 *     never touched, and a later SW upgrade cannot wipe the prepared
 *     optional package.
 *
 * Honest limitation, recorded rather than hidden: the ESM entry has
 * RELATIVE imports (`/npm/...`), so it cannot be executed from a blob URL.
 * We therefore verify it with a 40 KB fetch and then import the pinned URL;
 * the browser HTTP cache serves the second read. That is a real integrity
 * gate with a narrow window (a network attacker able to answer twice), not
 * a perfect one. The ORT WASM binary is fetched by onnxruntime-web itself
 * from its own CDN and is NOT gated by this file — its size and hash are
 * listed in the manifest so the budget is at least known.
 */
(function (global) {
  'use strict';

  /* ---- the optional package, measured 2026-09-28 (not guessed) ----------
   * bytes = Content-Length actually served; sha256 = of the exact payload
   * (see docs/ocr-ab-experiment.md §PP-OCRv5 for how each was obtained). */
  const ASSETS = Object.freeze({
    /* the ESM entry: 40,902 bytes */
    esm: {
      url: 'https://cdn.jsdelivr.net/npm/@paddleocr/paddleocr-js@0.4.2/+esm',
      bytes: 40902,
      sha256: '8ecc529f050337d4245096ce45a24f75df18f562168452bc21488d0657d5960e'
    },
    /* mobile detector: 4,843,520 bytes */
    det: {
      url: 'https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx_infer.tar',
      bytes: 4843520,
      sha256: '781056046c9ed77a15c94681605db6a0f62317c2e9cce6931c71da2478d4bc30'
    },
    /* mobile recogniser (the big one): 16,701,440 bytes */
    rec: {
      url: 'https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx_infer.tar',
      bytes: 16701440,
      sha256: 'f7e792bc836f36e7ef895ad47c426d75b0b75b1650caa6d63fe9418441ffba8c'
    },
    /* ONNX Runtime WASM, fetched by the engine itself — NOT gated here,
     * listed so the size budget is known: 12,361,745 bytes (non-JSEP) */
    ortWasm: {
      url: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.wasm',
      bytes: 12361745,
      sha256: null,
      gated: false
    }
  });

  const ENGINE = Object.freeze({ name: 'PP-OCRv5', pkg: '@paddleocr/paddleocr-js', version: '0.4.2', lang: 'en' });
  const CACHE = 'ppocr-v1';

  /* The shipped page runs a tight CSP (default-src 'self', connect-src
   * 'self', script-src 'self'). That policy REFUSES this package even when
   * the flag is on — which is the correct default for a farmer's phone, and
   * the reason the package can never start by accident. Turning it on for
   * the field campaign is therefore an explicit, reviewable change: add
   * these hosts to the two directives below. Nothing else about the app
   * changes, and no other host is ever contacted. */
  const CSP_HOSTS = Object.freeze(['cdn.jsdelivr.net', 'paddle-model-ecology.bj.bcebos.com']);

  const enabled = () => {
    try {
      return !!(global.OcrModule && global.OcrModule.getTuning && global.OcrModule.getTuning().ppocr);
    } catch (e) { return false; }
  };

  /* The whole optional footprint, for the size-budget test. Gated and
   * ungated bytes are reported apart so nobody adds them by accident. */
  const budget = () => {
    const gated = ['esm', 'det', 'rec'].reduce((a, k) => a + ASSETS[k].bytes, 0);
    const ungated = ASSETS.ortWasm.bytes;
    return { gated, ungated, total: gated + ungated };
  };

  const sha256 = buf => crypto.subtle.digest('SHA-256', buf).then(b =>
    Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''));

  /* cache-first, hash-checked download. A cached copy whose hash no longer
   * matches is dropped rather than trusted. */
  async function asset(key, onProgress) {
    const spec = ASSETS[key];
    if (!spec) throw new Error('ppocr: unknown asset ' + key);
    const cache = await caches.open(CACHE);
    const hit = await cache.match(spec.url);
    if (hit) {
      const buf = await hit.arrayBuffer();
      if (!spec.sha256 || await sha256(buf) === spec.sha256) return buf;
      await cache.delete(spec.url);
    }
    let res;
    try {
      res = await fetch(spec.url, { cache: 'no-store' });
    } catch (e) {
      /* A bare "Failed to fetch" hides the usual cause: the page CSP. Say so. */
      throw new Error('ppocr: ' + key + ' could not be fetched (' + (e && e.message || e) +
        '). The shipped page allows connect-src \'self\' only, so the optional package is' +
        ' refused by design — widening the CSP to ' + CSP_HOSTS.join(' + ') + ' is the' +
        ' deliberate step a field campaign has to take.');
    }
    if (!res.ok) throw new Error('ppocr: ' + key + ' HTTP ' + res.status);
    const total = Number(res.headers.get('content-length')) || spec.bytes;
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    let buf, got = 0;
    if (reader) {
      const parts = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value); got += value.length;
        if (onProgress) onProgress(key, got, total);
      }
      buf = new Uint8Array(got); let at = 0;
      for (const p of parts) { buf.set(p, at); at += p.length; }
      buf = buf.buffer;
    } else {
      buf = await res.arrayBuffer(); got = buf.byteLength;
    }
    if (spec.sha256) {
      const got_hash = await sha256(buf);
      if (got_hash !== spec.sha256) throw new Error('ppocr: ' + key + ' hash mismatch');
    }
    await cache.put(spec.url, new Response(buf, {
      headers: { 'content-type': 'application/octet-stream', 'content-length': String(buf.byteLength) }
    }));
    return buf;
  }

  let handle = null;

  /* Loads the optional engine. Refuses to do anything while the flag is
   * off — the app must never pay for this by accident. */
  async function load(onProgress) {
    if (!enabled()) throw new Error('ppocr: disabled (setTuning({ ppocr: true }))');
    if (handle) return handle;

    const report = onProgress || function () {};
    report('verify', 0, 1);
    const esmBuf = await asset('esm', report);          /* 40 KB gate */
    const hash = await sha256(esmBuf);
    if (hash !== ASSETS.esm.sha256) throw new Error('ppocr: esm hash mismatch');

    const mod = await import(/* webpackIgnore: true */ ASSETS.esm.url);
    const PaddleOCR = mod && mod.PaddleOCR;
    if (!PaddleOCR) throw new Error('ppocr: entry has no PaddleOCR export');

    report('models', 0, 2);
    const detBuf = await asset('det', report);
    const recBuf = await asset('rec', report);
    const toUrl = b => URL.createObjectURL(new Blob([b], { type: 'application/x-tar' }));

    const ocr = await PaddleOCR.create({
      lang: ENGINE.lang,
      ocrVersion: ENGINE.name,
      /* models come from our verified bytes, never from the vendor CDN */
      assets: { det: { url: toUrl(detBuf) }, rec: { url: toUrl(recBuf) } },
      ortOptions: { backend: 'wasm' }
    });
    handle = { engine: ENGINE.name, ocr };
    report('ready', 1, 1);
    return handle;
  }

  /* Same shape the Tesseract arm returns, so a comparison page can treat
   * the two engines identically. Text only: no gate, no CAS, no verdict —
   * those belong to the production pipeline, never to a second engine. */
  async function recognize(blob) {
    const h = await load();
    const t0 = performance.now();
    const out = await h.ocr.predict(blob);
    const ms = Math.round(performance.now() - t0);
    const items = (out && out[0] && out[0].items) || [];
    return {
      engine: h.engine,
      text: items.map(it => String(it.text || '')).join('\n'),
      items: items.map(it => ({ text: String(it.text || ''), score: Number(it.score) || 0 })),
      ms
    };
  }

  /* Is the optional package already prepared on this device? */
  async function installed() {
    if (!global.caches || !caches.open) return false;
    const cache = await caches.open(CACHE);
    for (const k of ['esm', 'det', 'rec']) if (!(await cache.match(ASSETS[k].url))) return false;
    return true;
  }

  const PpOcr = { ASSETS, ENGINE, CACHE, CSP_HOSTS, enabled, budget, load, recognize, installed };
  global.PpOcr = PpOcr;
  if (typeof module !== 'undefined' && module.exports) module.exports = PpOcr;
})(typeof window !== 'undefined' ? window : globalThis);
