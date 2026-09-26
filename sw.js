/*
 * sw.js — المستشار الزراعي (v24)
 *
 * v24 (2026-09-26): إصلاح انتكاسة ب — التصنيف الوظيفي (حشري/فطري/…) ظاهر
 *   في الوضعين دائمًا: كان محصورًا بشرط showDetails منذ إدخال طبقة القرار
 *   (cf2ff79) فاختفى كليًا عن المزارع بعد فصل الوضعين، مع أن المواصفة
 *   تلزمه في الوضعين بلا استثناء. تغيّر سلوك الواجهة → رفع الكاش.
 *
 * v22 (2026-09-25): المرحلة ج — فصل وضعي المزارع/المحترف في النتائج:
 *   بطاقات الدول الأخرى + رقم CAS + شرح الرمز في المحترف فقط؛ الحالة
 *   الليبية والتصنيف الوظيفي وشريط الإخلاء في الوضعين؛ شريط الحظر القطعي
 *   (تطابق تام في قرار 248) يظهر في الوضعين ولا يُبسَّط أبدًا. شريط
 *   الإخلاء صار مُصيَّرًا مع كل دفعة نتائج (بحث/مسح) بدل سطر ثابت واحد
 *   تحت نتائج البحث فقط. تغيّر سلوك الواجهة → رفع الكاش.
 *
 * v21 (2026-09-25): المرحلة ب — مسح سجل البحث: التخزين الدائم أولًا ثم إعادة
 *   العرض من القراءة الفعلية (لا إفراغ عرض فقط)، مع إشعار بالنتيجة في كل
 *   المسارات (history.cleared/history.clearFail ×4 قواميس)؛ openHistory
 *   يعيد Promise. تغيّر سلوك الواجهة → رفع الكاش.
 *
 * v20 (2026-09-25): المرحلة أ — إصلاح بطء/فشل القراءة الثابتة (docs/ocr-speed-
 *   diagnosis.md): قفل مبكر في سلّم ocr.js يحفظ أول تمريرة يؤكدها محرك
 *   المطابقة (تطابق تام/≥96 أو CAS صالح فحص التحقق) من هدر بوابة المخرج
 *   النهائية — 4 صور حقيقية كانت تفشل كليًا أصبحت تعمل (Isoprothiolane،
 *   Spinosad، Soap، Oxadiazon) بلا أي قبول جديد بغير تأكيد قاعدي؛ وحدة
 *   تشخيص src/ocr-diagnostics.js (خاملة في الإنتاج). تغيّر سلوك الواجهة →
 *   رفع الكاش.
 *
 * v19 (2026-09-25): المرحلة ب — المعالجة الحية المستمرة من تدفق الكاميرا
 *   (فحص رخيص للإطارات قبل تشغيل المحرك الكامل، التقاط أفضل إطار من عدة
 *   إطارات، إطار إرشادي يضيّق منطقة القراءة، أضعف الأجهزة تلتقط يدويًا بلا
 *   حلقة حية)، والمرحلة ج — حماية قراءة جارية: لا مغادرة لشاشة المسح أثناء
 *   عمل المحرك. ملف جديد src/scan-live.js في الهيكل المسبق التحميل.
 *   تغيّر سلوك الواجهة → رفع الكاش.
 *
 * v18 (2026-09-25): المرحلة أ — مسح فوري للنتائج القديمة عند أي تغيّر
 *   لمصدر الاستعلام (كتابة/حذف نص، صورة جديدة، مسح جديد)، زر إزالة/تبديل
 *   الصورة الملتقطة بلا إعادة تحميل، وأتمتة كاملة من القراءة إلى النتيجة
 *   (بوابات ocr.js كما هي؛ تمرير النص الناجح تلقائيًا لمحرك البحث وعرض
 *   النتائج داخل شاشة المسح بلا لوحة تأكيد). تغيّر سلوك الواجهة → رفع الكاش.
 *
 * v17 (2026-09-23): المرحلة ج — إصلاح زر «مشاركة التطبيق» (كان صامتًا على
 *   المتصفحات بلا Web Share): نسخ الرابط إلى الحافظة ثم بطاقة اتصال vCard
 *   كحل أخير، مع إشعار بالنتيجة في كل المسارات؛ وتضييق إعفاء «الأدلة
 *   المهيكلة» في بوابة OCR ليكون حصرًا رقم CAS اجتاز فحص رقم التحقق.
 *
 * v16 (2026-09-23): أ4 — حد الثقة للقراءة غير المهيكلة (MIN_CONFIDENCE = 45)
 *   في مسار OCR الحي: أي نص مدموج تقل ثقة قراءته الكلية عن 45 يُرفض كليًا
 *   («لم يُستخرج نص موثوق — القراءة منخفضة الثقة») مع استثناء الأدلة المهيكلة
 *   (CAS/منطقة المادة الفعالة). يغيّر سلوك الواجهة → يجب رفع الكاش معه.
 *
 * v15 (2026-09-23): EPA Master (PPIS) — قاعدة خامسة قابلة للبحث
 *   `data/epa-cancelled.json` (أرشيف الملغى، 1,425 سجلًا) تُجهَّز مسبقًا
 *   مع الأربع القواعد وتُخدم stale-while-revalidate مثلها؛ والقاعدة النشطة
 *   `epa.json` أُعيد بناؤها (1,361 سجلًا). تحديث قسري للمستخدمين الجدد،
 *   والقديم يستمر بآخر نسخة جيدة حتى التجهيز التالي.
 *
 * Cache topology (two caches; both survive SW updates):
 *   - mustashar-v14   app shell + data JSONs (precached, mirrored forward
 *                     across version updates)
 *   - mustashar-ocr   OCR asset responses (worker, wasm core+glue, traineddata)
 *                     written once on first use / explicit prefetch, NEVER
 *                     deleted by activate(), so a future SW upgrade cannot
 *                     wipe prepared offline OCR (~15 MB re-download otherwise).
 * Data JSONs live in the main cache (and are mirrored into mustashar-ocr by
 * the OCR prefetch loop only if ever requested there), so neither an SW
 * update nor an OCR cache prune can break offline search.
 *
 * Personal data (IndexedDB history, theme, app version note) lives outside
 * the caches and is never touched by this worker.
 */
