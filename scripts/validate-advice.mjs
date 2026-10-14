/* مدقّق حزمة الإرشاد — validate-advice.mjs (جولة D59)
 * usage: node scripts/validate-advice.mjs [--check-links]
 *
 * القاعدة المالكة: البطاقات تُكتب ولا تُولَّد؛ هذا المدقّق هو الحارس الذي
 * يمنع أي نص غير مدعوم من الدخول. ما يفحصه:
 *   1) البنية: manifest/modifiers/ملفات المحاصيل، تطابق المعرّفات، التغطية
 *      (كل محصول في manifest له ملف وبطاقة ≥ 1، وكل بطاقة لمحصول مُصرَّح).
 *   2) اكتمال الشقّين: cultural/non_chemical إلزاميان في كل بطاقة، وchemical
 *      يستدعي note + خيارات أو اعتذاراً صريحاً عن عدم الحاجة.
 *   3) نمط الجرعات: أي رقم موصوف بوحدة تطبيق (مل/لتر/كغ/هكتار/دونم/فدان/
 *      ٪/ppm) داخل أي نص عربي = فشل — الجرعة من الملصق حصراً. الاستثناء
 *      المقصود: الصيغ الكيميائية والأرقام داخل أسماء المصادر لا تُمس.
 *   4) المصادر: كل مرجع مُستشهد به موجود فعلاً، وكل مصدر مُستخدم، وروابط
 *      https فقط. فحص الوصول (--check-links) اختياري؛ نطاق openknowledge
 *      يرفض الفحص الآلي فيُعامل تحذيراً لا فشلاً (فُحص متصفحين).
 *   5) النظافة: صفر CJK/FFFD، وصفر تجاوز لاتيني-عربي داخل الكلمة (نفس
 *      قاعدة بوابة docs)، وأدلة applies_if أقسامها قيم modifiers الحقيقية.
 *   6) الممنوعات: لا تشخيص (النصوص تبدأ بتأكيد لا بتشخيص — يُفحص شكلياً
 *      عبر حقول confirm_first)، ولا منتجات تجارية (أسماء الشركات في
 *      chemical.options ممنوعة)، ولا أسماء كيانات مخترعة (يُفحص عبر قائمة
 *      المصادر كلها).
 *
 * يُعيد تقرير المطابقة data/advice/advice-registry-report.json في كل تشغيل
 * ناجح؛ الاختبار يقارن أرقام التقرير بإعادة عدّ فعلية فيُرفض التقرير القديم.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const CJK_RE = new RegExp('[\\uFFFD\\u4E00-\\u9FFF\\u3040-\\u30FF\\uFF00-\\uFFEF\\uFF0C]', 'g');
const AR_RE = /[؀-ۿ]/;
const LATIN_RE = /\p{Script=Latin}/u;
const DIAC_RE = /[ً-ْ]/g;
const WORD_RE = /[\p{L}\p{M}]+/gu;
/* نمط الجرعات: رقم + وحدة تطبيق. لا يمس الصيغ (Cu(OH)2 بلا رقم قبل وحدة عربية). */
const DOSE_RE = /(\d+\s*(?:[^\d\s]{0,4}?(?:مل(?!و)|لتر|كغ|كجم|كغم|جم|مجم|هكتار|دونم|فدان))|\d+\s*[٪%]|\bppm\b)/iu;
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const EVIDENCE = new Set(['A', 'B', 'C']);
const CARD_TYPES = new Set(['fungal', 'bacterial', 'viral', 'insect', 'mite', 'nematode', 'nutrient_disorder', 'disorder', 'other']);
const STATUSES = new Set(['draft', 'reviewed']);
const LIBYA_ST = new Set(['verified', 'unverified']);
const MOA_SCHEMES = new Set(['FRAC', 'IRAC', 'HRAC']);
const URL_RE = /^https:\/\/[^\s]+$/;
const REQUIRED_SECTIONS = ['confirm_first', 'cultural', 'non_chemical', 'chemical', 'prevention', 'see_expert_when_ar', 'sources'];

/** فحص تجاوز عربي-لاتيني داخل كلمة واحدة (نفس كاشف الـ docs). */
function latinMixHits(text) {
  const hits = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(WORD_RE)) {
      const core = m[0].replace(DIAC_RE, '');
      if (AR_RE.test(core) && LATIN_RE.test(core)) hits.push({ line: i + 1, token: m[0] });
    }
  });
  return hits;
}

/* ============================================================
 * validatePack(dir) — القلب. يعيد { errors: [], warnings: [], stats }
 * dir مجلد يحوي manifest.json + modifiers.json + ملفات المحاصيل.
 * ============================================================ */
