import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/tws/sections.json', import.meta.url), 'utf8'));
const blankActive = [];
for (const section of data.sections || []) {
  for (const product of section.products || []) {
    if (String(product['اسم المادة الفعالة'] || '').trim()) continue;
    blankActive.push({ section, product });
  }
}

test('every empty active-ingredient cell stays visibly unverified and traceable to a PDF page', () => {
  assert.ok(blankActive.length > 0, 'If all gaps were filled, remove/update this guard with the source audit');
  for (const { section, product } of blankActive) {
    assert.equal(product._verify?.status, 'NEEDS_VERIFICATION',
      'blank active ingredient must not be marked verified: ' + section.crop_id + '/' + section.n);
    assert.ok(product._verify?.page, 'gap must retain source PDF page: ' + section.crop_id + '/' + section.n);
    assert.ok((product._verify?.notes || []).some(n => /ACTIVE empty/i.test(n)),
      'gap must retain explicit reason: ' + section.crop_id + '/' + section.n);
  }
  console.log('Unresolved active-ingredient cells:', blankActive.length);
  console.log(blankActive.map(({ section, product }) =>
    [section.crop_id, section.name_ar, 'PDF ' + product._verify.page].join(' | ')).join('\n'));
});