const CACHE = 'mustashar-v24';
const OCR_CACHE = 'mustashar-ocr';
const SHELL = [
  './',
  './index.html',
  './src/search-core.js',
  './src/app.js',
  './src/ocr.js',
  './src/scan-live.js',
  './src/i18n.js',
  './src/icons.js',
  './src/cas.js',
  './assets/fonts/ibm-plex-sans-arabic-regular.woff2',
  './assets/fonts/ibm-plex-sans-arabic-bold.woff2',
  './assets/fonts/LICENSE-OFL-IBM-Plex-Sans-Arabic.txt',
  './assets/icons/LICENSE-LUCIDE-ISC.txt',
  './assets/developer.jpg',
  './vendor/tesseract/tesseract.min.js',
  './manifest.json',
  './version.json',
  './config/support.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/favicon.svg'
];
const DATA = [
  './data/libya-248.json',
  './data/libya-500.json',
  './data/eu.json',
  './data/epa.json',
  './data/epa-cancelled.json',
  './data/intl-alerts.json'
  /* FAO/Codex removed (c5): publications are CC BY-NC-SA with unclear
   * dataset terms — no FAO/WHO data in this round. The international
   * alert layer (Rotterdam/Stockholm/PAN lists) stores links only. */
];

/* OCR engine assets (tesseract.min.js itself is in SHELL so the OCR loader
 * is available even on the very first OFFLINE launch): served from
 * mustashar-ocr, or the mirror copy in the main cache written by earlier
 * versions / prefetch. Cached on first use or explicit prefetch. */
const OCR_ASSETS = [
  './vendor/tesseract/worker.min.js',
  './vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js',
  './vendor/tesseract/core/tesseract-core-simd-lstm.wasm',
  './vendor/tesseract/core/tesseract-core-lstm.wasm.js',
  './vendor/tesseract/core/tesseract-core-lstm.wasm',
  './vendor/tesseract/lang/eng.traineddata.gz'
  /* ara.traineddata.gz removed from the runtime set: eng-only engine
   * (Arabic-hallucination fix — docs/ocr-arabic-hallucination-diagnosis.md).
   * The file stays in the repo as an asset; not prefetched or cached. */
];

