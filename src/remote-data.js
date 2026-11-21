/*
 * src/remote-data.js — تحديث القواعد الدولية من موقع التطبيق (نسخة أندرويد فقط)
 * ---------------------------------------------------------------------------
 * في ملف APK تكون كل البيانات داخل الحزمة. هذه الوحدة تتيح وصول تحديث الـ15 يومًا
 * (EU / EPA / كندا / أستراليا) دون إصدار APK جديد.
 *
 *  - لا تعمل إلا داخل غلاف أندرويد (window.Capacitor)؛ على الموقع وفي المتصفح لا تفعل شيئًا.
 *  - الاتصال الوحيد بموقع التطبيق نفسه (REMOTE) بطلبات GET بلا كوكيز وبلا معرّفات.
 *  - لا تُقبل أي قاعدة إلا إن طابقت بصمتها SHA-256 الواردة في data/remote-manifest.json
 *    وعدد صفوفها، وكان عددها فوق حدّ أدنى. الكل أو لا شيء: فشل ملف واحد يلغي التحديث.
 *  - القاعدتان الليبيتان لا تُحدَّثان من هنا إطلاقًا (لا تتغيران إلا بقرار الوزارة وبإصدار جديد).
 *  - الملفات تُخزَّن في cache باسم mustashar-remote-data ويقدّمها sw.js بدل النسخة المضمَّنة،
 *    وبصماتها تُسجَّل هنا ليستعملها app.js في التحقق بدل البصمة المثبّتة في الكود.
 *  - يمكن للمستخدم إيقافه من «قواعد إضافية اختيارية».
 */
