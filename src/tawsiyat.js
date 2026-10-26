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
  '#view-tws{--tws-r:14px;--tws-r-lg:20px;--tws-glass:rgba(255,255,255,.05);--tws-glass-line:rgba(255,255,255,.10);--tws-shadow:0 10px 26px rgba(0,0,0,.22)}',
  'html[data-theme="light"] #view-tws{--tws-glass:rgba(255,255,255,.62);--tws-glass-line:rgba(255,255,255,.90);--tws-shadow:0 8px 20px rgba(23,72,45,.12)}',
  '.tws-head{margin:2px 0 14px}',
  '.tws-head h1{font-size:1.4rem;font-weight:800;line-height:1.45;margin:0 0 8px;padding-bottom:12px;position:relative}',
  '.tws-head h1::after{content:"";position:absolute;bottom:0;inset-inline-start:0;width:64px;height:4px;border-radius:999px;background:linear-gradient(135deg,var(--primary-ink),var(--st-ok))}',
  '.tws-head p{color:var(--muted);font-size:.92rem;line-height:1.75;margin:0}',
  '.tws-statrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}',
  '.tws-stat{position:relative;display:flex;flex-direction:column;gap:2px;min-width:0;padding:12px 14px;border:1px solid var(--tws-glass-line);border-radius:var(--tws-r);background:linear-gradient(150deg,var(--tws-glass),transparent 75%),var(--card)}',
  '.tws-stat b{font-size:1.5rem;font-weight:800;color:var(--primary-strong);line-height:1.25;direction:ltr;unicode-bidi:embed}',
  '.tws-stat span{color:var(--muted);font-size:.72rem;font-weight:700;line-height:1.5}',
  '.tws-search{width:100%;padding:13px 16px;border:1.5px solid var(--control);border-radius:999px;background:var(--field);color:var(--text);font:inherit;font-size:1rem;margin:0 0 8px;transition:border-color var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}',
  '.tws-search::placeholder{color:var(--muted)}',
  '.tws-search:focus{outline:2px solid var(--primary-strong);outline-offset:1px;border-color:var(--primary-ink);box-shadow:0 0 0 3px var(--primary-soft)}',
  '.tws-count{color:var(--muted);font-size:.82rem;margin:0 0 12px}',
  '.tws-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;margin:0 0 20px;padding:0;list-style:none}',
  '.tws-crop{position:relative;display:flex;flex-direction:column;gap:4px;min-height:96px;padding:14px 14px 12px;border:1px solid var(--border);border-radius:var(--tws-r);background:linear-gradient(160deg,var(--tws-glass),transparent 70%),var(--card);color:var(--text);text-decoration:none;overflow:hidden;transition:border-color var(--dur) var(--ease),transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}',
  '.tws-crop::before{content:"";position:absolute;inset-inline-start:0;inset-block:0;width:3px;border-radius:999px;background:linear-gradient(180deg,var(--primary-ink),var(--st-ok));opacity:.45;transition:opacity var(--dur) var(--ease)}',
  '.tws-crop b{font-size:1.05rem;font-weight:800;line-height:1.5}',
  '.tws-crop .en{color:var(--muted);font-size:.74rem;direction:ltr;text-align:start;overflow-wrap:anywhere}',
  '.tws-crop .n{margin-top:auto;display:inline-flex;align-items:center;gap:6px;color:var(--primary-strong);font-size:.74rem;font-weight:700}',
  '.tws-crop .n::before{content:"";flex:none;width:7px;height:7px;border-radius:999px;background:var(--primary-ink)}',
  '.tws-crumb{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:0 0 12px;font-size:.86rem}',
  '.tws-crumb a{color:var(--primary-ink);text-decoration:none;padding:6px 12px;border:1px solid var(--border);border-radius:999px;background:var(--card);font-weight:700;transition:border-color var(--dur) var(--ease),color var(--dur) var(--ease)}',
  '.tws-crumb a:hover{border-color:var(--primary-ink);color:var(--primary-strong)}',
  '.tws-crumb .sep{color:var(--muted)}',
  '.tws-crumb .cur{color:var(--text);font-weight:700}',
  '.tws-cropband{position:relative;overflow:hidden;border:1px solid var(--tws-glass-line);border-radius:var(--tws-r-lg);background:linear-gradient(150deg,var(--primary-soft) 0%,transparent 60%),var(--card);padding:18px 16px 16px;margin:2px 0 14px}',
  '.tws-cropband::after{content:"";position:absolute;inset-inline-end:-44px;top:-44px;width:130px;height:130px;border-radius:999px;background:radial-gradient(circle at 30% 30%,var(--primary-soft),transparent 70%)}',
  '.tws-cropband h1{position:relative;z-index:1;font-size:1.3rem;font-weight:800;line-height:1.5;margin:0 0 6px}',
  '.tws-band-en{color:var(--muted);font-size:.8rem;direction:ltr;unicode-bidi:embed;font-weight:700;overflow-wrap:anywhere}',
  '.tws-band-sep{margin:0 4px;opacity:.55}',
  '.tws-meta{color:var(--muted);font-size:.84rem;line-height:1.8;margin:0}',
  '.tws-meta em{font-style:italic}',
  '.tws-list{display:flex;flex-direction:column;gap:10px;margin:0 0 20px;padding:0;list-style:none}',
  '.tws-inf{position:relative;display:flex;align-items:center;gap:12px;padding:13px 14px;border:1px solid var(--border);border-radius:var(--tws-r);background:var(--card);color:var(--text);text-decoration:none;line-height:1.6;transition:border-color var(--dur) var(--ease),transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}',
  '.tws-inf .no{flex:0 0 auto;min-width:2.1em;text-align:center;padding:.2em 0;border-radius:999px;background:var(--primary-soft);color:var(--primary-strong);font-weight:800;font-size:.88rem}',
  '.tws-inf .nm{flex:1 1 auto;min-width:0}',
  '.tws-inf .nm b{display:block;font-size:.98rem;line-height:1.55}',
  '.tws-inf .nm .grp{display:block;color:var(--muted);font-size:.74rem;margin-top:2px}',
  '.tws-chip{flex:0 0 auto;max-width:100%;font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:999px;border:1px solid transparent;overflow-wrap:anywhere}',
  '.tws-chip.pg{background:var(--primary-soft);color:var(--primary-strong);border-color:var(--primary-ink)}',
  '.tws-chip.warn{background:var(--st-review-soft);color:var(--st-review-ink);border-color:var(--st-review)}',
  '.tws-chip.info{background:var(--st-info-soft);color:var(--st-info-ink);border-color:var(--st-info)}',
  '.tws-card{position:relative;border:1px solid var(--tws-glass-line);border-radius:var(--tws-r-lg);background:var(--card);margin:2px 0 14px;overflow:hidden;box-shadow:var(--tws-shadow)}',
  '.tws-hero{position:relative;overflow:hidden;padding:18px 18px 16px;border-bottom:1px solid var(--tws-glass-line);background:linear-gradient(160deg,var(--primary-soft) 0%,transparent 62%)}',
  '.tws-hero-row{position:relative;z-index:1;display:flex;align-items:flex-start;gap:10px}',
  '.tws-hmark{flex:0 0 auto;width:40px;height:40px;margin-top:3px;border-radius:13px;background:linear-gradient(135deg,var(--primary-ink),var(--st-ok));box-shadow:inset 0 1px 0 var(--tws-glass-line),0 6px 16px rgba(0,0,0,.18)}',
  '.tws-hero h2{font-size:1.12rem;font-weight:800;line-height:1.55;margin:2px 0 0}',
  '.tws-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0;z-index:1;position:relative}',
  '.tws-bento{display:grid;grid-template-columns:1fr;gap:10px;padding:14px;overflow-wrap:anywhere}',
  '.tws-cell{min-width:0;background:var(--field);border:1px solid var(--border);border-radius:var(--tws-r);padding:14px}',
  '.tws-cell--full{grid-column:1 / -1}',
  '.tws-card h3{display:flex;align-items:flex-start;gap:8px;font-size:.92rem;font-weight:800;color:var(--primary-strong);margin:0 0 6px;line-height:1.6}',
  '.tws-card h3::before{content:"";flex:none;width:8px;height:8px;border-radius:3px;background:linear-gradient(135deg,var(--primary-ink),var(--st-ok));margin-top:6px}',
  '.tws-card ul{margin:0;padding-inline-start:20px}',
  '.tws-card li{line-height:1.8;font-size:.93rem;margin:0 0 8px}',
  '.tws-card p.txt{line-height:1.85;font-size:.93rem;margin:0;overflow-wrap:anywhere}',
  '.tws-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(126px,1fr));gap:10px;margin:0}',
  '.tws-gallery figure{margin:0;min-width:0;position:relative;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--field)}',
  '.tws-gallery img{width:100%;height:auto;display:block;background:var(--field);transition:transform var(--dur) var(--ease)}',
  '.tws-gallery figcaption{color:var(--muted);font-size:.7rem;text-align:center;padding:5px 4px 6px;background:var(--field)}',
  '.tws-prod{position:relative;display:flex;flex-direction:column;gap:8px;min-width:0;border:1px solid var(--border);border-radius:12px;background:var(--card);padding:12px 14px;margin:0 0 10px;transition:border-color var(--dur) var(--ease)}',
  '.tws-prod:last-child{margin-bottom:0}',
  '.tws-prod .act{font-size:.9rem;line-height:1.7;margin:0}',
  '.tws-prod .act .nm{direction:ltr;unicode-bidi:embed;font-weight:800}',
  '.tws-prod .row{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.82rem;margin:0;padding-top:8px;border-top:1px dashed var(--border);color:var(--text)}',
  '.tws-prod .row b{color:var(--primary-strong);font-weight:800}',
  '.tws-prod .row span{overflow-wrap:anywhere}',
  '.tws-parsed{display:inline-block;font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:999px;background:var(--primary-soft);color:var(--primary-strong);direction:ltr;margin-inline-start:6px}',
  '.tws-cas{display:inline-block;font-size:.76rem;padding:3px 10px;border-radius:999px;border:1px solid var(--st-ok);background:var(--st-ok-soft);color:var(--st-ok-ink);direction:ltr;margin:2px 4px 2px 0}',
  '.tws-cas.amb{border-color:var(--st-review);background:var(--st-review-soft);color:var(--st-review-ink);direction:rtl}',
  '.tws-cas.none{border-color:var(--border);background:transparent;color:var(--muted);direction:rtl}',
  '.tws-cas span[dir="ltr"]{font-weight:800;letter-spacing:.02em}',
  '.tws-src{font-size:.85rem;line-height:1.85;color:var(--text)}',
  '.tws-src a{color:var(--primary-ink);word-break:break-word;font-weight:700;text-decoration:none;border-bottom:1px solid var(--primary-ink)}',
  '.tws-note{border-inline-start:3px solid var(--st-review);background:var(--st-review-soft);border-radius:12px;padding:10px 12px;margin:0;font-size:.86rem;line-height:1.8;color:var(--text)}',
  '.tws-note.info{border-inline-start-color:var(--st-info);background:var(--st-info-soft)}',
  '.tws-foot{color:var(--muted);font-size:.78rem;line-height:1.9;border-top:1px solid var(--border);padding-top:12px;margin:18px 0 0}',
  '.tws-err{padding:28px 16px;text-align:center}',
  '.tws-err h2{font-size:1.05rem;margin:0 0 8px}',
  '.tws-err p{color:var(--muted);line-height:1.8;margin:0 0 14px;font-size:.9rem}',
  '.tws-btn{display:inline-block;padding:11px 24px;border-radius:999px;border:0;background:var(--primary);color:var(--on-primary);font:inherit;font-size:.95rem;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.2);transition:transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}',
  '.tws-crop:focus-visible,.tws-inf:focus-visible,.tws-btn:focus-visible,.tws-src a:focus-visible,.tws-crumb a:focus-visible,.tws-card a:focus-visible{outline:3px solid var(--primary-strong);outline-offset:2px}',
  '@media (hover:hover){',
  '.tws-crop:hover{transform:translateY(-2px);border-color:var(--primary-ink);box-shadow:var(--tws-shadow)}',
  '.tws-crop:hover::before{opacity:1}',
  '.tws-inf:hover{transform:translateY(-2px);border-color:var(--primary-ink);box-shadow:var(--tws-shadow)}',
  '.tws-prod:hover{border-color:var(--primary-ink)}',
  '.tws-btn:hover{transform:translateY(-1px)}',
  '.tws-gallery figure:hover img{transform:scale(1.03)}',
  '}',
  '@media (min-width:720px){',
  '#appMain:has(#view-tws:not([hidden])){max-width:860px}',
  '.tws-bento{grid-template-columns:1fr 1fr;padding:18px}',
  '.tws-gallery{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}',
  '.tws-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}',
  '.tws-cropband h1{font-size:1.5rem}',
  '}',
  '@media (max-width:479px){',
  '.tws-prod .row{flex-direction:column;align-items:flex-start;gap:2px}',
  '}',
  '@media (max-width:360px){',
  '.tws-grid{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}',
  '.tws-crop{padding:12px 12px 10px;min-height:88px}',
  '.tws-statrow{gap:6px}',
  '.tws-stat{padding:9px 10px}',
  '.tws-stat b{font-size:1.1rem}',
  '}',
  '@media (prefers-reduced-motion:reduce){',
  '#view-tws .tws-crop,#view-tws .tws-inf,#view-tws .tws-btn,#view-tws .tws-gallery img{transition:none}',
  '#view-tws .tws-crop:hover,#view-tws .tws-btn:hover{transform:none}',
  '}'
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
      + '<header class="tws-head"><h1>' + esc(L('title')) + '</h1><p>' + esc(L('subtitle')) + '</p></header>'
      + '<div class="tws-statrow">'
      + '<span class="tws-stat"><b>' + esc(String(cnt.crops || all.length)) + '</b><span>' + esc(L('crops_count')) + '</span></span>'
      + '<span class="tws-stat"><b>' + esc(String(cnt.cards || '—')) + '</b><span>' + esc(L('cards_count')) + '</span></span>'
      + '</div>'
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
          + '<span class="n">' + esc(String(c.cards)) + ' ' + esc(L('cards_count')) + '</span>'
          + '</a></li>';
      });
      html += '</ul>';
    }
    html += '<p class="tws-foot">' + esc(L('coverage_line')
      .replace('{d}', cnt.dossiers || '—').replace('{c}', cnt.cards || '—').replace('{k}', cnt.crops || '—'))
      + ' · ' + esc(man.built || '') + '<br>' + esc(L('dose_note')) + '</p></div>';
    sec.innerHTML = html;
  }

  function cropView(c) {
    var html = '<div class="wrap">'
      + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span><span class="cur">' + esc(c.name_ar) + '</span></nav>'
      + '<header class="tws-cropband"><h1>' + esc(c.name_ar) + ' <span class="tws-band-en">' + esc(c.name_en) + '</span></h1>'
      + '<p class="tws-meta">' + esc(L('sci')) + ': <em>' + esc(c.sci || '—') + '</em> · ' + esc(L('family')) + ': ' + esc(c.family || '—')
      + '<br>' + esc(String(c.cards)) + ' ' + esc(L('infections_of')) + '</p></header>'
      + '<ul class="tws-list">';
    (c.infections || []).forEach(function (inf) {
      html += '<li><a class="tws-inf" href="#/tws/' + esc(c.id) + '/' + esc(inf.type) + '.' + esc(inf.n) + '">'
        + '<span class="no">' + esc(inf.n) + '</span>'
        + '<span class="nm"><b>' + esc(inf.name_ar) + '</b>'
        + (inf.group ? '<span class="grp">' + esc(L('group')) + ': ' + esc(inf.group) + '</span>' : '')
        + '</span>'
        + (inf.images ? '<span class="tws-chip info">' + esc(L('images')) + ': ' + esc(String(inf.images)) + '</span>' : '')
        + (inf.name_status === 'NEEDS_REVIEW' ? '<span class="tws-chip warn">' + esc(L('name_review')) + '</span>' : '')
        + (inf.crop_conflict ? '<span class="tws-chip warn">' + esc(L('crop_conflict')) + '</span>' : '')
        + '<span class="tws-chip pg">' + esc(L('page')) + ' ' + esc(inf.printed_page) + '</span>'
        + '</a></li>';
    });
    html += '</ul>' + footer() + '</div>';
    return html;
  }

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
        + '<article class="tws-card">'
        + '<header class="tws-hero">'
        + '<div class="tws-hero-row"><span class="tws-hmark" aria-hidden="true"></span>'
        + '<h2>' + esc(s.name_ar) + '</h2></div>'
        + '<p class="tws-meta">' + esc(L('type')) + ': ' + esc(typeName(s.type))
        + ' · ' + esc(L('infection_no')) + ' ' + esc(s.n)
        + ' · ' + esc(L('page')) + ' ' + esc(s.printed_page) + ' (PDF ' + esc(s.page) + ')</p>'
        + '<div class="tws-chips">'
        + (s.group ? '<span class="tws-chip info">' + esc(L('group')) + ': ' + esc(s.group) + '</span>' : '')
        + (s.name_status === 'NEEDS_REVIEW' ? '<span class="tws-chip warn">' + esc(L('name_review')) + '</span>' : '')
        + (s.crop_conflict ? '<span class="tws-chip warn">' + esc(L('crop_conflict')) + '</span>' : '')
        + '</div></header>';
      var cells = [];
      if (s.images && s.images.length) {
        var g = '<section class="tws-cell tws-cell--full"><h3>' + esc(L('images')) + '</h3><div class="tws-gallery">';
        s.images.forEach(function (im) {
          g += '<figure><img src="data/tws/img/' + esc(im.file) + '" width="' + esc(im.w) + '" height="' + esc(im.h) + '" loading="lazy" alt="' + esc(s.name_ar) + ' — ' + esc(L('page')) + ' ' + esc(im.pdf_page) + '">'
            + '<figcaption>' + esc(L('page')) + ' ' + esc(im.pdf_page - (man.source && man.source.printed_offset || 13)) + ' (PDF ' + esc(im.pdf_page) + ')</figcaption></figure>';
        });
        cells.push(g + '</div></section>');
      }
      if (s.symptom && s.symptom.length) {
        cells.push('<section class="tws-cell tws-cell--full"><h3>' + esc(L('symptoms')) + '</h3><ul>'
          + s.symptom.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('')
          + '</ul></section>');
      }
      if (s.appearance) cells.push('<section class="tws-cell"><h3>' + esc(L('appearance')) + '</h3><p class="txt">' + esc(s.appearance) + '</p></section>');
      if (s.timing) cells.push('<section class="tws-cell"><h3>' + esc(L('timing')) + '</h3><p class="txt">' + esc(s.timing) + '</p></section>');
      if (s.guidance) cells.push('<section class="tws-cell"><h3>' + esc(L('guidance')) + '</h3><p class="txt">' + esc(s.guidance) + '</p></section>');
      if (cells.length) html += '<div class="tws-bento">' + cells.join('') + '</div>';

      if (s.products && s.products.length) {
        html += '<div class="tws-bento"><section class="tws-cell tws-cell--full">'
          + '<h3>' + esc(L('products')) + ' (' + esc(String(s.products.length)) + ')</h3>';
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
        html += '</section></div>';
      }

      html += '<div class="tws-bento">'
        + '<section class="tws-cell"><h3>' + esc(L('source')) + '</h3><div class="tws-src">'
        + (srcMeta.url ? '<a href="' + esc(srcMeta.url) + '" target="_blank" rel="noopener noreferrer">' + esc(srcMeta.title || srcMeta.url) + '</a><br>' : esc(srcMeta.title || ''))
        + esc(srcMeta.publisher || '')
        + ' · ' + esc(srcMeta.file || '')
        + ' · ' + esc(L('page')) + ' ' + esc(s.printed_page) + ' (PDF ' + esc(s.page) + ')</div></section>'
        + '<section class="tws-cell"><div class="tws-note info">' + esc(L('dose_note')) + '</div></section>'
        + '</div>';
      html += '</article>' + footer() + '</div>';
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
