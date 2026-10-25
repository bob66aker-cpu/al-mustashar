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
 *  1) تسمية المحصول: فهرس الكتاب (المحتويات IX–XII) يحدّد نطاق كل محصول وفصله،
 *     وسطر التسمية المطبوع قبل عنوان القسم يحدّده داخل الصفحة؛ المباشر يُرجَّح
 *     على الاستخراج، وكل تعارض مُسجَّل بدليله (صفحة + y + رقم المطبوع).
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
const BUILT = '2026-10-25';

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
const prevDoc = existsSync(oldCropsPath) ? J('data/tws/crops.json') : null;   // أسماء العرض الحالية
const prevName = new Map((prevDoc ? prevDoc.crops : []).map(c => [c.id, c.name_ar]));

/* ---------- فلاتر عناوين السطور ---------- */
/* ========== عناوين القسم: تصحيحات مثبتة بالتحقق البصري + عناوين قيد المراجعة ==========
 * HEAD_FIX: نص مصحح دليله قراءة OCR لصورة الصفحة الأصلية و/أو عنوان مماثل مطبوع نظيفًا
 * في صفحة أخرى من الكتاب نفسه — لا تخمين. يُسجَّل في name_fix ولا يُقدَّم كنقل حرفي.
 * HEAD_REVIEW: قراءة OCR غير حاسمة — النص يبقى كما ورد مع حالة NEEDS_REVIEW والسبب. */
