#!/usr/bin/env node
/**
 * make-owner-report.mjs — يولّد التقرير العربي الموجّه لمالك المشروع
 * reports/owner-review-report-ar.md من ملفات CSV الثلاثة + summary-stats.json.
 * لا يكتب في extracted/ ولا بيانات التطبيق. إعادة التشغيل تعيد كتابة التقرير نفسه.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REPR = path.join(ROOT, 'reports');
const VER = path.join(ROOT, 'verification');
const TODAY = '2026-10-28';

function parseCSV(s) {
  const out = []; let cur = [], f = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(f); f = ''; }
    else if (c === '\n') { cur.push(f); out.push(cur); cur = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || cur.length) { cur.push(f); out.push(cur); }
  return out;
}
const readCsv = (name) => {
  const rows = parseCSV(fs.readFileSync(path.join(REPR, name), 'utf8').replace(/^\uFEFF/, ''));
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? ''])));
};
const esc = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const stats = JSON.parse(fs.readFileSync(path.join(VER, 'summary-stats.json'), 'utf8'));
const cas = readCsv('owner-review-cas.csv');
const missing = readCsv('owner-review-missing-fields.csv');
const bio = readCsv('owner-review-biologicals.csv');
const L = [];
const p = (s = '') => L.push(s);

/* ===== الترويسة ===== */
p('# تقرير مراجعة المالك — تدقيق CAS والبيانات الناقصة في حزمة APC 2025');
p();
p('- **المستودع:** `bob66aker-cpu/al-mustashar` · **الفرع:** `audit/apc-2025-data-integration` (مسودة PR #6 — لم تُدمج)');
p('- **تاريخ التحقق:** ' + TODAY + ' · **الحزمة:** `data/apc2025_review/apc_cards_dataset_v2.zip`');
p('- **المصدر الزراعي المعتمد:** كتاب «التوصيات المعتمدة لمكافحة الآفات الزراعية 2025» (APC 2025) — لا مصادر زراعية أخرى.');
p('- **حالة الإنتاج:** لم يتغير شيء — لا `data/tws` ولا `src/` ولا `index.html` ولا `sw.js` ولا إعدادات النشر؛ ولم يُحذف أي بطاقة أو صف.');
p('- **المصدر الأصلي محفوظ كما هو:** 338 بطاقة · 3482 صف مصدر · 2033 توصية مجمّعة (لم تُمس).');
p();
p('> يفصل هذا التقرير ما **ثبت** عما **لم يثبت**. خانة CAS لا تُملأ إلا برقم منقول من مصدر مفتوح موثوق');
p('> ومشروح، وما لم يثبت يبقى فارغاً أو موسوماً بحالة — لا يُعرض تقديراً كأنه نتيجة.');
p();

