#!/usr/bin/env node
/*
 * build-eu.mjs — يبني data/eu.json من الواجهة الرسمية للمفوضية الأوروبية (قاعدة المبيدات الأوروبية، الإصدار 3):
 *   https://api.datalake.sante.service.ec.europa.eu/sante/pesticides/active-substances-download?format=json&api-version=v3.0
 * (NDJSON، بلا مفتاح). الاستجابة مفكّكة الجداول (صفوف متكررة لكل مادة) فتُدمج بـ substance_id.
 * لا يخترع قيمة: الحالة والتواريخ والرقم كما في المصدر؛ وسم «مقيد» = Approved + candidate_for_substitution=Yes
 * (الاشتقاق نفسه الذي طابق 44 من 45 صفًا في بناء 2026-09-09؛ الاستثناءان تغيّر في المصدر).
 * Usage: node scripts/build-eu.mjs [--file raw.ndjson] [--out data/eu.json] [--dry]
 */
import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const URL_ = 'https://api.datalake.sante.service.ec.europa.eu/sante/pesticides/active-substances-download?format=json&api-version=v3.0';
const OUT = arg('--out', 'data/eu.json');
let text;
if (arg('--file')) text = fs.readFileSync(arg('--file'), 'utf8');
else {
  const r = await fetch(URL_, { headers: { 'User-Agent': 'AlMustashar-datarefresh/1.0 (bob66aker@gmail.com)' } });
  if (!r.ok) { console.error('EU source HTTP ' + r.status + ' — existing file kept'); process.exit(2); }
  text = await r.text();
}
const recs = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
const by = new Map();
for (const a of recs) if (!by.has(a.substance_id)) by.set(a.substance_id, a);
const norm = s => String(s || '').toLowerCase().replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const AR = { 'Approved': 'مسموح', 'Not approved': 'محظور', 'Pending': 'قيد المراجعة' };
const rows = [];
for (const a of by.values()) {
  const raw = String(a.substance_status || '').trim();
  if (!AR[raw]) { console.error('unknown status ' + raw + ' for ' + a.substance_name); process.exit(3); }
  const cas = String(a.as_cas_number || '').trim();
  const legs = [...new Set(String((a.legislations_actives || '') + ';' + (a.legislations_old || '')).split(';').map(strip).filter(Boolean))].sort();
  const name = String(a.substance_name || '').trim();
  rows.push({
    name, name_norm: norm(name), cas, cas_norm: /\d/.test(cas) ? cas.replace(/\D/g, '') : '',
    status: raw === 'Approved' && a.candidate_for_substitution === 'Yes' ? 'مقيد' : AR[raw],
    status_raw: raw, approval_date: a.approval_date || '', expiry_date: a.expiry_date || '',
    legislation: legs.join(', '), source: 'EU'
  });
}
rows.sort((x, y) => x.name.localeCompare(y.name, 'en'));
rows.forEach((r, i) => { r.row = i + 1; });
let prev = 0; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')).meta.count; } catch (e) {}
if (prev && Math.abs(rows.length - prev) / prev > 0.05) { console.error('count moved >5%: ' + prev + ' -> ' + rows.length + ' — NOT written'); process.exit(4); }
const out = { meta: { key: 'eu', name: 'الاتحاد الأوروبي', count: rows.length }, rows };
if (process.argv.includes('--dry')) { console.log('dry: ' + rows.length + ' rows (was ' + prev + ')'); process.exit(0); }
fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(OUT + ': ' + rows.length + ' rows (was ' + prev + ')');