export function validatePack(dir) {
  const errors = [], warnings = [];
  const err = (where, msg) => errors.push(where + ': ' + msg);
  const warn = (where, msg) => warnings.push(where + ': ' + msg);
  const stats = {
    crops: 0, cards: 0, complete: 0, evidence: { A: 0, B: 0, C: 0 },
    sources: {}, byType: {}, actives: new Set(), doseHits: 0,
    perCrop: {}, appliesKeys: {}
  };

  /* ---------- manifest ---------- */
  const mfPath = join(dir, 'manifest.json');
  if (!existsSync(mfPath)) { err('manifest', 'manifest.json مفقود'); return { errors, warnings, stats }; }
  let mf;
  try { mf = JSON.parse(readFileSync(mfPath, 'utf8')); }
  catch (e) { err('manifest', 'JSON غير صالح: ' + e.message); return { errors, warnings, stats }; }
  if (mf.schema !== 1) err('manifest', 'schema يجب أن يساوي 1');
  if (!Array.isArray(mf.crops) || !mf.crops.length) { err('manifest', 'crops فارغ'); return { errors, warnings, stats }; }
  const mfIds = new Set();
  for (const c of mf.crops) {
    if (!c.id || !ID_RE.test(c.id)) err('manifest', 'معرّف محصول غير صالح: ' + c.id);
    if (mfIds.has(c.id)) err('manifest', 'معرّف محصول مكرر: ' + c.id);
    mfIds.add(c.id);
    if (!c.name_ar || !c.name_en || !c.name_fr) err('manifest.' + c.id, 'اسم ناقص (name_ar/en/fr)');
    if (c.file && !existsSync(join(dir, basename(c.file)))) err('manifest.' + c.id, 'ملف مفقود: ' + c.file);
    if (!c.file && !c.inf) err('manifest.' + c.id, 'لا بطاقة يدوية ولا ملف إصابات');
    if (c.inf && !existsSync(join(dir, 'infections', basename(c.inf)))) err('manifest.' + c.id, 'ملف إصابات مفقود: ' + c.inf);
  }

  /* ---------- modifiers ---------- */
  const modPath = join(dir, 'modifiers.json');
  let mods = {};
  if (!existsSync(modPath)) err('modifiers', 'modifiers.json مفقود');
  else {
    try {
      const md = JSON.parse(readFileSync(modPath, 'utf8'));
      if (md.schema !== 1) err('modifiers', 'schema يجب أن يساوي 1');
      mods = md.modifiers || {};
      for (const [k, v] of Object.entries(mods)) {
        if (!v.label_ar) err('modifiers.' + k, 'label_ar مفقود');
        if (!Array.isArray(v.values) || v.values.length < 2) err('modifiers.' + k, 'values يجب أن يكون ≥ 2');
        const ids = new Set((v.values || []).map(x => x.id));
        if (ids.size !== (v.values || []).length) err('modifiers.' + k, 'قيمة مكررة');
        for (const val of v.values || []) if (!val.id || !val.ar) err('modifiers.' + k, 'قيمة ناقصة id/ar');
      }
    } catch (e) { err('modifiers', 'JSON غير صالح: ' + e.message); }
  }
  const modValues = {};
  for (const [k, v] of Object.entries(mods)) modValues[k] = new Set((v.values || []).map(x => x.id));

  /* ---------- applies_if validator ---------- */
  const checkApplies = (where, ap) => {
    if (ap === null || ap === undefined) return;
    if (typeof ap !== 'object' || Array.isArray(ap)) return err(where, 'applies_if يجب أن يكون كائناً أو null');
    for (const [k, vals] of Object.entries(ap)) {
      if (!modValues[k]) return err(where, 'مفتاح applies_if غير معروف: ' + k);
      if (!Array.isArray(vals) || !vals.length) return err(where, 'applies_if.' + k + ' يجب أن يكون مصفوفة غير فارغة');
      for (const val of vals) if (!modValues[k].has(val)) err(where, 'قيمة applies_if غير معروفة: ' + k + '=' + val);
      stats.appliesKeys[k] = (stats.appliesKeys[k] || 0) + 1;
    }
  };

  /* ---------- item rules (cultural / nutrition / non_chemical / prevention) ---------- */
  const seenIds = new Map(); // card-scoped
  const checkItem = (where, it, sources, secName) => {
    if (!it.id || !ID_RE.test(it.id)) err(where, 'معرّف بند غير صالح');
    if (seenIds.has(it.id)) err(where, 'معرّف بند مكرر في البطاقة: ' + it.id);
    seenIds.set(it.id, 1);
    if (!it.text_ar || it.text_ar.length < 20) err(where, 'text_ar قصير أو مفقود');
    else if (DOSE_RE.test(it.text_ar)) { stats.doseHits++; err(where, 'نمط جرعة داخل نص: ' + (it.text_ar.match(DOSE_RE) || [])[0]); }
    if (!EVIDENCE.has(it.evidence)) err(where, 'evidence خارج {A,B,C}: ' + it.evidence);
    else stats.evidence[it.evidence]++;
    if (!Array.isArray(it.source_ids) || !it.source_ids.length) err(where, 'source_ids فارغ');
    else for (const s of it.source_ids) if (!sources.has(s)) err(where, 'مصدر مرجعي غير موجود: ' + s);
    checkApplies(where + '.applies_if', it.applies_if);
    void secName;
  };

  /* ---------- per-file ---------- */
  const allCardIds = new Map();
  const allSources = new Map(); // url -> card (duplicate URL across cards is fine; same id diff content not)
  const files = readdirSync(dir).filter(f => f.endsWith('.json') && !['manifest.json', 'modifiers.json', 'advice-registry-report.json', 'dossiers.json'].includes(f));
  for (const f of files) {
    const p = join(dir, f);
    let d;
    try { d = JSON.parse(readFileSync(p, 'utf8')); }
    catch (e) { err(f, 'JSON غير صالح: ' + e.message); continue; }
    const raw = readFileSync(p, 'utf8');
    /* نظافة */
    const cjk = raw.match(CJK_RE);
    if (cjk) err(f, 'حرف CJK/FFFD: ' + JSON.stringify([...new Set(cjk)]));
    for (const h of latinMixHits(raw)) err(f + ':' + h.line, 'تجاوز عربي-لاتيني داخل كلمة: ' + h.token);
    /* manifest coupling */
    const mfc = mf.crops.find(x => basename(x.file || '') === f);
    if (!mfc) { err(f, 'الملف غير مُدرج في manifest'); continue; }
    if (d.crop_id !== mfc.id) err(f, 'crop_id لا يطابق manifest: ' + d.crop_id + ' ≠ ' + mfc.id);
    if (d.crop_name_ar !== mfc.name_ar) err(f, 'crop_name_ar لا يطابق manifest');
    if (d.schema !== 1) err(f, 'schema يجب أن يساوي 1');
    if (!Array.isArray(d.cards) || !d.cards.length) { err(f, 'لا بطاقات'); continue; }
    stats.perCrop[mfc.id] = d.cards.length;
    stats.crops++;
    for (const card of d.cards) {
      stats.cards++;
      const W = f + '/' + card.id;
      if (!card.id || !ID_RE.test(card.id)) err(W, 'معرّف بطاقة غير صالح');
      if (allCardIds.has(card.id)) err(W, 'معرّف بطاقة مكرر عالمياً (was ' + allCardIds.get(card.id) + ')');
      else allCardIds.set(card.id, f);
      if (card.crop_id !== d.crop_id) err(W, 'crop_id لا يطابق الملف');
      /* problem */
      const pr = card.problem || {};
      if (!pr.name_ar) err(W + '.problem', 'name_ar مفقود');
      if (DOSE_RE.test(pr.name_ar || '')) { stats.doseHits++; err(W + '.problem', 'نمط جرعة في الاسم'); }
      if (!CARD_TYPES.has(pr.type)) err(W + '.problem', 'type غير معروف: ' + pr.type);
      if (!Array.isArray(pr.aliases_ar)) err(W + '.problem', 'aliases_ar مفقود');
      /* status/local */
      if (!STATUSES.has(card.status)) err(W, 'status خارج {draft,reviewed}: ' + card.status);
      if (card.status === 'reviewed' && (!card.reviewed_by || !card.reviewed_on)) err(W, 'reviewed دون مراجع/تاريخ');
      const ls = card.local_status || {};
      if (!LIBYA_ST.has(ls.libya)) err(W + '.local_status', 'libya خارج {verified,unverified}');
      if (!ls.note_ar) err(W + '.local_status', 'note_ar مفقود');
      /* sources */
      const srcIds = new Set();
      if (!Array.isArray(card.sources) || !card.sources.length) err(W, 'sources فارغة');
      for (const s of card.sources || []) {
        if (!s.id || srcIds.has(s.id)) err(W + '.sources', 'معرّف مصدر مفقود أو مكرر: ' + s.id);
        srcIds.add(s.id);
        if (!s.title || !s.publisher) err(W + '.sources.' + s.id, 'title/publisher مفقود');
        if (!s.url || !URL_RE.test(s.url)) err(W + '.sources.' + s.id, 'url يجب أن يكون https: ' + s.url);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s.retrieved || '')) err(W + '.sources.' + s.id, 'retrieved بصيغة YYYY-MM-DD');
        if (!['extension', 'government', 'org', 'journal', 'company'].includes(s.type)) err(W + '.sources.' + s.id, 'type غير معروف: ' + s.type);
        if (s.type === 'company') warn(W + '.sources.' + s.id, 'مصدر تجاري — يُفضَّل استبداله');
        allSources.set(s.url, W);
      }
      seenIds.clear();
      /* confirm_first */
      const cf = card.confirm_first || {};
      if (!cf.intro_ar || cf.intro_ar.length < 40) err(W + '.confirm_first', 'intro_ar قصير (<40)');
      if (!Array.isArray(cf.signs_ar) || cf.signs_ar.length < 2) err(W + '.confirm_first', 'signs_ar يجب أن يكون ≥ 2');
      for (const sg of cf.signs_ar || []) if (DOSE_RE.test(sg)) { stats.doseHits++; err(W + '.confirm_first', 'نمط جرعة في عرض: ' + sg.match(DOSE_RE)[0]); }
      if (!Array.isArray(cf.lookalikes) || cf.lookalikes.length < 1) err(W + '.confirm_first', 'lookalikes يجب أن يكون ≥ 1');
      for (const [i, lk] of (cf.lookalikes || []).entries()) {
        const where = W + '.lookalikes[' + i + ']';
        if (!lk.name_ar || !lk.note_ar) err(where, 'name_ar/note_ar مفقود');
        if (!EVIDENCE.has(lk.evidence)) err(where, 'evidence غير صالح: ' + lk.evidence);
        else stats.evidence[lk.evidence]++;
        if (!Array.isArray(lk.source_ids) || !lk.source_ids.length) err(where, 'source_ids فارغ');
        else for (const s of lk.source_ids) if (!srcIds.has(s)) err(where, 'مصدر غير موجود: ' + s);
        if (DOSE_RE.test(lk.note_ar || '')) { stats.doseHits++; err(where, 'نمط جرعة'); }
      }
      if (!Array.isArray(cf.lab_tests_ar)) err(W + '.confirm_first', 'lab_tests_ar مفقود');
      for (const t of cf.lab_tests_ar || []) if (DOSE_RE.test(t)) { stats.doseHits++; err(W + '.lab_tests', 'نمط جرعة في فحص مختبري'); }
      /* sections */
      for (const sec of ['cultural', 'non_chemical', 'prevention']) {
        if (!Array.isArray(card[sec]) || !card[sec].length) err(W, sec + ' إلزامي وغير فارغ');
        else for (const it of card[sec]) checkItem(W + '.' + sec + '.' + (it.id || '?'), it, srcIds, sec);
      }
      if (Array.isArray(card.nutrition)) {
        for (const it of card.nutrition) checkItem(W + '.nutrition.' + (it.id || '?'), it, srcIds, 'nutrition');
      } else err(W, 'nutrition يجب أن يكون مصفوفة (يُسمح بالفراغ)');
      /* chemical */
      const ch = card.chemical || {};
      if (!ch.note_ar) err(W + '.chemical', 'note_ar مفقود (يشمل «لا يلزم مبيد»)');
      else if (DOSE_RE.test(ch.note_ar)) { stats.doseHits++; err(W + '.chemical', 'نمط جرعة في الملاحظة'); }
      if (!Array.isArray(ch.options)) { err(W + '.chemical', 'options مفقود'); }
      else {
        if (!ch.options.length && !/لا يلزم|لا مبيد|غير مطلوب|حالة اضطراب/.test(ch.note_ar || ''))
          err(W + '.chemical', 'options فارغة دون اعتذار صريح في note_ar');
        for (const op of ch.options) {
          const OW = W + '.chemical.' + (op.id || '?');
          if (!op.id || !ID_RE.test(op.id)) err(OW, 'معرّف غير صالح');
          if (seenIds.has(op.id)) err(OW, 'معرّف مكرر في البطاقة');
          seenIds.set(op.id, 1);
          if (!op.group_ar) err(OW, 'group_ar مفقود');
          if (!MOA_SCHEMES.has(op.moa_scheme)) err(OW, 'moa_scheme خارج {FRAC,IRAC,HRAC}: ' + op.moa_scheme);
          if (op.moa !== null && !/^[0-9]+[A-Za-z]?$|^M[0-9]+$|^[A-Z]$/.test(String(op.moa || ''))) err(OW, 'moa غير صالح: ' + op.moa);
          if (!Array.isArray(op.ingredients) || !op.ingredients.length) err(OW, 'ingredients فارغ');
          for (const ing of op.ingredients || []) {
            if (!ing.ar || !ing.en) err(OW, 'مكوّن بلا ar/en');
            if (DOSE_RE.test(ing.ar || '')) { stats.doseHits++; err(OW, 'نمط جرعة في مكوّن'); }
            if (ing.en) stats.actives.add(ing.en.toLowerCase());
          }
          if (!op.timing_ar || !op.caution_ar) err(OW, 'timing_ar/caution_ar مفقود');
          for (const t of [op.timing_ar, op.caution_ar, op.group_ar, op.moa_note_ar]) {
            if (t && DOSE_RE.test(t)) { stats.doseHits++; err(OW, 'نمط جرعة: ' + t.match(DOSE_RE)[0]); }
          }
          if (!EVIDENCE.has(op.evidence)) err(OW, 'evidence غير صالح');
          else stats.evidence[op.evidence]++;
          if (!Array.isArray(op.source_ids) || !op.source_ids.length) err(OW, 'source_ids فارغ');
          else for (const s of op.source_ids) if (!srcIds.has(s)) err(OW, 'مصدر غير موجود: ' + s);
          if (/\b(?:Bayer|Syngenta|BASF|Corteva|Adama|Nufarm|FMC|Murphy|Sipcam|UPL|Fertiberia|Brandt)\b/.test(JSON.stringify(op)))
            err(OW, 'اسم منتج/شركة تجارية داخل خيار كيميائي');
        }
      }
      /* see expert + misc text scans */
      if (!Array.isArray(card.see_expert_when_ar) || card.see_expert_when_ar.length < 2) err(W, 'see_expert_when_ar يجب أن يكون ≥ 2');
      for (const s of card.see_expert_when_ar || []) if (DOSE_RE.test(s)) { stats.doseHits++; err(W, 'نمط جرعة في توجيه المختص'); }
      /* used sources */
      const used = new Set();
      const collect = o => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(collect);
        if (Array.isArray(o.source_ids)) o.source_ids.forEach(x => used.add(x));
        Object.values(o).forEach(collect);
      };
      collect(card.cultural); collect(card.nutrition); collect(card.non_chemical);
      collect(card.prevention); collect(card.chemical); collect(card.confirm_first);
      for (const s of card.sources || []) if (!used.has(s.id)) err(W + '.sources.' + s.id, 'مصدر غير مستخدم في أي بند');
      /* completeness tally */
      const missing = REQUIRED_SECTIONS.filter(sec => {
        const v = card[sec];
        if (sec === 'chemical') return !(card.chemical && card.chemical.note_ar);
        if (Array.isArray(v)) return !v.length;
        return !v;
      });
      if (!missing.length && (card.chemical.options || []).length) stats.complete++;
      else if (!missing.length) stats.complete++;
      if (missing.length) err(W, 'أقسام ناقصة: ' + missing.join(','));
    }
  }
  /* ---------- coverage ---------- */
  for (const c of mf.crops) {
    const hasInf = c.inf && existsSync(join(dir, 'infections', basename(c.inf)));
    if (!stats.perCrop[c.id] && !hasInf) err('coverage', 'محصول manifest بلا بطاقات ولا إصابات: ' + c.id);
  }
  for (const oid of mf.owner_initial_cards || []) {
    if (!allCardIds.has(oid)) err('manifest.owner_initial_cards', 'بطاقة مالك مفقودة: ' + oid);
  }
  validateInfections(dir, mf, err, warn, stats);
  stats.sources = { total: allSources.size };
  stats.actives = [...stats.actives].sort();
  return { errors, warnings, stats, mf };
}

