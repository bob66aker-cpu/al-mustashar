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
      source: 'المصدر',
      cas_unverified: 'قيد التحقق',
      examples: 'أمثلة من المصدر',
      extra_guidance: 'إرشادات خاصة',
      needs_verify: 'قيمة تحتاج تحققًا — غير مؤكدة في سطر الطباعة',
      name_review: 'عنوان يحتاج مراجعة',
      crop_conflict: 'تسمية محصول تحت المراجعة',
      'coverage': 'التغطية',
      coverage_line: 'من الكتاب: {c} بطاقة · {k} محصولاً',
      dose_note: 'المادة والتركيز والمعدل وفترة الأمان وتصنيف WHO وقيم MRL مُساقَة حرفياً من جداول الكتاب — لا تُعرض هنا جرعات مخترعة.',
      load_error_title: 'تعذّر تحميل بيانات التوصيات',
      load_error_body: 'يفشل تحميل الفهرس — تحقّق من الاتصال أول مرة، أو أعد المحاولة بعد تجهيز التطبيق للعمل دون اتصال.',
      retry: 'إعادة المحاولة',
      detail_error_title: 'تعذّر تحميل بطاقة القسم من الكتاب'
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
      source: 'Source',
      cas_unverified: 'under verification',
      examples: 'Examples from the source',
      extra_guidance: 'Special guidance',
      needs_verify: 'Value needs verification — not confirmed on the print line',
      name_review: 'Heading needs review',
      crop_conflict: 'Crop label under review',
      'coverage': 'Coverage',
      coverage_line: 'From the book: {c} cards · {k} crops',
      dose_note: 'Ingredient, concentration, rate, PHI, WHO class and MRL values are quoted verbatim from the book tables — no invented doses here.',
      load_error_title: 'Could not load recommendation data',
      load_error_body: 'The index failed to load — connect once, or retry after the app is prepared for offline.',
      retry: 'Retry',
      detail_error_title: 'Could not load this section card from the book'
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
  /* نوع الآفة المعروض يتبع «مجموعة الآفة» المطبوعة في الكتاب إن وُجدت (التصنيف الآلي القديم أخطأ في 23 بطاقة)؛ المسار والمعرّف لا يتغيّران */
  var GROUP_TYPE = { 'الحشرات': 'insect', 'الفطريات': 'fungus', 'الأكاروسات': 'mite', 'النيماتودا': 'nematode', 'البكتيريا': 'bacterium', 'الفقاريات': 'other', 'اللافقاريات': 'other' };
  function shownType(s) { return s.type || GROUP_TYPE[s.group]; }
  var TYPE_FR = { insect: 'Insecte', mite: 'Acarien', fungus: 'Champignon', pseudo_fungus: 'Oomycète', bacterium: 'Bactérie', virus: 'Virus', nematode: 'Nématode', weed: 'Adventice', mollusc: 'Mollusque', other: 'Autre' };
  var TYPE_ZH = { insect: '昆虫', mite: '螨类', fungus: '真菌', pseudo_fungus: '卵菌', bacterium: '细菌', virus: '病毒', nematode: '线虫', weed: '杂草', mollusc: '软体动物', other: '其他' };
  function typeName(t) { var c = loc(); return (c === 'fr' ? TYPE_FR[t] : c === 'zh' ? TYPE_ZH[t] : c === 'en' ? TYPE_EN[t] : TYPE_AR[t]) || t; }
  /* ترجمة وحدات المعدل فقط (الأرقام والرموز تبقى حرفيًا كما طُبعت في الكتاب) */
  var UNITS = {
    en: { 'لتر': 'L', 'سم³': 'cm³', 'جم': 'g', 'كجم': 'kg', 'طن': 'ton', 'فدان': 'feddan', 'ماء': 'water', 'تقاوى': 'seed', 'تقاوي': 'seed', 'درنات': 'tubers', 'صوب': 'greenhouse', 'مرة': 'time', 'أو': 'or', 'م³': 'm³', 'فراغ': 'space', 'نبات': 'plant', 'شجرة': 'tree', 'رش جزئى': 'spot spray', 'حقن': 'injection' },
    fr: { 'لتر': 'L', 'سم³': 'cm³', 'جم': 'g', 'كجم': 'kg', 'طن': 'tonne', 'فدان': 'feddan', 'ماء': 'eau', 'تقاوى': 'semences', 'تقاوي': 'semences', 'درنات': 'tubercules', 'صوب': 'serre', 'مرة': 'fois', 'أو': 'ou', 'م³': 'm³', 'فراغ': 'volume', 'نبات': 'plante', 'شجرة': 'arbre', 'رش جزئى': 'pulvérisation partielle', 'حقن': 'injection' },
    zh: { 'لتر': '升', 'سم³': '立方厘米', 'جم': '克', 'كجم': '千克', 'طن': '吨', 'فدان': '费丹', 'ماء': '水', 'تقاوى': '种子', 'تقاوي': '种子', 'درنات': '块茎', 'صوب': '温室', 'مرة': '次', 'أو': '或', 'م³': '立方米', 'فراغ': '空间', 'نبات': '株', 'شجرة': '棵', 'رش جزئى': '局部喷雾', 'حقن': '注射' }
  };
  function rateText(p) {
    var r = String(p['معدل الاستخدام'] || '');
    var u = UNITS[loc()];
    if (!u || !r) return r;
    return r.replace(/[\u0621-\u064A\u00B3]+(?: جزئى)?/g, function (w) { return u[w] !== undefined ? u[w] : w; });
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
  function loadIndex() {
    if (S.load) return S.load;
    S.load = Promise.all([
      fetchJSON('data/tws/manifest.json'),
      fetchJSON('data/tws/crops.json'),
      fetchJSON('data/tws/labels.json').catch(function () { return null; })
    ]).then(function (r) {
      S.man = r[0]; S.crops = r[1];
      if (r[2] && r[2].ar && r[2].en) S.labels = r[2];
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
      var d = r[0]; S.i18n = r[1];
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
    '.tws-gallery img{width:100%;height:auto;border-radius:10px;border:1px solid var(--border);display:block;background:var(--field)}',
    '.tws-gallery figcaption{color:var(--muted);font-size:.7rem;text-align:center;margin-top:3px}',
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
      html += '<ul class="tws-grid">';
      list.forEach(function (c) {
        html += '<li><a class="tws-crop" href="#/tws/' + esc(c.id) + '">'
          + '<b>' + esc(c.name_ar) + '</b>'
          + '<span class="en">' + esc(c.name_en) + '</span>'
          + '<span class="n">' + c.cards + ' ' + esc(L('cards_count')) + '</span>'
          + '</a></li>';
      });
      html += '</ul>';
    }
    html += '<p class="tws-foot">' + esc(L('coverage_line')
      .replace('{d}', cnt.dossiers || '—').replace('{c}', cnt.cards || '—').replace('{k}', cnt.crops || '—'))
      + ' · ' + esc(man.built || '') + '<br>' + esc(L('dose_note')) + '</p></div>';
    sec.innerHTML = html;
  }

  /* ---------- عرض المحصول ---------- */
  function cropView(c) {
    var html = '<div class="wrap">'
      + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span><span class="cur">' + esc(c.name_ar) + '</span></nav>'
      + '<div class="tws-head"><h1>' + esc(c.name_ar) + ' <span class="en" style="color:var(--muted);font-size:.8rem">' + esc(c.name_en) + '</span></h1>'
      + '<p class="tws-meta">' + esc(L('sci')) + ': <em>' + esc(c.sci || '—') + '</em> · ' + esc(L('family')) + ': ' + esc(c.family || '—')
      + '<br>' + c.cards + ' ' + esc(L('infections_of')) + '</p></div>'
      + '<ul class="tws-list">';
    (c.infections || []).forEach(function (inf) {
      html += '<li><a class="tws-inf" href="#/tws/' + esc(c.id) + '/' + esc(inf.type) + '.' + esc(inf.n) + '">'
        + '<span class="no">' + esc(inf.n) + '</span>'
        + '<span class="nm"><b>' + esc(inf.name_ar) + '</b>'
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
    function localStatus(h) {
      if (h.key === 'libya-500') {
        var code = String(h.status || '').trim();
        var ex = typeof window.MustasharStatusExplain === 'function' ? window.MustasharStatusExplain(code) : '';
        return code + (ex ? ' — ' + ex : '');
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
      ar: {'libya-248':'ليبيا ٢٤٨','libya-500':'ليبيا ٥٠٠',eu:'الاتحاد الأوروبي',epa:'أمريكا',canada:'كندا',australia:'أستراليا'},
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
      var hits = window.MustasharActiveStatus((how === 'exact' || how === 'tokens') ? cas : '', name)
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
          var full = (ui[h.key] || h.key) + ' — ' + localStatus(h);
          var code = h.key === 'libya-500' ? String(h.status || '').trim()
            : (cls === 'ban' ? ({ar:'محظور',en:'banned',fr:'interdit',zh:'禁用'}[locale] || 'banned')
            : cls === 'ok' ? ({ar:'مسموح',en:'allowed',fr:'autorisé',zh:'允许'}[locale] || 'allowed')
            : localStatus(h));
          if (h.key === 'libya-500') {
            var ex = typeof window.MustasharStatusExplain === 'function' ? window.MustasharStatusExplain(code) : '';
            if (ex && notes.indexOf(code + ' — ' + ex) < 0) notes.push(code + ' — ' + ex);
          }
          chips += '<span class="tws-reg-badge ' + cls + '" title="' + esc(full) + '"><b>' + esc(sn[h.key] || h.key) + '</b> ' + esc(code) + '</span>';
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

  /* ---------- عرض البطاقة (من sections.json) ---------- */
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
      var srcMeta = man.source || doc.source || {};
      var html = '<div class="wrap">'
        + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span>'
        + '<a href="#/tws/' + esc(c.id) + '">' + esc(c.name_ar) + '</a><span class="sep">‹</span>'
        + '<span class="cur">' + esc(inf.name_ar) + '</span></nav>'
        + '<div class="tws-card">'
        + '<h2 dir="auto">' + esc(tx(s, 'name', s.name_ar)) + '</h2>'
        + '<p class="tws-meta">' + esc(L('type')) + ': ' + esc(typeName(shownType(s)))
        + ' · ' + esc(L('infection_no')) + ' ' + esc(s.n)
        + ' · ' + esc(L('page')) + ' ' + esc(s.printed_page) + ' (PDF ' + esc(s.page) + ')</p>'
        + '<div class="tws-chips">'
        + (s.group ? '<span class="tws-chip info">' + esc(L('group')) + ': ' + esc(tx(s, 'group', s.group)) + '</span>' : '')
        + (s.name_status === 'NEEDS_REVIEW' ? '<span class="tws-chip warn">' + esc(L('name_review')) + '</span>' : '')
        + (s.crop_conflict ? '<span class="tws-chip warn">' + esc(L('crop_conflict')) + '</span>' : '')
        + '</div>';

      /* صور الكتاب — تُعرض مباشرة كما طُلب */
      if (s.images && s.images.length) {
        html += '<h3>' + esc(L('images')) + '</h3><div class="tws-gallery">';
        s.images.forEach(function (im) {
          html += '<figure><img src="data/tws/img/' + esc(im.file) + '" width="' + esc(im.w) + '" height="' + esc(im.h) + '" loading="lazy" alt="' + esc(s.name_ar) + ' — ' + esc(L('page')) + ' ' + esc(im.pdf_page) + '">'
            + '<figcaption>' + esc(L('page')) + ' ' + esc(im.pdf_page - (man.source && man.source.printed_offset || 13)) + ' (PDF ' + esc(im.pdf_page) + ')</figcaption></figure>';
        });
        html += '</div>';
      }

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
            + '<div class="row"><span><b>' + esc(L('rate')) + ':</b> ' + esc(rateText(p) || '—') + '</span>'
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

      html += '<h3>' + esc(L('source')) + '</h3><div class="tws-src">'
        + (srcMeta.url ? '<a href="' + esc(srcMeta.url) + '" target="_blank" rel="noopener noreferrer">' + esc(srcMeta.title || srcMeta.url) + '</a><br>' : esc(srcMeta.title || ''))
        + esc(srcMeta.publisher || '')
        + ' · ' + esc(srcMeta.file || '')
        + ' · ' + esc(L('page')) + ' ' + esc(s.printed_page) + ' (PDF ' + esc(s.page) + ')</div>';
      html += '<div class="tws-note info">' + esc(L('dose_note')) + '</div>';
      html += '</div>' + footer() + '</div>';
      sec.innerHTML = html;
      window.scrollTo && window.scrollTo(0, 0);
    }).catch(function () {
      sec.innerHTML = wrap(errorPanel(L('detail_error_title'), '#/tws/' + esc(c.id)));
    });
  }

  function footer() {
    var man = S.man || {};
    var cnt = man.counts || {};
    return '<p class="tws-foot">' + esc(L('coverage_line')
      .replace('{d}', cnt.dossiers || '—').replace('{c}', cnt.cards || '—').replace('{k}', cnt.crops || '—'))
      + ' · ' + esc(man.built || '') + '<br>' + esc(L('dose_note')) + '</p>';
  }
  function errorPanel(title, backHref) {
    return '<div class="tws-err"><h2>' + esc(title || L('load_error_title')) + '</h2>'
      + '<p>' + esc(L('load_error_body')) + '</p>'
      + '<button type="button" class="tws-btn" data-tws-retry>' + esc(L('retry')) + '</button>'
      + (backHref ? '<p style="margin-top:14px"><a href="' + backHref + '" style="color:var(--primary-ink)">' + esc(L('back_crops')) + '</a></p>' : '')
      + '</div>';
  }
  function wrap(inner) { return '<div class="wrap">' + inner + '</div>'; }

  window.Tawsiyat = { mount: mount, _state: S };
})();
