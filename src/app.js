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
    { key: 'libya-248', url: 'data/libya-248.json', label: 'ليبيا 248' },
    { key: 'libya-500', url: 'data/libya-500.json', label: 'ليبيا 500' },
    { key: 'eu',        url: 'data/eu.json',        label: 'الاتحاد الأوروبي' },
    { key: 'epa',       url: 'data/epa.json',       label: 'USA / EPA' }
  ];

  const DB_NAME = 'mustashar-local';
  const DB_VERSION = 2;           // v1 = "db" store; v2 adds "history"
  const STORE_DB = 'db';
  const STORE_HISTORY = 'history';

  const $ = s => document.querySelector(s);

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

  const STATUS_TEXT = {
    loading:      'جارٍ التحميل…',
    ok:           'جاهز',
    cached:       'جاهز (نسخة محلية)',
    unavailable:  'غير متاح'
  };
  const STATUS_CLASS = {
    loading: 'db-loading', ok: 'db-ok', cached: 'db-cached', unavailable: 'db-bad'
  };

  function renderDbStatus() {
    SOURCES.forEach(s => {
      const chip = $('#db-' + s.key);
      const st = state[s.key];
      if (!chip) return;
      chip.textContent = s.label + ': ' + STATUS_TEXT[st.phase]
        + (st.count ? ' (' + st.count.toLocaleString('en-US') + ')' : '');
      chip.className = 'chip ' + STATUS_CLASS[st.phase];
    });
    const ready = SOURCES.filter(s => state[s.key].phase === 'ok' || state[s.key].phase === 'cached');
    const total = ready.reduce((a, s) => a + state[s.key].count, 0);
    const badge = $('#dbCount');
    if (badge) badge.textContent = total
      ? total.toLocaleString('en-US') + ' سجل'
      : 'لا توجد قواعد محمّلة';
    const overall = $('#dbState');
    if (overall) {
      if (!ready.length) overall.textContent = 'القواعد غير متاحة';
      else if (ready.length === SOURCES.length) overall.textContent = 'القواعد المحلية جاهزة';
      else overall.textContent = 'جاهز جزئيًا (' + ready.length + '/' + SOURCES.length + ')';
    }
    const banner = $('#dbBanner');
    if (banner) {
      const bad = SOURCES.filter(s => state[s.key].phase === 'unavailable');
      if (!ready.length) {
        banner.hidden = false;
        banner.textContent = 'تعذّر تحميل أي قاعدة بيانات. البحث غير متاح حتى يتم تحميل قاعدة واحدة على الأقل.';
        banner.className = 'banner banner-error';
      } else if (bad.length) {
        banner.hidden = false;
        banner.className = 'banner banner-warn';
        banner.textContent = 'تعذّر تحميل: ' + bad.map(s => s.label).join('، ')
          + '. النتائج لا تشمل هذه القواعد.';
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
  function loadSource(src) {
    setPhase(src.key, 'loading');
    const attemptFetch = () => fetch(src.url, { cache: 'no-store' }).then(async res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!looksValid(data)) throw new Error('invalid payload');
      return data;
    });

    return attemptFetch()
      .then(data => {
        DB[src.key] = data;
        setPhase(src.key, 'ok', data.rows.length);
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
        $('#dbState') && ($('#dbState').title = 'الإصدار: ' + info.version
          + ' — بيانات: ' + (info.data_updated || 'غير محدد'));
        idbGet(STORE_DB, 'app-version').then(prev => {
          if (prev && prev !== info.version) {
            const banner = $('#dbBanner');
            if (banner) {
              banner.hidden = false;
              banner.className = 'banner banner-info';
              banner.textContent = 'يتوفر إصدار جديد من التطبيق (' + prev + ' → '
                + info.version + '). حدّث الصفحة للحصول عليه. لن يتم حذف أي بيانات محفوظة.';
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
      'libya-248': 'ليبيا، قرار 248 لسنة 2024',
      'libya-500': 'ليبيا، قرار 500 لسنة 2026',
      'eu': 'الاتحاد الأوروبي',
      'epa': 'USA / EPA'
    }[k] || k;
  }

  function statusLabel(r, k) {
    if (k === 'libya-500') {
      if (r.status === 'Approved') return ['معتمد', 'good'];
      if (r.status === 'RAR')      return ['قيد تقييم المخاطر', 'review'];
      return [r.status || 'غير محدد', 'review'];   // REV, REV* — shown as-is
    }
    const s = String(r.status || 'غير محدد');
    return [s.includes('Approved') || s === 'مسموح' ? 'مسموح' : s, 'good'];
  }

  function render(results, q) {
    const box = $('#results');
    $('#resultTitle').textContent = 'نتائج الفحص' + (q ? ' لـ «' + q + '»' : '');
    if (!results.length) {
      box.innerHTML = '<div class="notice warn"><b>لم يتم العثور على تطابق موثوق</b><br>'
        + 'عدم العثور على المادة لا يعني أنها مسموحة. جرّب الاسم الكامل أو رقم CAS.</div>';
      return;
    }
    box.innerHTML = results.map(x => {
      const [st, cl] = statusLabel(x.r, x.k);
      const raw = x.r.status_raw
        ? '<p class="match">الحالة كما وردت في المصدر: ' + esc(x.r.status_raw) + '</p>'
        : '';
      const cat = x.r.category
        ? '<p class="match">التصنيف كما ورد في المصدر: ' + esc(x.r.category) + '</p>'
        : '';
      return '<article class="result ' + (x.s.v < 90 ? 'possible' : '') + '">'
        + '<div class="result-top"><div><span class="source">' + esc(sourceLabel(x.k)) + '</span>'
        + '<h3>' + esc(x.r.name || 'بدون اسم').replace(/\n/g, ' · ') + '</h3></div>'
        + '<strong>' + x.s.v + '%</strong></div>'
        + '<p class="status ' + cl + '">' + esc(st) + '</p>'
        + '<p class="meta">CAS: ' + esc(String(x.r.cas || 'غير متوفر')).replace(/\n/g, ' · ') + '</p>'
        + cat + raw
        + '<p class="match">' + esc(x.s.type) + ': ' + esc(x.s.field) + '</p>'
        + (x.s.v < 90 ? '<p class="caution">تطابق محتمل، راجع الاسم والملصق قبل الاستخدام.</p>' : '')
        + '</article>';
    }).join('');
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
      box.innerHTML = '<div class="notice">لا يوجد سجل بحث بعد.</div>';
      return;
    }
    box.innerHTML = items
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .map(x => '<div class="history-item" data-q="' + esc(x.q) + '">'
        + '<span>' + esc(x.q) + '</span><span class="history-meta">'
        + (x.hits || 0) + ' نتيجة · '
        + new Date(x.at || Date.now()).toLocaleString('ar') + '</span></div>')
      .join('');
  }

  function openHistory() {
    idbGetAll(STORE_HISTORY).then(renderHistory).catch(() => {
      $('#historyList').innerHTML = '<div class="notice">تعذّر قراءة السجل.</div>';
    });
  }

  /* ============================================================
   * Wiring
   * ============================================================ */
  const DB = {};   // key -> validated data object (or absent if unavailable)
  let searchFn = null;

  function rebuildSearch() {
    const sources = SOURCES.map(s => ({ key: s.key, rows: (DB[s.key] || {}).rows || null }));
    searchFn = SearchCore.buildSearch(sources);
  }

  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#query').value.trim();
    if (!q) return;
    rebuildSearch();                       // include newly arrived databases
    if (!searchFn || !searchFn.sources.length) {
      $('#results').innerHTML = '<div class="notice warn"><b>قواعد البيانات غير متاحة</b><br>'
        + 'تعذّر تحميل قاعدة واحدة على الأقل، لذلك لا يمكن تنفيذ البحث.</div>';
      $('#resultTitle').textContent = 'نتائج الفحص';
      return;
    }
    const pro = $('#mode').value === 'pro';
    const results = searchFn(q, pro);
    render(results, q);
    if (results.length) addHistory(q, results.length);
  });

  $('#mode').addEventListener('change', () => {
    $('#modeLabel').textContent = $('#mode').value === 'pro' ? 'المحترف' : 'المزارع';
  });

  window.addEventListener('online', renderDbStatus);
  window.addEventListener('offline', renderDbStatus);

  /* History panel */
  $('#historyBtn').addEventListener('click', () => {
    const p = $('#historyPanel');
    p.hidden = !p.hidden;
    if (!p.hidden) openHistory();
  });
  $('#historyClose').addEventListener('click', () => { $('#historyPanel').hidden = true; });
  $('#historyClear').addEventListener('click', () => {
    idbClear(STORE_HISTORY).then(openHistory).catch(() => {});
  });
  $('#historyList').addEventListener('click', e => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    $('#query').value = item.dataset.q || '';
    $('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
  });

  /* Copy report */
  $('#copyBtn').addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText($('#results').innerText).catch(() => {});
  });

  /* Camera (preview only — OCR intentionally NOT implemented yet) */
  const camera = $('#camera'), preview = $('#preview'), ocrMsg = $('#ocrMsg');
  $('#cameraBtn').addEventListener('click', () => camera.click());
  camera.addEventListener('change', () => {
    const f = camera.files && camera.files[0];
    if (!f) return;
    preview.src = URL.createObjectURL(f);
    preview.hidden = false;
    ocrMsg.textContent = 'الصورة جاهزة. محرك OCR غير مفعّل بعد.';
    $('#scanPanel').open = true;
  });

  /* Theme (now persisted) */
  const themeBtn = $('#themeToggle');
  try {
    const saved = localStorage.getItem('mustashar-theme');
    if (saved) document.documentElement.dataset.theme = saved;
  } catch (e) { /* storage may be unavailable */ }
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? '' : 'dark';
    if (next) document.documentElement.dataset.theme = next;
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('mustashar-theme', next || 'light'); } catch (e) {}
  });

  /* Service worker registration + update detection */
  function updateOnlineBadge() {
    $('#offlineState').textContent = navigator.onLine ? '🟢 متصل' : '🔴 بدون إنترنت';
  }
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
              banner.textContent = 'يتوفر تحديث للتطبيق. أعد تحميل الصفحة للتحديث — لن يتم حذف أي بيانات محفوظة.';
            }
          }
        });
      });
    }).catch(() => {});
  }

  /* ============================================================
   * Boot
   * ============================================================ */
  renderDbStatus();
  requestPersistence();
  loadAll();
  checkVersion();
})();
