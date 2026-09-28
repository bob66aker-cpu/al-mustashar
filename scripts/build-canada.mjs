#!/usr/bin/env node
/*
 * scripts/build-canada.mjs — المرحلة الثانية: حزمة كندا
 * ------------------------------------------------------------------
 * يجلب سجل المبيدات الكندي (Pest Management Regulatory Agency / Health
 * Canada) **بدون تسجيل دخول**، ويحوّله إلى مخططنا:
 *   { name, name_norm, cas, cas_norm, status, status_raw, source, row }
 * ثم يكتب manifest داخل الملف نفسه:
 *   { source, license:'OGL-Canada', retrieved_date, count, sha256 }
 *
 * المصدر الرسمي (endpointان extract بلا مفتاح):
 *   https://pest-control.canada.ca/pesticide-registry-api/api/extract/ingredient
 * الترخيص: Open Government Licence – Canada.
 *
 * ملاحظات أمانة:
 *  - الملف المُنزَّل CSV بترميز windows-1252 (لا UTF-8) — لذلك التحويل
 *    صريح عبر TextDecoder('windows-1252') لا التخمين.
 *  - CAS يُنقل حرفياً كما ورد. **لا يُصحَّح ولا يُخترع**؛ أخطاء فحص التحقق
 *    تُبلَّغ في المخرجات وتُترك (نفس سياسة EU/EPA).
 *  - «لا» في عمود إعادة التقييم تُنقل «غير مُعاد التقييم» — ليست حكماً قانونياً.
 *
 * التشغيل:  node scripts/build-canada.mjs [--out data-optional]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const OUT_DIR = path.resolve(process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'data-optional');

const ENDPOINTS = {
  ingredient: 'https://pest-control.canada.ca/pesticide-registry-api/api/extract/ingredient',
  product: 'https://pest-control.canada.ca/pesticide-registry-api/api/extract/product',
};

const LICENSE = 'OGL-Canada';
const LICENSE_URL = 'https://open.canada.ca/en/open-government-licence-canada';
const ATTRIBUTION_EN = 'Contains information licensed under the Open Government Licence – Canada.';

/* ---------- CSV (RFC4180): اقتباس مزدوج، سطر داخل الحقل ممكن ---------- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQ = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r[0] || '').trim() !== '');
}

const norm = s => String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
const normKey = s => norm(s).toLowerCase()
  .replace(/[‐-―]/g, '-')
  .replace(/[‘’]/g, "'")
  .replace(/[^a-z0-9]+/g, ' ').trim();

/* رقم CAS يُقبل فقط إن كان بالشكل XXXXX-XX-X أو XXXXXXXX-X (بلا شرطات
   متصلة/فواصل) — أي شيء آخر يبقى كما ورد في status_raw ويُبلَّغ. */
function casOf(raw) {
  const v = norm(raw);
  if (!v) return '';
  if (/^\d{2,7}-\d{2}-\d$/.test(v) || /^\d{5,9}-\d$/.test(v)) return v;
  return '';
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
  const buf = Buffer.from(await res.arrayBuffer());
  return new TextDecoder('windows-1252').decode(buf);
}

