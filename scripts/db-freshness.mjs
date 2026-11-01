#!/usr/bin/env node
/*
 * db-freshness.mjs — فحص حداثة قواعد البيانات الدولية (دورة 15 يومًا)
 * ------------------------------------------------------------------
 * يقرأ version.json › dataCheck ويقارن تاريخ آخر تحقق لكل قاعدة بالحد الأقصى
 * (الافتراضي 15 يومًا). القواعد الليبية مستثناة عمدًا: لا يصدر لها تحديث دوري،
 * ويُبلَّغ عنها يدويًا عند صدور تعديل رسمي.
 *
 * القراءة فقط — لا يكتب أي ملف. رمز الخروج 1 عند وجود قاعدة متأخرة.
 *   node scripts/db-freshness.mjs                 # اليوم الفعلي
 *   node scripts/db-freshness.mjs --today 2026-12-01 --max-days 15
 *   node scripts/db-freshness.mjs --json          # مخرج آلي
 */
import fs from 'node:fs';
import path from 'node:path';

export const CYCLE_DAYS = 15;
export const INTERNATIONAL = ['eu', 'epa', 'epa-cancelled', 'canada', 'australia'];
export const EXCLUDED = ['libya-248', 'libya-500'];

export function evaluate(dataCheck, todayIso, maxDays = CYCLE_DAYS) {
  const today = Date.parse(todayIso + 'T00:00:00Z');
  const rows = INTERNATIONAL.map(function (k) {
    const d = dataCheck && dataCheck[k];
    const t = d ? Date.parse(d + 'T00:00:00Z') : NaN;
    const age = isNaN(t) ? null : Math.floor((today - t) / 86400000);
    return { db: k, checked: d || null, age_days: age, stale: age === null || age > maxDays };
  });
  return { max_days: maxDays, today: todayIso, excluded: EXCLUDED, rows, stale: rows.filter(r => r.stale).map(r => r.db) };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const vj = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  const res = evaluate(vj.dataCheck, arg('--today', new Date().toISOString().slice(0, 10)), Number(arg('--max-days', CYCLE_DAYS)));
  if (process.argv.includes('--json')) console.log(JSON.stringify(res, null, 2));
  else {
    console.log('db-freshness (max ' + res.max_days + ' days) — today ' + res.today);
    res.rows.forEach(r => console.log('  ' + (r.stale ? 'STALE ' : 'ok    ') + r.db.padEnd(14) + (r.checked || '—') + '  age=' + (r.age_days === null ? '?' : r.age_days) + 'd'));
    console.log('  excluded (manual, no periodic feed): ' + res.excluded.join(', '));
  }
  process.exit(res.stale.length ? 1 : 0);
}
