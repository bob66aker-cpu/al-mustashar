/*
 * sw.js — المستشار الزراعي (v29)
 *
 * v63 (2026-10-14) — جولة D61 «مسار الإصابات» (نبات ← نوع ← إصابة مرقّمة):
 *   68 محصولاً في شبكة الإرشاد مع بحث، وخطوة «نوع الإصابة» الجديدة،
 *   766 بطاقة مرقّمة (مظاهر + علاج) من 30 ديواناً مُسنَداً في
 *   data/advice/dossiers.json، ونواة كل محصول في data/advice/infections/
 *   تُجهَّز مع القشرة (تعمل دون إنترنت من أول تشغيل)؛ القوائم المرجعية
 *   الكبيرة (*.ref.json) تُحمَّل عند الطلب وتُخزَّن في الكاش.
 *   الإصدار 1.19.27 — الحارس ppocr-size يرى 69 مدخلاً مُعلَناً في
 *   DECLARED_ADDED.SHELL (لا إضافة صامتة)، والميّز D61 في docs/DECISIONS.md.
 * v61 (2026-10-12) — جولة «نفّذ كل الاقتراحات»: النواة غير الداعمة لـSIMD
 *   غادرت حزمة التجهيز الافتراضية (‎−6.5MB؛ تُحمَّل عند الطلب ثم تُحفظ في
 *   كاش OCR الدائم عبر isOcrUrl)، والمصدر الوحيد للنسخة صار
 *   version.json.shell (الاختبارات تقرأ ولا تثبّت)، إزالة lang_alternates
 *   غير القياسي من manifest، وتوحيد لون ثيمة landing مع manifest.
 *   الحارس ppocr-size مُحدَّث بفارق مُعلَن (D58) لا بصمت.
 * v60 (2026-10-11) — جولة تحسين الإصدار التجريبي: وسوم مشاركة اجتماعية
 *   (Open Graph/Twitter) وdescription وcanonical لجذر التطبيق، robots.txt +
 *   sitemap.xml (كانت الفحّاصات تقرأ HTML من وضع SPA بدل قواعد حقيقية)،
 *   HSTS في _headers (دفاع الإطار يبقى X-Frame-Options: DENY لتبقى سياسة
 *   الترويسة = سياسة meta كما يفرض حارس headers-injection)، وتحديث README.
 *   البيانات لم تُمس والقوائم SHELL/DATA/OCR_ASSETS ثابتة (حراس ppocr-size).
 * v59 (2026-10-11) — جولة مزامنة دولية: تجديد حزمتَي canada (1313 مادة) و
 *   australia (2695 نشِطاً) من مصدريهما الرسميين، وموافقة عدّاد قسم canada في
 *   reference.json على القياس (1311←1313) مع بصمة جديدة للمرجع في DATA_SHA256.
 * v58 (2026-10-07) — جولة قياس الاستخدام: شاشة #/stats + وحدة src/stats.js
 *   عدّادات محلية على الجهاز فقط (صفر شبكة — docs/usage-analytics.md)،
 *   والقوائم SHELL/DATA/OCR_ASSETS لم تُمس (حارس ppocr-size).
 * v42 (2026-10-02) — فيدباك 6: رموز التصنيف عرض «غير مشروح» للمزارع معان الدليل: تسوية الفاصل عند بحث الطلب (نقطة / مسافة / بلا فاصل) في بحث القاموس وحده لا يمسّ العتبات ولا منطق قبول؛ وإضافة «P.G.R» و«Rep» بصيغتهما المصدر. حارس ثابت: tests/cat-legend-gate.test.mjs — كل رمز مشروح أو موقف علنه باعدادة، لا ثالث.
 *
 * v29 (2026-09-28) — المرحلة الثالثة: أتمتة القراءة (نسخة العمل، الأصل لم يمس):
 *   - إصلاح قصور قراءة الملصقات: جمع كلمات الشجرة لا كتلها (Tesseract 6 لا
 *       يُرجع الكتل افتراضياً)، وإعادة بناء الأسطر من هندسة الكلمات،
 *       وإعادة معايرة عتبة الحدة على 1.0 بمقياس بلوك 32×32.
 *   - CLAHE كمتغير حقيقي في الطابور — ومعطّل: على صور المزارع السبع عشرة
 *       لم يكلّف قبولاً ولا تجاوز الهامش الزمني، لكنه يزيح تمريرات تدوير
 *       الصورة فيفقد الحالة rotated_90 قراءتها. الحارس الدائم في
 *       tests/ocr-clahe-ab.test.mjs يشغّل المحرك بالطريقتين.
 *   - تصويت صامت متعدد الإطارات في الكاميرا الحية فقط (سقف 12، نافذة
 *       1600ms، حتى أربع قراءات)، وفلتر صلب داخل دالة التصويت نفسها:
 *       اتفاق القراءات على خطأ أو على رفض لا يصنع فائزاً.
 *   - عتبة الحدة تحذير لا حاجز: تعيد قراءة نصية وتعرض إعادة التصوير،
 *       وتُعاد معايرتها على أجهزة الحملة الميدانية قبل أن تصير نهائية.
 *   - PP-OCRv5 حزمة اختيارية معطّلة افتراضياً: لا سكربت في index.html،
 *       ولا إدخال في أي قائمة تجهيز، وسياسة الأمان تمنع تشغيلها. حجم
 *       التجهيز الافتراضي مطابق بايت ببايت للأساس (tests/ppocr-size.test.mjs).
 *   تغيّر src/ocr.js وsrc/scan-live.js وsrc/app.js وsrc/i18n.js وindex.html
 *   وملفات الاختبار ⇒ رفع الكاش v31→v32 والإصدار 1.14.0→1.15.0. سجل سابق:
 *
 * v28 (2026-09-27) — جولة CAS الموثّقة (الجزء الثاني) على نسخة العمل:
 *   - إصلاحان جديدان في قرار 500 بنمط الستّة: Mandipropamid
 *     (374726-22-2 → 374726-62-2، مصدره EPA Master PC 036602) وProsulfocarb
 *     (52888-90-9 → 52888-80-9، EU + PubChem) — الخام يبقى محفوظًا.
 *   - Carvone: وسم تباس المتماكب (الرقم المصحح يخص (+)-Carvone؛ الراسيمي
 *     99-49-0) — التنبيه يظهر في البطاقة ولا يُحذف.
 *   - Metalaxyl-M: واصف (R) في حقل مستقل (cas_stereo) beside الرقم
 *     المطبَّع 70630-17-0.
 *   - استكمالات «بلا رقم / see remark»: قيم مقترحة موثقة المصدر
 *     (cas_suggested + cas_source) بلا استبدال صامت لقيمة المرسوم، وحقل
 *     مراجعة نصي لـ L-cysteine.
 *   - قرار 248: شروح إخبارية (cas_note على 18/10/47) وduplicate_note على
 *     69/70 — لا قيمة CAS رسمية تتغير، والشارات مترجمة في القواميس الأربعة.
 *   - فك الرموز الوظيفية المركّبة على + , . ( والنقطة فقط إذا فُسّر طرفيها)
 *     + I.Ph/B/Igr/R.S/gr تُعرض حرفيًا مع «رمز غير مشروح في دليل هذا المصدر».
 *   - عدّ برمجي لأعمار قرار 500 من عمود status يُعرض تحت بطاقة القاعدة،
 *     مع توضيح أن مجموع التصنيفات يتجاوز 411 لتعدد الاستخدامات.
 *   تغيّر ملفات الواجهة (app.js/i18n.js/index.html/cas.js) وبيانات القواعد ⇒
 *   رفع الكاش v30→v31 والإصدار 1.13.0→1.14.0 (المرحلة الثانية: قواعد كندا
 *   وأستراليا الاختيارية + الإسناد الإلزامي + دليل الاستمرارية). سجل سابق:
 *   رفع الكاش v29→v30 والإصدار 1.12.0→1.13.0 (المرحلة الأولى: توافق iPhone —
 *   أيقونة 180px، المنطقة الآمنة، سُلّم الكاميرا المثالي، بطاقة تثبيت iOS
 *   بخطوتين، إعادة تهيئة العامل عند pageshow، ومعالج الحصة). سجل سابق:
 *   رفع الكاش v28→v29 والإصدار 1.11.0→1.12.0 (جولة الواجهة والمرونة:
 *   طبقة رموز تصميمية src/tokens.css، بطاقات مشتركة src/cards.js، سلّم ذاكرة
 *   OCR، شبكة أمان الأخطاء، تقرير المحترف، الوضع الداكن ولمس 44px).
 *
 * v27 (2026-09-27) — المرحلة 3: محرك القراءة (نسخة العمل، الأصل لم يمس):
 *   3.0a مؤشر وضوح الإطار الحيّ % (أحمر/كهرماني/أخضر) على قيمة lap/edges —
 *       إرشادي فقط: قيمة نسبية مُعايَرة على عتبات «المرور الرخيص» الموجودة،
 *       لا ضمان دقة قراءة.
 *   3.0b النص المقروء بدرجة الثقة + تعديل يدوي قبل إعادة البحث (#ocrConf).
 *   3.1 خط أساس موثّق على الصور الحقيقية 17 (docs/ocr-baseline.md) — القياس
 *       قبل أي تحسين، وحارس اختبار يمنع انحدار الأدلة المؤكدة.
 *   3.3 إلغاء بمعرّف (token): تصفير cancelFlag بين المسحات المتزامنة كان
 *       يلغي مسحًا جديدًا فور بدئه (خلل حقيقي كشفه قياس خط الأساس)؛
 *       + طابور أحادي OcrModule.scan() بديل التعامل المتزامن العشوائي.
 *   3.5 الباركود أولًا: BarcodeDetector ثم zxing-wasm المُورَّد داخل Worker —
 *       إشارة قابلة للتفقد لا حكم، صفر شبكة (مُستبعد من CWV شبكة الإقلاع).
 *   3.4 لغة OCR حسب لغة الواجهة: ara+eng للعربية (هالوسة موثقة: 28 محرفًا عربيًا
 *     على ملصق لاتيني مع eng+ara مقابل 0 مع eng — docs/ocr-baseline.md §lang) وeng
 *       لغيرها — worker واحد لكل تكوين، ولوحة التجهيز بالأحجام الفعلية.
 *   3.2/3.6 توثيق سقف الأبعاد 1600 وبوابات المتغيرات الثقيلة (deep lanes
 *       لا تمس الصور الناجحة) — لا سلسلة معالجة ثقيلة لكل صورة.
 *   تغير سلوك الواجهة/SW → رفع الكاش v26→v27.
 *
 * v26 (2026-09-27) — المرحلة 2: تجربة الهاتف (نسخة العمل، الأصل لم يمس):
 *   2.1 زر تثبيت داخلي: التقاط beforeinstallprompt من سكربت <head> مبكر
 *       (كان الحدث يُفوَّت كليًا — grep exit=1) + بطاقة «ثبّت التطبيق»
 *       تظهر فقط عند توفر التثبيت، وإخفاء فوري عند appinstalled مع إشعار.
 *   2.2 توحيد مداخل الكاميرا: حذف اختصار المعرض المكرر من الرئيسية
 *       (كان يستدعي input المعرض من شاشة أخرى — تدفق مزدوج)، تدفق واحد:
 *       تصوير → معالجة تلقائية → النتائج + زر «إعادة التصوير» الوحيد
 *       للعودة إلى الكاميرا. درجة ثقة القراءة تظهر في سجل التشخيص (conf).
 *   2.3 إلغاء التوقف الصامت: بوابة ocrBusy تعرض «مسح جارٍ…» بدل الإرجاع
 *       الصامت، وتُلغي القراءة القديمة تلقائيًا عند اختيار مصدر جديد
 *       (تبديل الصورة أثناء المسح يعمل بدل أن يُهمل).
 *   2.4 مشاركة QR اختيارية: رمز QR محلي (Nayuki MIT، مُورَّد) يعرض رابط
 *       التطبيق فقط — لا بيانات ولا إرسال. فشل الرمز يظهر بصريًا.
 *   تغير سلوك الواجهة/SW → رفع الكاش v25→v26.
 *
 * v25 (2026-09-27) — المرحلة 1: سلامة الحكم على المادة (نسخة العمل، الأصل لم يمس):
 *   1.1 رقاقة «شرح الرموز» مربوطة بـ libya-500 حصرًا — كانت تطلع على
 *       بطاقات أوروبية «Approved» بنص قرار ليبي (Aclonifen إثبات حي).
 *   1.2 فك الرمز الوظيفي المركب (I/A) إلى مكوناته — كان يعرض
 *       «رمز غير معرّف» على صف Tetradifon الحقيي.
 *   1.3 شارة مصدر الملغى تعرض التسمية المترجمة (src.epac)
 *       بدل المفتاح الخام «epa-cancelled».
 *   1.4 تصحيح EXPECTED_ROWS (epa 2199→1361 + إضافة epa-cancelled 1425)
 *       — إلغاء البانر المزيف «بيانات مقتطعة»؛ وإصلاح سباق
 *       إظهار/إخفاء البانر بين tooShort وrenderDbStatus.
 *   1.5 زر «تجهيز الآن» يجهز أيضًا ملفات shell/data الناقصة
 *       من الكاش (فشل precache في SW كان صامتًا).
 *   1.6 تقدم حقيقي (n/7 + اسم الملف) + timeout 60ث/ملف + retry
 *       واحد + رمي خطأ بأسماء الملفات الفاشلة — لا نجاح زايف.
 *   1.7 عرض حصة التخزين في لوحة التجهيز (storage.estimate)
 *       + تغليف كل cache.put في SW بمعالجة QuotaExceeded.
 *   تغير سلوك الواجهة/SW → رفع الكاش v24→v25.
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
const CACHE = 'mustashar-v64';
const OCR_CACHE = 'mustashar-ocr';

/* 1.7 — safe cache write: a full storage quota (QuotaExceededError) must
 * never escape as an unhandled rejection inside respondWith — log once and
 * keep serving; the data still works for this session. */