/* ===== أ. ملخص تنفيذي ===== */
p('## أ. ملخص تنفيذي');
p();
p('### أرقام CAS — إجمالي المواد المفحوصة: ' + stats.total_actives);
p();
p('| البند | العدد | ملاحظة حاسمة |');
p('|---|---:|---|');
p('| إجمالي المواد التي فُحصت | **' + stats.total_actives + '** | من `actives.json` بالحزمة (261 برقم مرشح + 12 بلا رقم) |');
p('| أرقام مثبتة من **مصدر أولي** (CAS Registry / Common Chemistry) | **0** | واجهة Common Chemistry أعادت `401 Unauthorized` بتاريخ 2026-10-28 — **لم يُنفَّذ تحقق من المصدر الأولي إطلاقاً** ولا يُدّعى خلافه |');
p('| أرقام مثبتة من **مصدر ثانوي موثوق** (PPDB — جامعة هيرتفوردشاير: صفحة مادة مفتوحة ونُقل رقمها كما هو) | **' + stats.confirmed + '** | منها ' + cas.filter((r) => r['حالة_الإثبات'].startsWith('مثبت — مصدران')).length + ' مدعومة أيضاً بقائمة RN في PubChem (درجة عالية)، و' + cas.filter((r) => r['حالة_الإثبات'].startsWith('مثبت — PPDB')).length + ' بلا سجل PubChem بالاسم — خليط/زيت/بوليمر (درجة متوسطة) |');
p('| أرقام **مرشحة غير محسومة** | **' + (stats.conflict + stats.pc_only + stats.identity_only + stats.not_found) + '** | ' + stats.conflict + ' تعارض · ' + stats.pc_only + ' متوافقة بـPubChem فقط · ' + stats.identity_only + ' هوية بالرقم دون مطابقة اسم · ' + stats.not_found + ' بلا أي دليل مفتوح — كلها في الجدول (ج) |');
p('| مواد **لم يُعثر لها على CAS** في المصادر التي فُحصت | **' + stats.no_pkg_cas + '** | 7 حيوية بلا رقم في الحزمة + 5 كيميائية بلا رقم في الحزمة (4 منها لها مرشح PubChem، و1 بلا نتيجة) |');
p('| حالات ثبت فيها **صراحةً عدم تعيين CAS** (`NO_CAS_ASSIGNED`) | **' + stats.no_cas_assigned_proven + '** | **لا دليل صريح واحد** — قاعدة: عدم العثور على رقم ≠ إثبات عدم التعيين |');
p('| **المواد الحيوية** — مؤكد (اسم كائن علمي) | **' + stats.biological_confirmed + '** | 7 بلا رقم في الحزمة + Bacillus thuringiensis برقم في الحزمة |');
p('| **المواد الحيوية** — محتمل (منتج مشتق حيائياً/نباتياً) | **' + stats.biological_probable + '** | زيوت/مستخلصات + streptomycin — لا تصنيف نهائي لهما |');
p();
p('### الحقول الأخرى الناقصة أو المتعارضة — ' + missing.length + ' صف مراجعة');
p();
const fieldDist = {};
for (const r of missing) fieldDist[r['اسم_الحقل']] = (fieldDist[r['اسم_الحقل']] || 0) + 1;
p('| نوع الحقل | العدد |');
p('|---|---:|');
for (const [k, v] of Object.entries(fieldDist).sort((a, b) => b[1] - a[1])) p('| ' + esc(k) + ' | ' + v + ' |');
p('| **المجموع** | **' + missing.length + '** |');
p();
p('**قرارات حاسمة تنتظر المالك:** 7 تعارضات CAS (منها 3 يثبت فحص الهوية أنها أرقام أشكال/ملحات مختلفة) · 5 مواد كيميائية بلا رقم في الحزمة ·');
p('80 بطاقة حشائش بلا مقابل في التطبيق · 381 مجموعة تكرار مقترح داخل البطاقات · 427 خانة فترة أمان فارغة أو متعارضة (منها 266 في العنب) · 3 محاصيل بلا معرّف مقابل.');
p();

/* ===== ب. جدول CAS المثبتة ===== */
const confirmed = cas.filter((r) => r['حالة_الإثبات'].startsWith('مثبت'));
p('## ب. جدول CAS المثبتة');
p();
p('عدد الصفوف: **' + confirmed.length + '** من ' + stats.total_actives + '. «مثبت» هنا = **نُقل رقم CAS من صفحة مادة PPDB مفتوحة فعلياً' +
  (confirmed.some((r) => r['حالة_الإثبات'].includes('مصدران')) ? ' وطابق الرقم الذي يعيده PubChem للاسم نفسه' : '') +
  '** — ولا يعني «مثبتاً من المرجعية الأمريكية CAS Registry» لأن تلك الواجهة مغلقة (انظر (و)). الدرجة الكاملة وسبب المطابقة وملاحظات اختلاف الشكل/الملح في `owner-review-cas.csv`.');
p();
p('**المفتاح:** «عالية» = مصدران مستقلان (PPDB + PubChem) · «متوسطة» = PPDB وحده وبلا سجل PubChem بالاسم.');
p();
p('| # | الاسم الأصلي (الكتاب) | الاسم المطابق في المصدر | رقم CAS | الدرجة | المصدر والرابط المباشر | صفحات الطباعة | صفوف المصدر |');
p('|---:|---|---|---|---|---|---|---:|');
confirmed.forEach((r, n) => {
  const two = r['حالة_الإثبات'].startsWith('مثبت — مصدران');
  const src = two ? 'PPDB+PubChem' : (r['المصدر_الناشر'].includes('PPDB') ? 'PPDB' : 'PubChem');
  p('| ' + (n + 1) + ' | ' + esc(r['الاسم_الأصلي_كما_في_الحزمة']) + ' | ' + esc(r['الاسم_القياسي_المطابق']) + ' | `' + esc(r['رقم_CAS_المثبت_من_المصدر']) + '` | ' + esc(r['درجة_الموثوقية']) + ' | ' + src + ' · [صفحة المصدر](' + r['رابط_مباشر'] + ') | ' + esc(r['الصفحات_المطبوعة']) + ' | ' + esc(r['عدد_صفوف_المصدر']) + ' |');
});
p();

