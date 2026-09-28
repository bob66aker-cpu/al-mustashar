/*
 * src/cards.js — مكونات العرض المشتركة (جولة الواجهة 2026-09-28)
 * ---------------------------------------------------------------------------
 * بنية واحدة تتفرّع بـ(اللغة × الوضع × الجهة التنظيمية) — ليست أربع
 * واجهات منفصلة. كل بطاقة تُبنى من كتل صغيرة تُستدعى أو تُحذف حسب السياق:
 *
 *   head · statusBlock · categoryBlock · casBlock · matchTypeBlock ·
 *   provenanceBlock · notesBlock · jurisdictionCaveat
 *
 * القواعد التي لا تساوم عليها:
 *  1) لا نسبة مئوية «تطابق %» في أي بطاقة — نوع مطابقة صريح فقط
 *     (تطابق CAS + اسم / تطابق اسم فقط — مرشح / رقم مشترك / تطابق جزئي).
 *  2) الحالة دائمًا ثلاثية: لون + أيقونة + نص، وشرح الرمز كاملًا داخل
 *     البطاقة في وضع المزارع (لا يُترك للط(popover) وحده).
 *  3) التصنيف الوظيفي سطر مستقل بخط كبير واضح مع شرحه الكامل.
 *  4) مفرده «لا يحكم» — كل نص يأتي من قاموس i18n، ولا شيء يُستنتج.
 *  5) لا يلمس هذا الملف بيانات المصدر ولا محرّك البحث: هو عرض فقط.
 */
