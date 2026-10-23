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

  function lang() {
    return (document.documentElement.lang || 'ar').toLowerCase().indexOf('en') === 0 ? 'en' : 'ar';
  }
  function L(k) {
    var d = (S.labels && (S.labels[lang()] || S.labels.ar)) || LABELS.ar;
    return (d && d[k]) || LABELS.ar[k] || k;
  }
  function typeName(t) { return (lang() === 'en' ? TYPE_EN[t] : TYPE_AR[t]) || t; }
  /* Correct obvious OCR spacing/letter artifacts for display only.
   * Source JSON remains untouched; uncertain titles are deliberately not guessed. */
  function cleanArabic(s) {
    var v = String(s == null ? '' : s);
    [
      [/جلراثيم/g, 'جراثيم'], [/احلشرات/g, 'الحشرات'], [/اجلذور/g, 'الجذور'],
      [/اأعفان/g, 'أعفان'], [/اعفان/g, 'أعفان'], [/اأمراض/g, 'أمراض'],
      [/البياضض/g, 'البياض'], [/مرضض/g, 'مرض'], [/الرتبسس/g, 'التربس'],
      [/الرتبس/g, 'التربس'], [/ال من/g, 'المن'], [/امل ن/g, 'المن'],
      [/ال م ن/g, 'المن'], [/الندوة املتاأخرة/g, 'الندوة المتأخرة'],
      [/الصصداأ/g, 'الصدأ'], [/الصداأ/g, 'الصدأ'], [/الدقيقى/g, 'الدقيقي'],
      [/الزغبى/g, 'الزغبي'], [/اللفح ة/g, 'اللفحة'], [/الباذجنان/g, 'الباذنجان'],
      [/الكمرثى/g, 'الكمثرى'], [/الشـهــد/g, 'الشمام'], [/الكوســة/g, 'الكوسة']
    ].forEach(function (pair) { v = v.replace(pair[0], pair[1]); });
    return v;
  }
  function esc(s) {
    return cleanArabic(s)
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
      if (r[2] && r[2].ar && r[2].en) S.labels = { ar: r[2].ar, en: r[2].en };
      S.err = null;
    }).catch(function (e) { S.err = e; S.load = null; });
    return S.load;
  }
  /* بطاقات الأقسام كاملة — تُحمَّل عند أول فتح بطاقة وتبقى في الذاكرة والكاش */
  function loadSections() {
    if (S.sec) return Promise.resolve(S.sec);
    if (S.secLoad) return S.secLoad;
    S.secLoad = fetchJSON('data/tws/sections.json').then(function (d) {
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
    /* 2026-10-23 visual refresh: reference-inspired agricultural green cards */
    'main:has(#view-tws:not([hidden])){max-width:1120px;padding-inline:clamp(12px,2.4vw,28px)}',
    '#view-tws{--tws-forest:#075b46;--tws-green:#08785b;--tws-leaf:#13845f;--tws-mint:#e9f5ef;--tws-line:#cfe4d8;--tws-ink:#173b32}',
    '#view-tws .wrap{max-width:100%;margin-inline:auto}',
    '#view-tws .tws-head{position:relative;overflow:hidden;padding:clamp(18px,3vw,30px);margin:0 0 18px;border-radius:22px;background:linear-gradient(125deg,var(--tws-forest),#0c765b 62%,#15916b);color:#fff;box-shadow:0 8px 22px rgba(5,91,70,.14)}',
    '#view-tws .tws-head h1{font-size:clamp(1.45rem,3vw,2.05rem);font-weight:800;line-height:1.35;color:#fff}',
    '#view-tws .tws-head p{max-width:78ch;margin-top:8px;color:rgba(255,255,255,.9);font-size:.94rem;line-height:1.9}',
    '#view-tws .tws-search{margin:0 0 10px;padding:14px 16px;border-radius:15px;border:1px solid var(--tws-line);background:var(--card);box-shadow:0 3px 12px rgba(9,80,58,.045)}',
    '#view-tws .tws-count{padding:0 4px;margin:0 0 14px;color:var(--muted);font-weight:650}',
    '#view-tws .tws-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:12px;margin-bottom:24px}',
    '#view-tws .tws-crop{position:relative;min-height:108px;gap:8px;padding:16px;border-radius:17px;border:1px solid var(--tws-line);background:linear-gradient(155deg,var(--card),var(--tws-mint));box-shadow:0 3px 12px rgba(7,91,70,.055);transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}',
    '#view-tws .tws-crop:hover,#view-tws .tws-crop:focus-visible{transform:translateY(-2px);border-color:var(--tws-green);box-shadow:0 8px 20px rgba(7,91,70,.12)}',
    '#view-tws .tws-crop b{font-size:1.08rem;color:var(--tws-ink)}',
    '#view-tws .tws-crop .n{color:var(--tws-green);font-weight:700}',
    '#view-tws .tws-crumb{gap:8px;margin-bottom:16px;padding:8px 12px;border:1px solid var(--tws-line);border-radius:12px;background:var(--tws-mint)}',
    '#view-tws .tws-crumb a{font-weight:700;color:var(--tws-green)}',
    '#view-tws .tws-meta{margin-bottom:18px;padding:12px 14px;border-radius:12px;background:var(--tws-mint);color:var(--tws-ink)}',
    '#view-tws .tws-chips{gap:8px;margin-bottom:16px}',
    '#view-tws .tws-list{gap:12px;margin-bottom:22px}',
    '#view-tws .tws-inf{min-height:70px;padding:14px 16px;border-radius:16px;border-color:var(--tws-line);background:linear-gradient(110deg,var(--card),var(--tws-mint));box-shadow:0 3px 12px rgba(7,91,70,.04);transition:border-color .18s ease,transform .18s ease}',
    '#view-tws .tws-inf:hover,#view-tws .tws-inf:focus-visible{border-color:var(--tws-green);transform:translateY(-1px)}',
    '#view-tws .tws-inf .no{display:grid;place-items:center;min-width:2.35em;min-height:2.35em;border-radius:50%;background:var(--tws-green);color:#fff}',
    '#view-tws .tws-inf .nm b{font-size:1.02rem;line-height:1.6}',
    '#view-tws .tws-chip{padding:5px 10px;font-weight:700}',
    '#view-tws .tws-card{padding:clamp(14px,2.5vw,24px);margin-bottom:18px;border-radius:20px;border-color:var(--tws-line);background:var(--card);box-shadow:0 5px 18px rgba(7,91,70,.055)}',
    '#view-tws .tws-card h2{padding:13px 16px;margin:0 0 16px;border-radius:14px;background:linear-gradient(110deg,var(--tws-forest),var(--tws-green));color:#fff;font-size:1.2rem;line-height:1.5}',
    '#view-tws .tws-card h3{display:flex;align-items:center;gap:8px;padding:9px 12px;margin:18px 0 10px;border-radius:11px;background:var(--tws-mint);color:var(--tws-forest);font-size:1rem}',
    '#view-tws .tws-card p.txt{padding:0 3px;font-size:1rem;line-height:2.05;color:var(--text)}',
    '#view-tws .tws-gallery{grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:12px}',
    '#view-tws .tws-gallery img{border-radius:14px;border-color:var(--tws-line);box-shadow:0 3px 12px rgba(7,91,70,.08)}',
    '#view-tws .tws-gallery figcaption{font-size:.78rem;line-height:1.6}',
    '#view-tws .tws-prod{padding:14px;margin-bottom:12px;border:1px solid var(--tws-line);border-radius:16px;background:linear-gradient(145deg,#f7fbf8,var(--tws-mint));box-shadow:0 3px 12px rgba(7,91,70,.045)}',
    '#view-tws .tws-prod .act{font-size:1rem;line-height:1.85;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid var(--tws-line);color:var(--tws-ink)}',
    '#view-tws .tws-prod .act .nm{font-weight:800;color:var(--tws-forest)}',
    '#view-tws .tws-prod .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:8px;margin:0 0 8px}',
    '#view-tws .tws-prod .row span{display:block;min-width:0;padding:10px 12px;border:1px solid var(--tws-line);border-radius:11px;background:rgba(255,255,255,.72);line-height:1.75;overflow-wrap:anywhere}',
    '#view-tws .tws-prod .row b{display:block;margin-bottom:3px;color:var(--tws-green)}',
    '#view-tws .tws-parsed{padding:4px 9px;background:#d9efe3;color:#075b46;font-weight:750}',
    '#view-tws .tws-cas{padding:4px 9px;border-radius:9px;font-weight:700}',
    '#view-tws .tws-note{border-radius:12px;padding:12px 14px;line-height:1.9}',
    '#view-tws .tws-foot{margin-top:20px;padding:12px 14px;border:1px solid var(--tws-line);border-radius:12px;background:var(--tws-mint)}',
    '#view-tws .tws-btn{background:var(--tws-green);border-radius:12px;font-weight:750;box-shadow:0 4px 12px rgba(7,91,70,.15)}',
    '@media(min-width:760px){#view-tws .tws-card{padding:24px}#view-tws .tws-card .tws-prod{padding:16px}}',
    '@media(max-width:520px){#view-tws .tws-head{border-radius:16px;padding:18px}#view-tws .tws-card{border-radius:16px}#view-tws .tws-prod .row{grid-template-columns:1fr}#view-tws .tws-inf{align-items:flex-start;gap:8px}}',
    '@media(prefers-reduced-motion:reduce){#view-tws .tws-crop,#view-tws .tws-inf{transition:none}}',
    /* Dark-theme contrast fix: dark headings on dark cards were unreadable. */
    'html:not([data-theme="light"]) #view-tws .tws-card h3{background:#263c32;color:#b8f0d0;border:1px solid #456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-meta{background:#26352e;color:#e2f4e9;border:1px solid #456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-crumb{background:#26352e;border-color:#456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-crumb a{color:#9ce7bd}',
    'html:not([data-theme="light"]) #view-tws .tws-crumb .cur{color:#e2f4e9}',
    'html:not([data-theme="light"]) #view-tws .tws-crop{background:linear-gradient(155deg,#242b27,#263c32);border-color:#456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-crop b{color:#e7f8ee}',
    'html:not([data-theme="light"]) #view-tws .tws-crop .en{color:#c3d7cb}',
    'html:not([data-theme="light"]) #view-tws .tws-inf{background:linear-gradient(110deg,#242b27,#263c32);border-color:#456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-inf .nm b{color:#e7f8ee}',
    'html:not([data-theme="light"]) #view-tws .tws-prod{background:linear-gradient(145deg,#242b27,#263c32);border-color:#456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-prod .act{color:#e7f8ee}',
    'html:not([data-theme="light"]) #view-tws .tws-prod .act .nm{color:#a7ebc5}',
    'html:not([data-theme="light"]) #view-tws .tws-prod .row span{background:#202b25;border-color:#456b58;color:#e7f8ee}',
    'html:not([data-theme="light"]) #view-tws .tws-prod .row b{color:#a7ebc5}',
    'html:not([data-theme="light"]) #view-tws .tws-foot{background:#26352e;color:#d9eee1;border-color:#456b58}',
    'html:not([data-theme="light"]) #view-tws .tws-src a{color:#9ce7bd}'
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
        + '<h2>' + esc(s.name_ar) + '</h2>'
        + '<p class="tws-meta">' + esc(L('type')) + ': ' + esc(typeName(s.type))
        + ' · ' + esc(L('infection_no')) + ' ' + esc(s.n)
        + ' · ' + esc(L('page')) + ' ' + esc(s.printed_page) + ' (PDF ' + esc(s.page) + ')</p>'
        + '<div class="tws-chips">'
        + (s.group ? '<span class="tws-chip info">' + esc(L('group')) + ': ' + esc(s.group) + '</span>' : '')
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
        html += '<h3>' + esc(L('symptoms')) + '</h3><ul>'
          + s.symptom.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('')
          + '</ul>';
      }
      if (s.appearance) html += '<h3>' + esc(L('appearance')) + '</h3><p class="txt">' + esc(s.appearance) + '</p>';
      if (s.timing) html += '<h3>' + esc(L('timing')) + '</h3><p class="txt">' + esc(s.timing) + '</p>';
      if (s.guidance) html += '<h3>' + esc(L('guidance')) + '</h3><p class="txt">' + esc(s.guidance) + '</p>';

      if (s.products && s.products.length) {
        html += '<h3>' + esc(L('products')) + '</h3>';
        s.products.forEach(function (p) {
          var rawName = p['اسم المادة الفعالة'] || '';
          var conc = parseConc(rawName), form = parseForm(rawName);
          html += '<div class="tws-prod">'
            + '<div class="act"><b>' + esc(L('actives')) + ':</b> <span class="nm">' + esc(rawName) + '</span>'
            + (conc ? ' <span class="tws-parsed">' + esc(L('conc')) + ' ' + esc(conc) + '</span>' : '')
            + (form ? ' <span class="tws-parsed">' + esc(L('form')) + ' ' + esc(form) + '</span>' : '')
            + '</div>'
            + '<div class="row"><span><b>' + esc(L('rate')) + ':</b> ' + esc(p['معدل الاستخدام'] || '—') + '</span>'
            + '<span><b>' + esc(L('who')) + ':</b> ' + esc(p['تصنيف WHO'] || '—') + '</span>'
            + '<span><b>' + esc(L('phi')) + ':</b> ' + esc(p['فترة الأمان'] || '—') + '</span></div>';
          var mrl = p['قيم MRL'] || {};
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
              } else if (how.indexOf('ambiguous') === 0) {
                html += '<span class="tws-cas amb" title="' + esc(m.name || '') + '">' + esc(L('cas_ambiguous')) + '</span>';
              } else {
                html += '<span class="tws-cas none" title="' + esc(m.name || '') + '">' + esc(L('cas_none')) + '</span>';
              }
            });
            html += '</div>';
          }
          if (p._verify && p._verify.status === 'NEEDS_VERIFICATION') {
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
