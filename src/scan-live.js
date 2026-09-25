/*
 * scan-live.js — المرحلة ب (2026-09-25): المعالجة الحية المستمرة من تدفق الكاميرا
 * -----------------------------------------------------------------------------
 * ب1: بدل «التقاط صورة واحدة ثم انتظار المعالجة الثقيلة»، تُقرأ إطارات مصغّرة
 *     من الفيديو على فترات منتظمة وتُفحص فحصًا رخيصًا (حدة + كثافة حواف) قبل
 *     تشغيل محرك القراءة الكامل. إطار يفشل الفحص الرخيص يُتجاوز فورًا — لا
 *     تجمد أبدًا. أول إطار ناجح يُمرَّر للمحرك الكامل في الخلفية بينما يستمر
 *     الفحص الرخيص (نجاح مبكر: أول نتيجة تجتاز البوابات توقف المعالجة الحية).
 * ب2: التقاط اليدوي/التلقائي يأخذ N إطارات متتالية ويختار الأوضح (تباين محلي)
 *     فقط للمحرك الكامل.
 * ب3: إطار إرشادي شبه شفاف في منتصف العرض؛ القراءة الكاملة تُشغَّل على المنطقة
 *     داخل الإطار فقط مكبّرة نحو دقة المحرك الأصلية (MAX_DIM)، والصورة
 *     المحفوظة للتشخيص/السجل تبقى كاملة غير مقصوصة.
 * ب4: تفاوت الأجهزة: كل الإطارات المفحوصة بمقاس مصغّر ثابت؛ معدل العينات
 *     يُخفَّض تلقائيًا على الأجهزة الضعيفة (deviceMemory/أنوية/مؤشر لمس)؛
 *     الوضع الحي يُعطَّل كليًا على أضعف الأجهزة وتُترك لها مسار ب2 فقط.
 * ب5: لا بوابات هنا إطلاقًا: كل إطار يمر عبر OcrModule.recognize() نفسه
 *     (لاتيني 60%، حد الثقة 45، إعفاء CAS الصالح، فلتر العربية) — بلا أي استثناء.
 * لا اتصال بالشبكة، لا مكتبات، واجهة ScanLive واحدة على window.
 */