async function main() {
  const log = (...a) => console.log(...a);
  log('CANADA build — source: PMRA / Health Canada (no login)');

  /* ---- 1) المواد الفعّالة: الاسم الإنجليزي + الحالة + CAS ---- */
  const ingText = await fetchText(ENDPOINTS.ingredient);
  const ing = parseCsv(ingText);
  const ingHead = ing[0].map(h => norm(h).toLowerCase());
  const col = {
    en: ingHead.findIndex(h => h.startsWith('active ingredient name - english')),
    fr: ingHead.findIndex(h => h.startsWith('active ingredient name - french')),
    status: ingHead.findIndex(h => h.indexOf('reevaluation status') >= 0),
    cas: ingHead.findIndex(h => h.indexOf('cas number') >= 0),
  };
  if (col.en < 0 || col.cas < 0) throw new Error('unexpected ingredient header: ' + ingHead.join(' | '));

  const seen = new Set();
  const rows = [];
  let casMissing = 0, casOdd = 0, dupes = 0;
  for (let i = 1; i < ing.length; i++) {
    const r = ing[i];
    const name = norm(r[col.en]);
    if (!name) continue;
    const key = normKey(name);
    if (seen.has(key)) { dupes++; continue; }
    seen.add(key);
    const casRaw = norm(r[col.cas]);
    const cas = casOf(casRaw);
    if (!cas) { if (casRaw) casOdd++; else casMissing++; }
    const st = norm(r[col.status]).toUpperCase();
    rows.push({
      name,
      name_fr: norm(r[col.fr]),
      name_norm: key,
      cas,
      cas_raw: casRaw,
      cas_norm: cas ? cas.replace(/-/g, '') : '',
      status: 'غير مُعاد التقييم',
      status_raw: st || 'NO',
      category: '',
      source: 'canada',
    });
  }
  rows.sort((a, b) => a.name_norm < b.name_norm ? -1 : 1);
  rows.forEach((r, i) => { r.row = i + 1; });

  /* ---- 2) المنتجات: تُجمَّع بعدد substances كدليل وجود في السجل ---- */
  const prodText = await fetchText(ENDPOINTS.product);
  const prod = parseCsv(prodText);
  const ph = prod[0].map(h => norm(h).toLowerCase());
  const pcol = {
    reg: ph.findIndex(h => h.indexOf('registration number') >= 0),
    name: ph.findIndex(h => h.indexOf('product name - english') >= 0),
    status: ph.findIndex(h => h.indexOf('registration status') >= 0),
    ing: ph.findIndex(h => h.indexOf('active ingredients - english') >= 0),
  };
  if (pcol.ing < 0) throw new Error('unexpected product header: ' + ph.join(' | '));

  const productCount = Math.max(0, prod.length - 1);
  log('  ingredients: ' + rows.length + ' unique (duplicates collapsed: ' + dupes + ')');
  log('  products in registry: ' + productCount);
  log('  CAS present: ' + (rows.length - casMissing - casOdd) + ' | empty: ' + casMissing + ' | non-standard (kept verbatim, reported): ' + casOdd);

  const retrieved = new Date().toISOString().slice(0, 10);
  const pack = {
    meta: {
      key: 'canada',
      name: 'كندا — سجل المبيدات الوطني',
      source: 'Pest Management Regulatory Agency (Health Canada)',
      source_url: ENDPOINTS.ingredient,
      license: LICENSE,
      license_url: LICENSE_URL,
      attribution_en: ATTRIBUTION_EN,
      retrieved_date: retrieved,
      count: rows.length,
      product_count: productCount,
      cas_present: rows.length - casMissing - casOdd,
      cas_empty: casMissing,
      cas_nonstandard: casOdd,
      optional: true,
      built_with: 'scripts/build-canada.mjs',
      schema: 'name,name_fr,name_norm,cas,cas_raw,cas_norm,status,status_raw,category,source,row',
    },
    rows,
  };
  const json = JSON.stringify(pack);
  pack.meta.sha256 = createHash('sha256').update(json, 'utf8').digest('hex');

  mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'canada.json');
  const body = JSON.stringify(pack, null, 1);
  writeFileSync(outFile, body);
  /* the manifest carries the checksum of the FILE BYTES, so the app can
   * verify a download it did not build */
  const fileSha = createHash('sha256').update(body, 'utf8').digest('hex');
  writeFileSync(path.join(OUT_DIR, 'canada.manifest.json'), JSON.stringify({
    file: 'canada.json', source: pack.meta.source, source_url: pack.meta.source_url,
    license: pack.meta.license, license_url: pack.meta.license_url,
    attribution_en: pack.meta.attribution_en,
    retrieved_date: pack.meta.retrieved_date, count: pack.meta.count, sha256: fileSha,
    built_with: pack.meta.built_with
  }, null, 1));
  log('WROTE ' + outFile);
  log('  count=' + pack.meta.count + '  sha256=' + fileSha);
  log('  license=' + pack.meta.license + '  retrieved=' + pack.meta.retrieved_date);
}

main().catch(e => { console.error('BUILD FAILED: ' + (e && e.message || e)); process.exit(1); });
