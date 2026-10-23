#!/usr/bin/env node
/**
 * build-tws.mjs — بناء بيانات قسم «التوصيات الزراعية» من الكتاب وحده.
 *
 * المصدر الوحيد: كتاب «التوصيات المعتمدة لمكافحة الآفات الزراعية 2025»
 * (لجنة مبيدات الآفات الزراعية) — Recomm25.pdf، عبر طبقته المُدقَّقة:
 *   tmp/apc/cards2_cas.json    استخراج الأقسام والمنتجات (نصوص طباعة لا OCR)
 *                              + أسماء مُصحَّحة بدليل السطر (docs/AUDIT-Recomm25-NAMES.md)
 *                              + طبقة CAS (مطابقة هوية مؤكد؛ لا تخمين)
 *   tmp/apc/print_index.json   بنية الصفحة: عناوين الأقسام المطبوعة + علامات
 *                              المجموعات + سطور التسمية العلوية (يمكن بناؤه من
 *                              scripts/tws-source-index.py)
 *   tmp/apc/images_index.json  صور الكتاب المنسوبة لصفحاتها (build-tws-images.py)
 *
 * القواعد (لا تخمين — كل قرار أدناه مسنود بالسطر المطبوع نفسه):
 *  1) تسمية المحصول: سطر الكتاب العلوي «<محصول> <عنوان>» هو المرجع؛ تُصحَّح
 *     إرثات الاستخراج المخالفة (مثل صفحات «الفول البلدى» المُنسوبة للقمح)
 *     ويُسجَّل كل تعارض في السجل.
 *  2) عنوان الإصابة = أقرب سطر مطبوع فوق «مظهر الإصابة» (بديل مشوَّب بالاستخراج).
 *  3) المجموعة («الآفة : …») تُورَّث بين الأقسام المتتالية من المحصول نفسه،
 *     والنوع يُشتق من كلمة المجموعة الحرفيّة وحدها وإلا فلا نوع («أخرى»).
 *  4) لا اسم علمي لإن لم يذكره الكتاب. لا رابط خارجي: المصدر كتاب واحد.
 *  5) CAS: يُعرض الرقم فقط عند مطابقة مؤكدة (how=tokens/exact)؛ الملتبس
 *     (ambiguous:*) بلا رقم ومعروض بحالة صريحة؛ no-match بلا رقم.
 *  6) الصف NEEDS_VERIFICATION في المنتج يبقى معروضاً بشارة «يحتاج تحققًا».
 *  7) صفحات مطبوعة = PDF − 13 (ثابت مُتحقَّق منه على ست صفحات مرجعية).
 *
 * المخرجات:
 *   data/tws/sections.json     الأقسام كاملة (بطاقات) من الكتاب
 *   data/tws/crops.json        الفهرس: المحاصيل المغطاة بالكتاب × إصاباتها
 *   data/tws/manifest.json     العدّادات وإحصاء المصدر/CAS/التدقيق
 *   data/tws/audit.json        جدول التدقيق الداخلي (السجلات القديمة × المصدر)
 *   docs/AUDIT-tws-Recomm25.md جدول التدقيق المقروء
 *
 * إثبات المصدر لكل سجل: ملف الكتاب + صفحة PDF + الصفحة المطبوعة + موضع
 * الجدول (y) داخل _verify لكل منتج.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const BUILT = '2026-10-23';

const SOURCE = {
  title: 'التوصيات المعتمدة لمكافحة الآفات الزراعية 2025',
  publisher: 'لجنة مبيدات الآفات الزراعية',
  file: 'Recomm25.pdf',
  url: 'http://www.apc.gov.eg/Files/Releases/Recomm25.pdf',
  pdf_pages: 405,
  sections_pages: [16, 279],
  printed_offset: 13   // صفحة مطبوعة = PDF − 13 (مُتحقَّق: 16→3، 100→87، 400→387)
};

/* ---------- أدوات ---------- */
const norm = s => String(s || '')
  .replace(/[ً-ْٰـ]/g, '')            // تشكيل وتطويل
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[^\u0621-\u064Aa-z0-9]+/g, ' ')
  .trim().toLowerCase();
const toks = s => norm(s).split(/\s+/).filter(t => t.length > 1);
/* مفتاح مقارنة عميق للتخفيضات الطباعية (ألرز ← الأرز): يحذف الألفات */
const matchKey = s => norm(s).replace(/\s+/g, ' ').replace(/ا/g, '');

/* حذف تكرار النصف الحرف (شظايا سطور الطباعة): «العنكبوت الحمر العنكبوت الحمر» */
function dedupHalf(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length < 8 || t.length % 2) return null;
  const a = t.slice(0, t.length / 2).trim(), b = t.slice(t.length / 2).trim();
  return norm(a) && norm(a) === norm(b) ? a : null;
}
const printable = s => String(s || '').replace(/\s+/g, ' ').trim();

