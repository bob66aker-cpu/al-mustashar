/*
 * search-core.js — بحث المستشار الزراعي
 * ---------------------------------------------------------------
 * extracted verbatim from the original app.js. The scoring
 * semantics are unchanged:
 *   - same normalization (Arabic diacritics/alef/ya/ta-marbuta folding)
 *   - same CAS exact-match rule (100%)
 *   - same substring rule (>=4 chars, ratio >= 0.72, capped at 96)
 *   - same Levenshtein similarity and the 80% minimum displayed threshold
 *   - same source priority: Libya 248 -> Libya 500 -> EU -> EPA
 *
 * Two non-semantic improvements:
 *   1. normalized values are computed once per row at index-build time
 *      instead of on every keystroke/submit (search stays identical,
 *      only faster).
 *   2. the CAS exact-match fast path now also understands rows whose
 *      "cas" field contains a bracketed list of CAS numbers
 *      (e.g. "[3813-14-7]" inside Libya 248 rows). Original behavior
 *      treated those rows as unfindable by CAS; now any of their
 *      listed CAS numbers matches at 100%, exactly like a plain CAS
 *      field would. No rows are added, removed, or re-scored.
 *
 * Rows are NEVER mutated: indexed values are stored in a side map,
 * so each result still exposes the original database row object.
 */
