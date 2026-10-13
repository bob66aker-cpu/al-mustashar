/*
 * tests/validate-advice.test.mjs — اختبار ذاتي لمدقّق حزمة الإرشاد (D59)
 * ----------------------------------------------------------------------
 * يثبت أن المدقّق يمسك العيوب فعلاً: حزمة صحيحة صغرى تمر، وكل عيب مُحقَّن
 * وحده يفشل بالسبب الصحيح. ثم يفحص الحزمة الحقيقية وتقرير المطابقة.
 * Run: node tests/validate-advice.test.mjs
 */
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack } from '../scripts/validate-advice.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' — ' + extra}`);
  ok ? pass++ : fail++;
};

/* ---------- حزمة صالحة صغرى كأساس لكل حقن ---------- */
const makeCard = (id = 'wheat-blight') => ({
  id, crop_id: 'wheat',
  problem: { name_ar: 'مرض تجريبي للفحص', type: 'fungal', aliases_ar: ['تجريبي'] },
  status: 'draft', reviewed_by: null, reviewed_on: null, review_by: '2027-01-01', version: 1,
  local_status: { libya: 'unverified', note_ar: 'حالة تجريبية لل اختبار فقط لا تدعي شيئاً.' },
  confirm_first: {
    intro_ar: 'نص تأكيد أولي كافٍ الطول لل اختبار لا يشخّص شيئاً بل يطلب التأكد من المختص أولاً.',
    signs_ar: ['عرض أول كافٍ الطول لل نص التجريبي.', 'عرض ثانٍ كافٍ الطول لل نص التجريبي.'],
    lookalikes: [{ name_ar: 'تشابه تجريبي', note_ar: 'ملاحظة تشابه كافية الطول لل نص التجريبي.', evidence: 'B', source_ids: ['s1'] }],
    lab_tests_ar: []
  },
  cultural: [{ id: 'c1', text_ar: 'بند زراعي تجريبي كافٍ الطول لا يحوي أي جرعة.', evidence: 'B', source_ids: ['s1'], applies_if: null }],
  nutrition: [],
  chemical: {
    note_ar: 'ملاحظة كيميائية تجريبية تكفي الطول ولا تذكر أي جرعة إطلاقاً.',
    options: [{
      id: 'o1', group_ar: 'مجموعة تجريبية', moa_scheme: 'FRAC', moa: '3', moa_note_ar: null,
      ingredients: [{ ar: 'مادة تجريبية', en: 'test-active', alt_names: [] }],
      timing_ar: 'توقيت تجريبي كافٍ الطول لا يذكر جرعة.', caution_ar: 'تحذير تجريبي كافٍ الطول لا يذكر جرعة.',
      evidence: 'B', source_ids: ['s1']
    }]
  },
  non_chemical: [{ id: 'b1', text_ar: 'بند غير كيميائي تجريبي كافٍ الطول بلا أي جرعة.', evidence: 'B', source_ids: ['s1'], applies_if: null }],
  prevention: [{ id: 'p1', text_ar: 'بند وقاية تجريبي كافٍ الطول لا يحوي أي جرعة إطلاقاً.', evidence: 'B', source_ids: ['s1'], applies_if: null }],
  see_expert_when_ar: ['متى تطلب مختصاً أولاً في النص التجريبي.', 'متى تطلب مختصاً ثانياً في النص التجريبي.'],
  sources: [{ id: 's1', title: 'Test Source Title', publisher: 'Test Publisher', url: 'https://example.org/test-source', type: 'extension', retrieved: '2026-10-13' }]
});
const makePack = () => ({
  'manifest.json': JSON.stringify({
    schema: 1, built: '2026-10-13', feature: 'irsheed',
    modifiers_file: 'data/advice/modifiers.json', report_file: 'data/advice/advice-registry-report.json',
    crops: [{ id: 'wheat', file: 'data/advice/wheat.json', name_ar: 'القمح', name_en: 'Wheat', name_fr: 'Blé' }],
    owner_initial_cards: []
  }, null, 2),
  'modifiers.json': JSON.stringify({
    schema: 1,
    modifiers: { soil: { label_ar: 'التربة', values: [{ id: 'sandy', ar: 'رملية' }, { id: 'clay', ar: 'طينية' }] } },
    unknown_label_ar: 'غير محدد'
  }, null, 2),
  'wheat.json': JSON.stringify({ schema: 1, crop_id: 'wheat', crop_name_ar: 'القمح', cards: [makeCard()] }, null, 2)
});
function withPack(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'advice-'));
  const files = makePack();
  for (const [f, c] of Object.entries(files)) writeFileSync(join(dir, f), c);
  const d = { files: Object.fromEntries(Object.entries(files).map(([f, c]) => [f, JSON.parse(c)])) };
  mutate(d);
  for (const [f, o] of Object.entries(d.files)) writeFileSync(join(dir, f), JSON.stringify(o, null, 2));
  const res = validatePack(dir);
  rmSync(dir, { recursive: true, force: true });
  return res;
}
const has = (res, re) => res.errors.some(e => re.test(e));