/* ---------- الإدخال ---------- */
const cards = J('tmp/apc/cards2_cas.json');
const printIdx = J('tmp/apc/print_index.json');
const imagesIdx = existsSync(join(ROOT, 'tmp/apc/images_index.json'))
  ? J('tmp/apc/images_index.json') : {};
const oldCropsPath = join(ROOT, 'data/tws/crops.json');
const legacyPath = join(ROOT, 'data/tws/audit-legacy-index.json');
if (!existsSync(legacyPath) && existsSync(oldCropsPath)) {
  copyFileSync(oldCropsPath, legacyPath);   // لقطة الأساس قبل الإعادة بناء (مرة واحدة)
}
const legacy = existsSync(legacyPath) ? J('data/tws/audit-legacy-index.json') : null;
const oldMeta = new Map((legacy ? legacy.crops : []).map(c => [c.id, c]));

/* ---------- فلاتر عناوين السطور ---------- */
const SYM_RE = /مظهر\s*ا?ل?إصابة/;
const badHeading = h => !h || /[.؟!]$/.test(h);

/* ---------- 1) محاذاة الأقسام بعناوينها المطبوعة ---------- */
const sectionsByPage = new Map();
for (const s of cards.sections) {
  if (!sectionsByPage.has(s.page)) sectionsByPage.set(s.page, []);
  sectionsByPage.get(s.page).push(s);
}
const alignReport = [];
for (const [page, list] of sectionsByPage) {
  const heads = (printIdx[String(page)]?.heads || []).filter(h => !badHeading(h.heading));
  if (heads.length !== list.length) alignReport.push({ page, sections: list.length, heads: heads.length });
  list.forEach((s, i) => { s._print = heads[i] || null; });
}

/* ---------- 2) تسمية المحصول من سطور الكتاب العلوية ----------
 * الفئات (بلا تخمين — كلها من سطر الطباعة):
 *   direct  = سطر علوي يبدأ بتسمية معروفة (سطر «<محصول> <عنوان>»/«<محصول>»)
 *             أو ينتهي بعنوان قسم في الصفحة (يكتشف تسمية جديدة كبادئة)
 *             أو يطابق تسمية مفردة على أول سطر علوي (y ≤ 200)
 *   carried = تُرَّث من آخر صفحة بتسمية مباشرة (فواصل الصفحات)
 * ومعارضة الاستخراج: التسمية المباشرة تُرجَّح، وإلا ( carried) يُرجَّح الاستخراج.
 */
const VOCAB_SEED = [...new Set(cards.sections.map(s => s.crop))].concat(['الفول البلدى']);
const vocabNow = new Set(VOCAB_SEED);
const discovered = new Set();
const NO_LABEL_RE = /^(مظهر|الآفة|:)/;
function rawHeadsOf(p) {
  return (printIdx[String(p)]?.heads || []).filter(h => h.heading && !/[.؟!]$/.test(h.heading)).map(h => h.heading);
}
function headNormsOf(p) {
  const hs = (printIdx[String(p)]?.heads || []).filter(h => h.heading && !/[.؟!]$/.test(h.heading));
  const set = new Set(hs.map(h => norm(h.heading)));
  for (const s of (sectionsByPage.get(p) || [])) set.add(norm(s.heading));
  return set;
}
function labelForPage(p) {
  const tops = printIdx[String(p)]?.tops || [];
  const heads = headNormsOf(p);
  const vocab = [...new Set([...vocabNow, ...discovered])].sort((a, b) => norm(b).length - norm(a).length);
  for (const t of tops) {
    const nt = norm(t.text);
    if (!nt || NO_LABEL_RE.test(nt)) continue;
    for (const v of vocab) {
      const nv = norm(v);
      if (nt === nv) return { label: v, kind: 'direct-exact' };
      if (nt.startsWith(nv + ' ') && nt.length > nv.length + 1) return { label: v, kind: 'direct-combo' };
      if (matchKey(nt) === matchKey(nv)) return { label: v, kind: 'direct-key' };
      if (matchKey(nt).startsWith(matchKey(nv) + ' ')) return { label: v, kind: 'direct-key-combo' };
    }
    /* بادئة سطر ينتهي بعنوان قسم خام في الصفحة ← تسمية جديدة كبادئة */
    for (const hRaw of rawHeadsOf(p)) {
      if (t.text.length > hRaw.length && t.text.endsWith(hRaw)) {
        const name = t.text.slice(0, t.text.length - hRaw.length).trim();
        const nn = norm(name);
        if (nn.length >= 3 && nn.length <= 24 && !heads.has(nn) && !NO_LABEL_RE.test(nn)) {
          discovered.add(name);
          return { label: name, kind: 'direct-discovered' };
        }
      }
    }
  }
  /* مفردة: أول سطر علوي ليس عنوان قسم ولا ضجيجاً */
  const first = tops[0];
  if (first && first.y <= 200) {
    const nt = norm(first.text);
    if (nt && nt.length >= 3 && nt.length <= 22 && !heads.has(nt) && !NO_LABEL_RE.test(nt)
        && !/\d/.test(nt) && nt.split(' ').length <= 3
        && !rawHeadsOf(p).some(h => first.text === h || first.text.endsWith(h))) {
      const v = [...vocabNow].find(v => matchKey(v) === matchKey(nt));
      if (v) return { label: v, kind: 'direct-solo-key' };
      discovered.add(first.text);
      return { label: first.text, kind: 'direct-solo-discovered' };
    }
  }
  return null;
}
const pageCrop = new Map();
for (const pass of [1, 2]) {           // الجولة الثانية تعرف التسميات المكتشفة
  for (let p = SOURCE.sections_pages[0]; p <= SOURCE.sections_pages[1]; p++) {
    const found = labelForPage(p);
    if (found) pageCrop.set(p, { label: found.label, evidence: 'print-top-line', kind: found.kind });
  }
}
let carry = null; const carryFrom = new Map();
for (let p = SOURCE.sections_pages[0]; p <= SOURCE.sections_pages[1]; p++) {
  const pc = pageCrop.get(p);
  if (pc) { carry = pc.label; carryFrom.set(pc.label, p); }
  else if (carry) pageCrop.set(p, { label: carry, evidence: 'carried', from: carryFrom.get(carry) ?? null });
}
/* الترجيح عند المعارضة: مباشرة > استخراج > توريث */
function cropOf(s) {
  const pc = pageCrop.get(s.page);
  if (pc && pc.evidence === 'print-top-line') return { name: pc.label, evidence: pc.evidence, print: true };
  if (s.crop) return { name: s.crop, evidence: pc ? 'extraction-over-carried' : 'extraction-fallback', print: false, carried: pc ? pc.label : null };
  if (pc) return { name: pc.label, evidence: pc.evidence, print: true };
  return { name: null, evidence: 'none', print: false };
}


