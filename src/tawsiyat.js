/*
 * src/tawsiyat.js — قسم «التوصيات الزراعية» (2026-10-21)
 * ---------------------------------------------------------------
 * البديل الحديث لواجهة «الإرشاد الزراعي» القديمة: مسار منضبط
 *   محصول ← إصابة ← بطاقة التوصية ← التفاصيل والمصادر
 * فوق بيانات data/advice/ الحقيقية عبر فهرس مُولَّد data/tws/:
 *   - data/tws/manifest.json  فهرس الدواوين (30 ديواناً) + عدّادات التغطية
 *   - data/tws/crops.json     68 محصولاً × 766 بطاقة إصابة مرقّمة
 *   - data/tws/labels.json    تسميات الواجهة (ar/en) — هذه النسخة احتياطية مدمجة
 * التفاصيل الكاملة (مظاهر/تدبير/مخططات علاج/مصادر) تُقرأ حرفياً من
 * data/advice/dossiers.json — لا معالجة ولا إعادة صياغة ولا جرعات.
 *
 * التوجيه: #/tws | #/tws/<crop> | #/tws/<crop>/<n> — app.js يحوّل المسار
 * إلى العرض عبر currentView() ثم يستدعي Tawsiyat.mount() عند فتح العرض،
 * وزر الرجوع في المتصفح يعمل لأن كل مستويات المسار hash أصلي.
 *
 * الحالات الناقصة تُعرض صراحةً ولا تُملأ بالتخمين:
 *   - ديوان بلا مخططات علاج (8 دواوين الآن) ← لوحة كهرمانية صريحة.
 *   - فشل تحميل الفهرس/التفاصيل ← لوحة خطأ + إعادة محاولة.
 */
