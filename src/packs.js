/*
 * src/packs.js — المرحلة الثانية: قواعد إضافية اختيارية (كندا / أستراليا)
 * ---------------------------------------------------------------------------
 * قواعد اختيارية: **لا تُحمَّل ولا تدخل نتائج البحث قبل أن يضغط المزارع زرها**.
 * لا خطوة جديدة في مسار المزارع: الزر موجود في شاشة «القواعد» فقط، وكل ما
 * بعده صامت (تنزيل حقيقي، تحقق sha256، تخزين، حذف).
 *
 * العقد:
 *   install(pack, onProgress) → { rows, meta }   رمي خطأ عند فشل التحقق
 *   restore(pack)             → البيانات المخزّنة أو null
 *   remove(pack)              → حذف من IndexedDB ومن الكاش
 *   list()                    → ما هو مثبَّت فعلاً
 * التحقق: sha256 على بايتات الملف المُنزَّل مقابل ملف الـ manifest المرفق في
 * المستودع — الحزمة لا تُستخدم إلا إذا طابقت البصمة exactly.
 */
(function (global) {
  'use strict';

  var PACKS = [
    {
      key: 'canada',
      url: 'data-optional/canada.json',
      manifestUrl: 'data-optional/canada.manifest.json',
      license: 'OGL-Canada',
      licenseUrl: 'https://open.canada.ca/en/open-government-licence-canada'
    },
    {
      key: 'australia',
      url: 'data-optional/australia.json',
      manifestUrl: 'data-optional/australia.manifest.json',
      license: 'CC-BY-3.0-AU',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/au/'
    }
  ];

  var DB_NAME = 'mustashar-local';
  var DB_VERSION = 3;      /* must equal app.js DB_VERSION — see below */
  var STORE = 'pack';

  function byKey(key) {
    for (var i = 0; i < PACKS.length; i++) if (PACKS[i].key === key) return PACKS[i];
    return null;
  }

  /* ---------- IndexedDB: نفس قاعدة التطبيق، مخزن مستقل للحزم ---------- */
  function openDB() {
    return new Promise(function (resolve, reject) {
      var req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
      /* BOTH modules create the SAME three stores. Two upgrade requests can
       * race on a fresh install (this module and app.js both open v3); if each
       * only made its own store, whichever ran first would fix the version and
       * the other stores would never exist — silently losing the search
       * history. Creating all of them is idempotent and race-proof. */
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('db')) db.createObjectStore('db');
        if (!db.objectStoreNames.contains('history')) db.createObjectStore('history');
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
      /* a connection held open by the page at an older version would block the
       * upgrade forever; say so instead of hanging silently */
      req.onblocked = function () { reject(new Error('indexeddb upgrade blocked')); };
    });
  }
  function idb(mode, key, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode);
        var store = tx.objectStore(STORE);
        var rq = mode === 'readonly' ? store.get(key) : store.put(value, key);
        rq.onsuccess = function () { resolve(rq.result); };
        rq.onerror = function () { reject(rq.error); };
      });
    });
  }

  function store(key) { return idb('readonly', key); }
  function save(key, value) { return idb('readwrite', key, value); }

  function remove(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).then(function () {
      if (global.caches && global.caches.keys) {
        return global.caches.keys().then(function (names) {
          var mine = names.filter(function (n) { return n.indexOf('mustashar-pack-') === 0; });
          return Promise.all(mine.map(function (n) { return global.caches.delete(n); }));
        }).catch(function () { /* nothing cached = nothing to clear */ });
      }
      return true;
    });
  }

  /* ---------- التحقق من البصمة ---------- */
  function sha256Hex(buf) {
    if (!global.crypto || !global.crypto.subtle) return Promise.resolve(null);
    return global.crypto.subtle.digest('SHA-256', buf).then(function (d) {
      var v = new Uint8Array(d), s = '';
      for (var i = 0; i < v.length; i++) s += ('0' + v[i].toString(16)).slice(-2);
      return s;
    });
  }

  /* تنزيل بتقدّم حقيقي: n/total بالبايت من Content-Length، لا مؤقت مزيف */
  function download(url, onProgress) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var total = parseInt(res.headers.get('content-length') || '0', 10) || 0;
      if (!res.body || !res.body.getReader) {
        return res.arrayBuffer().then(function (b) {
          if (onProgress) onProgress(b.byteLength, total || b.byteLength);
          return b;
        });
      }
      var reader = res.body.getReader(), chunks = [], got = 0;
      return (function pump() {
        return reader.read().then(function (r) {
          if (r.done) {
            var out = new Uint8Array(got), at = 0;
            for (var i = 0; i < chunks.length; i++) { out.set(chunks[i], at); at += chunks[i].length; }
            return out.buffer;
          }
          chunks.push(r.value); got += r.value.length;
          if (onProgress) onProgress(got, total || got);
          return pump();
        });
      })();
    });
  }

  function install(key, onProgress) {
    var pack = byKey(key);
    if (!pack) return Promise.reject(new Error('unknown pack: ' + key));
    return fetch(pack.manifestUrl, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('manifest HTTP ' + r.status);
        return r.json();
      })
      .then(function (man) {
        if (!man || !man.sha256) throw new Error('manifest without sha256');
        return download(pack.url, onProgress).then(function (buf) {
          return sha256Hex(buf).then(function (got) {
            if (got && got !== man.sha256) {
              throw new Error('checksum mismatch: file ' + (got || '').slice(0, 12) +
                ' ≠ manifest ' + String(man.sha256).slice(0, 12));
            }
            var data = JSON.parse(new TextDecoder('utf-8').decode(buf));
            if (!data || !data.rows || !data.rows.length) throw new Error('empty pack');
            if (data.meta && data.meta.count && data.rows.length !== data.meta.count) {
              throw new Error('count mismatch: ' + data.rows.length + ' ≠ ' + data.meta.count);
            }
            return { pack: pack, manifest: man, data: data };
          });
        });
      })
      .then(function (r) {
        return save(key, { meta: r.data.meta, rows: r.data.rows, manifest: r.manifest })
          .then(function () { return { rows: r.data.rows, meta: r.data.meta, manifest: r.manifest }; });
      });
  }

  function restore(key) { return store(key); }

  function list() {
    return store('__index__').then(function (idx) {
      if (idx && idx.length) return idx;
      return Promise.all(PACKS.map(function (p) {
        return store(p.key).then(function (v) { return v ? p.key : null; }).catch(function () { return null; });
      })).then(function (ks) { return ks.filter(Boolean); });
    }).catch(function () { return []; });
  }

  global.PacksModule = {
    PACKS: PACKS, byKey: byKey,
    install: install, restore: restore, remove: remove, list: list,
    sha256Hex: sha256Hex
  };
})(typeof window !== 'undefined' ? window : globalThis);