/* ===== ج. جدول CAS تحتاج مراجعة المالك ===== */
const conflicts = cas.filter((r) => r['حالة_الإثبات'].includes('تعارض'));
const pcOnly = cas.filter((r) => r['حالة_الإثبات'].includes('PubChem فقط'));
const identityOnly = cas.filter((r) => r['حالة_الإثبات'].includes('هوية بالرقم'));
const notFound = cas.filter((r) => r['حالة_الإثبات'].includes('لم يُعثر على تأكيد'));
const noPkgChem = cas.filter((r) => r['حالة_الإثبات'].includes('مادة غير حيوية'));
const decisionMap = {
  'Buprofezin': 'كلا الرقمين 69327-76-0 و953030-84-7 يعودان في PubChem إلى عنوان واحد (بنية/تاوتومر نفسه) — أيّ الرقمين يُعتمد؟ (PPDB يعرض 953030-84-7)',
  'Florpyrauxifen-benzyl': 'رقم الحزمة 943832-81-3 يعيد PubChem بعنوان «Florpyrauxifen» أي الحمض، ورقم PPDB 1390661-72-9 بعنوان «Florpyrauxifen-benzyl» أي الفعل البنزيلي — هل رقم الكتاب للحمض خطأً؟ حسم الرقم المعتمد',
  'Flutianil': 'رقم الحزمة 304900-25-2 له CID في PubChem لكنه غير مدرج ضمن قائمة RN للاسم؛ PPDB وPubChem يسجلان 958647-10-4 للاسم «Flutianil» — حسم الرقم المعتمد',
  'Glyphosate potassium': 'كلا الرقمين 70901-12-1 و39600-42-5 يعيدان في PubChem إلى بوتاسيوم جلايفوسات واحد؛ PPDB يعرض 39600-42-5 — أيّهما يُعتمد؟',
  'Iminoctadine tris(albesilate)': 'رقم الحزمة 169202-06-6 بعنوان PubChem «Iminoctadine trialbesilate»؛ رقم PPDB 99257-43-9 بعنوان «tris(albesilate)» لكن اسمه الكيميائي في الصفحة tris(dodecylbenzenesulfonate) — احتمال ملح/مزيج مختلف — حسم بعد فحص صفحة الكتاب',
  'Indoxacarb': '144171-61-9 («Indoxacarb, (+-)») و173584-44-6 («Indoxacarb») كلاهما في PubChem ضمن قائمة RN للاسم؛ PPDB يعرض 173584-44-6 — أيّهما يُعتمد؟',
  'Mineral oil': 'رقم الحزمة 8042-47-5 بلا CID في PubChem (404 بالاسم والرقم)، وصفحة PPDB لـParaffin oil تعرض 64742-46-7 — لا تأكيد لأي منهما في المصادر المفتوحة — يلزم CAS Registry',
  'Copper sulfate (tribasic)': 'الاستعلام بالرقم 1344-73-6 يعيد «Sulfuric acid, copper salt, basic» — تطابق «tribasic» مع «basic» يستدعي إقراراً لا يُفترض',
  'Jasmine oil': 'رقم الحزمة 8022-96-6 بلا تأكيد (PPDB بلا مدخل مطابق، PubChem 404 بالاسم والرقم) — يلزم CAS Registry أو قبول بقاءه بلا تأكيد خارجي',
  'Chlorimuron-methyl': 'PubChem يرجع 128569-20-0 للاسم — مرشح فقط؛ قرار: يُثبت بمصدر إضافي أم يبقى فارغاً',
  'Clodinafop-butyl': 'PubChem لا يعرف الإستر butyl (اقتراحه الآلي Clodinafop-propargyl الموجود في الحزمة برقم منفصل) — قرار: رقم من CAS Registry أو إقرار عدم توفّره',
  'Fenoxaprop-P-butyl': 'PubChem لا يعرف الإستر butyl (اقتراحه الآلي Fenoxaprop-P-ethyl الموجود في الحزمة برقم منفصل) — قرار: رقم من CAS Registry أو إقرار عدم توفّره',
  'Thioahatate-methyl': 'الاسم محرف في الكتاب؛ اقتراح PubChem الآلي thiophanate-methyl الموجود في الحزمة برقم 23564-05-8 — قرار: تصحيف أم مادة مستقلة؟ (لا يُسند رقم دون قرار صريح)',
  'Copper complex': 'مادة غير معرَّفة تركيبياً في الكتاب (اقتراح PubCHEM الآلي بلا صلة) — تحديد التركيبة من الصفحة أولاً ثم بحث الرقم',
};
p('## ج. جدول CAS التي تحتاج إلى مراجعة المالك');
p();
p('عدد الصفوف: **' + (conflicts.length + pcOnly.length + identityOnly.length + notFound.length + noPkgChem.length) + '** (' +
  conflicts.length + ' تعارض · ' + pcOnly.length + ' مساند واحد · ' + identityOnly.length + ' هوية بالرقم فقط · ' +
  notFound.length + ' بلا دليل · ' + noPkgChem.length + ' مواد كيميائية بلا رقم في الحزمة).');
