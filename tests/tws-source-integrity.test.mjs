import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/**
 * بوابة سلامة مصدر data/tws — تمنع حذف صف أو تغيير ترتيب المصدر أو تعديل
 * حقل حساس دون سجل مصدر صريح.
 *
 * كيف تُسجَّل أي تغييرة مشروعة؟ التعديل في الملف نفسه + تحديث العدّ
 * أو البصمة SHA-256 هنا في نفس الالتزام — هذا التحديث هو "السجل" الذي
 * تطلبه البوابة؛ أي فرق يظهر في المراجعة كتغيير مقصود لا كحذف صامت.
 */

const load = (name) => JSON.parse(readFileSync(new URL(`../data/tws/${name}`, import.meta.url), 'utf8'));
const sha = (name) => createHash('sha256').update(readFileSync(new URL(`../data/tws/${name}`, import.meta.url))).digest('hex');

// الأعداد المعروفة لفرع experimental-v2-2026-10-25 (مقيسة 2026-10-28)
const KNOWN = {
  crops: 60,
  cards: 258,
  products: 2993,
  images: 256,
  sha: {
    'sections.json': '8668169221a83f307d394f187d60fe26d93ba13bd46facddf791844575dfb7cc',
    'crops.json': '3c66cde3b49e122ed8c7e0a5619084dc375300081394c968fe38762d88cdfbcb',
    'manifest.json': '44dc198929c861cff7a84b001696d017863c46384405cef90365eb484e6f64a0',
  },
};

const SENSITIVE_KEYS = ['اسم المادة الفعالة', 'معدل الاستخدام', 'تصنيف WHO', 'فترة الأمان', 'قيم MRL'];

const cropsDoc = load('crops.json');
const manifest = load('manifest.json');
const sections = load('sections.json').sections;

test('source counts match the recorded V2 baseline (no silent row deletion)', () => {
  assert.equal(cropsDoc.crops.length, KNOWN.crops, 'crops.json count changed — update the record deliberately');
  assert.equal(sections.length, KNOWN.cards, 'sections.json card count changed — update the record deliberately');
  const products = sections.reduce((a, s) => a + (s.products || []).length, 0);
  assert.equal(products, KNOWN.products, 'product row count changed — update the record deliberately');
  assert.deepEqual(manifest.counts,
    { crops: KNOWN.crops, cards: KNOWN.cards, products: KNOWN.products, images: KNOWN.images },
    'manifest.counts must agree with the actual data');
});

test('SHA-256 fingerprints match the recorded baseline (any edit must be recorded here)', () => {
  for (const [file, digest] of Object.entries(KNOWN.sha)) {
    assert.equal(sha(file), digest,
      `${file} changed without a recorded source: update KNOWN.sha in this gate in the same commit`);
  }
});

test('source order is preserved: crop groups contiguous and card numbers sequential from 1', () => {
  const seen = [];
  for (const s of sections) {
    if (seen[seen.length - 1] !== s.crop_id) {
      assert.ok(!seen.includes(s.crop_id), `crop group ${s.crop_id} re-appeared out of order (row reorder?)`);
      seen.push(s.crop_id);
    }
  }
  const byCrop = {};
  for (const s of sections) (byCrop[s.crop_id] = byCrop[s.crop_id] || []).push(s.n);
  for (const [cropId, nums] of Object.entries(byCrop)) {
    assert.deepEqual(nums, nums.map((_, i) => i + 1),
      `card numbers of ${cropId} are not 1..k in source order — rows deleted or reordered`);
  }
  // كل محصول في crops.json له بطاقة واحدة على الأقل (حذف محصول كامل = خسارة صف)
  for (const c of cropsDoc.crops) {
    assert.ok(byCrop[c.id], `crop ${c.id} exists in crops.json but has no cards in sections.json`);
  }
});

test('every product row keeps all sensitive-field keys (values may be blank but never silently dropped)', () => {
  let total = 0;
  for (const s of sections) {
    for (const p of s.products || []) {
      total++;
      for (const k of SENSITIVE_KEYS) {
        assert.ok(k in p, `missing sensitive key "${k}" at ${s.crop_id}#${s.n}`);
      }
      // أي خانة فارغة يجب أن تحمل سجل تحقق صريحًا بدل الصمت
      if (!String(p['اسم المادة الفعالة'] || '').trim()) {
        assert.ok(p._verify?.status === 'NEEDS_VERIFICATION' && p._verify?.page,
          `blank active ingredient without NEEDS_VERIFICATION+page at ${s.crop_id}#${s.n}`);
      }
    }
  }
  assert.equal(total, KNOWN.products, 'product rows changed');
});