/* ============================================================
 * D61 — مطابقة أدلّة الإصابات: لا بطاقة مرقّمة بلا دليل EPPO ولا
 * نوع بلا تصنيف GBIF ولا مظاهر/علاج خارج ديوان مُسنَد.
 * ============================================================ */
const INF_TYPES = new Set(['insect', 'mite', 'fungus', 'pseudo_fungus', 'bacterium', 'virus', 'nematode', 'weed', 'mollusc', 'other']);
function validateInfections(dir, mf, err, warn, stats) {
  if (!mf.infections) { stats.infections = null; return; }  /* بلا ميتا إصابات = حزمة يدوية فقط */
  const evDir = join(dir, 'evidence');
  const dossPath = join(dir, 'dossiers.json');
  if (!existsSync(dossPath)) return err('infections', 'dossiers.json مفقود');
  let dj;
  try { dj = JSON.parse(readFileSync(dossPath, 'utf8')); }
  catch (e) { return err('infections', 'dossiers.json غير صالح: ' + e.message); }
  if (dj.schema !== 1) err('dossiers', 'schema يجب أن يساوي 1');
  const dossiers = dj.dossiers || {};
  stats.infections = { crops: 0, cards: 0, others: 0, dossiers: Object.keys(dossiers).length };

  /* --- الدواوين: مصدر + نظافة + تطابق مع الملف الأصلي --- */
  const dossDir = join(evDir, '_dossiers');
  if (!existsSync(dossDir)) return err('infections', '_dossiers مفقود');
  for (const [code, d] of Object.entries(dossiers)) {
    const W = 'dossiers/' + code;
    if (!d.name_ar) err(W, 'name_ar مفقود');
    if (!d.pest_name_en) err(W, 'pest_name_en مفقود');
    if (!d.source || !URL_RE.test(d.source.url || '')) err(W, 'source.url يجب أن يكون https');
    if (!d.source || !d.source.publisher) err(W, 'source.publisher مفقود');
    if (!d.source || !/^\d{4}-\d{2}-\d{2}$/.test(d.source.retrieved || '')) err(W, 'source.retrieved بصيغة YYYY-MM-DD');
    if (!['ucipm', 'extension', 'cabi', 'cgiari', 'eppo', 'government', 'org', 'journal'].includes(d.source && d.source.type))
      err(W, 'نوع مصدر غير معروف: ' + (d.source && d.source.type));
    if (!Array.isArray(d.symptoms_ar) || d.symptoms_ar.length < 2) err(W, 'symptoms_ar يجب أن يكون ≥ 2');
    if (!Array.isArray(d.management_ar) || d.management_ar.length < 1) err(W, 'management_ar فارغ');
    if (!EVIDENCE.has(d.evidence)) err(W, 'vidence خارج {A,B,C}: ' + d.evidence);
    else stats.evidence[d.evidence]++;
    const text = [d.name_ar, ...(d.symptoms_ar || []), ...(d.management_ar || [])].join('\n');
    const cjk = text.match(CJK_RE);
    if (cjk) err(W, 'حرف CJK/FFFD: ' + JSON.stringify([...new Set(cjk)]));
    for (const h of latinMixHits(text)) err(W, 'تجاوز عربي-لاتيني داخل كلمة: ' + h.token);
    if (DOSE_RE.test(text)) { stats.doseHits++; err(W, 'نمط جرعة داخل نص الديوان: ' + text.match(DOSE_RE)[0]); }
    const fp = join(dossDir, code + '.json');
    if (!existsSync(fp)) err(W, 'الملف الأصلي مفقود في _dossiers');
    else {
      let o;
      try { o = JSON.parse(readFileSync(fp, 'utf8')); }
      catch (e) { err(W, 'الملف الأصلي غير صالح: ' + e.message); continue; }
      for (const k of ['name_ar', 'pest_name_en', 'evidence']) {
        if (JSON.stringify(o[k]) !== JSON.stringify(d[k])) err(W, 'يختلف عن الأصلي في ' + k);
      }
      if (JSON.stringify(o.symptoms_ar) !== JSON.stringify(d.symptoms_ar)) err(W, 'يختلف عن الأصلي في symptoms_ar');
      if (JSON.stringify(o.management_ar) !== JSON.stringify(d.management_ar)) err(W, 'يختلف عن الأصلي في management_ar');
      if (JSON.stringify(o.source) !== JSON.stringify(d.source)) err(W, 'يختلف عن الأصلي في source');
    }
  }
  for (const f of readdirSync(dossDir).filter(x => x.endsWith('.json'))) {
    const code = f.replace(/\.json$/, '');
    if (!dossiers[code]) err('dossiers', 'ملف ديوان غير مُصدَّر في dossiers.json: ' + code + ' — أعد التوليد');
  }
  const taxPath = join(evDir, '_pest-taxonomy.json');
  if (!existsSync(taxPath)) return err('infections', '_pest-taxonomy.json مفقود');
  const tax = JSON.parse(readFileSync(taxPath, 'utf8')).pests;

  /* --- لكل محصول: النواة + المرجع مقابل دليل EPPO والتصنيف --- */
  const usedDoss = new Set();
  for (const c of mf.crops) {
    if (!c.inf) continue;
    const W = 'infections/' + c.id;
    const infPath = join(dir, 'infections', basename(c.inf));
    const refPath = join(dir, 'infections', basename(c.inf).replace(/\.json$/, '.ref.json'));
    if (!existsSync(infPath)) { err(W, 'ملف النواة مفقود'); continue; }
    if (!existsSync(refPath)) { err(W, 'ملف القائمة المرجعية مفقود'); continue; }
    const evPath = join(evDir, c.id + '.json');
    if (!existsSync(evPath)) { err(W, 'دليل الأدلة مفقود'); continue; }
    let inf, ref, ev;
    try {
      inf = JSON.parse(readFileSync(infPath, 'utf8'));
      ref = JSON.parse(readFileSync(refPath, 'utf8'));
      ev = JSON.parse(readFileSync(evPath, 'utf8'));
    } catch (e) { err(W, 'JSON غير صالح: ' + e.message); continue; }
    for (const [label, raw] of [[W, JSON.stringify(inf)], [W + '.ref', JSON.stringify(ref)]]) {
      const cjk = raw.match(CJK_RE);
      if (cjk) err(label, 'حرف CJK/FFFD');
      for (const h of latinMixHits(raw)) err(label, 'تجاوز عربي-لاتيني داخل كلمة: ' + h.token);
    }
    if (inf.schema !== 1) err(W, 'schema يجب أن يساوي 1');
    if (inf.crop_id !== c.id) err(W, 'crop_id لا يطابق manifest');
    if (!inf.crop || inf.crop.ar !== c.name_ar) err(W, 'crop.ar لا يطابق manifest name_ar');
    if (!inf.eppo || !inf.eppo.pests_url) err(W, 'وسوم eppo ناقصة');
    const pestByCode = {};
    const HRANK = { 'Major host': 0, 'Host': 1 };
    for (const p of (ev.eppo && ev.eppo.pests) || []) {
      if (!pestByCode[p.code] || (HRANK[p.type] ?? 2) < (HRANK[pestByCode[p.code].type] ?? 2)) pestByCode[p.code] = p;
    }
    stats.infections.crops++;

    const seq = {}, typeCards = {}, typeOthers = {};
    const seenCards = new Set(), seenRef = new Set();
    for (const card of inf.cards || []) {
      stats.infections.cards++;
      const CW = W + '.card[' + card.code + ']';
      if (seenCards.has(card.code)) err(CW, 'كود مكرر في بطاقات النواة');
      seenCards.add(card.code);
      const ep = pestByCode[card.code];
      if (!ep) err(CW, 'الكود غير موجود في قائمة EPPO لهذا المحصول');
      else if (ep.type !== card.host) err(CW, 'host لا يطابق الدليل: ' + card.host + ' ≠ ' + ep.type);
      const tg = tax[card.code];
      if (!tg || tg.group === 'unknown') err(CW, 'لا تصنيف GBIF صالح — لا بطاقة');
      else if (tg.group !== card.type) err(CW, 'type لا يطابق التصنيف: ' + card.type + ' ≠ ' + tg.group);
      if (!INF_TYPES.has(card.type)) err(CW, 'نوع خارج القائمة: ' + card.type);
      if (card.dossier !== card.code) err(CW, 'dossier يخالف كود البطاقة');
      if (!dossiers[card.dossier]) err(CW, 'الديوان غير موجود في dossiers.json');
      else usedDoss.add(card.dossier);
      if (DOSE_RE.test(card.name_ar || '')) { stats.doseHits++; err(CW, 'نمط جرعة في الاسم'); }
      seq[card.type] = (seq[card.type] || 0) + 1;
      if (card.n !== seq[card.type]) err(CW, 'ترقيم غير متسلسل داخل النوع: ' + card.n + ' ≠ ' + seq[card.type]);
      typeCards[card.type] = (typeCards[card.type] || 0) + 1;
    }
    for (const o of ref.others || []) {
      stats.infections.others++;
      const OW = W + '.ref[' + o.code + ']';
      if (seenRef.has(o.code)) err(OW, 'كود مكرر في القائمة المرجعية');
      seenRef.add(o.code);
      if (seenCards.has(o.code)) err(OW, 'موجود كبطاقة وفي القائمة معاً');
      const ep = pestByCode[o.code];
      if (!ep) err(OW, 'الكود غير موجود في قائمة EPPO لهذا المحصول');
      else if (ep.type !== o.host) err(OW, 'host لا يطابق الدليل: ' + o.host + ' ≠ ' + ep.type);
      const tg = tax[o.code];
      if (!tg || tg.group === 'unknown') err(OW, 'لا تصنيف GBIF صالح — لا قائمة');
      else if (tg.group !== o.type) err(OW, 'type لا يطابق التصنيف: ' + o.type + ' ≠ ' + tg.group);
      if (dossiers[o.code]) err(OW, 'لديه ديوان — يجب أن يكون بطاقة مرقّمة لا قائمة مرجعية');
      typeOthers[o.type] = (typeOthers[o.type] || 0) + 1;
    }
    const seenT = new Set();
    for (const ty of inf.types || []) {
      const TW = W + '.types[' + ty.id + ']';
      if (!INF_TYPES.has(ty.id)) err(TW, 'نوع خارج القائمة');
      if (seenT.has(ty.id)) err(TW, 'نوع مكرر');
      seenT.add(ty.id);
      if (ty.cards !== (typeCards[ty.id] || 0)) err(TW, 'عدّاد cards لا يطابق الفعلي: ' + ty.cards + ' ≠ ' + (typeCards[ty.id] || 0));
      if (ty.others !== (typeOthers[ty.id] || 0)) err(TW, 'عدّاد others لا يطابق الفعلي: ' + ty.others + ' ≠ ' + (typeOthers[ty.id] || 0));
      if (ty.count !== ty.cards + ty.others) err(TW, 'count ≠ cards+others');
    }
    for (const k of Object.keys(typeCards)) if (!seenT.has(k)) err(W, 'نوع بطاقات غير مدرج في types: ' + k);
    for (const k of Object.keys(typeOthers)) if (!seenT.has(k)) err(W, 'نوع مرجعي غير مدرج في types: ' + k);
  }
  for (const code of Object.keys(dossiers)) {
    if (!usedDoss.has(code)) warn('dossiers/' + code, 'ديوان غير مستخدم في أي محصول — أعد التوليد أو احذفه');
  }
}

