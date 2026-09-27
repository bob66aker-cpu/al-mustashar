/*
 * barcode.js — المرحلة 3.5: «الباركود أولًا» — إشارة لا حكم (2026-09-27)
 * ---------------------------------------------------------------------------
 * الملصقات الزراعية تحمل عادة باركود/رمز GS1 أسرع وأدق من OCR. طبقة رخيصة
 * تُجرَّب قبل المحرك الثقيل: إن عُثر على رمز يُعرض كـ«إشارة» قابلة للتفقد —
 * لا تُعتبر حكمًا نهائيًا ولا تُنشئ أي نتيجة بنفسها. إن لم يوجد رمز يتابع
 * المسار الطبيعي (OCR) كما لو لم يحدث شيء.
 *
 * المحركات، بالترتيب:
 *   1) BarcodeDetector المدمج في كروم (مجاني، ~1-30ms).
 *   2) zxing-wasm المُورَّد حرفيًا (MIT — src/vendor/) داخل Web Worker via
 *      Blob (لا يلمس CSP 'self'؛ لا شبكة إطلاقًا: locateFile يُوجَّه إلى
 *      النسخة المحلية zxing_reader.wasm نفسها المورَّدة). يُعطَّل نهائيًا بعد
 *      فشل تهيئة واحد، وفشل قراءة واحدة يُنهي المحاولة فقط.
 *
 * يعيد null عند عدم العثور على شيء أو تجاوز الميزانية الزمنية. النتيجة:
 *   { engine, ms, codes: [{ text, format, safe, gs1? }] }
 * أمان النص: يُعرض عبر textContent حصرًا (لا innerHTML في المستدعي)، وحقل
 * safe = regex بسيط يمنع نصوصًا شاذة من العرض كإشارة مقروءة.
 */