const HEAD_FIX = {
  "مرض عفن اجلذور": ["مرض عفن الجذور", "تبديل لام (اجلذور → الجذور) — النمط المؤكد في صفحات أخرى + OCR"],
  ")الأكاروس الأحمر الأوروبي (الطوار املتحركة": ["الأكاروس الأحمر الأوروبي (الطوار المتحركة)", "OCR بصري p260: الأقواس بترتيبها البصري + تبديل لام (املتحركة → المتحركة)"],
  "الصداأ الأصفر املخطط": ["الصدأ الأصفر المخطط", "OCR بصري p18: الصدا+الأصف — أ منفصلة وتبديل لام في «املخطط»"],
  "اأمراضض الفيوزاريوم فى القمح": ["أمراض الفيوزاريوم فى القمح", "OCR بصري p20: أمراض — تكرار ض وحرف زائد"],
  "اأعفان اجلذور وموت البادرات": ["اعفان الجذور وموت البادرات", "العنوان نفسه مطبوع نظيفًا على p195 + OCR p20/p71/p72"],
  "اعفان اجلذور وموت البادرات": ["اعفان الجذور وموت البادرات", "العنوان نفسه مطبوع نظيفًا على p195"],
  "اعفان اجلذور": ["اعفان الجذور", "نمط p195 + OCR p128"],
  "اعفان الثمار بعد اجلمع": ["اعفان الثمار بعد الجمع", "تبديل لام (اجلمع → الجمع) + OCR p222"],
  "العنكبوت االحمر": ["العنكبوت الأحمر", "العنوان نفسه مطبوع نظيفًا p51/p67/p73…"],
  "صصانعات االنفاق": ["صانعات الأنفاق", "العنوان نفسه نظيف p141/p216 + OCR p87"],
  "صانعات النفاق": ["صانعات الأنفاق", "OCR بصري p176: صانعات الأنفاق"],
  "نيماتودا تعقد اجلذور": ["نيماتودا تعقد الجذور", "العنوان نفسه نظيف p124 + OCR p42/p69/p100"],
  ")دودة ورق القطن (فقس حديث": ["دودة ورق القطن (فقس حديث)", "OCR بصري p46: الأقواس بترتيبها البصري"],
  ")عفن القدم واSستطالة البادرات (البكانا)عفن القدم واسستطالة البادرات (البكانا": ["عفن القدم واستطالة البادرات (البكانا)", "OCR بصري p56: نسخة واحدة فقط — إزالة تكرار النص وحرف S لاتيني زائد"],
  "احلشرة القشرية الرخوة": ["الحشرة القشرية الرخوة", "OCR بصري p63/p254 + نمط «الحشرات القشرية»"],
  "احلشرات القشرية": ["الحشرات القشرية", "OCR بصري p226/p252/p266"],
  "عفن اجلذور فى قصسب السسكر": ["عفن الجذور فى قصب السكر", "OCR بصري p66 + تكرار حرف"],
  "املن": ["المن", "العنوان نفسه نظيف «المن» على p16/p21… + تبديل لام في raw «املـن»"],
  ")صانعات الأنفاق (جنس لريومايزا": ["صانعات الأنفاق (جنس لريومايزا)", "OCR بصري p87"],
  ")الندوة املبكرة (البدرية": ["الندوة المبكرة (البدرية)", "OCR بصري نظيف p94/p114"],
  "الندوة املتاأخرة": ["الندوة المتأخرة", "OCR بصري نظيف p119"],
  "اأمراض الرتبة": ["أمراض الرتبة", "مطابقة صيغة p20 بعد OCR"],
  "احلفار": ["الحفار", "تبديل لام (احلفار → الححفار→الحفار) + «حفار ساق التفاح» من كلام الكتاب p258"],
  ")دودة درنات البطاطس (فى احلقل": ["دودة درنات البطاطس (فى الحقل)", "OCR بصري p106"],
  "العفن اجلاف": ["العفن الجاف", "OCR بصري p114 + تبديل لام"],
  ".لفحة الساق الصمغية": ["لفحة الساق الصمغية", "العنوان نفسه نظيف p152/p161/p164/p167"],
  "الفراشه ذات الظهر املاسى": ["الفراشه ذات الظهر الماسى", "OCR بصري p193: الماس"],
  ")نيماتودا الرتبة (مكافحة": ["نيماتودا الرتبة (مكافحة)", "OCR بصري p210 + صيغة نظيفة p209"],
  "اآفات املسطحات اخلضراء": ["آفات المسطحات الخضراء", "OCR بصري p210"],
  "اكاروس املوالح البنى": ["الأكاروس الموالح البنى", "OCR بصري p216"],
  "اكاروس املوالح الحمر": ["الأكاروس الموالح الحمر", "OCR بصري p218"],
  "اكاروس صداأ املوالح": ["الأكاروس صدأ الموالح", "OCR بصري p218"],
  "اكاروس جفاف روؤوس الثوم": ["الأكاروس جفاف رؤوس الثوم", "OCR بصري p30"],
  "نيماتودا التدهور البطئ (فى الأشجار املثمرة)": ["نيماتودا التدهور البطئ (فى الأشجار المثمرة)", "OCR بصري p223"],
  ")نيماتودا التدهور البطئ (فى الغرس احلديث": ["نيماتودا التدهور البطئ (فى الغرس الحديث)", "OCR بصري p224"],
  ")لفحة الأزهار (الأنرثاكنوز": ["لفحة الأزهار (الأنرثاكنوز)", "OCR بصري p230: الأقواس فقط — الاسم العلم كما ورد"],
  "احلشرة القشرية الرخوة (البولفيناريا)": ["الحشرة القشرية الرخوة (البولفيناريا)", "OCR بصري p254 جزئيًا"],
  "اجلرب": ["الجرب", "OCR بصري p265 + تبديل لام"],
  "صداأ اخلوخ": ["صدأ الخوخ", "OCR بصري p272"],
  "حشرات احلبوب املخزونة": ["حشرات الحبوب المخزونة", "OCR بصري p276 جزئيًا + تبديل لام"],
  "حشرات التمور املخزونة": ["حشرات التمور المخزونة", "OCR بصري p277 جزئيًا + تبديل لام"],
  "الصداأ": ["الصدأ", "أ منفصلة (ا+ء) — النمط نفسه المؤكد في p18/p272 + OCR p18"],
  "مرضض الصصداأ فى الثوم": ["مرض الصدأ فى الثوم", "تكرار حروف (مرضض/الصصد) + أ منفصلة — النمط المؤكد في p18"],
  "البياضض الزغبى": ["البياض الزغبى", "العنوان نفسه نظيف p149/p155…"],
  "البياضض الدقيقى": ["البياض الدقيقى", "العنوان نفسه نظيف في عشرات الصفحات"],
  "الدودة القارضضة": ["الدودة القارضة", "العنوان نفسه نظيف p74/p102"],
  "دورة ورق القطن": ["دودة ورق القطن", "OCR بصري p133: دودة ورق — والعنوان نفسه في ~20 صفحة"],
  "تعقيم تربة اأراضى مفتوحة": ["تعقيم تربة أراضى مفتوحة", "حرف زائد قبل الهمزة — OCR/نمط"],
  "ذبابة اأوراق البنجر": ["ذبابة أوراق البنجر", "حرف زائد قبل «أوراق» — OCR p255/p38 يقرأ أوراق مباشرة"],
  "تبقع اأوراق": ["تبقع أوراق", "حرف زائد قبل «أوراق» — OCR p255/p38 يقرأ أوراق مباشرة"],
  "دودة اأوراق الزيتون": ["دودة أوراق الزيتون", "حرف زائد قبل «أوراق» — OCR p255/p38 يقرأ أوراق مباشرة"],
  "حلم صداأ اأوراق اجلوافة": ["حلم صدأ أوراق الجوافة", "OCR بصري p255 (حله صداأ أودزاة…أحوافة) — أ منفصلة + حرف زائد قبل أوراق + تبديل لام في «اجلوافة»"],
};
const HEAD_REVIEW = {
  "مرضض اجلذر القرنفلى": "OCR غير حاسم p28 (مرصس الحده…) — تشابه حروف بلا قراءة حاسمة",
  "دودة احلششد اخلريفية": "OCR غير حاسم p59 — تكرار/تبديل حروف غير محسم",
  "ابيضضاضض القمه النيماتودي": "OCR جزئي p57 (اسضاض الفمه…) — تكرار حروف بلا قراءة حاسمة للاسم كاملاً",
  "ذباب املقات": "OCR p169 (المثات) لا يطابق النص ولا كلمة معروفة — الاسم غير محسم",
  "ة النخيل احلمراءوسس": "بداية العنوان ناقصة في الطباعة + OCR غير حاسم p250",
  "العفن االبيضض االسسكلروتينى": "تعارض مع النظير النظيف p113 «العفن البيض السكلروتيني» وOCR غير حاسم p199",
  "احللم املبطط على ثمار اجلوافة": "OCR غير حاسم p256 — «المبطط/المشطط» غير محسمة",
  "جتعد اأوراق اخلوخ": "«جتعد/جتعة» غير محسمة — OCR غير حاسم p273",
  "ابو دقيق الكرنب": "OCR غير حاسم p192/p196 (أنه دفة) — صيغة الاسم (الأبو دقيق؟) غير مثبتة",
  "ابو دقيق السايكس": "OCR غير حاسم p251",
  "اأبو دقيق الرمان": "OCR غير حاسم p258",
  "الرتبس": "ترتيب حروف محتمل (الرتبس/الربتس) — OCR غير حاسم p23/p131/p233",
  "الرتبسس": "تكرار سين + ترتيب حروف — OCR غير حاسم p29",
};
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

