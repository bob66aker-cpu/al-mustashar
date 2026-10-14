/* src/irsheed.js — محرك الإرشاد الزراعي «إرشاد» (جولة D59)
 * =========================================================
 * العقد:
 *   Irsheed.init({ t, lang, lookupIngredient })  — تُنادى مرة من app.js.
 *   Irsheed.mount()                              — تُنادى عند فتح #/advice.
 *
 * الضمانات:
 *   - لا يقرأ الشبكة سوى حزمة data/advice/* من نفس النطاق (البوابات تقيسها).
 *   - لا innerHTML ولا نص أفلام: كل عنصر createElement + textContent.
 *   - applies_if يُقيَّم ضد ملف مزرعتك: بند بشروط غير مضبوطة يُخفى ويُعدَّ
 *     في تلميح «أكمل ملف مزرعتك» — لا يُعرض إرشاد لا ينطبق على مزارع آخر.
 *   - الخيار الكيميائي الذي يطابق مادته حكماً (محظور) في قواعد البيانات
 *     النشطة يُستبعد ويُعدَّ في شريط صريح — لا يختفي بلا أثر.
 *   - كل نصّ مرئي يمرّ عبر t() بالعربية افتراضياً؛ لغات الواجهة من
 *     القاموس، ونص البطاقات العلمي يبقى عربياً مع تنويه معلن للغات أخرى.
 */