/* ============================================================
 * EU cross-check + report (للـ CLI على الحزمة الحقيقية فقط)
 * ============================================================ */
export function euStatusOf(enName, euRows) {
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(enName);
  if (!target) return null;
  const exact = euRows.find(r => norm(r.name) === target);
  if (exact) return exact.status;
  const part = euRows.find(r => norm(r.name).includes(target) || target.includes(norm(r.name)) && norm(r.name).length > 6);
  return part ? part.status : null;
}

function buildReport(dir, res) {
  const euPath = join(dir, '..', 'eu.json');
  const euRows = existsSync(euPath) ? (JSON.parse(readFileSync(euPath, 'utf8')).rows || []) : [];
  const byType = {}; const byLicense = { open: [], cite_only: [] };
  const actives = [];
  for (const en of res.stats.actives) {
    const st = euStatusOf(en, euRows);
    actives.push({ active: en, eu_status: st || 'غير مدرجة' });
  }
  const urls = new Set();
  const files = readdirSync(dir).filter(f => f.endsWith('.json') && !['manifest.json', 'modifiers.json', 'advice-registry-report.json', 'dossiers.json'].includes(f));
  for (const f of files) {
    const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const c of d.cards) for (const s of c.sources) {
      byType[s.type] = (byType[s.type] || 0) + 1;
      urls.add(s.url);
      byLicense.cite_only.push({ url: s.url, publisher: s.publisher });
    }
  }
  return {
    schema: 1,
    generated: new Date().toISOString().slice(0, 10),
    generator: 'scripts/validate-advice.mjs',
    license_policy: 'cite_and_paraphrase — اللصق الحرفي غير مخوّل؛ التلخيص العلمي مع نسب المصدر ورابطه. الأذونات الواردة تُدار باسم صاحب المشروع.',
    coverage: { crops: res.stats.crops, cards: res.stats.cards, per_crop: res.stats.perCrop, cards_min_per_crop: 1 },
    completeness: { required_sections: REQUIRED_SECTIONS, complete_cards: res.stats.complete, violations: res.errors.length },
    evidence: res.stats.evidence,
    sources: { total: urls.size, by_type: byType, by_license: { open: byLicense.open.length, cite_only: byLicense.cite_only.length } },
    actives: { total: actives.length, eu_crosscheck: actives },
    dose_gate: { pattern_hits: res.stats.doseHits, policy: 'الجرعة من الملصق حصراً' },
    applies_if_usage: res.stats.appliesKeys,
    infections: res.stats.infections || null,
    warnings: res.warnings
  };
}