/* Subpath-safe matchers (GitHub Pages serves under /<repo>/): match by
 * pathname suffix, not from the root. FAO stays on the generic cache-first
 * path (as in v6) until the update agent produces the file. */
const isDataUrl = url =>
  /\/data\/(libya-248|libya-500|eu|epa|epa-cancelled)\.json$/.test(url.pathname);
const isOcrUrl = url =>
  /\/vendor\/tesseract\/(core\/tesseract-core-(simd-)?lstm\.wasm(\.js)?|lang\/eng\.traineddata\.gz|worker\.min\.js)$/.test(url.pathname);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // shell must be present
    await Promise.all(SHELL.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (err) { console.warn('[sw] shell precache failed:', url, err); }
    }));
    // data files are independent: a single failure must not fail install
    await Promise.all(DATA.map(async url => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (err) { console.warn('[sw] data precache failed:', url, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    /* Delete only caches that are neither the current one, nor the OCR
     * cache, nor any other versioned app cache. Versioned caches from
     * older releases are kept until their OCR mirror copies have been
     * copied into the current cache (below), then removed — this is what
     * makes an SW update unable to lose prepared OCR or databases. */
    const keepMirror = names.some(n => /^mustashar-v\d+$/.test(n) && n !== CACHE);
    if (keepMirror) {
      try {
        const main = await caches.open(CACHE);
        /* Carry data/shell responses from the previous versioned cache into
         * the new one, so an offline user keeps working databases across an
         * SW update without re-downloading. OCR assets are NOT mirrored:
         * they live once in the dedicated permanent cache (mustashar-ocr),
         * which every engine can read regardless of SW version — mirroring
         * them here would duplicate ~17.6 MB on every future update. */
        for (const n of names) {
          if (n === CACHE || n === OCR_CACHE || !/^mustashar-v\d+$/.test(n)) continue;
          const old = await caches.open(n);
          for (const req of await old.keys()) {
            if (isOcrUrl(new URL(req.url))) continue;
            if (await main.match(req)) continue;
            const hit = await old.match(req);
            if (hit) await main.put(req, hit.clone());
          }
        }
      } catch (err) { /* mirroring is best-effort; caches stay intact */ }
    }
    await Promise.all(names
      .filter(n => n !== CACHE && n !== OCR_CACHE && !/^mustashar-v\d+$/.test(n))
      .map(n => caches.delete(n)));
    // only now, with everything mirrored, drop superseded versioned caches
    await Promise.all(names
      .filter(n => /^mustashar-v\d+$/.test(n) && n !== CACHE)
      .map(n => caches.delete(n)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (err) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // page navigations: network-first, fall back to cached shell (any cache)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const preload = await e.preloadResponse;
        if (preload) return preload;
        return await fetch(req);
      } catch (err) {
        for (const n of await caches.keys()) {
          const cache = await caches.open(n);
          const hit = (await cache.match('./')) || (await cache.match('./index.html'));
          if (hit) return hit;
        }
        return new Response('offline', { status: 503, statusText: 'offline' });
      }
    })());
    return;
  }

  // version.json: network-first (keeps update detection alive)
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(new Request(req, { cache: 'no-store' }));
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        return (await cache.match(req))
          || new Response(JSON.stringify({ version: 'unknown' }), { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  // OCR assets: cache-first from either OCR cache or the main cache;
  // on a network fetch, store into mustashar-ocr (permanent home)
  if (isOcrUrl(url)) {
    e.respondWith((async () => {
      const ocr = await caches.open(OCR_CACHE);
      const hit = (await ocr.match(req)) || (await (await caches.open(CACHE)).match(req));
      if (hit) return hit;
      try {
        const fresh = await fetch(new Request(req, { cache: 'reload' }));
        if (fresh.ok) { await ocr.put(req, fresh.clone()); }
        return fresh;
      } catch (err) {
        return new Response('offline', { status: 503 });
      }
    })());
    return;
  }

  // data JSONs: stale-while-revalidate (offline always gets last good copy)
  if (isDataUrl(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(new Request(req, { cache: 'no-store' }))
        .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      return cached || (await network) || new Response(JSON.stringify({ error: 'offline and not cached' }), { status: 504 });
    })());
    return;
  }

  // everything else (shell/assets): cache-first, then network, then cache put
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && url.origin === location.origin) cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      return new Response('offline', { status: 503 });
    }
  })());
});