/* ---------- 2) تسمية المحصول: فهرس الكتاب ثم سطر التسمية المطبوع ----------
 * المرجع الأعلى: فهرس الكتاب نفسه — tmp/apc/toc.json مُستخرَج من صفحتي
 * «المحتويات» IX–XII (اسم المدخل + رقم الصفحة المطبوعة؛ PDF = مطبوع + 13).
 * حدود المحاصيل والفصول من الفهرس لا من الاستخراج، وترتيب المدخلات هو ترتيب
 * الطباعة. لكل قسم تُحسم التسمية بالترتيب:
 *   head-entry    عنوان القسم = اسم مدخل فهرس مطابق حرفياً وبدء المدخل في صفحة
 *                 القسم نفسه (مثل «القواقع» p279) ← تسمية مباشرة بالعنوان.
 *   print-label   آخر سطر قبل y عنوان القسم يطابق مدخلاً في نطاق صفحته (سطر
 *                 «<محصول>» أو «<محصول> <عنوان>» — بما فيه تكرار التسمية أعلى
 *                 صفحات الاستكمال) ← تسمية مباشرة بالصفحة و y.
 *   head-combo    سطر العنوان نفسه يبدأ باسم مدخل (تسمية ملتصقة بالعنوان).
 *   carried       تُرَّث من القسم السابق بين سطرين تسميتين — بشرط بقاء الصفحة
 *                 داخل نطاق المدخل (نهاية النطاق = صفحة المدخل التالي لإدماج
 *                 سطر الاستكمال الأعلى).
 *   extraction    بديل أخير من الاستخراج داخل صفحات الكتاب — مُوثَّق بحالته،
 *                 ولا يُقدَّم أبداً على دليل الطباعة عند المعارضة.
 * مطابقة الاسم: تطابق مُنقّى (تشكيل/تطويل/مسافة) ثم تقارب مسافة تحرير ضيّق،
 * وضمن مرشّحي نطاق الصفحة حصراً — لا مطابقة عامة بلا نطاق ولا تخمين.
 */
const tocDoc = existsSync(join(ROOT, 'tmp/apc/toc.json')) ? J('tmp/apc/toc.json') : null;
if (!tocDoc || !Array.isArray(tocDoc.entries) || tocDoc.entries.length < 60) {
  console.error('FATAL: tmp/apc/toc.json ناقص — فهرس الكتاب هو مرجع تسمية المحاصيل');
  process.exit(1);
}
const compact = s => norm(s).replace(/\s+/g, '');
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m * n > 4000) return 99;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let prev2 = null;
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      let m = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        m = Math.min(m, prev2[j - 2] + 1);              // تبادل حرفين متجاورين = 1 (دامر-لاوينشتاين)
      cur[j] = m;
    }
    prev2 = prev; prev = cur;
  }
  return prev[n];
}
/* جدول صريح: صفحة مدخل الفهرس (PDF) ← [اسم العرض، معرّف المحصول].
 * المفتاح رقم صفحة PDF (المطبوع + 13) — حدود مُتحقَّقة من فهرس الكتاب نفسه
 * ومن سطر التسمية المطبوع على الصفحة المرجعية؛ مدخلان يشتركان في صفحة واحدة
 * (p278) يُسجَّلان بالترتيب كما وردَا في الفهرس. لا مطابقة نصية غامضة هنا:
 * الاسم أدناه هو المرجع، ومطابقة سطور الطباعة تتم ضده داخل نطاق الصفحة وحده
 * في entryOf — أي مدخل غير مُسجَّل يوقف البناء (لا استنتاج ولا تخمين).
 * دليل كل حد: سطر التسمية على الصفحة نفسها (mtime التحقّق في سجل التدقيق). */