(function (global) {
  'use strict';

  var LIBYA = ['libya-248', 'libya-500'];

  function create(deps) {
    var t = deps.t, tf = deps.tf, esc = deps.esc;
    var catTitle = deps.catTitle, statusDisplay = deps.statusDisplay;
    var sourceLabel = deps.sourceLabel, statusExplain = deps.statusExplain;
    var casApi = deps.casApi || null;
    var dataVersion = deps.dataVersion || function () { return ''; };
    var sourceKeys = deps.sourceKeys || [];

    /* ---------- shared-CAS index (read-only, built from the loaded data) ---
     * A CAS number that several DIFFERENT substances carry cannot identify a
     * substance on its own. The label then says so instead of pretending the
     * number is decisive. Nothing is written back to the data. */
    var casIndex = null;
    function buildCasIndex(DB) {
      var map = {};
      Object.keys(DB || {}).forEach(function (k) {
        (DB[k].rows || []).forEach(function (r) {
          var cas = String(r.cas || '').trim();
          if (!cas || /see |no cas|remark|note/i.test(cas)) return;
          cas.split(/[\n[\]]/).forEach(function (one) {
            one = one.trim();
            if (!/^[0-9]{2,7}-[0-9]{2}-[0-9]$/.test(one)) return;
            if (!map[one]) map[one] = { names: {}, refs: 0 };
            map[one].names[String(r.name_norm || r.name || '').trim().toLowerCase()] = 1;
            map[one].refs++;
          });
        });
      });
      casIndex = map;
    }
    function isSharedCas(row) {
      if (!casIndex) return false;
      var cas = String((row && row.cas) || '').trim().split(/[\n[\]]/)[0].trim();
      if (!cas || !/^[0-9]{2,7}-[0-9]{2}-[0-9]$/.test(cas)) return false;
      var e = casIndex[cas];
      return !!(e && Object.keys(e.names).length > 1);
    }

    /* ---------- match type: an explicit word, never a percentage ---------- */
    function normName(s) {
      return String(s || '').toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
    }
    function matchKind(x, q) {
      var type = String((x.s && x.s.type) || '');
      var isCas = /CAS/.test(type);
      var isExact = /مطابق/.test(type) && !/جزئي|حرفي/.test(type);
      var rowName = normName(x.r && x.r.name);
      var qName = normName(q);
      var nameHit = !!qName && (rowName === qName || rowName.indexOf(qName) === 0);
      var shared = isSharedCas(x.r);
      if (isCas && isExact && nameHit) return { key: 'mt.cas-name', shared: shared };
      if (!isCas && isExact && nameHit) return { key: 'mt.name', shared: shared };
      if (isCas && isExact) return { key: 'mt.shared', shared: true };
      return { key: 'mt.partial', shared: shared };
    }

    /* ---------- blocks ---------- */
    function head(x, ctx) {
      return '<div class="result-top"><div>'
        + '<span class="source">' + esc(sourceLabel(x.k)) + '</span>'
        + '<h3>' + esc(x.r.name || t('results.noname', 'بدون اسم')).replace(/\n/g, ' · ') + '</h3>'
        + '</div></div>';
    }

    /* status = colour + icon + text, and the FULL explanation inside the card
     * (farmer mode used to leave it to a popover — a phone user never opens it) */
    function statusBlock(x, ctx) {
      var sd = statusDisplay(x.r, x.k, ctx.mode === 'pro');
      var tone = sd.tone === 'banned' ? 'ban' : (sd.tone === 'amber' ? 'review' : 'neutral');
      var icon = tone === 'ban' ? 'ban' : (tone === 'review' ? 'caution' : 'check');
      var explain = '';
      if (x.k === 'libya-500') explain = statusExplain(x.r.status) || '';
      else if (x.k === 'libya-248') explain = t('card.status.banned.248', 'مدرجة في قائمة المواد المحظورة (قرار ليبيا 248).');
      if (!explain && ctx.mode === 'pro' && x.r.status_raw) explain = String(x.r.status_raw);
      return '<p class="status tone-' + tone + '"><span class="st-ic" data-icon="' + icon + '"></span>'
        + '<span class="st-txt">' + esc(sd.text) + '</span></p>'
        + (explain ? '<p class="st-explain-full">' + esc(explain) + '</p>' : '')
        + (ctx.mode === 'pro' && sd.chip ? sd.chip : '');
    }

    /* functional category: its own line, large type, full meaning */
    function categoryBlock(x, ctx) {
      if (!x.r.category) return '';
      var chips = String(x.r.category).split(/\n+/).filter(Boolean).map(function (c) {
        var meaning = catTitle(c);
        return '<span class="cat-line"><span class="cat-code" tabindex="0" role="button" data-cat="' + esc(c) + '">'
          + esc(c) + '</span><span class="cat-meaning">' + esc(meaning || t('legend.cat.unknown', 'رمز غير مشروح في دليل هذا المصدر')) + '</span></span>';
      }).join('');
      return '<p class="match cat-block">' + t('results.source.category', 'التصنيف كما ورد في المصدر:') + '</p>'
        + '<div class="cat-list">' + chips + '</div>';
    }

    function casBlock(x) {
      var list = casApi ? casApi.casOf(x) : '';
      if (!list) {
        return x.r.cas
          ? '<p class="meta">' + esc(String(x.r.cas).replace(/\n/g, ' · '))
            + ' <span class="nocas">(' + esc(t('cas.nocas', 'بلا رقم في المصدر')) + ')</span></p>'
          : '';
      }
      var html = list.split(',').map(function (c) {
        return casApi.casChecksum(c) === false
          ? '<span class="cas-bad" title="' + esc(t('cas.badsum', 'رقم التحقق غير صحيح في بيانات المصدر')) + '">' + esc(c) + '</span>'
          : esc(c);
      }).join(' · ');
      if (casApi.casDisplayCorrected) {
        var corr = casApi.casDisplayCorrected(x.r);
        if (corr && list === corr) {
          var raw = casApi.casDisplayRaw(x.r);
          var srcKey = casApi.casSourceKey(x.r);
          var stereo = casApi.casStereo ? casApi.casStereo(x.r) : '';
          html = esc(corr) + (stereo ? ' ' + esc(stereo) : '')
            + ' <span class="cas-raw-old">' + esc(raw) + '</span>'
            + ' <span class="cas-src">(' + esc(t('cas.source.' + srcKey, srcKey === 'epa-master' ? 'مُصحح من EPA Master' : 'مصحح')) + ')</span>';
        }
      }
      return '<p class="meta">' + esc(t('cas.label', 'CAS:')) + ' ' + html + '</p>' + notesBlock(x);
    }

    function notesBlock(x) {
      if (!casApi) return '';
      var out = '';
      var sug = casApi.casSuggested ? casApi.casSuggested(x.r) : [];
      if (sug.length) {
        var sugSrc = String(x.r.cas_source || '').trim();
        out += '<p class="cas-note">' + esc(t('cas.suggested', 'قيم مقترحة موثقة المصدر — ليست بديلًا عن قيمة المرسوم:')) + ' '
          + esc(sug.join(' · '))
          + (sugSrc ? ' <span class="cas-src">(' + esc(t('cas.source.' + sugSrc, sugSrc)) + ')</span>' : '') + '</p>';
      }
      if (casApi.casFlag && casApi.casFlag(x.r) === 'stereo-ambiguous')
        out += '<p class="cas-note warn"><span class="badge warn">' + esc(t('cas.stereo.badge', 'الرقم غير محسوم')) + '</span> '
          + esc(t('cas.stereo.note', 'الرقم المصحح يخص (+)-Carvone؛ اسم الصف عام لا يحسم المتماكب (الراسيمي 99-49-0) — الهوية تتطلب مراجعة بشرية')) + '</p>';
      var rev = casApi.casReview ? casApi.casReview(x.r) : '';
      if (rev) out += '<p class="cas-note">' + esc(t('cas.review', 'ملاحظة مراجعة (لا رقم مؤكَّد):')) + ' ' + esc(rev) + '</p>';
      var cNote = casApi.casNote ? casApi.casNote(x.r) : '';
      if (cNote) out += '<p class="cas-note warn"><span class="badge warn">' + esc(t('cas.note.badge', 'تنبيه الرقم')) + '</span> ' + esc(cNote) + '</p>';
      var dup = casApi.casDuplicateNote ? casApi.casDuplicateNote(x.r) : '';
      if (dup) out += '<p class="cas-note"><span class="badge">' + esc(t('cas.dup.badge', 'صف مكرر')) + '</span> ' + esc(dup) + '</p>';
      return out;
    }

    function matchTypeBlock(x, q) {
      var m = matchKind(x, q);
      return '<p class="match mt-line"><span class="mt-label">' + esc(t('mt.label', 'نوع المطابقة')) + ':</span> '
        + '<span class="mt-value">' + esc(t(m.key, 'تطابق جزئي — مرشح')) + '</span>'
        + (m.shared ? ' <span class="cas-note inline">' + esc(t('mt.shared.note', 'هذا الرقم مستخدم لأكثر من مادة — تأكد من الاسم.')) + '</span>' : '')
        + '</p>';
    }

    function provenanceBlock(x) {
      var v = dataVersion(x.k);
      return v ? '<p class="match prov-line">' + esc(t('card.dataVersion', 'نسخة البيانات')) + ': ' + esc(v) + '</p>' : '';
    }

    function jurisdictionCaveat() {
      return '<p class="caveat-jur">' + esc(t('card.jurisdiction.caveat',
        'الولاية القانونية تختلف بين المصادر — نتيجة مصدر لا تُطبَّق على مصدر آخر.')) + '</p>';
    }

    /* the farmer-alert card: red ONLY when the result is a prohibition, and
     * then always with icon + text (colour never speaks alone) */
    function farmerAlert(x) {
      var banned = x.k === 'libya-248';
      return '<div class="farmer-alert ' + (banned ? 'is-banned' : 'is-listed') + '">'
        + '<span class="alert-ic" data-icon="' + (banned ? 'ban' : 'info') + '"></span>'
        + '<span>' + esc(banned
          ? tf('alert.banned', 'مادة محظورة: {name}', { name: String(x.r.name || '').split('\n')[0] })
          : tf('alert.listed', 'المادة مذكورة في هذا المصدر: {name}', { name: String(x.r.name || '').split('\n')[0] })) + '</span>'
        + '</div>';
    }

    /* ---------- the card: one structure, branched by context ---------- */
    function card(x, q, ctx) {
      var farmer = ctx.mode !== 'pro';
      var out = head(x, ctx);
      out += statusBlock(x, ctx);
      out += categoryBlock(x, ctx);
      if (!farmer) {
        out += matchTypeBlock(x, q);
        out += casBlock(x);
        out += provenanceBlock(x);
      }
      if (ctx.lang === 'en') out += jurisdictionCaveat();
      if (farmer && ctx.lang === 'en') out += farmerAlert(x);
      if (farmer) {
        out += '<p class="caution">' + esc(t('results.caution',
          'تطابق محتمل، راجع الاسم والملصق قبل الاستخدام.')) + '</p>';
      }
      return '<article class="result" data-src="' + esc(x.k) + '" data-ctx="'
        + esc(ctx.lang + '-' + ctx.mode) + '">' + out + '</article>';
    }

    /* ---------- context filtering / ordering ---------- */
    function applyContext(results, ctx) {
      var list = results.slice();
      var picked = ctx.lang === 'en' && ctx.jurisdiction ? ctx.jurisdiction : '';
      if (ctx.mode !== 'pro') {
        /* Farmer rules, in order of specificity:
         *  1) an explicitly chosen jurisdiction wins (English farmer only);
         *  2) otherwise Libya only — the SAME rule for the search view and
         *     the scan view, which used to disagree. */
        if (picked) list = list.filter(function (x) { return x.k === picked; });
        else list = list.filter(function (x) { return LIBYA.indexOf(x.k) !== -1; });
      } else if (picked) {
        list.sort(function (a, b) {
          var pa = a.k === picked ? 0 : 1, pb = b.k === picked ? 0 : 1;
          return pa - pb || b.s.v - a.s.v;
        });
      }
      return list;
    }

    /* ---------- the English farmer jurisdiction picker ---------- */
    function jurisdictionPicker(ctx) {
      var opts = sourceKeys.map(function (k) {
        var on = k === ctx.jurisdiction;
        return '<button type="button" class="jur-chip' + (on ? ' is-on' : '') + '" data-jur="' + esc(k) + '"'
          + ' aria-pressed="' + (on ? 'true' : 'false') + '">'
          + '<span data-icon="' + (k === 'libya-248' ? 'ban' : (k === 'epa-cancelled' ? 'ban' : 'shield')) + '"></span>'
          + '<span>' + esc(sourceLabel(k)) + '</span></button>';
      }).join('');
      return '<section class="card jur-card" id="jurCard">'
        + '<h3>' + esc(t('jur.title', 'اختر الجهة التنظيمية')) + '</h3>'
        + '<p class="jur-sub">' + esc(t('jur.sub', 'ستظهر النتائج من هذه الجهة وحدها.')) + '</p>'
        + '<div class="jur-row" id="jurRow" role="group" aria-label="' + esc(t('jur.title', 'اختر الجهة التنظيمية')) + '">' + opts + '</div>'
        + '<p class="jur-note"><span data-icon="info"></span> ' + esc(t('jur.note',
          'نتيجة من جهة خارجية ليست حكمًا قانونيًا داخل ليبيا — استشر قرار ليبيا المعتمد.')) + '</p>'
        + '</section>';
    }

    return {
      card: card,
      applyContext: applyContext,
      jurisdictionPicker: jurisdictionPicker,
      buildCasIndex: buildCasIndex,
      isSharedCas: isSharedCas,
      matchKind: matchKind,
      LIBYA: LIBYA
    };
  }

  global.Cards = { create: create };
})(typeof window !== 'undefined' ? window : globalThis);
