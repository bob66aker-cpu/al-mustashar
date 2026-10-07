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

  /* قواعد إضافية اختيارية: تدخل SOURCES بعد تنزيلها فقط — لا قبله.
   * الفارق بينها وبين القواعد الأساسية: لا تعمل إلا إن طلبها المزارع. */
  const PACK_SOURCES = {
    canada: { key: 'canada', labelKey: 'db.src.canada', label: 'كندا — PMRA', attr: 'attr.canada' },
    australia: { key: 'australia', labelKey: 'db.src.australia', label: 'أستراليا — APVMA', attr: 'attr.australia' }
  };
  function activeSources() {
    return SOURCES.concat(
      Object.keys(PACK_SOURCES).filter(function (k) { return !!DB[k]; })
        .map(function (k) { return PACK_SOURCES[k]; }));
  }

  const DB = {};   // key -> validated data object (or absent if unavailable)
  const DB_NAME = 'mustashar-local';
  const DB_VERSION = 3;           // v1 = "db"; v2 adds "history"; v3 adds "pack" (optional databases)
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
    if (v === 'search') mountJurisdiction();
  }
  window.addEventListener('hashchange', applyView);

  /* ============================================================
   * Legend (شرح الرموز) — every status explanation, every category
   * name and every printed shape comes from data/reference.json and
   * from nowhere else (the reference block below). Unknown codes are
   * never interpreted — shown verbatim with the «رمز غير مشروح في
   * دليل هذا المصدر» hint.
   * ============================================================ */
  /* ============================================================
   * data/reference.json — المرجع الموحّد الذي يقرأ منه العرض حصرياً.
   * ------------------------------------------------------------
   * لا جدول ترجمة هنا ولا معنى مكتوب في السطر: كل شرح وكل شكل يأتي
   * من data/reference.json (مُحمَّل قبل القواعد، ببصمة، ومخزَّن مسبقًا
   * في الكاش). المصدر غائب أو مدخله ناقص ⇒ الجداول فارغة ⇒ السلوك
   * القائم «رمز غير مشروح في دليل هذا المصدر» هو الوحيد الباقي، ولا
   * يُخمَّن معنى أبدًا.
   * الأقسام مستقلة: كل مصدر يُحلّ في قسمه وحده (لا دمج دلالي ولا
   * استنساخ شرح من مصدر لآخر)؛ والاستثناء الموثَّق الوحيد هو
   * fallbackSection المُعلَن داخل libya248.
   * ============================================================ */
  const REF_BY_SOURCE = {
    'libya-500': 'libya500', 'libya-248': 'libya248', 'eu': 'eu',
    'epa': 'epa', 'epa-cancelled': 'epa', 'canada': 'canada', 'australia': 'australia'
  };
  let REF = null;                 /* the loaded reference (set by loadReference) */
  function refSection(key) { return (REF && REF.sections && REF.sections[key]) || null; }
  function refSectionOf(sourceKey) { return refSection(REF_BY_SOURCE[sourceKey] || ''); }

  /* قاعدة الدمج «fold» كما يوثّقها المرجع: حالة الأحرف سواء، والنقطة
   * والفراغ محذوفان — S.Ph = S Ph = SPh و Rep = rep. */
  function catFold(code) {
    return String(code == null ? '' : code).toLowerCase().replace(/[.\s]/g, '');
  }
  /* مدخل الرمز في قسم واحد: المطابقة الحرفية أولًا، ثم الأشكال
   * الموثّقة (كل صيغة يطبعها ذلك المصدر فعلًا)، ثم القسم الاحتياطي
   * إن أعلنه المرجع. لا شيء خارج هذا. */
  function refCatEntry(sectionKey, code) {
    const s = refSection(sectionKey);
    if (!s || !s.categories) return null;
    const direct = s.categories[code];
    if (direct) return direct;
    const fold = catFold(code);
    const keys = Object.keys(s.categories);
    for (let i = 0; i < keys.length; i++) {
      const e = s.categories[keys[i]] || {};
      const shapes = e.shapes || [];
      for (let j = 0; j < shapes.length; j++) {
        if (catFold(shapes[j]) === fold) return e;
      }
    }
    if (s.fallbackSection && s.fallbackSection !== sectionKey) return refCatEntry(s.fallbackSection, code);
    return null;
  }
  function refCatKey(sectionKey, code) {
    const e = refCatEntry(sectionKey, code);
    return e && e.i18nKey ? e.i18nKey : '';
  }
  /* شرح حالة: من قسم مصدرها وحده. الـbadge نفسه (LEGEND_STATUS equivalent)
   * يُشتقّ من وجود مدخل statusCodes في قسم قرار 500.
   * D53: الشرح يُقرأ من statusExplanations (مفاتيح الشرح)، لا من statusCodes
   * (مفاتيح الشارة) — فكان نص الشارة يطبع مكان الشرح على البطاقة. */
  function statusExplain(rawStatus) {
    const s = refSection('libya500');
    const e = s && s.statusExplanations ? s.statusExplanations[String(rawStatus || '').trim()] : null;
    return e && e.i18nKey ? t(e.i18nKey, '') : '';
  }
  function statusHasEntry(rawStatus) {
    const s = refSection('libya500');
    return !!(s && s.statusCodes && s.statusCodes[String(rawStatus || '').trim()]);
  }