(function (global) {
  'use strict';

  var deps = null;
  var S = { mf: null, mod: null, crops: {}, ctx: null, crop: null, wired: false,
    doss: null, inf: {}, ref: {}, type: '', searchWired: false };
  var LS_CTX = 'mustashar-advice-ctx';
  var LS_CROP = 'mustashar-advice-crop';

  /* ---------- أدوات ---------- */
  function t(k, fb) { return deps.t(k, fb); }
  function lang() { return String(deps.lang() || 'ar'); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(cls, label, onClick) {
    var b = el('button', cls, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  function cropLabel(c) {
    var l = lang();
    var name = l === 'fr' ? (c.name_fr || c.name_en) : (l === 'ar' ? null : c.name_en);
    return name || c.name_ar;
  }
  function modLabel(v) {
    var l = lang();
    if (l === 'fr') return v.label_fr || v.label_ar;
    if (l === 'ar') return v.label_ar;
    return v.label_en || v.label_ar;
  }
  function modValueLabel(val) {
    var l = lang();
    if (l === 'fr') return val.fr || val.ar;
    if (l === 'ar') return val.ar;
    return val.en || val.ar;
  }
  function store(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  /* ---------- التحميل (من كاش الخدمة إن وُجد) ---------- */
  function loadJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> ' + r.status);
      return r.json();
    });
  }
  function ensureBase() {
    if (S.mf && S.mod && S.doss) return Promise.resolve(S.mf);
    return Promise.all([
      loadJSON('data/advice/manifest.json'),
      loadJSON('data/advice/modifiers.json')
    ]).then(function (pair) {
      S.mf = pair[0]; S.mod = pair[1];
      return loadJSON((S.mf.infections && S.mf.infections.dossiers_file) || 'data/advice/dossiers.json');
    }).then(function (doss) {
      S.doss = doss;
      S.ctx = store(function () { return JSON.parse(localStorage.getItem(LS_CTX)); }, null) || {};
      S.crop = store(function () { return localStorage.getItem(LS_CROP); }, '') || '';
      return S.mf;
    });
  }
  function loadCrop(id) {
    if (S.crops[id]) return Promise.resolve(S.crops[id]);
    var entry = (S.mf.crops || []).filter(function (c) { return c.id === id; })[0];
    if (!entry) return Promise.reject(new Error('crop:' + id));
    if (!entry.file) { S.crops[id] = { cards: [] }; return Promise.resolve(S.crops[id]); }
    return loadJSON(entry.file).then(function (d) { S.crops[id] = d; return d; });
  }
  function cropEntry(id) {
    return (S.mf.crops || []).filter(function (c) { return c.id === id; })[0] || null;
  }
  function loadInf(id) {
    if (S.inf[id]) return Promise.resolve(S.inf[id]);
    var e = cropEntry(id);
    if (!e || !e.inf) return Promise.resolve(null);
    return loadJSON(e.inf).then(function (d) { S.inf[id] = d; return d; });
  }
  function loadRef(id) {
    if (S.ref[id]) return Promise.resolve(S.ref[id]);
    var e = cropEntry(id);
    if (!e || !e.inf) return Promise.resolve(null);
    return loadJSON(e.inf.replace(/\.json$/, '.ref.json')).then(function (d) { S.ref[id] = d; return d; });
  }

  /* ---------- قواعد التطبيق ---------- */
  function evalApplies(ap, ctx) {
    if (!ap) return { ok: true, missing: 0 };
    var missing = 0;
    for (var k in ap) {
      var v = ctx ? ctx[k] : '';
      if (!v) { missing++; continue; }
      if (ap[k].indexOf(v) < 0) return { ok: false, missing: 0 };
    }
    return missing ? { ok: false, missing: missing } : { ok: true, missing: 0 };
  }

  /* تحضير بطاقة: فلترة الأقسام + استبعاد المحظور بعدّاد */
  function prepare(card) {
    var ctx = S.ctx || {};
    var out = { card: card, hiddenCtx: 0, blockedCount: 0, lists: {}, opts: [] };
    ['cultural', 'nutrition', 'non_chemical', 'prevention'].forEach(function (sec) {
      var keep = [];
      (card[sec] || []).forEach(function (it) {
        var ev = evalApplies(it.applies_if, ctx);
        if (ev.ok) keep.push(it);
        else if (ev.missing) out.hiddenCtx++;
      });
      out.lists[sec] = keep;
    });
    var seenBadge = {};
    ((card.chemical && card.chemical.options) || []).forEach(function (op) {
      var banned = false, badges = [];
      (op.ingredients || []).forEach(function (ing) {
        var hit = deps.lookupIngredient(ing);
        if (!hit) return;
        if (hit.banned) banned = true;
        var sig = hit.source + '|' + hit.text;
        if (!seenBadge[sig]) { seenBadge[sig] = hit; badges.push(hit); }
      });
      if (banned) out.blockedCount++;
      else out.opts.push({ op: op, badges: badges });
    });
    return out;
  }

  /* ---------- رسم الملف ---------- */
  function renderFarm(fields) {
    fields.textContent = '';
    var mods = S.mod.modifiers || {};
    Object.keys(mods).forEach(function (key) {
      var wrap = el('div', 'af-row');
      var lab = el('label', 'af-label', modLabel(mods[key]));
      lab.setAttribute('for', 'af-' + key);
      var sel = el('select', 'af-select');
      sel.id = 'af-' + key;
      var unknown = el('option', '', t('advice.unknown', 'غير محدد'));
      unknown.value = '';
      sel.appendChild(unknown);
      (mods[key].values || []).forEach(function (val) {
        var o = el('option', '', modValueLabel(val));
        o.value = val.id;
        sel.appendChild(o);
      });
      sel.value = (S.ctx && S.ctx[key]) || '';
      sel.addEventListener('change', function () {
        if (!S.ctx) S.ctx = {};
        S.ctx[key] = sel.value;
      });
      wrap.appendChild(lab); wrap.appendChild(sel);
      fields.appendChild(wrap);
    });
  }

  /* ---------- رسم شبكة المحاصيل ---------- */
  function normQ(x) {
    return String(x || '').toLowerCase()
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ').trim();
  }
  function filterCrops() {
    var qEl = document.getElementById('adviceCropSearch');
    var q = normQ(qEl ? qEl.value : '');
    var box = document.getElementById('adviceCrops');
    if (!box) return;
    var shown = 0;
    Array.prototype.forEach.call(box.children, function (b) {
      var ok = !q || normQ(b.getAttribute('data-label')).indexOf(q) >= 0;
      b.hidden = !ok;
      if (ok) shown++;
    });
  }
  function wireCropSearch() {
    if (S.searchWired) return;
    var qEl = document.getElementById('adviceCropSearch');
    if (!qEl) return;
    qEl.addEventListener('input', filterCrops);
    S.searchWired = true;
  }
  function renderCrops() {
    var box = document.getElementById('adviceCrops');
    if (!box) return;
    box.textContent = '';
    (S.mf.crops || []).forEach(function (c) {
      var b = btn('crop-chip' + (S.crop === c.id ? ' active' : ''), cropLabel(c), function () {
        S.crop = c.id;
        S.type = '';
        store(function () { localStorage.setItem(LS_CROP, c.id); });
        renderCrops();
        showCards();
      });
      b.setAttribute('data-crop', c.id);
      b.setAttribute('data-label',
        [c.name_ar, c.name_en, c.name_fr].filter(Boolean).join(' '));
      var ic = el('span', 'crop-ic');
      ic.setAttribute('data-icon', 'mode-farmer');
      b.insertBefore(ic, b.firstChild);
      box.appendChild(b);
    });
    if (global.UIIcons) global.UIIcons.paint(box);
    var qEl = document.getElementById('adviceCropSearch');
    if (qEl) {
      qEl.hidden = (S.mf.crops || []).length <= 24;
      wireCropSearch();
      filterCrops();
    }
  }

  /* ---------- مكوّنات البطاقة ---------- */
  function evBadge(ev) {
    var map = { A: 'advice.ev.A', B: 'advice.ev.B', C: 'advice.ev.C' };
    var fb = { A: 'أساس قوي', B: 'أساس جيد', C: 'دليل أولي' };
    var s = el('span', 'ev ev-' + ev, ev + ' · ' + t(map[ev], fb[ev]));
    s.title = t(map[ev] + '.full', fb[ev] + ' — موضّح في المصادر');
    return s;
  }
  function itemNode(it, tag) {
    var li = el(tag || 'li', 'adv-item');
    li.appendChild(el('span', 'adv-text', it.text_ar));
    li.appendChild(evBadge(it.evidence));
    return li;
  }
  function sectionNode(titleKey, titleFb, items, tag) {
    var sec = el('section', 'ac-sec');
    sec.appendChild(el('h4', 'ac-sec-title', t(titleKey, titleFb)));
    var ul = el('ul', 'ac-list');
    items.forEach(function (it) { ul.appendChild(itemNode(it, tag)); });
    sec.appendChild(ul);
    return sec;
  }
  function chipNode(hit) {
    var c = el('span', 'reg-chip tone-' + (hit.tone || 'neutral'), hit.text);
    c.title = hit.source || '';
    return c;
  }

  function cardNode(prepped) {
    var card = prepped.card;
    var art = el('article', 'advice-card');
    var head = el('header', 'ac-head');
    head.appendChild(el('h3', 'ac-name', card.problem.name_ar));
    var loc = card.local_status || {};
    var locKey = loc.libya === 'verified' ? 'advice.local.verified' : 'advice.local.unverified';
    var locFb = loc.libya === 'verified' ? 'موثّق محلياً' : 'غير موثّق محلياً';
    var locChip = el('span', 'loc-chip' + (loc.libya === 'verified' ? ' ok' : ''), t(locKey, locFb));
    locChip.title = loc.note_ar || '';
    head.appendChild(locChip);
    art.appendChild(head);

    /* 1) تأكيد أولاً */
    var cf = card.confirm_first || {};
    var box = el('div', 'ac-confirm');
    box.appendChild(el('h4', 'ac-sec-title', t('advice.card.confirm', 'تأكد أولاً — لا يشخّص التطبيق')));
    box.appendChild(el('p', 'ac-intro', cf.intro_ar || ''));
    box.appendChild(el('p', 'ac-sub', t('advice.signs', 'علامات تُراها')));
    var ul = el('ul', 'ac-list');
    (cf.signs_ar || []).forEach(function (s) { ul.appendChild(el('li', 'adv-item', s)); });
    box.appendChild(ul);
    if ((cf.lookalikes || []).length) {
      box.appendChild(el('p', 'ac-sub', t('advice.lookalikes', 'قد يُشبهها')));
      var ll = el('ul', 'ac-list lookalikes');
      (cf.lookalikes || []).forEach(function (lk) {
        var li = el('li', 'adv-item lookalike');
        var row = el('div', 'lk-row');
        row.appendChild(el('strong', 'lk-name', lk.name_ar));
        row.appendChild(evBadge(lk.evidence));
        li.appendChild(row);
        li.appendChild(el('span', 'adv-text', lk.note_ar));
        ll.appendChild(li);
      });
      box.appendChild(ll);
    }
    if ((cf.lab_tests_ar || []).length) {
      box.appendChild(el('p', 'ac-sub', t('advice.lab', 'فحص يطلبه المختص')));
      var lb = el('ul', 'ac-list');
      (cf.lab_tests_ar || []).forEach(function (s) { lb.appendChild(el('li', 'adv-item', s)); });
      box.appendChild(lb);
    }
    art.appendChild(box);

    /* 2) الإرشاد الزراعي */
    if (prepped.lists.cultural.length)
      art.appendChild(sectionNode('advice.sec.cultural', 'إرشاد زراعي وقائي', prepped.lists.cultural));
    if (prepped.lists.nutrition.length)
      art.appendChild(sectionNode('advice.sec.nutrition', 'التغذية والتسميد', prepped.lists.nutrition));

    /* 3) الشق المرخّص */
    var ch = card.chemical || {};
    var csec = el('section', 'ac-sec licensed');
    csec.appendChild(el('h4', 'ac-sec-title', t('advice.licensed', 'مبيدات ومواد مرخّصة')));
    csec.appendChild(el('p', 'ac-note', ch.note_ar || ''));
    prepped.opts.forEach(function (o) {
      var op = o.op;
      var g = el('div', 'chem-opt');
      g.appendChild(el('div', 'chem-group', op.group_ar));
      var ing = el('div', 'chem-ing');
      ing.appendChild(el('span', 'chem-ing-names',
        (op.ingredients || []).map(function (i) { return i.ar + ' (' + i.en + ')'; }).join(' · ')));
      var fr = el('span', 'frac-badge', op.moa_scheme + ' ' + (op.moa || '—'));
      fr.title = op.moa_note_ar || '';
      ing.appendChild(fr);
      g.appendChild(ing);
      var chips = el('div', 'reg-chips');
      o.badges.forEach(function (hit) { chips.appendChild(chipNode(hit)); });
      if (chips.childNodes.length) g.appendChild(chips);
      g.appendChild(el('div', 'chem-row', t('advice.timing', 'التوقيت') + ': ' + op.timing_ar));
      var caution = el('div', 'chem-caution', t('advice.caution', 'تحذير') + ': ' + op.caution_ar);
      g.appendChild(caution);
      var meta = el('div', 'chem-meta');
      meta.appendChild(evBadge(op.evidence));
      g.appendChild(meta);
      csec.appendChild(g);
    });
    if (prepped.blockedCount) {
      var ban = el('div', 'blocked-banner',
        t('advice.blocked', 'استُبعد خيار لحظر موثّق في قواعد البيانات ({n})')
          .replace('{n}', String(prepped.blockedCount)));
      csec.appendChild(ban);
    }
    art.appendChild(csec);

    /* 4) الشق غير المرخّص */
    if (prepped.lists.non_chemical.length)
      art.appendChild(sectionNode('advice.sec.nonchemical', 'بدائل غير كيميائية', prepped.lists.non_chemical));
    if (prepped.lists.prevention.length)
      art.appendChild(sectionNode('advice.sec.prevention', 'وقاية وتجنّب', prepped.lists.prevention));

    /* 5) متى تطلب مختصاً */
    var ex = el('div', 'ac-expert');
    ex.appendChild(el('h4', 'ac-sec-title', t('advice.expert', 'اطلب مختصاً إذا…')));
    var eu = el('ul', 'ac-list');
    (card.see_expert_when_ar || []).forEach(function (s) { eu.appendChild(el('li', 'adv-item', s)); });
    ex.appendChild(eu);
    art.appendChild(ex);

    /* 6) المصادر */
    var src = el('footer', 'ac-sources');
    src.appendChild(el('h4', 'ac-sec-title', t('advice.sources', 'المصادر')));
    var typeMap = {
      extension: ['advice.src.extension', 'إرشاد جامعي'],
      government: ['advice.src.government', 'جهة حكومية'],
      org: ['advice.src.org', 'منظمة دولية'],
      journal: ['advice.src.journal', 'دراسة محكّمة'],
      company: ['advice.src.company', 'مصدر تجاري']
    };
    (card.sources || []).forEach(function (s) {
      var li = el('li', 'src-item');
      var a = el('a', 'src-link', s.title);
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      li.appendChild(a);
      var tm = typeMap[s.type] || typeMap.org;
      li.appendChild(el('span', 'src-meta', s.publisher + ' · ' + t(tm[0], tm[1])));
      src.appendChild(li);
    });
    art.appendChild(src);

    /* 7) أشرطة الحالة */
    if (prepped.hiddenCtx) {
      var hint = el('div', 'ctx-banner');
      hint.appendChild(el('span', '',
        t('advice.ctx.hidden', 'إرشاد ({n}) يظهر بعد إكمال ملف مزرعتك').replace('{n}', String(prepped.hiddenCtx))));
      hint.appendChild(btn('btn-outline ctx-cta', t('advice.ctx.cta', 'أكمل الملف'), function () {
        var c = document.getElementById('adviceFarmCard');
        if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); c.classList.add('pulse'); setTimeout(function () { c.classList.remove('pulse'); }, 1200); }
      }));
      art.appendChild(hint);
    }
    if (lang() !== 'ar') art.appendChild(el('p', 'langnote', t('advice.langnote', 'نص الإرشاد العلمي متاح حالياً بالعربية، والأسماء العلمية دولية لاتينية في كل اللغات، والمصادر مرفقة بروابطها بلغتها الأصلية.')));
    return art;
  }

  /* ---------- خطوة النوع + بطاقات الإصابات المرقّمة (D61) ---------- */
  var TYPE_I18N = {
    insect: 'advice.type.insect', mite: 'advice.type.mite', fungus: 'advice.type.fungus',
    pseudo_fungus: 'advice.type.pseudo_fungus', bacterium: 'advice.type.bacterium',
    virus: 'advice.type.virus', nematode: 'advice.type.nematode', weed: 'advice.type.weed',
    mollusc: 'advice.type.mollusc', other: 'advice.type.other'
  };
  var TYPE_FB = {
    insect: 'إصابة حشرية', mite: 'إصابة عناكب', fungus: 'إصابة فطرية',
    pseudo_fungus: 'إصابة فطرية كاذبة', bacterium: 'إصابة بكتيرية',
    virus: 'إصابة فيروسية', nematode: 'إصابة نيماتودية', weed: 'أعشاب ضارة',
    mollusc: 'بزاقات وحلزونات', other: 'أخرى'
  };
  function typeLabel(id) { return t(TYPE_I18N[id] || TYPE_I18N.other, TYPE_FB[id] || TYPE_FB.other); }

  function renderTypes(inf) {
    var box = document.getElementById('adviceTypes');
    var card = document.getElementById('adviceTypesCard');
    if (!box || !card) return;
    box.textContent = '';
    if (!inf || !(inf.types || []).length) { card.hidden = true; return; }
    card.hidden = false;
    var mk = function (id, label, count) {
      var b = btn('type-chip' + (S.type === id ? ' active' : ''), '', function () {
        S.type = id;
        renderTypes(S.inf[S.crop]);
        showInfections();
      });
      b.setAttribute('data-type', id);
      b.appendChild(el('span', 'tt', label));
      if (count != null) b.appendChild(el('span', 'tn', String(count)));
      return b;
    };
    box.appendChild(mk('', t('advice.types.all', 'الكل'), (inf.cards || []).length));
    (inf.types || []).forEach(function (ty) {
      box.appendChild(mk(ty.id, typeLabel(ty.id), ty.cards));
    });
  }

  function infectionNode(c) {
    var art = el('article', 'inf-card');
    var head = el('div', 'inf-head');
    head.appendChild(el('span', 'inf-num', String(c.n)));
    var titles = el('div', 'inf-titles');
    titles.appendChild(el('div', 'inf-name', c.name_ar));
    titles.appendChild(el('div', 'inf-sci', c.sci + (c.family ? ' · ' + c.family : '')));
    head.appendChild(titles);
    art.appendChild(head);

    var d = (S.doss && S.doss.dossiers) ? S.doss.dossiers[c.dossier] : null;
    var badges = el('div', 'inf-badges');
    var major = c.host === 'Major host';
    badges.appendChild(el('span', 'host-chip' + (major ? ' major' : ''),
      t(major ? 'advice.host.major' : 'advice.host.host', major ? 'مضيف رئيسي' : 'مضيف')));
    if (!S.type) badges.appendChild(el('span', 'host-chip', typeLabel(c.type)));
    if (d) badges.appendChild(evBadge(d.evidence));
    art.appendChild(badges);

    if (d) {
      var s1 = el('section', 'inf-sec');
      s1.appendChild(el('h4', '', t('advice.inf.symptoms', 'مظاهر الإصابة')));
      var u1 = el('ul', '');
      d.symptoms_ar.forEach(function (x) { u1.appendChild(el('li', '', x)); });
      s1.appendChild(u1);
      art.appendChild(s1);

      var s2 = el('section', 'inf-sec');
      s2.appendChild(el('h4', '', t('advice.inf.treatment', 'العلاج والتدبير')));
      var u2 = el('ul', '');
      d.management_ar.forEach(function (x) { u2.appendChild(el('li', '', x)); });
      s2.appendChild(u2);
      art.appendChild(s2);

      var src = el('footer', 'inf-src');
      var a = el('a', '', d.source.title);
      a.href = d.source.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      src.appendChild(a);
      src.appendChild(el('span', '', ' — ' + d.source.publisher));
      art.appendChild(src);
    }
    if (lang() !== 'ar') art.appendChild(el('p', 'langnote', t('advice.langnote', 'نص الإرشاد العلمي متاح حالياً بالعربية، والأسماء العلمية دولية لاتينية في كل اللغات، والمصادر مرفقة بروابطها بلغتها الأصلية.')));
    return art;
  }

  function fillRefList(ul, r, type) {
    ul.textContent = '';
    ((r && r.others) || []).forEach(function (o) {
      if (type && o.type !== type) return;
      var li = el('li', '');
      var nm = el('span', 'latin', o.name);
      li.appendChild(nm);
      var right = el('span', '');
      var major = o.host === 'Major host';
      right.appendChild(el('span', 'host-chip' + (major ? ' major' : ''),
        t(major ? 'advice.host.major' : 'advice.host.host', major ? 'مضيف رئيسي' : 'مضيف')));
      var a = el('a', 'src-link', 'EPPO');
      a.href = 'https://gd.eppo.int/taxon/' + o.code;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      right.appendChild(a);
      li.appendChild(right);
      ul.appendChild(li);
    });
  }

  function refSection(inf) {
    var type = S.type || null;
    var n = 0;
    (inf.types || []).forEach(function (ty) { if (!type || ty.id === type) n += ty.others; });
    if (!n) return null;
    var det = el('details', 'inf-ref');
    det.appendChild(el('summary', '',
      t('advice.inf.ref', 'قائمة مرجعية من دليل EPPO ({n})').replace('{n}', String(n))));
    det.appendChild(el('p', 'refhint', t('advice.inf.refhint', 'هويّات مسجّلة في دليل EPPO دون بطاقة مصادر بعد — بلا مظاهر أو علاج مخترع.')));
    var ul = el('ul', 'inf-ref-list');
    det.appendChild(ul);
    var fill = function () {
      if (S.ref[S.crop]) { fillRefList(ul, S.ref[S.crop], type); return; }
      loadRef(S.crop).then(function (r) {
        if (det.contains(ul)) fillRefList(ul, r, type);
      }).catch(function () {
        det.appendChild(el('p', 'refhint', t('advice.loadfail', 'تعذّر تحميل حزمة الإرشاد — تحقق من الاتصال ثم أعد المحاولة.')));
      });
    };
    det.addEventListener('toggle', function () { if (det.open) fill(); });
    if (S.ref[S.crop]) fillRefList(ul, S.ref[S.crop], type);
    else fill();   /* يُحمَّل الآن: الملف صغير ويُخزَّن في الكاش ليعمل لاحقاً دون إنترنت */
    return det;
  }

  function showInfections() {
    var box = document.getElementById('adviceInfections');
    var empty = document.getElementById('adviceInfEmpty');
    if (!box) return;
    box.textContent = '';
    var inf = S.inf[S.crop];
    if (!inf) {
      if (empty) empty.hidden = true;
      return;
    }
    var cards = (inf.cards || []).filter(function (c) { return !S.type || c.type === S.type; });
    cards.forEach(function (c) { box.appendChild(infectionNode(c)); });
    var ref = refSection(inf);
    if (ref) box.appendChild(ref);
    if (empty) empty.hidden = cards.length > 0;
  }

  /* ---------- عرض البطاقات ---------- */
  function showEmpty(on) {
    var e = document.getElementById('adviceEmpty');
    if (e) e.hidden = !on;
  }
  function showFail() {
    var list = document.getElementById('adviceCards');
    if (!list) return;
    list.textContent = '';
    list.appendChild(el('p', 'advice-error', t('advice.loadfail', 'تعذّر تحميل حزمة الإرشاد — تحقق من الاتصال ثم أعد المحاولة.')));
    showEmpty(false);
  }
  function showCards() {
    var list = document.getElementById('adviceCards');
    var typesCard = document.getElementById('adviceTypesCard');
    var infBox = document.getElementById('adviceInfections');
    var infEmpty = document.getElementById('adviceInfEmpty');
    if (!list) return;
    if (!S.crop) {
      list.textContent = '';
      if (typesCard) typesCard.hidden = true;
      if (infBox) infBox.textContent = '';
      if (infEmpty) infEmpty.hidden = true;
      showEmpty(true);
      return;
    }
    showEmpty(false);
    list.textContent = '';
    if (infBox) {
      infBox.textContent = '';
      infBox.appendChild(el('p', 'adv-loading', t('advice.loading', '…جاري تحميل البطاقات')));
    }
    loadCrop(S.crop).then(function (d) {
      list.textContent = '';
      (d.cards || []).forEach(function (c) { list.appendChild(cardNode(prepare(c))); });
      return loadInf(S.crop);
    }).then(function (inf) {
      renderTypes(inf);
      showInfections();
      var anyHand = list.childNodes.length > 0;
      var anyInf = !!(inf && ((inf.cards || []).length || (inf.types || []).length));
      if (!anyHand && !anyInf) showEmpty(true);
    }).catch(showFail);
  }

  /* ---------- الربط ---------- */
  function wire() {
    if (S.wired) return;
    var save = document.getElementById('adviceFarmSave');
    var reset = document.getElementById('adviceFarmReset');
    if (!save || !reset) return;
    save.addEventListener('click', function () {
      store(function () { localStorage.setItem(LS_CTX, JSON.stringify(S.ctx || {})); });
      var st = document.getElementById('adviceFarmState');
      if (st) { st.hidden = false; st.classList.add('show'); setTimeout(function () { st.classList.remove('show'); }, 2500); }
      showCards();
    });
    reset.addEventListener('click', function () {
      S.ctx = {};
      store(function () { localStorage.removeItem(LS_CTX); });
      renderFarm(document.getElementById('adviceFarmFields'));
      showCards();
    });
    document.addEventListener('langchange', function () {
      if (document.getElementById('view-advice') && !document.getElementById('view-advice').hidden) mount();
    });
    S.wired = true;
  }

  function mount() {
    if (!deps) return;
    var fields = document.getElementById('adviceFarmFields');
    if (!fields) return;
    ensureBase().then(function () {
      renderFarm(fields);
      renderCrops();
      wire();
      showCards();
    }).catch(showFail);
  }

  global.Irsheed = {
    init: function (d) { deps = d; },
    mount: mount,
    _internals: { evalApplies: evalApplies, prepare: prepare }
  };
})(typeof window !== 'undefined' ? window : globalThis);