const TOC_MAP = {
  16: ['القمح', 'wheat'], 21: ['الفول البلدى', 'fieldbean'], 23: ['البصل', 'onion'],
  29: ['الثوم', 'garlic'], 33: ['بنجر السكر', 'sugarbeet'], 43: ['البرسيم', 'alfalfa'],
  44: ['القطن', 'cotton'], 53: ['الكركدية', 'roselle'], 54: ['الأرز', 'rice'],
  58: ['الذرة الشامية', 'sorghum'], 63: ['قصب السكر', 'sugarcane'],
  67: ['الفول السودانى', 'groundnut'], 70: ['السمسم', 'sesame'], 72: ['دوار الشمس', 'sunflower'],
  73: ['فول الصويا', 'soybean'], 74: ['الطماطم', 'tomato'], 102: ['البطاطس', 'potato'],
  125: ['البطاطا', 'potato'], 129: ['الجزر', 'carrot'], 130: ['اللفت', 'leafbeet'],
  131: ['الفلفل', 'pepper'], 135: ['الباذجنان', 'eggplant'], 137: ['الخيار', 'cucumber'],
  153: ['الكوسة', 'koosa'], 155: ['القرع العسلى', 'pumpkin'], 156: ['كوسة اللب', 'koosa_labb'],
  157: ['البطيخ', 'watermelon'], 162: ['بطيخ اللب', 'melo_labb'], 166: ['الشمام', 'melon'],
  168: ['الكانتالوب', 'cantaloupe'], 174: ['الشهد', 'shahd'], 176: ['الفاصوليا', 'bean'],
  181: ['اللوبيا', 'cowpea'], 183: ['البسلة', 'pea'], 186: ['البامية', 'okra'],
  191: ['الكرنب', 'cabbage'], 196: ['البروكلى', 'broccoli'], 197: ['القرنبيط', 'cauliflower'],
  200: ['الخرشوف', 'artichoke'], 201: ['الخس', 'lettuce'], 202: ['السبانخ', 'spinach'],
  203: ['الفراولة', 'strawberry'], 209: ['الزراعات المحمية', 'protected'],
  210: ['المسطحات الخضراء', 'green_areas'], 212: ['الموالح', 'citrus'],
  225: ['الموالح (البرتقال)', 'citrus'], 226: ['المانجو', 'mango'], 232: ['العنب', 'grape'],
  250: ['النخيل', 'dates'], 251: ['نخيل السايكس', 'sykes_palm'], 252: ['الزيتون', 'olive'],
  254: ['الجوافة', 'guava'], 257: ['الرمان', 'pomegranate'], 258: ['التفاح', 'apple'],
  266: ['الكمرثى', 'pear'], 269: ['الخوخ', 'peach'], 273: ['المشمش', 'apricot'],
  274: ['الموز', 'banana'], 276: ['المحاصيل الزراعية المخزونة', 'stored_crops'],
  278: [['المبانى فى الريف والحضر', 'buildings'], ['الحقول والمزارع وحدائق الفاكهة', 'open_fields']],
  279: ['القواقع', 'snails']
};
/* أسماء العرض — للمدخلات الجديدة كما وردت في الفهرس (لا اسم علمي بلا مصدر) */
const TOC_NAME_AR = {
  leafbeet: 'اللفت', koosa_labb: 'كوسة اللب', melo_labb: 'بطيخ اللب', sykes_palm: 'نخيل السايكس',
  green_areas: 'المسطحات الخضراء', stored_crops: 'المحاصيل الزراعية المخزونة',
  buildings: 'المبانى فى الريف والحضر', open_fields: 'الحقول والمزارع وحدائق الفاكهة',
  snails: 'القواقع', protected: 'الزراعات المحمية', banana: 'الموز'
};
const thrOf = k => Math.max(3, Math.min(7, Math.floor(k.length / 4) + 1));
/* بناء المداخل: كل مدخل فهرس ← مدخل واحد من الجدول حسب صفحته وترتيبه */
const tocPdfCount = new Map();
for (const e of tocDoc.entries) tocPdfCount.set(e.pdf, (tocPdfCount.get(e.pdf) || 0) + 1);
/* التشكيل: القيمة إما زوج [اسم، معرّف] لصف واحد، أو مصفوفة أزواج لعدة مداخل في صفحة */
const slotsOf = v => (Array.isArray(v) && Array.isArray(v[0]) ? v : [v]);
const slotErrors = [];
for (const [pdf, n] of tocPdfCount) {
  const slot = TOC_MAP[pdf];
  if (slot === undefined) { slotErrors.push(`p${pdf}: مدخل بلا صف في TOC_MAP`); continue; }
  const rows = slotsOf(slot);
  if (rows.length !== n) slotErrors.push(`p${pdf}: ${n} مدخل${n > 1 ? 'ات' : ''} في الفهرس مقابل ${rows.length} صف`);
}
const extraPdf = Object.keys(TOC_MAP).filter(k => !tocPdfCount.has(Number(k)));
for (const pdf of extraPdf) slotErrors.push(`p${pdf}: صف زائد بلا مدخل في الفهرس`);
const seenPdf = new Map();
const ENTRIES = tocDoc.entries.map((e, i) => {
  const seen = seenPdf.get(e.pdf) || 0;
  seenPdf.set(e.pdf, seen + 1);
  const slot = TOC_MAP[e.pdf];
  const pick = slot === undefined ? null : slotsOf(slot)[seen];
  const next = tocDoc.entries[i + 1];
  return {
    ...e, canon: pick ? pick[0] : e.name, id: pick ? pick[1] : null,
    start: e.pdf, end: next ? next.pdf : SOURCE.sections_pages[1] + 1
  };
});
const unmappedToc = ENTRIES.filter(e => !e.id);
if (unmappedToc.length || slotErrors.length) {
  for (const e of unmappedToc) slotErrors.push(`مدخل بلا معرّف: p${e.pdf} «${e.name}»`);
  console.error('FATAL: فهرس غير متطابق مع TOC_MAP:\n  ' + slotErrors.join('\n  '));
  process.exit(1);
}
const canonSeen = new Set();
for (const e of ENTRIES) {
  if (canonSeen.has(compact(e.canon))) slotErrors.push(`اسم مكرر بين المداخل: «${e.canon}»`);
  canonSeen.add(compact(e.canon));
}
if (slotErrors.length) {
  console.error('FATAL: أسماء مداخل غير فريدة:\n  ' + slotErrors.join('\n  '));
  process.exit(1);
}
console.log(`toc entries: ${ENTRIES.length} مدخلاً ← ${new Set(ENTRIES.map(e => e.id)).size} معرّف محصول (مطابقة صفحات كاملة)`);

/* مطابقة سطر طباعة ← مدخل فهرس (ضمن نطاق الصفحة حصراً)
 * السطر المرشّح للتسمية: بلا «:» ولا أرقام ولا رموز قوائم (سطور المجموعة
 * «الآفة : …» وترويسات الجداول ليست تسمية)، وبلا نثر طويل، ويبدأ باسم المدخل. */