p('**الرقم المثبت ≠ الرقم المقترح:** «رقم الحزمة» غير محسوم مهما كان صحيحاً حسابياً — صحة خانة check digit ليست دليل إسناد.');
p();
p('| الاسم الأصلي | رقم الحزمة (غير محسوم) | الرقم الآخر في المصادر | المصدر والرابط | سبب عدم الحسم | القرار المطلوب من المالك |');
p('|---|---|---|---|---|---|');
for (const r of [...conflicts, ...pcOnly, ...identityOnly, ...notFound, ...noPkgChem]) {
  const st = r['حالة_الإثبات'];
  let other;
  if (st.includes('تعارض')) other = 'رقم PPDB: ' + r['رقم_CAS_المثبت_من_المصدر'];
  else if (st.includes('PubChem فقط')) other = 'قائمة RN للاسم: ' + r['رقم_CAS_المثبت_من_المصدر'];
  else if (st.includes('هوية بالرقم')) other = 'هوية الرقم في PubChem معروضة في سبب عدم الحسم';
  else if (st.includes('مادة غير حيوية')) other = r['رقم_CAS_المثبت_من_المصدر'] || 'لا مرشح';
  else other = 'لا نتيجة';
  const dec = decisionMap[r['الاسم_الأصلي_كما_في_الحزمة']] ||
    'قبول المساندة الوحيدة أم طلب رقم من CAS Registry قبل الاعتماد';
  p('| ' + esc(r['الاسم_الأصلي_كما_في_الحزمة']) + ' | `' + esc(r['رقم_CAS_في_الحزمة']) + '` | ' + esc(other) + ' | ' +
    esc(r['المصدر_الناشر']) + ' · ' + (r['رابط_مباشر'] ? '[رابط](' + r['رابط_مباشر'] + ')' : '—') + ' | ' +
    esc(r['سبب_القبول_أو_الرفض'].slice(0, 320)) + ' | ' + esc(dec) + ' |');
}
p();

/* ===== د. جدول المواد الحيوية ===== */
p('## د. جدول المواد الحيوية');
p();
p('**' + stats.biological_confirmed + ' مؤكد** (اسم كائن علمي) + **' + stats.biological_probable + ' محتمل** (منتج مشتق حيائياً/نباتياً — يبقى غير مصنَّف حتى قرار المالك).');
p('الخانة تبقى **فارغةً** حيث لا رقم: عدم العثور على رقم في PPDB/PubChem ليس دليلاً على عدم التعيين، ولم يُستخدم `NO_CAS_ASSIGNED` في أي صف.');
p();
p('| الاسم كما طُبع | التصنيف | المصادر التي فُحصت | النتيجة | سبب بقاء CAS فارغاً | صفحات الطباعة | ما يحتاج مراجعة المالك |');
p('|---|---|---|---|---|---|---|');
for (const r of bio.filter((b) => b['التصنيف'] !== 'غير حيوية'))
  p('| ' + esc(r['الاسم_كما_طُبع']) + ' | ' + esc(r['التصنيف']) + ' | ' + esc(r['المصادر_التي_فُحصت'].slice(0, 280)) + ' | ' + esc(r['النتيجة']) + ' | ' + esc(r['سبب_بقاء_CAS_فارغاً']) + ' | ' + esc(r['الصفحات_المطبوعة']) + ' | ' + esc(r['ما_يحتاج_مراجعة_المالك']) + ' |');
p();
p('> المواد الـ5 غير الحيوية بلا رقم مدرجة في الجدول (ج) وفي `owner-review-biologicals.csv` بتصنيف «غير حيوية» للتمييز فقط.');
p();

/* ===== (هـ) و(و) — الجزء الثاني ===== */
const { renderPart2 } = await import('./report-part2.mjs');
const part2 = renderPart2({ p, esc, missing, cas, bio, stats, TODAY });
fs.writeFileSync(path.join(REPR, 'owner-review-report-ar.md'), L.join('\n') + '\n');
console.log('REPORT OK lines=' + L.length + ' notFound=' + notFound.length + ' leftover=' + part2.leftover);
