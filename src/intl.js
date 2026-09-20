/*
 * src/intl.js — الطبقة الدولية التنبيهية (ج5)
 * =============================================================
 * Membership ALERTS only: "مدرج في قائمة كذا" — the word 'محظور'
 * NEVER appears here. Data file (data/intl-alerts.json) holds links
 * and list identity only; no source text is copied (license terms
 * not verified). Libya treaty ratification status ships as
 * "غير مؤكد" until verified against the depositary tables.
 *
 * API: IntlAlerts.load() -> Promise<data>
 *      IntlAlerts.forSubstance(nameOrCas) -> [{list, label, note, url}]
 */
(function (global) {
  'use strict';

  var DATA_URL = 'data/intl-alerts.json';
  var cache = null;
  var loading = null;

  function load() {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    var f = (typeof fetch === 'function') ? fetch : null;
    if (f) f = f.bind(globalThis);
    loading = f(DATA_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('intl-alerts HTTP ' + r.status); return r.json(); })
      .then(function (d) { cache = d; return d; })
      .catch(function () { cache = null; return null; });
    return loading;
  }

  /* normalize for matching: latin/digits only, lowercase, single-space */
  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function casOf(s) {
    var m = String(s == null ? '' : s).match(/(\d[\d ]*\d\s*-\s*\d[\d ]*\d\s*-\s*\d)/);
    return m ? m[1].replace(/ /g, '') : null;
  }

  /* Return alert entries for a substance name and/or CAS.
   * Matches only against substances recorded in intl-alerts.json
   * (each entry: {name, cas, note?}). Empty lists => [] (no alerts). */
  function forSubstance(nameOrCas) {
    if (!cache || !nameOrCas) return Promise.resolve([]);
    var q = norm(nameOrCas);
    var qCas = casOf(nameOrCas);
    var out = [];
    var lists = cache.lists || [];
    var pending = [];
    for (var i = 0; i < lists.length; i++) {
      var lst = lists[i];
      var subs = lst.substances || [];
      for (var j = 0; j < subs.length; j++) {
        var s = subs[j];
        var hit = false;
        if (qCas && s.cas) {
          var scas = casOf(s.cas);
          if (scas && scas === qCas) hit = true;
        }
        if (!hit && q && s.name && norm(s.name) === q) hit = true;
        if (hit) pending.push({ list: lst.id, label: lst.label, note: s.note || lst.nature, url: lst.annex_url || lst.url, fetched: lst.fetched });
      }
    }
    return Promise.resolve(pending);
  }

  var IntlAlerts = {
    load: load,
    forSubstance: forSubstance,
    treatyStatus: function () { return cache ? cache.libya_treaty_status : null; },
    _norm: norm, _casOf: casOf
  };

  global.IntlAlerts = IntlAlerts;
  if (typeof module !== 'undefined' && module.exports) module.exports = IntlAlerts;
})(typeof window !== 'undefined' ? window : globalThis);
