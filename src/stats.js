/*
 * stats.js — المستشار الزراعي · usage measurement (local only)
 * -------------------------------------------------------------------------
 * قرار المالك (الاثنان معاً): قياس محلي الآن، ومسار خارجي موثّق كقرار مستقبلي
 * (docs/usage-analytics.md). لا تخرج أي بايت من هذا الجهاز:
 *   - no fetch / XHR / beacon / WebSocket — guarded by tests/stats-local.test.mjs
 *   - counters only: no search text, no images, no device/user identifier
 *   - storage: localStorage (fail-soft to memory when storage is unavailable)
 * Schema v1: { v, since, total:{EVENT: n}, lang:{ar|en|fr|zh: n},
 *              days:{'YYYY-MM-DD':{EVENT: n}} }  — last 30 days kept.
 */
(function () {
  'use strict';

  var KEY = 'mustashar-stats';
  var SCHEMA = 1;
  var DAYS_KEPT = 30;
  /* the closed set of counters — anything else is ignored by design */
  var EVENTS = ['open', 'search', 'searchHit', 'searchMiss',
    'scan', 'scanHit', 'scanMiss', 'prep', 'prepOk', 'prepFail',
    'modeFarmer', 'modePro', 'langSwitch'];
  var LANGS = ['ar', 'en', 'fr', 'zh'];

  function today() {
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function zero() {
    var o = {};
    for (var i = 0; i < EVENTS.length; i++) o[EVENTS[i]] = 0;
    return o;
  }
  function blank() {
    var days = {};
    days[today()] = zero();
    return { v: SCHEMA, since: today(), total: zero(),
      lang: { ar: 0, en: 0, fr: 0, zh: 0 }, days: days };
  }
  function trim(s) {
    var ks = Object.keys(s.days).sort();
    while (ks.length > DAYS_KEPT) delete s.days[ks.shift()];
  }

  var mem = null;   /* fail-soft copy: private mode / storage disabled */

  function load() {
    if (mem) return mem;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.v === SCHEMA && s.total && s.days && s.lang) {
          mem = s; trim(mem); return mem;
        }
      }
    } catch (e) { /* storage unreadable → memory mode */ }
    mem = blank();
    return mem;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); }
    catch (e) { /* quota/private mode: the session copy still counts */ }
  }
  function bump(map, name) {
    if (EVENTS.indexOf(name) < 0) return;
    map[name] = (map[name] || 0) + 1;
  }

  window.Stats = {
    count: function (name) {
      try {
        var s = load();
        bump(s.total, name);
        var d = today();
        if (!s.days[d]) s.days[d] = zero();
        bump(s.days[d], name);
        trim(s);
        save();
      } catch (e) { /* measurement must never break the app */ }
    },
    setLang: function (lang) {
      try {
        var s = load();
        if (Object.prototype.hasOwnProperty.call(s.lang, lang)) {
          s.lang[lang] += 1;
          save();
        }
      } catch (e) { /* ditto */ }
    },
    snapshot: function () {
      try { return JSON.parse(JSON.stringify(load())); }
      catch (e) { return null; }
    },
    reset: function () {
      try { mem = blank(); localStorage.removeItem(KEY); save(); }
      catch (e) { mem = blank(); }
    }
  };
})();
