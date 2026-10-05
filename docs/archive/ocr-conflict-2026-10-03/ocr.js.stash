/*
 * ocr.js — محرك القراءة الضوئية المحلي (OCR) للمستشار الزراعي
 * ---------------------------------------------------------------
 * Phase 1 offline OCR, lazy-loaded only when the user scans a label.
 * This module contains NO search logic: it hands candidate text back
 * to src/app.js, which runs the EXISTING SearchCore search (the 80%
 * minimum threshold and Libya248→500→EU→EPA priority are unchanged).
 *
 * Engine: Tesseract.js v6.0.1, pinned and self-hosted in vendor/tesseract
 * (no CDN at runtime). Recognition runs inside a Web Worker via
 * tesseract.js, so the UI thread never blocks. Core + language data
 * are cached by the service worker (v4) and reused offline.
 *
 * Preprocessing (all in-canvas, original File is never modified):
 *   EXIF orientation fix -> max-dimension cap -> grayscale ->
 *   percentile contrast stretch -> unsharp sharpen -> upscale small text.
 */
(function (global) {
  'use strict';

  const OCR = {
    CORE: 'vendor/tesseract/core',
    LANG: 'vendor/tesseract/lang',
    // max dimension of the image handed to the engine (memory safety)
    MAX_DIM: 1600,
    // below this, small text is upscaled to improve recognition
    UPSCALE_MIN: 1100,
    // generous ceiling (target long side after upscale)
    UPSCALE_MAX: 2000
  };

  let workerPromise = null;   // singleton worker, reused across scans
  let progressSink = null;    // latest onProgress: the reused worker's logger
                              // must report to the CURRENT scan, not the first

  /* ---------------- preprocessing ---------------- */

  async function preprocess(file) {
    let bitmap;
    if (global.createImageBitmap) {
      // EXIF-aware decode on browsers that support the option
      try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (e) { bitmap = await createImageBitmap(file); }
    } else {
      bitmap = await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = URL.createObjectURL(file);
      });
    }
    let w = bitmap.width, h = bitmap.height;
    // 1) cap huge photos
    const scale = Math.min(1, OCR.MAX_DIM / Math.max(w, h));
    // 2) upscale small images (small label text)
    let target = scale;
    if (scale === 1 && Math.min(w, h) < OCR.UPSCALE_MIN) {
      target = Math.min(OCR.UPSCALE_MAX / Math.max(w, h), OCR.UPSCALE_MIN / Math.min(w, h));
    }
    const dw = Math.max(1, Math.round(w * target));
    const dh = Math.max(1, Math.round(h * target));
    const canvas = document.createElement('canvas');
    canvas.width = dw; canvas.height = dh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, dw, dh);
    if (bitmap.close) bitmap.close();

    // 3) grayscale + percentile contrast stretch + sharpen, in one pass
    const img = ctx.getImageData(0, 0, dw, dh);
    const d = img.data;
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
      d[i] = d[i + 1] = d[i + 2] = g;
      hist[g]++;
    }
    // percentile bounds (2%..98%)
    const total = dw * dh;
    let lo = 0, hi = 255, acc = 0;
    const loCut = total * 0.02, hiCut = total * 0.98;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= loCut) { lo = v; break; } }
    acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= hiCut) { hi = v; break; } }
    if (hi <= lo) { lo = 0; hi = 255; }
    const range = hi - lo;
    // contrast map
    const map = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) map[v] = Math.max(0, Math.min(255, (v - lo) * 255 / range));
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = map[d[i]];
    ctx.putImageData(img, 0, 0);

    // 4) unsharp sharpen: out = c*(1+2k) - 4 neighbors*k, k=0.35
    const src = ctx.getImageData(0, 0, dw, dh);
    const s = src.data, out = ctx.createImageData(dw, dh), o = out.data;
    const k = 0.35;
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const i = (y * dw + x) * 4;
        const xm = (x > 0 ? x - 1 : x), xp = (x < dw - 1 ? x + 1 : x);
        const ym = (y > 0 ? y - 1 : y), yp = (y < dh - 1 ? y + 1 : y);
        const c = s[i];
        const sharp = c * (1 + 4 * k)
          - k * (s[(y * dw + xm) * 4] + s[(y * dw + xp) * 4]
               + s[(ym * dw + x) * 4] + s[(yp * dw + x) * 4]);
        const v = Math.max(0, Math.min(255, sharp));
        o[i] = o[i + 1] = o[i + 2] = v; o[i + 3] = 255;
    }
    }
    ctx.putImageData(out, 0, 0);
    return canvas;
  }

  /* ---------------- candidate extraction ---------------- */

  /* CAS numbers are digits — they survive blur better than letters,
     so they are extracted first and searched exactly (100% fast path).

     Real labels defeat the strict regex in two ways, handled here:
       1. OCR inserts spaces inside the number ("1071 - 83 - 6",
          "1 071-83-6")
       2. OCR confuses digit-like glyphs (O/0, I/l/1, S/5, B/8, Z/2, G/6)
     We therefore normalize a digit-heavy copy of the text and match a
     relaxed pattern, WITHOUT touching the original text used for name
     candidates. Nothing is invented: a match must still look like a
     full CAS group after normalization. */
  function extractCAS(text) {
    const raw = String(text || '');
    const found = new Set();

    // pass 1: strict matches on the original text (\b prevents substring
    // artifacts like "71-83-6" out of "IO71-83-6")
    for (const m of raw.match(/\b\d{2,7}-\d{2}-\d\b/g) || []) found.add(m);

    // pass 2: digit-context normalization for OCR-confusable glyphs
    // (only O,I,l,S,B,Z,G adjacent to digits are remapped)
    const digitized = raw.replace(/\b([\dOIlSBZG])[\dOIlSBZG\s-]*([\dOIlSBZG])/g, seg =>
      seg.replace(/O/g, '0').replace(/[Il]/g, '1').replace(/S/g, '5')
         .replace(/B/g, '8').replace(/Z/g, '2').replace(/G/g, '6'))
      .replace(/(\d)\s*-\s*(\d)/g, '$1-$2')   // "1071 - 83 - 6" -> "1071-83-6"
      .replace(/(\d) (?=\d)/g, '$1');          // "1 071-83-6"  -> "1071-83-6"
    const groups = digitized.match(/\b\d{2,7}-\d{2}-\d\b/g) || [];
    for (const m of groups) found.add(m);
    // pass 3: an S-shaped glyph can be a misread 3 as well as 5
    // ("1O71-8S-6"). The database validates candidates — a wrong variant
    // simply matches nothing — so both readings are kept.
    for (const m of groups) if (m.includes('5')) found.add(m.replace(/5/g, '3'));

    // keep only plausible groups (checksum-free sanity: nonzero last digit)
    return [...found].filter(c => !/^(0+|-)/.test(c));
  }

  /* Clean OCR lines and build short name candidates (1-3 words).
     Filters obvious non-names (long digits-only noise, single chars). */
  function extractCandidates(text) {
    const lines = String(text || '')
      .split(/\r?\n/).map(l => l.trim())
      .filter(l => l.length >= 4 && l.length <= 60 && /[A-Za-z\u0600-\u06FF]{3,}/.test(l));
    /* Dense labels spend the 12-candidate cap on the trade name and legal
       text before reaching the "ACTIVE INGREDIENT" section (proven case:
       "BIFEN XTS" — Bifenthrin never reached SearchCore). Give that
       section priority: the header line plus the next two lines (the
       chemical name and its concentration; a "% by wt." column often
       sits between them) are scanned first. Ordering only — no candidate
       is added, removed, or scored differently. */
    const isAI = l => /active\s*ingredients?/i.test(l) && !/\bin\s*active/i.test(l);
    const prio = new Set();
    for (let i = 0; i < lines.length; i++) {
      if (isAI(lines[i])) {
        prio.add(lines[i]);
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) prio.add(lines[j]);
      }
    }
    const ordered = [...prio, ...lines.filter(l => !prio.has(l))];
    const cands = new Set();
    for (const line of ordered) {
      const clean = line.replace(/[^\w\s\u0600-\u06FF.-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length >= 4) cands.add(clean);
      const words = clean.split(' ').filter(w => w.length >= 4 && /[A-Za-z\u0600-\u06FF]/.test(w) && !/^\d+$/.test(w));
      for (const w of words) cands.add(w);
      for (let i = 0; i + 1 < words.length; i++) cands.add(words[i] + ' ' + words[i + 1]);
      for (let i = 0; i + 2 < words.length; i++) cands.add(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
    }
    return [...cands].slice(0, 12);
  }

  /* ---------------- tesseract worker ---------------- */

  function ensureWorker(onProgress) {
    // Route this scan's progress into the (possibly already-created)
    // worker's logger. Without this, scans 2..n of a reused worker would
    // report to the first scan's stale closure and show no progress.
    progressSink = onProgress || progressSink || (() => {});
    if (workerPromise) return workerPromise;
    workerPromise = new Promise((resolve, reject) => {
      if (typeof Tesseract === 'undefined') {
        reject(new Error('tesseract.js is not loaded'));
        return;
      }
      resolve(Tesseract.createWorker(
        'eng+ara',                       // langs: both, one warm-up
        1,                               // OEM: LSTM only (matches the vendored core)
        {
          workerPath: 'vendor/tesseract/worker.min.js',
          corePath: OCR.CORE,
          langPath: OCR.LANG,
          gzip: true,
          cacheMethod: 'none',           // SW v4 owns caching (no refreshCost)
          logger: m => { if (progressSink) progressSink(m); }
        }
      ));
    });
    /* A failed init (e.g. a very first scan made offline, before the OCR
       assets were ever cached) must not poison every future scan: reset
       so the next attempt creates a fresh worker once assets exist. */
    workerPromise.catch(() => { workerPromise = null; });
    return workerPromise;
  }

  /* ---------------- public API ---------------- */

  /* Run OCR on a File/Blob. onProgress({status, progress}) in Arabic. */
  async function recognize(file, onProgress) {
    const progress = onProgress || (() => {});
    progress({ status: 'prep', progress: 0 });
    const canvas = await preprocess(file);
    progress({ status: 'init', progress: 0.05 });

    const worker = await ensureWorker(m => {
      if (m && m.status) {
        const map = {
          'loading tesseract core':   ['تحميل محرك القراءة…', 0.15],
          'initializing tesseract':   ['تهيئة المحرك…', 0.3],
          'loading language traineddata': ['تحميل بيانات اللغة…', 0.45],
          'initializing api':         ['بدء القراءة…', 0.55],
          'recognizing text':         ['جارٍ قراءة النص…', 0.6]
        };
        const hit = map[m.status];
        if (hit) progress({ status: hit[0], progress: m.progress
          ? hit[1] + m.progress * (m.status === 'recognizing text' ? 0.4 : 0.12)
          : hit[1] });
      }
    });

    progress({ status: 'جارٍ قراءة النص…', progress: 0.6 });
    let res = await worker.recognize(canvas);
    progress({ status: 'جارٍ قراءة النص…', progress: 0.95 });

    let text = (res && res.data && res.data.text) || '';
    let conf = res && res.data && typeof res.data.confidence === 'number'
      ? res.data.confidence : null;

    /* Bounded rotation retry: labels photographed upside-down or sideways
       are common. Retries 180°, then 90°/270° ONLY when the first pass is
       weak. "Weak" never triggers on a scan that already yielded a valid
       CAS group (CAS-first, exactly like the search) or ≥2 word-like
       tokens — this prevents gibberish from a rotated re-pass ever
       replacing a good first read. Pass quality is also CAS-first, so a
       rotated pass can only win by reading MORE word-like tokens or a CAS
       that the upright pass missed. */
    const nonSpace = t => String(t || '').replace(/\s/g, '').length;
    const wordish = t => (String(t || '').match(/[A-Za-z\u0600-\u06FF]{4,}/g) || []).length;
    const casCount = t => extractCAS(t).length;
    const quality = t => casCount(t) * 100 + Math.min(wordish(t), 6) * 10 + Math.min(nonSpace(t), 200) / 100;
    const weak = casCount(text) === 0 && (nonSpace(text) < 6 || wordish(text) < 2 || (conf !== null && conf < 40));
    if (weak) {
      const angles = [Math.PI, Math.PI / 2, -Math.PI / 2];
      const labels = ['إعادة المحاولة باتجاه معكوس…', 'إعادة المحاولة بوضع عمودي…', 'إعادة المحاولة بوضع عمودي…'];
      for (let a = 0; a < angles.length; a++) {
        progress({ status: labels[a], progress: 0.7 + a * 0.05 });
        const rot = document.createElement('canvas');
        rot.width = a === 0 ? canvas.width : canvas.height;
        rot.height = a === 0 ? canvas.height : canvas.width;
        const rx = rot.getContext('2d', { willReadFrequently: true });
        rx.translate(rot.width / 2, rot.height / 2);
        rx.rotate(angles[a]);
        rx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        try {
          const res2 = await worker.recognize(rot);
          const text2 = (res2 && res2.data && res2.data.text) || '';
          const conf2 = res2 && res2.data && typeof res2.data.confidence === 'number'
            ? res2.data.confidence : null;
          // a pass wins only by clearly better quality (CAS-first)
          if (quality(text2) > quality(text)) { res = res2; text = text2; conf = conf2; }
          // strong result: stop retrying
          if (casCount(text) > 0 || wordish(text) >= 2) break;
        } catch (e) { /* keep best result so far */ }
      }
    }
    progress({ status: 'done', progress: 1 });

    return {
      text,
      cas: extractCAS(text),
      candidates: extractCandidates(text),
      confidence: conf
    };
  }

  /* Prefetch all OCR assets into the dedicated OCR cache (offline
     readiness). 'mustashar-ocr' is permanent: service-worker updates
     (mustashar-v5, v6, …) never delete it, so a one-time preparation
     keeps offline OCR working across future app updates. */
  async function prefetch() {
    const assets = [
      'vendor/tesseract/tesseract.min.js',
      'vendor/tesseract/worker.min.js',
      OCR.CORE + '/tesseract-core-simd-lstm.wasm.js',
      OCR.CORE + '/tesseract-core-simd-lstm.wasm',
      OCR.CORE + '/tesseract-core-lstm.wasm.js',
      OCR.CORE + '/tesseract-core-lstm.wasm',
      OCR.LANG + '/eng.traineddata.gz',
      OCR.LANG + '/ara.traineddata.gz'
    ];
    const cache = await caches.open('mustashar-ocr');
    let n = 0;
    for (const a of assets) {
      try { await cache.add(new Request(a, { cache: 'reload' })); n++; } catch (e) { /* keep going */ }
    }
    return n;
  }

  global.OcrModule = { recognize, preprocess, extractCAS, extractCandidates, prefetch, OCR };
})(typeof window !== 'undefined' ? window : globalThis);