/* ---------- 3) خريطة اسم الكتاب ← معرّف القسم ---------- */
const CROP_ID = new Map();     // اسم الكتاب (مفتاح مُطبَّع/مُطبَّع عميق) → id
for (const c of (legacy ? legacy.crops : [])) {
  if (c.name_ar) { CROP_ID.set(norm(c.name_ar), c.id); CROP_ID.set(matchKey(c.name_ar), c.id); }
}
/* أسماء كتاب لا تطابق تسميات الفهرس القديم — إسناد مُوثَّق في سجل التدقيق */
/* تسميات الكتاب لا تطابق تسميات الفهرس القديم — إسناد مُراجَع بدليل الموضع
 * وبنية النص (كل سطر ملاحظة في سجل التدقيق). */
const CROP_ID_BOOK = new Map();
const BOOK_LABEL_NOTES = [];
function regBook(label, id, note) {
  CROP_ID_BOOK.set(norm(label), id);
  CROP_ID_BOOK.set(matchKey(label), id);
  if (note) BOOK_LABEL_NOTES.push(`تسمية الكتاب «${label}» ← ${id}: ${note}`);
}
regBook('الفول البلدى', 'fieldbean', 'تسمية صفحات 21–22؛ لا يُدَّعى تطابقها مع الفاصولياء');
regBook('الكركديه', 'roselle', 'محصول غير م存在于 الفهرس القديم — قُدّم بمسمّاه في الكتاب');
regBook('بنجر السكر', 'sugarbeet', 'الكتاب: بنجر السكر · الفهرس القديم: شمندر السكر — محصول واحد بدليل صفحات 33–42 قبل البرسيم مباشرة');
regBook('الذرة الشامية', 'sorghum', 'الكتاب يميّزها عن الذرة الصفراء؛ الفهرس القديم: السورغوم');
regBook('البطاطس', 'potato', 'الكتاب يستعمل البطاطس (102–125) والبطاطا (126) لمحصول واحد');
regBook('اجلزر', 'carrot', 'تشويه طباعي للجزر — الكتاب: الجزر p129 ثم اجلزر p130');
regBook('الباذجنان', 'eggplant', 'رسم الكتاب للباذنجان');
regBook('اخليار', 'cucumber', 'تشويه طباعي — الكتاب: الخيار p137 ثم اخليار p138+');
regBook('فول الصويا', 'soybean', 'الفهرس القديم: الفول الصويا');
regBook('الفاصوليا', 'bean', 'رسم الكتاب — الفهرس القديم: الفاصولياء');
regBook('البسلة', 'pea', 'الفهرس القديم: البازلاء — المحصول نفسه بمسمّاه العامي في الكتاب');
regBook('الكرنب', 'cabbage', 'الفهرس القديم: الملفوف — والكتاب يميّز الكرنب عن القرنبيط والبروكلى');
regBook('املوالح', 'citrus', 'الموالح (برتقال وحمضيات) — الفهرس القديم: الحمضيات');
regBook('الموالح', 'citrus', '');
regBook('اخلوخ', 'peach', 'تشويه طباعي للخوخ (p270–273)');
regBook('املشمش', 'apricot', 'المشمش — الفهرس القديم: المشمش');
regBook('بطيخ اللب', 'watermelon', 'تسمية فرعية داخل صفحات البطيخ p162–165 — الإسناد للمحصول الأم مُعلَّم للمراجعة');
regBook('الكانتالوب', 'cantaloupe', 'الكتاب يميّزها عن الشمام — قُدّمت كمحصول مستقل بمسمّاه');
regBook('الشهد', 'shahd', 'تسمية غير محسومة المقابل — قُدّمت كما وردت بلا تقابلية مُدّعاة');
regBook('الكوســة', 'koosa', 'الكوسة (قوقعة صيفية) بين الخيار والقرع — محصول مستقل بمسمّاه');
regBook('البروكلى', 'broccoli', 'غير موجود في الفهرس القديم — بمسمّاه في الكتاب');
regBook('الخرشوف', 'artichoke', 'غير موجود في الفهرس القديم — بمسمّاه في الكتاب');
regBook('الجوافة', 'guava', 'غير موجود في الفهرس القديم — بمسمّاه في الكتاب');
regBook('اجلوافة', 'guava', 'تشويه ترتيب حروف للجوافة');
regBook('النخيل', 'dates', 'أبواب p250–251: السوسة الحمراء وابو دقيق السايكس وغبار النخيل — أعراض النخيل التمر');
regBook('املاجنو', 'mango', 'تشويه ترتيب حروف للمانجو p227–231 — الأنثركنوز والعفن الهبابى أبابها');
regBook('الكمرثى', 'pear', 'تشويه حروف (ث/ت) للكمثرى — اللفحة النارية p267–268 بين التفاح والخوخ');
regBook('الزراعات المحمية', 'protected', 'قسم إرشادي في الكتاب لا محصول — معروض بمسمّاه دون إسناده لمحصول واحد');
const NEW_CROPS = {
  fieldbean: 'Field bean', roselle: 'Roselle', cantaloupe: 'Cantaloupe', shahd: 'Shahd',
  koosa: 'Courgette', broccoli: 'Broccoli', artichoke: 'Artichoke', guava: 'Guava',
  protected: 'Protected cultivation'
};
/* مطابقة مرنة: المفتاح الكامل ثم أطول بادئة كلمات تحلّ */
const resolveCropId = name => {
  const n = norm(name), m = matchKey(name);
  const id = CROP_ID_BOOK.get(n) || CROP_ID_BOOK.get(m) || CROP_ID.get(n) || CROP_ID.get(m);
  if (id) return id;
  const words = n.split(/\s+/).filter(Boolean);
  for (let i = words.length - 1; i >= 1; i--) {
    const pre = words.slice(0, i).join(' ');
    const pid = CROP_ID_BOOK.get(pre) || CROP_ID_BOOK.get(matchKey(pre)) || CROP_ID.get(pre) || CROP_ID.get(matchKey(pre));
    if (pid) return pid;
  }
  return null;
};