async function safePut(cache, req, res) {
  try { await cache.put(req, res); }
  catch (err) {
    const quota = err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err && err.message)));
    console.warn('[sw] cache.put failed' + (quota ? ' (storage quota full)' : '') + ':', req.url);
  }
}
const SHELL = [
  './',
  './index.html',
  './src/search-core.js',
  './src/app.js',
  './src/barcode.js',
  './src/packs.js',   /* optional-pack UI: the DATA files are NOT precached on purpose */
  './src/install-capture.js',
  './src/ocr.js',
  './src/scan-live.js',
  './src/vendor/qrcodegen.js',
  './src/vendor/zxing-reader.min.js',
  './src/qr.js',
  './src/cards.js',
  './src/tokens.css',
  './src/i18n.js',
  './src/icons.js',
  './src/cas.js',
  /* D59 — حزمة الإرشاد: تُجهَّز مع القشرة ليعمل الإرشاد دون إنترنت من أول تشغيل */
  './src/irsheed.js',
  './data/advice/manifest.json',
  './data/advice/modifiers.json',
  './data/advice/citrus.json',
  './data/advice/olive.json',
  './data/advice/grape.json',
  './data/advice/tomato.json',
  './data/advice/pepper.json',
  './data/advice/potato.json',
  './data/advice/wheat.json',
  './data/advice/barley.json',
  './data/advice/dates.json',
  './data/advice/alfalfa.json',
  /* D61 — دواوين + نوى الإصابات: تُجهَّز مع القشرة (69 مدخلاً مُعلَناً) */
  './data/advice/dossiers.json',
  './data/advice/infections/alfalfa.json',
  './data/advice/infections/almond.json',
  './data/advice/infections/apple.json',
  './data/advice/infections/apricot.json',
  './data/advice/infections/avocado.json',
  './data/advice/infections/banana.json',
  './data/advice/infections/barley.json',
  './data/advice/infections/bean.json',
  './data/advice/infections/cabbage.json',
  './data/advice/infections/carrot.json',
  './data/advice/infections/cassava.json',
  './data/advice/infections/cauliflower.json',
  './data/advice/infections/cherry.json',
  './data/advice/infections/chickpea.json',
  './data/advice/infections/citrus.json',
  './data/advice/infections/cocoa.json',
  './data/advice/infections/coconut.json',
  './data/advice/infections/coffee.json',
  './data/advice/infections/cotton.json',
  './data/advice/infections/cowpea.json',
  './data/advice/infections/cucumber.json',
  './data/advice/infections/dates.json',
  './data/advice/infections/eggplant.json',
  './data/advice/infections/fig.json',
  './data/advice/infections/garlic.json',
  './data/advice/infections/grape.json',
  './data/advice/infections/groundnut.json',
  './data/advice/infections/lentil.json',
  './data/advice/infections/lettuce.json',
  './data/advice/infections/maize.json',
  './data/advice/infections/mango.json',
  './data/advice/infections/melon.json',
  './data/advice/infections/millet.json',
  './data/advice/infections/oat.json',
  './data/advice/infections/oilpalm.json',
  './data/advice/infections/okra.json',
  './data/advice/infections/olive.json',
  './data/advice/infections/onion.json',
  './data/advice/infections/papaya.json',
  './data/advice/infections/pea.json',
  './data/advice/infections/peach.json',
  './data/advice/infections/pear.json',
  './data/advice/infections/pepper.json',
  './data/advice/infections/pigeonpea.json',
  './data/advice/infections/pineapple.json',
  './data/advice/infections/pistachio.json',
  './data/advice/infections/plum.json',
  './data/advice/infections/pomegranate.json',
  './data/advice/infections/potato.json',
  './data/advice/infections/pumpkin.json',
  './data/advice/infections/rapeseed.json',
  './data/advice/infections/rice.json',
  './data/advice/infections/rye.json',
  './data/advice/infections/sesame.json',
  './data/advice/infections/sorghum.json',
  './data/advice/infections/soybean.json',
  './data/advice/infections/spinach.json',
  './data/advice/infections/strawberry.json',
  './data/advice/infections/sugarbeet.json',
  './data/advice/infections/sugarcane.json',
  './data/advice/infections/sunflower.json',
  './data/advice/infections/sweetpotato.json',
  './data/advice/infections/tea.json',
  './data/advice/infections/tobacco.json',
  './data/advice/infections/tomato.json',
  './data/advice/infections/walnut.json',
  './data/advice/infections/watermelon.json',
  './data/advice/infections/wheat.json',
  './assets/fonts/LICENSE-OFL-IBM-Plex-Sans-Arabic.txt',
  './assets/icons/LICENSE-LUCIDE-ISC.txt',
  './assets/developer.jpg',
  './vendor/tesseract/tesseract.min.js',
  './manifest.json',
  './version.json',
  './config/support.json',
  './icons/icon-192.png',
  './icons/icon-180.png',   /* iOS reads this one for the home screen */
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
  './data/intl-alerts.json',
  './data/reference.json'   /* the display's only source of explanations + shapes */
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
  /* D58: the NON-simd core (tesseract-core-lstm.wasm.js + .wasm, ~6.5MB)
   * left the DEFAULT set: corePath is a DIRECTORY, so tesseract.js picks
   * simd vs non-simd by itself, and every browser since ~2019 supports
   * WASM SIMD. A rare non-simd device fetches its two files on its first
   * ONLINE scan — the isOcrUrl handler below stores them into OCR_CACHE,
   * so the fallback is offline-ready from the second scan onward. */
  './vendor/tesseract/lang/eng.traineddata.gz',
  /* 3.4: ara returns to the RUNTIME set as an on-demand ADDITION, not a
   * default: the engine now initializes ara+eng when the UI language is
   * Arabic (documented hallucination: 28 Arabic glyphs on a Latin label with
   * eng+ara vs 0 with eng-only — docs/ocr-baseline.md §lang) and eng-only
   * otherwise. The ocr-eng-only guard was updated accordingly (it now
   * asserts ara is NEVER a default). */
  './vendor/tesseract/lang/ara.traineddata.gz',
  /* 3.5: vendored zxing wasm — same permanent home so an offline user's
   * barcode layer keeps working across SW updates (930KB, loaded lazily
   * inside a Blob worker on first barcode attempt only). */
  './src/vendor/zxing_reader.wasm'
];