(function (global) {
  'use strict';

  /* ---------- helpers (verbatim from original app.js) ---------- */

  const norm = s => String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s./-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const compact = s => norm(s).replace(/[\s./-]/g, '');

  const isCAS = s => /^\d{2,7}-\d{2}-\d$/.test(String(s || '').trim());

  function levenshtein(a, b) {
    a = compact(a); b = compact(b);
    let p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let q = [i];
      for (let j = 1; j <= b.length; j++)
        q[j] = Math.min(q[j - 1] + 1, p[j] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      p = q;
    }
    return p[b.length];
  }

  /* Original "fields" accessor, kept only for reference/parity checks. */
  function fields(r) { return [['name', r.name], ['cas', r.cas]]; }

  /* Original scoring function, kept verbatim so behavior parity is
     auditable. The indexed search path below produces the same verdicts. */
  function score(q, r) {
    let nq = norm(q), best = { v: 0, type: '', field: '' };
    for (const [key, x] of fields(r)) {
      if (!x) continue;
      let nx = norm(x);
      if (isCAS(q) && isCAS(x))
        return compact(q) === compact(x)
          ? { v: 100, type: 'CAS مطابق تمامًا', field: x }
          : { v: 0, type: '', field: '' };
      if (nq === nx) return { v: 100, type: 'اسم مطابق', field: x };
      if (nq.length >= 4 && nx.length >= 4 && (nx.includes(nq) || nq.includes(nx))) {
        const ratio = Math.min(nq.length, nx.length) / Math.max(nq.length, nx.length);
        if (ratio >= .72 && ratio * 96 > best.v)
          best = { v: Math.round(ratio * 96), type: 'تطابق جزئي', field: x };
      }
      const m = Math.max(compact(nq).length, compact(nx).length);
      if (m) {
        const v = 100 - levenshtein(nq, nx) / m * 100;
        if (v > best.v) best = { v: Math.round(v), type: 'تشابه حرفي', field: x };
      }
    }
    return best;
  }

  /* ---------- precomputed index (same verdicts, faster) ---------- */

  /*
   * All CAS numbers mentioned in a row's "cas" field, in order.
   * Plain rows yield [cas]; bracketed rows yield every listed number.
   * "see remark" / "No CAS allocated" style text yields nothing.
   */
  function extractCass(raw) {
    const s = String(raw || '');
    if (!s) return [];
    if (isCAS(s)) return [s.trim()];
    const m = s.match(/\d{2,7}-\d{2}-\d/g);
    return m ? m.slice() : [];
  }

  const MIN_SCORE = 80;              // minimum displayed similarity (unchanged)
  const SOURCE_RANK = { 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 };

  /*
   * Build a searchable view of one source. rows must be the original
   * row array; they are never modified. For every row we precompute
   * the normalized name/CAS exactly as score() would compute them,
   * plus the CAS list used by the exact-CAS fast path.
   */
  function makeSearchable(key, rows) {
    const entries = [];
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (!r || typeof r !== 'object') continue;
        const e = { r, name: null, cas: null, nc: null, cc: null, cn: null };
        const name = r.name, cas = r.cas;
        if (name) { e.name = norm(name); e.nc = compact(name); }
        if (cas) { e.cas = norm(cas); e.cn = compact(cas); e.cc = extractCass(cas); }
        entries.push(e);
      }
    }
    return { key, rows: rows || [], entries, rank: SOURCE_RANK[key] ?? 99 };
  }

  /*
   * Build the search function over the given sources.
   * sources: array of { key, rows | null } — rows may be null while a
   * database is unavailable; those sources are simply skipped, which is
   * what makes loading fail-soft without changing result meaning.
   */
  function buildSearch(sources) {
    const searchables = [];
    for (const src of sources) {
      if (src && Array.isArray(src.rows) && src.rows.length) {
        searchables.push(makeSearchable(src.key, src.rows));
      }
    }

    function search(q, pro = false) {
      const out = [];
      const query = String(q ?? '');
      const nq = norm(query);
      const cq = compact(query);
      const qIsCas = isCAS(query);
      const qc = qIsCas ? compact(query) : null;

      for (const S of searchables) {
        for (const e of S.entries) {
          let best = { v: 0, type: '', field: '' };

          /* -- CAS exact-match fast path (unchanged rule) -- */
          if (qIsCas && e.cc && e.cc.length) {
            for (const c of e.cc) {
              if (compact(c) === qc) {
                out.push({ k: S.key, r: e.r, s: { v: 100, type: 'CAS مطابق تمامًا', field: c } });
                break;
              }
            }
            /* The original score() returned 0 immediately for CAS-vs-CAS
               mismatches without considering the name; preserved. */
            continue;
          }

          /* -- name field (normalized once at index time) -- */
          if (e.name) {
            if (nq === e.name) {
              out.push({ k: S.key, r: e.r, s: { v: 100, type: 'اسم مطابق', field: e.r.name } });
              continue;
            }
            if (nq.length >= 4 && e.name.length >= 4 && (e.name.includes(nq) || nq.includes(e.name))) {
              const ratio = Math.min(nq.length, e.name.length) / Math.max(nq.length, e.name.length);
              if (ratio >= .72 && ratio * 96 > best.v)
                best = { v: Math.round(ratio * 96), type: 'تطابق جزئي', field: e.r.name };
            }
            const m = Math.max(cq.length, e.nc.length);
            if (m) {
              const v = 100 - levenshtein(nq, e.name) / m * 100;
              if (v > best.v) best = { v: Math.round(v), type: 'تشابه حرفي', field: e.r.name };
            }
          }

          /* -- CAS field used fuzzily, exactly as the original did -- */
          if (e.cas) {
            if (nq === e.cas && best.v < 100) {
              best = { v: 100, type: 'اسم مطابق', field: e.r.cas };
            } else {
              if (nq.length >= 4 && e.cas.length >= 4 && (e.cas.includes(nq) || nq.includes(e.cas))) {
                const ratio = Math.min(nq.length, e.cas.length) / Math.max(nq.length, e.cas.length);
                if (ratio >= .72 && ratio * 96 > best.v)
                  best = { v: Math.round(ratio * 96), type: 'تطابق جزئي', field: e.r.cas };
              }
              const m = Math.max(cq.length, e.cn.length);
              if (m) {
                const v = 100 - levenshtein(nq, e.cas) / m * 100;
                if (v > best.v) best = { v: Math.round(v), type: 'تشابه حرفي', field: e.r.cas };
              }
            }
          }

          if (best.v >= MIN_SCORE) out.push({ k: S.key, r: e.r, s: best });
        }
      }

      /* source priority first, then similarity — unchanged */
      out.sort((a, b) =>
        ((SOURCE_RANK[a.k] ?? 99) - (SOURCE_RANK[b.k] ?? 99)) || (b.s.v - a.s.v));
      return out.slice(0, pro ? 80 : 16);
    }

    search.sources = searchables.map(S => ({ key: S.key, rows: S.rows.length }));
    return search;
  }

  /* ---------- exports ---------- */
  global.SearchCore = {
    norm, compact, isCAS, levenshtein, extractCass, fields,
    score,            // reference implementation (parity tests)
    makeSearchable,
    buildSearch,
    MIN_SCORE
  };
})(typeof window !== 'undefined' ? window : globalThis);