/* ---------- 4) بناء الأقسام ---------- */
const TYPE_BY_GROUP = [
  ['فطريات', 'fungus'], ['حشرات', 'insect'], ['اكاروسات', 'mite'],
  ['طريات', 'bacterium'], ['نيماتودا', 'nematode'], ['ديدان', 'nematode'],
  ['فيروس', 'virus'], ['قواقع', 'mollusc'], ['رخويات', 'mollusc'],
  ['أعشاب', 'weed'], ['عشب', 'weed']
];
const normGroupType = g => {
  const n = norm(g).replace(/\s+/g, '');
  if (!n) return null;
  if (n.includes('فطريات')) return 'fungus';       // قبل «طريات»: فطريات تحويها
  if (n.includes('شرات')) return 'insect';         // «الحشرات» كما وردت بتشويه الطباعة احلشرات
  for (const [k, t] of TYPE_BY_GROUP) if (k !== 'فطريات' && n.includes(norm(k))) return t;
  return null;
};
const splitGuidance = t => {
  const s = String(t || '');
  const m = s.search(/ارشادات\s*[:：]/);
  if (m > 0) return { timing: printable(s.slice(0, m)).replace(/[:：]\s*$/, ''), guidance: printable(s.slice(m).replace(/^.*?ارشادات\s*[:：]\s*/, '')) };
  return { timing: printable(s), guidance: null };
};
function cutBleed(s, next) {
  if (!next) return null;
  const fields = ['timing', 'appearance'];
  const nextHeads = [next.heading, next._print?.heading].filter(Boolean).map(norm);
  const sym0 = norm((next.symptom || [])[0] || '');
  for (const f of fields) {
    const val = String(s[f] || ''); if (!val) continue;
    const nv = norm(val);
    for (const b of [...nextHeads, sym0.length > 25 ? sym0.slice(0, 30) : '']) {
      if (!b) continue;
      const at = nv.indexOf(b);
      if (at > 10) {
        // اقتطاع عند حدود محتوى القسم التالي (حذف تكرار مسنود: المحتوى محفوظ عند صاحبه)
        return { field: f, cut: at };
      }
    }
  }
  return null;
}