(function () {
  'use strict';

  /* نصوص احتياطية مطابقة لـ data/tws/labels.json — تُستبدل فور تحميل الملف */
  var LABELS = {
    ar: {
      title: 'التوصيات الزراعية',
      subtitle: 'اختر محصولك ثم الإصابة لتصل إلى بطاقة موثّقة بمصدرها: مظاهر الإصابة، تدبير متكامل، ومخططات العلاج من دواوين مسندة — بلا تخمين وبلا جرعات.',
      search_ph: 'ابحث عن محصول… (عربي أو Scientific name)',
      no_results: 'لا يوجد محصول بهذا الاسم',
      crops_count: 'محصولاً ببطاقات موثّقة',
      cards_count: 'بطاقة إصابة',
      back_crops: 'كل المحاصيل',
      infections_of: 'إصابة موثّقة لهذا المحصول',
      sci: 'الاسم العلمي',
      family: 'العائلة',
      evidence_a: 'دليل قوي (A)',
      evidence_b: 'دليل متوسط (B)',
      no_treatment: 'بلا مخطط علاج في المصدر',
      symptoms: 'مظاهر الإصابة',
      management: 'التدبير المتكامل',
      treatment: 'مخططات العلاج',
      scheme: 'المخطط',
      moa: 'آلية العمل',
      actives: 'المواد الفعالة',
      no_treatment_title: 'لا يوجد مخطط علاج في هذا المصدر',
      no_treatment_body: 'الديوان يوثّق المظاهر والتدبير فقط لهذه الإصابة. لا تُعرض هنا بدائل أو جرعات مخترعة — راجع الملصق المحلي للمادة واطلب رأي المختص.',
      source: 'المصدر',
      source_type: 'نوع المصدر',
      retrieved: 'تاريخ الاعتماد',
      dose_note: 'الجرعة وفترة الأمان تُقرأ من ملصق المنتج المعتمد محلياً — هذا القسم لا يعرض جرعات.',
      coverage: 'التغطية',
      coverage_line: 'دواوين مسندة: {d} · بطاقات: {c} · محاصيل: {k}',
      evidence_note: 'الوسام مصدر الديوان: A = إرشاد ممتد أو توصية رسمية، B = مرجع ممتد محكّم.',
      load_error_title: 'تعذّر تحميل بيانات التوصيات',
      load_error_body: 'يفشل تحميل الفهرس — تحقّق من الاتصال أول مرة، أو أعد المحاولة بعد تجهيز التطبيق للعمل دون اتصال.',
      retry: 'إعادة المحاولة',
      detail_error_title: 'تعذّر تحميل تفاصيل الديوان',
      infection_no: 'إصابة رقم',
      by_dossier: 'الديوان',
      type: 'النوع'
    },
    en: {
      title: 'Crop recommendations',
      subtitle: 'Pick a crop, then an infection, to reach a sourced card: symptoms, integrated management, and treatment schemes from referenced dossiers — no guessing, no doses.',
      search_ph: 'Search a crop… (Arabic or scientific name)',
      no_results: 'No crop matches',
      crops_count: 'crops with sourced cards',
      cards_count: 'infection cards',
      back_crops: 'All crops',
      infections_of: 'sourced infections for this crop',
      sci: 'Scientific name',
      family: 'Family',
      evidence_a: 'Strong evidence (A)',
      evidence_b: 'Moderate evidence (B)',
      no_treatment: 'No treatment scheme in source',
      symptoms: 'Symptoms',
      management: 'Integrated management',
      treatment: 'Treatment schemes',
      scheme: 'Scheme',
      moa: 'Mode of action',
      actives: 'Active ingredients',
      no_treatment_title: 'No treatment scheme in this source',
      no_treatment_body: 'The dossier documents symptoms and management only for this infection. No invented alternatives or doses are shown — check the local product label and consult an advisor.',
      source: 'Source',
      source_type: 'Source type',
      retrieved: 'Retrieved',
      dose_note: 'Doses and pre-harvest intervals come from the locally registered product label — this section shows no doses.',
      coverage: 'Coverage',
      coverage_line: 'Referenced dossiers: {d} · cards: {c} · crops: {k}',
      evidence_note: 'Evidence badge is the dossier\'s: A = extension guidance or official recommendation, B = peer-reviewed reference.',
      load_error_title: 'Could not load recommendation data',
      load_error_body: 'The index failed to load — connect once, or retry after the app is prepared for offline.',
      retry: 'Retry',
      detail_error_title: 'Could not load dossier details',
      infection_no: 'Infection no.',
      by_dossier: 'Dossier',
      type: 'Type'
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

  var S = { man: null, crops: null, labels: null, dos: null, load: null, dosLoad: null, err: null, filter: '' };

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
  function loadDossiers() {
    if (S.dosLoad) return S.dosLoad;
    S.dosLoad = fetchJSON('data/advice/dossiers.json')
      .then(function (j) { S.dos = (j && j.dossiers) || {}; })
      .catch(function () { S.dosLoad = null; });
    return S.dosLoad;
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
    '.tws-list{display:flex;flex-direction:column;gap:8px;margin:0 0 18px;padding:0;list-style:none}',
    '.tws-inf{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;background:var(--card);color:var(--text);text-decoration:none;min-height:56px}',
    '.tws-inf:hover,.tws-inf:focus-visible{border-color:var(--primary-ink)}',
    '.tws-inf .no{flex:0 0 auto;min-width:2.2em;text-align:center;color:var(--primary-strong);font-weight:700}',
    '.tws-inf .nm{flex:1 1 auto;min-width:0}',
    '.tws-inf .nm b{display:block;font-size:.98rem}',
    '.tws-inf .nm em{display:block;color:var(--muted);font-size:.78rem;font-style:italic;direction:ltr;text-align:start}',
    '.tws-chip{flex:0 0 auto;font-size:.72rem;padding:4px 9px;border-radius:999px;border:1px solid transparent;white-space:nowrap}',
    '.tws-chip.a{background:var(--st-ok-soft);color:var(--st-ok-ink);border-color:var(--st-ok)}',
    '.tws-chip.b{background:rgba(127,184,245,.14);color:var(--st-info);border-color:var(--st-info)}',
    '.tws-chip.warn{background:var(--st-review-soft);color:var(--st-review-ink);border-color:var(--st-review)}',
    '.tws-card{padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--card);margin:0 0 12px}',
    '.tws-card h2{font-size:1.05rem;margin:0 0 4px}',
    '.tws-card h3{font-size:.95rem;margin:14px 0 8px;color:var(--primary-strong)}',
    '.tws-card ul{margin:0;padding-inline-start:20px}',
    '.tws-card li{line-height:1.8;font-size:.93rem;margin:0 0 8px}',
    '.tws-scheme{border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin:0 0 8px;background:var(--field)}',
    '.tws-scheme .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 6px;font-size:.86rem}',
    '.tws-scheme .tag{font-size:.72rem;padding:3px 8px;border-radius:999px;background:var(--primary-soft);color:var(--primary-strong)}',
    '.tws-scheme .act{font-size:.88rem;line-height:1.7}',
    '.tws-scheme .act em{color:var(--muted);font-style:italic;direction:ltr;display:inline-block}',
    '.tws-src{font-size:.85rem;line-height:1.8}',
    '.tws-src a{color:var(--primary-ink);word-break:break-word}',
    '.tws-note{border-inline-start:3px solid var(--st-review);background:var(--st-review-soft);border-radius:8px;padding:10px 12px;margin:10px 0;font-size:.86rem;line-height:1.8;color:var(--text)}',
    '.tws-note.info{border-inline-start-color:var(--st-info);background:rgba(127,184,245,.10)}',
    '.tws-foot{color:var(--muted);font-size:.78rem;line-height:1.8;border-top:1px solid var(--border);padding-top:10px;margin:16px 0 0}',
    '.tws-err{padding:24px 16px;text-align:center}',
    '.tws-err h2{font-size:1.05rem;margin:0 0 8px}',
    '.tws-err p{color:var(--muted);line-height:1.8;margin:0 0 14px;font-size:.9rem}',
    '.tws-btn{display:inline-block;padding:10px 22px;border-radius:10px;background:var(--primary);color:var(--on-primary);border:0;font:inherit;font-size:.95rem;cursor:pointer}',
    '@media (max-width:360px){.tws-grid{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:6px}.tws-crop{padding:10px}}'
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
        S.load = null; S.dosLoad = null; S.err = null;
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
    /* رقم البطاقة = <type>.<n> لأن الترقيم يبدأ عند1 داخل كل نوع (fungus.1 ≠ insect.1) */
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
  function dossierMeta(code) {
    return (S.man && S.man.dossiers && S.man.dossiers[code]) || null;
  }
  function evChip(ev) {
    if (ev === 'A') return '<span class="tws-chip a">' + esc(L('evidence_a')) + '</span>';
    if (ev === 'B') return '<span class="tws-chip b">' + esc(L('evidence_b')) + '</span>';
    return '';
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
    var chips = {};
    var html = '<div class="wrap">'
      + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span><span class="cur">' + esc(c.name_ar) + '</span></nav>'
      + '<div class="tws-head"><h1>' + esc(c.name_ar) + ' <span class="en" style="color:var(--muted);font-size:.8rem">' + esc(c.name_en) + '</span></h1>'
      + '<p class="tws-meta">' + esc(L('sci')) + ': <em>' + esc(c.sci || '—') + '</em> · ' + esc(L('family')) + ': ' + esc(c.family || '—')
      + '<br>' + c.cards + ' ' + esc(L('infections_of')) + '</p></div>'
      + '<ul class="tws-list">';
    (c.infections || []).forEach(function (inf) {
      var meta = dossierMeta(inf.dossier);
      var ev = meta ? meta.evidence : '';
      var noTreat = meta ? !meta.has_treatment : true;
      if (ev) chips[ev] = 1;
      html += '<li><a class="tws-inf" href="#/tws/' + esc(c.id) + '/' + esc(inf.type) + '.' + esc(inf.n) + '">'
        + '<span class="no">' + esc(inf.n) + '</span>'
        + '<span class="nm"><b>' + esc(inf.name_ar) + '</b><em>' + esc(inf.sci) + '</em></span>'
        + (noTreat ? '<span class="tws-chip warn">' + esc(L('no_treatment')) + '</span>' : '')
        + evChip(ev)
        + '</a></li>';
    });
    html += '</ul>' + footer() + '</div>';
    return html;
  }

  /* ---------- عرض البطاقة ---------- */
  function renderCard(c, type, n, sec) {
    var inf = null;
    (c.infections || []).forEach(function (x) {
      if (String(x.n) === String(n) && x.type === type) inf = x;
    });
    if (!inf) { sec.innerHTML = wrap(errorPanel(L('no_results'), '#/tws/' + esc(c.id))); return; }
    var meta = dossierMeta(inf.dossier) || {};
    loadDossiers().then(function () {
      var d = (S.dos && S.dos[inf.dossier]) || null;
      var html = '<div class="wrap">'
        + '<nav class="tws-crumb"><a href="#/tws">' + esc(L('back_crops')) + '</a><span class="sep">‹</span>'
        + '<a href="#/tws/' + esc(c.id) + '">' + esc(c.name_ar) + '</a><span class="sep">‹</span>'
        + '<span class="cur">' + esc(inf.name_ar) + '</span></nav>'
        + '<div class="tws-card">'
        + '<h2>' + esc(inf.name_ar) + '</h2>'
        + '<p class="tws-meta"><em>' + esc(inf.sci) + '</em> · ' + esc(L('type')) + ': ' + esc(typeName(inf.type))
        + ' · ' + esc(L('infection_no')) + ' ' + esc(inf.n) + ' · ' + esc(L('by_dossier')) + ': ' + esc((d && d.name_ar) || meta.name_ar || inf.dossier) + '<br>'
        + evChip(meta.evidence) + '</p>';
      if (!d) {
        html += '<div class="tws-note">' + esc(L('detail_error_title')) + ' — ' + esc(inf.dossier) + '</div>';
      } else {
        if (d.symptoms_ar && d.symptoms_ar.length) {
          html += '<h3>' + esc(L('symptoms')) + '</h3><ul>'
            + d.symptoms_ar.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('')
            + '</ul>';
        }
        if (d.management_ar && d.management_ar.length) {
          html += '<h3>' + esc(L('management')) + '</h3><ul>'
            + d.management_ar.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('')
            + '</ul>';
        }
        if (d.treatment && d.treatment.length) {
          html += '<h3>' + esc(L('treatment')) + '</h3>';
          d.treatment.forEach(function (t) {
            var src = t.source || {};
            html += '<div class="tws-scheme">'
              + '<div class="row"><span class="tag">' + esc(L('scheme')) + ': ' + esc(t.scheme || '—') + '</span>'
              + '<span><b>' + esc(L('moa')) + ':</b> ' + esc(t.moa || '—') + '</span></div>'
              + '<div class="act"><b>' + esc(L('actives')) + ':</b> '
              + (t.actives || []).map(function (a) { return esc(a.ar || a.en) + ' <em>' + esc(a.en || '') + '</em>'; }).join(' · ')
              + '</div>'
              + (src.url ? '<div class="tws-src">↳ <a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(src.title || src.url) + '</a></div>' : '')
              + '</div>';
          });
        } else {
          html += '<div class="tws-note"><b>' + esc(L('no_treatment_title')) + '</b><br>' + esc(L('no_treatment_body')) + '</div>';
        }
        html += '<h3>' + esc(L('source')) + '</h3><div class="tws-src">'
          + (d.source && d.source.url
            ? '<a href="' + esc(d.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.source.title || d.source.url) + '</a>'
            : esc((d.source && d.source.title) || '—'))
          + '<br>' + esc((d.source && d.source.publisher) || '')
          + (d.source && d.source.type ? ' · ' + esc(L('source_type')) + ': ' + esc(d.source.type) : '')
          + (d.source && d.source.retrieved ? ' · ' + esc(L('retrieved')) + ': ' + esc(d.source.retrieved) : '')
          + '</div>';
        html += '<div class="tws-note info">' + esc(L('evidence_note')) + '<br>' + esc(L('dose_note')) + '</div>';
      }
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