const NOISE_RAW = /[:؛؟!•]/;                     // على النص الخام: norm يمحو الفواصل
const NOISE_NORM = /\d/;                          // أرقام الجداول
/* كلمات ترويسة: رفض بالكلمة الأولى كاملة فقط (لا بادئة — «السم» لا تُسقط «السمسم») */
const NOISE_HEAD = new Set([
  'مظهر', 'الاصابه', 'الافه', 'التوصيات', 'التوصيه', 'المعرض', 'الجدول', 'قيمها', 'قيمه',
  'تصنيف', 'فرته', 'فتره', 'رقم', 'الاسم', 'معدل', 'السم', 'السميه', 'طبقا', 'التجارج',
  'mg', 'who', 'eu', 'epa', 'codex', 'الامان', 'السلامه', 'mrl', 'tolerance', 'قيم',
  'مبدا', 'المرجع', 'الانتاج', 'المساحه'
].map(w => norm(w)));
const labelLog = [];                              // تدقيق كل مطابقة: السطر · المعرّف · المسافة
function entryOf(txt, p) {
  const raw = String(txt == null ? '' : txt);
  if (NOISE_RAW.test(raw)) return null;
  const n = norm(raw);
  if (!n || NOISE_NORM.test(n)) return null;
  if (NOISE_HEAD.has(n.split(/\s+/)[0])) return null;   // كلمة أولى ترويسة
  const c = compact(raw);
  if (!c || c.length < 3 || c.length > 46 || !/[ء-ي]/.test(c)) return null;
  let best = null, bd = 1e9, tie = false, exact = false;
  for (const e of ENTRIES) {
    if (p < e.start || p > e.end) continue;
    const k = compact(e.canon);
    if (c === k) { if (!exact) { best = e; bd = 0; exact = true; tie = false; } continue; }
    if (exact) continue;
    if (c.startsWith(k)) { if (0 < bd) { best = e; bd = 0; tie = false; } continue; }
    if (c.length < k.length) continue;                    // التسمية أقصر من اسم المحصول
    const d = lev(c.slice(0, k.length), k);
    const thr = k.length >= 10 ? 4 : 2;                    // ضيّق للاسم القصير، أرخى للاسم الطويل
    if (d > thr) continue;
    if (d < bd) { best = e; bd = d; tie = false; }
    else if (d === bd && best && best.id !== e.id) tie = true;
  }
  return tie ? null : (best ? { e: best, d: bd } : null);
}
/* إسناد كل قسم بالتسلسل: الصفحة ثم ترتيب الاستخراج */
const sortedForAttr = cards.sections.slice().sort((a, b) => a.page - b.page);
const attrMap = new Map();
let prevAttr = null;
const attrCounts = {};
for (const s of sortedForAttr) {
  const p = s.page;
  const head = s._print && s._print.heading ? s._print : null;
  const prodY = Math.min(...s.products.map(pr => pr._verify?.y?.[0] ?? 9999));
  const hy = head ? head.y : prodY;
  let attr = null;
  // 1) head-entry: عنوان القسم نفسه مدخل فهرس بدأ في هذه الصفحة
  if (head) {
    const hc = compact(head.heading);
    const he = ENTRIES.find(e => e.start === p && compact(e.canon) === hc);
    if (he) attr = { e: he, kind: 'head-entry', y: head.y, line: head.heading, d: 0 };
  }
  // 2) print-label: آخر سطر تسمية مطابق قبل عنوان القسم
  if (!attr) {
    const lines = (printIdx[String(p)]?.lines || []).filter(l => l.y < hy);
    for (const l of lines) {
      const m = entryOf(l.text, p);
      if (m) {
        attr = { e: m.e, kind: 'print-label', y: l.y, line: l.text, d: m.d };
        labelLog.push({ page: p, y: l.y, kind: 'print-label', line: l.text, canon: m.e.canon, id: m.e.id, d: m.d, clen: compact(l.text).length, klen: compact(m.e.canon).length });
      }
    }
  }
  // 3) head-combo: التسمية ملتصقة بسطر العنوان نفسه
  if (!attr && head) {
    const m = entryOf(head.heading, p);
    if (m) {
      attr = { e: m.e, kind: 'head-combo', y: head.y, line: head.heading, d: m.d };
      labelLog.push({ page: p, y: head.y, kind: 'head-combo', line: head.heading, canon: m.e.canon, id: m.e.id, d: m.d, clen: compact(head.heading).length, klen: compact(m.e.canon).length });
    }
  }
  // 4) carried: توريث من القسم السابق بشرط بقاء الصفحة في نطاق المدخل
  if (!attr && prevAttr && p <= prevAttr.e.end) {
    attr = { e: prevAttr.e, kind: 'carried', y: null, from: prevAttr };
  }
  attrMap.set(s, attr || null);
  if (attr) {
    attrCounts[attr.kind] = (attrCounts[attr.kind] || 0) + 1;
    prevAttr = attr;
  }
}
console.log('attribution kinds: ' + JSON.stringify(attrCounts));
function cropOf(s) {
  const a = attrMap.get(s);
  if (!a) {
    // بديل أخير من الاستخراج داخل صفحات الكتاب — مُدوَّن بحالته ولا يُقدَّم على الطباعة
    const extId = s.crop ? resolveCropId(s.crop) : null;
    return extId
      ? { name: s.crop, id: extId, evidence: 'extraction-fallback', print: false }
      : { name: null, id: null, evidence: 'none', print: false };
  }
  if (a.kind === 'extraction') {
    return { name: a.e.canon, id: a.e.id, evidence: 'extraction-fallback', print: false };
  }
  const evidence = a.kind + ':p' + s.page + (a.y != null ? ':y' + a.y : '')
    + (a.e.printed ? ' (مطبوع ' + a.e.printed + ')' : '')
    + (a.line ? ' · سطر «' + String(a.line).trim() + '»' : '');
  return {
    name: a.e.canon, id: a.e.id, evidence, print: true, kind: a.kind,
    printed: a.e.printed, from: a.from || null
  };
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
regBook('بطيخ اللب', 'watermelon', 'الاستخراج ربطه بالبطيخ؛ المحتويات تجزئه مدخلاً مستقلاً-13، وسطور التسمية p162–165 تابعة له — الإسناد المصحَّح melo_labb والتعارض مُدوَّن');
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
/* مدخلات فهرس غير موجودة في الفهرس القديم — بأساميها في المحتويات وصفحاتها */
regBook('اللفت', 'leafbeet', 'مدخل الفهرس-5: مطبوع 117 ← PDF130 — غائب عن الفهرس القديم');
regBook('كوسة اللب', 'koosa_labb', 'مدخل الفهرس-11: مطبوع 143 ← PDF156 — محصول مستقل بمسمّاه');
regBook('بطيخ اللب', 'melo_labb', 'مدخل الفهرس-13: مطبوع 149 ← PDF162 — منفصل عن البطيخ-12 في المحتويات');
regBook('نخيل السايكس', 'sykes_palm', 'مدخل الفهرس-6: مطبوع 238 ← PDF251 — منفصل عن النخيل-5');
regBook('المسطحات الخضراء', 'green_areas', 'مدخل الفهرس-29: مطبوع 197 ← PDF210');
regBook('المحاصيل الزراعية المخزونة', 'stored_crops', 'مدخل «رابعاً: آفات محاصيل متنوعة»-1: مطبوع 263 ← PDF276');
regBook('المبانى فى الريف والحضر', 'buildings', 'مدخل الفهرس-2: مطبوع 265 ← PDF278');
regBook('الحقول والمزارع وحدائق الفاكهة', 'open_fields', 'مدخل الفهرس-3: مطبوع 265 ← PDF278 — الفئران');
regBook('القواقع', 'snails', 'مدخل الفهرس-4: مطبوع 266 ← PDF279');
const NEW_CROPS = {
  fieldbean: 'Field bean', roselle: 'Roselle', cantaloupe: 'Cantaloupe', shahd: 'Shahd',
  koosa: 'Courgette', broccoli: 'Broccoli', artichoke: 'Artichoke', guava: 'Guava',
  protected: 'Protected cultivation', leafbeet: 'Turnip', koosa_labb: 'Marrow',
  melo_labb: 'Labb melon', sykes_palm: 'Sykes palm', green_areas: 'Green areas',
  stored_crops: 'Stored crops', buildings: 'Buildings', open_fields: 'Fields & orchards',
  snails: 'Snails'
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
const GR = /ا?ل?إ?رشادات(\s*خاصة)?\s*[:：]/;   // «ارشادات»/«الإرشادات»/«ارشادات خاصة» بهمزة أو بلاها
const splitGuidance = t => {
  const s = String(t || '');
  const m = s.search(GR);
  if (m > 0) return { timing: printable(s.slice(0, m)).replace(/[:：]\s*$/, ''), guidance: printable(s.slice(m).replace(GR, '')) };
  return { timing: printable(s), guidance: null };
};
/* تطبيع مع الاحتفاظ بموضع كل حرف في النص الأصلي:
   الاكتفاء بـ norm() ثم الشطب بموضعه يقطع النص في مكان خاطئ (norm يحذف
   التشكيل والتطويل ويدمج الفواصل). keepColon يبقي النقطة قائمة كي تُميَّز
   عناوين الحقول («الآفة :») عن ذكر الكلمة في النثر. */
function normMap(s, keepColon = false) {
  const src = String(s || '');
  const step = [];
  for (let i = 0; i < src.length; i++) {
    let ch = src[i];
    if (/[\u064B-\u0652\u0670\u0640]/.test(ch)) continue;   // تشكيل وتطويل
    if ('\u0622\u0623\u0625\u0671'.includes(ch)) ch = '\u0627';
    else if (ch === '\u0629') ch = '\u0647';
    else if (ch === '\u0649') ch = '\u064A';
    else if (ch === '\uFF1A') ch = ':';
    step.push([ch, i]);
  }
  const out = [], map = [];
  let run = null;
  for (const [ch, i] of step) {
    if (keepColon && ch === ':') {
      if (run !== null) { out.push(' '); map.push(run); run = null; }
      if (out.length && out[out.length - 1] !== ' ') { out.push(' '); map.push(i); }
      out.push(':'); map.push(i);
      run = i;                       // ما بعد النقطة يبدأ بفاصل
      continue;
    }
    if (/[\u0621-\u064Aa-z0-9]/.test(ch)) {
      if (run !== null) { out.push(' '); map.push(run); run = null; }
      out.push(ch.toLowerCase()); map.push(i);
    } else if (run === null) run = i;
  }
  if (run !== null) { out.push(' '); map.push(run); }
  let a = 0, b = out.length;
  while (a < b && out[a] === ' ') a++;
  while (b > a && out[b - 1] === ' ') b--;
  return { n: out.slice(a, b).join(''), map: map.slice(a, b) };
}
function cutBleed(s, next) {
  if (!next) return null;
  const fields = ['timing', 'appearance'];
  const nextHeads = [next.heading, next._print?.heading].filter(Boolean).map(norm);
  const sym0 = norm((next.symptom || [])[0] || '');
  for (const f of fields) {
    const val = String(s[f] || ''); if (!val) continue;
    const { n: nv, map } = normMap(val);
    for (const b of [...nextHeads, sym0.length > 25 ? sym0.slice(0, 30) : '']) {
      if (!b) continue;
      const at = nv.indexOf(b);
      if (at > 10 && at < map.length) {
        // اقتطاع عند حدود محتوى القسم التالي (موضع النص الأصلي لا المُطبَّع)
        return { field: f, cut: map[at] };
      }
    }
  }
  return null;
}

/* ---------- تنظيف النص من التسرّب البنيوي ----------
   علامات بنيوية مُتحقَّق منها في الطباعة: ترويسات الصفحات، عناوين حقول
   البطاقة (نظيفة وبحروف مُباعدة أو مشوّهة كما وردت)، وعناوين أعمدة جدول
   المنتجات. وجود علامة داخل حقل يعني أن ما بعدها ليس من هذا القسم
   (تسرّب صفحية أو من عمود/قسم آخر) — يُقتطع عند العلامة ولا يُحذف سجل. */
const CUT_RAW = [                 // نصوص مطبعية فريدة (تطويب/تشويه) تُطابق حرفياً
  '\u0627\u0644\u0645\u0628\u064a\u0640\u0640\u0640\u062f',                    // المبيـــد
  '\u0625\u0631\u0634\u0640\u0640\u0640\u062e\u0640\u0627\u0640\u0635\u0627\u0640\u062f\u0640\u0627\u0640\u062a', // إرشـــخـاـصاـدـاـت
  '\u0645\u064a\u0639\u0627\u0638\u0644\u0625\u062f\u0647\u0635',              // ميعاظلإدهص
  '\u0627\u062a\u0644\u0648\u0645\u0642\u0643\u064a\u0627\u062a \u0641\u062d\u0629', // اتلومقكيات فحة
  '\u062a\u0627\u0648\u0644\u0642\u0645\u0643\u064a\u0627\u062a \u0641\u062d\u0629', // تاولقمكيات فحة
  '\u0627\u0645\u0644\u0625\u0639\u0633\u062f\u062a\u0644 \u062e\u062f\u0627\u0645', // املإعسدتل خدام
  '\u0627\u0644 \u062a\u0627\u0648\u0644\u0635\u064a\u0639\u0627\u062a\u0645\u062f\u0629',   // ال تاولصيعاتمدة
  '\u0627\u0644\u062a\u0627\u0648\u0644\u0635\u064a\u0639\u0627\u062a \u0645\u062f\u0629',   // التاولصيعات مدة
  '\u0627 \u0644\u0627\u062a\u0644\u0648\u0645\u0635\u0639\u0627\u064a\u062a\u0645\u062f\u0629', // ا لاتلومصعايتمدة
  '\u0627\u0644\u0633\u0645 \u0627\u0644\u0639\u0627\u0645\u0639\u062f\u0644',  // السم العامعدل
  '\u0627\u0644\u062a\u0627\u0648\u0644\u0635\u064a\u0639\u0627\u062a\u0645\u062f\u0647'  // (احتياط)
];
const STRIP_RAW = [               // عمود «موسم الإصابة»: يُدرج وسط النص ولا يقطعه
  '\u0645\u0627\u0638\u0644\u0625\u0647\u0635\u0631 \u0627\u0628\u0629'
];
const CUT_NORM = [                // عناوين نظيفة: تُطابق بعد التطبيع مع بقاء النقطة
  '\u0627\u0644\u062a\u0648\u0635\u064a\u0627\u062a \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629',
  '\u0644\u062c\u0646\u0629 \u0645\u0628\u064a\u062f\u0627\u062a \u0627\u0644\u0622\u0641\u0627\u062a \u0627\u0644\u0632\u0631\u0627\u0639\u064a\u0629',
  '\u062c\u0644\u0646\u0629 \u0645\u0628\u064a\u062f\u0627\u062a \u0627\u0644\u0622\u0641\u0627\u062a \u0627\u0644\u0632\u0631\u0627\u0639\u064a\u0629',
  '\u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0632\u0631\u0627\u0639\u0629 \u0648\u0627\u0633\u062a\u0635\u0627\u0644\u062d',
  '\u0648\u0627\u0633\u062a\u0635\u0644\u0627\u062d',
  '\u0645\u0638\u0647\u0631 \u0627\u0644\u0625\u0635\u0627\u0628\u0629 :',
  '\u0645\u064a\u0639\u0627\u062f \u0638\u0647\u0648\u0631 \u0627\u0644\u0625\u0635\u0627\u0628\u0629 :',
  '\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0645\u0643\u0627\u0641\u062d\u0629 :',
  '\u0627\u0644\u0625\u0631\u0634\u0627\u062f\u0627\u062a :',
  '\u0627\u0631\u0634\u0627\u062f\u0627\u062a \u062e\u0627\u0635\u0629 :',
  '\u0627\u0644\u0622\u0641\u0629 :',
  '\u0631\u0642\u0645 \u0627\u0644\u0633\u0645 \u0627\u0644\u062a\u062c\u0627\u0631\u064a',
  '\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0648\u0627\u0644\u062a\u0631\u0643\u064a\u0632',
  '\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u0633\u0645\u064a\u0629'
];
function junkTrim(raw) {
  const original = printable(raw);
  if (!original) return { text: original, changed: false };
  let v = original;
  for (let guard = 0; guard < 8; guard++) {
    const { n, map } = normMap(v, true);
    let best = null;
    const put = (rawIdx, endIdx, strip) => {
      if (rawIdx < 0) return;
      if (!best || rawIdx < best.rawAt || (rawIdx === best.rawAt && strip && !best.strip)) {
        best = { rawAt: rawIdx, rawEnd: endIdx, strip };
      }
    };
    for (const m of CUT_RAW) {
      const at = v.indexOf(m);
      if (at >= 0) put(at, at + m.length, false);
    }
    for (const m of STRIP_RAW) {
      let from = 0, at;
      while ((at = v.indexOf(m, from)) >= 0) { put(at, at + m.length, true); from = at + m.length; }
    }
    for (const m of CUT_NORM) {
      const needle = normMap(m, true).n;
      if (!needle) continue;
      const at = n.indexOf(needle);
      if (at < 0 || at >= map.length) continue;
      const last = Math.min(at + needle.length - 1, map.length - 1);
      put(map[at], map[last] + 1, false);
    }
    if (!best) break;
    if (best.strip || best.rawAt === 0) {
      v = printable(v.slice(0, best.rawAt) + ' ' + v.slice(best.rawEnd));  // علامة المطلع: تُحذف وحدها
      continue;
    }
    v = printable(v.slice(0, best.rawAt));
    break;
  }
  return { text: v, changed: v !== original };
}

const sorted = cards.sections.slice().sort((a, b) => a.page - b.page);
const outSections = [];
const cropStats = new Map();
let curCrop = null, curGroup = null, cropConflicts = 0;

sorted.forEach((s, idx) => {
  const pc = cropOf(s);
  if (pc.name !== curCrop) { curCrop = pc.name; curGroup = null; }
  let cropConflict = null;
  const extId = s.crop ? resolveCropId(s.crop) : null;
  if (pc.id && extId && extId !== pc.id) {
    cropConflict = {
      extraction: s.crop, print_label: pc.name, evidence: pc.evidence,
      ...(pc.printed ? { toc_printed: pc.printed } : {})
    };
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
  // التشكيل والتطويل حروف ملء داخل الكلمة: تُزال بلا مسافة (مسافة تقطع الكلمة: «اللفح ة» من «اللفحــة»)
  nameAr = printable(nameAr.replace(/[\u064B-\u0652\u0670\u0640]/g, ''));
  if (nameAr !== printable(beforeClean)) nameFix = { ...(nameFix || { from_extraction: printable(beforeClean) }), display_normalized: true };

  const revReason = HEAD_REVIEW[nameAr];
  const fixE = HEAD_FIX[nameAr];
  if (fixE) {
    const preFix = nameAr;
    nameFix = { ...(nameFix || {}), from_print: preFix, to_display: fixE[0], basis: fixE[1] };
    nameAr = fixE[0];
  }
  const nameGarbled = /[\uFFFD]/.test(nameAr);
  const noPrintHead = !s._print?.heading;
  const nameStatus = (nameGarbled || noPrintHead || revReason) ? 'NEEDS_REVIEW' : 'VERIFIED';

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

  // تنظيف حقول الكتاب الأربعة من التسرّب (ترويسة/عمود/قسم آخر) مع تسجيل ما اقتُطع
  const tj = {
    symptom: (s.symptom || []).map(x => junkTrim(x).text).filter(Boolean),
    appearance: junkTrim(s.appearance).text,
    timing: junkTrim(timing).text,
    guidance: junkTrim(guidance).text
  };
  const changedFields = [
    ['symptom', (s.symptom || []).map(printable).join('\n')],
    ['appearance', printable(s.appearance)],
    ['timing', printable(timing)],
    ['guidance', printable(guidance)]
  ].filter(([f, before]) => (f === 'symptom' ? tj[f].join('\n') : tj[f]) !== before).map(([f]) => f);
  const textFix = changedFields.length
    ? { fields: changedFields, reason: 'تسرّب ترويسة/عمود/قسم آخر داخل الحقل — مقتطع عند العلامة البنيوية والنص الأصلي محفوظ في الاستخراج' }
    : null;

  const cropId = pc.id || (pc.name ? resolveCropId(pc.name) : null);
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
    ...(revReason ? { name_status_reason: revReason } : {}),
    ...(nameFix ? { name_fix: nameFix } : {}),
    ...(cropConflict ? { crop_conflict: cropConflict } : {}),
    ...(bleed ? { timing_fix: { cut_from: bleed.field, reason: 'نص القسم التالي متسرّب في الاستخراج — محفوظ عند صاحبه' } } : {}),
    page: s.page,
    printed_page: s.page - SOURCE.printed_offset,
    pages: s.pages || [s.page],
    crop_evidence: pc.evidence,
    ...(String(pc.evidence).startsWith('carried') ? { crop_carried_from: s.page } : {}),
    symptom: tj.symptom,
    appearance: tj.appearance,
    timing: tj.timing,
    guidance: tj.guidance,
    ...(textFix ? { text_fix: textFix } : {}),
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
  if (!canonName.has(cropId)) canonName.set(cropId, prevName.get(cropId) || TOC_NAME_AR[cropId] || cs.name);
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
    const ev = String(sec.crop_evidence || '');
    const printProven = ev.startsWith('print-label') || ev.startsWith('head-entry') || ev.startsWith('head-combo');
    const review = inf.name_status === 'NEEDS_REVIEW' || (!!inf.crop_conflict && !printProven);
    auditRows.push({
      crop_id: c.id, infection_id: `${c.id}.${inf.n}`,
      old_name: null, name_in_source: inf.name_ar,
      printed_page: inf.printed_page, pdf_page: inf.pdf_page,
      status: review ? 'NEEDS_REVIEW' : 'VERIFIED',
      action: (inf.crop_conflict && printProven
        ? 'أُثبت ربط الكتاب بالسطر المطبوع (' + ev + ') — الاستخراج كان «' + sec.crop_conflict.extraction + '» · مطبوع ' + inf.printed_page + ' / PDF ' + inf.pdf_page
        : review
          ? 'عنوان/ربط من الكتاب يحتاج مراجعة' + (inf.crop_conflict ? ' (تعارض تسمية محصول: الاستخراج قال ' + sec.crop_conflict.extraction + ')' : '') + ' — معروض بحالته صراحةً'
          : 'من الكتاب مباشرة') + (isNew ? ' · مُضاف للقسم' : '')
    });
  }
}
auditNotes.push(`فهرس الكتاب (المحتويات IX–XII) هو مرجع حدود المحاصيل: ${ENTRIES.length} مدخلاً (PDF = مطبوع + 13)؛ تسمية الصفحة من سطر الطباعة قبل عنوان القسم مباشرة بصفحته وموضع y.`);
if (noCrop.length) auditNotes.push(`أقسام بلا معرّف محصول: ${noCrop.join('، ')}`);
if (alignReport.length) auditNotes.push(`تعارض عدّ عنوان/قسم في الصفحات: ${JSON.stringify(alignReport)}`);
auditNotes.push('اللوبى = cowpea بمطابقة تسمية حرفيّة.');
auditNotes.push('تصحيح العناوين بالتحقق البصري: 50 نصًّا مصححًا بـ OCR للصفحة الأصلية أو بعنوان مماثل مطبوع نظيفًا (HEAD_FIX، مسجَّل في name_fix) '
  + 'و13 عنوانًا قيد المراجعة (HEAD_REVIEW: النص كما ورد في الطباعة + سبب الحسم المتعذّر، name_status=NEEDS_REVIEW).');
auditNotes.push('فصل الفول السودانى عن اللوبيا: صفحات 67-69 (مطبوع 54 / PDF 67-69) كانت مدرجةً سابقاً ضمن cowpea (الإصدار 1.19.30: cowpea بـ 9 بطاقات على 67-69 و181-183). سطر التسمية المطبوع على p67 و p68 و p69 «الفول السودانى …» ومدخل الفهرس (مطبوع 54 / PDF 67 «الفول الس ودانى») يثبتان محصولاً منفصلاً، بينما قسم «اللوبيا» يبدأ من مطبوع 168 / PDF 181 بسطر تسمية مستقل — الحالة السابقة والجديدة موثقتان هنا سبب التغيير. الدليل البصري: OCR لصورة الصفحة الأصلية p67 يقرأ «الفول السودانى». الحالة الجديدة: groundnut 5 بطاقات (67-69) + cowpea 4 بطاقات (181-183).');
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
writeFileSync(join(ROOT, 'tmp/apc/label_matches.json'), JSON.stringify(labelLog, null, 1) + '\n');

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
console.log(`toc entries: ${ENTRIES.length} (all mapped)`);
console.log(`label sequence (TOC boundaries):`);
let last = null;
for (const e of ENTRIES) {
  if (e.id !== last) { console.log(`   p${e.start}: ${e.canon} → ${e.id} (printed ${e.printed})`); last = e.id; }
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