(function (global) {
  'use strict';

  var DETECT_BUDGET_MS = 2500;   // phone-class ceiling for the whole layer
  var CODE_SAFE_RE = /^[A-Za-z0-9 .,\-+/()%]{3,80}$/;

  function appRoot() {
    var base = (global.location && global.location.href) || 'http://localhost/';
    return new URL('.', base).href.replace(/\/(?:src|tests)\/$/, '/');
  }

  /* ---------- engine 1: native BarcodeDetector ---------- */
  var nativeDetector = null, nativeInit = null;
  function ensureNative() {
    if (nativeInit) return nativeInit;
    nativeInit = new Promise(function (resolve) {
      try {
        if (typeof global.BarcodeDetector !== 'function') { resolve(null); return; }
        global.BarcodeDetector.getSupportedFormats().then(function (all) {
          var want = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e',
                      'itf', 'codabar', 'qr_code', 'data_matrix', 'pdf417', 'aztec']
            .filter(function (f) { return all.indexOf(f) >= 0; });
          return new global.BarcodeDetector(want.length ? { formats: want } : undefined);
        }).then(function (d) { resolve(d || null); })
          .catch(function () { resolve(null); });
      } catch (e) { resolve(null); }
    });
    return nativeInit;
  }

  /* ---------- engine 2: vendored zxing-wasm inside a Blob worker ---------- */
  var zxingPromise = null, zxingDead = false, zxingSeq = 0, zxingPending = {};
  function ensureZxing() {
    if (zxingDead) return Promise.reject(new Error('zxing unavailable'));
    if (zxingPromise) return zxingPromise;
    zxingPromise = new Promise(function (resolve, reject) {
      if (typeof Worker === 'undefined' || !global.fetch) { reject(new Error('no worker/fetch')); return; }
      var srcUrl = new URL('src/vendor/zxing-reader.min.js', appRoot()).href;
      var wasmUrl = new URL('src/vendor/zxing_reader.wasm', appRoot()).href;
      fetch(srcUrl).then(function (r) {
        if (!r.ok) throw new Error('vendor fetch ' + r.status);
        return r.text();
      }).then(function (lib) {
        /* bridge: override locateFile BEFORE the first read so the wasm is
         * loaded from the vendored same-origin copy — never a CDN. */
        var boot =
          lib + '\n;ZXingWASM.setZXingModuleOverrides({locateFile:function(p){' +
          'return p.slice(-5)===".wasm"?' + JSON.stringify(wasmUrl) + ':p;}});\n' +
          'self.onmessage=function(e){var d=e.data;' +
          'ZXingWASM.readBarcodes(d.blob,{tryHarder:true,tryRotate:true,tryInvert:true,' +
          'tryDownscale:true,maxNumberOfSymbols:5}).then(function(ms){' +
          'self.postMessage({id:d.id,codes:ms.map(function(m){return{text:m.text,format:m.format};})});' +
          '},function(err){self.postMessage({id:d.id,error:String(err&&err.message||err)});});};';
        var w = new Worker(URL.createObjectURL(new Blob([boot], { type: 'text/javascript' })));
        w.onmessage = function (e) {
          var p = zxingPending[e.data.id]; if (!p) return;
          delete zxingPending[e.data.id];
          if (e.data.error && /wasm|abort|memory/i.test(e.data.error)) zxingDead = true;
          if (e.data.error) p.reject(new Error(e.data.error));
          else p.resolve(e.data.codes || []);
        };
        w.onerror = function () { zxingDead = true; };
        resolve(w);
      }).catch(function (err) { zxingDead = true; reject(err); });
    });
    zxingPromise.catch(function () { zxingPromise = null; });
    return zxingPromise;
  }
  function zxingRead(worker, blob) {
    return new Promise(function (resolve, reject) {
      var id = ++zxingSeq;
      zxingPending[id] = { resolve: resolve, reject: reject };
      worker.postMessage({ id: id, blob: blob });
      setTimeout(function () {
        if (zxingPending[id]) { delete zxingPending[id]; reject(new Error('zxing timeout')); }
      }, DETECT_BUDGET_MS);
    });
  }

  /* normalize any accepted source into a Blob for both engines */
  function toBlob(source) {
    if (source instanceof Blob) return Promise.resolve(source);
    if (source && source.videoWidth) {           // HTMLVideoElement
      var c = document.createElement('canvas');
      var s = Math.min(1, 640 / Math.max(source.videoWidth, source.videoHeight));
      c.width = Math.max(1, Math.round(source.videoWidth * s));
      c.height = Math.max(1, Math.round(source.videoHeight * s));
      c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    }
    if (source && source.width && source.convertToBlob) return source.convertToBlob({ type: 'image/png' });
    if (source && source.width && source.getContext) {   // HTMLCanvasElement
      return new Promise(function (res) { source.toBlob(res, 'image/png'); });
    }
    return Promise.reject(new Error('unsupported source'));
  }

  function withBudget(promise, t0) {
    var left = DETECT_BUDGET_MS - (performance.now() - t0);
    if (left <= 0) return Promise.resolve(null);
    return Promise.race([promise, new Promise(function (r) { setTimeout(r, left); })]);
  }

  /* GS1-lite: pull the common AIs out of a (01)…(10)… string — signal only */
  var GS1_AIS = { '01': 'gtin', '10': 'batch', '21': 'serial', '30': 'count' };
  function gs1Parse(text) {
    if (!text || text.charAt(0) !== '(') return null;
    var out = {}, re = /\((\d{2,4})\)([^(]*)/g, m, any = false;
    while ((m = re.exec(text))) {
      var key = GS1_AIS[m[1]];
      if (key) { out[key] = m[2].trim(); any = true; }
    }
    return any ? out : null;
  }

  async function detect(source) {
    var t0 = performance.now();
    var blob = null;
    try { blob = await toBlob(source); } catch (e) { return null; }
    if (!blob) return null;

    var engine = null, codes = [];

    var d = await withBudget(ensureNative(), t0);
    if (d) {
      try {
        var raw = await withBudget(Promise.resolve(d.detect(blob)), t0);
        if (raw && raw.length) {
          engine = 'native';
          codes = raw.map(function (r) { return { text: r.rawValue, format: r.format }; });
        }
      } catch (e) { /* native failed — fall through to zxing */ }
    }

    if (!codes.length) {
      try {
        var w = await withBudget(ensureZxing(), t0);
        if (w) {
          var z = await withBudget(zxingRead(w, blob), t0);
          if (z && z.length) { engine = 'zxing'; codes = z; }
        }
      } catch (e) { /* zxing unavailable/timeout — barcode layer simply abstains */ }
    }

    if (!codes.length || !engine) return null;
    codes.forEach(function (c) {
      c.safe = CODE_SAFE_RE.test(c.text || '');
      c.gs1 = gs1Parse(c.text);
    });
    return { engine: engine, ms: Math.round(performance.now() - t0), codes: codes };
  }

  function supported() {
    return typeof Worker !== 'undefined' && !!global.fetch;
  }
  function nativeSupported() {
    return typeof global.BarcodeDetector === 'function';
  }

  global.BarcodeModule = {
    detect: detect, supported: supported, nativeSupported: nativeSupported,
    gs1Parse: gs1Parse, DETECT_BUDGET_MS: DETECT_BUDGET_MS
  };
})(typeof window !== 'undefined' ? window : globalThis);