const sorted = cards.sections.slice().sort((a, b) => a.page - b.page);
const outSections = [];
const cropStats = new Map();
let curCrop = null, curGroup = null, cropConflicts = 0;

sorted.forEach((s, idx) => {
  const pc = cropOf(s);
  if (pc.name !== curCrop) { curCrop = pc.name; curGroup = null; }
  let cropConflict = null;
  if (s.crop && norm(s.crop) !== norm(pc.name)) {
    cropConflict = { extraction: s.crop, print_label: pc.name };
    cropConflicts++;
  } else if (pc.carried && norm(s.crop) !== norm(pc.carried)) {
    cropConflict = { extraction: s.crop, print_label: pc.carried, resolved: 'extraction-over-carried' };
    cropConflicts++;
  }
  // المجموعة: آخر علامة فوق أول سطر منتجات القسم، وإلا تُورَّث
  const minY = Math.min(...s.products.map(p => p._verify?.y?.[0] ?? 9999));
  const groups = (printIdx[String(s.page)]?.groups || []).filter(g => g.y < minY);
  if (groups.length) curGroup = groups[groups.length - 1].text;
  const group = groups.length ? groups[groups.length - 1].text : curGroup;

  // العنوان المطبوع (بديل مشوَّب الاستخراج) + تنظيف التكرار النصي
  let nameAr = s._print?.heading ? printable(s._print.heading) : printable(s.heading);
  let nameFix = null;
  if (s._print?.heading && printable(s.heading) !== nameAr) {
    nameFix = { from_extraction: printable(s.heading), to_print: nameAr };
  }
  const half = dedupHalf(nameAr);
  if (half) { nameFix = { ...(nameFix || { from_extraction: nameAr }), dedup_half: true }; nameAr = half; }
  const beforeClean = nameAr;
  nameAr = printable(nameAr.replace(/[\u064B-\u0652\u0670\u0640]/g, ' '));
  if (nameAr !== printable(beforeClean)) nameFix = { ...(nameFix || { from_extraction: printable(beforeClean) }), display_normalized: true };
  const nameGarbled = /[\uFFFD]/.test(nameAr);
  const noPrintHead = !s._print?.heading;
  const nameStatus = (nameGarbled || noPrintHead) ? 'NEEDS_REVIEW' : 'VERIFIED';

  // اقتطاع تسرّب النص من القسم التالي (محدَّد بحدود محتوى محفوظ عند صاحبه)
  const next = sorted[idx + 1];
  const bleed = (next && norm(next.crop) === norm(s.crop)) ? cutBleed(s, next) : null;
  const t = splitGuidance(s.timing);
  let timing = t.timing, guidance = t.guidance;
  if (bleed && bleed.field === 'timing') {
    const nv = norm(timing);
    timing = printable(timing.slice(0, bleed.cut));
    guidance = guidance ? printable(guidance) : null;
  }

  const images = [];
  const seenImg = new Set();
  for (const pg of s.pages || [s.page]) {
    for (const im of (imagesIdx[String(pg)] || [])) {
      if (seenImg.has(im.file)) continue;
      seenImg.add(im.file);
      images.push({ file: im.file, w: im.w, h: im.h, pdf_page: pg });
    }
  }

  const cropId = pc.name ? resolveCropId(pc.name) : null;
  const rec = {
    crop_id: cropId,
    crop_name_ar: pc.name,
    n: 0,
    type: (normGroupType(group) || 'other'),
    group: group || null,
    name_ar: nameAr,
    name_status: nameStatus,
    ...(noPrintHead ? { name_status_reason: 'لا يوجد سطر عنوان مطابق في الطباعة — العنوان من الاستخراج وحده' } : {}),
    ...(nameGarbled && !noPrintHead ? { name_status_reason: 'حرف استبدال (�) في العنوان المطبوع — اسم مشوَّب' } : {}),
    ...(nameFix ? { name_fix: nameFix } : {}),
    ...(cropConflict ? { crop_conflict: cropConflict } : {}),
    ...(bleed ? { timing_fix: { cut_from: bleed.field, reason: 'نص القسم التالي متسرّب في الاستخراج — محفوظ عند صاحبه' } } : {}),
    page: s.page,
    printed_page: s.page - SOURCE.printed_offset,
    pages: s.pages || [s.page],
    crop_evidence: pc.evidence,
    ...(pc.evidence === 'carried' ? { crop_carried_from: s.page } : {}),
    symptom: (s.symptom || []).map(printable),
    appearance: printable(s.appearance),
    timing,
    guidance,
    has_rec: !!s.has_rec,
    table_seen: !!s.table_seen,
    notes: s.notes || [],
    images,
    products: s.products.map(p => {
      const { _verify: v, ...rest } = p;
      return { ...rest, _verify: v ? { status: v.status, page: v.page, y: v.y, notes: v.notes, header: v.header, harvest: v.harvest } : undefined };
    })
  };
  outSections.push(rec);
  if (!cropStats.has(cropId)) cropStats.set(cropId, { name: pc.name, sections: [], conflicts: 0 });
  const cs = cropStats.get(cropId);
  cs.sections.push(rec);
  if (cropConflict) cs.conflicts++;
});