(function (global) {
  'use strict';

  /* ---------- ب4: device class + sampling budget (all measured knobs) ---------- */
  function deviceClass() {
    let cores = 0, mem = 0, coarse = false;
    try { cores = navigator.hardwareConcurrency || 0; } catch (e) {}
    try { mem = navigator.deviceMemory || 0; } catch (e) {}
    try { coarse = matchMedia('(pointer: coarse)').matches; } catch (e) {}
    /* weak = the known-lowest class: few cores OR little memory OR touch-only.
     * Chrome 109 (Win7) reports neither API → falls to the default MEDIUM. */
    if ((cores && cores <= 2) || (mem && mem <= 2)) return 'weak';
    if (coarse) return 'mobile';
    return 'medium';
  }

  const PROFILE = {
    /* weak: ب4 says live mode must NOT run on the weakest devices — they
     * keep the manual best-of-N path (ب2 without ب1) with visible progress. */
    weak:   { live: false, sampleMs: 0,    probeW: 160 },
    /* mobile (the primary real device): 1 probe/500ms — the documented
     * fallback rate from ب4, chosen conservatively before any measurement. */
    mobile: { live: true,  sampleMs: 500,  probeW: 160 },
    /* desktop / Chrome 109 baseline: same cadence, slightly larger probe. */
    medium: { live: true,  sampleMs: 500,  probeW: 200 }
  };

  /* ---------- cheap pre-checks (ب1) — all on a tiny downscaled frame ---------- */
  /* Laplacian-ish gradient energy per pixel + edge density: a blurry or
   * textless frame is skipped before the heavy engine ever sees it. */
  function frameMetrics(canvas) {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const d = ctx.getImageData(0, 0, w, h).data;
    let lap = 0, edges = 0, dark = 0, n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
        const gx = d[i + 4] - d[i - 4];
        const gy = d[i + w * 4] - d[i - w * 4];
        const e = Math.abs(gx) + Math.abs(gy);
        lap += e;
        if (e > 48) edges++;
        if (g < 25) dark++;
        n++;
      }
    }
    if (!n) return { lap: 0, edges: 0, dark: 0 };
    return { lap: lap / n, edges: edges / n, dark: dark / n };
  }

  /* Cheap text-presence heuristic on the tiny frame: enough edge structure
   * arranged in the probe (labels are edge-dense), not blown out, not dark. */
  function cheapPass(m) {
    return m.lap >= 14 && m.edges >= 0.02 && m.dark < 0.6;
  }

  /* ---------- ب2: best-of-N frame selection (sharpness = local variance) ---------- */
  function sharpnessScore(canvas) {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const d = ctx.getImageData(0, 0, w, h).data;
    let sum = 0, sum2 = 0, n = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
        sum += g; sum2 += g * g; n++;
      }
    }
    if (!n) return 0;
    const mean = sum / n;
    return sum2 / n - mean * mean;   /* variance — higher = more detail */
  }

  /* ---------- ب3: ROI crop, upscaled toward the engine's native MAX_DIM ---------- */
  /* Reads ONLY the in-frame region (avoids the documented global-downscale
   * detail loss); the full frame is saved separately for diagnostics. */
  function cropROI(video, roiRect) {
    const sw = video.videoWidth, sh = video.videoHeight;
    if (!sw || !sh) return null;
    const x = Math.max(0, Math.round(roiRect.x * sw));
    const y = Math.max(0, Math.round(roiRect.y * sh));
    const cw = Math.min(sw - x, Math.round(roiRect.w * sw));
    const ch = Math.min(sh - y, Math.round(roiRect.h * sh));
    if (cw < 40 || ch < 40) return null;
    /* upscale toward ocr.js's MAX_DIM so small ingredient lines keep their
     * native resolution (the exact global-downscale failure documented earlier) */
    const target = Math.min(1600, Math.max(cw, ch) * 2);
    const scale = Math.min(3, Math.max(1, target / Math.max(cw, ch)));
    const c = document.createElement('canvas');
    c.width = Math.round(cw * scale);
    c.height = Math.round(ch * scale);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(video, x, y, cw, ch, 0, 0, c.width, c.height);
    return c;
  }

  /* ---------- ب3: guide frame overlay (semi-transparent, mid-screen) ---------- */
  function roiRect() {
    /* fractions of the video area: centered box, ~72% width / 34% height —
     * sized for an ingredients line held inside the frame */
    const w = 0.72, h = 0.34;
    return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
  }

  function drawGuide(canvas, opts) {
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    g.clearRect(0, 0, W, H);
    const r = roiRect();
    const x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
    g.save();
    /* dim everything outside the frame (semi-transparent overlay) */
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.beginPath();
    g.rect(0, 0, W, H);
    g.rect(x, y, w, h);
    g.fill('evenodd');
    /* frame */
    g.strokeStyle = opts && opts.pass ? '#6fbf8f' : 'rgba(255,255,255,0.9)';
    g.lineWidth = Math.max(2, Math.round(W / 180));
    g.strokeRect(x, y, w, h);
    /* corner ticks */
    const t = Math.round(Math.min(w, h) * 0.08);
    g.beginPath();
    g.moveTo(x, y + t); g.lineTo(x, y); g.lineTo(x + t, y);
    g.moveTo(x + w - t, y); g.lineTo(x + w, y); g.lineTo(x + w, y + t);
    g.moveTo(x + w, y + h - t); g.lineTo(x + w, y + h); g.lineTo(x + w - t, y + h);
    g.moveTo(x + t, y + h); g.lineTo(x, y + h); g.lineTo(x, y + h - t);
    g.stroke();
    g.restore();
  }

  /* ---------- full-frame grab (saved uncropped for diagnostics/history) ---------- */
  function grabFull(video) {
    const sw = video.videoWidth, sh = video.videoHeight;
    if (!sw || !sh) return null;
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    c.getContext('2d').drawImage(video, 0, 0);
    return c;
  }

  /* blob helper: full frame -> jpeg (uncropped saved copy) */
  function canvasToBlob(canvas, q) {
    return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', q || 0.92));
  }

  global.ScanLive = {
    deviceClass, PROFILE, frameMetrics, cheapPass, sharpnessScore,
    cropROI, drawGuide, roiRect, grabFull, canvasToBlob
  };
})(typeof window !== 'undefined' ? window : globalThis);
