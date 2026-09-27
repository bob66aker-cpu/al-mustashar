/*
 * install-capture.js — المستشار الزراعي (المرحلة 2.1)
 * التقاط beforeinstallprompt في أقرب لحظة ممكنة: الحدث قد يُطلَق قبل تنفيذ
 * app.js، فنخزنه في window.__install حتى لا يُفوَّت أبدًا. لا منطق واجهة
 * هنا ولا DOM ولا شبكة — تخزين حدث فقط.
 */
(function () {
  'use strict';
  var deferredPrompt = null;
  window.__install = {
    available: false,
    accepted: false,
    platform: '',
    get: function () { return deferredPrompt; },
    set: function (e) { deferredPrompt = e; },
    pick: function () {
      if (!deferredPrompt) return null;
      var p = deferredPrompt; deferredPrompt = null; return p;
    }
  };
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    window.__install.available = true;
    window.__install.platform = e.platform || '';
    /* tell the app UI: the prompt may arrive seconds AFTER boot, long past
     * app.js's initial refresh — a stored flag alone is never enough. */
    try { window.dispatchEvent(new Event('installavailable')); } catch (err) { /* very old engines */ }
  });
  window.addEventListener('appinstalled', function () {
    window.__install.available = false;
    window.__install.accepted = true;
    try { localStorage.setItem('mustashar-installed', '1'); } catch (err) { /* private mode */ }
  });
})();