/* FB7 — ONE source of truth for the lines a status code explains to.
   Before this, the card and «شرح الرموز» each assembled the text their own
   way, and REV* lost the very text it points at: the card showed only the
   connective line and never the REV sentence nor the asterisk note that the
   guide adds right after it. Nothing here is authored — every line is the
   verbatim reference text, and a code no source explains yields no lines
   at all (D25). */
  function statusExplainLines(code) {
    const c = String(code || '').trim();
    const body = statusExplain(c);
    if (!body) return [];
    if (c === 'REV*') {
      return [body, statusExplain('REV'), t('st.500.revstar.note', '')].filter(Boolean);
    }
    return [body];
  }
  function statusExplainFull(code) {
    return statusExplainLines(code).join(' ');
  }
  /* Compound functional codes (Decree-248 «I/A» and friends) are resolved to
   * their parts so the tooltip/popover explains EVERY part. The separator set
   * (`,` `/` `+`) and the dot rule are the ones data/reference.json documents:
   * a dot separates parts only when EVERY dot-part is itself a code of THIS
   * section («F.rep» → F + rep). Dotted source codes that are not fully
   * explained — S.Ph, P.G.R, I.Ph, R.S — therefore stay ONE literal code and
   * get the «رمز غير مشروح» hint instead of being torn into wrong halves.
   * Nothing is ever guessed: an unknown code is shown verbatim, never
   * interpreted. */
  const CAT_HARD_SEP = /[\/,+]/;
  const CAT_DOT_SEP = /\./;
  function catParts(code, sectionKey) {
    const sec = sectionKey || 'libya500';
    const c = String(code || '').trim();
    if (!c) return [];
    return c.split(CAT_HARD_SEP).map(p => p.trim()).filter(Boolean)
      .flatMap(p => p.includes('.') && p.split(CAT_DOT_SEP).every(q => refCatKey(sec, q.trim()))
        ? p.split(CAT_DOT_SEP).map(q => q.trim()).filter(Boolean)
        : [p]);
  }
  function catName(code, sectionKey) {
    const sec = sectionKey || 'libya500';
    const parts = catParts(code, sec);
    if (!parts.length) return '';
    if (parts.length > 1) return parts.map(p => catName(p, sec) || '').filter(Boolean).join(' + ');
    return t(refCatKey(sec, parts[0]), '');
  }
  /* Category line: known codes get their own source's meaning; a COMPOUND
   * cell is resolved to its parts, each explained, joined with « + ».
   * D29 (FB9): a part the source guide does NOT explain is NAMED inside the
   * sentence — «F/Mi» reads «مبيد فطري + Mi: رمز غير مشروح في دليل هذا
   * المصدر» — never a bare «رمز غير مشروح» that could belong to any code.
   * The DECLARED order rule: parts are rendered in the cell's own left-to-right
   * order, one item per part, no re-ordering and no merging; the cell itself
   * stays ONE block whose heading is the literal cell (the h1 behaviour: a
   * «/» slice is never torn into separate blocks). */
  function catPartText(part, sectionKey) {
    return catName(part, sectionKey) || tf('legend.cat.unknownNamed',
      part + ': ' + t('legend.cat.unknown', 'رمز غير مشروح في دليل هذا المصدر'),
      { part: part });
  }
  /* D44: the attribution the section declares, shown ONLY when the meaning was
   * really taken from the declared fallback (a transferred code). A code the
   * section cannot explain gets no attribution — it gets the hint, and the
   * hint must never carry a source line it has no claim to. */
  function catAttribution(code, sourceKey) {
    const sec = refSectionOf(sourceKey);
    if (!sec || !sec.attribution) return '';
    const parts = catParts(code, (REF_BY_SOURCE[sourceKey] || 'libya500'));
    const viaFallback = parts.some(p => {
      const own = sec.categories && sec.categories[p];
      if (own && own.transferredFrom) return true;
      if (own) return false;
      const fold = catFold(p);
      return Object.values(sec.categories || {}).some(e => e.transferredFrom
        && (e.shapes || []).some(sh => catFold(sh) === fold));
    });
    if (!viaFallback) return '';
    const lang = (window.I18N && I18N.getLang) ? I18N.getLang() : 'ar';
    return String(sec.attribution[lang] || sec.attribution.ar || '');
  }
  /* D45: the section DECLARES what its category column holds. A descriptive
   * column (Australia's product-group text) is not a code cell: it is printed
   * exactly as the export prints it — never split, never resolved, never
   * translated, and never dressed in the unexplained-code hint, which belongs
   * to real codes alone. Measured live (ZIRAM, both containers). */
  function catIsDescriptive(sourceKey) {
    const sec = refSection((sourceKey && REF_BY_SOURCE[sourceKey]) || 'libya500');
    return !!(sec && sec.categoryKind === 'descriptive');
  }
  function catTitle(code, sourceKey) {
    if (catIsDescriptive(sourceKey)) return String(code == null ? '' : code);
    const sec = (sourceKey && REF_BY_SOURCE[sourceKey]) || 'libya500';
    const parts = catParts(code, sec);
    if (!parts.length) return '';
    if (parts.length > 1) return parts.map(p => catPartText(p, sec)).join(' + ');
    return catPartText(parts[0], sec);
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
        /* the optional-pack store lives in the same schema version, so whichever
         * module opens the database first creates it */
        if (!db.objectStoreNames.contains('pack')) db.createObjectStore('pack');
        if (!db.objectStoreNames.contains(STORE_HISTORY)) {
          db.createObjectStore(STORE_HISTORY);
        }
      };
      req.onsuccess = () => {
        const conn = req.result;
        /* D39: versionchange fires on the CONNECTION (IDBDatabase), not on the
         * open request — so the handler lives here, not on `req`. The old
         * request-level handler never fired, which is why the connection could
         * stay open and block an upgrade; the existing guard proved only its own
         * connection closed, never the app's. */
        conn.onversionchange = () => {
          try { conn.close(); } catch (e) { /* already closing */ }
          dbPromise = null;
        };
        resolve(conn);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('indexeddb blocked'));
      /* A version change cannot proceed while this page still holds the old
       * connection open — the upgrade would sit blocked forever and the app
       * would keep reading a stale schema. So the connection closes itself
       * (handler attached in onsuccess, on the connection) and the cached
       * promise is dropped, letting the next call reopen at the new version.
       * Losing the handle is safe: nothing here keeps in-memory state that
       * only exists on the connection. */
    }).catch(err => { dbPromise = null; throw err; });
    return dbPromise;
  }

  function isQuotaError(err) {
    return !!(err && (err.name === 'QuotaExceededError' || /quota/i.test(String(err.message || err))));
  }
  function idbPut(store, key, value) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    })).catch(err => {
      if (isQuotaError(err)) {
        /* the app still WORKS from the cache; only the copy is lost — say so */
        showSafetyBanner(false, t('quota.hint',
          'لا توجد مساحة تخزين كافية لحفظ نسخة إضافية. احذف سجل البحث أو ملفات الموقع من إعدادات المتصفح ثم أعد التجهيز — التطبيق يعمل الآن من الذاكرة المؤقتة.'));
      }
      throw err;
    });
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

  /* (هـ4) — العدّ البرمجي لأعمار قرار 500 من عمود status في الملف المحمَّل
   * (لا رقم مكتوب يدويًا)، مع مجموع التصنيفات بعد فك الرموز المركّبة.
   * مجموع التصنيفات يتجاوز عدد الصفوف لأن مادة واحدة قد تحمل أكثر من
   * تصنيف (تعدد الاستخدامات): التصنيف ليس تقسيمًا للصفوف — وهذا مذكور
   * في النص المعروض، لا مخفي. */
  function render500Break() {
    const el = $('#dbBreak500');
    if (!el) return;
    const d = DB['libya-500'];
    if (!d || !Array.isArray(d.rows) || !d.rows.length) { el.hidden = true; return; }
    const byStatus = {}, byCat = {};
    d.rows.forEach(r => {
      const s = String(r.status || '').trim() || '—';
      byStatus[s] = (byStatus[s] || 0) + 1;
      catParts(r.category, 'libya500').forEach(p => { byCat[p] = (byCat[p] || 0) + 1; });
    });
    const list = o => Object.keys(o).sort((a, b) => o[b] - o[a] || a.localeCompare(b))
      .map(k => k + ' ' + o[k]).join(' · ');
    const sum = o => Object.keys(o).reduce((a, k) => a + o[k], 0);
    const stLine = document.createElement('span');
    stLine.className = 'brk-line';
    stLine.textContent = tf('data.500.status',
      'الحالة — عدّ محسوب من الملف المحمَّل: {list} (مجموع {sum} من {rows} صف).',
      { list: list(byStatus), sum: sum(byStatus), rows: d.rows.length });
    const catLine = document.createElement('span');
    catLine.className = 'brk-line';
    catLine.textContent = tf('data.500.cat',
      'التصنيف بعد فك الرموز المركّبة: {list} (مجموع {sum}) — يتجاوز {rows} لأن مادة واحدة قد تحمل أكثر من تصنيف (تعدد الاستخدامات)؛ فالتصنيف ليس تقسيمًا للصفوف.',
      { list: list(byCat), sum: sum(byCat), rows: d.rows.length });
    el.textContent = '';
    el.appendChild(stLine);
    el.appendChild(document.createElement('br'));
    el.appendChild(catLine);
    el.hidden = false;
  }

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
    render500Break();
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
          { names: bad.map(s => t(s.labelKey, s.label))
              .flatMap(x => x.split(/،/)).map(s => s.trim()).filter(Boolean)
              .join(t('list.sep', '، ')) });
      } else {
        banner.hidden = true;
      }
    }
  }

  /* 1.4b — سباق البانر: تحذير الاقتطاع يكتب في #dbBanner ثم يمسحه
   * renderDbStatus (يخفيه عندما لا قاعدة unavailable). الحالة
   * تُخزن هنا ويتم إعادة التأكيد من renderDbStatus بعد كل تغير طور. */
  const shortRows = {};
  function setPhase(key, phase, count) {
    state[key].phase = phase;
    if (typeof count === 'number') state[key].count = count;
    renderDbStatus();
    const shortInfo = shortRows[key];
    if (shortInfo && phase === 'ok') {
      const banner = $('#dbBanner');
      if (banner) {
        banner.hidden = false;
        banner.className = 'banner banner-warn';
        banner.textContent = tf('db.banner.short',
          'تحذير: {key} وصل بعدد أقل من الموثق ({got} من {exp}) — قد تكون هناك بيانات مقتطعة.',
          { key: t(SOURCES.find(s => s.key === key).labelKey, key), got: shortInfo.got, exp: shortInfo.exp });
      }
    }
  }

  /* ============================================================
   * Loading — parallel + fail-soft.
   * Each source is independent: one failure never blocks others.
   * ============================================================ */
  /* c3: documented row counts (docs/data-provenance.md). A loaded file
   * that arrives SHORTER than documented is a silent-truncation alarm —
 * the banner fires and the count is still shown, nothing is hidden. */
  /* 1.4 — epa كانت 2199 (الملف القديم قبل إعادة البناء من EPA_Master):
   * كل تحميل صحيح كان يشعل بانر «بيانات مقتطعة» المزيف، والمعلمة
   * epa-cancelled كانت غائبة أصلًا (docs/data-provenance.md). */
  const EXPECTED_ROWS = { 'libya-248': 77, 'libya-500': 411, eu: 1483, epa: 1361, 'epa-cancelled': 1425 };

  /* 2026-09-29 — سلامة البيانات عند التحميل.
   * EXPECTED_ROWS يثبت العدد فقط؛ هذا يثبت المحتوى. البصمة تُحسب على BYTES
   * الخام قبل JSON.parse، فالملف التالف أو المبتور يُرفض ولو كان يحوي
   * JSON صالحاً. نفس قيم tests/data-health.test.mjs — والحارس
   * tests/data-integrity.test.mjs يمنع انفصال أيٍّ منهما عن الآخر.
   *
   * مبدأ الفشل: fail-soft كسائر مسارات البيانات. إن غاب crypto.subtle
   * (سياق غير آمن) يُتخطى التحقق بدل أن يُعطَّل التطبيق — تماماً كـ packs.js. */
  const DATA_SHA256 = {
    'data/libya-248.json':     'b6850e0381fda847b0bc4b30096d35847b91e626587647dd79ef80ea04cbacd5',
    'data/libya-500.json':     '08b852cb1ac8f438e5f960936bae9b525ec8057ff5e3f61cd1062f44ba23ae14',
    'data/eu.json':            'ef629525c2dae8f741e1697faaecf2319e1a646e4e011d2754ef66e23844101e',
    'data/epa.json':           'b24d7c3e3a8dbd7e84ef7b1a59bbfb98674b5c8ad44ff7f7a3dbe0d90d7775f3',
    'data/epa-cancelled.json': 'c2b5b38e4bfe07dc466c45d4f18518691a57de17b078822e2e6fab00de58fde7',
    'data/reference.json':      '08482958be19b9e6dd85f784707249c0f31fc0c92626a0bef34944a5235373e6'
  };

  /* يُرجع null حين لا تتوفّر Web Crypto (سياق غير آمن) — لا يُرجع false أبداً،
   * لأن false يعني «فشل تحقق»، وهو حكم لا يجوز إسقاته بلا دليل. */
  function sha256Hex(buf) {
    if (!globalThis.crypto || !globalThis.crypto.subtle) return Promise.resolve(null);
    return globalThis.crypto.subtle.digest('SHA-256', buf).then(function (d) {
      return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  function loadSource(src) {
    setPhase(src.key, 'loading');
    const attemptFetch = () => fetch(src.url, { cache: 'no-store' }).then(async res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      /* البصمة على البايتات الخام: لو اختلف الملف عن المبنيّ رُفض قبل
       * JSON.parse، فيرتدّ إلى إعادة المحاولة ثم إلى النسخة المخزّنة —
       * نفس مسار الضعف: لا كود جديد، لا مسار فشل خاص. */
      const want = DATA_SHA256[src.url];
      if (want) {
        const buf = await res.arrayBuffer();
        const got = await sha256Hex(buf);
        if (got && got !== want) {
          throw new Error('data integrity: ' + src.key + ' sha256 ' +
            String(got).slice(0, 12) + ' ≠ ' + String(want).slice(0, 12));
        }
        const parsed = JSON.parse(new TextDecoder().decode(buf));
        if (!looksValid(parsed)) throw new Error('invalid payload');
        return parsed;
      }
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
        if (cards && cards.buildCasIndex) cards.buildCasIndex(DB);
        if (tooShort(data)) {
          /* 1.4c — يُسجل ليعيد setPhase إظهاره بعد أي إصطلاح للبانر. */
          shortRows[src.key] = { got: data.rows.length, exp: EXPECTED_ROWS[src.key] };
        }
        // cache after success; never overwrite a valid cache with bad data
        return idbPut(STORE_DB, src.key, data).catch(() => {});
      })
      .catch(() => attemptFetch()                 // one silent retry
        .then(data => {
          DB[src.key] = data;
          setPhase(src.key, 'ok', data.rows.length);
          if (cards && cards.buildCasIndex) cards.buildCasIndex(DB);
          return idbPut(STORE_DB, src.key, data).catch(() => {});
        })
        .catch(() =>
          // fall back to the cached copy (any version) if present
          idbGet(STORE_DB, src.key).then(cached => {
            if (looksValid(cached)) {
            if (cards && cards.buildCasIndex) cards.buildCasIndex(cached);
              DB[src.key] = cached;
              setPhase(src.key, 'cached', cached.rows.length);
            } else {
              // mark unavailable — search simply skips this source
              setPhase(src.key, 'unavailable');
            }
          }).catch(() => setPhase(src.key, 'unavailable'))
        ));
  }

  /* data/reference.json — the display's ONLY source of explanations and
   * shapes. Loaded FIRST and awaited: a card rendered before it would resolve
   * every code to «غير مشروح», which is the safe failure but a wrong screen.
   * Same fail-soft rule as the databases — never blocks the app. */
  function loadReference() {
    const url = 'data/reference.json';
    return fetch(url, { cache: 'no-store' }).then(async res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const want = DATA_SHA256[url];
      if (want) {
        const buf = await res.arrayBuffer();
        const got = await sha256Hex(buf);
        if (got && got !== want) throw new Error('reference integrity sha256 mismatch');
        REF = JSON.parse(new TextDecoder().decode(buf));
      } else {
        REF = await res.json();
      }
      return REF;
    }).then(ref => {
      /* hand the reference's own texts to the dictionaries — no copy here */
      const byLang = {};
      Object.keys(ref.sections || {}).forEach(name => {
        const texts = ref.sections[name].texts || {};
        Object.keys(texts).forEach(key => {
          const entry = texts[key] || {};
          ['ar', 'en', 'fr', 'zh'].forEach(lang => {
            if (!entry[lang]) return;
            (byLang[lang] = byLang[lang] || {})[key] = entry[lang];
          });
        });
      });
      if (window.I18N && I18N.register) I18N.register(byLang);
      return ref;
    }).catch(() => {
      REF = null;   // no reference ⇒ no explained code, hint only, never a guess
      return null;
    });
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
        window.__appVersion = info.version;   /* printed in the pro report */
        /* خريطة «آخر تحقق» تُحفظ هنا وتُقرأها dataVersionOf؛ البطاقات
         * المعروضة قبل وصولها تُعاد رسمها مرة واحدة حتى لا تبقى بلا تاريخ. */
        if (info.dataCheck) {
          window.__dataCheck = info.dataCheck;
          try {
            if (lastResults.length) render(lastResults, $('#query').value.trim());
            if (lastScanResults.length) render(lastScanResults, '', '#scanResults');
          } catch (e) { /* a failed repaint never breaks the version check */ }
        }
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
      'epa': t('src.epa', 'USA / EPA'),
      /* 1.3 — أرشيف الملغى كان يعرض المفتاح الخام بدل التسمية:
       * الجدول بلا مفتاح 'epa-cancelled' فيسقط على || k ويطبع "epa-cancelled"
       * حرفيًا فوق البطاقة، مع أن 'src.epac' موجود في القواميس الأربعة. */
      'epa-cancelled': t('src.epac', 'USA / EPA — أرشيف الملغى'),
      /* القواعد الإضافية: التسمية من القاميس، لا المفتاح الخام */
      'canada': t('src.canada', 'كندا — سجل المبيدات الوطني (PMRA)'),
      'australia': t('src.australia', 'أستراليا — APVMA')
    }[k] || k;
  }

  /* الإسناد الإلزامي يظهر على كل بطاقة من حزمة خارجية، لا في صفحة منفصلة:
     ترخيص OGL-Canada و CC-BY 3.0 Australia يشترطان ذكره مع الاستخدام. */
  function packAttribution(k) {
    if (k === 'canada') return t('attr.canada', 'Contains information licensed under the Open Government Licence – Canada.');
    if (k === 'australia') return t('attr.australia', 'Contains information licensed under the Creative Commons Attribution 3.0 Australia licence.');
    if (k === 'eu') return t('attr.eu', '© European Union — Reuse is permitted under the European Commission reuse policy (Decision 2011/833/EU). EU export date: 2026-09-09. Comparative reference only, not the legal status in Libya. The European Commission does not endorse this application.');
    return '';
  }

  /* لغة نص الإسناد نفسه: نصوص كندا/أستراليا إنجليزية بحكم الترخيص،
     أما إسناد الاتحاد الأوروبي فمترجم في القواميس ⇒ lang يتبع الواجهة
     وإلا عُلِّمت العربيةُ على أنها إنجليزية. */
  function packAttributionLang(k) {
    if (k === 'canada' || k === 'australia') return 'en';
    return (document.documentElement.lang || 'ar');
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
    /* the raw code stays visible — but only when the phrase does not already
     * name it. An explained code now reads «قرار 500: رمز REV», so adding
     * « (REV)» repeated it; an unknown code («قرار 500: رمز غير مفسَّر»)
     * still gets its raw value appended, which is where that note earns it. */
    const namesCode = !!d.raw && phrase.indexOf(d.raw) !== -1;
    if (/^st\.500\./.test(d.key) && d.raw && !namesCode) extra = ' (' + d.raw + ')';
    else if (showDetails && d.raw && d.raw !== phrase && !namesCode) extra = ' · ' + d.raw;
    if (d.rup) extra += ' · ' + t('st.epa.rup.note', 'استخدام مقيد (للمرخّصين فقط)');
    /* Status legend badge (شرح الرموز): a clickable info chip only for
     * Decree-500 statuses that have a verbatim explanation (Approved, REV,
     * RAR, REV*) — bound to the SOURCE KEY, not the raw value alone:
     * «Approved» is a shared vocabulary word (EU rows carry it too), and
     * showing Libya-500 decree prose on a European card is wrong
     * (1.1 — Aclonifen regression proven live in the diagnosis round). */
    const ek = (k === 'libya-500' && statusHasEntry(d.raw)) ? String(d.raw || '').trim() : null;
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
  /* ============================================================
   * Shared result components (src/cards.js) — one structure that
   * branches by language × mode × jurisdiction. render() below only
   * assembles the context and hands the rows over.
   * ============================================================ */
  /* تاريخ آخر تحقق لكل قاعدة. مصدر التواريخ ملف version.json (خريطة
   * dataCheck) — لأن القواعد نفسها في data/ لا تُلمس قواها، والبيانات
   * نفسها لا تحمل تاريخ تصديرها. أولوية meta.built إن وُجدت (EPA)، ثم
   * الخريطة. تُخزَّن الخريطة لحظة جلب version.json وتُعاد الرسمة فورها. */
  function dataVersionOf(key) {
    const d = DB[key];
    if (d && d.meta && d.meta.built) return d.meta.built;
    const map = window.__dataCheck;
    return (map && map[key]) || '';
  }
  function activeJurisdiction() {
    try { return localStorage.getItem('mustashar-jurisdiction') || 'libya-500'; }
    catch (e) { return 'libya-500'; }
  }
  function cardContext() {
    const lang = (document.documentElement.lang || 'ar');
    const mode = ($('#mode') && $('#mode').value === 'pro') ? 'pro' : 'farmer';
    return { lang: lang, mode: mode, jurisdiction: activeJurisdiction() };
  }
  const cards = window.Cards
    ? Cards.create({
        t: t, tf: tf, esc: esc,
        catTitle: catTitle, catAttribution: catAttribution,
        statusDisplay: statusDisplay, sourceLabel: sourceLabel,
        statusExplain: statusExplain, statusExplainFull: statusExplainFull,
        casApi: window.CasDissect,
        dataVersion: dataVersionOf,
        packAttribution: packAttribution,
        packAttributionLang: packAttributionLang,
        /* an installed pack becomes a first-class source: the jurisdiction
           picker and the source filter must see it too */
        sourceKeys: activeSources().map(function (x) { return x.key; })
      })
    : null;

  /* Jurisdiction picker: only the English farmer gets it — the Arabic
   * farmer always sees Libya first, and the professional sees every source. */
  function mountJurisdiction() {
    const host = $('#jurMount');
    if (!host || !cards) return;
    const lang = document.documentElement.lang || 'ar';
    if (lang !== 'en') { host.innerHTML = ''; return; }
    const ctx = cardContext();
    if (ctx.mode === 'pro') { host.innerHTML = ''; return; }
    host.innerHTML = cards.jurisdictionPicker(ctx);
    if (window.UIIcons) UIIcons.paint(host);
  }
  document.addEventListener('click', e => {
    const chip = e.target.closest && e.target.closest('.jur-chip');
    if (!chip) return;
    const key = chip.getAttribute('data-jur');
    if (!key) return;
    try { localStorage.setItem('mustashar-jurisdiction', key); } catch (err) {}
    mountJurisdiction();
    const q = ($('#query') ? $('#query').value.trim() : '');
    if (q) runSearch(q);                       /* re-run so the filter applies */
    else if (lastResults.length) render(lastResults, q);
  });

  /* ============================================================
   * Reading pace — SEMANTIC stages, not a fake percentage.
   * The engine emits keys (ocr.prep … ocr.rotate); the user sees three
   * named steps and which one is running. No number is ever invented:
   * no quality gate, no confidence threshold and no pass count changed —
   * this is DISPLAY ONLY.
   * ============================================================ */
  const OCR_STAGE_OF = {
    'ocr.prep': 1, 'ocr.init': 1, 'ocr.loading': 1,
    'ocr.pass': 2, 'ocr.roi': 2, 'ocr.rotate': 2,
    'ocr.done': 3
  };
  function setOcrStage(n) {
    const list = document.getElementById('ocrStages');
    if (!list) return;
    list.querySelectorAll('li').forEach(li => {
      const v = Number(li.getAttribute('data-stage')) || 0;
      li.classList.toggle('is-now', v === n);
      if (v === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.classList.toggle('is-done', v < n);
    });
  }
  function ocrStatusText(p) {
    if (!p) return '';
    if (p.statusKey) {
      setOcrStage(OCR_STAGE_OF[p.statusKey] || 1);
      return p.status || p.statusKey;
    }
    if (p.status === 'done') { setOcrStage(3); return t('ocr.done', 'اكتملت القراءة.'); }
    setOcrStage(2);
    return p.status || '';
  }

  /* ============================================================
   * Resilience — degradation ladders (never an invented result)
   * ============================================================ */
  function memoryRung() {
    if (window.OcrModule && OcrModule.memoryRung) return OcrModule.memoryRung();
    const gb = navigator.deviceMemory;
    if (typeof gb !== 'number' || !isFinite(gb) || gb <= 0) return { dim: 1280, rung: 'unknown', gb: null };
    if (gb <= 1) return { dim: 1280, rung: 'le1gb', gb: gb };
    if (gb < 4) return { dim: 1920, rung: '2gb', gb: gb };
    return { dim: 2560, rung: '4gb+', gb: gb };
  }
  /* Camera constraint ladder: 1080p → 720p → device default. A permission
   * or missing-device error stops the ladder immediately (re-asking would
   * only repeat it); the file input stays visible as the working path. */
  /* Safari/iOS rejects an `exact` constraint outright and is fussy about
   * 1080p on older devices, so every rung is an `ideal` the browser may
   * refuse to honour — and the ladder steps DOWN, never up: 720p is the
   * starting point because the OCR engine downscales to its own ceiling
   * anyway and a smaller live frame costs the phone less. */
  const CAMERA_LADDER = [
    { width: { ideal: 1280 }, height: { ideal: 720 } },
    { width: { ideal: 960 }, height: { ideal: 540 } },
    { width: { ideal: 640 }, height: { ideal: 480 } },
    {}
  ];
  function cameraErrorKey(e) {
    const n = (e && e.name) || '';
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'live.err.denied';
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'live.err.nodevice';
    if (n === 'NotReadableError' || n === 'TrackStartError') return 'live.err.busy';
    return 'live.err.generic';
  }
  function cameraErrorText(e) {
    return t(cameraErrorKey(e), '')
      + ' ' + t('live.err.fallback', 'يمكنك التقاط صورة من المعرض أو الكاميرا اليدوية بدلًا من ذلك.');
  }
  /* One low-memory retry: the first read runs at the device rung; if the
   * engine dies (a WASM allocation failure shows up as a thrown/rejected
   * read, or as an out-of-memory error), we retry ONCE at ~1000px. If that
   * fails too, the user gets a clear message and NO result at all. */
  async function recognizeWithRetry(blob, onProgress, opts) {
    const first = memoryRung();
    try {
      return { res: await OcrModule.recognize(blob, onProgress, opts), retried: false, dim: first.dim };
    } catch (err) {
      const oom = /memory|alloc|wasm|heap|RangeError|out of memory/i
        .test(String((err && err.message) || err) + ' ' + ((err && err.name) || ''));
      if (!oom) throw err;
      diagAdd({ at: Date.now(), outcome: 'ocr-oom', src: 'scan', dim: first.dim, rung: first.rung });
      onProgress({ statusKey: 'ocr.retry.small', status: t('ocr.retry.small', 'الذاكرة ضيقة — نعيد القراءة بأبعاد أصغر…') });
      return { res: await OcrModule.recognize(blob, onProgress, Object.assign({}, opts, { maxDim: 1000 })), retried: true, dim: 1000 };
    }
  }

  /* فيدباك 5 — قاعدة العرض الحاسمة: «الأعلى يبقى والأدنى يختفي».
   * تُطبَّق على القائمة المعروضة فقط: لا مساس بمنطق القبول، ولا بترتيب
   * المصادر تحت الغطاء، ولا بحذف أي صفّ من أي قاعدة.
   *
   * ما تحتمله القاعدة: متى — صفّ واحد مطابق الاسم تماماً
   * (decisive) من نفس القراءة. عندها:
   *   • سجلّات المادة الحاسمة نفسها من كل المصادر تبقى كلها ظاهرة بحالاتها؛
   *   • اقتراح مادة أخرى أضعف ومن القراءة نفسها يختفي؛
   *   • ما جاء من قراءة أخرى (منتج متعدّد المواد) يبقى — لأن الفاصل هو
   *     معرّف المادة لا رقم CAS وحده.
   * وما لا تحتمله: 80–99 بلا حاسم ⇒ لا يُخفى شيء إطلاقاً، ويبقى التحذير.
   * لذلك الإظهار لا يفصل ولا يقرّر: يخفي ما لم يقرأه أحد. */
  /* D30 (feedback 11): the owner's ruling — one card per SOURCE, and inside one
   * source only the TOP result for a given substance identity; the lower
   * duplicates of that identity are hidden at every match score. It runs here,
   * inside the ONE filter render() owns (FB5/D26), never as a second filter.
   *
   * identity = what the search engine matched on (search-core), NOT the CAS
   * alone (that would merge Captan, FB5-b) and NOT name similarity alone: a CAS
   * match keys on the CAS, a name match keys on the normalized name.
   *
   * CONFLICT GUARD (owner's red line, «ج»): if the rows of one identity in one
   * source disagree on the STATUS, they are NOT collapsed — a silent drop there
   * would change the legal reading (Acetic acid Approved vs Vinegar REV under
   * CAS 64-19-7 is a live example), so every one of them stays and the round
   * reports it. */
  function collapseSameSource(rows) {
    const norm = v => String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
    const identityOf = x => {
      const r = x.r || {};
      const field = String((x.s && x.s.field) || '');
      const casMatch = /^\d{2,7}-\d{2}-\d$/.test(field.trim());
      if (casMatch) return 'cas:' + field.trim();
      const type = String((x.s && x.s.type) || '');
      if (/CAS/.test(type)) {
      const first = String(r.cas || '').split(/[\n[\]]/)[0].trim();
      if (/^\d{2,7}-\d{2}-\d$/.test(first)) return 'cas:' + first;
      }
      return 'name:' + norm(r.name);
    };
    const groups = new Map();
    for (const x of rows) {
      const key = x.k + '\u0000' + identityOf(x);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(x);
    }
    const out = [];
    let conflicts = 0;
    let splitCodes = 0;
    for (const list of groups.values()) {
      if (list.length === 1) { out.push(list[0]); continue; }
      const statuses = new Set(list.map(x => String((x.r || {}).status || '').trim()));
      if (statuses.size > 1) { conflicts++; out.push(...list); continue; }
      /* D30-b (the owner's permanent control, PROOF from data/epa.json): a
       * generic name may become ONE card only when the source itself groups
       * it under ONE regulatory code — EPA carries pc_code on every row, and
       * «Aliphatic petroleum solvent» is nine rows all of pc_code 063503
       * (PRN 97-5 Appendix B, CAS «Numerous»). Two rows, one name, TWO codes
       * mean the source does NOT treat them as one substance (measured live:
       * «copper ethanolamine complex» 024409 / 024410), so they stay whole.
       * Name similarity ALONE never earns a collapse — that would be FB5-b
       * (Captan) all over again. */
      const pcs = [...new Set(list.map(x => String((x.r || {}).pc_code || '').trim()).filter(Boolean))];
      if (pcs.length > 1) { splitCodes++; out.push(...list); continue; }
      /* top score wins; a tie is decided by the declared source order, which
       * inside one source is the row's own order in the source file */
      const best = list.slice().sort((a, b) =>
      ((b.s && b.s.v) || 0) - ((a.s && a.s.v) || 0)
      || ((a.r || {}).row || 0) - ((b.r || {}).row || 0))[0];
      /* D30-b: hiding the lower duplicates must not hide the CHEMICAL
       * identities behind the name — the kept card carries every CAS number
       * the source lists under that name, read from the rows themselves, plus
       * the one code they share. */
      const casList = [];
      for (const x of list) {
        const c = String((x.r || {}).cas || '').split(/[\n[\]]/)[0].trim();
        if (c && casList.indexOf(c) === -1) casList.push(c);
      }
      out.push(casList.length > 1
        ? Object.assign({}, best, { merged: { cas: casList, pc: pcs[0] || '' } })
        : best);
    }
    if (conflicts) {
      try { console.warn('[D30] ' + conflicts + ' identity group(s) with conflicting statuses kept whole'); } catch (e) {}
    }
    if (splitCodes) {
      try { console.warn('[D30-b] ' + splitCodes + ' name group(s) with different regulatory codes kept whole'); } catch (e) {}
    }
    return out;

  }

  function collapseToDecisive(list) {
    const rows = Array.isArray(list) ? list : [];
    const decisive = rows.filter(x => x && x.s && x.s.decisive);
    if (!decisive.length) return rows;            /* 80-99: لا إخفاء إطلاقاً */
    /* معرّف المادة: الاسم + الرقم معاً. الرقم وحده لا يفصل — هناك أرقام
     * CAS مشتركة مسجَّلة، واسم واحد قد يحمل رقمَين في مصدرين. */
    const substance = x => String((x.r && x.r.name) || '').trim().toLowerCase()
      + '|' + String((x.r && x.r.cas) || '').trim();
    const via = x => String(x.via == null ? '' : x.via);
    const keepGroups = new Set(decisive.map(substance));
    /* مقطع من نفس القراءة ليس قراءة أخرى. الاسم المنشور على ثلاثة أسطر
     * GROUND / ALUMINIUM / SULPHATE يولّد مرشّحات: GROUND · ALUMINIUM ·
     * SULPHATE · ALUMINIUM SULPHATE. والمقطع ALUMINIUM المنفرد كان يولّد
     * اقتراح مادة أخرى (Aluminum 7429-90-5). الحكم بالكلمات: ما كلماتها داخل كلمات القراءة الحاسمة فهي نفسها. */
    const wordsOf = v => String(v).toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter(Boolean);
    const decisiveReads = [...new Set(decisive.map(via))].filter(Boolean).map(wordsOf);
    const sameRead = v => {
      /* بلا مصدر قراءة (البحث اليدوي) فالقراءة واحدة بالضرورة. */
      if (!v) return true;
      const w = wordsOf(v);
      return decisiveReads.some(d => w.every(t => d.indexOf(t) >= 0));
    };
    const kept = rows.filter(x => keepGroups.has(substance(x)) || !sameRead(via(x)));
    return collapseSameSource(kept);
  }

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
    /* فلترة وضع المزارع — نتائج البحث اليدوي فقط (إصلاح انتكاسة أ):
     * كان الفلتر يُطبَّق على كل استدعاءات render بما فيها عرض نتائج
     * المسح في شاشة المسح، فتختفي نتائج EPA/EU المسحوبة من الصورة في
     * وضع المزارع رغم أن القراءة نجحت — وبهذا يبدو المسح "بلا نتيجة"
     * والأتمتة معطّلة. القرار: البحث اليدوي (/#results) يبقى مفلترًا
     * في وضع المزارع (المواصفة ج1)، وعرض المسح (#scanResults) يعرض
     * القائمة الكاملة التي انتجها محرك القراءة في الوضعين — لا يُحجب
     * منه شيء، لأن حذف نتيجة مطابقة عن المستخدم شكل خطر سلامة. */
    /* 2026-09-28 — the scan view and the manual search disagreed: search was
     * filtered to Libya in farmer mode while the scan showed everything, so a
     * photo read looked "useless" next to a manual search of the same term.
     * One rule now, for both views: farmer mode = Libyan sources only.
     * The exact-ban banner and the prohibited strip below are computed from
     * the UNFILTERED list, so narrowing the list can never hide a ban. */
    const ctx = cardContext();
    const showDetails = ctx.mode === 'pro';
    /* فيدباك 5: القاعدة تعمل على ما سيُعرض. الحظر يبقى محسوباً من القائمة
     * الخام أدناه حتى لا يُخفي أي تحذير. */
    const displayResults = collapseToDecisive(results);
    const shownResults = cards
      ? cards.applyContext(displayResults, ctx)
      : (showDetails ? displayResults
                    : displayResults.filter(x => x.k === 'libya-248' || x.k === 'libya-500'));
    const prohibited = results.filter(x => x.k === 'libya-248');
    /* The notice is owed to the farmer whenever the DISPLAYED list is empty —
     * whether the engine matched nothing, or farmer-mode context removed every
     * row it matched (an EU/EPA-only substance). The second case used to
     * leave a bare box, and a bare box is the one thing that can be read as
     * "nothing to worry about"; the sentence below is what rules that out.
     * The engine's own result and every ban banner are computed from the
     * UNFILTERED list above and below, so this can only ever add a message. */
    if (!shownResults.length) {
      box.innerHTML = '<div class="notice warn"><b>' + t('results.none.t', 'لم يتم العثور على تطابق موثوق') + '</b><br>'
        + t('results.none.b', 'عدم العثور على المادة لا يعني أنها مسموحة.') + '</div>';
      return;
    }
    const disclaimerHtml = '<div class="disclaimer-strip" data-i18n="disclaimer.strip">'
      + t('disclaimer.strip', 'هذه الأداة مساندة وليست حكمًا قانونيًا — المرجع قرارات وزارة الزراعة والجهات الرسمية.')
      + '</div>';
    /* D50 — إخلاء المسؤولية: النص يُقرأ من data/reference.json حصراً
     * (meta.disclaimer) وباللغة الحالية للواجهة، ويُدرج مرة واحدة قرب
     * النتائج عبر render() نفسها — أي في وضعي البحث (#results) والمسح
     * (#scanResults) معاً. غياب المفتاح أو غياب المرجع ⇒ سلسلة فارغة أي
     * لا عنصر إطلاقاً: لا نص بديل، ولا مفتاح في src/i18n.js. */
    const refLang = (window.I18N && I18N.getLang) ? I18N.getLang() : 'ar';
    const refDisclaimer = (REF && REF.meta && REF.meta.disclaimer && REF.meta.disclaimer[refLang]) || '';
    const refDisclaimerHtml = refDisclaimer
      ? '<div class="disclaimer-strip" data-ref-disclaimer="' + refLang + '">' + esc(refDisclaimer) + '</div>'
      : '';
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
     /* فيدباك 5: الالتباس يُحسب من المعروض فقط. اقتراح أضعف
     * اختفى ⇒ لا داعي لترويسة تندب عن مادة لم تعد معروضة. والمادة
     * المقروءة فعلاً ما زالت في القائمة ⇒ الترويسة تبقى. */
    const amb = window.CasDissect ? CasDissect.ambiguity(displayResults) : null;
    const ambHtml = amb
      ? '<div class="ambgroup"><span data-icon="caution"></span><span>' + tf('results.ambiguous',
          'نتيجة ملتبسة: توجد مادة أخرى مشابهة برقم كيميائي مختلف ({a} {va}% مقابل {b} {vb}%). تحقق من الاسم الكامل قبل أي قرار.',
          { a: esc(String(amb.a.r.name || '').split('\n')[0]), va: amb.a.s.v,
            b: esc(String(amb.b.r.name || '').split('\n')[0]), vb: amb.b.s.v })
        + '</span></div>'
      : '';
    box.innerHTML = refDisclaimerHtml + disclaimerHtml + banHtml + ambHtml + (prohibited.length
      ? '<div class="prohibited"><span data-icon="ban"></span><span>' + tf('results.prohibited',
          'تحذير: هذه المادة مدرجة ضمن قائمة المبيدات المحظورة في ليبيا (قرار 248) — {name}',
          { name: esc(String(prohibited[0].r.name || '')).replace(/\n/g, ' · ') })
        + '</span></div>'
      : '')
      + (cards ? shownResults.map(function (x) { return cards.card(x, q, ctx); }).join('')
        : '');

    /* Paint inline icons inside freshly rendered result markup */
    if (window.UIIcons) UIIcons.paint(box);
    /* Legend tooltips: fill each category chip's title once, from the fixed
     * table (or the unknown-code hint). Pure attributes — no re-decoding. */
    box.querySelectorAll('.cat-code[data-cat]').forEach(el => {
      const title = catTitle(el.getAttribute('data-cat'), el.getAttribute('data-cat-src') || undefined);
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
    const list = activeSources();
    const sig = list.map(s => s.key + ':' + (DB[s.key] ? (DB[s.key].rows || []).length : 'x')).join('|');
    if (cachedSearch && sig === cachedIndexSig) { searchFn = cachedSearch; return; }
    /* a pack whose manifest says it carries no CAS numbers must not be
     * matched by name similarity — the engine needs to know that up front */
    const sources = list.map(s => ({
      key: s.key,
      rows: (DB[s.key] || {}).rows || null,
      noCas: !!(DB[s.key] && DB[s.key].meta && DB[s.key].meta.cas_present === 0)
    }));
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

  /* extracted so the jurisdiction picker can re-run the SAME search */
  function runSearch(q) {
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
    syncProTools();
  }
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    runSearch($('#query').value.trim());
  });

  const modeSel = $('#mode');
  function syncModeLabel() {
    const ml = $('#modeLabel');
    if (ml && modeSel) ml.textContent = modeSel.value === 'pro'
      ? t('mode.pro', 'المحترف') : t('mode.farmer', 'المزارع');
  }
  /* the professional report button appears in professional mode only, and
   * only once there is something to report. */
  function syncProTools() {
    const box = $('#proTools');
    if (!box) return;
    const pro = modeSel && modeSel.value === 'pro';
    box.hidden = !(pro && lastResults.length);
  }
  if (modeSel) modeSel.addEventListener('change', () => {
    syncModeLabel();
    syncProTools();
    /* the primary packs (Canada / Australia) install themselves the moment
     * the professional mode is entered — one event, no second path */
    document.dispatchEvent(new CustomEvent('modechange', { detail: { mode: modeSel.value } }));
    /* Re-render the current results so the detail level switches live
     * (farmer = simplified verdict, professional = full evidence).
     * أ3: the scan view now hosts its own results — re-render BOTH paths.
     * أ — إصلاح جانبي لفلتر المزارع: عندما تكون كل نتائج البحث اليدوي
     * مخفية بالفلتر (لا بطاقة ظاهرة في DOM) كان تبديل الوضع إلى
     * المحترف لا يعيد التصيير أبدًا (الشرط القديم يشترط وجود بطاقة
     * ظاهرة) فيبقى المستخدم أمام صفحة فارغة رغم وجود نتائج. الشرط
     * الآن على حالة النتائج المحفوظة لا على ظهور بطاقة في الشاشة. */
    if (lastResults.length) render(lastResults, $('#query').value.trim());
    if (lastScanResults.length) render(lastScanResults, '', '#scanResults');
    syncProTools();
  });
  $('#proReportBtn').addEventListener('click', () => {
    exportProReport($('#query').value.trim(), lastResults);
  });

  /* Switching the language re-renders everything the language touches:
   * the jurisdiction picker (English farmer only), the result cards, the
   * database chips and the professional tools row. Without this the user
   * kept reading cards in the previous language. */
  document.addEventListener('langchange', function () {
    wireAboutFeedback();
    mountJurisdiction();
    if (lastResults.length) render(lastResults, $('#query').value.trim());
    if (lastScanResults.length) render(lastScanResults, '', '#scanResults');
    renderDbStatus();
    syncProTools();
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
    refreshInstallCard();
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
    /* د — الإشعار كان يُكتب في #ocrMsg داخل شاشة المسح (مخفية عند الضغط من
     * الرئيسية حيث الزر) فبدت المشاركة صامتة كليًا: الإشعار الآن في
     * dbBanner المرئي في كل الشاشات، وكل استثناء يُسجَّل ولا يُبتلع. */
    const notify = msg => {
      const el = $('#dbBanner');
      if (el) {
        el.hidden = false;
        el.className = 'banner banner-info';
        el.setAttribute('data-share-toast', '1');
        el.textContent = msg;
      } else { ocrMsg.textContent = msg; }
      setTimeout(() => {
        if (el && el.hasAttribute('data-share-toast')) {
          el.hidden = true;
          el.removeAttribute('data-share-toast');
        } else if (ocrMsg.textContent === msg) { ocrMsg.textContent = ''; }
      }, 3500);
    };
    /* د — لا فشل صامت: أي استثناء في أي مسار يظهر للمستخدم فورًا */
    const fail = errName => notify(t('share.fail', 'تعذّرت المشاركة في هذا المتصفح.')
      + ' (' + errName + ')');
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; fail(e.name || 'share'); }
    }
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(url); notify(t('share.copied', 'نُسخ رابط التطبيق إلى الحافظة.')); return; }
      /* د — استثناء الحافظة يُحفظ ويُذكر في إشعار النتيجة النهائية */
      catch (e) { window.__shareClipErr = (e && e.name) || 'clipboard'; /* يمر إلى الملف */ }
    }
    try {
      const vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:' + t('brand.title', 'المستشار الزراعي') + '\r\nURL:' + url + '\r\nEND:VCARD\r\n';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
      a.download = 'al-mustashar.vcf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      notify(t('share.saved', 'تعذّرت المشاركة المباشرة — حُفظت بطاقة اتصال بالرابط، افتحها من جهازك.')
        + (window.__shareClipErr ? ' (' + window.__shareClipErr + ')' : ''));
      window.__shareClipErr = null;
    } catch (e) {
      fail((window.__shareClipErr ? window.__shareClipErr + ' + ' : '') + ((e && e.name) || 'vcard'));
      window.__shareClipErr = null;
    }
  });

  /* ================================================================
   * 2.1 — التثبيت الداخلي (PWA): زر يظهر فقط عند إطلاق المتصفح حدث
   * beforeinstallprompt (كروم/أندرويد). التقاط الحدث نفسه مبكر
   * ومخزَّن في window.__install من سكربت <head> حتى لا يُفوَّت أبدًا.
   * appinstalled → إخفاء الزر فورًا (بلا إعادة تحميل). لا رسائل
   * مزيفة: إن رفض المتصفح الوعد أظهرنا سبب الخطأ في السطر نفسه.
   * ================================================================ */
  const installCard = $('#installCard'), installBtn = $('#installBtn'),
        installNote = $('#installNote');
  function hideInstallCard() { if (installCard) installCard.hidden = true; }
  function refreshInstallCard() {
    if (!installCard || !installBtn) return;
    const st = window.__install;
    if (st && st.available) {
      installCard.hidden = false;
      installNote.textContent = '';
    } else {
      hideInstallCard();
    }
  }
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      const st = window.__install;
      const promptEvent = st ? st.pick() : null;
      if (!promptEvent) { hideInstallCard(); return; }   // already used
      installBtn.disabled = true;
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          hideInstallCard();                              // appinstalled hides it too
        } else {
          installBtn.disabled = false;
          if (installNote) installNote.textContent = t('install.dismissed', 'يمكنك التثبيت لاحقًا من هذا الزر.');
        }
      } catch (e) {
        installBtn.disabled = false;
        if (installNote) {
          installNote.textContent = t('install.fail', 'تعذّر بدء التثبيت في هذا المتصفح.') + ' (' + ((e && e.name) || 'install') + ')';
        }
      }
    });
  }
  /* 2.4 — optional local QR share: app URL only, rendered fully offline.
   * Fails visibly (no silent path) if the encoder/canvas is unavailable. */
  $('#qrBtn').addEventListener('click', () => {
    if (window.ShowQR) window.ShowQR.show();
    else {
      const b = $('#dbBanner');
      if (b) {
        b.hidden = false;
        b.className = 'banner banner-warn';
        b.textContent = t('qr.fail', 'تعذّر إنشاء الرمز في هذا المتصفح.');
        setTimeout(() => { b.hidden = true; }, 3500);
      }
    }
  });

  window.addEventListener('appinstalled', () => {
    hideInstallCard();
    refreshIosCard();          // the two-step card is meaningless once installed
    /* installed = the farmer intends to keep this on the phone: ask the
     * browser to protect the offline copy from automatic eviction */
    requestPersistence();
    const b = $('#dbBanner');
    if (b) {
      b.hidden = false;
      b.className = 'banner banner-info';
      b.setAttribute('data-share-toast', '1');
      b.textContent = t('install.done', 'تم تثبيت التطبيق على هذا الجهاز.');
      setTimeout(() => {
        if (b && b.hasAttribute('data-share-toast')) { b.hidden = true; b.removeAttribute('data-share-toast'); }
      }, 3500);
    }
  });
  document.addEventListener('langchange', refreshInstallCard);

  /* ---- iOS: the install card has no prompt event, only a UA + display-mode ---- */
  const iosCard = $('#iosInstallCard');
  function isStandalone() {
    return !!(navigator.standalone
      || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  }
  function isIOS() {
    const a = navigator.userAgent || '';
    /* iPadOS 13+ reports itself as a Mac; the touch-point count gives it away */
    return /iPad|iPhone|iPod/.test(a)
      || (/Macintosh/.test(a) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
  }
  function refreshIosCard() {
    if (!iosCard) return;
    /* never in a browser that can install itself, never when already installed */
    const st = window.__install;
    iosCard.hidden = !(isIOS() && !isStandalone() && !(st && st.available));
  }
  refreshIosCard();
  window.addEventListener('installavailable', refreshIosCard);
  window.addEventListener('appinstalled', refreshIosCard);
  /* 2.1 — the prompt usually fires AFTER boot (SW-ready, ~seconds in);
   * install-capture.js re-notifies via this bridge so the card shows then. */
  window.addEventListener('installavailable', refreshInstallCard);

  /* ================================================================
   * فيدباك إطلاق 1 — المتصفح الداخلي.
   * يصل المستخدم إلى الرابط من متصفّح تطبيق (فيسبوك/انستغرام/واتساب/
   * لاين وغيرها): الموقع يعمل، لكن التثبيت غير متاح ولا يظهر زرّ
   * التثبيت ولا بطاقة آيفون، فيظنّ المستخدم أن التطبيق معطوب. الفحص
   * نصّي على navigator.userAgent فقط: بلا مكتبة، وبلا طلب شبكة، وبلا
   * تخزين — القرار محلي بالكامل. البطاقة تقوده إلى الطريق الصحيح:
   * كروم على أندرويد، وسفاري ← المشاركة ← إضافة للشاشة على آيفون.
   * ================================================================ */
  const INAPP_RULES = [
    { re: /FBAN|FBAV|FB_IAB|FBIOS|Messenger/i, key: 'inapp.name.fb', fb: t('inapp.name.fb', 'فيسبوك') },
    { re: /Instagram/i, key: 'inapp.name.ig', fb: t('inapp.name.ig', 'انستغرام') },
    { re: /WhatsApp/i, key: 'inapp.name.wa', fb: t('inapp.name.wa', 'واتساب') },
    { re: /Line\//i, key: 'inapp.name.line', fb: t('inapp.name.line', 'لاين') },
    { re: /TikTok|Twitter|Telegram|MicroMessenger|Snapchat|LinkedInApp/i,
      key: 'inapp.name.other', fb: t('inapp.name.other', 'تطبيق آخر') }
  ];
  function detectInAppBrowser(ua) {
    const a = ua || navigator.userAgent || '';
    for (let i = 0; i < INAPP_RULES.length; i++) {
      if (INAPP_RULES[i].re.test(a)) return INAPP_RULES[i];
    }
    return null;
  }
  const inappCard = $('#inappNotice'), inappTitle = $('#inappTitle'),
        inappUrl = $('#inappUrl'), inappIos = $('#inappIos'),
        inappCopyBtn = $('#inappCopy'), inappNote = $('#inappNote');
  function inappLink() { return String((location && location.href) || '').split('#')[0]; }
  function renderInAppNotice() {
    if (!inappCard) return;
    const hit = detectInAppBrowser();
    if (!hit) { inappCard.hidden = true; return; }
    /* اسم المتصفح من القاموس، لا من نص مكتوب هنا */
    if (inappTitle) inappTitle.textContent = tf('inapp.lead', 'أنت داخل {app}', { app: t(hit.key, hit.fb) });
    if (inappUrl) inappUrl.textContent = inappLink();
    if (inappIos) inappIos.hidden = !isIOS();   /* آيفون: الطريق عبر سفاري */
    inappCard.hidden = false;
  }
  if (inappCopyBtn) {
    inappCopyBtn.addEventListener('click', async () => {
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(inappLink()); copied = true; } catch (e) { copied = false; }
      }
      if (copied) {
        /* الزر يختفي بعد نسخ ناجح فقط — لا نجاح بلا نسخ */
        inappCopyBtn.hidden = true;
        if (inappNote) { inappNote.hidden = false; inappNote.textContent = t('inapp.copied', 'نُسخ الرابط إلى الحافظة.'); }
        return;
      }
      /* بديل تحديد نصي: الزر يبقى ظاهراً ويُحدَّد الرابط ليُنسخ يدوياً */
      if (inappUrl) {
        try {
          const r = document.createRange();
          r.selectNodeContents(inappUrl);
          const sel = window.getSelection();
          if (sel) { sel.removeAllRanges(); sel.addRange(r); }
        } catch (e) { /* التحديد غير متاح في هذا المتصفح */ }
      }
      if (inappNote) { inappNote.hidden = false; inappNote.textContent = t('inapp.manual', 'تعذّر النسخ التلقائي — الرابط محدَّد أدناه، انسخه بالضغط المطوّل عليه.'); }
    });
  }
  renderInAppNotice();
  document.addEventListener('langchange', renderInAppNotice);

  /* ================================================================
   * 2.2 — توحيد مداخل الكاميرا: مسار واحد لالتقاط الملصق. كانت هناك
   * ثلاثة مداخل متداخلة (اختصار المعرض في الرئيسية + #cameraBtn +
   * #galleryBtn مع ملفّي input مختلفين). الآن: بطاقة «تصوير الملصق»
   * تدخل الكاميرا الحية (أو ملف capture=environment عند عدم الدعم)،
   * وبطاقة المعرض (index.html) هي المدخل الوحيد لاختيار صورة. كلا
   * المدخلين يمران عبر camera.change/gallery.change نفسهما → runOcr.
   * ================================================================ */

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

  /* iOS freezes a backgrounded tab: when the farmer comes back from a call
   * the OCR worker can be dead while the page is alive. Rebuilding it here is
   * silent and cheap — no message, no extra step for the farmer. */
  window.addEventListener('pageshow', ev => {
    if (!ev.persisted) return;
    try {
      /* the barcode layer builds a fresh worker per detection, so only the
         * OCR engine (a long-lived worker) can be dead here */
      if (typeof OcrModule !== 'undefined' && OcrModule.resetEngine) OcrModule.resetEngine();
    } catch (e) { /* the next scan rebuilds them anyway */ }
    refreshIosCard();
  });

  /* 2.2 — retake: clears results and re-opens the same capture flow */
  function showRetake(on) { const b = $('#retakeBtn'); if (b) b.hidden = !on; }

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
    showRetake(false);
    clearScanResults();
  }
  $('#cancelImageBtn').addEventListener('click', resetScanUI);
  /* 2.2 — retake = full reset, then straight back into the live camera
   * (or the file capture fallback where getUserMedia is unsupported). */
  $('#retakeBtn').addEventListener('click', () => {
    resetScanUI();
    if (liveVideo && liveSupported()) startLive();
    else camera.click();
  });

  /* 2.2 — single label-photo entry: live camera when supported, else the
   * capture=environment file input (same fallback as before, one handler). */
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
  /* 3.0a — live sharpness gauge: a calibrated RELATIVE score mapped onto
   * the SAME thresholds cheapPass already uses (lap≥14, edges≥2%). Green
   * ≈ «this frame would pass the cheap gate»; amber = close; red = far.
   * Advisory only — it never blocks a capture, and the displayed % is a
   * heuristic, not an OCR-accuracy guarantee. DOM writes throttled to
   * ~5 Hz (the probe runs at 2 Hz per ب4, so effectively every tick). */
  let liveSharpLastRender = 0;
  function liveSharpRender(m, pass) {
    const now = Date.now();
    if (now - liveSharpLastRender < 200) return;
    liveSharpLastRender = now;
    const el = document.getElementById('liveSharp');
    if (!el) return;
    /* map: lap 14 + edges 2% ⇒ 100% (linear, floored at 0, capped) */
    const score = Math.max(0, Math.min(100,
      Math.round(((m.lap / 14) * 0.7 + (m.edges / 0.02) * 0.3) * 100)));
    const cls = pass ? 'lv-green' : (m.lap >= 9 && m.edges >= 0.012 ? 'lv-amber' : 'lv-red');
    el.classList.remove('lv-red', 'lv-amber', 'lv-green');
    el.classList.add(cls);
    const v = document.getElementById('liveSharpVal');
    if (v) v.textContent = score + '%';
  }
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
      liveSharpRender(m, pass);
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

  /* 3.1 — silent multi-frame vote, CAMERA LIVE ONLY.
   * A read that passed every existing gate does not end the scan on the
   * spot: the camera keeps running for a short window and up to
   * VOTE_MAX_READS more frames are read, then ScanLive.vote() picks the
   * reading the frames agree on. Nothing is shown, no control appears,
   * and the static gallery path never calls this — the farmer’s single
   * capture-and-point flow is unchanged.
   * The vote reorders ALREADY-ACCEPTED results; it can never create one
   * and never touches MIN_CONFIDENCE or any other threshold. */
  async function collectVoteFrames(firstRes, mySeq) {
    const SL = window.ScanLive;
    if (!SL || typeof SL.vote !== 'function') return firstRes;
    const reads = [{ res: firstRes, at: Date.now() }];
    const deadline = Date.now() + SL.VOTE_WINDOW_MS;
    while (reads.length < SL.VOTE_MAX_READS && Date.now() < deadline) {
      if (!liveStream || !liveVideo || !liveVideo.videoWidth) break;
      if (livePassSeq !== mySeq) break;              // superseded: stop voting
      const snap = liveROI();
      if (snap && snap.roi) {
        try {
          const blob = await window.ScanLive.canvasToBlob(snap.roi, 0.92);
          const { res } = await recognizeWithRetry(blob, null,
            { search: searchFn, messages: {}, uiLang: document.documentElement.lang || 'en' });
          /* only reads that already passed the existing gates may vote —
           * a rejected or weak read has no say, exactly as before. */
          if (res && !res.rejected && !res.blockedBy
            && String(res.text || '').replace(/\s/g, '').length >= 6) {
            reads.push({ res, at: Date.now() });
          }
        } catch (e) { /* a failed extra frame simply does not vote */ }
      }
      await new Promise(r => setTimeout(r, 260));
    }
    const v = SL.vote(reads);
    try {
      diagAdd({ at: Date.now(), outcome: 'frame-vote', src: 'live',
        reads: reads.length,
        votes: v.ranked.map(r => r.votes).join('|'),
        changed: !!(v.winner && v.winner.res !== firstRes) });
    } catch (e) {}
    return (v.winner && v.winner.res) || firstRes;
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
      /* 3.5 — same cheap barcode probe for live captures (advisory chip). */
      try {
        const bc = await window.BarcodeModule.detect(snap.roi);
        if (bc && bc.codes.length) showBarcodeChip(bc);
      } catch (e) { /* advisory only */ }
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
      const { res, retried, dim } = await recognizeWithRetry(blob, p => {
        if (livePassSeq !== mySeq || !p) return;
        ocrMsg.textContent = ocrStatusText(p);
      }, { search: searchFn, messages: msgs, uiLang: document.documentElement.lang || 'en' });
      const ms = Math.round(performance.now() - msStart);
      if (retried) diagAdd({ at: Date.now(), outcome: 'ocr-retry', src: 'live', ms, dim: dim });
      const stale = livePassSeq !== mySeq || scanSeq !== myGen || scanSeq !== activeScanSeq;
      if (stale) { diagAdd({ at: Date.now(), outcome: 'superseded', src: 'live', ms }); return; }
      if (res.rejected) {
        showReadFailure();
        diagAdd({ at: Date.now(), outcome: 'rejected', src: 'live', ms, reason: res.rejected.lowConfidence ? res.rejected.conf : res.rejected.ratio });
        return;
      }
      if (res.blockedBy === 'sharp') {
        /* 3.2 — the image reads as too soft. One short sentence, no
           numbers, no settings: the farmer only ever points the camera.
           While the gate is advisory (OcrModule TUNING sharpGateFinal
           is false) the manual-entry field is opened too, so a threshold
           that is still being calibrated can never become a dead end
           with a real photo on screen. The measured value goes to the
           diagnostics log — that log is the field campaign's
           recalibration input. */
        showReadFailure();
        diagAdd({ at: Date.now(), outcome: 'sharp', src: 'live', ms, v: res.sharpness,
                  advisory: !!res.advisory,
                  gate: (window.OcrModule && window.OcrModule.getTuning)
                    ? window.OcrModule.getTuning().sharpGate : null });
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
      /* 3.1 — vote between the frames that already passed, silently */
      const voted = await collectVoteFrames(res, mySeq);
      if (livePassSeq !== mySeq || scanSeq !== myGen || scanSeq !== activeScanSeq) {
        diagAdd({ at: Date.now(), outcome: 'superseded', src: 'live', ms }); return;
      }
      stopLive(false);
      diagAdd({ at: Date.now(), outcome: 'scanned', src: 'live', ms, conf: voted.confidence, kind: kind });
      proceedWithScan(voted, []);
      ocrMsg.textContent = t('live.result', 'اكتملت القراءة الحية — هذه النتائج من الإطار الملتقط.');
    } catch (e) {
      const cancelled = e && String(e.message || e).indexOf('ocr.cancelled') === 0;
      if (livePassSeq === mySeq && scanSeq === activeScanSeq) {
        if (!cancelled) showReadFailure();
        else ocrMsg.textContent = t('ocr.cancelled', 'أُلغي المسح.');
        diagAdd({ at: Date.now(), outcome: cancelled ? 'cancelled' : 'error', src: 'live',
          name: (e && e.name) || 'unknown', message: String((e && e.message) || e).slice(0, 120) });
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
    let camErr = null, got = false;
    for (let i = 0; i < CAMERA_LADDER.length; i++) {
      try {
        liveStream = await navigator.mediaDevices.getUserMedia({
          video: Object.assign({ facingMode: 'environment' }, CAMERA_LADDER[i]), audio: false
        });
        got = true;
        break;
      } catch (e) {
        camErr = e;
        /* permission / no device / camera busy: another try cannot help */
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError'
          || e.name === 'NotFoundError' || e.name === 'NotReadableError')) break;
      }
    }
    if (!got) {
      /* iOS Safari refuses getUserMedia outside a user gesture, in Low Power
       * Mode, or when the user picked "ask next time". The farmer must NOT read
       * an error: the SAME single capture path opens the system camera, and if
       * that works the farmer only ever sees "the photo was taken". The
       * technical reason goes to the diagnostics log, not to the screen. */
      liveStream = null;
      diagAdd({ at: Date.now(), outcome: 'camera-error', src: 'live', name: (camErr && camErr.name) || 'unknown', fallback: 'capture-input' });
      $('#galleryBtn').hidden = false;   /* the manual path is always available */
      if (camera) { try { camera.value = ''; camera.click(); } catch (e) {} }
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
    showRetake(false);         // 2.2: a new capture session is starting
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
      resetScanUI();               // 2.2: manual stop = ready state; the camera card is the entry (retake hidden)
    } else {
      showRetake(true);            // 2.2: early success — results stay, retake offered
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
    $('#ocrConf').textContent = '';
    hideBarcodeChip();
  }

  /* فيدباك 3 — بوابة «لم أستطع القراءة».
   * جملة واحدة للمزارع: ماذا يفعل الآن، بالترتيب الذي ينجح في الحقل
   * (إضاءة، ثم قرب، ثم كتابة الاسم). السبب المحدد — رفض لنسبة الحروف،
   * أو رفض لضعف الثقة، أو blur، أو خطأ في المحرك — يبقى في سجل
   * التشخيص الذي هو مدخل حملة الحقل، ولا يظهر في جملة الشاشة. هذا تغذية
   * راجعة فقط: لا عتبة تُرفع ولا تمريرة تُفرض في هذا الموضع. */
  function showReadFailure() {
    ocrMsg.textContent = t('ocr.read.fail', 'لم نستطع قراءة الملصق بوضوح — جرّب: إضاءة أفضل، أو تقريب أكبر من العنوان، أو البحث اليدوي باسم المادة.');
    $('#ocrActions').hidden = false;
  }
  /* الطريق اليدوي بزر واحد: تُغلق الكاميرا إن كانت تعمل، ثم ينتقل إلى
   * البحث ويضع المؤشر في الحقل — بلا خطوة وسطى وبلا فتح لوحة جديدة. */
  const ocrManualBtn = $('#ocrManualBtn');
  if (ocrManualBtn) {
    ocrManualBtn.addEventListener('click', () => {
      if (ocrBusy) return;                    /* قراءة جارية: لا تُختطف */
      if (liveStream) stopLive(false);
      location.hash = '#/search';
      setTimeout(() => { const q = $('#query'); if (q) { try { q.focus(); } catch (e) {} } }, 60);
    });
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

  /* أ — test/automation seam: exposes the exact downstream automation path
   * (searchCandidates → showOcrResults) the way the live scan pipeline calls
   * it after a successful recognize(). Production flow never uses these;
   * tests/scan-automation.test.mjs pins the restored automation through them
   * (the f1058dd farmer-filter relapse broke exactly this path). */
  window.runScanPipeline = function (q) {
    const cas = (typeof OcrModule !== 'undefined' && OcrModule.extractCAS) ? OcrModule.extractCAS(q) : [];
    const cands = (typeof OcrModule !== 'undefined' && OcrModule.extractCandidates) ? OcrModule.extractCandidates(q) : [];
    return showOcrResults(searchCandidates(cas, cands));
  };
  window.showOcrResults = showOcrResults;
  window.searchCandidates = searchCandidates;

  /* 3.5 — barcode signal chip: read-only, textContent-only rendering
   * (CSP-safe, XSS-safe). A code is a lead the user inspects, never a
   * decision; «إزالة» clears it. No data leaves the device. */
  let barcodeChipTimer = null;
  function showBarcodeChip(bc) {
    const box = document.getElementById('barcodeChip');
    if (!box) return;
    const first = bc.codes.find(c => c.safe) || bc.codes[0];
    if (!first) return;
    box.hidden = false;
    const txt = document.getElementById('barcodeChipText');
    if (txt) {
      txt.textContent = (first.gs1
        ? 'GS1 · ' + first.text
        : first.format + ' · ' + first.text) + '  (' + [bc.engine, bc.ms + 'ms'].join(' · ') + ')';
    }
    const meta = document.getElementById('barcodeChipMeta');
    if (meta) {
      const chipLang = document.documentElement.lang || 'en';
      meta.textContent = (chipLang === 'ar')
        ? t('scan.barcode.found', 'رمز مُكتشف — إشارة للتفقد، ليست نتيجة.')
        : t('scan.barcode.found', 'Code detected — a hint to inspect, not a result.');
    }
    if (barcodeChipTimer) clearTimeout(barcodeChipTimer);
    barcodeChipTimer = setTimeout(hideBarcodeChip, 12000);
  }
  function hideBarcodeChip() {
    const box = document.getElementById('barcodeChip');
    if (box) box.hidden = true;
    if (barcodeChipTimer) { clearTimeout(barcodeChipTimer); barcodeChipTimer = null; }
  }
  $('#barcodeChipClear').addEventListener('click', hideBarcodeChip);

  /* Run candidate text through the existing search and merge results. */
  function searchCandidates(casList, candList) {
    rebuildSearch();
    if (!searchFn || !searchFn.sources.length) return [];
    const rank = { 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 };
    /* Keep the BEST score per row: a weak fuzzy hit from a candidate like
     * "Bifenthrin 7.9" must never mask the exact 100% match for the same
     * row that another candidate ("Bifenthrin") already produced. */
    const byRow = new Map();
    /* `via` = القراءة التي أنتجت الصفّ. قاعدة العرض (أعلى يبقى/أدنى يختفي)
     * تفصل بالقراءة لا بالنسبة: اقتراح أضعف من نفس القراءة يختفي، وما جاء
     * من قراءة أخرى (منتج متعدّد المواد) يبقى ظاهراً. */
    const pushAll = (list, via) => (list || []).forEach(x => {
      const prev = byRow.get(x.r);
      if (!prev || x.s.v > prev.s.v) { x.via = via; byRow.set(x.r, x); }
    });
    for (const cas of casList) pushAll(searchFn(cas, true), 'CAS:' + cas);      // CAS exact (100%)
    for (const cand of candList) pushAll(searchFn(cand, false), String(cand)); // same 80% rule
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
  /* ============================================================
   * Safety net — window error / unhandledrejection
   * Every uncaught error goes into the SAME diagnostics log the field
   * export already reads, and the user gets ONE non-blocking banner
   * (never a modal, never a reload without consent). If three errors
   * land inside ten seconds of each other the banner offers a SAFE
   * reload instead of leaving a broken screen.
   * ============================================================ */
  const errLog = [];
  function safetyNet(kind, message, source) {
    const entry = { at: Date.now(), outcome: 'safety-net', kind: kind,
      message: String(message || '').slice(0, 200) };
    if (source) entry.source = String(source).slice(0, 200);
    errLog.push(entry);
    diagAdd(entry);
    const now = Date.now();
    const burst = errLog.filter(function (e) { return now - e.at < 10000; }).length;
    showSafetyBanner(burst >= 3);
  }
  function showSafetyBanner(offerReload, custom) {
    const b = $('#safetyBanner');
    if (!b) return;
    b.textContent = '';
    const txt = document.createElement('span');
    txt.textContent = custom || (offerReload
      ? t('safety.net', 'حدث خطأ غير متوقع أكثر من مرة — سُجل في سجل التشخيص. يُنصح بإعادة تحميل الصفحة بأمان.')
      : t('safety.net.once', 'حدث خطأ غير متوقع — سُجل في سجل التشخيص.'));
    b.appendChild(txt);
    if (custom) { b.hidden = false; return; }   /* storage hint: no reload button */
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-outline';
    btn.textContent = t('safety.reload', 'إعادة تحميل آمنة');
    btn.addEventListener('click', function () {
      /* SAFE reload: databases (IndexedDB) and prepared caches survive; only
       * in-memory state is discarded. No data is deleted. */
      try { location.reload(); } catch (e) {}
    });
    b.appendChild(btn);
    b.hidden = false;
  }
  window.addEventListener('error', function (e) {
    safetyNet('error', (e && e.message) || 'error', (e && e.filename) + ':' + (e && e.lineno));
  });
  window.addEventListener('unhandledrejection', function (e) {
    const r = e && e.reason;
    safetyNet('unhandledrejection', (r && (r.message || r)) || 'rejection');
  });

  /* ============================================================
   * Professional report (professional mode only) — a real HTML FILE
   * the user keeps: substance name, CAS (corrected / raw / source), one
   * row per source with ITS data version, ITS status code and what that
   * code means in that source, the match type, the jurisdiction
   * disclaimer, a timestamp and the app version.
   * It is generated from the results the app already holds — it never
   * re-searches, never invents a status and never leaves the device.
   * ============================================================ */
  function reportFileName(q) {
    const slug = String(q || 'report').trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'report';
    return 'mustashar-report-' + slug + '-' + new Date().toISOString().slice(0, 10) + '.html';
  }
  function exportProReport(q, results) {
    try {
      const rows = (results || []).slice().sort(function (a, b) { return b.s.v - a.s.v; });
      if (!rows.length) {
        ocrMsg.textContent = t('pro.report.empty', 'لا توجد نتائج لتصديرها — ابحث عن المادة أولًا.');
        setTimeout(function () { if (ocrMsg.textContent === t('pro.report.empty', '')) ocrMsg.textContent = ''; }, 3000);
        return;
      }
      const escX = s => String(s === undefined || s === null ? '' : s).replace(/[&<>'"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[m]));
      const CD = window.CasDissect;
      const head = rows[0].r;
      const corrected = CD && CD.casDisplayCorrected ? CD.casDisplayCorrected(head) : '';
      const raw = CD && CD.casDisplayRaw ? CD.casDisplayRaw(head) : String(head.cas || '');
      const srcKey = CD && CD.casSourceKey ? CD.casSourceKey(head) : '';
      const appVersion = window.__appVersion || '';
      /* built synchronously so the printed file is complete when it opens */
      const body = rows.map(function (x) {
        const sd = statusDisplay(x.r, x.k, true);
        const m = cards ? cards.matchKind(x, q) : { key: 'mt.partial' };
        const v = dataVersionOf(x.k) || '';
        return '<tr>'
          + '<td>' + escX(sourceLabel(x.k)) + '</td>'
          + '<td>' + escX(v || '—') + '</td>'
          + '<td>' + escX(sd.text) + '</td>'
          + '<td>' + escX(String(x.r.status_raw || sd.raw || '')) + '</td>'
          + '<td>' + escX(t(m.key, 'تطابق جزئي — مرشح')) + '</td>'
          + '<td>' + escX(CD ? CD.casOf(x) : String(x.r.cas || '')) + '</td>'
          + '</tr>';
      }).join('');
      const html = '<!DOCTYPE html><html lang="' + escX(document.documentElement.lang || 'ar') + '" dir="'
        + (document.documentElement.dir || 'rtl') + '"><head><meta charset="utf-8">'
        + '<title>' + escX(t('pro.report.title', 'تقرير المادة')) + '</title><style>'
        + 'body{font:15px/1.7 "Segoe UI",Tahoma,system-ui,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#1a1a1a}'
        + 'h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:12px 0}'
        + 'th,td{border:1px solid #ccc;padding:6px 8px;text-align:start;font-size:14px;vertical-align:top}'
        + 'th{background:#f2f2f2}.k{font-weight:700;color:#444;margin-inline-end:6px}'
        + '.disclaimer{margin-top:14px;padding:10px;border:1px solid #999;background:#fafafa}'
        + '</style></head><body>'
        + '<h1>' + escX(t('pro.report.title', 'تقرير المادة')) + '</h1>'
        + '<div><span class="k">' + escX(t('pro.report.query', 'المادة')) + ':</span> ' + escX(q) + '</div>'
        + '<div><span class="k">' + escX(t('pro.report.name', 'الاسم')) + ':</span> ' + escX(head.name || '') + '</div>'
        + '<div><span class="k">' + escX(t('cas.label', 'CAS')) + ':</span> ' + escX(corrected || raw)
        + (corrected ? ' <s>' + escX(raw) + '</s> (' + escX(t('cas.source.' + srcKey, srcKey)) + ')' : '') + '</div>'
        + '<table><thead><tr>'
        + '<th>' + escX(t('pro.report.col.source', 'المصدر')) + '</th>'
        + '<th>' + escX(t('pro.report.col.version', 'نسخة البيانات')) + '</th>'
        + '<th>' + escX(t('pro.report.col.status', 'رمز الحالة')) + '</th>'
        + '<th>' + escX(t('pro.report.col.meaning', 'معناه في ذاك المصدر')) + '</th>'
        + '<th>' + escX(t('pro.report.col.match', 'نوع المطابقة')) + '</th>'
        + '<th>' + escX(t('pro.report.col.cas', 'CAS')) + '</th>'
        + '</tr></thead><tbody>' + body + '</tbody></table>'
        + '<p class="disclaimer">' + escX(t('pro.report.disclaimer',
          'الولاية القانونية تختلف بين المصادر — هذا التقرير توثيق للمصدر ولا يُعد حكمًا قانونيًا.')) + '</p>'
        + '<div><span class="k">' + escX(t('pro.report.time', 'الطابع الزمني')) + ':</span> '
        + escX(new Date().toString()) + '</div>'
        + '<div><span class="k">' + escX(t('pro.report.app', 'إصدار التطبيق')) + ':</span> ' + escX(appVersion) + '</div>'
        + '</body></html>';
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = reportFileName(q);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      diagAdd({ at: Date.now(), outcome: 'report', version: appVersion, q: String(q), rows: rows.length });
      ocrMsg.textContent = t('pro.report.done', 'تم إنشاء التقرير — ابحث عن «التنزيلات» في الهاتف.');
    } catch (e) {
      ocrMsg.textContent = t('pro.report.fail', 'تعذّر إنشاء التقرير.');
    }
  }

  function diagExport() {
    try {
      const list = JSON.parse(localStorage.getItem(DIAG_KEY) || '[]');
      /* ج — تصدير مقروء: كان JSON خامًا بمفاتيح برمجية؛ صار تقرير HTML عربيًا
       * بعناوين واضحة وحقلًا واحدًا في كل سطر (بلا تقنية، للمزارع/المهندس).
       * كل نص عبر t() ×4 قواميس؛ يبقى ملفًا محليًا من إجراء يدوي حصرًا —
       * لا إرسال لأي جهة. */
      const escX = s => String(s ?? '').replace(/[&<>'"]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[m]));
      const label = (ar, v) => (v === undefined || v === null || v === '') ? ''
        : '<div><span class="k">' + escX(ar) + ':</span> ' + escX(v) + '</div>';
      const OUTCOME = {
        scanned: 'diag.outcome.scanned', rejected: 'diag.outcome.rejected',
        weak: 'diag.outcome.weak', superseded: 'diag.outcome.superseded',
        cancelled: 'diag.outcome.cancelled', error: 'diag.outcome.error'
      };
      const rows = list.length ? list.map((e, i) => {
        const oKey = OUTCOME[e.outcome] || null;
        const outcome = oKey ? t(oKey, '') : escX(String(e.outcome || '?'));
        const when = e.at ? new Date(e.at).toLocaleString('ar') : '?';
        const srcVal = e.src === 'live' ? t('diag.src.live', '')
          : (e.src ? t('diag.src.photo', '') : '');
        const kindVal = e.kind === 'auto' ? t('diag.kind.auto', '')
          : (e.kind === 'capture' ? t('diag.kind.capture', '') : '');
        return '<details open class="diag-entry">'
          + '<summary>' + tf('diag.attempt', 'محاولة {n}', { n: i + 1 }) + ' — ' + outcome + ' · ' + escX(when) + '</summary>'
          + label(t('diag.field.outcome', ''), outcome)
          + (e.reason !== undefined && e.reason !== null && e.reason !== ''
            ? label(t('diag.field.reason', ''), e.reason) : '')
          + label(t('diag.field.ms', ''), e.ms !== undefined ? e.ms + ' ' + t('diag.ms.unit', '') : undefined)
          + label(t('diag.field.conf', ''), e.conf !== undefined ? Math.round(e.conf * 100) + '%' : undefined)
          + label(t('diag.field.src', ''), srcVal)
          + label(t('diag.field.kind', ''), kindVal)
          + label(t('diag.field.variant', ''), e.variant)
          + '</details>';
      }).join('') : '<p class="diag-empty">' + t('diag.file.empty', '') + '</p>';
      const html = '<!DOCTYPE html>'
        + '<html lang="ar" dir="rtl"><head><meta charset="utf-8">'
        + '<title>' + t('diag.title', '') + '</title><style>'
        + 'body{font:15px/1.7 system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1a1a1a}'
        + 'h1{font-size:20px} .diag-entry{border:1px solid #ddd;border-radius:10px;padding:10px 14px;margin:10px 0;background:#fafafa}'
        + 'summary{font-weight:700;cursor:pointer}'
        + '.k{font-weight:700;color:#555;margin-inline-end:6px}'
        + '</style></head><body>'
        + '<h1>' + t('diag.title', '') + '</h1>'
        + '<p>' + tf('diag.created', '', { when: new Date().toLocaleString('ar'), n: list.length }) + '</p>'
        + '<p>' + t('diag.note', '') + '</p>'
        + rows + '</body></html>';
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mustashar-diagnostics-' + new Date().toISOString().slice(0, 10) + '.html';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      if (!list.length) {
        ocrMsg.textContent = t('diag.empty', 'لا توجد محاولات مسح مسجلة بعد — سجّل مسحًا أولًا ثم صدّر السجل.');
        setTimeout(() => { if (ocrMsg.textContent === t('diag.empty', '')) ocrMsg.textContent = ''; }, 3000);
      }
    } catch (e) {
      /* قاعدة الجولة: لا فشل صامت في أي مسار */
      try { ocrMsg.textContent = t('diag.fail', 'تعذّر تصدير سجل التشخيص.'); } catch (e2) {}
    }
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
  /* 3.0b — results WITH the read confidence: the text stays editable and
   * «بحث من النص» re-runs it (already the case); the confidence badge is
   * pure display (no decision path reads it). */
  function proceedWithScan(res, tips) {
    const merged = searchCandidates(res.cas, res.candidates);
    showOcrResults(merged);
    $('#ocrText').value = res.text || '';
    $('#ocrConf').textContent = (res.confidence !== null && res.confidence !== undefined)
      ? tf('scan.confidence', 'درجة الثقة: {n}%', { n: res.confidence })
      : '';
    $('#ocrActions').hidden = false;
    if (merged.length) {
      ocrMsg.textContent = tips && tips.length
        ? t('ocr.tips', 'ملاحظات على الصورة:') + ' ' + tips.map(k => t(k, k)).join(' · ')
        : t('ocr.auto', 'اكتملت القراءة — هذه نتائج المطابقة تلقائيًا.');
    }
  }
  $('#diagBtn').addEventListener('click', diagExport);

  async function runOcr(file) {
    if (ocrBusy || typeof OcrModule === 'undefined') {
      /* 2.3 — لا توقف صامت: رسالة واضحة دائمًا. وإن كان هناك مصدر جديد
       * مرحَّل (scanSeq تقدّم عن القراءة الجارية) نُلغي القراءة القديمة
       * وننتظر تراجعها ثم نمضي بالقراءة الجديدة — تبديل الصورة أثناء
       * المسح يعمل بدل أن يُهمل بصمت. */
      if (ocrBusy && typeof OcrModule !== 'undefined' && scanSeq !== activeScanSeq) {
        OcrModule.cancelCurrent();
        for (let i = 0; i < 100 && ocrBusy; i++) await new Promise(r => setTimeout(r, 50));
      }
      if (ocrBusy || typeof OcrModule === 'undefined') {
        if (ocrBusy && ocrMsg) ocrMsg.textContent = t('ocr.busy', 'مسح جارٍ — انتظر اكتمال العملية أو ألغِها ثم حاول مجددًا.');
        return;
      }
    }
    ocrBusy = true;
    activeScanSeq = scanSeq;   // this run belongs to the current query-source
    $('#cancelOcrBtn').hidden = false;
    showRetake(false);         // 2.2: retake appears only when a read finishes
    ocrMsg.textContent = t('ocr.prep', 'جارٍ تجهيز الصورة…');
    setOcrStage(1);
    /* 3.5 — barcode FIRST (signal, not a verdict): a cheap attempt before
     * the heavy OCR ladder; its result is shown as a chip the user can
     * inspect — it never creates or filters results by itself. Zero
     * network: BarcodeDetector is local, the zxing fallback runs on the
     * vendored wasm inside a Blob worker. */
    try {
      const bc = await window.BarcodeModule.detect(file);
      if (bc && bc.codes.length) showBarcodeChip(bc);
    } catch (e) { /* never block the scan on the barcode layer */ }
    const t0 = performance.now();
    const tips = await probeImage(file);
    if (scanSeq !== activeScanSeq) return;   // source changed while probing
    /* declared out here so the finally block below can log a low-memory retry */
    let retried = false, dim = 0, res;
    try {
      rebuildSearch();   // ensure the index is current before DB-aware OCR scoring
      const msgs = {};
      for (const k of ['ocr.prep','ocr.init','ocr.loading','ocr.pass','ocr.roi','ocr.rotate','ocr.done','ocr.rejected.mixed','ocr.rejected.conf']) msgs[k] = t(k, k);
      const out = await recognizeWithRetry(file, p => {
        if (!p) return;
        ocrMsg.textContent = ocrStatusText(p);
      }, { search: searchFn, messages: msgs, uiLang: document.documentElement.lang || 'en' });   // DB-aware scoring + i18n + 3.4 OCR lang
      res = out.res; retried = out.retried; dim = out.dim;
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
        $('#ocrText').value = '';
        showReadFailure();
        diagAdd({ at: Date.now(), outcome: 'rejected', ms, passes: res.passes,
                  reason: res.rejected.lowConfidence ? res.rejected.conf : res.rejected.ratio });
        return;
      }
      if (res.blockedBy === 'sharp') {
        /* 3.2 — same short sentence as the live path, in the picked
           language; the editor stays empty because nothing was read. */
        showReadFailure();
        diagAdd({ at: Date.now(), outcome: 'sharp', ms, v: res.sharpness });
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
        if (!cancelled) showReadFailure();
        else ocrMsg.textContent = t('ocr.cancelled', 'أُلغي المسح.');
        diagAdd({ at: Date.now(), outcome: cancelled ? 'cancelled' : 'error', ms: Math.round(performance.now() - t0),
          name: (e && e.name) || 'unknown', message: String((e && e.message) || e).slice(0, 120) });
      }
    } finally {
      ocrBusy = false;
      if (retried) diagAdd({ at: Date.now(), outcome: 'ocr-retry', src: 'file', dim: dim });
      $('#cancelOcrBtn').hidden = true;
      showRetake(true);        // 2.2: one visible way back to the camera
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
  /* the pack downloader counts BYTES, so the progress line needs a byte
     formatter; a fake percentage would be exactly what this app must not show */
  const fmtBytes = b => {
    const n = Number(b) || 0;
    if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
    if (n >= 1024) return Math.round(n / 1024) + ' KB';
    return n + ' B';
  };

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
    /* 1.7 — عرض الحصة المستخدمة/المتاحة بجانب بنود التجهيز. */
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const q = $('#prepQuotaSize');
        if (q) q.textContent = fmtMB(est.usage || 0) + ' / ' + fmtMB(est.quota || 0);
      }
    } catch (e) { /* estimate unavailable — leave the dash */ }
    const [shell, data, ocr] = await Promise.all([
      measureCached(SHELL_PATHS), measureCached(DATA_PATHS), measureCached(OCR_ASSET_PATHS)
    ]);
    prepMeasured = true;
    setPrepItem('#prepShell', '#prepShellSize', shell);
    setPrepItem('#prepData', '#prepDataSize', data);
    setPrepItem('#prepOcr', '#prepOcrSize', ocr);
    /* 3.4 — per-language OCR footprint: the runtime engine loads ara+eng
     * for the Arabic UI and eng-only otherwise; show what the CURRENT
     * language actually needs (eng measurements already computed above). */
    const ocrLangs = (document.documentElement.lang === 'ar')
      ? OCR_ASSET_PATHS.concat(['vendor/tesseract/lang/ara.traineddata.gz'])
      : OCR_ASSET_PATHS;
    const ocrShown = await measureCached(ocrLangs);
    setPrepItem('#prepOcr', '#prepOcrSize', ocrShown);
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
    /* the same message as an IndexedDB quota failure: the app still works from
     * cache, the farmer only has to free space for the offline copy */
    if (typeof OcrModule.setQuotaSink === 'function') {
      OcrModule.setQuotaSink((err, url) => {
        diagAdd({ at: Date.now(), outcome: 'quota', src: 'cache', url: String(url || '') });
        showSafetyBanner(false, t('quota.hint',
          'لا توجد مساحة تخزين كافية لحفظ نسخة إضافية. احذف سجل البحث أو ملفات الموقع من إعدادات المتصفح ثم أعد التجهيز — التطبيق يعمل الآن من الذاكرة المؤقتة.'));
      });
    }
    const btn = $('#prepBtn'), st = $('#prepState');
    btn.disabled = true;
    st.textContent = t('prep.working', 'جارٍ التجهيز…');
    requestPersistence();
    ocrMsg.textContent = t('ocr.loading', 'جارٍ تحميل ملفات المسح البصري للاستخدام دون إنترنت…');
    /* 1.6 — تقدم حقيقي أثناء التجهيز (n/7 + اسم الملف)، وفشل صريح
     * بأسماء الملفات التي فشلت بعد timeout 60ث + محاولة إعادة واحدة
     * لكل ملف — لم يعد فشل 3/7 يُعرض كنجاح. */
    try {
      const n = await OcrModule.prefetch((done, total, name) => {
        const short = String(name || '').replace(/^vendor\/tesseract\//, 'tesseract/');
        ocrMsg.textContent = tf('prep.progress',
          'جارٍ التجهيز: {done}/{total} — {name}',
          { done: done + 1, total: total, name: short });
      });
      prepMeasured = false;                 // re-measure with fresh data
      await updatePrepPanel();
      ocrMsg.textContent = tf('ocr.loadDone', 'تم تحميل ملفات OCR ({n}/7). سيعمل المسح البصري دون إنترنت.', { n: n });
    } catch (e) {
      st.textContent = t('prep.fail', 'تعذّر التجهيز الآن — أعد المحاولة أثناء الاتصال');
      const missingList = (e && e.missing) ? ' (' + e.missing.join(', ') + ')' : '';
      ocrMsg.textContent = t('prep.failNote', 'تعذّر تحميل ملفات OCR الآن. سيُعاد المحاولة تلقائيًا عند أول مسح أثناء الاتصال.') + missingList;
    }
    btn.disabled = false;
  });

  /* ================================================================
   * المرحلة الثانية — كندا وأستراليا أساسيتان في وضع المحترف (قرار المالك)
   * قبل هذه الجولة كانتا «اختياريتين»: زر تنزيل لكل واحدة في شاشة القواعد،
   * ولا تدخلان البحث إلا بعد الضغط. الآن:
   *   • في وضع المحترف: تُنزَّل وتُتحقَّق وتُخزَّن تلقائياً عند بدء التشغيل
   *     وعند التبديل إلى المحترف — بلا زر تنزيل مفرد إطلاقاً.
   *   • في وضع المزارع: لا تغيير إطلاقاً. ليبيا حصراً، ولا تنزيل تلقائي،
   *     ولا خطوة جديدة في المسار (القاعدة الحاكمة: لا يُحمَّل ما لا يُستخدم).
   *   • التسمية التحذيرية المرشّحة في أستراليا تبقى كما هي: التلقائية هنا
   *     تعني «الحزمة مضمّنة» لا «الحكم مضمّن» (pack-guard).
   * ================================================================ */
  (function initPacks() {
    const box = $('#packList');
    if (!box || typeof PacksModule === 'undefined') return;
    const status = {};   /* key -> the state line element */
    const installing = {};

    function isPro() {
      const m = $('#mode');
      return !!(m && m.value === 'pro');
    }

    /* تحميل تلقائي: صامت، مرة واحدة لكل حزمة، وكل شيء داخل سطر الحالة
       في شاشة القواعد — لا زر ولا نافذة ولا خطوة في مسار المستخدم. */
    function ensurePacks() {
      if (!isPro()) { paintFarmerNote(); return; }
      PacksModule.PACKS.forEach(pack => {
        if (DB[pack.key] || installing[pack.key]) return;
        installing[pack.key] = true;
        const st = status[pack.key];
        if (st) {
          st.className = 'pack-state';
          st.textContent = t('packs.start', 'جارٍ التنزيل…');
        }
        PacksModule.install(pack.key, (got, total) => {
          if (st && installing[pack.key]) {
            st.textContent = tf('packs.progress', 'جارٍ التنزيل: {n} من {total}',
              { n: fmtBytes(got), total: total ? fmtBytes(total) : '—' });
          }
        }).then(res => {
          DB[pack.key] = { meta: res.meta, rows: res.rows };
          installing[pack.key] = false;
          stateLine(pack.key);
          rebuildSearch();
          diagAdd({ at: Date.now(), outcome: 'pack-auto-installed', src: pack.key, count: res.meta.count, sha256: String(res.manifest.sha256 || '').slice(0, 12) });
        }).catch(e => {
          installing[pack.key] = false;
          if (st) {
            st.className = 'pack-state err';
            st.textContent = t('packs.fail', 'تعذّر التنزيل — تحقق من الاتصال وحاول مرة أخرى');
          }
          diagAdd({ at: Date.now(), outcome: 'pack-auto-failed', src: pack.key, err: String((e && e.message) || e) });
        });
      });
    }

    function paintFarmerNote() {
      PacksModule.PACKS.forEach(pack => {
        if (DB[pack.key]) return;
        const st = status[pack.key];
        if (!st) return;
        st.className = 'pack-state';
        st.textContent = t('packs.proOnly', 'تتوفّر تلقائياً في وضع المحترف');
      });
    }

    function stateLine(key) {
      const el = status[key];
      if (!el) return;
      const pack = PacksModule.byKey(key);
      const meta = DB[key] && DB[key].meta;
      if (meta) {
        el.className = 'pack-state ok';
        el.textContent = tf('packs.ready', 'جاهزة: {n} مادة · {d}',
          { n: meta.count, d: meta.retrieved_date }) + ' · ' + meta.license;
      } else {
        el.className = 'pack-state';
        el.textContent = pack ? t('packs.idle', 'غير منزَّلة') : '';
      }
    }

    function row(pack) {
      const el = document.createElement('div');
      el.className = 'pack-row';
      el.id = 'pack-' + pack.key;
      const main = document.createElement('div');
      main.className = 'pack-main';
      const b = document.createElement('b');
      b.textContent = t('packs.name.' + pack.key, PACK_SOURCES[pack.key].label);
      const why = document.createElement('span');
      why.className = 'pack-why';
      why.textContent = t('packs.why.' + pack.key, '');
      const st = document.createElement('span');
      st.className = 'pack-state';
      status[pack.key] = st;
      const attr = document.createElement('span');
      attr.className = 'pack-attr';
      attr.lang = 'en';
      /* الإسناد الإلزامي: يظهر مع زر الحزمة نفسها، لا في صفحة منفصلة */
      attr.textContent = pack.key === 'canada'
        ? 'Contains information licensed under the Open Government Licence – Canada.'
        : 'Contains information licensed under the Creative Commons Attribution 3.0 Australia licence.';
      main.appendChild(b); main.appendChild(why); main.appendChild(st); main.appendChild(attr);

      /* دُفن الزر: الحزمة صارت في وضع المحترف تلقائية، فلا بارِ تنزيل
         مفرد ولا بارِ حذف — التحقق والتخزين تلقائيان (قرار المالك). */
      el.appendChild(main);
      return el;
    }

    PacksModule.PACKS.forEach(p => box.appendChild(row(p)));
    /* الحزمة المخزَّنة في جلسة سابقة تعود بنفسها عند فتح التطبيق */
    PacksModule.list().then(keys => Promise.all(keys.map(k => PacksModule.restore(k).then(v => {
      if (!v || !v.rows) return null;
      DB[k] = { meta: v.meta, rows: v.rows };
      stateLine(k);
      rebuildSearch();
      return k;
    })))).then(() => ensurePacks()).catch(() => {});
    /* التبديل إلى المحترف يحمّلهما إن لم يكونا موجودين */
    document.addEventListener('modechange', ensurePacks);
    if (isPro()) ensurePacks();
  })();

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
    /* 2026-09-28: when the user never chose a theme, follow the operating
     * system (prefers-color-scheme). An explicit choice still wins. */
    const saved = localStorage.getItem('mustashar-theme');
    const osLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = (saved === 'light' || (!saved && osLight)) ? 'light' : 'dark';
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

  /* قناة الملاحظات — docs/FEEDBACK.md.
   * صفر تحليلات وصفر إرسال تلقائي: هذه الروابط تفتح برنامج البريد أو واتساب
   * ويكتب المستخدم بنفسه. ما يُبنى هنا هو العنوان فقط: وسم + الإصدار + رمز
   * اللغة + سطر موضوع ثابت من القاموس. لا يدخل في أي رابط نصّ بحث المستخدم ولا
   * صورة ولا سجل — والغرض من الحارس أن يثبت ذلك. */
  function wireAboutFeedback() {
    const mail = $('#aboutFeedbackMail'), org = $('#aboutOrgLink'), wa = $('#aboutWaLink');
    if (!mail && !org && !wa) return;
    const addr = (($('#aboutEmail') || {}).textContent || '').trim();
    if (!addr) return;
    const ver = window.__appVersion || ((window.__versionInfo || {}).version) || '';
    const lang = document.documentElement.lang || 'ar';
    if (mail) {
      mail.href = 'mailto:' + addr + '?subject=' + encodeURIComponent(
        t('about.feedback.mail.tag', '[ملاحظة]') + ' ' + ver + ' · ' + lang + ' — ' +
        t('about.feedback.mail.subject', 'ملاحظة على التطبيق'));
    }
    if (org) {
      org.href = 'mailto:' + addr + '?subject=' + encodeURIComponent(
        t('about.feedback.org.tag', '[جهة]') + ' ' + ver + ' · ' + lang + ' — ' +
        t('about.feedback.org.subject', 'طلب من جهة'));
    }
    if (wa) {
      const appUrl = (wa.getAttribute('data-app-url') || '').trim();
      if (appUrl) {
        wa.href = 'https://wa.me/?text=' + encodeURIComponent(
          t('about.feedback.wa.text', 'المستشار الزراعي — تطبيق للتحقق من المبيدات.') + ' ' + appUrl);
      }
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
        window.__versionInfo = info;
        wireAboutFeedback();   /* الإصدار داخل موضوع الرسالة، فيُبنى بعد الجلب */
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
    const lines = statusExplainLines(code);
    if (!lines.length) return '';
    /* one text, one place: the card below and this popover render the SAME
     * lines (FB7) — REV* keeps the guide's own structure, the connective
     * line, then REV's sentence, then the asterisk note. */
    return '<strong class="lg-code">' + esc(code) + '</strong>'
      + lines.map(function (line, i) {
          return '<p class="' + (code === 'REV*' && i === lines.length - 1 ? 'lg-note' : 'lg-body') + '">'
            + esc(line) + '</p>';
        }).join('');
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
      const sec = REF_BY_SOURCE[cat.getAttribute('data-cat-src') || ''] || 'libya500';
      openLegendRaw(catName(code, sec)
        ? code + '\n' + catName(code, sec)
        : t('legend.cat.unknown', 'رمز غير مشروح في دليل هذا المصدر'), cat);
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
      + '<p class="lg-body">' + esc(String(text).split('\n').slice(1).join('\n') || t('legend.cat.unknown', 'رمز غير مشروح في دليل هذا المصدر')) + '</p>';
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
  /* the reference first: the databases may resolve a code the moment a row is
     drawn, and a missing reference must never be the reason a card says
     «غير مشروح». Then the databases, in parallel. */
  loadReference().then(() => loadAll());
  checkVersion();
  fillAboutMeta();
  wireAboutFeedback();   /* الروابط تُبنى فوراً، وتُعاد بناؤها بعد جلب الإصدار */
  updatePrepPanel();          // works even if the SW is still installing
  refreshInstallCard();       // 2.1: show/hide the install card on boot too
})();
