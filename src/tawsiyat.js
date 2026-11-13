/*
 * src/tawsiyat.js — قسم «التوصيات الزراعية» (إعادة بناء 2026-10-23)
 * ------------------------------------------------------------------
 * المصدر الوحيد: كتاب «التوصيات المعتمدة لمكافحة الآفات الزراعية 2025»
 * (لجنة مبيدات الآفات الزراعية · Recomm25.pdf). لا دواوين خارجية ولا
 * روابط زراعية خارجية ولا نصوص مُولَّدة:
 *   - data/tws/manifest.json   عدّادات وإحصاء المصدر وCAS والتدقيق
 *   - data/tws/crops.json      فهرس المحاصيل (50) × إصابات الكتاب (258)
 *   - data/tws/labels.json     تسميات الواجهة (ar/en) — هذه النسخة احتياطية مدمجة
 *   - data/tws/sections.json   بطاقات الأقسام كاملة (تُحمَّل عند أول بطاقة)
 *   - data/tws/img/*.webp      صور الكتاب المنسوبة لصفحاتها
 * كل قيمة زراعية (مظهر/ميعاد/توقيت/إرشاد/معدل/WHO/PHI/MRL/CAS) تُعرض
 * حرفيًا من بيانات الكتاب — بلا تحويلات رقمية وبلا إعادة صياغة. ما لم يُؤكَّد
 * في سطر الطباعة يظهر بشارة «يحتاج تحققًا» ولا يُقدَّم كحقيقة.
 *
 * التوجيه: #/tws | #/tws/<crop> | #/tws/<crop>/<type>.<n> — app.js يحوّل
 * المسار إلى العرض عبر currentView() ثم يستدعي Tawsiyat.mount()، وزر
 * رجوع المتصفح يعمل لأن كل مستويات المسار hash أصلي.
 */
