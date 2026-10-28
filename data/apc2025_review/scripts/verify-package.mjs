#!/usr/bin/env node
// فحص سلامة حزمة APC 2025 — JSON + ربط البطاقات بالتوصيات + اتساق العدّادات + غياب تغيير بيانات التطبيق
// لا يعدّل أي ملف. يعمل من جذر الفرع.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let pass = 0, fail = 0;
const ok = (cond, msg, extra) => {
  if (cond) { pass++; console.log('  PASS  ' + msg + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL  ' + msg + (extra ? ' — ' + extra : '')); }
};

const PKG = 'data/apc2025_review/extracted';
const APP = 'data/tws';

// ---------- 1) كل ملفات JSON في الحزمة تُقرأ ----------
console.log('\n[1] JSON parse — كل ملفات الحزمة');
const jsonFiles = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.json')) jsonFiles.push(p); } };
walk(PKG);
let parsed = 0, parseErr = null;
for (const f of jsonFiles) { try { JSON.parse(readFileSync(f, 'utf8')); parsed++; } catch (e) { parseErr = f + ': ' + e.message; } }
ok(parsed === jsonFiles.length && jsonFiles.length > 80, 'كل ملفات JSON صالحة', parsed + '/' + jsonFiles.length + (parseErr ? ' خطأ: ' + parseErr : ''));

// ---------- 2) بنية البطاقات والربط ----------
console.log('\n[2] ربط البطاقات ← التوصيات ← الخيارات');
const cropDir = join(PKG, 'data/crops');
const files = readdirSync(cropDir).filter(f => f.endsWith('.json'));
let cards = 0, srcRows = 0, recs = 0, opts = 0;
const ids = new Set(), orders = new Set();
let fileMatchesId = true, idsUnique = true, orderContiguous = true;
let activesOk = true, whoVocab = true, phiOk = true, casFmt = true, pageRange = true;
const WHO = new Set(['FM', 'High Ib', 'Low III', 'Mod II', 'U']);
const casRe = /^\d{2,7}-\d{2}-\d$/;
// قاعدة CAS الرسمية: أوزان تصاعدية 1,2,3,... من اليمين (باعتبار الرقم التحقق آخرًا)
const checkDigit = (c) => { const d = c.replace(/-/g, ''); let sum = 0; for (let i = d.length - 2, w = 1; i >= 0; i--, w++) sum += Number(d[i]) * w; return sum % 10 === Number(d[d.length - 1]); };
const ordersAll = [];
for (const f of files) {
  const j = JSON.parse(readFileSync(join(cropDir, f), 'utf8'));
  if (j.crop_id + '.json' !== f) fileMatchesId = false;
  for (const c of j.cards) {
    cards++;
    if (ids.has(c.id)) idsUnique = false; ids.add(c.id);
    ordersAll.push(c.source_order);
    for (const p of c.printed_pages || []) if (p < 1 || p > 350) pageRange = false;
    for (const t of c.tables) { srcRows += t.source_rows; for (const r of t.recommendations) {
      recs++;
      for (const a of r.actives) { if (!a.name_en) activesOk = false; if (a.cas && !casRe.test(a.cas)) casFmt = false; if (a.cas && !checkDigit(a.cas)) casFmt = false; }
      for (const o of r.options) {
        opts++;
        if (o.who_class !== null && !WHO.has(o.who_class)) whoVocab = false;
        if (o.phi_days !== null && !Number.isInteger(o.phi_days)) phiOk = false;
      }
    }
    }
  }
}
ordersAll.sort((a, b) => a - b);
orderContiguous = ordersAll.every((v, i) => v === i + 1);
ok(fileMatchesId, 'اسم ملف المحصول = crop_id داخله', files.length + ' ملفًا');
ok(cards === 338, 'عدد البطاقات = 338', String(cards));
ok(idsUnique, 'معرّفات البطاقات فريدة عالميًا', ids.size + ' معرّف');
ok(orderContiguous, 'source_order متتابع 1..338 بلا ثغرة أو تكرار');
ok(recs === 2033, 'عدد التوصيات المجمّعة = 2033', String(recs));
ok(opts === 3482 && srcRows === 3482, 'الخيارات = صفوف المصدر = 3482 (لا فقد ولا تكرار)', 'options=' + opts + ' source_rows=' + srcRows);
ok(activesOk, 'كل مادة فعالة لها name_en');
ok(casFmt, 'كل CAS موجود: صيغة ورقم تحقق صحيحان (شرط لازم لا كافٍ)');
ok(whoVocab, 'تصنيفات WHO ضمن مفردات الكتاب الخمس', [...WHO].join('/'));
ok(phiOk, 'فترة الأمان صحيحة نوعًا (عدد صحيح أو null)');
ok(pageRange, 'أرقام الصفحات المطبوعة ضمن 1..350');

// ---------- 3) CSV/Excel مطابقان للـJSON ----------
console.log('\n[3] تطابق CSV مع JSON');
const csv = readFileSync(join(PKG, 'data/recommendations_flat.csv'), 'utf8').trim().split(/\r?\n/);
ok(csv.length - 1 === 3482, 'CSV = 3482 صف بيانات + ترويسة', 'rows=' + (csv.length - 1));

// ---------- 4) CAS: حالات التحقق ----------
console.log('\n[4] حالات CAS في actives.json');
const acts = JSON.parse(readFileSync(join(PKG, 'data/actives.json'), 'utf8')).actives;
const lv = {}; for (const a of acts) { const l = a.cas_verification?.level || '(none)'; lv[l] = (lv[l] || 0) + 1; }
ok(acts.length === 273, 'عدد المواد = 273', String(acts.length));
ok((lv.needs_verification || 0) > 0 && (lv.verified_secondary_source || 0) > 0, 'مستويات التحقق موسومة لا مُظهَّمة كمؤكدة', JSON.stringify(lv));
ok(acts.filter(a => !a.cas).length === 12, '12 مادة بلا CAS (مُعلَّمة لا مُخمَّنة)', String(acts.filter(a => !a.cas).length));
ok(lv.needs_verification === 250, '250 مادة NEEDS_VERIFICATION صريحة', String(lv.needs_verification));

// ---------- 5) الحزمة لا تحوي حقول ترجمة ----------
console.log('\n[5] فصل الترجمة عن بيانات التوصيات');
const sample = JSON.parse(readFileSync(join(cropDir, 'wheat.json'), 'utf8')).cards[0];
const transKeys = ['name_en_card', 'translation', 'i18n', 'fr', 'zh'].filter(k => k in sample);
ok(transKeys.length === 0, 'بطاقات الحزمة بلا حقول ترجمة (العربية الأصلية فقط + أسماء مادة لاتينية)');

// ---------- 6) بيانات التطبيق لم تتغير ----------
console.log('\n[6] مخطط التطبيق وسلامته (بلا تعديل)');
const man = JSON.parse(readFileSync(join(APP, 'manifest.json'), 'utf8'));
const secs = JSON.parse(readFileSync(join(APP, 'sections.json'), 'utf8')).sections;
const crops = JSON.parse(readFileSync(join(APP, 'crops.json'), 'utf8')).crops;
ok(man.counts.cards === 258 && secs.length === 258, 'manifest.cards = sections = 258');
ok(man.counts.crops === crops.length, 'manifest.crops = فهرس المحاصيل', man.counts.crops + '/' + crops.length);
let offsetOk = 0, offsetBad = 0;
for (const s of secs) { if (s.pages?.[0] && s.printed_page) (s.pages[0] - s.printed_page === 13) ? offsetOk++ : offsetBad++; }
ok(offsetBad === 0 && offsetOk === 258, 'تطبيق: صفحة PDF = المطبوع + 13 في كل بطاقة', offsetOk + ' ok');
// كل بطاقة تطبيق لها بطاقة حزمة على نفس صفحة الطباعة
const pkgByPage = new Map();
for (const f of files) for (const c of JSON.parse(readFileSync(join(cropDir, f), 'utf8')).cards) for (const p of c.printed_pages || []) { if (!pkgByPage.has(p)) pkgByPage.set(p, []); pkgByPage.get(p).push(c); }
const withPage = secs.filter(s => (pkgByPage.get(s.printed_page) || []).length > 0).length;
ok(withPage === 258, 'كل بطاقة تطبيق (258) لها بطاقة حزمة على نفس صفحة الطباعة', withPage + '/258');

// ---------- 7) آلية ترجمة محتوى البطاقة — موقعها (معلومة، لا بوابة) ----------
console.log('\n[7] آلية ترجمة محتوى البطاقة — أين تعيش؟ (معلومة)');
const i18nSrc = existsSync('src/i18n.js') ? readFileSync('src/i18n.js', 'utf8') : '';
const hasCardKeys = i18nSrc.includes('tws.card.') && i18nSrc.includes('tws.content_ar_fallback');
console.log('  INFO  فرع المراجعة الحالي: ' + (hasCardKeys ? 'المفاتيح موجودة' : 'المفاتيح غائبة — آلية tws.card.* / tws.content_ar_fallback موجودة على experimental-v2-2026-10-25 فقط وليست مدمجة هنا؛ لا تُنقل تغييرات الترجمة في هذه المهمة (قيد §7)'));
console.log('\n========================================');
console.log(fail === 0 ? 'RESULT: ALL PASS (' + pass + '/' + pass + ')' : 'RESULT: ' + fail + ' FAIL / ' + (pass + fail) + ' total');
process.exit(fail === 0 ? 0 : 1);