const noCrop = outSections.filter(s => !s.crop_id).map(s => s.crop_name_ar);

/* ---------- 5) ترقيم البطاقات داخل المحصول + الفهرس ---------- */
const cropsOut = [];
const canonName = new Map();   // id ← مسمّى الكتاب المعتمد للعرض
const CANON_EXPLICIT = { citrus: 'الموالح', mango: 'المانجو', apricot: 'المشمش', watermelon: 'البطيخ' };
for (const [id, nm] of Object.entries(CANON_EXPLICIT)) canonName.set(id, nm);
for (const [cropId, cs] of [...cropStats.entries()].sort((a, b) => (a[1].name || '').localeCompare(b[1].name || '', 'ar'))) {
  if (!cropId) continue;
  if (!canonName.has(cropId)) canonName.set(cropId, cs.name);
  cs.sections.sort((a, b) => a.page - b.page || (a._y || 0) - (b._y || 0));
  cs.sections.forEach((s, i) => { s.n = i + 1; });
  const meta = oldMeta.get(cropId);
  cropsOut.push({
    id: cropId,
    name_ar: canonName.get(cropId),
    name_en: meta?.name_en || NEW_CROPS[cropId] || cropId,
    sci: meta?.sci || null,
    family: meta?.family || null,
    cards: cs.sections.length,
    infections: cs.sections.map(s => ({
      n: s.n, type: s.type, name_ar: s.name_ar,
      printed_page: s.printed_page, pdf_page: s.page,
      has_rec: s.has_rec,
      ...(s.group ? { group: s.group } : {}),
      ...(s.name_status !== 'VERIFIED' ? { name_status: s.name_status } : {}),
      ...(s.crop_conflict ? { crop_conflict: true } : {}),
      images: s.images.length
    }))
  });
}

/* ---------- 6) إحصاء CAS والتحقق من المنتجات ---------- */
const cas = { confirmed: 0, ambiguous: 0, no_match: 0, name_no_cas: 0, other: 0 };
const verify = { VERIFIED: 0, NEEDS_VERIFICATION: 0 };
for (const s of outSections) {
  for (const p of s.products) {
    if (p._verify?.status) verify[p._verify.status] = (verify[p._verify.status] || 0) + 1;
    for (const m of (p['مكونات فعالة'] || [])) {
      const h = String(m.how || '');
      if (m.cas && (h === 'exact' || h === 'tokens')) cas.confirmed++;
      else if (h.startsWith('ambiguous')) cas.ambiguous++;
      else if (h === 'no-match') cas.no_match++;
      else if (h === 'name-found-no-cas') cas.name_no_cas++;
      else if (m.cas) cas.confirmed++;          // cas موجود بلا how مصنَّف — محسوب عند المصدر
      else cas.other++;
    }
  }
}
const productsTotal = outSections.reduce((a, s) => a + s.products.length, 0);
const imagesTotal = new Set(outSections.flatMap(s => s.images.map(i => i.file))).size;
const cropsWithoutTreatment = cropsOut.filter(c => c.infections.some(i => !i.has_rec)).map(c => c.id).sort();

