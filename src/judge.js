/*
 * src/judge.js — طبقة الحكم (المرحلة ب)
 * =============================================================
 * Decision layer OVER SearchCore — SearchCore stays untouched.
 *
 * Rules (b1-b9, from the work order):
 *  b1  Normalization keeps Arabic + Latin + digits; empty query
 *      NEVER matches (never 100).
 *  b2  CAS is the strongest key: strict format, checksum-verified,
 *      EXACT matches only (no containment, no partial). "No CAS
 *      allocated" / "see note" store as empty. Records whose stored
 *      CAS fails checksum are flagged "رقم غير صالح في المصدر" and
 *      can only match by NAME (never a confirmed CAS match).
 *  b3  Name verdicts: EXACT / PROBABLE / AMBIGUOUS only — no score
 *      governs. Probable window: 1 letter diff for 5-8 letters, 2 for
 *      longer, exact for shorter; digits set and stereo letters
 *      (E/Z/alpha/beta) must match; containment is never a verdict.
 *  b4  Arabic queries never fail silently.
 *  b5  Multi-ingredient products: judge EVERY ingredient separately.
 *  b8  Status vocabulary per source, verbatim, never merged into one
 *      verdict. Red only for the banned list. No green "safe".
 *  b9  Classification codes legend (10 official + V marked as
 *      digital-file-only definition).
 *
 * Exports (UMD-ish, browser + node):
 *   judge.normalize(text)            -> normalized string
 *   judge.casChecksum(cas)           -> true/false/null (null = not evaluable)
 *   judge.parseCasCell(cell)         -> [valid, invalid, empty] CAS list
 *   judge.judgeName(query, row)      -> 'exact'|'probable'|'similar'|null
 *   judge.lookup(query, searchFn)    -> judgement object
 *   judge.judgeIngredients(list, searchFn) -> per-ingredient results
 *   judge.STATUSES / judge.CODES     -> vocabularies
 */