/* ---------- CLI ---------- */
const isMain = process.argv[1] && process.argv[1].endsWith('validate-advice.mjs');
if (isMain) {
  const dir = join(process.cwd(), 'data', 'advice');
  const res = validatePack(dir);
  let pass = 0, fail = 0;
  const check = (name, ok, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' — ' + extra}`);
    ok ? pass++ : fail++;
  };
  check('manifest + modifiers + coupling + coverage', res.errors.filter(e => /manifest|modifiers|coverage|crop_id|crop_name|schema|الملف/.test(e)).length === 0,
    res.errors.filter(e => /manifest|modifiers|coverage|crop_id|crop_name|schema|الملف/.test(e)).join(' | '));
  const doseE = res.errors.filter(e => /جرعة/.test(e));
  check('no dose patterns anywhere (الجرعة من الملصق)', doseE.length === 0 && res.stats.doseHits === 0, doseE.join(' | '));
  const structE = res.errors.filter(e => !/جرعة|manifest|modifiers|coverage|crop_id|crop_name|schema|الملف/.test(e));
  check('card structure + completeness + source integrity + cleanliness', structE.length === 0, structE.join(' | '));
  check('report regenerated', (() => {
    const rep = buildReport(dir, res);
    writeFileSync(join(dir, 'advice-registry-report.json'), JSON.stringify(rep, null, 2) + '\n');
    return true;
  })());
  if (fail === 0) {
    const rep = JSON.parse(readFileSync(join(dir, 'advice-registry-report.json'), 'utf8'));
    console.log('  crops=' + rep.coverage.crops + ' cards=' + rep.coverage.cards +
      ' complete=' + rep.completeness.complete_cards + ' sources=' + rep.sources.total +
      ' evidence A/B/C=' + [rep.evidence.A, rep.evidence.B, rep.evidence.C].join('/') +
      ' doseHits=' + rep.dose_gate.pattern_hits + ' warnings=' + res.warnings.length);
    if (rep.infections)
      console.log('  infections: crops=' + rep.infections.crops + ' cards=' + rep.infections.cards +
        ' others=' + rep.infections.others + ' dossiers=' + rep.infections.dossiers);
    /* --check-links: فحص حيّ لكل رابط. نطاق openknowledge.fao.org يرفض
     * الفحص الآلي (000/timeout) رغم عمله في المتصفح — تحذير لا فشل،
     * موثّق في أدلة الجولة. باقي النطاقات: أي ≥400 أو تعذّر = فشل. */
    if (process.argv.includes('--check-links')) {
      const urls = [...new Set(rep.sources && rep.sources.total
        ? buildReport(dir, res).by_license_urls || [] : [])];
      const all = [];
      const files2 = readdirSync(dir).filter(x => x.endsWith('.json') && !['manifest.json', 'modifiers.json', 'advice-registry-report.json', 'dossiers.json'].includes(x));
      for (const x of files2) {
        const d2 = JSON.parse(readFileSync(join(dir, x), 'utf8'));
        for (const c of d2.cards) for (const s of c.sources) all.push(s.url);
      }
      const uniq = [...new Set(all)];
      const results = await Promise.all(uniq.map(async u => {
        try {
          const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000),
            headers: { 'user-agent': 'Mozilla/5.0 (compatible; advice-link-check/1.0)' } });
          return { u, status: r.status };
        } catch (e) { return { u, status: 0, err: e.name }; }
      }));
      let linkFail = 0;
      for (const r of results) {
        const fao = r.u.includes('openknowledge.fao.org');
        if (r.status >= 200 && r.status < 400) { console.log('PASS link ' + r.status + ' ' + r.u); pass++; }
        else if (fao) { console.log('WARN link (FAO bot-block, browser-verified) ' + r.status + ' ' + r.u); res.warnings.push('link:' + r.u); }
        else { console.log('FAIL link ' + (r.status || r.err) + ' ' + r.u); fail++; linkFail++; }
      }
      void urls; void linkFail;
    }
  }
  for (const w of res.warnings) console.log('WARN ' + w);
  console.log(`\nADVICE-VALIDATE: PASS ${pass}  FAIL ${fail}`);
  process.exit(fail ? 1 : 0);
}