/* ---------- 7) جدول التدقيق: السجلات القديمة × الكتاب ---------- */
function matchNames(oldName, newName) {
  const stripAl = s => toks(s).map(t => t.replace(/^ال/, ''));
  const pair = (a, b) => {
    if (!a || !b) return null;
    if (a === b) return 'exact';
    if (a.length >= 6 && b.length >= 6 && (a.includes(b) || b.includes(a))) return 'contains';
    const A = new Set(a.split(' ').filter(t => t.length > 1)), B = new Set(b.split(' ').filter(t => t.length > 1));
    const inter = [...A].filter(t => B.has(t));
    if (inter.length && inter.length / Math.max(1, Math.min(A.size, B.size)) >= 0.5) return 'tokens';
    return null;
  };
  const tier = pair(norm(oldName), norm(newName));
  if (tier) return tier;
  const stripped = pair(stripAl(oldName).join(' '), stripAl(newName).join(' '));
  return stripped === 'exact' || stripped === 'contains' ? 'tokens' : stripped; // بالحذف: أدنى درجة ثقة
}
const auditRows = [];
const auditNotes = [];
if (legacy) {
  const newById = new Map(cropsOut.map(c => [c.id, c]));
  for (const lc of legacy.crops) {
    const nc = newById.get(lc.id);
    for (const inf of (lc.infections || [])) {
      if (!nc) {
        auditRows.push({
          crop_id: lc.id, infection_id: `${lc.id}.${inf.n}`, old_name: inf.name_ar,
          name_in_source: null, printed_page: null, pdf_page: null,
          status: 'NOT_FOUND_IN_SOURCE',
          action: 'الكتاب لا يغطي هذا المحصول — أُزيل من قسم التوصيات؛ بياناته باقية في data/advice بانتظار دليل من الكتاب'
        });
        continue;
      }
      let hit = null, kind = null;
      for (const sec of nc.infections) {
        const k = matchNames(inf.name_ar, sec.name_ar);
        if (k) { hit = sec; kind = k; break; }
      }
      if (hit && kind === 'exact') {
        auditRows.push({
          crop_id: lc.id, infection_id: `${lc.id}.${inf.n}`, old_name: inf.name_ar,
          name_in_source: hit.name_ar, printed_page: hit.printed_page, pdf_page: hit.pdf_page,
          status: 'VERIFIED', action: 'مطابقة حرفية مع سطر الكتاب — أُبقي'
        });
      } else if (hit) {
        auditRows.push({
          crop_id: lc.id, infection_id: `${lc.id}.${inf.n}`, old_name: inf.name_ar,
          name_in_source: hit.name_ar, printed_page: hit.printed_page, pdf_page: hit.pdf_page,
          status: kind === 'tokens' ? 'NEEDS_REVIEW' : 'VERIFIED',
          action: kind === 'tokens'
            ? 'مطابقة بمشتركات تسمية غير حرفية — تحتاج مراجعة بشرية قبل الاعتماد'
            : 'مطابقة بالتضمين مع سطر الكتاب — أُبقي'
        });
      } else {
        auditRows.push({
          crop_id: lc.id, infection_id: `${lc.id}.${inf.n}`, old_name: inf.name_ar,
          name_in_source: null, printed_page: null, pdf_page: null,
          status: 'NOT_FOUND_IN_SOURCE',
          action: 'لم يثبت ارتباطها بهذا المحصول في الكتاب — أُزيلت من القسم؛ محفوظة في data/advice بانتظار دليل'
        });
      }
    }
  }
}
// صفوف جديدة: كل قسم من الكتاب
const legacyMatched = new Set(auditRows.filter(r => r.name_in_source).map(r => r.crop_id + '|' + r.name_in_source));
for (const c of cropsOut) {
  for (const inf of c.infections) {
    const sec = cropStats.get(c.id).sections.find(s => s.n === inf.n);
    const isNew = !legacyMatched.has(c.id + '|' + inf.name_ar);
    const review = inf.name_status === 'NEEDS_REVIEW' || !!inf.crop_conflict;
    auditRows.push({
      crop_id: c.id, infection_id: `${c.id}.${inf.n}`,
      old_name: null, name_in_source: inf.name_ar,
      printed_page: inf.printed_page, pdf_page: inf.pdf_page,
      status: review ? 'NEEDS_REVIEW' : 'VERIFIED',
      action: (review
        ? 'عنوان/ربط من الكتاب يحتاج مراجعة' + (inf.crop_conflict ? ' (تعارض تسمية محصول: الاستخراج قال ' + sec.crop_conflict.extraction + ')' : '') + ' — معروض بحالته صراحةً'
        : 'من الكتاب مباشرة') + (isNew ? ' · مُضاف للقسم' : '')
    });
  }
}
if (noCrop.length) auditNotes.push(`أقسام بلا معرّف محصول: ${noCrop.join('، ')}`);
if (alignReport.length) auditNotes.push(`تعارض عدّ عنوان/قسم في الصفحات: ${JSON.stringify(alignReport)}`);
auditNotes.push('اللوبى = cowpea بمطابقة تسمية حرفيّة.');
for (const n of BOOK_LABEL_NOTES) auditNotes.push(n);

const summary = {
  VERIFIED: auditRows.filter(r => r.status === 'VERIFIED').length,
  NEEDS_REVIEW: auditRows.filter(r => r.status === 'NEEDS_REVIEW').length,
  NOT_FOUND_IN_SOURCE: auditRows.filter(r => r.status === 'NOT_FOUND_IN_SOURCE').length
};