(function (global) {
  'use strict';

  /* ============================================================
   * b1 — Normalization: keep Arabic + Latin + digits
   * ============================================================ */
  const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;     // harakat + tatweel
  // fold: أ إ آ ٱ -> ا ; ة -> ه ; ى -> ي ; ؤ -> و ; ئ -> ي
  const ARABIC_FOLD = [
    [/[\u0623\u0625\u0622\u0671]/g, '\u0627'],
    [/\u0629/g, '\u0647'],
    [/\u0649/g, '\u064A'],
    [/\u0624/g, '\u0648'],
    [/\u0626/g, '\u064A']
  ];
  // Latin confusables seen in OCR — folded for NAME matching only.
  const LATIN_FOLD = [
    [/[\u2010-\u2015]/g, '-'],      // dashes -> hyphen
    [/[\u00A0\u2000-\u200B]/g, ' '],// exotic spaces
    [/\u2018\u2019\u201C\u201D/g, "'"]
  ];

  function normalize(text) {
    if (text === null || text === undefined) return '';
    let s = String(text);
    for (const [re, to] of LATIN_FOLD) s = s.replace(re, to);
    s = s.replace(ARABIC_DIACRITICS, '');
    for (const [re, to] of ARABIC_FOLD) s = s.replace(re, to);
    s = s.toLowerCase();
    // unify separators around hyphens/slashes/brackets, collapse spaces
    s = s.replace(/\s*-\s*/g, '-').replace(/\s*\/\s*/g, '/').replace(/\s*\[\s*/g, '[').replace(/\s*\]\s*/g, ']');
    s = s.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }

  /* ============================================================
   * b2 — CAS handling
   * ============================================================ */
  /* checksum: last digit == sum(digit * position from right, starting 1
   * at the digit before the check) mod 10. 7732-18-5, 1071-83-6,
   * 94-75-7 all pass. */
  function casChecksum(cas) {
    const digits = String(cas || '').replace(/[^0-9]/g, '');
    if (digits.length < 5 || digits.length > 11) return null;   // not evaluable
    const chk = Number(digits[digits.length - 1]);
    let sum = 0;
    for (let i = 0; i < digits.length - 1; i++) sum += Number(digits[digits.length - 2 - i]) * (i + 1);
    return sum % 10 === chk;
  }

  /* A cell may hold several CAS numbers (the 248 list stacks alternatives
   * on separate lines: "93-76-5\n[3813-14-7]\n..."). Returns a list of
   * {cas, checksumOk}. */
  function parseCasCell(cell) {
    const out = [];
    const text = String(cell || '');
    // any run that looks like NN...-NN-N (tolerates spaces inside)
    const re = /(\d[\d ]*\d\s*-\s*\d[\d ]*\d\s*-\s*\d)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const cas = m[1].replace(/ /g, '');
      out.push({ cas: cas, checksumOk: casChecksum(cas) });
    }
    return out;
  }

  /* Free-text CAS cells that mean "no number" */
  const NO_CAS_PAT = /^no cas allocated$|^no unique cas$|^see (remark|note|notes)$|^n\/a$|^-$|^none$/i;

  function casCellIsEmpty(cell) {
    const t = String(cell || '').trim();
    if (!t) return true;
    if (NO_CAS_PAT.test(t)) return true;
    return parseCasCell(t).length === 0 && !/\d{2,}/.test(t.replace(/ /g, ''));
  }

  /* ============================================================
   * b3 — Name verdicts: EXACT / PROBABLE / SIMILAR
   * ============================================================ */
  const STEREO = /\b(e|z|alpha|beta|gamma|trans|cis)\b|\(e\)|\(z\)|\(e,e\)|\(e,z\)|\(z,z\)|\(z,e\)|\(s\)|\(r\)/g;

  function digitsOf(s) { return (s.match(/\d+/g) || []).join(' '); }

  function stereoSet(s) {
    const found = [];
    const bare = s.replace(/[()\s,]/g, '');
    const m = bare.match(/(eeee|eez|eze|ezz|zzz|zze|zee|ezz)/g);
    // simpler: collect letters e/z runs inside parentheses groups
    const groups = String(s).match(/\(([^)]*)\)/g) || [];
    for (const g of groups) {
      const letters = g.match(/[ez]/gi);
      if (letters && g.length <= 12) found.push(letters.join('').toLowerCase());
    }
    for (const w of ['alpha', 'beta', 'gamma', 'trans', 'cis']) if (s.includes(w)) found.push(w);
    return found.sort();
  }

  function hammingWithin(a, b) {
    // Levenshtein distance capped at 2 (small strings only)
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 99;
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
      if (Math.min.apply(null, cur) > 2) return 99;
    }
    return prev[n];
  }

  /* judgeName(normalizedQuery, normalizedStored) ->
   *   'exact'    : normalized equality
   *   'probable' : within the strict window AND digits match AND
   *                stereo letters match AND no containment
   *   'similar'  : containment or stereo/digit mismatch — never a verdict
   *   null       : too far
   */
  function judgeName(q, s) {
    if (!q || !s) return null;
    if (q === s) return 'exact';
    // containment either way -> similar (isomer/salt/derivative), never judged
    if (q.includes(s) || s.includes(q)) return 'similar';
    // stereochemistry must agree exactly
    const sq = stereoSet(q), ss = stereoSet(s);
    if (JSON.stringify(sq) !== JSON.stringify(ss)) return 'similar';
    // digit groups must agree exactly
    if (digitsOf(q) !== digitsOf(s)) return 'similar';
    const len = Math.min(q.length, s.length);
    let allowed;
    if (len < 5) allowed = 0;        // too short for fuzzy
    else if (len <= 8) allowed = 1;  // one letter
    else allowed = 2;                // two letters
    const d = hammingWithin(q, s);
    if (d <= allowed) return 'probable';
    return null;
  }

  /* ============================================================
   * b8 — Status vocabularies (verbatim per source, never merged)
   * ============================================================ */
  const STATUSES = {
    'libya-248': {
      label: 'قائمة المحظورات',
      tone: 'ban',                                   // the ONLY red
      title: 'مدرجة في قائمة المواد المحظورة (القائمة رقم (1)، ذو القعدة 1444 هـ)',
      note: 'رقم القرار وسنته لا يظهران في صفحات الأصل — بحسب ملف رقمي غير موثق'
    },
    'libya-500': {
      label: 'قائمة مؤقتة استثنائية (قرار 500 لسنة 2026)',
      tone: 'caution',
      map: {
        'Approved': 'معتمد مؤقتًا: يُسمح بتداوله واستيراده لمدة سنة إلى حين صدور القائمة النمطية',
        'REV':      'تداول مؤقت بشرط وجود إذن استيراد سابق؛ يتطلب مراجعة علمية قبل منح إذن استيراد جديد خلال سنة',
        'REV*':     'تداول مؤقت بشرط وجود إذن استيراد سابق؛ يتطلب مراجعة علمية — بنجمة، ومعنى النجمة غير موضح في الدليل',
        'RAR':      'تداول مؤقت بشرط وجود إذن استيراد سابق؛ يتطلب تقييم مخاطر محليًا ولا يُمنح إذن استيراد قبل صدور القائمة النمطية'
      },
      note: 'القائمة مؤقتة استثنائية سارية لمدة سنة — تحقق من سريانها'
    },
    'eu': {
      label: 'الاتحاد الأوروبي',
      tone: 'info',
      map: {
        'Approved': 'معتمد في الاتحاد الأوروبي',
        'Not approved': 'غير معتمد في الاتحاد الأوروبي (تنبيه مرجعي لا يعني حظرًا محليًا)',
        'Pending': 'قيد التقييم في الاتحاد الأوروبي'
      },
      extra: { candidate: 'مرشحة للاستبدال', basic: 'مادة أساسية', lowrisk: 'منخفضة المخاطر' },
      note: 'بيانات الاتحاد الأوروبي لا قيمة قانونية لها'
    },
    'epa': {
      label: 'USA / EPA',
      tone: 'info',
      map: {
        'مسموح': 'له تسجيل نشط لدى وكالة حماية البيئة الأمريكية (EPA Master)',
        'محظور': 'ملغى التسجيل لدى الوكالة (قد يكون بطلب الشركة، ولا يعني بالضرورة حظرًا)',
        'مقيد': 'مقيد الاستخدام (للمرخّصين)'
      },
      note: 'ملف EPA Master (PPIS) الرسمي — خمسة ملفات EPA كاملة، دفتر 2026-09-22'
    },
    'epa-cancelled': {
      label: 'USA / EPA — كل التسجيلات ملغاة',
      tone: 'amber',
      map: {
        'محظور': 'كل تسجيلات هذه المادة لدى وكالة حماية البيئة الأمريكية ملغاة (أرشيف الملغى)'
      },
      note: 'أرشيف الملغى من EPA Master (PPIS) — مرجع أرشيفي لا حكمًا محليًا'
    }
  };

  /* b9 — classification codes: 10 from the official decree legend +
   * V (digital-file definition only) */
  const CODES = {
    'I':    { en: 'Insecticide',        ar: 'مبيد حشري' },
    'F':    { en: 'Fungicide',          ar: 'مبيد فطري' },
    'A':    { en: 'Acaricide',          ar: 'مبيد عناكب / أكاروسي' },
    'N':    { en: 'Nematicide',         ar: 'مبيد نيماتودي' },
    'H':    { en: 'Herbicide',          ar: 'مبيد أعشاب' },
    'R':    { en: 'Rodenticide',        ar: 'مبيد قوارض' },
    'M':    { en: 'Molluscicide',       ar: 'مبيد نواعم / قواقع' },
    'S.Ph': { en: 'Sex Pheromone',      ar: 'فرمون جنسي' },
    'PGR':  { en: 'Plant Growth Regulator', ar: 'منظم نمو نباتات' },
    'rep':  { en: 'Repellent',          ar: 'طارد' },
    'V':    { en: 'Viruses / Microbials', ar: 'فيروسات أو كائنات دقيقة مكافحة', note: 'تعريف الملف الرقمي (غير وارد في الدليل الرسمي)' }
  };

  function describeCodes(cell) {
    if (!cell) return [];
    const out = [];
    const raw = String(cell).split(/[+/,؛;]| و /g).map(x => x.trim()).filter(Boolean);
    for (const token of raw) {
      const key = Object.keys(CODES).find(k => k.toLowerCase() === token.toLowerCase().replace(/\./g, '.'));
      if (key) out.push({ code: token, ...CODES[key] });
      else out.push({ code: token, ar: 'رمز غير معرّف في دليل القرار', en: '', unknown: true });
    }
    return out;
  }

  /* ============================================================
   * Direct exact indexes — SearchCore (80% engine) is kept untouched
   * and used for candidate DISCOVERY, but exact matching is done
   * against these indexes so a short name contained in a long stored
   * name (e.g. "2,4-D" inside "2,4-D ((2,4-dichlorophenoxy) acetic
   * acid)") still reaches its own banned-list row deterministically.
   * ============================================================ */
  let INDEX = null;

  function buildIndex(sources) {
    const nameMap = new Map();   // normalized line -> [{row, line}]
    const casMap = new Map();    // exact cas string -> [{row, casObj}]
    const addName = (row, ln) => {
      if (!ln) return;
      if (!nameMap.has(ln)) nameMap.set(ln, []);
      nameMap.get(ln).push({ row: row, line: ln });
    };
    for (const s of sources || []) {
      for (const row of s.rows || []) {
        row.source_key = row.source_key || s.key;
        for (const raw of String(row.name || '').split(/\n+/)) {
          const ln = normalize(raw);
          addName(row, ln);
          /* head segment: the common name before the first synonym
           * parenthesis group — handles NESTED brackets too, e.g.
           *  "2,4-D ((2,4-dichlorophenoxy) acetic acid)" -> "2,4-D"
           *  "Metalaxyl-M" stays "metalaxyl-m" (no parens) */
          const openIdx = raw.search(/[(\[]/);
          const head = openIdx > 0 ? normalize(raw.slice(0, openIdx)) : '';
          if (head && head !== ln) addName(row, head);
        }
        for (const c of parseCasCell(row.cas)) {
          if (!casMap.has(c.cas)) casMap.set(c.cas, []);
          casMap.get(c.cas).push({ row: row, casObj: c });
        }
      }
    }
    INDEX = { nameMap: nameMap, casMap: casMap };
    return INDEX;
  }

  /* ============================================================
   * lookup — judge ONE query against ALL four sources
   * ============================================================ */
  function lookup(query, searchFn) {
    const q = normalize(query);
    if (!q) {
      return { empty: true, verdict: null, perSource: [], message: 'استعلام فارغ — لا مطابقة' };
    }
    // CAS query?
    const qCas = parseCasCell(query);
    if (qCas.length && qCas[0].cas.replace(/-/g, '') === q.replace(/[^0-9]/g, '')) {
      return lookupCas(qCas[0], searchFn);
    }
    return lookupName(q, searchFn);
  }

  function lookupName(q, searchFn) {
    const bySource = {};
    const push = (row, verdict, extra) => {
      if (!row) return;
      const arr = bySource[row.source_key] = bySource[row.source_key] || [];
      arr.push(Object.assign({ row: row, verdict: verdict }, extra || {}));
    };

    /* 1) deterministic exact hits from the index */
    if (INDEX) {
      const exacts = INDEX.nameMap.get(q) || [];
      for (const e of exacts) push(e.row, 'exact');
    }

    /* 2) fuzzy candidates via SearchCore, re-judged under b3 rules —
     *    a SearchCore high score is necessary but NOT sufficient */
    const hits = (searchFn && searchFn(q, false)) || [];
    for (const h of hits) {
      const row = h.r;
      if (!row || !row.name) continue;
      const lines = String(row.name).split(/\n+/).map(x => normalize(x)).filter(Boolean);
      let verdict = null;
      for (const ln of lines) {
        const v = judgeName(q, ln);
        if (v === 'exact') { verdict = 'exact'; break; }
        if (v === 'probable') verdict = verdict === 'exact' ? 'exact' : 'probable';
        else if (v === 'similar' && !verdict) verdict = 'similar';
      }
      if (verdict === 'exact') {
        // already added by the index — keep one entry
        const arr = bySource[row.source_key] || [];
        if (!arr.some(e => e.row === row)) push(row, 'exact');
      } else if (verdict) {
        push(row, verdict);
      }
    }
    return buildResult('name', q, bySource);
  }

  function lookupCas(casObj, searchFn) {
    const cas = casObj.cas;
    const checksumOk = casObj.checksumOk;
    const bySource = {};
    const push = (row, casEntry, verdict) => {
      if (!row) return;
      const arr = bySource[row.source_key] = bySource[row.source_key] || [];
      if (!arr.some(e => e.row === row && e.cas === casEntry.cas)) {
        arr.push({ row: row, cas: casEntry.cas, verdict: verdict, badStored: !casEntry.checksumOk });
      }
    };

    /* 1) deterministic exact-number hits from the index */
    if (INDEX) {
      for (const e of INDEX.casMap.get(cas) || []) {
        const verdict = (e.casObj.checksumOk && checksumOk) ? 'exact' : 'probable';
        push(e.row, e.casObj, verdict);
      }
    }

    /* 2) SearchCore candidates re-checked under the strict rule:
     *    full-number equality only, no containment */
    const hits = (searchFn && searchFn(cas, true)) || [];
    for (const h of hits) {
      const row = h.r;
      if (!row) continue;
      for (const stored of parseCasCell(row.cas)) {
        if (stored.cas !== cas) continue;
        const verdict = (stored.checksumOk && checksumOk) ? 'exact' : 'probable';
        push(row, stored, verdict);
      }
    }
    return buildResult('cas', cas, bySource, { checksumOk: checksumOk });
  }

  function buildResult(kind, q, bySource, extra) {
    const perSource = [];
    for (const [src, entries] of Object.entries(bySource)) {
      // verdict per source = best of its entries; conflicting CAS across
      // two entries -> ambiguous, show both
      const exacts = entries.filter(e => e.verdict === 'exact');
      const probables = entries.filter(e => e.verdict === 'probable');
      let verdict;
      if (exacts.length) verdict = 'exact';
      else if (probables.length) verdict = 'probable';
      else verdict = 'similar';
      // ambiguity: two entries with different CAS near-tie
      const casSet = new Set(entries.map(e => parseCasCell(e.row.cas)[0] && parseCasCell(e.row.cas)[0].cas).filter(Boolean));
      const ambiguous = casSet.size > 1 && (exacts.length ? exacts.length : probables.length) > 1;
      perSource.push({
        source: src,
        verdict: verdict,
        ambiguous: ambiguous,
        entries: entries
      });
    }
    const hasExact = perSource.some(p => p.verdict === 'exact' && p.source === 'libya-248');
    return Object.assign({
      kind: kind,
      query: q,
      empty: false,
      verdict: hasExact ? 'exact' : (perSource.some(p => p.verdict === 'exact') ? 'exact' : (perSource.some(p => p.verdict === 'probable') ? 'probable' : (perSource.length ? 'similar' : null))),
      perSource: perSource
    }, extra || {});
  }

  /* b5 — multi-ingredient: judge EVERY ingredient, never merge */
  function judgeIngredients(list, searchFn) {
    return (list || []).map(x => {
      const r = lookup(x, searchFn);
      return Object.assign({ ingredient: x }, r);
    });
  }

  /* Export */
  const judge = {
    normalize, casChecksum, parseCasCell, casCellIsEmpty,
    judgeName, lookup, judgeIngredients, buildIndex,
    STATUSES, CODES, describeCodes,
    _internals: { stereoSet, digitsOf, hammingWithin }
  };
  global.judge = judge;
  if (typeof module !== 'undefined' && module.exports) module.exports = judge;
})(typeof window !== 'undefined' ? window : globalThis);