/* Subpath-safe matchers (GitHub Pages serves under /<repo>/): match by
 * pathname suffix, not from the root. FAO stays on the generic cache-first
 * path (as in v6) until the update agent produces the file. */
const isDataUrl = url =>
  /\/data\/(libya-248|libya-500|eu|epa|epa-cancelled)\.json$/.test(url.pathname);
const isOcrUrl = url =>
  (/\/vendor\/tesseract\/(core\/tesseract-core-(simd-)?lstm\.wasm(\.js)?|lang\/(eng|ara)\.traineddata\.gz|worker\.min\.js)$/.test(url.pathname)
   || /\/src\/vendor\/zxing_reader\.wasm$/.test(url.pathname));

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
    /* v27: OCR assets and the zxing wasm deliberately stay OUT of install
     * (documented design, unchanged): ~8.7 MB must not delay SW activation
     * on a first visit. They enter the PERMANENT cache lazily — the
     * isOcrUrl fetch handler stores them into OCR_CACHE on first use, and
     * the explicit prep button keeps its resilient per-file prefetch. */
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
        if (fresh.ok) await safePut(cache, req, fresh.clone());
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
        .then(res => { if (res.ok) return safePut(cache, req, res.clone()).then(() => res); return res; })
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
      if (fresh && fresh.ok && url.origin === location.origin) await safePut(cache, req, fresh.clone());
      return fresh;
    } catch (err) {
      return new Response('offline', { status: 503 });
    }
  })());
});
