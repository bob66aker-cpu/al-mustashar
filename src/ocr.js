/*
 * ocr.js — OCR V2: multi-pass, database-aware OCR for the Agricultural Advisor
 * ---------------------------------------------------------------------------
 * Builds on the f2359a8 Phase-1 engine (same self-hosted Tesseract.js v6.0.1
 * assets, eng-only languages — see docs/ocr-arabic-hallucination-diagnosis.md, same worker reuse, same CAS-first policy,
 * same preprocessing quality gates, same 80% search threshold which lives in
 * SearchCore and is NOT touched here).
 *
 * V2 additions:
 *   - preprocessing VARIANTS (original / grayscale+stretch / adaptive /
 *     global / inverted thresholds, sharpened, light-on-dark) — tested in a
 *     progressive ladder, not all at once; exact DB hits stop early.
 *   - multi-pass PSM strategy (11 sparse, 6 block, 12 sparse+OSD) with
 *     user_defined_dpi=300.
 *   - TSV word boxes -> ACTIVE INGREDIENT section detection -> ROI re-OCR of
 *     the ingredient region (header line + the lines under it).
 *   - result FUSION: name candidates are collected across ALL passes
 *     (union, AI-context first) instead of replacing earlier reads.
 *   - DATABASE-AWARE quality scoring: every pass is scored by what the four
 *     real databases confirm (exact CAS / exact name / >=96 / >=90 / >=80),
 *     weighted far above raw Tesseract confidence. A confident-but-unmatched
 *     read can never beat a lower-confidence read that the databases verify.
 *   - bounded total work: escalation ladder stops at the first exact hit;
 *     rotations (180/90/270) run only on weak/unequalized reads.
 *
 * Legal/regulatory safety is unchanged: this module never produces a legal
 * status; every candidate must be verified by SearchCore against the four
 * databases, and no CAS or name is ever "invented" past that verification.
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
    UPSCALE_MAX: 2000,
    // user_defined_dpi passed to Tesseract (synthetic but helps the layout
    // analyzer with upscaled phone photos)
    DPI: 300
  };

  let workerPromise = null;   // singleton worker, reused across scans
  let progressSink = null;    // latest onProgress: the reused worker's logger
                              // must report to the CURRENT scan, not the first
  let searchRef = null;       // injected SearchCore search fn (DB-aware scoring)
  let messages = null;        // injected i18n map for progress/status strings
  let cancelFlag = false;     // cooperative cancellation between passes

  /* status(messageKey) — emits a stable KEY (never a hardcoded UI string);
   * the app maps keys to the current language. Unknown keys pass through.
   * Re-entrancy guard: sinks may themselves call status() (the worker logger
   * routes through progressSink), which would otherwise recurse infinitely. */
  let statusBusy = false;
  function status(key, progress) {
    if (statusBusy) return;
    statusBusy = true;
    try {
      progressSink && progressSink({ statusKey: key, status: messages && messages[key] || key, progress: progress });
    } finally { statusBusy = false; }
  }

  /* ============================================================
   * Canvas variant factory — built ONCE from the original photo
   * ============================================================ */
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  /* appRoot() — URL of the app's root directory. The page may live at
   * /index.html, /src/…, /tests/… (harness) or under a subpath like
   * /<repo>/ on GitHub Pages; taking the page directory and stripping a
   * known page directory (/src/ or /tests/) keeps asset URLs inside the
   * app root in every case. */
  function appRoot() {
    const base = (global.location && global.location.href) || 'http://localhost/';
    const dir = new URL('.', base).href;   // always ends with '/'
    return dir.replace(/\/(?:src|tests)\/$/, '/');
  }

  async function decodeImage(file) {
    if (global.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (e) { return await createImageBitmap(file); }
    }
    return await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  /* Base canvas: EXIF-orientation-safe resize with small-image upscale. */
  async function baseCanvas(file) {
    const bitmap = await decodeImage(file);
    const w = bitmap.width, h = bitmap.height;
    const scale = Math.min(1, OCR.MAX_DIM / Math.max(w, h));
    let target = scale;
    if (scale === 1 && Math.min(w, h) < OCR.UPSCALE_MIN) {
      target = Math.min(OCR.UPSCALE_MAX / Math.max(w, h), OCR.UPSCALE_MIN / Math.min(w, h));
    }
    const dw = Math.max(1, Math.round(w * target));
    const dh = Math.max(1, Math.round(h * target));
    const canvas = makeCanvas(dw, dh);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, dw, dh);
    if (bitmap.close) bitmap.close();
    return canvas;
  }

  /* one-pass pixel pipeline shared by every variant (in place on a copy) */
  function grayStretch(imgData) {
    const d = imgData.data;
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
      d[i] = d[i + 1] = d[i + 2] = g;
      hist[g]++;
    }
    const total = d.length / 4;
    let lo = 0, hi = 255, acc = 0;
    const loCut = total * 0.02, hiCut = total * 0.98;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= loCut) { lo = v; break; } }
    acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= hiCut) { hi = v; break; } }
    if (hi <= lo) { lo = 0; hi = 255; }
    const range = hi - lo;
    const map = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) map[v] = Math.max(0, Math.min(255, (v - lo) * 255 / range));
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = map[d[i]];
    return imgData;
  }

  function sharpen(imgData) {
    const s = imgData.data, w = imgData.width, h = imgData.height;
    const out = new Uint8ClampedArray(s.length);
    out.set(s);
    const k = 0.35;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const xm = (x > 0 ? x - 1 : x), xp = (x < w - 1 ? x + 1 : x);
        const ym = (y > 0 ? y - 1 : y), yp = (y < h - 1 ? y + 1 : y);
        const c = s[i];
        const sharp = c * (1 + 4 * k)
          - k * (s[(y * w + xm) * 4] + s[(y * w + xp) * 4]
               + s[(ym * w + x) * 4] + s[(yp * w + x) * 4]);
        const v = Math.max(0, Math.min(255, sharp));
        out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
      }
    }
    imgData.data.set(out);
    return imgData;
  }

  /* integral-image Otsu-style GLOBAL threshold (percentile 2/98, midpoint) */
  function globalThreshold(imgData) {
    const d = imgData.data, hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
    const total = d.length / 4;
    let sum = 0; for (let v = 0; v < 256; v++) sum += v * hist[v];
    let sumB = 0, wB = 0, maxVar = -1, thr = 127;
    for (let v = 0; v < 256; v++) {
      wB += hist[v];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += v * hist[v];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > maxVar) { maxVar = between; thr = v; }
    }
    for (let i = 0; i < d.length; i += 4) {
      const b = d[i] > thr ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = b;
    }
    return imgData;
  }

  /* ADAPTIVE (local mean) threshold via integral images — survives glare
   * gradients and uneven lighting on real labels far better than Otsu. */
  function adaptiveThreshold(imgData) {
    const d = imgData.data, w = imgData.width, h = imgData.height;
    // integral image (Uint32 is enough: 1600x1600 * 255 < 2^32)
    const iw = w + 1;
    const I = new Float64Array(iw * (h + 1));
    for (let y = 0; y < h; y++) {
      let rowSum = 0;
      for (let x = 0; x < w; x++) {
        rowSum += d[(y * w + x) * 4];
        I[(y + 1) * iw + (x + 1)] = I[y * iw + (x + 1)] + rowSum;
      }
    }
    const win = Math.max(15, (Math.min(w, h) / 40) | 0) | 1;   // odd window
    const half = win >> 1;
    const t = 0.85;   // fraction of local mean -> text stays dark
    const out = new Uint8ClampedArray(d.length);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - half), y1 = Math.min(h - 1, y + half);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - half), x1 = Math.min(w - 1, x + half);
        const area = (y1 - y0 + 1) * (x1 - x0 + 1);
        const sum = I[(y1 + 1) * iw + (x1 + 1)] - I[y0 * iw + (x1 + 1)]
                  - I[(y1 + 1) * iw + x0] + I[y0 * iw + x0];
        const mean = sum / area;
        const i = (y * w + x) * 4;
        const b = d[i] < mean * t ? 0 : 255;
        out[i] = out[i + 1] = out[i + 2] = b; out[i + 3] = 255;
      }
    }
    d.set(out);
    return imgData;
  }

  function invert(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) d[i] = 255 - d[i];
    return imgData;
  }

  /* Build one variant canvas from the base (never mutates the original). */
  function buildVariant(base, name) {
    const c = makeCanvas(base.width, base.height);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(base, 0, 0);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    switch (name) {
      case 'gray':      grayStretch(img); break;
      case 'sharp':     grayStretch(img); sharpen(img); break;
      case 'adaptive':  grayStretch(img); adaptiveThreshold(img); break;
      case 'global':    grayStretch(img); globalThreshold(img); break;
      case 'invert':    grayStretch(img); globalThreshold(img); invert(img); break;
      /* dark-on-light and light-on-dark coloring for label panels that are
       * printed inverted (light text on dark band): we binarize then paint
       * pure black/white so the engine always sees high contrast. */
      case 'dark_on_light': grayStretch(img); globalThreshold(img); break;
      case 'light_on_dark': grayStretch(img); globalThreshold(img); invert(img); break;
      default: break;   // 'original' -> untouched base
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /* Progressive variant ladder: cheap/high-yield first. Escalation stops
   * early on a strong database hit, so most scans run only the first 2-3. */
  const VARIANTS = ['original', 'gray', 'sharp', 'adaptive', 'global', 'invert'];
  const PSM_LIST = [11, 6, 12];    // sparse, single block, sparse+OSD
  const DEEP_VARIANTS = ['adaptive', 'light_on_dark', 'dark_on_light', 'sharp'];

  /* ============================================================
   * OCR pass plumbing
   * ============================================================ */

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
        'eng',                           // langs: eng only — ara removal (Arabic hallucination fix, docs/ocr-arabic-hallucination-diagnosis.md)
        1,                               // OEM: LSTM only (matches the vendored core)
        {
          workerBlobURL: false,            // real same-origin worker (Blob workers cannot importScripts)
          /* App-root-relative URLs: the app root is the page URL minus its
             known directory (/src/, /tests/ or /), so GitHub Pages subpath
             deployments (/<repo>/) resolve inside the app, not at the
             origin root. 'vendor/tesseract/...' literal is pinned by the
             static suite (tests/verify.mjs). */
          workerPath: new URL('vendor/tesseract/worker.min.js', appRoot()).href,
          corePath: new URL(OCR.CORE + '/', appRoot()).href,
          langPath: new URL(OCR.LANG + '/', appRoot()).href,
          gzip: true,
          cacheMethod: 'none',           // SW owns caching (no refreshCost)
          logger: m => { if (progressSink) progressSink(m); }
        }
      ));
    });
    /* A failed init (e.g. a very first scan made offline, before the OCR
       assets were ever cached) must not poison every future scan: reset
       so the next attempt creates a fresh worker once assets exist. */
    workerPromise.catch(() => { workerPromise = null; });
    /* init watchdog: a createWorker() that never settles must not hang the
       scan forever — on timeout the half-built worker is killed and the
       error propagates (the .catch above already reset workerPromise). */
    return withTimeout(workerPromise, INIT_TIMEOUT_MS, 'worker init')
      .catch(e => { killWorker(); throw e; });
  }

  /* recognize() with explicit PSM + dpi parameters (V2 leverages the
   * Tesseract.js parameter API; setParameter is cheap between passes). */
  /* Run one recognize() under a watchdog. A wedged Tesseract worker (rare,
   * but observed after many heavy passes on the same worker) never resolves
   * its recognize() promise — without this the scan would hang forever.
   * On timeout the pass is abandoned, the poisoned worker is terminated and
   * reset so the NEXT scan starts fresh. Nothing is invented: whatever the
   * earlier passes already read is exactly what gets fused. */
  const PASS_TIMEOUT_MS = 30000;   // phone-class: a 1600px pass takes 2-8s
  const INIT_TIMEOUT_MS = 60000;   // first-pass engine init (WASM + eng)

  function withTimeout(promise, ms, label) {
    let timer = null;
    const guard = new Promise((_, rej) => {
      timer = setTimeout(() => rej(new Error('OCR pass timeout: ' + label)), ms);
    });
    return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
  }

  function killWorker() {
    if (workerPromise) workerPromise.then(w => w.terminate()).catch(() => {});
    workerPromise = null;            // next scan builds a fresh worker
  }

  async function runPass(worker, canvas, psm) {
    try {
      await withTimeout(
        worker.setParameters({ tessedit_pageseg_mode: String(psm), user_defined_dpi: String(OCR.DPI) }),
        PASS_TIMEOUT_MS, 'setParameters');
    } catch (e) { /* older builds may not support setParameters; defaults apply */ }
    let res;
    try {
      res = await withTimeout(worker.recognize(canvas), PASS_TIMEOUT_MS, 'recognize');
    } catch (e) {
      killWorker();                  // wedged or failed worker: self-heal
      throw e;
    }
    const d = (res && res.data) || {};
    const text = d.text || '';
    const conf = typeof d.confidence === 'number' ? d.confidence : null;
    // TSV words (boxes) — v6 nests them blocks→paragraphs→lines→words;
    // older builds expose a flat d.words. Recursively collect every word
    // that carries a bbox so AI-region detection works on either shape.
    const words = [];
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (node.text && node.bbox) {
        words.push({ text: node.text, conf: typeof node.confidence === 'number' ? node.confidence : 0,
                     x0: node.bbox.x0, y0: node.bbox.y0, x1: node.bbox.x1, y1: node.bbox.y1 });
      }
      for (const k of ['blocks', 'paragraphs', 'lines', 'words']) {
        if (Array.isArray(node[k])) node[k].forEach(visit);
      }
    };
    visit(d.blocks || d.words || []);
    return { text, conf, words };
  }

  /* ============================================================
   * ACTIVE INGREDIENT region detection from word boxes
   * ============================================================ */

  /* fuzzy match of a word against the AI section header words (tolerates
   * common OCR corruption: ACTVE / INGREDIENTS / ACTIVE INGREDIEN etc.) */
  function looksLikeAIWord(w) {
    const t = String(w || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!t) return false;
    if (/^ACT/.test(t) || 'ACTIVE'.startsWith(t) && t.length >= 3) return true;
    // ACTVE, ACTVIE, ATCIVE...
    const near = (a, b) => {
      if (Math.abs(a.length - b.length) > 2) return false;
      let diff = 0;
      for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diff++;
      return diff <= 2;
    };
    return near(t, 'ACTIVE') || near(t, 'INGREDIENT') || near(t, 'INGREDIENTS')
      || (t.length >= 6 && /^(INGRED|INGRD|INGRE|NGRED)/.test(t));
  }

  /* Returns { x0, y0, x1, y1 } region covering the AI header and the two
   * text lines beneath it, or null when no AI header exists in this pass. */
  function aiRegionFromWords(words, canvasW, canvasH) {
    if (!words || !words.length) return null;
    // group words into lines by vertical center
    const ws = words.slice().sort((a, b) => a.y0 - b.y0);
    const lines = [];
    for (const w of ws) {
      const cy = (w.y0 + w.y1) / 2;
      const line = lines.find(L => Math.abs(cy - L.cy) <= Math.max(12, (L.h) * 0.7));
      if (line) {
        line.words.push(w);
        line.cy = (line.cy * (line.words.length - 1) + cy) / line.words.length;
        line.h = Math.max(line.h, w.y1 - w.y0);
        line.x0 = Math.min(line.x0, w.x0);
        line.x1 = Math.max(line.x1, w.x1);
      } else {
        lines.push({ words: [w], cy, h: w.y1 - w.y0, x0: w.x0, x1: w.x1 });
      }
    }
    // find the AI header line
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      const txt = L.words.map(w => w.text).join(' ').toUpperCase();
      if (/ACTIVE/.test(txt.replace(/\s/g, '')) || L.words.some(w => looksLikeAIWord(w.text))) {
        // header + the next two lines (chemical name and concentration)
        const below = lines.slice(i + 1, i + 3);
        if (!below.length) continue;
        const x0 = Math.max(0, Math.min(L.x0, ...below.map(b => b.x0)) - 8);
        const x1 = Math.min(canvasW, Math.max(L.x1, ...below.map(b => b.x1)) + 8);
        const y0 = Math.max(0, L.words.reduce((m, w) => Math.min(m, w.y0), Infinity) - 6);
        const y1 = Math.min(canvasH, Math.max(...below.map(b => b.words.reduce((m, w) => Math.max(m, w.y1), 0))) + 6);
        if (y1 - y0 < 10) continue;
        return { x0, y0, x1, y1 };
      }
    }
    return null;
  }

  function cropCanvas(src, r) {
    const pad = 4;
    const x = Math.max(0, (r.x0 | 0) - pad), y = Math.max(0, (r.y0 | 0) - pad);
    const w = Math.min(src.width - x, (r.x1 - r.x0 | 0) + pad * 2);
    const h = Math.min(src.height - y, (r.y1 - r.y0 | 0) + pad * 2);
    if (w < 8 || h < 8) return null;
    // upscale ROI: the ingredient line is small on real labels — give the
    // engine 2x pixels for this region only (cheap: the region is tiny)
    const scale = Math.min(2, Math.max(1, 1200 / Math.max(w, h)));
    const c = makeCanvas(Math.round(w * scale), Math.round(h * scale));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, x, y, w, h, 0, 0, c.width, c.height);
    return c;
  }

  /* ============================================================
   * CAS extraction — preserved verbatim from the audited f2359a8 engine
   * (strict pass, digit-confusion normalization, S/3 ambiguity: DB validates)
   * ============================================================ */
  function extractCAS(text) {
    const raw = String(text || '');
    const found = new Set();

    /* Regulatory numbers that merely LOOK like a CAS (EPA Reg. No., Batch,
     * Lot No.) must never donate a CAS candidate — a batch number is not a
     * chemical identity and treating it as one would invent a match. */
    const junkCASLine = l => /\b(batch|lot\s*no|epa\s*reg|reg\.?\s*no)\b/i.test(l);

    /* Fuzzy junk-token guard: OCR frequently mangles regulatory keywords
     * ("Batch" -> "8atch"/"Batc h"), which would otherwise slip past the
     * strict filter and donate a batch/reg number as a CAS candidate.
     * When a (possibly corrupted) junk token is found AND a CAS-shaped
     * group follows it, only the text BEFORE the token is scanned — the
     * group after the token is regulatory numbering, not a CAS. Lines
     * without a following group are unaffected, so legitimate CAS lines
     * are never truncated. */
    const del1 = (s, i) => s.slice(0, i) + s.slice(i + 1);
    const nearJunk = (w, t) => {
      if (w === t) return true;
      if (Math.abs(w.length - t.length) > 1) return false;
      if (w.length === t.length) {
        let d = 0;
        for (let i = 0; i < w.length; i++) if (w[i] !== t[i]) d++;
        if (d <= 1) return true;
        for (let i = 0; i < w.length; i++) if (del1(w, i) === t) return true;
        return false;
      }
      const L = w.length > t.length ? w : t, S = w.length > t.length ? t : w;
      for (let i = 0; i < L.length; i++) if (del1(L, i) === S) return true;
      return false;
    };
    const junkTokenAt = l => {
      const words = l.split(/[\s:;.,]+/).filter(Boolean);
      const letters = w => w.replace(/[^A-Za-z]/g, '').toLowerCase();
      const isCasKw = w => w === 'cas' || (w.length === 3 && (del1(w, 0) === 'as' || del1(w, 1) === 'cs' || del1(w, 2) === 'ca'));
      for (let i = 0; i < words.length; i++) {
        const w = letters(words[i]);
        if (!w) continue;
        const prev = i > 0 ? letters(words[i - 1]) : '';
        /* "No" is only regulatory after Reg/EPA — a plain "CAS No. x" line
         * must survive untouched, so "no" after "cas" never truncates. */
        const junk = w === 'no'
          ? (nearJunk(prev, 'reg') || nearJunk(prev, 'epa'))
          : (nearJunk(w, 'batch') || nearJunk(w, 'lot') || nearJunk(w, 'reg') || nearJunk(w, 'epa'));
        const rest = words.slice(i + 1);
        /* a CAS keyword AFTER the junk token re-establishes chemistry
           context for the rest of the line ("Plot 5 CAS x-y-z") */
        if (junk && !rest.some(t => isCasKw(letters(t)))
          && /\d{2,7}-\d{2}-\d/.test(rest.join(' ')))
          return words.slice(0, i).join(' ');
      }
      return null;
    };

    for (const line of raw.split(/\r?\n/)) {
      if (junkCASLine(line)) continue;
      const junkPrefix = junkTokenAt(line);
      const scanText = junkPrefix === null ? line : junkPrefix;

      for (const m of scanText.match(/\b\d{2,7}-\d{2}-\d\b/g) || []) found.add(m);

      const digitized = scanText.replace(/\b([\dOIlSBZG])[\dOIlSBZG\s-]*([\dOIlSBZG])/g, seg =>
        seg.replace(/O/g, '0').replace(/[Il]/g, '1').replace(/S/g, '5')
           .replace(/B/g, '8').replace(/Z/g, '2').replace(/G/g, '6'))
        .replace(/(\d)\s*-\s*(\d)/g, '$1-$2')
        .replace(/(\d) (?=\d)/g, '$1');
      const groups = digitized.match(/\b\d{2,7}-\d{2}-\d\b/g) || [];
      for (const m of groups) found.add(m);
      for (const m of groups) if (m.includes('5')) found.add(m.replace(/5/g, '3'));
    }

    return [...found].filter(c => !/^(0+|-)/.test(c));
  }

  /* ============================================================
   * Candidate extraction V2 — AI-priority, fusion-aware
   * ============================================================ */

  /* junk vocabulary — never considered active ingredients on its own.
   * These lines/words are filtered OUT unless a DB search confirms them. */
  const JUNK = /epa\s*reg|reg\s*no|batch|lot\s*no|manufactur|address|telephone|tel[:.]|percent|wt\.?|insecticide|herbicide|fungicide|rodenticide|net\s*(weight|contents)|keep\s*out|children|poison|danger|warning|caution|first\s*aid|company|co\.|ltd|inc\.|crop|active\s*ingredient/i;

  /* build candidate set for ONE text (used per-pass and for fusion) */
  function extractCandidates(text, opts) {
    opts = opts || {};
    const raw = String(text || '').split(/\r?\n/).map(l => l.trim());
    const isAI = l => /active\s*ingredients?/i.test(l) && !/\bin\s*active/i.test(l);
    /* A line is in the AI context when it is the section header itself or
       one of the two lines right after it (the chemical name and its
       concentration; a "% by wt." column often sits between them). */
    const aiCtx = raw.map((l, i) =>
      isAI(l) || (i >= 1 && isAI(raw[i - 1])) || (i >= 2 && isAI(raw[i - 2])));
    const lines = [], lineCtx = [];
    raw.forEach((l, i) => {
      const min = aiCtx[i] ? 3 : 4;
      if (l.length >= min && l.length <= 60 && /[A-Za-z\u0600-\u06FF]{3,}/.test(l)) {
        lines.push(l);
        lineCtx.push(aiCtx[i]);
      }
    });
    const prio = new Set();
    for (let i = 0; i < lines.length; i++) {
      if (isAI(lines[i])) {
        prio.add(lines[i]);
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) prio.add(lines[j]);
      }
    }
    const ctxOf = new Map();
    lines.forEach((l, i) => { if (!ctxOf.has(l)) ctxOf.set(l, lineCtx[i]); });
    const ordered = [...prio, ...lines.filter(l => !prio.has(l))];
    const cands = new Set();
    for (const line of ordered) {
      const ai = !!ctxOf.get(line);
      const min = ai ? 3 : 4;
      if (opts.filterJunk && !ai && JUNK.test(line)) continue;   // V2: junk gate
      const clean = line.replace(/[^\w\s\u0600-\u06FF.-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length >= min) cands.add(clean);
      const words = clean.split(' ').filter(w =>
        w.length >= min &&
        /[A-Za-z\u0600-\u06FF]/.test(w) &&
        !/^\d+$/.test(w) &&
        /* In AI context only pure alphabetic words qualify for the 3-char
           floor — no digits or punctuation fragments ("75%", "wt."). */
        (ai ? /^[A-Za-z\u0600-\u06FF]+$/.test(w) : true));
      for (const w of words) cands.add(w);
      for (let i = 0; i + 1 < words.length; i++) cands.add(words[i] + ' ' + words[i + 1]);
      for (let i = 0; i + 2 < words.length; i++) cands.add(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
    }
    /* V2: a generous pool is fine — the database-aware scorer sorts the
       candidates by what the four databases actually confirm, and the
       search merges results. The cap only prevents pathological input. */
    return [...cands].slice(0, 40);
  }

  /* ============================================================
   * Database-aware quality scoring
   * ============================================================ */

  function setSearchRef(fn) { searchRef = typeof fn === 'function' ? fn : null; }

  function dbScorePass(casList, candList) {
    if (!searchRef) return { best: 0, exactName: false, exactCAS: false, type: '', name: '' };
    let best = 0, exactName = false, exactCAS = false, type = '', name = '';
    const consume = results => {
      for (const x of results || []) {
        if (x.s.v > best) { best = x.s.v; type = x.s.type || ''; name = x.r.name || ''; }
        if (x.s.v >= 100) {
          if (x.s.type === 'اسم مطابق') exactName = true;
          if (String(x.s.type || '').includes('CAS')) exactCAS = true;
        }
      }
    };
    for (const cas of casList || []) consume(searchRef(cas, true));
    for (const c of candList || []) consume(searchRef(c, false));
    return { best, exactName, exactCAS, type, name };
  }

  /* composite score: DB verification dominates raw OCR confidence */
  function passScore(db, conf) {
    let s = db.best;                       // 0..100 from the four databases
    if (db.exactCAS) s += 250;
    else if (db.exactName) s += 200;
    else if (db.best >= 96) s += 150;
    else if (db.best >= 90) s += 100;
    else if (db.best >= 80) s += 50;
    s += Math.min(conf || 0, 100) * 0.3;   // tie-breaker only
    return s;
  }

  /* ============================================================
   * Main recognize() — progressive multi-pass with early exit
   * ============================================================ */

  async function recognize(file, onProgress, options) {
    const progress = onProgress || (() => {});
    const opts = options || {};
    if (opts.search) setSearchRef(opts.search);
    if (opts.messages) messages = opts.messages;
    cancelFlag = false;

    status('ocr.prep', 0);
    const base = await baseCanvas(file);

    status('ocr.init', 0.04);
    const worker = await ensureWorker(m => {
      if (m && m.statusKey) return;                       // already an app status event
      if (m && m.status === 'recognizing text') return;   // pass progress reported per-pass
      if (m && m.status) status('ocr.loading', 0.04 + (m.progress || 0) * 0.06);
    });

    const t0 = (global.performance || Date).now ? (global.performance || Date).now() : Date.now();

    /* One watchdog for the whole scan: a wedged Tesseract init (rare, but
       observed after heavy reuse) never resolves createWorker — without
       this the scan would hang forever, stalling every later case.
       The budget is device-aware (user decision د4): low-memory / coarse-
       pointer devices get a shorter budget so a farmer is never stuck
       for 3 minutes; a desktop may use the full allowance. */
    const lowEnd = (() => {
      try {
        if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
        return matchMedia('(pointer: coarse)').matches;
      } catch (e) { return false; }
    })();
    const SCAN_TIMEOUT_MS = Math.min(180000, lowEnd ? 60000 : 100000);
    opts.scanBudget = SCAN_TIMEOUT_MS;
    const scanGuard = { timer: null };
    const scanTimeout = new Promise((_, rej) => {
      scanGuard.timer = setTimeout(() => {
        killWorker();
        rej(new Error('Scan timeout: OCR worker did not finish'));
      }, SCAN_TIMEOUT_MS);
    });
    const scanRace = p => Promise.race([p, scanTimeout]);
    const finishScan = () => { if (scanGuard.timer) clearTimeout(scanGuard.timer); };

    try {
      return await scanRace(recognizeInner());
    } finally { finishScan(); }

    async function recognizeInner() {      /* ---------- pass queue ---------- */
    // fast lane: 2 quick passes on the two highest-yield variants
    // deep lane: remaining variants + rotations, only if needed
    const CANCELLED = 'ocr.cancelled';
    const ensureNotCancelled = () => { if (cancelFlag) throw new Error(CANCELLED); };
    const queue = [];
    for (const psm of [11, 6]) queue.push({ variant: 'original', psm, lane: 'fast' });
    for (const v of ['gray', 'sharp']) for (const psm of [11, 6]) queue.push({ variant: v, psm, lane: 'deep1' });
    for (const v of ['adaptive', 'global', 'invert']) queue.push({ variant: v, psm: 11, lane: 'deep2' });
    for (const v of DEEP_VARIANTS) for (const psm of PSM_LIST) {
      if (!queue.some(q => q.variant === v && q.psm === psm)) queue.push({ variant: v, psm, lane: 'deep3' });
    }

    let bestPass = null;          // highest composite score
    let bestCanvas = null;        // canvas of the best pass (for ROI)
    let bestResult = null;
    let fusionText = [];          // every pass's text (fusion)
    let fusionCandidates = new Set();
    let fusionCAS = new Set();
    let aiRect = null;            // detected ACTIVE INGREDIENT region (base coords)
    let passCount = 0;
    let exactHit = false;

    const variantCache = new Map();
    const getVariant = name => {
      if (name === 'original') return base;
      if (!variantCache.has(name)) {
        const v = buildVariant(base, name);
        variantCache.set(name, v);
      }
      return variantCache.get(name);
    };

    const releaseVariants = () => {
      for (const c of variantCache.values()) { c.width = 0; c.height = 0; }
      variantCache.clear();
    };

    try {
      const MAX_PASSES = 14;      // bounded work: never all variants × all PSMs
      for (const item of queue) {
        if (passCount >= MAX_PASSES) break;
        if (exactHit && item.lane !== 'fast') break;   // early exit on exact DB hit
        ensureNotCancelled();
        passCount++;
        const canvas = getVariant(item.variant);
        const share = 0.06 + Math.min(0.5, passCount * 0.05);
        status('ocr.pass', share);

        let pass;
        try { pass = await runPass(worker, canvas, item.psm); }
        catch (e) { if (!workerPromise) break; continue; }   // worker killed: stop escalating

        const cas = extractCAS(pass.text);
        const cands = extractCandidates(pass.text, { filterJunk: true });
        const db = dbScorePass(cas, cands);
        const score = passScore(db, pass.conf);
        fusionText.push(pass.text);
        for (const c of cas) fusionCAS.add(c);
        for (const c of cands) fusionCandidates.add(c);

        if (!bestPass || score > bestPass.score) {
          bestPass = { score, db, conf: pass.conf, variant: item.variant, psm: item.psm };
          bestCanvas = canvas;
          bestResult = pass;
        }
        // remember the AI region from any pass that saw the header
        if (!aiRect && pass.words && pass.words.length) {
          aiRect = aiRegionFromWords(pass.words, canvas.width, canvas.height);
        }
        if (db.exactCAS || db.exactName || db.best >= 96) { exactHit = true; }

        /* ---------- ROI re-OCR of the ACTIVE INGREDIENT region ---------- */
        if (aiRect && !opts.noRoi) {
          const roi = cropCanvas(bestCanvas || canvas, aiRect);
          if (roi) {
            ensureNotCancelled();
            passCount++;
            status('ocr.roi', Math.min(0.6, share + 0.05));
            try {
              const r1 = await runPass(worker, roi, 6);
              const rcas = extractCAS(r1.text);
              const rcands = extractCandidates(r1.text, { filterJunk: false });
              const rdb = dbScorePass(rcas, rcands);
              const rscore = passScore(rdb, r1.conf) + 60;   // ROI priority bonus
              for (const c of rcas) fusionCAS.add(c);
              for (const c of rcands) fusionCandidates.add(c);
              fusionText.push(r1.text);
              if (!bestPass || rscore > bestPass.score) {
                bestPass = { score: rscore, db: rdb, conf: r1.conf, variant: item.variant + '+ROI', psm: item.psm };
                bestResult = r1;
              }
              if (rdb.exactCAS || rdb.exactName || rdb.best >= 96) exactHit = true;
            } catch (e) { /* ROI pass failed: main result stands */ }
          }
        }
        /* stop escalations once the databases confirm an exact active
           ingredient (the whole point of database-aware scoring) */
        if (exactHit) break;
      }
    } finally {
      releaseVariants();
    }

    /* ---------- rotations: only when still nothing exact ---------- */
    if (!exactHit) {
      const angles = [Math.PI, Math.PI / 2, -Math.PI / 2];
      for (let a = 0; a < angles.length; a++) {
        ensureNotCancelled();
        status('ocr.rotate', 0.7 + a * 0.04);
        const rot = makeCanvas(a === 0 ? base.width : base.height, a === 0 ? base.height : base.width);
        const rx = rot.getContext('2d', { willReadFrequently: true });
        rx.translate(rot.width / 2, rot.height / 2);
        rx.rotate(angles[a]);
        rx.drawImage(base, -base.width / 2, -base.height / 2);
        let pass;
        try { pass = await runPass(worker, rot, 11); }
        catch (e) { if (!workerPromise) break; continue; }   // worker killed: stop rotating
        rot.width = 0; rot.height = 0;
        const cas = extractCAS(pass.text);
        const cands = extractCandidates(pass.text, { filterJunk: true });
        const db = dbScorePass(cas, cands);
        const score = passScore(db, pass.conf) - 20;   // slight penalty vs upright
        for (const c of cas) fusionCAS.add(c);
        for (const c of cands) fusionCandidates.add(c);
        fusionText.push(pass.text);
        if (!bestPass || score > bestPass.score) {
          bestPass = { score, db, conf: pass.conf, variant: 'rot' + (a + 1), psm: 11 };
          bestResult = pass;
        }
        if (db.exactCAS || db.exactName || db.best >= 96) break;
      }
    }

    /* ---------- final fusion: rank every candidate via the databases ---------- */
    const allCandidates = [...fusionCandidates];
    const allCAS = [...fusionCAS];

    /* ---------- noise-born match gate (safety, not invention) ----------
     * Pure noise (or a photo of nothing) makes Tesseract hallucinate
     * dictionary tokens; one can coincidentally EXACTLY match a real row
     * (e.g. "Beer", libya-500) with raw confidence near zero. A match born
     * ONLY from an unstructured, low-confidence hallucination is noise,
     * not evidence — and the 80% rule alone cannot see the difference.
     *
     * Gate (all four must hold to drop a match):
     *   - no CAS found in ANY pass (no structured chemical evidence),
     *   - NO active-ingredient section detected in any pass,
     *   - the entire scan was low-confidence (< 40 — the app's own
     *     weak-read threshold),
     *   - the top candidate result is an exact (100%) name match.
     * A real label with an AI section, any CAS, or any structured pass
     * (>= 40 conf) is NEVER gated: structured exact hits always stand. */
    const anyStructuredPass = (bestResult.conf || 0) >= 40;
    if (!anyStructuredPass && !fusionCAS.size && !aiRect) {
      const top = dbScorePass(allCAS, allCandidates
        .filter(c => !/^\s*(active\s*ingredients?|ingredients?)\s*$/i.test(c)));
      if (top.type === 'اسم مطابق') {
        fusionCandidates.clear();
      }
    }

    const bestDb = dbScorePass(allCAS, allCandidates);
    if (!bestPass) {
      status('ocr.done', 1);
      return { text: '', cas: [], candidates: [], confidence: null, passes: 0, best: bestDb, aiRegion: false };
    }

    /* drop candidates that only echo the AI section header itself */
    const ranked = allCandidates.filter(c =>
      !/^\s*(active\s*ingredients?|ingredients?)\s*$/i.test(c));
    const text = fusionText.filter(Boolean).join('\n');

    /* Latin-ratio gate (ج) + confidence floor (أ4) — final barrier before
     * any output leaves the engine: a merged text below 60% Latin among
     * non-space characters is rejected wholesale with «لم يُستخرج نص موثوق»,
     * and so is unstructured text whose overall read confidence is below
     * MIN_CONFIDENCE (noise/logo/trade-junk shapes). Structured evidence
     * (CAS / AI region) keeps precedence over BOTH gates. Kept OFF the
     * rotate/invert passes themselves (ب). */
    const rejected = rejectedTextReason(text, {
      conf: bestResult.conf,
      structured: fusionCAS.size > 0 || !!aiRect
    });
    if (rejected) {
      status('ocr.done', 1);
      return {
        text: '', cas: [], candidates: [], confidence: null,
        passes: passCount, variant: bestPass.variant, psm: bestPass.psm,
        best: bestDb, aiRegion: !!aiRect, rejected
      };
    }

    status('ocr.done', 1);
    return {
      text,
      cas: allCAS,
      candidates: ranked,
      confidence: bestResult.conf,
      passes: passCount,
      variant: bestPass.variant,
      psm: bestPass.psm,
      best: bestDb,
      aiRegion: !!aiRect
    };
  }
  }

  /* Cancel a running scan cooperatively: the next pass boundary throws.
   * Nothing is invented — whatever completed earlier is simply discarded. */
  function cancelCurrent() { cancelFlag = true; }

  /* د2 — unified engine interface (transducer). Image in, lines+words+cas
   * out; wraps recognize() without changing its behavior. Consumers can
   * rely on this shape regardless of the engine behind it (also used by
   * the alt-engine experiment branch). */
  /* Latin-ratio filter (ج): any extracted text where Latin letters make up
   * less than 60% of non-space characters is rejected outright — the label
   * photos are foreign/English, so a heavy Arabic share can only be
   * hallucination leakage (see docs/ocr-arabic-hallucination-diagnosis.md).
   * Used as the final gate of recognize() and on the engine interface's
   * text output; unrelated pipelines (e.g. manual text) are untouched. */
  /* Confidence floor for unstructured reads (أ4): chosen empirically from
   * the live suite — dense noise completed at confidence 24 while every
   * real/synthetic label case read at >= 90 (see
   * docs/ocr-arabic-hallucination-diagnosis.md and
   * docs/ocr-engine-comparison.md). 45 sits far above the junk band and far
   * below the label band; raising it further risks nothing measured but is
   * not justified by current evidence. */
  const MIN_CONFIDENCE = 45;

  function latinRatio(text) {
    const chars = String(text || '').replace(/\s/g, '');
    if (!chars.length) return { ratio: 1, latin: 0, nonSpace: 0, ok: true };
    const latin = (chars.match(/[A-Za-z]/g) || []).length;
    const ratio = latin / chars.length;
    return { ratio, latin, nonSpace: chars.length, ok: ratio >= 0.6 };
  }
  function rejectedTextReason(text, meta) {
    /* Structured evidence (CAS extracted or an ACTIVE INGREDIENT region)
     * keeps its documented precedence over BOTH gates: a read that yielded
     * a valid CAS pattern or a detected AI section is database-bound
     * evidence, not hallucination material. The original Arabic-leak cases
     * (blank/noise/logo/barcode stripes) extract NO CAS, so they stay fully
     * gated. This also keeps CAS-only reads alive: "Contains: CAS 1071-83-6"
     * is ~58% Latin (digits dilute the ratio) yet is exactly the shape the
     * engine must never discard (E2E cas_* cases). */
    const structured = !!(meta && meta.structured);
    const m = latinRatio(text);
    if (!m.ok && !structured) {
      return {
        arabicLeak: true,
        ratio: Math.round(m.ratio * 100) / 100,
        latin: m.latin,
        nonSpace: m.nonSpace,
        key: 'ocr.rejected.mixed',
        message: 'لم يُستخرج نص موثوق'
      };
    }
    /* Confidence floor (أ4 — 2026-09-23): unstructured text read below
     * MIN_CONFIDENCE is rejected wholesale. Dense noise completed at raw
     * confidence 24 (documented in the diagnosis) and produced accepted-
     * shaped Latin junk; the 60% Latin gate alone cannot see it. The floor
     * applies ONLY to unstructured reads: any CAS extracted or an ACTIVE
     * INGREDIENT region detected is structured evidence, which keeps its
     * documented precedence over raw confidence (V2: database-aware scoring,
     * CAS +250) — a real label read at low confidence with its CAS intact
     * is never discarded. */
    const conf = meta && typeof meta.conf === 'number' ? meta.conf : null;
    if (conf !== null && conf < MIN_CONFIDENCE && !structured) {
      return {
        lowConfidence: true,
        conf,
        threshold: MIN_CONFIDENCE,
        key: 'ocr.rejected.conf',
        message: 'لم يُستخرج نص موثوق — القراءة منخفضة الثقة.'
      };
    }
    return null;
  }
  async function scan(file, options) {
    const res = await recognize(file, null, options);
    const lines = String(res.text || '').split(/\r?\n/)
      .map(l => l.trim()).filter(Boolean)
      .map(l => ({ text: l, conf: res.confidence }));
    const rej = res.rejected || rejectedTextReason(res.text, {
      conf: res.confidence,
      structured: (res.cas && res.cas.length > 0) || !!res.aiRegion
    });
    if (rej) {
      return {
        engine: 'tesseract-6.0.1',
        rejected: rej,
        lines: [], words: [], cas: [], candidates: [], confidence: null,
        passes: res.passes, variant: res.variant, psm: res.psm,
        best: res.best, aiRegion: res.aiRegion,
        text: ''
        };
    }
    return {
      engine: 'tesseract-6.0.1',
      lines,                       // [{text, conf}]
      words: [],                   // per-word boxes stay internal to the engine
      cas: res.cas,
      candidates: res.candidates,
      confidence: res.confidence,
      passes: res.passes,
      variant: res.variant,
      psm: res.psm,
      best: res.best,
      aiRegion: res.aiRegion,
      text: res.text
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
      OCR.LANG + '/eng.traineddata.gz'
    ];
    const cache = await caches.open('mustashar-ocr');
    let n = 0;
    for (const a of assets) {
      try { await cache.add(new Request(a, { cache: 'reload' })); n++; } catch (e) { /* keep going */ }
    }
    return n;
  }

  global.OcrModule = {
    recognize, extractCAS, extractCandidates, prefetch, setSearchRef,
    cancelCurrent, scan, latinRatio, rejectedTextReason, MIN_CONFIDENCE,
    OCR, VARIANTS, PSM_LIST, aiRegionFromWords, buildVariant
  };
})(typeof window !== 'undefined' ? window : globalThis);
