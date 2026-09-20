/*
 * cas.js — طبقة قرار العرض فوق SearchCore (لا تغيّر محرك المطابقة إطلاقًا)
 * ------------------------------------------------------------------------
 * SearchCore يبقى كما هو (نفس الـ SHA، نفس حد 80%). هذه الوحدة تصنّف
 * النتائج القادمة منه للعرض فقط:
 *
 *   1. casChecksum()  — رقم التحقق لأرقام CAS (مجموع المواقع من اليمين % 10)
 *   2. dissectStatus() — حالة كل مصدر بمفرداته (لا دمج في حكم واحد):
 *        الأحمر (banned) لقرار 248 وحده؛ الكهرماني (amber) لتنبيهات
 *        المصادر المرجعية؛ حيادي للباقي. لا أخضر «آمن» في أي حالة.
 *   3. classify()      — تام / احتمالي (كل ما دون 100 يُعرض «تحقق من الاسم الكامل»)
 *   4. ambiguity()     — مرشحان بصفين مختلفين ورقمَي CAS مختلفين والفارق
 *                        بين درجتيهما < 8 وأعلى درجة ≥ 90 → تُعرض المجموعة
 *                        معًا ولا يُحكم بأحدها. الحد ≥ 90 يمنع تعليم ذيل
 *                        القائمة الاحتمالي البعيد كملتبس (موثق في docs).
 *
 * لا تُخترع حالة قانونية: كل نص عرض يأتي من قاموس i18n، وقيمة المصدر
 * الخام تبقى معروضة بجانب الترجمة في الوضع المحترف.
 */
(function (global) {
  'use strict';

  /* ---------- 1) CAS check digit -------------------------------------
   * digits: d0..dn where dn is the check digit.
   * sum = Σ d[i] * (positionFromRight), positions starting at 1 for the
   * digit immediately left of the check digit. Valid iff sum % 10 == check.
   * Returns true / false, or null when the string is not evaluable. */
  function casChecksum(cas) {
    const d = String(cas || '').replace(/[^0-9]/g, '');
    // CAS shape: 2..7 digits, 2 digits, 1 check digit => 5..10 digits total.
    if (d.length < 5 || d.length > 10) return null;   // not a full CAS shape
    let sum = 0;
    for (let i = 0; i < d.length - 1; i++) sum += (+d[i]) * (d.length - 1 - i);
    return (sum % 10) === (+d[d.length - 1]);
  }

  /* ---------- 2) per-source status dissection ------------------------
   * Ground rules verified against the actual data:
   *  - eu rows: status_raw ∈ {Approved, Not approved, Pending}; the legacy
   *    numeric label «مقيد» (45 rows) is NOT recoverable from status_raw
   *    (all 45 say "Approved"), so Approved rows are shown as approved and
   *    the labelling rule is documented in docs/data-provenance.md.
   *    An Approved row with expiry_date already past → amber "expired".
   *  - epa rows: status_raw is a ';'-joined list. Cancelled-only rows are
   *    amber; rows containing any Active registration are neutral, with an
   *    amber add-on when rup_active > 0 (restricted-use pesticide).
   *  - libya-500 codes (Approved/RAR/REV/REV*) are shown verbatim as
   *    «رمز غير مفسَّر» — interpretation is pending the user's decree text. */
  function dissectStatus(r, key) {
    const st = String((r && r.status) || '');
    const raw = String((r && r.status_raw) || '');
    if (key === 'libya-248') {
      return { key: 'st.248.banned', tone: 'banned', raw: st };
    }
    if (key === 'libya-500') {
      if (st === 'Approved') return { key: 'st.500.approved', tone: 'neutral', raw: st };
      if (st === 'RAR')      return { key: 'st.500.rar',      tone: 'neutral', raw: st };
      if (st === 'REV' || st === 'REV*')
                             return { key: 'st.500.rev',      tone: 'neutral', raw: st };
      return { key: 'st.500.unknown', tone: 'neutral', raw: st };
    }
    if (key === 'eu') {
      if (raw === 'Not approved') return { key: 'st.eu.notapproved', tone: 'amber', raw: raw };
      if (raw === 'Pending')      return { key: 'st.eu.pending',     tone: 'neutral', raw: raw };
      if (raw === 'Approved') {
        const exp = String(r.expiry_date || '').trim();           // dd/mm/yyyy
        const m = exp.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
          const t = new Date(+m[3], +m[2] - 1, +m[1]).getTime();
          if (Number.isFinite(t) && t < Date.now())
            return { key: 'st.eu.expired', tone: 'amber', raw: raw };
        }
        return { key: 'st.eu.approved', tone: 'neutral', raw: raw };
      }
      return { key: 'st.eu.unknown', tone: 'neutral', raw: raw || st };
    }
    if (key === 'epa') {
      const parts = raw.split(';').map(s => s.trim()).filter(Boolean);
      const anyActive = parts.some(p => p.indexOf('Active') === 0);
      const cancelledOnly = parts.length > 0 && parts.every(p => p.indexOf('Inactive') === 0);
      const conditional = parts.some(p => p.indexOf('Conditionally') === 0);
      const rup = (+((r && r.rup_active) || 0)) > 0;
      let base;
      if (cancelledOnly)     base = { key: 'st.epa.cancelled',   tone: 'amber',   raw: raw };
      else if (anyActive && conditional)
                             base = { key: 'st.epa.conditional', tone: 'neutral', raw: raw };
      else if (anyActive)    base = { key: 'st.epa.registered',  tone: 'neutral', raw: raw };
      else                   base = { key: 'st.epa.mixed',       tone: 'neutral', raw: raw };
      /* restricted-use flag travels separately (the UI appends its own note) */
      base.rup = rup;
      return base;
    }
    return { key: 'st.unknown', tone: 'neutral', raw: st };
  }

  /* ---------- 3) verdict classification ------------------------------
   * 'exact'    : v === 100 only (full name or full CAS match)
   * 'probable' : anything 80..99 — must never read as a confirmation */
  function classify(v) {
    return v >= 100 ? 'exact' : 'probable';
  }

  /* ---------- 4) ambiguity (two candidates, two CAS, < 8 pts apart) --- */
  function casOf(x) {
    const SC = global.SearchCore;
    return SC ? SC.extractCass(x.r && x.r.cas).join(',') : String((x.r && x.r.cas) || '');
  }
  function ambiguity(results) {
    const sorted = (results || []).slice().sort((a, b) => b.s.v - a.s.v);
    if (sorted.length < 2) return null;
    const topV = sorted[0].s.v;
    const confirmed = topV >= 100;
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[i].r === sorted[j].r) continue;             // same row
        if (casOf(sorted[i]) === casOf(sorted[j])) continue;   // same substance
        const gap = sorted[i].s.v - sorted[j].s.v;
        /* Flag when a near-tie exists AND there is no confirmed winner
         * above the tie (pair touches the leader) — a confirmed 100% match
         * is not "ambiguous" against a distant 83% look-alike. */
        if (gap < 8 && (!confirmed || i === 0 || j === 0)) {
          return { leader: sorted[0], tier: sorted.filter(x => topV - x.s.v < 8), a: sorted[i], b: sorted[j] };
        }
      }
    }
    return null;
  }

  /* ---------- exports ---------- */
  global.CasDissect = { casChecksum, dissectStatus, classify, ambiguity, casOf };
})(typeof window !== 'undefined' ? window : globalThis);