(function () {
  'use strict';

  /* نصوص احتياطية مطابقة لـ data/tws/labels.json — تُستبدل فور تحميل الملف */
  var LABELS = {
    ar: {
      title: 'التوصيات الزراعية',
      subtitle: 'اختر محصولك ثم الإصابة لتصل إلى بطاقة من كتاب التوصيات المعتمدة 2025 وحده: وصف الإصابة كما ورد، وجدول العلاج بمادته وتركيزه ومعدل استخدامه وتصنيف WHO وفترة أمانه، وصور من الكتاب — بلا مصادر خارجية وبلا تخمين.',
      search_ph: 'ابحث عن محصول… (عربي أو Scientific name)',
      no_results: 'لا يوجد محصول بهذا الاسم',
      crops_count: 'محصولاً مغطّى بالكتاب',
      cards_count: 'بطاقة إصابة',
      back_crops: 'كل المحاصيل',
      infections_of: 'إصابة من الكتاب لهذا المحصول',
      sci: 'الاسم العلمي',
      family: 'العائلة',
      type: 'النوع',
      infection_no: 'إصابة رقم',
      page: 'صفحة',
      group: 'المجموعة في المصدر',
      symptoms: 'مظهر الإصابة',
      appearance: 'ميعاد ظهور الإصابة',
      timing: 'توقيت المكافحة',
      guidance: 'الإرشادات',
      products: 'جدول التوصيات في الكتاب',
      actives: 'المادة الفعالة',
      conc: 'التركيز',
      form: 'التركيبة',
      rate: 'معدل الاستخدام',
      who: 'تصنيف WHO',
      phi: 'فترة الأمان (PHI)',
      mrl: 'قيم MRL',
      cas: 'رقم CAS',
      cas_ambiguous: 'CAS ملتبس — لا يُعرض رقم',
      cas_none: 'لا رقم CAS في السجلات',
      images: 'صور من الكتاب',
      cas_unverified: 'قيد التحقق',
      examples: 'أمثلة من المصدر',
      extra_guidance: 'إرشادات خاصة',
      needs_verify: 'قيمة تحتاج تحققًا — غير مؤكدة في سطر الطباعة',
      name_review: 'عنوان يحتاج مراجعة',
      crop_conflict: 'تسمية محصول تحت المراجعة',
      'coverage': 'التغطية',
      coverage_line: 'من الكتاب: {c} بطاقة · {k} محصولاً',
      img_sync_title: 'صور الكتاب للعمل دون إنترنت',
      img_sync_done: 'محفوظة كاملة ({n} صورة)',
      img_sync_prog: 'جارٍ الحفظ: {a} من {n}',
      img_sync_part: 'محفوظ {a} من {n}',
      img_sync_fail: 'تعذّر حفظ {f} صورة (رمز {c})',
      img_sync_btn: 'حفظ الصور الآن',
      gal_h: "معرض صور الآفة أو المرض",
      gal_book: "من الكتاب",
      gal_organism: "صورة الآفة",
      gal_host: "على المحصول",
      gal_dl: "تحميل صور هذا المحصول ({n} صورة، {mb} ميغابايت)",
      gal_prog: "جارٍ تحميل الصور: {a} من {n}",
      gal_done: "صور المعرض محفوظة على جهازك للعمل دون إنترنت.",
      gal_fail: "تعذّر تحميل بعض الصور ({f}). أعد المحاولة.",
      gal_offline: "يلزم اتصال بالإنترنت مرة واحدة لتحميل صور هذا المحصول.",
      gal_src: "المصدر",
      gal_by: "المؤلف",
      gal_hint: "صور مفتوحة الترخيص إضافة إلى صور الكتاب. تُحمَّل عند طلبك فقط وتخص محصولًا واحدًا.",
      img_sync_offline: 'يلزم اتصال بالإنترنت لحفظ الصور',
      'dose_note': 'المادة والتركيز وفترة الأمان وتصنيف WHO وقيم MRL مُساقَة حرفياً من جداول الكتاب. أما المعدل المطبوع بالفدان فيُعرض محوَّلاً إلى هكتار تقريباً (1 فدان ≈ 0.42 هكتار) ومعه المطبوع كما ورد — لا تُعرض هنا جرعات مخترعة.',
      'rate_printed': 'المطبوع',
      'rate_kept': 'بالفدان كما طُبع',
      load_error_title: 'تعذّر تحميل بيانات التوصيات',
      load_error_body: 'يفشل تحميل الفهرس — تحقّق من الاتصال أول مرة، أو أعد المحاولة بعد تجهيز التطبيق للعمل دون اتصال.',
      retry: 'إعادة المحاولة',
      detail_error_title: 'تعذّر تحميل بطاقة القسم من الكتاب',
      'a7_link_title': 'الملحق 7 — محاصيل مساحاتها أقل من 50 ألف فدان',
      'a7_link_desc': 'مبيدات مقترحة للتجريب تمهيدًا لتسجيلها، وليست توصيات معتمدة',
      'a7_title': 'الملحق 7: المحاصيل الأقل مساحة',
      'a7_banner': 'هذه المبيدات «مقترحة للتجريب تمهيدًا لتسجيلها» كما ورد في الكتاب؛ لا معدلات ولا فترات أمان ولا توصية معتمدة بعد. لا تُستخدم كتوصية.',
      'a7_intro_note': 'نص مقدمة الملحق كما طُبع (بالعربية)',
      'a7_section': 'القسم',
      'a7_crops': 'المحاصيل ومساحاتها (فدان)',
      'a7_insects': 'الحشرات والمبيدات المقترحة',
      'a7_diseases': 'الأمراض والمبيدات المقترحة',
      'a7_weeds': 'الحشائش والمبيدات المقترحة',
      'a7_for_crops': 'للمحاصيل',
      'a7_nolink': 'في هذا القسم لا يربط الجدول المطبوع كل آفة بمحصول بعينه؛ القائمة لمجموعة المحاصيل كلها.',
      'a7_source': 'المصدر: كتاب APC 2025، الملحق 7، صفحة {p}',
      'a7_names_note': 'أسماء المحاصيل والآفات والحشائش كما طُبعت بالعربية؛ أسماء المواد الفعالة كما طُبعت بالإنجليزية.',
      'a7_none': '—',
      'a7_error': 'تعذّر تحميل الملحق 7'
    },
    en: {
      title: 'Crop recommendations',
      subtitle: 'Pick a crop, then an infection, to reach a card built solely from the official Recomm2025 book: the described symptoms, its treatment table with active ingredient, concentration, application rate, WHO class and PHI, plus images from the book — no outside sources, no guessing.',
      search_ph: 'Search a crop… (Arabic or Scientific name)',
      no_results: 'No crop matches',
      crops_count: 'crops covered by the book',
      cards_count: 'infection cards',
      back_crops: 'All crops',
      infections_of: 'infection from the book for this crop',
      sci: 'Scientific name',
      family: 'Family',
      type: 'Type',
      infection_no: 'Infection no.',
      page: 'Page',
      group: 'Group in source',
      symptoms: 'Symptoms',
      appearance: 'When it appears',
      timing: 'Control timing',
      guidance: 'Guidance',
      products: 'Recommendation table in the book',
      actives: 'Active ingredient',
      conc: 'Concentration',
      form: 'Formulation',
      rate: 'Application rate',
      who: 'WHO class',
      phi: 'PHI (harvest interval)',
      mrl: 'MRL values',
      cas: 'CAS no.',
      cas_ambiguous: 'Ambiguous CAS — no number shown',
      cas_none: 'No CAS number in the registries',
      images: 'Images from the book',
      cas_unverified: 'under verification',
      examples: 'Examples from the source',
      extra_guidance: 'Special guidance',
      needs_verify: 'Value needs verification — not confirmed on the print line',
      name_review: 'Heading needs review',
      crop_conflict: 'Crop label under review',
      'coverage': 'Coverage',
      coverage_line: 'From the book: {c} cards · {k} crops',
      img_sync_title: 'Book images for offline use',
      img_sync_done: 'All saved ({n} images)',
      img_sync_prog: 'Saving: {a} of {n}',
      img_sync_part: 'Saved {a} of {n}',
      img_sync_fail: 'Could not save {f} images (code {c})',
      img_sync_btn: 'Save images now',
      gal_h: "Pest or disease photo gallery",
      gal_book: "From the book",
      gal_organism: "Pest photo",
      gal_host: "On the crop",
      gal_dl: "Download this crop's photos ({n} photos, {mb} MB)",
      gal_prog: "Downloading photos: {a} of {n}",
      gal_done: "Gallery photos are saved on your device for offline use.",
      gal_fail: "Some photos could not be downloaded ({f}). Try again.",
      gal_offline: "An internet connection is needed once to download this crop's photos.",
      gal_src: "Source",
      gal_by: "Author",
      gal_hint: "Openly licensed photos in addition to the book's images. Downloaded only on request, one crop at a time.",
      img_sync_offline: 'An internet connection is needed to save the images',
      'dose_note': 'Ingredient, concentration, PHI, WHO class and MRL values are quoted verbatim from the book tables. A rate printed per feddan is shown converted to per hectare (1 feddan ≈ 0.42 ha), with the printed value beside it — no invented doses here.',
      'rate_printed': 'printed',
      'rate_kept': 'per feddan, as printed',
      load_error_title: 'Could not load recommendation data',
      load_error_body: 'The index failed to load — connect once, or retry after the app is prepared for offline.',
      retry: 'Retry',
      detail_error_title: 'Could not load this section card from the book',
      'a7_link_title': 'Appendix 7 — minor crops (under 50,000 feddan)',
      'a7_link_desc': 'Pesticides proposed for trials ahead of registration — not approved recommendations',
      'a7_title': 'Appendix 7: minor crops',
      'a7_banner': 'These pesticides are "proposed for trials ahead of registration", as stated in the book: no rates, no pre-harvest intervals, and no approved recommendation yet. Do not use as a recommendation.',
      'a7_intro_note': 'Appendix introduction (translated from the printed Arabic)',
      'a7_section': 'Section',
      'a7_crops': 'Crops and areas (feddan)',
      'a7_insects': 'Insects and proposed pesticides',
      'a7_diseases': 'Diseases and proposed pesticides',
      'a7_weeds': 'Weeds and proposed herbicides',
      'a7_for_crops': 'For crops',
      'a7_nolink': 'In this section the printed table does not tie each pest to a specific crop; the list applies to the whole crop group.',
      'a7_source': 'Source: APC 2025 book, Appendix 7, page {p}',
      'a7_names_note': 'Crop, pest and weed names are translated from the printed Arabic. Egyptian local names with no reliable equivalent are transliterated and marked “local name”; active ingredient names are as printed in English.',
      'a7_none': '—',
      'a7_error': 'Could not load Appendix 7'
    }
  };

  var TYPE_AR = {
    insect: 'حشرة', mite: 'عنكبوتية', fungus: 'فطر', pseudo_fungus: 'شبه فطر',
    bacterium: 'بكتيريا', virus: 'فيروس', nematode: 'دودة خيطية', weed: 'عشب ضار',
    mollusc: 'رخويات', other: 'أخرى'
  };
  var TYPE_EN = {
    insect: 'Insect', mite: 'Mite', fungus: 'Fungus', pseudo_fungus: 'Oomycete',
    bacterium: 'Bacterium', virus: 'Virus', nematode: 'Nematode', weed: 'Weed',
    mollusc: 'Mollusc', other: 'Other'
  };

  var S = { man: null, crops: null, labels: null, sec: null, load: null, secLoad: null, err: null, filter: '' };

  /* اللغة الفعلية للواجهة: ar | en | fr | zh */
  function loc() {
    var c = String(document.documentElement.lang || 'ar').toLowerCase().slice(0, 2);
    return (c === 'en' || c === 'fr' || c === 'zh') ? c : 'ar';
  }
  function lang() {
    return (document.documentElement.lang || 'ar').toLowerCase().indexOf('en') === 0 ? 'en' : 'ar';
  }
  function L(k) {
    var d = (S.labels && (S.labels[loc()] || S.labels[lang()] || S.labels.ar)) || LABELS.ar;
    return (d && d[k]) || LABELS.ar[k] || k;
  }
  /* ترجمة نص بطاقة (الأصل العربي مرجع؛ تظهر الإنجليزية فقط إن وُجدت وإلا يبقى العربي) */
  function tx(s, f, ar) {
    if (loc() !== 'ar' && S.i18n && S.i18n.cards && S.i18n.cards[loc()]) {
      var t = S.i18n.cards[loc()][s.crop_id + '/' + s.type + '.' + s.n];
      if (t && t[f]) return t[f];
    }
    return ar;
  }
  /* names follow the app language: Arabic only in Arabic; the other languages use their own
   * translated crop / infection names (card_i18n.json, full coverage), never the Arabic print */
  function cropName(c) {
    if (loc() === 'ar') return c.name_ar;
    var m = S.i18n && S.i18n.crops && S.i18n.crops[loc()];
    return (m && m[c.id]) || c.name_en || c.name_ar;
  }
  function infName(c, inf) {
    if (loc() === 'ar') return inf.name_ar;
    var m = S.i18n && S.i18n.cards && S.i18n.cards[loc()];
    var t = m && m[c.id + '/' + inf.type + '.' + inf.n];
    return (t && t.name) || inf.name_ar;
  }
  /* نوع الآفة المعروض يتبع «مجموعة الآفة» المطبوعة في الكتاب إن وُجدت (التصنيف الآلي القديم أخطأ في 23 بطاقة)؛ المسار والمعرّف لا يتغيّران */
  var GROUP_TYPE = { 'الحشرات': 'insect', 'الفطريات': 'fungus', 'الأكاروسات': 'mite', 'النيماتودا': 'nematode', 'البكتيريا': 'bacterium', 'الفقاريات': 'other', 'اللافقاريات': 'other' };
  function shownType(s) { return s.type || GROUP_TYPE[s.group]; }
  var TYPE_FR = { insect: 'Insecte', mite: 'Acarien', fungus: 'Champignon', pseudo_fungus: 'Oomycète', bacterium: 'Bactérie', virus: 'Virus', nematode: 'Nématode', weed: 'Adventice', mollusc: 'Mollusque', other: 'Autre' };
  var TYPE_ZH = { insect: '昆虫', mite: '螨类', fungus: '真菌', pseudo_fungus: '卵菌', bacterium: '细菌', virus: '病毒', nematode: '线虫', weed: '杂草', mollusc: '软体动物', other: '其他' };
  function typeName(t) { var c = loc(); return (c === 'fr' ? TYPE_FR[t] : c === 'zh' ? TYPE_ZH[t] : c === 'en' ? TYPE_EN[t] : TYPE_AR[t]) || t; }
  /* ترجمة وحدات المعدل فقط (الأرقام والرموز تبقى حرفيًا كما طُبعت في الكتاب) */
  var UNITS = {
    en: { 'لتر': 'L', 'سم³': 'cm³', 'جم': 'g', 'كجم': 'kg', 'طن': 'ton', 'هكتار': 'ha', 'فدان': 'feddan', 'ماء': 'water', 'تقاوى': 'seed', 'تقاوي': 'seed', 'درنات': 'tubers', 'صوب': 'greenhouse', 'مرة': 'time', 'أو': 'or', 'م³': 'm³', 'فراغ': 'space', 'نبات': 'plant', 'شجرة': 'tree', 'رش جزئى': 'spot spray', 'حقن': 'injection' },
    fr: { 'لتر': 'L', 'سم³': 'cm³', 'جم': 'g', 'كجم': 'kg', 'طن': 'tonne', 'هكتار': 'ha', 'فدان': 'feddan', 'ماء': 'eau', 'تقاوى': 'semences', 'تقاوي': 'semences', 'درنات': 'tubercules', 'صوب': 'serre', 'مرة': 'fois', 'أو': 'ou', 'م³': 'm³', 'فراغ': 'volume', 'نبات': 'plante', 'شجرة': 'arbre', 'رش جزئى': 'pulvérisation partielle', 'حقن': 'injection' },
    zh: { 'لتر': '升', 'سم³': '立方厘米', 'جم': '克', 'كجم': '千克', 'طن': '吨', 'هكتار': '公顷', 'فدان': '费丹', 'ماء': '水', 'تقاوى': '种子', 'تقاوي': '种子', 'درنات': '块茎', 'صوب': '温室', 'مرة': '次', 'أو': '或', 'م³': '立方米', 'فراغ': '空间', 'نبات': '株', 'شجرة': '棵', 'رش جزئى': '局部喷雾', 'حقن': '注射' }
  };
  function rateTranslate(r) {
    var u = UNITS[loc()];
    if (!u || !r) return r;
    return r.replace(/[\u0621-\u064A\u00B3]+(?: جزئى)?/g, function (w) { return u[w] !== undefined ? u[w] : w; });
  }
  function rateText(p) { return rateTranslate(String(p['معدل الاستخدام'] || '')); }
  /* المعدل بالفدان → هكتار (1 فدان ≈ 0.42 هكتار): تُحوَّل الصيغة البسيطة فقط (رقم + وحدة/فدان
     مع تكرار مطبعي أو ملاحظة بين قوسين)؛ ويبقى المطبوع ظاهرًا بجانبه، وأي صيغة أعقد تبقى كما طُبعت. */
  var FEDDAN_HA = 0.42;
  var SIMPLE_FEDDAN = /^\s*([0-9]+(?:[.,][0-9]+)?)\s*(سم³|جم|لتر|كجم)\s*\/\s*فدان(?:\s*(?:سم³|جم|لتر|كجم)\s*\/\s*فدان)?\s*(\([^()]*\))?\s*$/;
  function sig3(x) { return String(parseFloat(x.toPrecision(3))); }
  function feddanToHectare(raw) {
    var m = SIMPLE_FEDDAN.exec(raw);
    if (!m) return null;
    var v = parseFloat(m[1].replace(',', '.'));
    if (!isFinite(v) || v <= 0) return null;
    var unit = m[2], x = v / FEDDAN_HA;
    if (unit === 'سم³' && x >= 1000) { x = x / 1000; unit = 'لتر'; }
    else if (unit === 'جم' && x >= 1000) { x = x / 1000; unit = 'كجم'; }
    return sig3(x) + ' ' + unit + '/هكتار' + (m[3] ? ' ' + m[3] : '');
  }
  function rateHtml(p) {
    var raw = String(p['معدل الاستخدام'] || '');
    if (!raw) return '—';
    var conv = feddanToHectare(raw);
    if (conv) {
      return esc(rateTranslate(conv)) + ' <small class="tws-printed" dir="auto">(' + esc(L('rate_printed')) + ': ' + esc(rateTranslate(raw)) + ')</small>';
    }
    return esc(rateTranslate(raw)) + (raw.indexOf('فدان') >= 0 ? ' <small class="tws-printed" dir="auto">(' + esc(L('rate_kept')) + ')</small>' : '');
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- التحميل ---------- */
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' → ' + r.status);
      return r.json();
    });
  }
  /* ---------- حفظ صور الكتاب للعمل دون إنترنت (من الصفحة، بعدّاد ظاهر) ---------- */
  var IMG_CACHE = 'mustashar-tws-img';
  var IMG = { list: null, have: 0, n: 0, fail: 0, code: '', busy: false, started: false };
  function imgBoxHtml() {
    if (!IMG.n) return '';
    var s;
    if (IMG.have >= IMG.n) s = L('img_sync_done').replace('{n}', IMG.n);
    else if (IMG.busy) s = L('img_sync_prog').replace('{a}', IMG.have).replace('{n}', IMG.n);
    else s = L('img_sync_part').replace('{a}', IMG.have).replace('{n}', IMG.n)
      + (IMG.fail ? ' · ' + L('img_sync_fail').replace('{f}', IMG.fail).replace('{c}', IMG.code) : '')
      + (navigator.onLine === false ? ' · ' + L('img_sync_offline') : '');
    var btn = (IMG.have < IMG.n && !IMG.busy) ? ' <button type="button" class="tws-btn" data-tws-imgsync>' + esc(L('img_sync_btn')) + '</button>' : '';
    return '<b>' + esc(L('img_sync_title')) + ':</b> ' + esc(s) + btn;
  }
  function imgPaint() {
    var el = document.getElementById('twsImgSync');
    if (el) el.innerHTML = imgBoxHtml();
  }
  function imgSync() {
    if (!('caches' in window) || IMG.busy) return Promise.resolve();
    IMG.busy = true; IMG.fail = 0; IMG.code = '';
    var base = document.baseURI || location.href;
    return (IMG.list ? Promise.resolve(IMG.list) : fetchJSON('data/tws/img-list.json').then(function (l) { IMG.list = l; return l; }))
      .then(function (list) {
        IMG.n = list.length;
        return caches.open(IMG_CACHE).then(function (c) {
          return c.keys().then(function (ks) {
            var have = {}; ks.forEach(function (r) { have[new URL(r.url).pathname] = 1; });
            var todo = [];
            list.forEach(function (f) {
              var u = new URL('data/tws/img/' + f, base);
              if (have[u.pathname]) return;
              todo.push(u.href);
            });
            IMG.have = list.length - todo.length; imgPaint();
            if (!todo.length) return;
            if (navigator.onLine === false) return;
            var idx = 0, tick = 0;
            function worker() {
              if (idx >= todo.length) return Promise.resolve();
              var u = todo[idx++];
              return fetch(u).then(function (r) {
                if (!r.ok) { IMG.fail++; IMG.code = r.status; return; }
                return c.put(u, r).then(function () { IMG.have++; });
              }).catch(function (e) { IMG.fail++; IMG.code = (e && e.name) || 'net'; })
                .then(function () { if (++tick % 6 === 0) imgPaint(); return worker(); });
            }
            return Promise.all([worker(), worker(), worker(), worker()]);
          });
        });
      })
      .catch(function (e) { IMG.fail++; IMG.code = (e && e.name) || 'err'; })
      .then(function () { IMG.busy = false; imgPaint(); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-tws-imgsync]');
    if (b) imgSync();
  });
  window.addEventListener('online', function () { if (!IMG.started) { IMG.started = true; imgSync(); } else if (IMG.n && IMG.have < IMG.n) imgSync(); });
  /* تلقائيًا من أول تشغيل وبلا أي إجراء من المستخدم: مرة واحدة بعد اكتمال تحميل التطبيق، ويستأنف عند عودة الاتصال */
  function imgAuto() {
    setTimeout(function () {
      if (navigator.onLine === false) return;
      if (!IMG.started) { IMG.started = true; imgSync(); }
    }, 2500);
  }
  if (document.readyState === 'complete') imgAuto(); else window.addEventListener('load', imgAuto);

  function loadIndex() {
    if (S.load) return S.load;
    S.load = Promise.all([
      fetchJSON('data/tws/manifest.json'),
      fetchJSON('data/tws/crops.json'),
      fetchJSON('data/tws/labels.json').catch(function () { return null; }),
      fetchJSON('data/tws/card_i18n.json').catch(function () { return null; })
    ]).then(function (r) {
      S.man = r[0]; S.crops = r[1];
      if (r[2] && r[2].ar && r[2].en) S.labels = r[2];
      if (r[3] && !S.i18n) S.i18n = r[3];
      S.err = null;
    }).catch(function (e) { S.err = e; S.load = null; });
    return S.load;
  }
  /* بطاقات الأقسام كاملة — تُحمَّل عند أول فتح بطاقة وتبقى في الذاكرة والكاش */
  function loadSections() {
    if (S.sec) return Promise.resolve(S.sec);
    if (S.secLoad) return S.secLoad;
    S.secLoad = Promise.all([
      fetchJSON('data/tws/sections.json'),
      fetchJSON('data/tws/card_i18n.json').catch(function () { return null; })
    ]).then(function (r) {
      var d = r[0]; S.i18n = r[1] || S.i18n;
      S.sec = d; S.secLoad = null; return d;
    }).catch(function (e) { S.secLoad = null; throw e; });
    return S.secLoad;
  }

  /* ---------- استخراج حرفي من نص المادة (لا اختراع: قطع نص كما ورد) ---------- */
  function parseForm(name) {
    var m = String(name || '').trim().match(/(?:^|\s)([A-Z]{2,4})$/);
    return m ? m[1] : null;
  }
  function parseConc(name) {
    var m = String(name || '').match(/(%[\d.]+)\s*(?:[A-Z]{2,4})?$/);
    return m ? m[1] : null;
  }

  /* ---------- الحقن ---------- */
  var CSS = [
    '.tws-head{margin:0 0 14px}',
    '.tws-head h1{font-size:1.35rem;margin:0 0 6px}',
    '.tws-head p{color:var(--muted);font-size:.92rem;line-height:1.7;margin:0}',
    '.tws-search{width:100%;padding:12px 14px;border:1px solid var(--control);border-radius:12px;background:var(--field);color:var(--text);font:inherit;font-size:1rem;margin:12px 0 6px}',
    '.tws-search:focus{outline:2px solid var(--primary-ink);outline-offset:1px}',
    '.tws-count{color:var(--muted);font-size:.82rem;margin:0 0 12px}',
    '.tws-a7link{display:flex;flex-direction:column;gap:4px;margin:0 0 12px;padding:12px;border:1px dashed var(--border);border-radius:12px;background:var(--card);color:var(--text);text-decoration:none}',
    '.tws-a7link span{font-size:.82rem;color:var(--muted)}',
    '.tws-a7note{margin:0 0 14px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--card);font-size:.9rem;line-height:1.7}',
    '.tws-a7sec{margin:0 0 18px;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--card)}',
    '.tws-a7sec h2{margin:0 0 6px;font-size:1.05rem}',
    '.tws-a7sec h3{margin:12px 0 6px;font-size:.95rem}',
    '.tws-a7sec ul{margin:0;padding:0 18px}',
    '.tws-a7sec li{margin:0 0 6px;line-height:1.7}',
    '.tws-a7sec .act{direction:ltr;unicode-bidi:isolate;display:inline-block}',
    '.tws-errata{margin:10px 0}.tws-errata summary{cursor:pointer;font-weight:700}.tws-errata h3{margin:16px 0 6px;font-size:1rem}.tws-errata{max-width:100%;overflow:hidden}.tws-errata-wrap{overflow-x:auto;max-width:calc(100vw - 56px)}.tws-errata-t td,.tws-errata-t th{overflow-wrap:anywhere}.tws-errata-t{border-collapse:collapse;width:100%;table-layout:fixed;font-size:.85rem}.tws-errata-t th,.tws-errata-t td{border:1px solid var(--border,#8884);padding:4px 7px;text-align:start;vertical-align:top}.tws-errata-t th{background:var(--card-2,#8881)}',
    '.tws-a7intro{margin:0 0 14px}.tws-a7intro p{direction:rtl;text-align:right;line-height:1.9}',
    '.tws-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;margin:0 0 18px;padding:0;list-style:none}',
    '.tws-crop{display:flex;flex-direction:column;gap:4px;min-height:76px;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--card);color:var(--text);text-decoration:none}',
    '.tws-crop:hover,.tws-crop:focus-visible{border-color:var(--primary-ink)}',
    '.tws-crop b{font-size:1.02rem}',
    '.tws-crop .en{color:var(--muted);font-size:.78rem;direction:ltr;text-align:start}',
    '.tws-crop .n{color:var(--primary-strong);font-size:.78rem}',
    '.tws-crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 12px;font-size:.86rem}',
    '.tws-crumb a{color:var(--primary-ink);text-decoration:none;padding:6px 2px}',
    '.tws-crumb a:hover{text-decoration:underline}',
    '.tws-crumb .sep{color:var(--muted)}',
    '.tws-crumb .cur{color:var(--muted)}',
    '.tws-meta{color:var(--muted);font-size:.84rem;line-height:1.8;margin:0 0 14px}',
    '.tws-meta em{font-style:italic}',
    '.tws-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}',
    '.tws-list{display:flex;flex-direction:column;gap:8px;margin:0 0 18px;padding:0;list-style:none}',
    '.tws-inf{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--card);color:var(--text);text-decoration:none;min-height:56px}',
    '.tws-inf:hover,.tws-inf:focus-visible{border-color:var(--primary-ink)}',
    '.tws-inf .no{flex:0 0 auto;min-width:2.2em;text-align:center;color:var(--primary-strong);font-weight:700}',
    '.tws-inf .nm{flex:1 1 auto;min-width:0}',
    '.tws-inf .nm b{display:block;font-size:.98rem}',
    '.tws-inf .nm .grp{display:block;color:var(--muted);font-size:.75rem}',
    '#view-tws .tws-sub{margin:14px 0 6px;padding:6px 10px;border-radius:10px;background:var(--field);font-size:.9rem}',
    '.tws-chip{flex:0 0 auto;font-size:.72rem;padding:4px 9px;border-radius:999px;border:1px solid transparent;white-space:nowrap}',
    '.tws-chip.pg{background:var(--primary-soft);color:var(--primary-strong);border-color:var(--primary-ink)}',
    '.tws-printed{opacity:.75;font-size:.8em}',
    '.tws-chip.warn{background:var(--st-review-soft);color:var(--st-review-ink);border-color:var(--st-review)}',
    '.tws-chip.info{background:rgba(127,184,245,.14);color:var(--st-info);border-color:var(--st-info)}',
    '.tws-card{padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--card);margin:0 0 12px}',
    '.tws-card h2{font-size:1.05rem;margin:0 0 4px}',
    '.tws-card h3{font-size:.95rem;margin:14px 0 8px;color:var(--primary-strong)}',
    '.tws-card ul{margin:0;padding-inline-start:20px}',
    '.tws-card li{line-height:1.8;font-size:.93rem;margin:0 0 8px}',
    '.tws-card p.txt{line-height:1.9;font-size:.93rem;margin:0 0 10px}',
    '.tws-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin:0 0 12px}',
    '.tws-gallery figure{margin:0}',
    '.tws-gallery img{transition:transform .25s ease,box-shadow .25s ease}',
    '@media (hover:hover){.tws-gallery figure:hover img{transform:translateY(-3px) scale(1.04);box-shadow:0 10px 24px rgba(0,0,0,.28)}}',
    '@media (hover:none){.tws-gallery figure:active img{transform:translateY(-3px) scale(1.04);box-shadow:0 10px 24px rgba(0,0,0,.28)}}',
    '.tws-gallery.rv figure{opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s ease}',
    '.tws-gallery.rv figure.in{opacity:1;transform:none}',
    '@media (prefers-reduced-motion:reduce){.tws-gallery.rv figure{opacity:1;transform:none;transition:none}.tws-gallery img{transition:none}.tws-gallery figure:hover img{transform:none}}',
    '.tws-gallery img{width:100%;height:auto;border-radius:10px;border:1px solid var(--border);display:block;background:var(--field)}',
    '.tws-gallery figcaption{color:var(--muted);font-size:.7rem;text-align:center;margin-top:3px}',
    '.tws-bdg{display:inline-block;border:1px solid var(--border);border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:700;color:var(--text,inherit);background:var(--field)}',
    '.tws-bdg.book{border-style:dashed}.tws-bdg.org{border-style:solid}.tws-bdg.host{border-width:2px}',
    '.tws-gallery figcaption a{color:inherit;text-decoration:underline}',
    '.tws-prod{border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin:0 0 8px;background:var(--field)}',
    '.tws-prod .act{font-size:.9rem;line-height:1.7;margin:0 0 6px}',
    '.tws-prod .act .nm{direction:ltr;unicode-bidi:embed}',
    '.tws-prod .row{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:.82rem;margin:0 0 4px;color:var(--text)}',
    '.tws-prod .row b{color:var(--primary-strong)}',
    '.tws-parsed{display:inline-block;font-size:.74rem;padding:2px 8px;border-radius:999px;background:var(--primary-soft);color:var(--primary-strong);direction:ltr}',
    '.tws-cas{display:inline-block;font-size:.76rem;padding:3px 9px;border-radius:999px;border:1px solid var(--st-ok);background:var(--st-ok-soft);color:var(--st-ok-ink);direction:ltr;margin:0 4px 4px 0}',
    '.tws-cas.amb{border-color:var(--st-review);background:var(--st-review-soft);color:var(--st-review-ink);direction:rtl}',
    '.tws-cas.none{border-color:var(--border);background:var(--card);color:var(--muted);direction:rtl}',
    '.tws-src{font-size:.85rem;line-height:1.8}',
    '.tws-src a{color:var(--primary-ink);word-break:break-word}',
    '.tws-note{border-inline-start:3px solid var(--st-review);background:var(--st-review-soft);border-radius:8px;padding:10px 12px;margin:10px 0;font-size:.86rem;line-height:1.8;color:var(--text)}',
    '.tws-note.info{border-inline-start-color:var(--st-info);background:rgba(127,184,245,.10)}',
    '.tws-foot{color:var(--muted);font-size:.78rem;line-height:1.8;border-top:1px solid var(--border);padding-top:10px;margin:16px 0 0}',
    '.tws-err{padding:24px 16px;text-align:center}',
    '.tws-err h2{font-size:1.05rem;margin:0 0 8px}',
    '.tws-err p{color:var(--muted);line-height:1.8;margin:0 0 14px;font-size:.9rem}',
    '.tws-btn{display:inline-block;padding:10px 22px;border-radius:10px;background:var(--primary);color:var(--on-primary);border:0;font:inherit;font-size:.95rem;cursor:pointer}',
    '@media (max-width:360px){.tws-grid{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:6px}.tws-crop{padding:10px}}',
    '#view-tws .tws-reg-status{margin:6px 0 10px;display:flex;flex-direction:column;gap:5px}',
    '#view-tws .tws-reg-line{display:flex;flex-wrap:wrap;align-items:center;gap:5px}',
    '#view-tws .tws-reg-name{font-size:.74rem;color:var(--muted);margin-inline-end:2px}',
    '#view-tws .tws-reg-badge{display:inline-flex;gap:5px;align-items:center;padding:2px 9px;border:1px solid currentColor;border-radius:999px;font-size:.74rem;line-height:1.6;white-space:nowrap}',
    '#view-tws .tws-reg-badge b{font-weight:700}',
    '#view-tws .tws-reg-badge.ban{color:var(--st-ban-ink);background:var(--st-ban-soft)}',
    '#view-tws .tws-reg-badge.ok{color:var(--st-ok-ink);background:var(--st-ok-soft)}',
    '#view-tws .tws-reg-badge.review{color:var(--st-review-ink);background:var(--st-review-soft)}',
    '#view-tws .tws-reg-badge.unknown{color:var(--muted);background:var(--field);border-color:var(--border)}',
    '#view-tws .tws-reg-note{font-size:.76rem;color:var(--muted)}',
    '#view-tws .tws-reg-note summary{cursor:pointer}',
    '#view-tws .tws-reg-note p{margin:4px 0 0;line-height:1.7}'
  ].join('\n');

  function ensureInjected() {
    if (document.getElementById('view-tws')) return;
    if (!document.getElementById('tws-style')) {
      var st = document.createElement('style');
      st.id = 'tws-style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var sec = document.createElement('section');
    sec.className = 'view';
    sec.id = 'view-tws';
    sec.setAttribute('data-view', 'tws');
    sec.setAttribute('aria-label', LABELS.ar.title);
    sec.hidden = true;
    var main = document.getElementById('appMain');
    if (!main) return;
    main.appendChild(sec);
    sec.addEventListener('input', function (e) {
      if (e && e.target && e.target.id === 'twsFilter') {
        S.filter = e.target.value || '';
        renderCrops();
        var f = document.getElementById('twsFilter');
        if (f) { f.focus(); try { f.setSelectionRange(f.value.length, f.value.length); } catch (err) {} }
      }
    });
    sec.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('[data-tws-retry]');
      if (btn) {
        S.load = null; S.secLoad = null; S.sec = null; S.err = null;
        loadIndex().then(function () { route(); });
      }
    });
  }

  /* ---------- المسار ---------- */
  function mount() {
    ensureInjected();
    /* applyView يمرّ على العناصر قبل أن يُحقن هذا القسم لأول مرة، فتبقى
     * hidden=true؛ نضبط الإخفاء هنا بعد الحقن ليعمل المسار عند أول فتح. */
    var sec = document.getElementById('view-tws');
    if (sec) sec.hidden = (location.hash.replace(/^#\/?/, '').split('/')[0] !== 'tws');
    route();
    document.removeEventListener('langchange', route);
    document.addEventListener('langchange', route);
    document.removeEventListener('modechange', route);
    document.addEventListener('modechange', route);
    document.removeEventListener('regulatorydbchange', route);
    document.addEventListener('regulatorydbchange', route);
  }
  function route() {
    var sec = document.getElementById('view-tws');
    if (!sec) return;
    var parts = (location.hash.replace(/^#\/?/, '') || 'tws').split('/');
    var crop = parts[1] || '';
    /* رقم البطاقة = <type>.<n> لأن الترقيم يبدأ عند 1 داخل كل نوع */
    var seg = parts[2] || '';
    var dot = seg.lastIndexOf('.');
    var infType = dot > 0 ? seg.slice(0, dot) : '';
    var n = dot > 0 ? seg.slice(dot + 1) : '';
    loadIndex().then(function () {
      if (S.err || !S.man || !S.crops) { sec.innerHTML = errorPanel(); return; }
      if (!crop) { renderCrops(); return; }
      if (crop === 'appendix7') { renderAppendix7(sec); return; }
      if (crop === 'barley') { renderBarley(sec, seg); return; }
      var c = findCrop(crop);
      if (!c) { sec.innerHTML = wrap(errorPanel(L('no_results'), '')); return; }
      if (!n) { sec.innerHTML = cropView(c); window.scrollTo && window.scrollTo(0, 0); return; }
      renderCard(c, infType, n, sec);
    });
  }
  function findCrop(id) {
    var list = (S.crops && S.crops.crops) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- عرض المحاصيل ---------- */
  function renderCrops() {
    var sec = document.getElementById('view-tws');
    if (!sec || !S.crops) return;
    var all = S.crops.crops || [];
    var q = (S.filter || '').trim().toLowerCase();
    var list = all.filter(function (c) {
      if (!q) return true;
      return (c.name_ar || '').indexOf(q) >= 0
        || cropName(c).toLowerCase().indexOf(q) >= 0
        || (c.name_en || '').toLowerCase().indexOf(q) >= 0
        || (c.sci || '').toLowerCase().indexOf(q) >= 0
        || c.id.indexOf(q) >= 0;
    });
    var man = S.man || {};
    var cnt = man.counts || {};
    var html = '<div class="wrap">'
      + '<div class="tws-head"><h1>' + esc(L('title')) + '</h1><p>' + esc(L('subtitle')) + '</p></div>'
      + '<input type="search" id="twsFilter" class="tws-search" placeholder="' + esc(L('search_ph')) + '" value="' + esc(S.filter) + '" aria-label="' + esc(L('search_ph')) + '">'
      + '<p class="tws-count">' + list.length + ' / ' + (cnt.crops || all.length) + ' ' + esc(L('crops_count')) + ' · ' + (cnt.cards || '—') + ' ' + esc(L('cards_count')) + '</p>';
    if (!list.length) {
      html += '<div class="tws-err"><p>' + esc(L('no_results')) + '</p></div>';
    } else {
      if (!q) {
        html += '<a class="tws-a7link" href="#/tws/appendix7"><b>' + esc(L('a7_link_title')) + '</b><span>' + esc(L('a7_link_desc')) + '</span></a>';
      }
      html += '<ul class="tws-grid">';
      if (!q || 'barley الشعير hordeum'.indexOf(q) >= 0) {
        html += '<li><a class="tws-crop" href="#/tws/barley"><b>' + esc(loc() === 'ar' ? '\u0627\u0644\u0634\u0639\u064a\u0631' : 'Barley') + '</b>'
          + '<span class="en">Hordeum vulgare</span><span class="n">' + esc(loc() === 'ar' ? '\u0645\u0646 \u0645\u0635\u0627\u062f\u0631 \u062e\u0627\u0631\u062c\u064a\u0629' : 'External sources') + '</span></a></li>';
      }
      list.forEach(function (c) {
        html += '<li><a class="tws-crop" href="#/tws/' + esc(c.id) + '">'
          + '<b>' + esc(cropName(c)) + '</b>'
          + '<span class="en">' + esc(loc() === 'ar' ? c.name_en : (c.sci || '')) + '</span>'
          + '<span class="n">' + c.cards + ' ' + esc(L('cards_count')) + '</span>'
          + '</a></li>';
      });
      html += '</ul>';
    }
    html += '<p class="tws-foot">' + esc(L('coverage_line')
      .replace('{d}', cnt.dossiers || '—').replace('{c}', cnt.cards || '—').replace('{k}', cnt.crops || '—'))
      + ' · ' + esc(man.built || '') + '<br>' + esc(L('dose_note')) + '</p>'
      + '<p class="tws-foot" id="twsImgSync" aria-live="polite">' + imgBoxHtml() + '</p></div>';
    sec.innerHTML = html;
    if (!IMG.started) { IMG.started = true; imgSync(); } else imgPaint();
  }

  /* ---------- الشعير: قسم مستقل من مصادر خارجية (ليس من كتاب التوصيات) ---------- */
  function renderBarley(sec, id) {
    fetchJSON('data/tws/supplement/barley.json').then(function (d) {
      var l = loc() === 'ar' ? 'ar' : 'en', U = d.ui[l], ar = l === 'ar';
      function pick(o) { return (o && (o[l] || o.en)) || []; }
      function ul(a) { return a.length ? '<ul>' + a.map(function (x) { return '<li dir="auto">' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
      function srcs(a) { return '<p class="tws-meta">' + esc(U.sources) + ': ' + (a || []).map(function (x) { return '<a href="' + esc(x.url) + '" rel="noopener noreferrer" target="_blank">' + esc(x.title) + '</a>'; }).join(' · ') + '</p>'; }
      var notice = '<div class="tws-err" role="note"><p dir="auto">' + esc(d.notice[l] || d.notice.en) + '</p></div>';
      var html = '<div class="wrap"><nav class="tws-crumb"><a href="#/tws">' + esc(U.back) + '</a><span class="sep">\u2039</span>'
        + (id ? '<a href="#/tws/barley">' + esc(d.crop['name_' + l]) + '</a>' : '<span class="cur">' + esc(d.crop['name_' + l]) + '</span>') + '</nav>';
      var card = null;
      d.cards.forEach(function (c) { if (c.id === id) card = c; });
      if (!card) {
        html += '<div class="tws-head"><h1>' + esc(d.crop['name_' + l]) + '</h1><p class="tws-meta"><em>' + esc(d.crop.sci) + '</em> \u00b7 ' + esc(d.crop.family) + '<br>' + d.cards.length + ' ' + esc(U.cards) + ' \u00b7 ' + esc(U.badge) + '</p></div>' + notice + '<ul class="tws-list">';
        d.cards.forEach(function (c) {
          html += '<li><a class="tws-inf" href="#/tws/barley/' + esc(c.id) + '"><span class="nm"><b>' + esc(c.name[l]) + '</b></span><span class="tws-chip warn">' + esc(U.badge) + '</span></a></li>';
        });
        html += '</ul>';
        var lb = pick(d.libya);
        if (lb.length) html += '<h3>' + esc(U.libya) + '</h3>' + ul(lb) + srcs(d.libya.sources);
      } else {
        html += '<div class="tws-card"><h2 dir="auto">' + esc(card.name[l]) + '</h2><p class="tws-meta"><em>' + esc(card.sci || '') + '</em> \u00b7 ' + esc(U.badge) + '</p>' + notice
          + '<h3>' + esc(U.symptoms) + '</h3>' + ul(pick(card.symptoms))
          + (pick(card.timing).length ? '<h3>' + esc(U.timing) + '</h3>' + ul(pick(card.timing)) : '')
          + (pick(card.cultural).length ? '<h3>' + esc(U.cultural) + '</h3>' + ul(pick(card.cultural)) : '')
          + '<h3>' + esc(U.chemical) + '</h3>';
        if (!card.chemical.length) html += '<p class="tws-meta">' + esc(U.none_chem) + '</p>';
        else html += '<ul>' + card.chemical.map(function (c) { return '<li dir="auto"><b>' + esc(ar ? c.ar : c.active) + '</b> <span class="tws-meta">(' + esc(U.country) + ': ' + esc(c.source_country) + ')</span><br>' + esc((c.note && (c.note[l] || c.note.en)) || '') + '</li>'; }).join('') + '</ul>';
        html += srcs(card.sources) + '</div>';
      }
      sec.innerHTML = html + '</div>';
      window.scrollTo && window.scrollTo(0, 0);
    }).catch(function () { sec.innerHTML = wrap(errorPanel(L('a7_error'), '#/tws')); });
  }

  /* ---------- الملحق 7 (محاصيل مساحاتها أقل من 50 ألف فدان) ---------- */
  function loadAppendix7() {
    if (S.a7) return Promise.resolve(S.a7);
    return Promise.all([
      fetchJSON('data/tws/appendix7.json'),
      fetchJSON('data/tws/appendix7_i18n.json').catch(function () { return null; })
    ]).then(function (r) { S.a7 = r[0]; S.a7i = r[1]; return r[0]; });
  }
  /* Appendix 7 names: Arabic print only in Arabic; other languages use appendix7_i18n.json */
  function a7n(ar) {
    if (loc() === 'ar' || !ar) return ar;
    var m = S.a7i && S.a7i[loc()] && S.a7i[loc()].names;
    return (m && m[ar]) || ar;
  }
  function a7List(list) { return (list || []).map(a7n).join(loc() === 'ar' ? '\u060c ' : ', '); }
  function a7Acts(list) {
    return (list || []).map(function (a) { return '<span class="act">' + esc(a) + '</span>'; }).join(loc() === 'ar' ? '\u060c ' : ', ');
  }
  function a7Pests(rows, showCrops) {
    var h = '<ul>';
    rows.forEach(function (r) {
      h += '<li><b>' + esc((r.pests || []).map(a7n).join(' · ')) + '</b>';
      if (showCrops && r.crops && r.crops.length) h += ' <span class="tws-meta">(' + esc(L('a7_for_crops')) + ': ' + esc(a7List(r.crops)) + ')</span>';
      h += '<br>' + a7Acts(r.actives) + '</li>';
    });
    return h + '</ul>';
  }
  function renderAppendix7(sec) {
    loadAppendix7().then(function (d) {
      var html = '<div class="wrap">'
        + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span><span class="cur">' + esc(L('a7_title')) + '</span></nav>'
        + '<div class="tws-head"><h1>' + esc(L('a7_title')) + '</h1></div>'
        + '<p class="tws-a7note" role="note">' + esc(L('a7_banner')) + '</p>'
        + '<p class="tws-meta">' + esc(L('a7_names_note')) + '</p>'
        + '<details class="tws-a7intro"><summary>' + esc(L('a7_intro_note')) + '</summary>'
        + (loc() !== 'ar' && S.a7i && S.a7i[loc()] && S.a7i[loc()].intro
          ? '<p class="tws-a7intro-tr" dir="ltr">' + esc(S.a7i[loc()].intro) + '</p>'
          : '<p lang="ar" dir="rtl">' + esc(d.intro_ar) + '</p>') + '</details>';
      (d.secs || []).forEach(function (s, si) {
        var ar = loc() === 'ar';
        var linked = (s.insects || []).concat(s.diseases || []).some(function (r) { return r.crops && r.crops.length; });
        html += '<section class="tws-a7sec"><h2>' + (ar ? '<span lang="ar" dir="rtl">' + esc(s.letter + ' — ' + s.title) + '</span>' : esc(String.fromCharCode(65 + si) + ' \u2014 ' + a7n(s.title))) + '</h2>'
          + '<p class="tws-meta">' + esc(L('a7_source').replace('{p}', s.page)) + '</p>'
          + '<h3>' + esc(L('a7_crops')) + '</h3><ul>';
        (s.crops || []).forEach(function (c) {
          html += '<li>' + (ar ? '<span lang="ar" dir="rtl">' + esc(c.name) + '</span>' : esc(a7n(c.name))) + ' \u2014 <span dir="ltr">' + esc(Number(c.area).toLocaleString('en-US')) + '</span></li>';
        });
        html += '</ul>';
        if (!linked) html += '<p class="tws-meta">' + esc(L('a7_nolink')) + '</p>';
        if ((s.insects || []).length) html += '<h3>' + esc(L('a7_insects')) + '</h3>' + a7Pests(s.insects, true);
        if ((s.diseases || []).length) html += '<h3>' + esc(L('a7_diseases')) + '</h3>' + a7Pests(s.diseases, true);
        if ((s.weeds || []).length) {
          html += '<h3>' + esc(L('a7_weeds')) + '</h3><ul>';
          s.weeds.forEach(function (w) {
            html += '<li>';
            if (w.crops && w.crops.length) html += '<span class="tws-meta">' + esc(L('a7_for_crops')) + ': ' + esc(a7List(w.crops)) + '</span><br>';
            (w.groups || []).forEach(function (g) {
              html += (ar ? '<span lang="ar" dir="rtl">' : '<span>') + (g.label ? '<b>' + esc(a7n(g.label)) + ':</b> ' : '') + esc(a7List(g.names)) + '</span><br>';
            });
            html += a7Acts(w.actives) + '</li>';
          });
          html += '</ul>';
        }
        html += '</section>';
      });
      html += '</div>';
      sec.innerHTML = html;
      window.scrollTo && window.scrollTo(0, 0);
    }).catch(function () { sec.innerHTML = wrap(errorPanel(L('a7_error'), '#/tws')); });
  }

  /* ---------- عرض المحصول ---------- */
  function cropView(c) {
    var html = '<div class="wrap">'
      + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span><span class="cur">' + esc(cropName(c)) + '</span></nav>'
      + '<div class="tws-head"><h1>' + esc(cropName(c)) + (loc() === 'ar' ? ' <span class="en" style="color:var(--muted);font-size:.8rem">' + esc(c.name_en) + '</span>' : '') + '</h1>'
      + '<p class="tws-meta">' + esc(L('sci')) + ': <em>' + esc(c.sci || '—') + '</em> · ' + esc(L('family')) + ': ' + esc(c.family || '—')
      + '<br>' + c.cards + ' ' + esc(L('infections_of')) + '</p></div>'
      + '<ul class="tws-list">';
    (c.infections || []).forEach(function (inf) {
      html += '<li><a class="tws-inf" href="#/tws/' + esc(c.id) + '/' + esc(inf.type) + '.' + esc(inf.n) + '">'
        + '<span class="no">' + esc(inf.n) + '</span>'
        + '<span class="nm"><b>' + esc(infName(c, inf)) + '</b>'
        + (inf.group ? '<span class="grp">' + esc(L('group')) + ': ' + esc(inf.group) + '</span>' : '')
        + '</span>'
        + (inf.images ? '<span class="tws-chip info">🖼 ' + esc(inf.images) + '</span>' : '')
        + (inf.name_status === 'NEEDS_REVIEW' ? '<span class="tws-chip warn">' + esc(L('name_review')) + '</span>' : '')
        + (inf.crop_conflict ? '<span class="tws-chip warn">' + esc(L('crop_conflict')) + '</span>' : '')
        + '<span class="tws-chip pg">' + esc(L('page')) + ' ' + esc(inf.printed_page) + '</span>'
        + '</a></li>';
    });
    html += '</ul>' + footer() + '</div>';
    return html;
  }

  /* كل الإملاءات التي ورد بها نفس الرقم CAS في كتاب التوصيات (لمطابقة اسم القرار الليبي رغم خطأ مطبعي) */
  function nameAliases(cas, how) {
    if (how !== 'exact' || !cas || !S.sec) return [];
    if (!S.casNames) {
      S.casNames = {};
      ((S.sec && S.sec.sections) || []).forEach(function (x) {
        (x.products || x.rows || []).forEach(function (p) {
          (p['مكونات فعالة'] || []).forEach(function (a) {
            if (a.how !== 'exact' || !a.cas || !a.name) return;
            var l = S.casNames[a.cas] || (S.casNames[a.cas] = []);
            if (l.indexOf(a.name) < 0) l.push(a.name);
          });
        });
      });
    }
    return S.casNames[cas] || [];
  }

  function regulatoryStatusMarkup(product) {
    if (typeof window.MustasharActiveStatus !== 'function') return '';
    var locale = String(document.documentElement.lang || lang() || 'ar').toLowerCase().split('-')[0];
    var isArabic = locale === 'ar';
    var sourceNames = {
      ar: {'libya-248':'ليبيا — قرار 248 لسنة 2024','libya-500':'ليبيا — قرار 500 لسنة 2026',eu:'الاتحاد الأوروبي',epa:'الولايات المتحدة — EPA',canada:'كندا — PMRA',australia:'أستراليا — APVMA'},
      en: {'libya-248':'Libya — Decision 248/2024','libya-500':'Libya — Decision 500/2026',eu:'European Union',epa:'USA / EPA',canada:'Canada — PMRA',australia:'Australia — APVMA'},
      fr: {'libya-248':'Libye — décision 248/2024','libya-500':'Libye — décision 500/2026',eu:'Union européenne',epa:'États-Unis — EPA',canada:'Canada — PMRA',australia:'Australie — APVMA'},
      zh: {'libya-248':'利比亚 — 2024年第248号决定','libya-500':'利比亚 — 2026年第500号决定',eu:'欧盟',epa:'美国 — EPA',canada:'加拿大 — PMRA',australia:'澳大利亚 — APVMA'}
    };
    var ui = sourceNames[locale] || sourceNames.en;
    var unknown = {
      ar:'لا يوجد تطابق مؤكد في قاعدة الاختصاص المحدد',
      en:'No confirmed match in the selected jurisdiction database',
      fr:'Aucune correspondance confirmée dans la base de la juridiction sélectionnée',
      zh:'在所选司法辖区数据库中未找到已确认匹配'
    }[locale] || 'No confirmed match in the selected jurisdiction database';
    var statusPrefix = {ar:'الحالة:',en:'Status:',fr:'Statut :',zh:'状态：'}[locale] || 'Status:';
    /* Arabic UI: Decree-500 codes (Approved, REV, RAR, REV*) read in Arabic */
    function codeLabel(c) { return (locale === 'ar' && window.CasDissect && CasDissect.ar500Label(c)) || c; }
    function localStatus(h) {
      if (h.key === 'libya-500') {
        var code = String(h.status || '').trim();
        var ex = typeof window.MustasharStatusExplain === 'function' ? window.MustasharStatusExplain(code) : '';
        return codeLabel(code) + (ex ? ' — ' + ex : '');
      }
      var raw = String(h.status || '').trim();
      if (locale === 'ar') return raw || String(h.status_raw || 'غير محددة في السجل');
      var rawSource = String(h.status_raw || '').trim();
      if (rawSource && !/[\u0600-\u06FF]/.test(rawSource) && h.key !== 'canada') return rawSource;
      var normalized = raw.toLowerCase();
      if (/محظور|ممنوع/.test(normalized)) return ({en:'Prohibited / not approved',fr:'Interdit / non approuvé',zh:'禁用 / 未获批准'}[locale] || 'Prohibited / not approved');
      if (/مسموح/.test(normalized)) return ({en:'Active registration recorded',fr:'Enregistrement actif indiqué',zh:'记录存在有效登记'}[locale] || 'Active registration recorded');
      if (/غير مُعاد التقييم|غير معاد التقييم/.test(normalized)) return ({en:'Not reassessed',fr:'Non réévalué',zh:'尚未重新评估'}[locale] || 'Not reassessed');
      return raw || rawSource || '—';
    }
    var ingredients = product['مكونات فعالة'] || [];
    if (!ingredients.length) return '';
    var mode = document.getElementById('mode');
    var pro = !!(mode && mode.value === 'pro');
    /* الاختصاصات المعروضة: العربية = ليبيا (+ الأوروبية والأمريكية والكندية والأسترالية في المحترف)؛
       اللغات الأخرى لا تعرض ليبيا أبدًا: المزارع = الاتحاد الأوروبي، المحترف = الأربع قواعد. */
    var wanted = isArabic
      ? (pro ? ['libya-248', 'libya-500', 'eu', 'epa', 'canada', 'australia'] : ['libya-248', 'libya-500'])
      : (pro ? ['eu', 'epa', 'canada', 'australia'] : ['eu']);
    var shortNames = {
      ar: {'libya-248':'وفق القرار 248 / 2024 م','libya-500':'وفق القرار 500 / 2026 م',eu:'الاتحاد الأوروبي',epa:'أمريكا',canada:'كندا',australia:'أستراليا'},
      en: {'libya-248':'Libya 248','libya-500':'Libya 500',eu:'EU',epa:'USA',canada:'Canada',australia:'Australia'},
      fr: {'libya-248':'Libye 248','libya-500':'Libye 500',eu:'UE',epa:'É.-U.',canada:'Canada',australia:'Australie'},
      zh: {'libya-248':'利比亚248','libya-500':'利比亚500',eu:'欧盟',epa:'美国',canada:'加拿大',australia:'澳大利亚'}
    };
    var sn = shortNames[locale] || shortNames.en;
    var title = ({ar:'الحالة التنظيمية',en:'Regulatory status',fr:'Statut réglementaire',zh:'监管状态'}[locale] || 'Regulatory status');
    var unknownShort = ({ar:'لا تطابق مؤكد',en:'no confirmed match',fr:'aucune correspondance',zh:'无确认匹配'}[locale] || 'no confirmed match');
    var html = '<div class="tws-reg-status" role="group" aria-label="' + esc(title) + '">';
    var count = 0, notes = [];
    ingredients.forEach(function (ing) {
      var cas = String(ing.cas || ''), how = String(ing.how || ''), name = String(ing.name || '');
      if (!name && !cas) return;
      var hits = window.MustasharActiveStatus((how === 'exact' || how === 'tokens') ? cas : '', name, nameAliases(cas, how))
        .filter(function (h) { return wanted.indexOf(h.key) >= 0; });
      var seen = {}, chips = '';
      wanted.forEach(function (k) {
        hits.filter(function (h) { return h.key === k; }).forEach(function (h) {
          var id = h.key + '|' + h.status;
          if (seen[id]) return;
          seen[id] = true;
          var raw = String(h.status || h.status_raw || '').trim();
          var cls = /محظور|ممنوع|not approved|prohibited|banned|cancelled/i.test(raw) ? 'ban'
            : /مسموح|approved|registered|active registration|permitted/i.test(raw) ? 'ok' : 'review';
          var full = (ui[h.key] || h.key) + ' — ' + localStatus(h)
            + (h.match === 'parent-name' ? ' (' + ({ar:'مطابقة باسم المادة الأم دون الملح أو الإستر',en:'matched by parent substance name (salt/ester dropped)',fr:'correspondance par le nom de la substance mère',zh:'按母体物质名称匹配'}[locale] || 'parent') + ')' : '');
          var code = h.key === 'libya-500' ? String(h.status || '').trim()
            : (cls === 'ban' ? ({ar:'محظور',en:'banned',fr:'interdit',zh:'禁用'}[locale] || 'banned')
            : cls === 'ok' ? ({ar:'مسموح',en:'allowed',fr:'autorisé',zh:'允许'}[locale] || 'allowed')
            : localStatus(h));
          if (h.key === 'libya-500') {
            var ex = typeof window.MustasharStatusExplain === 'function' ? window.MustasharStatusExplain(code) : '';
            if (ex && notes.indexOf(codeLabel(code) + ' — ' + ex) < 0) notes.push(codeLabel(code) + ' — ' + ex);
          }
          chips += '<span class="tws-reg-badge ' + cls + '" title="' + esc(full) + '"><b>' + esc(sn[h.key] || h.key) + '</b> ' + esc(h.key === 'libya-500' ? codeLabel(code) : code) + '</span>';
        });
      });
      if (!chips) chips = '<span class="tws-reg-badge unknown" title="' + esc(unknown) + '">' + esc(unknownShort) + '</span>';
      var label = ingredients.length > 1 ? '<span class="tws-reg-name" dir="auto">' + esc(name || cas) + '</span>' : '';
      html += '<div class="tws-reg-line">' + label + chips + '</div>';
      count++;
    });
    if (notes.length) html += '<details class="tws-reg-note"><summary>' + esc(({ar:'شرح الحالة',en:'Status explained',fr:'Explication du statut',zh:'状态说明'}[locale] || 'Status explained')) + '</summary>'
      + notes.map(function (n) { return '<p dir="auto">' + esc(n) + '</p>'; }).join('') + '</details>';
    html += '</div>';
    return count ? html : '';
  }


  /* ---------- Verification-notes report (About → Sources): separate from the cards ---------- */
  var errataData = null;
  function renderErrata(force) {
    var det = document.getElementById('aboutTwsErrata');
    if (!det) return;
    var T0 = errataData && errataData.t[loc()];
    var sum = document.getElementById('aboutTwsErrataSum');
    var body = document.getElementById('aboutTwsErrataBody');
    function paint() {
      var T = errataData.t[loc()] || errataData.t.en, R = errataData.shared;
      sum.textContent = T.title;
      if (!det.open && !force) return;
      function tbl(head, rows) {
        return '<div class="tws-errata-wrap"><table class="tws-errata-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>'
          + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td dir="auto">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      }
      var h = '<p class="tws-meta">' + esc(T.date) + '</p><p>' + esc(T.intro) + '</p>';
      h += '<h3>' + esc(T.h_sum) + '</h3>' + tbl([T.c_type, T.c_rows, T.c_unv],
        R.rows.map(function (r) { return [T.types[r[0]], String(r[1]), String(r[2])]; }).concat([[T.total, String(R.total[0]), String(R.total[1])]]));
      h += '<h3>' + esc(T.h_spell) + '</h3>' + tbl([T.c_print, T.c_corr], R.spell_ex);
      h += '<h3>' + esc(T.h_ratio) + '</h3>' + tbl([T.c_prod, T.c_printed, T.c_sum, T.c_page], R.ratio_ex);
      h += '<h3>' + esc(T.h_mrl) + '</h3>' + tbl([T.c_item, T.c_book, T.c_ref], R.mrl_ex);
      h += '<h3>' + esc(T.h_cas) + '</h3>' + tbl([T.c_sub, T.c_app, T.c_sugg], R.cas_ex);
      h += '<h3>' + esc(T.h_who) + '</h3><p>' + esc(T.who) + '</p>';
      h += '<h3>' + esc(T.h_lim) + '</h3><ul>' + T.lim.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      h += '<h3>' + esc(T.h_src) + '</h3><ul>' + R.src.map(function (x) { return '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(x[0]) + '</a></li>'; }).join('') + '</ul>';
      h += '<p><b>' + esc(T.note) + '</b></p>';
      body.innerHTML = h;
      det.dir = loc() === 'ar' ? 'rtl' : 'ltr';
    }
    if (errataData) { paint(); return; }
    fetchJSON('data/tws/errata_report.json').then(function (d) { errataData = d; paint(); }).catch(function () {});
  }

  /* ---------- عرض البطاقة (من sections.json) ---------- */

  /* ---------- معرض صور الآفة/المرض: صور مفتوحة الترخيص، تُحمَّل حسب المحصول وعند الطلب فقط ---------- */
  var GAL_CACHE = 'mustashar-tws-gallery';
  var GAL = { idx: null, man: {}, busy: {} };
  function galJSON(url) {
    var base = document.baseURI || location.href, u = new URL(url, base).href;
    var save = function (j) {
      if ('caches' in window) caches.open(GAL_CACHE).then(function (c) { return c.put(u, new Response(JSON.stringify(j), { headers: { 'content-type': 'application/json' } })); }).catch(function () {});
      return j;
    };
    return fetchJSON(url).then(save).catch(function (e) {
      if (!('caches' in window)) throw e;
      return caches.open(GAL_CACHE).then(function (c) { return c.match(u); }).then(function (r) { if (!r) throw e; return r.json(); });
    });
  }
  function galUrl(f) { return new URL('data/tws/gallery/img/' + f, document.baseURI || location.href).href; }
  function galHave(items) {
    if (!('caches' in window)) return Promise.resolve(false);
    return caches.open(GAL_CACHE).then(function (c) {
      return Promise.all(items.map(function (it) { return c.match(galUrl(it.file)); })).then(function (rs) { return rs.every(function (r) { return !!r; }); });
    }).catch(function () { return false; });
  }
  function galBadge(kind) {
    var k = kind === 'host' ? 'gal_host' : 'gal_organism';
    return '<span class="tws-bdg ' + (kind === 'host' ? 'host' : 'org') + '">' + esc(L(k)) + '</span>';
  }
  function galFigs(items, name) {
    return '<div class="tws-gallery">' + items.map(function (it) {
      return '<figure><img src="' + esc(galUrl(it.file)) + '" width="' + esc(it.w) + '" height="' + esc(it.h) + '" loading="lazy" alt="' + esc(name) + '">'
        + '<figcaption>' + galBadge(it.kind) + '<br>' + esc(L('gal_by')) + ': <span dir="auto">' + esc(it.author) + '</span> · ' + esc(it.license)
        + ' · <a href="' + esc(it.page) + '" target="_blank" rel="noopener noreferrer">' + esc(L('gal_src')) + '</a></figcaption></figure>';
    }).join('') + '</div>';
  }
  function galPaint(el, cropId, n, name) {
    galJSON('data/tws/gallery/' + cropId + '.json').then(function (man) {
      GAL.man[cropId] = man;
      var mine = man.items.filter(function (x) { return [].concat(x.n).map(String).indexOf(String(n)) >= 0; });
      if (!mine.length) { el.innerHTML = ''; return; }
      return galHave(man.items).then(function (all) {
        if (all) { el.innerHTML = '<h3>' + esc(L('gal_h')) + '</h3>' + galFigs(mine, name) + '<p class="tws-foot">' + esc(L('gal_done')) + '</p>'; return; }
        var bytes = man.items.reduce(function (a, x) { return a + x.bytes; }, 0);
        var btn = L('gal_dl').replace('{n}', man.items.length).replace('{mb}', String(Math.round(bytes / 104857.6) / 10));
        var off = (typeof navigator !== 'undefined' && navigator.onLine === false);
        el.innerHTML = '<h3>' + esc(L('gal_h')) + '</h3><p class="tws-foot">' + esc(L('gal_hint')) + '</p>'
          + '<p><button type="button" class="tws-btn" data-tws-gal="' + esc(cropId) + '"' + (off ? ' disabled' : '') + '>' + esc(btn) + '</button></p>'
          + (off ? '<p class="tws-foot">' + esc(L('gal_offline')) + '</p>' : '') + '<p class="tws-foot" id="twsGalProg" aria-live="polite"></p>';
      });
    }).catch(function () { el.innerHTML = ''; });
  }
  function galDownload(cropId, el, n, name) {
    var man = GAL.man[cropId]; if (!man || GAL.busy[cropId] || !('caches' in window)) return;
    GAL.busy[cropId] = true;
    var prog = function (t) { var p = document.getElementById('twsGalProg'); if (p) p.textContent = t; };
    var fail = 0, code = '', done = 0, total = man.items.length;
    prog(L('gal_prog').replace('{a}', 0).replace('{n}', total));
    caches.open(GAL_CACHE).then(function (c) {
      var q = man.items.slice(), workers = [];
      function next() {
        var it = q.shift(); if (!it) return Promise.resolve();
        var u = galUrl(it.file);
        return c.match(u).then(function (hit) {
          if (hit) { done++; return; }
          return fetch(u).then(function (r) {
            if (!r.ok) { fail++; code = r.status; return; }
            return c.put(u, r).then(function () { done++; });
          }).catch(function (e) { fail++; code = (e && e.name) || 'net'; });
        }).then(function () { prog(L('gal_prog').replace('{a}', done).replace('{n}', total)); return next(); });
      }
      for (var i = 0; i < 3; i++) workers.push(next());
      return Promise.all(workers);
    }).catch(function () { fail++; }).then(function () {
      GAL.busy[cropId] = false;
      if (fail) { prog(L('gal_fail').replace('{f}', fail + (code ? ' ' + code : ''))); return; }
      galPaint(el, cropId, n, name);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-tws-gal]'); if (!b) return;
    var el = document.getElementById('twsGal2'); if (!el) return;
    galDownload(b.getAttribute('data-tws-gal'), el, el.getAttribute('data-n'), el.getAttribute('data-name'));
  });

  function renderCard(c, type, n, sec) {
    var inf = null;
    (c.infections || []).forEach(function (x) {
      if (String(x.n) === String(n) && x.type === type) inf = x;
    });
    if (!inf) { sec.innerHTML = wrap(errorPanel(L('no_results'), '#/tws/' + esc(c.id))); return; }
    loadSections().then(function (doc) {
      var s = null;
      ((doc && doc.sections) || []).forEach(function (x) {
        if (x.crop_id === c.id && String(x.n) === String(inf.n)) s = x;
      });
      if (!s) { sec.innerHTML = wrap(errorPanel(L('detail_error_title'), '#/tws/' + esc(c.id))); return; }
      var man = S.man || {};
      var html = '<div class="wrap">'
        + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span>'
        + '<a href="#/tws/' + esc(c.id) + '">' + esc(cropName(c)) + '</a><span class="sep">‹</span>'
        + '<span class="cur">' + esc(infName(c, inf)) + '</span></nav>'
        + '<div class="tws-card">'
        + '<h2 dir="auto">' + esc(tx(s, 'name', s.name_ar)) + '</h2>'
        + '<p class="tws-meta">' + esc(L('type')) + ': ' + esc(typeName(shownType(s)))
        + ' · ' + esc(L('infection_no')) + ' ' + esc(s.n)
        + ' · ' + esc(L('page')) + ' ' + esc(s.printed_page) + '</p>'
        + '<div class="tws-chips">'
        + (s.group ? '<span class="tws-chip info">' + esc(L('group')) + ': ' + esc(tx(s, 'group', s.group)) + '</span>' : '')
        + (s.name_status === 'NEEDS_REVIEW' ? '<span class="tws-chip warn">' + esc(L('name_review')) + '</span>' : '')
        + (s.crop_conflict ? '<span class="tws-chip warn">' + esc(L('crop_conflict')) + '</span>' : '')
        + '</div>';

      /* صور الكتاب — تُعرض مباشرة كما طُلب */
      if (s.images && s.images.length) {
        html += '<h3>' + esc(L('images')) + '</h3><div class="tws-gallery">';
        s.images.forEach(function (im) {
          html += '<figure><img src="data/tws/img/' + esc(im.file) + '" width="' + esc(im.w) + '" height="' + esc(im.h) + '" loading="lazy" alt="' + esc(tx(s, 'name', s.name_ar)) + ' — ' + esc(L('page')) + ' ' + esc(im.pdf_page) + '">'
            + '<figcaption><span class="tws-bdg book">' + esc(L('gal_book')) + '</span><br>' + esc(L('page')) + ' ' + esc(im.pdf_page - (man.source && man.source.printed_offset || 13)) + '</figcaption></figure>';
        });
        html += '</div>';
      }

      if (s.images && s.images.length) { setTimeout(revealGallery, 0); }
      html += '<div id="twsGal2" data-n="' + esc(s.n) + '" data-name="' + esc(tx(s, 'name', s.name_ar)) + '"></div>';

      if (s.symptom && s.symptom.length) {
        var symEn = tx(s, 'symptom', null);
        html += '<h3>' + esc(L('symptoms')) + '</h3><ul>'
          + (symEn ? '<li dir="auto">' + esc(symEn) + '</li>' : s.symptom.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''))
          + '</ul>';
      }
      if (s.appearance) html += '<h3>' + esc(L('appearance')) + '</h3><p class="txt" dir="auto">' + esc(tx(s, 'appearance', s.appearance)) + '</p>';
      if (s.examples && s.examples.length) html += '<h3>' + esc(L('examples')) + '</h3><p class="txt" dir="auto">' + esc(tx(s, 'examples', s.examples.join('، '))) + '</p>';
      if (s.timing) html += '<h3>' + esc(L('timing')) + '</h3><p class="txt" dir="auto">' + esc(tx(s, 'timing', s.timing)) + '</p>';
      if (s.extra && s.extra.length) {
        var exT = (loc() !== 'ar' && S.i18n && S.i18n.cards && S.i18n.cards[loc()] && S.i18n.cards[loc()][s.crop_id + '/' + s.type + '.' + s.n]) || {};
        s.extra.forEach(function (x, i) {
          html += '<h3>' + esc(L('extra_guidance')) + '</h3><p class="txt" dir="auto">' + esc((exT.extra && exT.extra[i]) || x.text) + '</p>';
        });
      }
      if (s.guidance) html += '<h3>' + esc(L('guidance')) + '</h3><p class="txt" dir="auto">' + esc(tx(s, 'guidance', s.guidance)) + '</p>';

      if (s.products && s.products.length) {
        html += '<h3>' + esc(L('products')) + '</h3>';
        var lastSub = null;
        s.products.forEach(function (p) {
          var rawName = p['اسم المادة الفعالة'] || '';
          var conc = p.conc != null ? p.conc : parseConc(rawName), form = p.form != null ? p.form : parseForm(rawName);
          if (p.sub && p.sub !== lastSub) { html += '<h4 class="tws-sub" dir="auto">' + esc(p.sub) + '</h4>'; lastSub = p.sub; }
          html += '<div class="tws-prod">'
            + '<div class="act"><b>' + esc(L('actives')) + ':</b> <span class="nm">' + esc(rawName) + '</span>'
            + (conc ? ' <span class="tws-parsed">' + esc(L('conc')) + ' ' + esc(conc) + '</span>' : '')
            + (form ? ' <span class="tws-parsed">' + esc(L('form')) + ' ' + esc(form) + '</span>' : '')
            + '</div>'
            + regulatoryStatusMarkup(p)
            + '<div class="row"><span><b>' + esc(L('rate')) + ':</b> ' + rateHtml(p) + '</span>'
            + '<span><b>' + esc(L('who')) + ':</b> ' + esc(p['تصنيف WHO'] || '—') + '</span>'
            + '<span><b>' + esc(L('phi')) + ':</b> ' + esc(p['فترة الأمان'] || '—') + '</span></div>';
          if (p.mrl_rows && p.mrl_rows.length) {
            html += '<div class="row"><span><b>' + esc(L('mrl')) + ':</b>' + p.mrl_rows.map(function (m) {
              var v = ['EPA', 'EU', 'Codex'].map(function (k) { return k + ': ' + (m[k] == null ? '—' : m[k]); }).join(' · ');
              return '<br><span dir="ltr" class="tws-mrl">' + (p.mrl_rows.length > 1 && m.name ? esc(m.name) + ' — ' : '') + esc(v) + '</span>';
            }).join('') + '</span></div>';
          }
          var mrl = p.mrl_rows ? {} : (p['قيم MRL'] || {});
          var mrlParts = ['EPA', 'EU', 'Codex'].filter(function (k) { return mrl[k] !== undefined && mrl[k] !== ''; })
            .map(function (k) { return k + ': ' + mrl[k]; });
          if (mrlParts.length) {
            html += '<div class="row"><span><b>' + esc(L('mrl')) + ':</b> ' + esc(mrlParts.join(' · ')) + '</span></div>';
          }
          /* CAS: رقم فقط عند مطابقة مؤكدة — الملتبس بلا رقم */
          var ings = p['مكونات فعالة'] || [];
          if (ings.length) {
            html += '<div class="row">';
            ings.forEach(function (m) {
              var how = String(m.how || '');
              if (m.cas && (how === 'exact' || how === 'tokens')) {
                html += '<span class="tws-cas" title="' + esc(m.name || '') + '">' + esc(L('cas')) + ' <span dir="ltr">' + esc(m.cas) + '</span></span>';
              } else if (how === 'unverified' && m.cas) {
                html += '<span class="tws-cas amb" title="' + esc(m.name || '') + '">' + esc(L('cas')) + ' <span dir="ltr">' + esc(m.cas) + '</span> · ' + esc(L('cas_unverified')) + '</span>';
              } else if (how.indexOf('ambiguous') === 0) {
                html += '<span class="tws-cas amb" title="' + esc(m.name || '') + '">' + esc(L('cas_ambiguous')) + '</span>';
              } else {
                html += '<span class="tws-cas none" title="' + esc(m.name || '') + '">' + esc(L('cas_none')) + '</span>';
              }
            });
            html += '</div>';
          }
          if ((p._verify && p._verify.status === 'NEEDS_VERIFICATION') || p.uncertain) {
            html += '<div class="row"><span class="tws-chip warn">' + esc(L('needs_verify')) + '</span></div>';
          }
          html += '</div>';
        });
      }

      html += '<div class="tws-note info">' + esc(L('dose_note')) + '</div>';
      html += '</div>' + footer(true) + '</div>';
      sec.innerHTML = html;
      galPaint(document.getElementById('twsGal2'), c.id, s.n, tx(s, 'name', s.name_ar));
      window.scrollTo && window.scrollTo(0, 0);
    }).catch(function () {
      sec.innerHTML = wrap(errorPanel(L('detail_error_title'), '#/tws/' + esc(c.id)));
    });
  }

  /* ظهور الصور تدريجيًا عند التمرير إليها (وتبقى ظاهرة دون المراقِب أو مع تقليل الحركة) */
  function revealGallery() {
    var figs = document.querySelectorAll('.tws-gallery figure');
    if (!figs.length || !('IntersectionObserver' in window)) return;
    var gal = document.querySelector('.tws-gallery'); if (gal) gal.classList.add('rv');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    for (var j = 0; j < figs.length; j++) io.observe(figs[j]);
  }

  function footer(card) {
    var man = S.man || {};
    var cnt = man.counts || {};
    return '<p class="tws-foot">' + esc(L('coverage_line')
      .replace('{d}', cnt.dossiers || '—').replace('{c}', cnt.cards || '—').replace('{k}', cnt.crops || '—'))
      + ' · ' + esc(man.built || '') + (card ? '' : '<br>' + esc(L('dose_note'))) + '</p>';
  }
  function errorPanel(title, backHref) {
    return '<div class="tws-err"><h2>' + esc(title || L('load_error_title')) + '</h2>'
      + '<p>' + esc(L('load_error_body')) + '</p>'
      + '<button type="button" class="tws-btn" data-tws-retry>' + esc(L('retry')) + '</button>'
      + (backHref ? '<p style="margin-top:14px"><a href="' + backHref + '" style="color:var(--primary-ink)">' + esc(L('back_crops')) + '</a></p>' : '')
      + '</div>';
  }
  function wrap(inner) { return '<div class="wrap">' + inner + '</div>'; }

  /* the verification-notes report lives in About → Sources, so it is wired at load, not at mount */
  document.addEventListener('langchange', function () { renderErrata(); });
  (function () {
    function wire() {
      if (!document.getElementById('tws-errata-css')) {
        var st = document.createElement('style'); st.id = 'tws-errata-css';
        st.textContent = '.tws-errata{margin:10px 0;max-width:100%}.tws-errata summary{cursor:pointer;font-weight:700}.tws-errata h3{margin:16px 0 6px;font-size:1rem}'
          + '.tws-errata-wrap{overflow-x:auto;max-width:calc(100vw - 56px)}.tws-errata-t{border-collapse:collapse;width:100%;table-layout:fixed;font-size:.85rem}'
          + '.tws-errata-t th,.tws-errata-t td{border:1px solid var(--border,#8884);padding:4px 7px;text-align:start;vertical-align:top;overflow-wrap:anywhere}.tws-errata-t th{background:var(--card-2,#8881)}';
        document.head.appendChild(st);
      }
      renderErrata();
      var d = document.getElementById('aboutTwsErrata');
      if (d) d.addEventListener('toggle', function () { if (d.open) renderErrata(true); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  })();

  window.Tawsiyat = { mount: mount, _state: S };
})();