/* ================= حالات سالبة (19) ================= */
let r;
r = withPack(() => {}); check('حزمة صالحة صغرى تمر بلا أخطاء', r.errors.length === 0, r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].text_ar = 'رشّة بمقدار 10 مل لكل لتر ماء.'; });
check('رصد نمط جرعة (مل)', has(r, /نمط جرعة/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].text_ar = 'تطبيق بمقدار 2 كغ لكل هكتار.'; });
check('رصد نمط جرعة (كغ/هكتار)', has(r, /نمط جرعة/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].non_chemical = []; });
check('رفض بطاقة بلا شق غير كيميائي', has(r, /non_chemical إلزامي/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].applies_if = { unknown_key: ['sandy'] }; });
check('رفض applies_if بمفتاح غير معروف', has(r, /مفتاح applies_if غير معروف/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].applies_if = { soil: ['volcanic'] }; });
check('رفض applies_if بقيمة غير معروفة', has(r, /قيمة applies_if غير معروفة/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].evidence = 'D'; });
check('رفض evidence خارج {A,B,C}', has(r, /evidence/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].source_ids = ['sX']; });
check('رفض مرجع مصدر غير موجود', has(r, /مصدر (?:مرجعي )?غير موجود/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].sources.push({ id: 's2', title: 'Unused', publisher: 'X', url: 'https://example.org/u', type: 'org', retrieved: '2026-10-13' }); });
check('رفض مصدر غير مستخدم', has(r, /مصدر غير مستخدم/), r.errors.join(' | '));
r = withPack(d => {
  d.files['manifest.json'].crops.push({ id: 'barley', file: 'data/advice/barley.json', name_ar: 'الشعير', name_en: 'Barley', name_fr: 'Orge' });
  const c2 = makeCard('barley-scald'); c2.crop_id = 'barley';
  d.files['barley.json'] = { schema: 1, crop_id: 'barley', crop_name_ar: 'الشعير', cards: [c2] };
  d.files['wheat.json'].cards[0].id = 'barley-scald';
});
check('رفض تكرار معرّف بطاقة عالمياً', has(r, /مكرر عالمياً/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].problem.name_ar = 'مرض تجريبي مع 汉字'; });
check('رفض حرف CJK داخل البيانات', has(r, /CJK/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].cultural[0].text_ar = 'مقاومة وQoI موثقة في النص التجريبي الطويل بما يكفي.'; });
check('رفض تجاوز عربي-لاتيني داخل كلمة', has(r, /تجاوز عربي-لاتيني/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].chemical.options = []; });
check('رفض خيارات فارغة دون اعتذار صريح', has(r, /دون اعتذار|بلا اعتذار/), r.errors.join(' | '));
r = withPack(d => { delete d.files['wheat.json'].cards[0].chemical.options[0].caution_ar; });
check('رفض خيار بلا تحذير', has(r, /caution_ar/), r.errors.join(' | '));
r = withPack(d => { d.files['manifest.json'].crops[0].file = 'data/advice/missing.json'; });
check('رفض ملف محصول مفقود من manifest', has(r, /ملف مفقود/), r.errors.join(' | '));
r = withPack(d => { const c = d.files['wheat.json'].cards[0]; c.status = 'reviewed'; });
check('رفض status=reviewed دون مراجع', has(r, /دون مراجع/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].problem.type = 'meteor'; });
check('رفض type خارج المسموح', has(r, /type غير معروف/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].sources[0].url = 'http://example.org/insecure'; });
check('رفض رابط غير https', has(r, /https/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].confirm_first.lookalikes = []; });
check('رفض بطاقة بلا lookalikes', has(r, /lookalikes/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards[0].chemical.options[0].group_ar = 'منتج Bayer مخترع'; });
check('رفض اسم شركة تجارية داخل خيار كيميائي', has(r, /تجارية/), r.errors.join(' | '));
r = withPack(d => { d.files['wheat.json'].cards = []; });
check('رفض محصول manifest بلا بطاقات', has(r, /لا بطاقات|بلا بطاقات/, ) || has(r, /coverage/), r.errors.join(' | '));

/* ================= الحزمة الحقيقية + التقرير (3) ================= */
const realDir = join(root, 'data', 'advice');
const real = validatePack(realDir);
check('الحزمة الحقيقية: صفر أخطاء', real.errors.length === 0, real.errors.slice(0, 5).join(' | '));
check('الحزمة الحقيقية: تغطية 10 محاصيل وبطاقة ≥ 1 لكل محصول',
  real.stats.crops === 10 && Object.values(real.stats.perCrop).every(n => n >= 1),
  JSON.stringify(real.stats.perCrop));
const repPath = join(realDir, 'advice-registry-report.json');
check('تقرير المطابقة موجود ويعيد العدّ كما هي',
  existsSync(repPath) && (() => {
    const rep = JSON.parse(readFileSync(repPath, 'utf8'));
    const files = readdirSync(realDir).filter(f => f.endsWith('.json') && !['manifest.json', 'modifiers.json', 'advice-registry-report.json'].includes(f));
    const cards = files.reduce((n, f) => n + JSON.parse(readFileSync(join(realDir, f), 'utf8')).cards.length, 0);
    return rep.coverage.cards === cards && rep.completeness.violations === 0 && rep.dose_gate.pattern_hits === 0;
  })());

console.log(`\nADVICE-TEST: PASS ${pass}  FAIL ${fail}`);
process.exit(fail ? 1 : 0);