/* ---------- 8) الكتابة ---------- */
mkdirSync(join(ROOT, 'data/tws'), { recursive: true });
const sectionsDoc = {
  schema: 2, built: BUILT, source: SOURCE,
  sections: outSections
};
const cropsDoc = {
  schema: 2, built: BUILT, source: { title: SOURCE.title, file: SOURCE.file, url: SOURCE.url },
  crops: cropsOut
};
const manifest = {
  schema: 2, built: BUILT,
  source: SOURCE,
  counts: { crops: cropsOut.length, cards: outSections.length, products: productsTotal, images: imagesTotal },
  cas,
  verify,
  crops_without_treatment: cropsWithoutTreatment,
  audit: { rows: auditRows.length, ...summary }
};
const auditDoc = {
  schema: 1, built: BUILT, source: SOURCE,
  statuses: ['VERIFIED', 'NEEDS_REVIEW', 'NOT_FOUND_IN_SOURCE'],
  summary, notes: auditNotes, rows: auditRows
};
writeFileSync(join(ROOT, 'data/tws/sections.json'), JSON.stringify(sectionsDoc) + '\n');
writeFileSync(join(ROOT, 'data/tws/crops.json'), JSON.stringify(cropsDoc, null, 1) + '\n');
writeFileSync(join(ROOT, 'data/tws/manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
writeFileSync(join(ROOT, 'data/tws/audit.json'), JSON.stringify(auditDoc, null, 1) + '\n');

/* جدول مقروء */
const st = r => r.status;
let md = `# جدول تدقيق قسم «التوصيات الزراعية» ضد الكتاب (Recomm25)\n\n`
  + `> مُولَّد بواسطة \`scripts/build-tws.mjs\` في ${BUILT} — مصدر وحيد: `
  + `${SOURCE.title} (${SOURCE.file}) · ${SOURCE.publisher}\n`
  + `> صفحة PDF ↔ صفحة مطبوعة = PDF − ${SOURCE.printed_offset}. `
  + `الأعمدة: \`crop_id | infection_id | الاسم في المصدر | الصفحة | الحالة | الإجراء\`\n\n`
  + `| المقياس | العدد |\n|---|---|\n`
  + `| VERIFIED | ${summary.VERIFIED} |\n| NEEDS_REVIEW | ${summary.NEEDS_REVIEW} |\n`
  + `| NOT_FOUND_IN_SOURCE | ${summary.NOT_FOUND_IN_SOURCE} |\n`
  + `| محاصيل الكتاب | ${cropsOut.length} |\n| بطاقات (أقسام) | ${outSections.length} |\n\n`;
if (auditNotes.length) md += `## ملاحظات ربط\n\n${auditNotes.map(n => '- ' + n).join('\n')}\n\n`;
let cur = null;
for (const r of auditRows) {
  if (r.crop_id !== cur) { cur = r.crop_id; md += `\n## ${cur}\n\n| crop_id | infection_id | الاسم في المصدر | الصفحة | الحالة | الإجراء |\n|---|---|---|---|---|---|\n`; }
  const nm = r.name_in_source ?? (r.old_name + ' (السجل القديم)');
  md += `| ${r.crop_id} | ${r.infection_id} | ${String(nm).replace(/\|/g, ' ')} | ${r.printed_page ?? '—'} | ${st(r)} | ${r.action} |\n`;
}
writeFileSync(join(ROOT, 'docs/AUDIT-tws-Recomm25.md'), md);

/* ---------- 9) ملخص الطرف ---------- */
console.log(`crops: ${cropsOut.length}  cards: ${outSections.length}  products: ${productsTotal}  images: ${imagesTotal}`);
console.log(`cas: ${JSON.stringify(cas)}  verify: ${JSON.stringify(verify)}`);
console.log(`audit: ${JSON.stringify(summary)}  crop_conflicts_fixed: ${cropConflicts}`);
console.log(`align mismatches: ${JSON.stringify(alignReport)}`);
console.log(`crop conflicts (${cropConflicts}):`);
for (const s of outSections.filter(x => x.crop_conflict)) console.log(`  p${s.page} name=${s.name_ar} ext=${s.crop_conflict.extraction} print=${s.crop_conflict.print_label}`);
console.log(`no-crop sections: ${JSON.stringify(noCrop)}`);
console.log(`discovered labels: ${JSON.stringify([...discovered])}`);
console.log(`label sequence (transitions):`);
let last = null;
for (let p = SOURCE.sections_pages[0]; p <= SOURCE.sections_pages[1]; p++) {
  const pc = pageCrop.get(p); const k = pc ? pc.label : (last ? '⇢' : '-');
  if (k !== last && pc) { console.log(`   p${p}: ${pc.label} (${pc.kind || 'carried'})`); last = pc.label; }
}
console.log(`crops_without_treatment: ${cropsWithoutTreatment.join(',')}`);
console.log(`wheat sections:`);
for (const c of cropsOut.filter(c => c.id === 'wheat')) {
  for (const i of c.infections) console.log(`  ${i.n}. [${i.type}] ${i.name_ar}  (p${i.pdf_page} → printed ${i.printed_page}) rec=${i.has_rec} imgs=${i.images}`);
}
console.log(`fieldbean sections:`);
for (const c of cropsOut.filter(c => c.id === 'fieldbean')) {
  for (const i of c.infections) console.log(`  ${i.n}. [${i.type}] ${i.name_ar}  (p${i.pdf_page})`);
}
const unmatchedOld = auditRows.filter(r => r.status === 'NOT_FOUND_IN_SOURCE' && r.old_name);
console.log(`old records removed (sample 12 of ${unmatchedOld.length}):`);
for (const r of unmatchedOld.slice(0, 12)) console.log(`  ${r.crop_id}: ${r.old_name}`);