(function (global) {
  'use strict';
  var REMOTE = 'https://al-mustashar.pages.dev/';
  var CACHE = 'mustashar-remote-data';
  var KEY = 'mustashar.remote.v1';
  var OFF = 'mustashar.remote.off';
  var EVERY = 12 * 3600 * 1000;
  var CORE = ['data/eu.json', 'data/epa.json', 'data/epa-cancelled.json'];
  var FLOORS = { 'data/eu.json': 1000, 'data/epa.json': 1000, 'data/epa-cancelled.json': 1000,
                 'data-optional/canada.json': 800, 'data-optional/australia.json': 1500 };
  var DCKEYS = ['eu', 'epa', 'epa-cancelled', 'canada', 'australia'];

  function native() {
    try { return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()); }
    catch (e) { return false; }
  }
  function store() { try { return global.localStorage; } catch (e) { return null; } }
  function read() { var s = store(); try { return s ? JSON.parse(s.getItem(KEY) || 'null') : null; } catch (e) { return null; } }
  function write(r) { var s = store(); try { if (s) s.setItem(KEY, JSON.stringify(r)); } catch (e) { /* no storage = no update */ } }
  function disabled() { var s = store(); try { return !!(s && s.getItem(OFF) === '1'); } catch (e) { return false; } }

  var rec = native() ? read() : null;

  /* البصمة المسجّلة لملف أساسي مُحدَّث، أو null (فيستعمل app.js بصمته المثبّتة) */
  function pin(url) { return (rec && rec.files && rec.files[url]) ? rec.files[url].sha256 : null; }
  function dataCheck() { return (rec && rec.dataCheck) || null; }

  function sha256Hex(buf) {
    if (!global.crypto || !global.crypto.subtle) return Promise.resolve(null);
    return global.crypto.subtle.digest('SHA-256', buf).then(function (d) {
      var v = new Uint8Array(d), s = '';
      for (var i = 0; i < v.length; i++) s += ('0' + v[i].toString(16)).slice(-2);
      return s;
    });
  }
  function maxBuilt(dc) {
    var m = '';
    DCKEYS.forEach(function (k) { if (dc && typeof dc[k] === 'string' && dc[k] > m) m = dc[k]; });
    return m;
  }
  function get(path, bytes) {
    return fetch(REMOTE + path, { cache: 'no-store', credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + path);
      return r.arrayBuffer();
    });
  }

  function update(force) {
    if (!native() || disabled() || !global.navigator.onLine) return Promise.resolve('skipped');
    var now = Date.now();
    if (!force && rec && rec.checked && now - rec.checked < EVERY) return Promise.resolve('recent');
    return Promise.all([
      fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch(REMOTE + 'data/remote-manifest.json', { cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; })
    ]).then(function (res) {
      var local = res[0], m = res[1];
      if (!m || m.schema !== 1 || !m.files || typeof m.built !== 'string') throw new Error('bad manifest');
      var base = maxBuilt(local && local.dataCheck);
      if (rec && rec.built && rec.built > base) base = rec.built;
      if (m.built <= base) { rec = Object.assign({}, rec || {}, { checked: now }); write(rec); return 'current'; }
      var paths = Object.keys(m.files);
      return Promise.all(paths.map(function (p) {
        var want = m.files[p];
        if (!want || !/^[0-9a-f]{64}$/.test(want.sha256 || '')) throw new Error('bad entry ' + p);
        return get(p).then(function (buf) {
          return sha256Hex(buf).then(function (got) {
            if (got !== want.sha256) throw new Error('checksum ' + p);
            if (FLOORS[p]) {
              var d = JSON.parse(new TextDecoder('utf-8').decode(buf));
              if (!d.rows || d.rows.length < FLOORS[p] || d.rows.length !== want.rows) throw new Error('rows ' + p);
            }
            return { path: p, buf: buf, sha: want.sha256, rows: want.rows || null };
          });
        });
      })).then(function (items) {
        return global.caches.open(CACHE).then(function (c) {
          return Promise.all(items.map(function (it) {
            return c.put(new Request('/' + it.path), new Response(it.buf, { headers: { 'Content-Type': 'application/json' } }));
          }));
        }).then(function () {
          var files = {};
          items.forEach(function (it) { if (CORE.indexOf(it.path) >= 0) files[it.path] = { sha256: it.sha, rows: it.rows }; });
          rec = { built: m.built, checked: now, files: files, dataCheck: m.dataCheck || null };
          write(rec);
          global.__dataCheck = Object.assign({}, global.__dataCheck || {}, rec.dataCheck || {});
          document.dispatchEvent(new Event('remotedataupdated'));
          /* الحزم الاختيارية المنزَّلة تُعاد من النسخة الجديدة (يقدّمها sw.js من الكاش) */
          var P = global.PacksModule;
          if (P && P.list && P.install) {
            return P.list().then(function (keys) {
              return Promise.all((keys || []).filter(function (k) { return k === 'canada' || k === 'australia'; })
                .map(function (k) { return P.install(k).catch(function () {}); }));
            }).then(function () { return 'updated'; });
          }
          return 'updated';
        });
      });
    }).catch(function (e) {
      rec = Object.assign({}, rec || {}, { checked: now, lastError: String(e && e.message || e).slice(0, 80) });
      write(rec);
      return 'failed';
    });
  }

  /* مفتاح الإيقاف في «قواعد إضافية اختيارية» (يظهر في أندرويد فقط) */
  function mountSwitch() {
    var body = document.querySelector('#packsCard .body');
    if (!body || document.getElementById('remoteUpd')) return;
    var box = document.createElement('div');
    box.id = 'remoteUpd'; box.className = 'pack-intro';
    box.innerHTML = '<label><input type="checkbox" id="remoteUpdOn"> <b data-i18n="remote.label"></b></label>' +
      '<p data-i18n="remote.hint"></p><p id="remoteUpdInfo"></p>';
    body.insertBefore(box, body.firstChild);
    var cb = box.querySelector('input');
    cb.checked = !disabled();
    cb.addEventListener('change', function () {
      var s = store(); try { if (s) { if (cb.checked) s.removeItem(OFF); else s.setItem(OFF, '1'); } } catch (e) { /* ignore */ }
      if (cb.checked) update(true).then(paint);
    });
    if (global.I18N && global.I18N.apply) global.I18N.apply(box);
    paint();
  }
  function paint() {
    var el = document.getElementById('remoteUpdInfo');
    if (!el) return;
    var T = global.I18N;
    var tf = function (k, fb, v) { return T && T.tf ? T.tf(k, fb, v) : fb; };
    el.textContent = rec && rec.built ? tf('remote.built', 'آخر تحديث للقواعد: {d}', { d: rec.built }) : '';
  }

  global.RemoteData = { pin: pin, dataCheck: dataCheck, update: update, isNative: native };

  if (native()) {
    var start = function () { mountSwitch(); setTimeout(function () { update(false).then(paint); }, 6000); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
