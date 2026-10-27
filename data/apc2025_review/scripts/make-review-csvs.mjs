#!/usr/bin/env node
// توليد ملفات الحالات التي تحتاج إلى مراجعة بشرية من الحزمة (قابل للتكرار — لا يعدّل المصدر)
// المخرجات: data/apc2025_review/reports/*.csv
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const PKG = 'data/apc2025_review/extracted';
const OUT = 'data/apc2025_review/reports';
mkdirSync(OUT, { recursive: true });
const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const write = (name, cols, rows) => {
  const body = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(','))).join('\n') + '\n';
  writeFileSync(OUT + '/' + name, '﻿' + body, 'utf8');
  console.log(name + ': ' + rows.length + ' rows');
};
const au = JSON.parse(readFileSync(PKG + '/audit/audit_data.json', 'utf8'));
const acts = JSON.parse(readFileSync(PKG + '/data/actives.json', 'utf8')).actives;

// 1) مواد بلا CAS أو موسومة بحاجة تحقق
write('nv-01-actives-cas.csv',
  ['case', 'name_en', 'cas', 'cas_verification_level', 'status', 'name_as_printed_in_book', 'note'],
  acts.filter(a => !a.cas || a.cas_verification?.level === 'needs_verification')
      .map(a => ({
        case: a.cas ? 'NEEDS_VERIFICATION' : 'NO_CAS_ASSIGNED',
        name_en: a.name_en, cas: a.cas || '',
        cas_verification_level: a.cas_verification?.level || '',
        status: a.status || '',
        name_as_printed_in_book: (a.source_vs_reference?.['name_as_printed_in_book'] || a.raw_spellings || []).join(' | '),
        note: a.cas_verification?.note || '',
      })));
// 2) صفوف غير مؤكدة في التدقيق
write('nv-02-uncertain-rows.csv', ['level', 'crop_id', 'pest_ar', 'card_id', 'printed_pages', 'actives', 'reason'], au.uncertain);
// 3) نواقص وتعارضات
write('nv-03-missing-conflicts.csv', ['crop_id', 'pest_ar', 'card_id', 'printed_pages', 'actives', 'field', 'issue'], au.missing);
// 4) بطاقات مكرّرة مقترحة (لم تُحذف — للمراجعة)
write('nv-04-dup-cards.csv', ['crop_id', 'pest_ar', 'n_cards', 'card_ids', 'printed_pages'], au.dup_cards);
// 5) أسماء مقترحة تصحيحها (170 كلها needs_human_review)
write('nv-05-spelling-review.csv', ['lang', 'where', 'original_in_book', 'suggested', 'reason', 'needs_human_review'], au.spelling);
// 6) تكرارات داخل البطاقة (مُعلَّمة لا محذوفة)
write('nv-06-dups-same-card.csv', ['crop_id', 'pest_ar', 'card_id', 'printed_pages', 'actives_and_conc', 'formulation', 'rate_text_ar', 'phi_days', 'group_size'], au.dups_same);
console.log('DONE -> ' + OUT);
