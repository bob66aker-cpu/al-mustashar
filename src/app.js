/*
 * app.js — المستشار الزراعي
 * Improvements over the previous version (search semantics untouched):
 *   - fail-soft, parallel database loading with per-database status
 *   - IndexedDB v2 with safe versioning; valid cached data is never
 *     replaced by empty/invalid data; new "history" store
 *   - persistent-storage request so the browser keeps the offline data
 *   - version/update detection via version.json (cache + network);
 *     the app never deletes user data automatically
 *   - original regulatory status values are displayed verbatim and
 *     status_raw is shown where available; no interpretation added
 */
(function () {
  'use strict';

  const SOURCES = [
    { key: 'libya-248', url: 'data/libya-248.json', labelKey: 'db.src.248', label: 'ليبيا 248' },
    { key: 'libya-500', url: 'data/libya-500.json', labelKey: 'db.src.500', label: 'ليبيا 500' },
    { key: 'eu',        url: 'data/eu.json',        labelKey: 'db.src.eu',  label: 'الاتحاد الأوروبي' },
    { key: 'epa',       url: 'data/epa.json',       labelKey: 'db.src.epa', label: 'USA / EPA' },
    { key: 'epa-cancelled', url: 'data/epa-cancelled.json', labelKey: 'db.src.epac', label: 'USA / EPA — ملغى' }
  ];

  const DB_NAME = 'mustashar-local';
  const DB_VERSION = 2;           // v1 = "db" store; v2 adds "history"
  const STORE_DB = 'db';
  const STORE_HISTORY = 'history';

  const $ = s => document.querySelector(s);

  /* ============================================================
   * UI round: hash router across the six views (#/ ... #/about).
   * Same-document navigation (back button + GitHub Pages subpath safe).
   * No business logic here — only show/hide + active nav state.
   * ============================================================ */
  const VIEWS = ['home', 'search', 'scan', 'history', 'data', 'about', 'legend'];
  function currentView() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    return VIEWS.indexOf(h) >= 0 ? h : 'home';
  }
  function applyView() {
    const v = currentView();
    /* ج — أثناء قراءة فعّالة (مسار الصورة أو الكاميرا الحية) يبقى المستخدم على
     * شاشة المسح: نتيجة تخص مسحًا جاريًا لا تُعرض لمستخدم غادر الشاشة، ولا تُقتل
     * القراءة من نقرات تنقل متكررة. التنقل حر تمامًا فور انتهاء القراءة
     * (نجاحًا أو رفضًا أو إلغاءً). حماية قراءة فقط — لا تغيير في التصميم. */
    if (v !== 'scan' && ocrBusy) { location.hash = '#/scan'; return; }
    VIEWS.forEach(name => {
      const el = document.querySelector('[data-view="' + name + '"]');
      if (el) el.hidden = (name !== v);
    });
    document.querySelectorAll('[data-nav]').forEach(a => {
      const on = a.getAttribute('data-nav') === v;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (v === 'history') openHistory();
  }
  window.addEventListener('hashchange', applyView);

  /* ============================================================
   * Legend (شرح الرموز) — status explanations are verbatim decree
   * texts (i18n keys st.500.*.explain); category names come from the
   * prompt's fixed table ONLY (I18N.catName / LEGEND_CAT_KEYS below).
   * Unknown codes are never interpreted — shown verbatim with the
   * «رمز غير معرّف في دليل القرار» hint.
   * ============================================================ */
  const LEGEND_STATUS_KEYS = {
    'Approved': 'st.500.approved.explain',
    'REV':      'st.500.rev.explain',
    'RAR':      'st.500.rar.explain',
    'REV*':     'st.500.revstar.explain'
  };
  const LEGEND_CAT_KEYS = {
    'I': 'legend.cat.I', 'F': 'legend.cat.F', 'A': 'legend.cat.A',
    'N': 'legend.cat.N', 'H': 'legend.cat.H', 'R': 'legend.cat.R',
    'M': 'legend.cat.M', 'S.ph': 'legend.cat.S.ph',
    'PGR': 'legend.cat.PGR', 'rep': 'legend.cat.rep'
  };
  function statusExplain(rawStatus) {
    const k = LEGEND_STATUS_KEYS[String(rawStatus || '').trim()];
    return k ? t(k, '') : '';
  }
  function catName(code) {
    const k = LEGEND_CAT_KEYS[String(code || '').trim()];
    return k ? t(k, '') : '';
  }
  /* Category tooltip: known codes get the fixed-table meaning; any other
   * code gets the literal «رمز غير معرّف في دليل القرار» hint only. */
  function catTitle(code) {
    const c = String(code || '').trim();
    if (!c) return '';
    return catName(c) || t('legend.cat.unknown', 'رمز غير معرّف في دليل القرار.');
  }

  /* i18n helpers (src/i18n.js loads before this file). Arabic fallbacks
   * keep every string working even if the i18n module failed to load. */
  const t = (k, fb) => (window.I18N ? I18N.t(k, fb) : fb);
  const tf = (k, fb, vars) => (window.I18N ? I18N.tf(k, fb, vars) : fb);

  /* ============================================================
   * IndexedDB (v2) — safe open/upgrade, never destroys valid data
   * ============================================================ */
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); }
      catch (e) { reject(e); return; }

      req.onupgradeneeded = () => {
        const db = req.result;
        // v1 store: never drop it — it may hold valid cached data
        if (!db.objectStoreNames.contains(STORE_DB)) {
          db.createObjectStore(STORE_DB);
        }
        // v2 store: search history
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          db.createObjectStore(STORE_HISTORY);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('indexeddb blocked'));
    }).catch(err => { dbPromise = null; throw err; });
    return dbPromise;
  }

  function idbPut(store, key, value) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  function idbGet(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const rq = tx.objectStore(store).get(key);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    }));
  }

  function idbGetAll(store) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const rq = tx.objectStore(store).getAll();
      rq.onsuccess = () => resolve(rq.result || []);
      rq.onerror = () => reject(rq.error);
    }));
  }

  function idbClear(store) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  function idbDelete(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }

  /* ============================================================
   * Data validation — never replace valid data with empty data
   * ============================================================ */
  function looksValid(data) {
    return !!(data && typeof data === 'object'
      && data.meta && typeof data.meta === 'object' && data.meta.key
      && Array.isArray(data.rows));
  }

  /* ============================================================
   * Status of each database
   *   loading | ok     | cached  | unavailable
   * (ok = fresh from network; cached = loaded from IndexedDB)
   * ============================================================ */
  const state = {};
  SOURCES.forEach(s => { state[s.key] = { phase: 'loading', count: 0, fromCache: false }; });

  function statusText() {
    return {
      loading:      t('db.loading', 'جارٍ التحميل…'),
      ok:           t('db.ok', 'جاهز'),
      cached:       t('db.cached', 'جاهز (نسخة محلية)'),
      unavailable:  t('db.unavailable', 'غير متاح')
    };
  }
  const STATUS_CLASS = {
    loading: 'db-loading', ok: 'db-ok', cached: 'db-cached', unavailable: 'db-bad'
  };

  function renderDbStatus() {
    const ST = statusText();
    SOURCES.forEach(s => {
      const chip = $('#db-' + s.key);
      const st = state[s.key];
      if (!chip) return;
      chip.textContent = t(s.labelKey, s.label) + ': ' + ST[st.phase]
        + (st.count ? ' (' + st.count.toLocaleString('en-US') + ')' : '');
      chip.className = 'chip ' + STATUS_CLASS[st.phase];
    });
    const ready = SOURCES.filter(s => state[s.key].phase === 'ok' || state[s.key].phase === 'cached');
    const total = ready.reduce((a, s) => a + state[s.key].count, 0);
    const badge = $('#dbCount');
    if (badge) badge.textContent = total
      ? tf('db.count', '{n} سجل', { n: total.toLocaleString('en-US') })
      : t('db.count.none', 'لا توجد قواعد محمّلة');
    const overall = $('#dbState');
    if (overall) {
      if (!ready.length) overall.textContent = t('db.none', 'القواعد غير متاحة');
      else if (ready.length === SOURCES.length) overall.textContent = t('db.ready', 'القواعد المحلية جاهزة');
      else overall.textContent = tf('db.partial', 'جاهز جزئيًا ({n})', { n: ready.length + '/' + SOURCES.length });
    }
    /* Home stat cards (counts come from the loaded databases only) */
    const statIds = { 'libya-248': 'stat-248', 'libya-500': 'stat-500', eu: 'stat-eu', epa: 'stat-epa', 'epa-cancelled': 'stat-epac' };
    SOURCES.forEach(s => {
      const el = $('#' + statIds[s.key]);
      if (el) el.textContent = state[s.key].count ? state[s.key].count.toLocaleString('en-US') : '—';
    });
    const banner = $('#dbBanner');
    if (banner) {
      const bad = SOURCES.filter(s => state[s.key].phase === 'unavailable');
      if (!ready.length) {
        banner.hidden = false;
        banner.textContent = t('db.banner.error', 'تعذّر تحميل أي قاعدة بيانات.');
        banner.className = 'banner banner-error';
      } else if (bad.length) {
        banner.hidden = false;
        banner.className = 'banner banner-warn';
        banner.textContent = tf('db.banner.warn', 'تعذّر تحميل: {names}.',
          { names: bad.map(s => t(s.labelKey, s.label)).join(t('list.sep', '، ')) });
      } else {
        banner.hidden = true;
      }
    }
  }

  function setPhase(key, phase, count) {
    state[key].phase = phase;
    if (typeof count === 'number') state[key].count = count;
    renderDbStatus();
  }

  /* ============================================================
   * Loading — parallel + fail-soft.
   * Each source is independent: one failure never blocks others.
   * ============================================================ */
  /* c3: documented row counts (docs/data-provenance.md). A loaded file
   * that arrives SHORTER than documented is a silent-truncation alarm —
 * the banner fires and the count is still shown, nothing is hidden. */
  const EXPECTED_ROWS = { 'libya-248': 77, 'libya-500': 411, eu: 1483, epa: 2199 };

  function loadSource(src) {
    setPhase(src.key, 'loading');
    const attemptFetch = () => fetch(src.url, { cache: 'no-store' }).then(async res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!looksValid(data)) throw new Error('invalid payload');
      return data;
    });

    /* returns true when the count is materially short (>=5% missing) */
    const tooShort = data => {
      const exp = EXPECTED_ROWS[src.key];
      return exp && data.rows.length < exp * 0.95;
    };

    return attemptFetch()
      .then(data => {
        DB[src.key] = data;
        setPhase(src.key, 'ok', data.rows.length);
        if (tooShort(data)) {
          const banner = $('#dbBanner');
          if (banner) {
            banner.hidden = false;
            banner.className = 'banner banner-warn';
            banner.textContent = tf('db.banner.short',
              'تحذير: {key} وصل بعدد أقل من الموثق ({got} من {exp}) — قد تكون هناك بيانات مقتطعة.',
              { key: t(src.labelKey, src.label), got: data.rows.length, exp: EXPECTED_ROWS[src.key] });
          }
        }
        // cache after success; never overwrite a valid cache with bad data
        return idbPut(STORE_DB, src.key, data).catch(() => {});
      })
      .catch(() => attemptFetch()                 // one silent retry
        .then(data => {
          DB[src.key] = data;
          setPhase(src.key, 'ok', data.rows.length);
          return idbPut(STORE_DB, src.key, data).catch(() => {});
        })
        .catch(() =>
          // fall back to the cached copy (any version) if present
          idbGet(STORE_DB, src.key).then(cached => {
            if (looksValid(cached)) {
              DB[src.key] = cached;
              setPhase(src.key, 'cached', cached.rows.length);
            } else {
              // mark unavailable — search simply skips this source
              setPhase(src.key, 'unavailable');
            }
          }).catch(() => setPhase(src.key, 'unavailable'))
        ));
  }

  function loadAll() {
    SOURCES.forEach(loadSource);   // parallel; failures are independent
  }

  /* ============================================================
   * Persistent storage — keep offline data as long as possible
   * ============================================================ */
  function requestPersistence() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }

  /* ============================================================
   * Version / update detection (informational only; never deletes)
   * ============================================================ */
  function checkVersion() {
    if (!navigator.onLine) return;
    fetch('version.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(info => {
        if (!info || !info.version) return;
        $('#dbState') && ($('#dbState').title = t('ver.title', 'الإصدار: {v} — بيانات: {d}')
          .replace('{v}', info.version)
          .replace('{d}', info.data_updated || t('ver.data.unknown', 'غير محدد')));
        idbGet(STORE_DB, 'app-version').then(prev => {
          if (prev && prev !== info.version) {
            const banner = $('#dbBanner');
            if (banner) {
              banner.hidden = false;
              banner.className = 'banner banner-info';
              banner.textContent = tf('update.banner', 'يتوفر إصدار جديد من التطبيق ({a} → {b}).',
                { a: prev, b: info.version });
            }
          }
          idbPut(STORE_DB, 'app-version', info.version).catch(() => {});
        }).catch(() => {});
      })
      .catch(() => {});
  }

  /* ============================================================
   * Rendering helpers
   * ============================================================ */
  function esc(s) {
    return String(s ?? '').replace(/[&<>'"]/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[m]));
  }

  /* Source labels and status display — verbatim values, no reinterpretation */
  function sourceLabel(k) {
    return {
      'libya-248': t('src.248', 'ليبيا، قرار 248 لسنة 2024'),
      'libya-500': t('src.500', 'ليبيا، قرار 500 لسنة 2026'),
      'eu': t('src.eu', 'الاتحاد الأوروبي'),
      'epa': t('src.epa', 'USA / EPA')
    }[k] || k;
  }

  /* Per-source status display via the decision layer (src/cas.js):
   * each source is shown with its OWN vocabulary — never merged into one
   * verdict. Red (banned tone) is reserved for Libya decree 248 alone;
   * reference-source alerts are amber; everything else is neutral.
   * The raw source term stays beside the translation (never hidden). */
  function statusDisplay(r, k, showDetails) {
    const d = CasDissect.dissectStatus(r, k);
    const phrase = t(d.key, d.raw || '?');
    let extra = '';
    if (/^st\.500\./.test(d.key) && d.raw) extra = ' (' + d.raw + ')';   // code stays visible
    else if (showDetails && d.raw && d.raw !== phrase) extra = ' · ' + d.raw;
    if (d.rup) extra += ' · ' + t('st.epa.rup.note', 'استخدام مقيد (للمرخّصين فقط)');
    /* Status legend badge (شرح الرموز): a clickable info chip only for
     * Decree-500 statuses that have a verbatim explanation (Approved, REV,
     * RAR, REV*). Renders as part of the status paragraph. */
    const ek = LEGEND_STATUS_KEYS[String(d.raw || '').trim()];
    const chip = ek
      ? ' <button type="button" class="st-explain" data-status="' + esc(String(d.raw).trim()) + '" aria-haspopup="dialog" title="' + esc(t('legend.title', 'شرح الرموز')) + '">' + t('legend.open', 'شرح الرموز') + '</button>'
      : '';
    return { text: phrase + extra, tone: d.tone, raw: d.raw, chip, explainKey: ek || null };
  }

  /* أ3 — render(results, target): the SAME decision-layer card renderer for
   * BOTH the manual search view (#results) and the scan view (#scanResults).
   * target defaults to '#results' so every existing caller behaves exactly as
   * before (manual search, mode/lang re-renders). The scan automation passes
   * '#scanResults' — search/matching logic itself is untouched. */
  function render(results, q, target) {
    const box = typeof target === 'string' ? $(target) : target || $('#results');
    if (!box) { lastResults = results || []; return; }
    if (target !== undefined && target !== '#results') {
      /* scan-path render: do not overwrite manual-search state */
      lastScanResults = results || [];
    } else {
      lastResults = results || [];
    }
    const title = $('#resultTitle');
    if (title) title.textContent = t('results.title2', 'نتائج الفحص') + (q ? t('results.for', ' لـ «{q}»').replace('{q}', q) : '');
    if (!results.length) {
      box.innerHTML = '<div class="notice warn"><b>' + t('results.none.t', 'لم يتم العثور على تطابق موثوق') + '</b><br>'
        + t('results.none.b', 'عدم العثور على المادة لا يعني أنها مسموحة.') + '</div>';
      return;
    }
    /* Prohibited-list warning (Libya decree 248): rendered only when a row
     * from that database actually matched (≥80%, enforced by SearchCore) —
     * it is never assumed or invented. Merged from the Base44 exploration. */
    /* ج — فصل الوضعين (مواصفة برومبت البطء، غير قابلة للتفاوض):
     * disclaimerStrip وabsoluteBanBanner يظهران في الوضعين دائمًا.
     * المتباين بين الوضعين: نتائج الدول الأخرى + رقم CAS + شرح الرمز
     * (وضع المحترف فقط)؛ والحالة الليبية والتصنيف الوظيفي في الوضعين.
     * disclaimerStrip: كان ثابتًا في index.html تحت نتائج البحث فقط —
     * صار ترويسة مُصيَّرة مع كل دفعة نتائج في المسارين (بحث/مسح) فلا
     * يغيب أبدًا عن أي عرض، وبنص data-i18n نفسه دون تغيير. */
    /* فلترة وضع المزارع: نتائج الدول الأخرى (غير الليبية) في المحترف فقط —
     * فلترة عرضية في render لا في محرك المطابقة (SearchCore لا يُمس).
     * بطاقات ليبيا (248/500) تُعرض في الوضعين. مثبت بالاختبار: بنفس
     * النتيجة، المزارع يرى بطاقات ليبيا فقط، والمحترف يرى ليبيا + غيرها. */
    const showDetails = $('#mode').value === 'pro';
    const shownResults = showDetails
      ? results
      : results.filter(x => x.k === 'libya-248' || x.k === 'libya-500');
    const prohibited = shownResults.filter(x => x.k === 'libya-248');
    const disclaimerHtml = '<div class="disclaimer-strip" data-i18n="disclaimer.strip">'
      + t('disclaimer.strip', 'هذه الأداة مساندة وليست حكمًا قانونيًا — المرجع قرارات وزارة الزراعة والجهات الرسمية.')
      + '</div>';
    /* absoluteBanBanner: حظر ليبيا 248 بتطابق تام (100%) قطعي — يُعرض
     * في الوضعين بلا استثناء حتى مع تبسيط بطاقة المزارع. الحظر الاحتمالي
     * (≥80%) يبقى مرئيًا في بطاقته بوضعيه (نفس المصدر) لكن الشريط
     * القطعي الأعلى لا يُبنى إلا على تطابق تام. */
    const banExact = prohibited.find(x => window.CasDissect && CasDissect.classify(x.s.v) === 'exact');
    const banHtml = banExact
      ? '<div class="prohibited prohibited-absolute" data-ban-banner="exact"><span data-icon="ban"></span><span>'
        + tf('results.ban.absolute',
          'حظر قطعي: هذه المادة مدرجة في قرار ليبيا 248 بتطابق تام — ممنوع تداولها أو استخدامها. ({name})',
          { name: esc(String(banExact.r.name || '')).replace(/\n/g, ' · ') })
        + '</span></div>'
      : '';
    /* Ambiguity banner (decision layer): two different substances (different
     * CAS) in a near tie with no confirmed winner → both are shown and the
     * user is told to check the full name. Never auto-picked. */
    const amb = window.CasDissect ? CasDissect.ambiguity(results) : null;
    const ambHtml = amb
      ? '<div class="ambgroup"><span data-icon="caution"></span><span>' + tf('results.ambiguous',
          'نتيجة ملتبسة: توجد مادة أخرى مشابهة برقم كيميائي مختلف ({a} {va}% مقابل {b} {vb}%). تحقق من الاسم الكامل قبل أي قرار.',
          { a: esc(String(amb.a.r.name || '').split('\n')[0]), va: amb.a.s.v,
            b: esc(String(amb.b.r.name || '').split('\n')[0]), vb: amb.b.s.v })
        + '</span></div>'
      : '';
    box.innerHTML = disclaimerHtml + banHtml + ambHtml + (prohibited.length
      ? '<div class="prohibited"><span data-icon="ban"></span><span>' + tf('results.prohibited',
          'تحذير: هذه المادة مدرجة ضمن قائمة المبيدات المحظورة في ليبيا (قرار 248) — {name}',
          { name: esc(String(prohibited[0].r.name || '')).replace(/\n/g, ' · ') })
        + '</span></div>'
      : '')
      + shownResults.map(x => {
      /* --- decision layer: per-source status, verdict class, CAS checks --- */
      const sd = statusDisplay(x.r, x.k, showDetails);
      const stClass = sd.tone === 'banned' ? 'bad' : (sd.tone === 'amber' ? 'review' : 'neutral');
      const isExact = window.CasDissect && CasDissect.classify(x.s.v) === 'exact';
      const verdict = isExact
        ? '<span class="verdict exact">' + t('verdict.exact', 'تطابق تام') + '</span>'
        : '<span class="verdict probable">' + t('verdict.probable', 'احتمالي — تحقق من الاسم الكامل') + '</span>';
      /* CAS display: every listed CAS is checksum-validated for display
       * (failed ones are marked, never corrected); no-CAS rows are labelled. */
      const casList = window.CasDissect ? CasDissect.casOf(x) : '';
      let casHtml;
      if (casList) {
        casHtml = casList.split(',').map(c =>
          CasDissect.casChecksum(c) === false
            ? '<span class="cas-bad" title="' + t('cas.badsum', 'رقم التحقق غير صحيح في بيانات المصدر') + '">' + esc(c) + '</span>'
            : esc(c)).join(' · ');
      } else if (x.r.cas) {
        casHtml = esc(String(x.r.cas).replace(/\n/g, ' · '))
          + ' <span class="nocas">(' + t('cas.nocas', 'بلا رقم في المصدر') + ')</span>';
      } else {
        casHtml = t('cas.missing', 'غير متوفر');
      }
      const strong = x.s.v >= 90;
      const raw = x.r.status_raw && showDetails
        ? '<p class="match">' + t('results.source.raw', 'الحالة كما وردت في المصدر:') + ' ' + esc(x.r.status_raw) + '</p>'
        : '';
      const cat = x.r.category && showDetails
        ? '<p class="match">' + t('results.source.category', 'التصنيف كما ورد في المصدر:') + ' '
          + String(x.r.category).split(/\n+/).map(function (c) {
              return '<span class="cat-code" tabindex="0" role="button" data-cat="' + esc(c) + '">' + esc(c) + '</span>';
            }).join(' · ')
          + '</p>'
        : '';
      const matchType = showDetails
        ? '<p class="match">' + esc(x.s.type) + ': ' + esc(x.s.field) + '</p>'
        : '';
      const badge = '<span class="badge ' + (strong
        ? 'strong">' + t('results.badge.strong', 'تطابق قوي')
        : 'possible">' + t('results.badge.possible', 'تطابق محتمل')) + '</span>';
      const bar = '<div class="scorebar" aria-hidden="true"><i style="width:'
        + Math.min(100, x.s.v) + '%"></i></div>';
      return '<article class="result ' + (strong ? '' : 'possible') + '">'
        + '<div class="result-top"><div><span class="source">' + esc(sourceLabel(x.k)) + '</span>'
        + '<h3>' + esc(x.r.name || t('results.noname', 'بدون اسم')).replace(/\n/g, ' · ') + '</h3>'
        + badge + verdict + '</div>'
        + '<strong>' + x.s.v + '%</strong></div>'
        + bar
        + '<p class="status ' + stClass + '">' + esc(sd.text) + (sd.chip || '') + '</p>'
        + '<p class="meta">' + t('cas.label', 'CAS:') + ' ' + casHtml + '</p>'
        + cat + raw + matchType
        + (sd.extra && sd.extra.length
          ? '<p class="meta">' + sd.extra.map(e => t(e.key, '')
            + (e.reason ? ' — ' + esc(e.reason) : '')).filter(Boolean).join(' · ') + '</p>'
          : '')
        + (!strong ? '<p class="caution">' + t('results.caution', 'تطابق محتمل، راجع الاسم والملصق قبل الاستخدام.') + '</p>' : '')
        + '</article>';
    }).join('');
    /* Paint inline icons inside freshly rendered result markup */
    if (window.UIIcons) UIIcons.paint(box);
    /* Legend tooltips: fill each category chip's title once, from the fixed
     * table (or the unknown-code hint). Pure attributes — no re-decoding. */
    box.querySelectorAll('.cat-code[data-cat]').forEach(el => {
      const title = catTitle(el.getAttribute('data-cat'));
      if (title) el.setAttribute('title', title);
    });
  }

  /* ============================================================
   * Search history (IndexedDB "history" store, capped at 50)
   * ============================================================ */
  function addHistory(q, hits) {
    if (!q) return;
    const rand = Math.random().toString(36).slice(2, 7);
    const entry = { q, hits, at: Date.now(), rand };
    // One atomic transaction: add the entry and trim to the newest 50.
    // Keys 'h:<13-digit-ms>:<rand>' sort chronologically.
    openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      store.put(entry, 'h:' + entry.at + ':' + rand);
      const gk = store.getAllKeys();
      gk.onsuccess = () => {
        const keys = (gk.result || []).sort();
        for (let i = 0; i < Math.max(0, keys.length - 50); i++) store.delete(keys[i]);
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    })).catch(() => {});
  }

  function renderHistory(items) {
    const box = $('#historyList');
    if (!items.length) {
      box.innerHTML = '<div class="notice">' + t('history.empty', 'لا يوجد سجل بحث بعد.') + '</div>';
      return;
    }
    box.innerHTML = items
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .map(x => '<div class="history-item" data-q="' + esc(x.q) + '">'
        + '<span>' + esc(x.q) + '</span><span class="history-meta">'
        + (x.hits || 0) + ' · '
        + new Date(x.at || Date.now()).toLocaleString(I18N.getLang ? I18N.getLang() : 'ar') + '</span></div>')
      .join('');
  }

  function openHistory() {
    return idbGetAll(STORE_HISTORY).then(renderHistory).catch(() => {
      $('#historyList').innerHTML = '<div class="notice">' + t('history.fail', 'تعذّر قراءة السجل.') + '</div>';
    });
  }

  /*
   * Wiring
   * ============================================================ */
  const DB = {};   // key -> validated data object (or absent if unavailable)
  let searchFn = null;
  let lastResults = [];       // most recent manual-search results (for live re-render)
  let lastScanResults = [];   // most recent scan-path results (for live re-render)

  /*
   * The search index is rebuilt ONLY when the set of loaded databases
   * actually changes (phase/count of any source). Rows are immutable
   * while loaded, so caching the index between searches is safe and
   * produces identical results — it just avoids re-normalizing ~8,000
   * fields on every submit (measured ~26 ms per search on desktop;
   * several times that on low-end phones, all on the main thread).
   */
  let cachedIndexSig = null;
  let cachedSearch = null;

  function rebuildSearch() {
    const sig = SOURCES.map(s => s.key + ':' + state[s.key].phase + ':' + state[s.key].count).join('|');
    if (cachedSearch && sig === cachedIndexSig) { searchFn = cachedSearch; return; }
    const sources = SOURCES.map(s => ({ key: s.key, rows: (DB[s.key] || {}).rows || null }));
    searchFn = SearchCore.buildSearch(sources);
    cachedSearch = searchFn;
    cachedIndexSig = sig;
  }

  /* Clear-query button: empty #query, refocus for typing or paste (UI round).
   * أ1 — any query-source change clears ALL previously displayed results
   * BEFORE anything new runs: typing/deleting in the search box hides stale
   * manual-search results instantly. */
  const clearBtn = $('#clearQuery');
  const queryInput = $('#query');
  function clearResultsBox(boxSel) {
    const box = $(boxSel);
    if (!box) return;
    box.innerHTML = '<div class="empty">'
      + '<span class="big" data-icon="search"></span>'
      + '<p>' + t('results.hint', 'اكتب اسم المادة أو رقم CAS ثم اضغط «فحص المادة».') + '</p>'
      + '</div>';
    if (window.UIIcons) UIIcons.paint(box);
  }
  function clearSearchResults() {
    lastResults = [];
    clearResultsBox('#results');
    const title = $('#resultTitle');
    if (title) title.textContent = t('results.title2', 'نتائج الفحص');
  }
  const syncClear = () => { clearBtn.style.display = queryInput.value ? 'inline-flex' : 'none'; };
  queryInput.addEventListener('input', () => {
    syncClear();
    clearSearchResults();   /* أ1: instant, unconditional, no exceptions */
  });
  clearBtn.addEventListener('click', () => {
    queryInput.value = '';
    syncClear();
    clearSearchResults();   /* أ1: deleting the text also clears the old results */
    queryInput.focus();
  });
  syncClear();

  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#query').value.trim();
    if (!q) return;
    rebuildSearch();                       // include newly arrived databases
    if (!searchFn || !searchFn.sources.length) {
      $('#results').innerHTML = '<div class="notice warn"><b>' + t('search.noDB.t', 'قواعد البيانات غير متاحة') + '</b><br>'
        + t('search.noDB.b', 'تعذّر تحميل قاعدة واحدة على الأقل، لذلك لا يمكن تنفيذ البحث.') + '</div>';
      $('#resultTitle').textContent = t('results.title2', 'نتائج الفحص');
      return;
    }
    const pro = $('#mode').value === 'pro';
    const results = searchFn(q, pro);
    render(results, q);
    if (results.length) addHistory(q, results.length);
  });

  const modeSel = $('#mode');
  function syncModeLabel() {
    const ml = $('#modeLabel');
    if (ml && modeSel) ml.textContent = modeSel.value === 'pro'
      ? t('mode.pro', 'المحترف') : t('mode.farmer', 'المزارع');
  }
  if (modeSel) modeSel.addEventListener('change', () => {
    syncModeLabel();
    /* Re-render the current results so the detail level switches live
     * (farmer = simplified verdict, professional = full evidence).
     * أ3: the scan view now hosts its own results — re-render BOTH paths,
     * each only when it actually holds results. */
    const first = $('#results .result') || $('#results .prohibited');
    if (first && lastResults.length) render(lastResults, $('#query').value.trim());
    const scanFirst = $('#scanResults .result') || $('#scanResults .prohibited');
    if (scanFirst && lastScanResults.length) render(lastScanResults, '', '#scanResults');
  });

  window.addEventListener('online', renderDbStatus);
  window.addEventListener('offline', renderDbStatus);

  /* Live language switch: re-render every dynamic string in place.
   * Static text is handled by I18N.apply(); DB status values stay
   * verbatim (source-of-truth strings are never translated). */
  document.addEventListener('langchange', () => {
    renderDbStatus();
    updateOnlineBadge();
    syncModeLabel();
    if (lastResults.length) render(lastResults, $('#query').value.trim());
    if (lastScanResults.length) render(lastScanResults, '', '#scanResults');
    updatePrepPanel();
  });

  /* History view: lives at #/history; the close button returns home. */
  $('#historyClose').addEventListener('click', () => { location.hash = '#/'; });
  /* ب — مسح السجل: التخزين الدائم أولًا (IndexedDB)، ثم إعادة العرض من
   * القراءة الفعلية الجديدة للمخزن (لا إفراغ يدوي للعرض)، مع إشعار
   * بالنتيجة في كل المسارات (نجاح/فشل) — لا فشل صامت. الإشعار يُعرض
   * داخل قائمة السجل نفسها بنمط .notice الموجود. */
  $('#historyClear').addEventListener('click', () => {
    idbClear(STORE_HISTORY)
      .then(() => openHistory())
      .then(() => {
        $('#historyList').insertAdjacentHTML('afterbegin',
          '<div class="notice" data-history-toast>' + t('history.cleared', 'مُسح السجل من هذا الجهاز.') + '</div>');
      })
      .catch(() => {
        openHistory();
        $('#historyList').insertAdjacentHTML('afterbegin',
          '<div class="notice warn" data-history-toast>' + t('history.clearFail', 'تعذّر مسح السجل — حاول مجددًا.') + '</div>');
      });
  });
  $('#historyList').addEventListener('click', e => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    $('#query').value = item.dataset.q || '';
    syncClear();
    $('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
  });

  /* مشاركة التطبيق (المرحلة ج): Web Share عند توفره؛ وإلا نسخ الرابط
   * الحالي كاملًا (root + المسار) إلى الحافظة؛ وأخيرًا التنزيل كملف vCard
   * (كروم ديسكتوب لا يتيح Web Share إلا عبر HTTPS+مستخدم مفعّل، وفايرفوكس
   * لا يتيحه أصلًا) — وفي كل الحالات يظهر إشعار بالنتيجة، لا فشل صامت.
   * navigator.share يُفضَّل عند توفره لأنه يعمل حتى على file:// حيث الحافظة
   * محجوبة. يُشارَك مجلد صفحة التطبيق الحالي (مكافئ appRoot في ocr.js):
   * يعمل على الجذر وفي النشر تحت مسار فرعي /<repo>/ على حد سواء. */
  $('#shareBtn').addEventListener('click', async () => {
    const url = new URL('.', location.href).href.replace(/\/(?:src|tests)\/$/, '/');
    const data = { title: t('brand.title', 'المستشار الزراعي'), url };
    const notify = msg => { ocrMsg.textContent = msg; setTimeout(() => { if (ocrMsg.textContent === msg) ocrMsg.textContent = ''; }, 3000); };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(url); notify(t('share.copied', 'نُسخ رابط التطبيق إلى الحافظة.')); return; }
      catch (e) { /* يمر إلى الملف */ }
    }
    try {
      const vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:' + t('brand.title', 'المستشار الزراعي') + '\r\nURL:' + url + '\r\nEND:VCARD\r\n';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
      a.download = 'al-mustashar.vcf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      notify(t('share.saved', 'تعذّرت المشاركة المباشرة — حُفظ بطاقة اتصال بالرابط، افتحها من جهازك.'));
    } catch (e) {
      notify(t('share.fail', 'تعذّرت المشاركة في هذا المتصفح.'));
    }
  });

  /* Home shortcut: pick an image straight from the gallery flow */
  const galShortcut = document.querySelector('[data-icon-action="gallery"]');
  const galleryInput0 = $('#gallery');
  if (galShortcut && galleryInput0) {
    galShortcut.addEventListener('click', e => { e.preventDefault(); galleryInput0.click(); });
  }

  /* Camera / gallery -> offline OCR (src/ocr.js) -> EXISTING search engine.
     The 80% threshold and source priority live in SearchCore and are not
     touched here; this only feeds candidate text into the same search(). */
  const camera = $('#camera'), preview = $('#preview'), ocrMsg = $('#ocrMsg');
  const previewRow = $('#previewRow');
  let ocrBusy = false;
  let previewUrl = null;   // revoke old blob URLs so repeated scans don't leak memory
  /* أ1 — query-source generation counter: bumped on EVERY change of the scan
   * query source (new image picked, image removed, new scan started). A run
   * of the engine belongs to the generation it started in; when the counter
   * has moved on, that run's UI updates are all suppressed (no stale result
   * can ever be painted for a source that is no longer current). */
  let scanSeq = 0;
  let activeScanSeq = 0;

  function showPreview(file) {
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (e) {} }
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    previewRow.hidden = false;
    if (location.hash !== '#/scan') location.hash = '#/scan';   // show the preview in the scan view
  }

  /* ب — live frames are canvases: the preview/history copy is the FULL
   * uncropped frame encoded to a blob (revokes the previous URL). */
  function showPreviewCanvas(canvas) {
    if (!canvas || !canvas.toBlob) return;
    canvas.toBlob(b => {
      if (!b) return;
      if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (err) {} }
      previewUrl = URL.createObjectURL(b);
      preview.src = previewUrl;
      previewRow.hidden = false;
      if (location.hash !== '#/scan') location.hash = '#/scan';
    }, 'image/jpeg', 0.9);
  }

  /* أ2 — remove/swap the captured image: clears the image AND every result
   * linked to it (أ1 rule), returns the scan view to its ready state, no
   * page reload. A read still running in the background is cancelled and
   * its results are discarded (superseded by the generation bump). */
  function resetScanUI() {
    stopLive(false);                             // ب: tearing down the live camera is part of the reset
    scanSeq++;                                   // أ1: any result from older runs is now stale
    if (ocrBusy && typeof OcrModule !== 'undefined') OcrModule.cancelCurrent();
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch (e) {} previewUrl = null; }
    preview.removeAttribute('src');
    previewRow.hidden = true;
    camera.value = '';
    gallery.value = '';
    ocrMsg.textContent = '';
    $('#cancelOcrBtn').hidden = true;
    clearScanResults();
  }
  $('#cancelImageBtn').addEventListener('click', resetScanUI);

  $('#cameraBtn').addEventListener('click', e => {
    e.preventDefault();
    if (liveVideo && liveSupported()) startLive();   // ب: live camera is the primary capture path
    else camera.click();                             // fallback: file capture (live unsupported)
  });
  camera.addEventListener('change', () => {
    const f = camera.files && camera.files[0];
    if (!f) return;
    scanSeq++;            // أ1: new query source — old results die NOW
    clearScanResults();
    showPreview(f);
    runOcr(f);
  });

  /* Gallery selection — same OCR pipeline, no second workflow */
  const gallery = $('#gallery');
  $('#galleryBtn').addEventListener('click', () => gallery.click());
  gallery.addEventListener('change', () => {
    const f = gallery.files && gallery.files[0];
    if (!f) return;
    scanSeq++;            // أ1: new query source — old results die NOW
    clearScanResults();
    showPreview(f);
    runOcr(f);
  });

  /* ================================================================
   * ب — المرحلة ب (2026-09-25): المعالجة الحية المستمرة من تدفق الكاميرا
   * ب1: فحص رخيص لإطارات مصغّرة على فترات منتظمة؛ أول إطار ناجح يُحلّل
   *     فورًا بالمحرك الكامل بينما يستمر الفحص (نجاح مبكر بلا تجميد).
   * ب2: «التقاط أفضل إطار» يأخذ N إطارات متتالية ويختار الأوضح فقط.
   * ب3: القراءة الكاملة على منطقة الإطار الإرشادي مكبّرة نحو MAX_DIM؛
   *     الصورة المعروضة/المحفوظة في السجل تبقى كاملة غير مقصوصة.
   * ب4: الأجهزة الضعيفة (نوى/ذاكرة قليلة) لا تحصل على الوضع الحي إطلاقًا —
   *     تترك لمسار ب2 فقط؛ الكاميرا الحية متاحة للجهاز اللمسي/المتوسط.
   * ب5: لا بوابات هنا: كل إطار يمر عبر OcrModule.recognize() نفسه
   *     (لاتيني 60%، ثقة 45، إعفاء CAS الصالح) — بلا أي استثناء.
   * أ1: أي مصدر استعلام جديد (التقاط/إيقاف/صورة/إزالة) يمسح كل النتائج فورًا.
   * ================================================================ */
  const liveVideo = $('#liveVideo'), liveGuide = $('#liveGuide'),
        liveSection = $('#liveSection'), liveControls = $('#liveControls'),
        liveHint = liveSection ? liveSection.querySelector('.live-hint') : null;
  let liveStream = null, liveTimer = null, liveBusy = false, liveROIBusy = false;
  let livePassSeq = 0;              // ب1: generation of live full-engine reads
  let liveLastPass = 0;             // cooldown anchor for AUTO full-engine passes
  const LIVE_PASS_COOLDOWN = 8000;  // one auto full-engine read at most per 8s
  const LIVE_BEST_OF = 3;           // ب2: frames per capture (explicit + auto)
  const LIVE_BEST_GAP = 250;        // ms between best-of-N frames

  function liveSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  function setLiveHint(key) {
    if (liveHint) liveHint.textContent = t(key, '');
  }

  /* ب3 — guide canvas follows the video's real aspect ratio */
  function liveDrawGuide(pass) {
    if (!liveGuide || !liveVideo || !liveVideo.videoWidth) return;
    if (liveGuide.width !== liveVideo.videoWidth || liveGuide.height !== liveVideo.videoHeight) {
      liveGuide.width = liveVideo.videoWidth;
      liveGuide.height = liveVideo.videoHeight;
    }
    window.ScanLive.drawGuide(liveGuide, { pass: !!pass });
  }

  /* ب1 — one cheap probe tick: draw a downscaled frame, measure, gate */
  function liveProbeTick(profile) {
    if (!liveStream || !liveVideo || !liveVideo.videoWidth || liveROIBusy || liveBusy) return;
    try {
      const vw = liveVideo.videoWidth, vh = liveVideo.videoHeight;
      const pw = profile.probeW, ph = Math.max(1, Math.round(vh * pw / vw));
      const c = document.createElement('canvas'); c.width = pw; c.height = ph;
      c.getContext('2d', { willReadFrequently: true }).drawImage(liveVideo, 0, 0, pw, ph);
      const m = window.ScanLive.frameMetrics(c);
      const pass = window.ScanLive.cheapPass(m);
      liveDrawGuide(pass);
      if (pass && Date.now() - liveLastPass >= LIVE_PASS_COOLDOWN) void liveFullPass('auto');
    } catch (e) { /* a failed probe must never kill the loop */ }
  }

  /* ب3 — crop the guided ROI from the CURRENT stream, full-frame saved */
  function liveROI() {
    if (!liveVideo || !liveVideo.videoWidth) return null;
    const roi = window.ScanLive.roiRect();
    const full = window.ScanLive.grabFull(liveVideo);
    const roiCanvas = window.ScanLive.cropROI(liveVideo, roi);
    return { full: full, roi: roiCanvas };
  }

  /* ب2 — best-of-N: N frames, sharpest local-variance one wins */
  async function liveBestOf(n) {
    let best = null, bestScore = -1;
    for (let i = 0; i < n; i++) {
      if (!liveStream || !liveVideo || !liveVideo.videoWidth) break;
      const snap = liveROI();
      if (snap && snap.roi) {
        const small = document.createElement('canvas');
        const vw = snap.roi.width, vh = snap.roi.height;
        const s = Math.min(1, 480 / Math.max(vw, vh));
        small.width = Math.max(1, Math.round(vw * s));
        small.height = Math.max(1, Math.round(vh * s));
        small.getContext('2d', { willReadFrequently: true }).drawImage(snap.roi, 0, 0, small.width, small.height);
        const score = window.ScanLive.sharpnessScore(small);
        if (score > bestScore) { bestScore = score; best = snap; }
      }
      if (i < n - 1) await new Promise(r => setTimeout(r, LIVE_BEST_GAP));
    }
    return best;
  }

  /* ب1/b2 — the ONLY path to the engine: a candidate canvas is JPEG-encoded
   * and handed to the SAME recognize() the photo path uses (b5: no bypass).
   * Superseded reads (new capture/stop/image while running) never paint. */
  async function liveFullPass(kind, pre) {
    const mySeq = ++livePassSeq;
    if (liveBusy || liveROIBusy) return;
    const snap = pre || liveROI();
    if (!snap || !snap.roi) return;
    liveBusy = true;
    const msStart = performance.now();
    if (kind === 'auto') liveLastPass = Date.now();   // cooldown anchor for auto passes
    try {
      const blob = await window.ScanLive.canvasToBlob(snap.roi, 0.92);
      scanSeq++;                 // أ1: this pass is a brand-new query source
      const myGen = scanSeq;
      activeScanSeq = scanSeq;
      clearScanResults();
      if (livePassSeq === mySeq && snap.full) showPreviewCanvas(snap.full);   // ب3: full frame in the history/preview
      if (typeof OcrModule !== 'undefined' && ocrBusy) OcrModule.cancelCurrent();
      ocrBusy = true;
      $('#cancelOcrBtn').hidden = false;
      rebuildSearch();
      const msgs = {};
      for (const k of ['ocr.prep','ocr.init','ocr.loading','ocr.pass','ocr.roi','ocr.rotate','ocr.done','ocr.rejected.mixed','ocr.rejected.conf']) msgs[k] = t(k, k);
      const res = await OcrModule.recognize(blob, p => {
        if (livePassSeq !== mySeq || !p) return;
        if (p.statusKey) ocrMsg.textContent = (p.status || p.statusKey) + (p.progress ? ' (' + Math.round(p.progress * 100) + '%)' : '');
        else ocrMsg.textContent = p.status || '';
      }, { search: searchFn, messages: msgs });
      const ms = Math.round(performance.now() - msStart);
      const stale = livePassSeq !== mySeq || scanSeq !== myGen || scanSeq !== activeScanSeq;
      if (stale) { diagAdd({ at: Date.now(), outcome: 'superseded', src: 'live', ms }); return; }
      if (res.rejected) {
        const rejKey = res.rejected.lowConfidence ? 'ocr.rejected.conf' : 'ocr.rejected.mixed';
        ocrMsg.textContent = t(rejKey, 'لم يُستخرج نص موثوق');
        diagAdd({ at: Date.now(), outcome: 'rejected', src: 'live', ms, reason: res.rejected.lowConfidence ? res.rejected.conf : res.rejected.ratio });
        return;
      }
      const textLen = (res.text || '').replace(/\s/g, '').length;
      if (textLen < 6 || (res.confidence !== null && res.confidence < 40)) {
        ocrMsg.textContent = t('ocr.weak.manual', 'لم أستطع القراءة بثقة كافية — أدخل الاسم يدويًا في حقل البحث، أو عدّل النص أدناه.');
        $('#ocrText').value = res.text || '';
        $('#ocrActions').hidden = false;
        diagAdd({ at: Date.now(), outcome: 'weak', src: 'live', ms });
        return;
      }
      /* ب1 — early success: live processing stops the moment a result is
       * accepted; the captured full frame stays in the preview/history. */
      stopLive(false);
      diagAdd({ at: Date.now(), outcome: 'scanned', src: 'live', ms, conf: res.confidence, kind: kind });
      proceedWithScan(res, []);
      ocrMsg.textContent = t('live.result', 'اكتملت القراءة الحية — هذه النتائج من الإطار الملتقط.');
    } catch (e) {
      const cancelled = e && String(e.message || e).indexOf('ocr.cancelled') === 0;
      if (livePassSeq === mySeq && scanSeq === activeScanSeq) {
        ocrMsg.textContent = cancelled ? t('ocr.cancelled', 'أُلغي المسح.') : t('ocr.fail', 'تعذّر تشغيل محرك القراءة.');
        diagAdd({ at: Date.now(), outcome: cancelled ? 'cancelled' : 'error', src: 'live' });
      }
    } finally {
      liveBusy = false;
      ocrBusy = false;
      if (!liveStream) $('#cancelOcrBtn').hidden = true;
    }
  }

  /* ب4 — start/stop the live stream itself (also the أ2/أ1 reset path) */
  async function startLive() {
    if (!liveSupported() || liveStream) return;
    const cls = window.ScanLive.deviceClass();
    const profile = window.ScanLive.PROFILE[cls] || window.ScanLive.PROFILE.medium;
    try {
      liveStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false
      });
    } catch (e) {
      liveStream = null;
      ocrMsg.textContent = t('live.denied', 'رُفض الوصول إلى الكاميرا. اسمح بالوصول من إعدادات المتصفح أو استخدم المعرض.');
      return;
    }
    /* أ1: a live camera session is a NEW query source — any prior photo and
     * its results die NOW (and a still-running photo read is superseded). */
    scanSeq++;
    if (ocrBusy && typeof OcrModule !== 'undefined') OcrModule.cancelCurrent();
    clearScanResults();
    liveVideo.srcObject = liveStream;
    try { await liveVideo.play(); } catch (e) { /* autoplay policies; muted+playsinline */ }
    liveVideo.style.display = '';
    liveSection.hidden = false;
    liveControls.hidden = false;
    $('#cameraBtn').hidden = true;
    $('#galleryBtn').hidden = true;
    liveVideo.style.minHeight = '220px';
    liveVideo.style.objectFit = 'cover';
    if (profile.live) {
      liveVideo.style.minHeight = '260px';
      liveTimer = setInterval(() => liveProbeTick(profile), profile.sampleMs);
      liveProbeTick(profile);
    }
    setLiveHint('live.hint');
  }

  function stopLive(supersede) {
    livePassSeq++;                 // any pending live read is now stale
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    if (liveStream) {
      try { liveStream.getTracks().forEach(tr => tr.stop()); } catch (e) {}
      liveStream = null;
    }
    if (liveVideo) { liveVideo.srcObject = null; liveVideo.style.display = 'none'; }
    if (liveSection) liveSection.hidden = true;
    if (liveControls) liveControls.hidden = true;
    const camBtn = $('#cameraBtn'), galBtn = $('#galleryBtn');
    if (camBtn) { camBtn.hidden = false; camBtn.disabled = false; }
    if (galBtn) { galBtn.hidden = false; galBtn.disabled = false; }
    if (supersede) {
      scanSeq++;                   // أ1: stopping the camera kills live results NOW
      resetScanUI();
    }
  }

  if (liveSupported() && liveVideo) {
    $('#liveCaptureBtn').addEventListener('click', async () => {
      if (liveROIBusy || liveBusy || !liveStream) return;
      liveROIBusy = true;
      $('#liveCaptureBtn').disabled = true;
      try {
        const best = await liveBestOf(LIVE_BEST_OF);   // ب2: explicit capture always best-of-N
        if (best) await liveFullPass('capture', best);
      } finally {
        liveROIBusy = false;
        $('#liveCaptureBtn').disabled = false;
      }
    });
    $('#liveStopBtn').addEventListener('click', () => stopLive(true));
    liveVideo.addEventListener('loadedmetadata', () => liveDrawGuide(false));
  }

  document.addEventListener('langchange', () => {
    if (liveStream) setLiveHint(liveTimer ? 'live.hint' : 'live.scanning');
  });

  /* ----------------------------------------------------------------
   * أ1 — instant result clearing (scan path). Same empty-state as the
   * search view so nothing stale ever survives a query-source change.
   * ---------------------------------------------------------------- */
  function clearScanResults() {
    lastScanResults = [];
    clearResultsBox('#scanResults');
    $('#ocrActions').hidden = true;
    $('#ocrText').value = '';
  }

  /* أ3 — scan results render INSIDE the scan view (#scanResults), using
   * the exact same decision-layer renderer as manual search. Multi-substance
   * reads: every candidate's results are shown automatically (per-row best
   * kept); the candidates stay available as optional manual re-search chips
   * via the (editable) #ocrText + «بحث من النص». */
  function showOcrResults(merged, noneMsg) {
    $('#resultTitle').textContent = t('ocr.title', 'نتائج المسح البصري');
    if (merged.length) {
      render(merged, '', '#scanResults');
    } else {
      render([], '', '#scanResults');
    }
  }

  /* Run candidate text through the existing search and merge results. */
  function searchCandidates(casList, candList) {
    rebuildSearch();
    if (!searchFn || !searchFn.sources.length) return [];
    const rank = { 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 };
    /* Keep the BEST score per row: a weak fuzzy hit from a candidate like
     * "Bifenthrin 7.9" must never mask the exact 100% match for the same
     * row that another candidate ("Bifenthrin") already produced. */
    const byRow = new Map();
    const pushAll = list => (list || []).forEach(x => {
      const prev = byRow.get(x.r);
      if (!prev || x.s.v > prev.s.v) byRow.set(x.r, x);
    });
    for (const cas of casList) pushAll(searchFn(cas, true));   // CAS exact (100%)
    for (const cand of candList) pushAll(searchFn(cand, false)); // same 80% rule
    const merged = [...byRow.values()];
    merged.sort((a, b) => ((rank[a.k] ?? 99) - (rank[b.k] ?? 99)) || (b.s.v - a.s.v));
    return merged.slice(0, 24);
  }


  /* د4 — image quality probe BEFORE reading: sharpness (Laplacian-ish
   * gradient energy), glare (blown-out highlights ratio) and light level.
   * Returns a guidance key list; advisory only, never blocks the scan. */
  function probeImage(file) {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const w = Math.min(320, img.width || 320), h = Math.max(1, Math.round((img.height || 240) * w / (img.width || 320)));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(img, 0, 0, w, h);
          const d = g.getImageData(0, 0, w, h).data;
          let lap = 0, blown = 0, dark = 0, n = 0;
          for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            const g2 = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000 | 0;
            const gx = d[i + 4] - d[i - 4];
            const gy = d[i + w * 4] - d[i - w * 4];
            lap += Math.abs(gx) + Math.abs(gy);
            if (g2 > 250) blown++;
            if (g2 < 25) dark++;
            n++;
          }
          URL.revokeObjectURL(url);
          const keys = [];
          if (n && lap / n < 6) keys.push('ocr.tip.blur');
          if (n && blown / n > 0.08) keys.push('ocr.tip.glare');
          if (n && dark / n > 0.45) keys.push('ocr.tip.dark');
          resolve(keys);
        } catch (e) { URL.revokeObjectURL(url); resolve([]); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
      img.src = url;
    });
  }

  /* د5 — local diagnostics log (localStorage, capped, no images, no upload).
   * Export is manual-only via the button; nothing is ever sent anywhere. */
  const DIAG_KEY = 'mustashar-diag';
  function diagAdd(entry) {
    try {
      const list = JSON.parse(localStorage.getItem(DIAG_KEY) || '[]');
      list.push(entry);
      while (list.length > 100) list.shift();
      localStorage.setItem(DIAG_KEY, JSON.stringify(list));
    } catch (e) { /* storage may be unavailable */ }
  }
  function diagExport() {
    try {
      const list = JSON.parse(localStorage.getItem(DIAG_KEY) || '[]');
      const blob = new Blob([JSON.stringify(list, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mustashar-diagnostics-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) {}
  }

  /* ----------------------------------------------------------------
   * أ3 — full automation: NO confirmation panel. As soon as the read
   * passes the engine's own gates (Latin ratio / confidence floor /
   * valid-CAS-checksum exemption — all unchanged in src/ocr.js), the
   * extracted text is fed straight into the EXISTING search and the
   * results are shown right here in the scan view. Multi-substance
   * reads display every candidate's results automatically; the raw
   * text stays available as an OPTIONAL manual re-search (#ocrText +
   * «بحث من النص»), never as a mandatory first step.
   * ---------------------------------------------------------------- */
  function proceedWithScan(res, tips) {
    const merged = searchCandidates(res.cas, res.candidates);
    showOcrResults(merged);
    $('#ocrText').value = res.text || '';
    $('#ocrActions').hidden = false;
    if (merged.length) {
      ocrMsg.textContent = tips && tips.length
        ? t('ocr.tips', 'ملاحظات على الصورة:') + ' ' + tips.map(k => t(k, k)).join(' · ')
        : t('ocr.auto', 'اكتملت القراءة — هذه نتائج المطابقة تلقائيًا.');
    }
  }
  $('#diagBtn').addEventListener('click', diagExport);

  async function runOcr(file) {
    if (ocrBusy || typeof OcrModule === 'undefined') return;
    ocrBusy = true;
    activeScanSeq = scanSeq;   // this run belongs to the current query-source
    $('#cancelOcrBtn').hidden = false;
    ocrMsg.textContent = t('ocr.prep', 'جارٍ تجهيز الصورة…');
    const t0 = performance.now();
    const tips = await probeImage(file);
    if (scanSeq !== activeScanSeq) return;   // source changed while probing
    try {
      rebuildSearch();   // ensure the index is current before DB-aware OCR scoring
      const msgs = {};
      for (const k of ['ocr.prep','ocr.init','ocr.loading','ocr.pass','ocr.roi','ocr.rotate','ocr.done','ocr.rejected.mixed','ocr.rejected.conf']) msgs[k] = t(k, k);
      const res = await OcrModule.recognize(file, p => {
        if (!p) return;
        if (p.statusKey) ocrMsg.textContent = (p.status || p.statusKey) + (p.progress ? ' (' + Math.round(p.progress * 100) + '%)' : '');
        else if (p.status === 'done') ocrMsg.textContent = t('ocr.done', 'اكتملت القراءة.');
        else {
          const pct = Math.round((p.progress || 0) * 100);
          ocrMsg.textContent = p.status + (pct ? ' (' + pct + '%)' : '');
        }
      }, { search: searchFn, messages: msgs });   // DB-aware pass scoring + i18n keys
      const ms = Math.round(performance.now() - t0);
      /* أ1 — a superseded scan (new image chosen / image cleared mid-read)
       * must never paint results: the engine may keep running in the
       * background, but EVERY UI update below is gated on the source
       * staying current (scanSeq). No stale result can ever appear. */
      if (scanSeq !== activeScanSeq) {
        diagAdd({ at: Date.now(), outcome: 'superseded', ms, passes: res.passes });
        return;
      }
      /* Rejection (ج Latin-ratio + أ4 confidence floor): the engine refused
       * the merged text. Show the matching literal message via i18n and keep
       * the editor empty — nothing from a rejected text is surfaced. */
      if (res.rejected) {
        const rejKey = res.rejected.lowConfidence ? 'ocr.rejected.conf' : 'ocr.rejected.mixed';
        ocrMsg.textContent = t(rejKey, 'لم يُستخرج نص موثوق');
        $('#ocrText').value = '';
        $('#ocrActions').hidden = false;
        diagAdd({ at: Date.now(), outcome: 'rejected', ms, passes: res.passes,
                  reason: res.rejected.lowConfidence ? res.rejected.conf : res.rejected.ratio });
        return;
      }
      const textLen = (res.text || '').replace(/\s/g, '').length;
      const weak = textLen < 6 || (res.confidence !== null && res.confidence < 40);
      if (weak) {
        /* safe failure: no guessing — point to manual entry */
        ocrMsg.textContent = t('ocr.weak.manual', 'لم أستطع القراءة بثقة كافية — أدخل الاسم يدويًا في حقل البحث، أو عدّل النص أدناه.');
        $('#ocrText').value = res.text || '';
        $('#ocrActions').hidden = false;
        diagAdd({ at: Date.now(), outcome: 'weak', ms, passes: res.passes });
        return;
      }
      diagAdd({ at: Date.now(), outcome: 'scanned', ms, passes: res.passes, conf: res.confidence, variant: res.variant });
      /* أ3 — full automation: gate-passing text goes straight into the
       * existing search; results render in the scan view with no manual step. */
      proceedWithScan(res, tips);
    } catch (e) {
      const cancelled = e && String(e.message || e).indexOf('ocr.cancelled') === 0;
      if (scanSeq === activeScanSeq) {   // أ1: superseded runs stay silent
        ocrMsg.textContent = cancelled
          ? t('ocr.cancelled', 'أُلغي المسح.')
          : t('ocr.fail', 'تعذّر تشغيل محرك القراءة.');
        diagAdd({ at: Date.now(), outcome: cancelled ? 'cancelled' : 'error', ms: Math.round(performance.now() - t0) });
      }
    } finally {
      ocrBusy = false;
      $('#cancelOcrBtn').hidden = true;
    }
  }
  $('#cancelOcrBtn').addEventListener('click', () => {
    if (typeof OcrModule !== 'undefined') OcrModule.cancelCurrent();
  });

  /* Re-search from (possibly edited) OCR text — same pipeline, same rules. */
  $('#ocrRerun').addEventListener('click', () => {
    if (typeof OcrModule === 'undefined') return;
    const text = $('#ocrText').value || '';
    const cas = OcrModule.extractCAS(text);
    const cands = OcrModule.extractCandidates(text);
    showOcrResults(searchCandidates(cas, cands),
      t('ocr.none.t2', 'لم يتم العثور على تطابق موثوق من النص المدخل'));
  });

  /* ============================================================
   * Offline preparation panel — «تجهيز العمل بدون إنترنت»
   * Shows what is already stored (with real byte sizes read from
   * Cache Storage), whether search and OCR are ready offline, and a
   * single explicit prepare action. No hidden or repeated downloads:
   * assets are fetched once (or already cached by a first online scan)
   * and afterwards served exclusively from cache.
   * ============================================================ */
  const SHELL_PATHS = ['index.html', 'src/search-core.js', 'src/app.js', 'src/ocr.js',
    'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];
  const DATA_PATHS = ['data/libya-248.json', 'data/libya-500.json', 'data/eu.json', 'data/epa.json', 'data/epa-cancelled.json'];
  const OCR_ASSET_PATHS = [
    'vendor/tesseract/tesseract.min.js',
    'vendor/tesseract/worker.min.js',
    'vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js',
    'vendor/tesseract/core/tesseract-core-simd-lstm.wasm',
    'vendor/tesseract/core/tesseract-core-lstm.wasm.js',
    'vendor/tesseract/core/tesseract-core-lstm.wasm',
    'vendor/tesseract/lang/eng.traineddata.gz'
  ];

  /* Find a cached response for a path in ANY app cache (current, OCR,
   * or a previous version) and measure its real size. Opening only
   * cache names that already exist — never creates caches. */
  async function measureCached(paths) {
    try {
      const names = await caches.keys();
      let bytes = 0, ready = 0;
      for (const p of paths) {
        const url = new URL(p, location.href);
        let hit = null;
        for (const name of names) {
          const c = await caches.open(name);
          hit = await c.match(url.href);
          if (hit) break;
        }
        if (!hit) return { ready: false, bytes: 0 };
        ready++;
        const len = parseInt(hit.headers.get('content-length') || '', 10);
        bytes += (Number.isFinite(len) && len > 0)
          ? len
          : (await hit.clone().arrayBuffer()).byteLength;
      }
      return { ready: ready === paths.length, bytes };
    } catch (e) { return { ready: false, bytes: 0 }; }
  }

  const fmtMB = b => (b / 1048576).toFixed(1) + ' ' + t('prep.mb', 'ميجابايت');

  function setPrepItem(liId, sizeId, info) {
    const li = $(liId), sz = $(sizeId);
    if (!li) return;
    li.classList.toggle('done', !!info.ready);
    if (sz) sz.textContent = info.ready ? fmtMB(info.bytes) : '—';
  }

  let prepMeasured = false;
  async function updatePrepPanel() {
    const st = $('#prepState'), btn = $('#prepBtn');
    if (!st) return;
    if (!window.caches) { st.textContent = t('prep.noStorage', 'المتصفح لا يدعم التخزين المحلي الكامل'); return; }
    const [shell, data, ocr] = await Promise.all([
      measureCached(SHELL_PATHS), measureCached(DATA_PATHS), measureCached(OCR_ASSET_PATHS)
    ]);
    prepMeasured = true;
    setPrepItem('#prepShell', '#prepShellSize', shell);
    setPrepItem('#prepData', '#prepDataSize', data);
    setPrepItem('#prepOcr', '#prepOcrSize', ocr);
    /* Home mini card: visible only while preparation is incomplete */
    const mini = $('#homePrepCard');
    if (mini) {
      const allReady = shell.ready && data.ready && ocr.ready;
      const working = $('#homePrepWorking'), readyLine = $('#homeReadyLine'), bar = $('#homePrepBar');
      if (working) working.hidden = allReady;
      if (readyLine) readyLine.hidden = !allReady;
      if (bar) bar.style.width = Math.round(((shell.ready ? 1 : 0) + (data.ready ? 1 : 0) + (ocr.ready ? 1 : 0)) / 3 * 100) + '%';
    }
    const btnText = $('#prepBtnText');
    if (shell.ready && data.ready && ocr.ready) {
      st.textContent = t('prep.full', 'جاهز للعمل بدون إنترنت');
      st.className = 'chip db-ok';
      if (btn) { if (btnText) btnText.textContent = t('prep.done', 'التطبيق مجهز بالكامل'); btn.disabled = true; }
    } else if (shell.ready && data.ready) {
      st.textContent = t('prep.searchReady', 'البحث جاهز دون إنترنت — المسح البصري بحاجة للتجهيز');
      if (btn) { if (btnText) btnText.textContent = t('prep.ocrBtn', 'تجهيز ملفات المسح البصري'); btn.disabled = false; }
    } else {
      st.textContent = t('prep.firstRun', 'أكمل أول تشغيل أثناء الاتصال ليكتمل التجهيز');
      if (btn) { if (btnText) btnText.textContent = t('prep.btn', 'تجهيز الآن'); btn.disabled = false; }
    }
  }

  /* One explicit preparation action (OCR assets + missing shell/data).
     Persistence is re-requested here: a user gesture is the strongest
     signal an engine can get, so asking at the exact moment the user
     opts into ~19 MB of local data maximizes the chance the stored
     databases/OCR are protected from eviction. */
  $('#prepBtn').addEventListener('click', async () => {
    if (typeof OcrModule === 'undefined') return;
    const btn = $('#prepBtn'), st = $('#prepState');
    btn.disabled = true;
    st.textContent = t('prep.working', 'جارٍ التجهيز…');
    requestPersistence();
    ocrMsg.textContent = t('ocr.loading', 'جارٍ تحميل ملفات المسح البصري للاستخدام دون إنترنت…');
    try {
      const n = await OcrModule.prefetch();
      prepMeasured = false;                 // re-measure with fresh data
      await updatePrepPanel();
      ocrMsg.textContent = tf('ocr.loadDone', 'تم تحميل ملفات OCR ({n}/7). سيعمل المسح البصري دون إنترنت.', { n: n });
    } catch (e) {
      st.textContent = t('prep.fail', 'تعذّر التجهيز الآن — أعد المحاولة أثناء الاتصال');
      ocrMsg.textContent = t('prep.failNote', 'تعذّر تحميل ملفات OCR الآن. سيُعاد المحاولة تلقائيًا عند أول مسح أثناء الاتصال.');
    }
    btn.disabled = false;
  });

  /* Support/contact button: reads config/support.json; hidden when empty.
   * No payment integration by design (user decision 5). */
  (function initSupport() {
    const btn = $('#supportBtn');
    if (!btn) return;
    fetch('config/support.json', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(cfg => {
      if (!cfg || (!cfg.contact && !cfg.url)) return;   // stays hidden
      btn.hidden = false;
      btn.textContent = cfg.label || t('support.label', 'ادعم أو تواصل');
      btn.addEventListener('click', () => {
        if (cfg.url) window.open(cfg.url, '_blank', 'noopener');
        else if (cfg.contact) location.href = cfg.contact;
      });
    }).catch(() => { /* hidden = safe default */ });
  })();

  /* Theme (persisted; dark is the default and matches the reference) */
  const themeBtn = $('#themeToggle');
  function renderThemeIcon() {
    const ic = $('#themeIcon');
    if (ic && window.UIIcons) {
      ic.setAttribute('data-icon', document.documentElement.dataset.theme === 'light' ? 'theme' : 'theme-dark');
      UIIcons.paint(ic);
    }
  }
  try {
    const saved = localStorage.getItem('mustashar-theme');
    document.documentElement.dataset.theme = (saved === 'light') ? 'light' : 'dark';
  } catch (e) { document.documentElement.dataset.theme = 'dark'; }
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('mustashar-theme', next); } catch (e) {}
    renderThemeIcon();
  });
  renderThemeIcon();

  /* Service worker registration + update detection */
  function updateOnlineBadge() {
    const el = $('#offlineState');
    if (el) el.textContent = navigator.onLine
      ? t('chip.online', 'متصل') : t('chip.offline', 'بدون إنترنت');
    const ic = $('#connIcon');
    if (ic && window.UIIcons) {
      ic.setAttribute('data-icon', navigator.onLine ? 'online' : 'offline');
      UIIcons.paint(ic);
    }
  }

  /* About page: version + release date come from the real version file */
  function fillAboutMeta() {
    fetch('version.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(info => {
        if (!info) return;
        const v = $('#aboutVersion'), d = $('#aboutDate');
        if (v && info.version) v.textContent = info.version;
        if (d && info.released) d.textContent = info.released;
      }).catch(() => {});
  }

  /* Developer photo: fixed path; falls back to an icon circle when the
   * user has not added assets/developer.jpg yet (404 expected, harmless). */
  (function initDevPhoto() {
    const img = $('#devPhoto'), fb = $('#devPhotoFallback');
    if (!img || !fb) return;
    img.addEventListener('error', () => { img.hidden = true; fb.hidden = false; });
    img.addEventListener('load', () => {
      if (img.naturalWidth > 0) { img.hidden = false; fb.hidden = true; }
      else { img.hidden = true; fb.hidden = false; }
    });
    img.src = 'assets/developer.jpg';
  })();
  window.addEventListener('online', updateOnlineBadge);
  window.addEventListener('offline', updateOnlineBadge);
  updateOnlineBadge();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            const banner = $('#dbBanner');
            if (banner) {
              banner.hidden = false;
              banner.className = 'banner banner-info';
              banner.textContent = t('sw.update', 'يتوفر تحديث للتطبيق. أعد تحميل الصفحة للتحديث — لن يتم حذف أي بيانات محفوظة.');
            }
          }
        });
      });
      return navigator.serviceWorker.ready;
    }).then(() => updatePrepPanel()).catch(() => {});
  }

  /* ============================================================
   * Legend popovers + page wiring (شرح الرموز)
   * ============================================================ */
  function legendCard(status) {
    const code = String(status || '').trim();
    const body = statusExplain(code);
    if (!body) return '';
    /* REV* is rendered exactly as the prompt structures it: the connective
     * line, then REV's own text, then the asterisk note as a separate line. */
    if (code === 'REV*') {
      return '<strong class="lg-code">' + esc(code) + '</strong>'
        + '<p class="lg-body">' + esc(body) + '</p>'
        + '<p class="lg-body">' + esc(statusExplain('REV')) + '</p>'
        + '<p class="lg-note">' + esc(t('st.500.revstar.note', '')) + '</p>';
    }
    return '<strong class="lg-code">' + esc(code) + '</strong>'
      + '<p class="lg-body">' + esc(body) + '</p>';
  }
  function openLegend(status, anchor) {
    const pop = $('#legendPop');
    if (!pop) return;
    const content = legendCard(status);
    if (!content) return;
    const body = pop.querySelector('.lg-content');
    if (body) body.innerHTML = content;
    pop.hidden = false;
    const r = anchor.getBoundingClientRect();
    const pw = Math.min(300, window.innerWidth - 24);
    let left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
    pop.style.left = left + 'px';
    pop.style.top = Math.max(8, r.bottom + 8) + 'px';
    const btn = pop.querySelector('.lg-close');
    if (btn) btn.focus();
  }
  function closeLegend() {
    const pop = $('#legendPop');
    if (pop) pop.hidden = true;
  }
  document.addEventListener('click', e => {
    const chip = e.target.closest('.st-explain');
    if (chip) { openLegend(chip.getAttribute('data-status'), chip); return; }
    const cat = e.target.closest('.cat-code[data-cat]');
    if (cat) {
      const code = cat.getAttribute('data-cat');
      openLegendRaw(catName(code)
        ? code + '\n' + catName(code)
        : t('legend.cat.unknown', 'رمز غير معرّف في دليل القرار.'), cat);
      return;
    }
    if (!e.target.closest('#legendPop')) closeLegend();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLegend();
    const chip = e.target.closest && e.target.closest('.st-explain');
    if (chip && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openLegend(chip.getAttribute('data-status'), chip);
    }
  });
  function openLegendRaw(text, anchor) {
    const pop = $('#legendPop');
    if (!pop) return;
    const body = pop.querySelector('.lg-content');
    if (!body) return;
    body.innerHTML = '<strong class="lg-code">' + esc(String(text).split('\n')[0]) + '</strong>'
      + '<p class="lg-body">' + esc(String(text).split('\n').slice(1).join('\n') || t('legend.cat.unknown', 'رمز غير معرّف في دليل القرار.')) + '</p>';
    pop.hidden = false;
    const r = anchor.getBoundingClientRect();
    const pw = Math.min(300, window.innerWidth - 24);
    pop.style.left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12) + 'px';
    pop.style.top = Math.max(8, r.bottom + 8) + 'px';
    const btn = pop.querySelector('.lg-close');
    if (btn) btn.focus();
  }
  /* ============================================================
   * Boot
   * ============================================================ */
  applyView();
  syncModeLabel();
  renderDbStatus();
  requestPersistence();
  loadAll();
  checkVersion();
  fillAboutMeta();
  updatePrepPanel();          // works even if the SW is still installing
})();
