#!/usr/bin/env node
/*
 * scripts/build-australia.mjs — المرحلة الثانية: حزمة أستراليا
 * ------------------------------------------------------------------
 * يجلب حزمة APVMA الأسبوعية (PUBCRIS) بلا تسجيل دخول:
 *   https://permits.apvma.gov.au/pubcris.zip        (~27 ميغابايت، تحديث أسبوعي)
 * ويفكّها **في الذاكرة** (inflateraw的内置 zlib، بلا أي اعتمادية)، ويقرأ
 * ثلاثة ملفات فقط:
 *   product.csv  → pcode, prodtype, hlevel1, typedesc, regcode, sname
 *   prodcon.csv  → pcode, ccode, ctype, camount
 *   constit.csv  → ccode, cname, clevel1
 * ثم يدمجها إلى صف واحد لكل مادة فعّالة (active constituent) بمخططنا:
 *   { name, name_norm, cas, cas_norm, status, status_raw, category, source, row }
 *
 * الترخيص: CC-BY 3.0 Australia — يجب أن يظهر الإسناد حرفياً في الواجهة.
 *
 * أمانة صريحة: **PUBCRIS لا ينشر أرقام CAS**. لذلك حقل cas يبقى فارغاً
 * ولا يُملأ بالاستنتاج من قواعد أخرى (رقم مُستنتَج = هوية خاطئة محتملة).
 * سكربت فحص التحققtherefore يسجّل «لا أرقام لفحصها» بدل أن يمرّ صامتاً.
 *
 * التشغيل:  node scripts/build-australia.mjs [--out data-optional] [--zip /tmp/pubcris.zip]
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';

const arg = (flag, dflt) => (process.argv.includes(flag)
  ? process.argv[process.argv.indexOf(flag) + 1] : dflt);
const OUT_DIR = path.resolve(arg('--out', 'data-optional'));
const ZIP_URL = 'https://permits.apvma.gov.au/pubcris.zip';
const ZIP_LOCAL = arg('--zip', '');

const LICENSE = 'CC-BY-3.0-AU';
const LICENSE_URL = 'https://creativecommons.org/licenses/by/3.0/au/';
const ATTRIBUTION_EN = 'Contains information licensed under the Creative Commons Attribution 3.0 Australia licence.';

/* ---------- CSV بسيط (الحقول هنا بلا اقتباس مزدوج مزدوج في APVMA) ---------- */
function parseCsv(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    out.push(line.split(',').map(f => f.replace(/^"|"$/g, '').trim()));
  }
  return out;
}

/* ---------- فكّ ZIP في الذاكرة: سجل مركزي + inflateraw ---------- */
function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd > 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd <= 0) throw new Error('not a zip file');
  const n = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString('utf8');
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.slice(dataStart, dataStart + csize);
    files[name] = method === 0 ? raw : inflateRawSync(raw);
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const norm = s => String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
const normKey = s => norm(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function main() {
  const log = (...a) => console.log(...a);
  log('AUSTRALIA build — source: APVMA PUBCRIS weekly bundle (no login)');

  let buf;
  if (ZIP_LOCAL && existsSync(ZIP_LOCAL)) {
    buf = readFileSync(ZIP_LOCAL);
    log('  using local bundle: ' + ZIP_LOCAL + ' (' + buf.length + ' B)');
  } else {
    log('  downloading ' + ZIP_URL + ' …');
    const res = await fetch(ZIP_URL, { redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    buf = Buffer.from(await res.arrayBuffer());
    log('  downloaded ' + buf.length + ' B');
  }

  const files = unzip(buf);
  const pick = n => {
    const k = Object.keys(files).find(x => x.toLowerCase().endsWith('/' + n) || x.toLowerCase() === n);
    if (!k) throw new Error('missing in bundle: ' + n);
    return files[k].toString('utf8');
  };
  const product = parseCsv(pick('product.csv'));
  const prodcon = parseCsv(pick('prodcon.csv'));
  const constit = parseCsv(pick('constit.csv'));
  log('  product.csv=' + (product.length - 1) + ' prodcon.csv=' + (prodcon.length - 1) + ' constit.csv=' + (constit.length - 1));

  const nameOf = {};
  for (let i = 1; i < constit.length; i++) {
    const cc = norm(constit[i][0]);
    if (cc && !nameOf[cc]) nameOf[cc] = norm(constit[i][1]);
  }
  const prodReg = {};      /* pcode -> registered? */
  const prodType = {};
  for (let i = 1; i < product.length; i++) {
    const p = product[i];
    const pc = norm(p[0]);
    prodReg[pc] = norm(p[8]).toUpperCase().indexOf('R') >= 0;
    prodType[pc] = norm(p[6]);       /* hlevel1: group name, e.g. "Herbicides" */
  }

  const agg = new Map();  /* name_norm -> row */
  let links = 0, noName = 0;
  for (let i = 1; i < prodcon.length; i++) {
    const p = prodcon[i];
    const pc = norm(p[0]), cc = norm(p[1]);
    if (!cc) continue;
    const nm = nameOf[cc];
    if (!nm) { noName++; continue; }
    const key = normKey(nm);
    let row = agg.get(key);
    if (!row) {
      row = {
        name: nm, name_norm: key,
        /* PUBCRIS publishes no CAS numbers: left empty on purpose */
        cas: '', cas_raw: '', cas_norm: '',
        status: 'غير مُسجَّل', status_raw: 'NOT REGISTERED',
        category: '', source: 'australia',
        products: 0, registered_products: 0, groups: []
      };
      agg.set(key, row);
    }
    links++;
    row.products++;
    if (prodReg[pc]) {
      row.registered_products++;
      row.status = 'مسجَّل';
      row.status_raw = 'REGISTERED';
    }
    const g = prodType[pc];
    if (g && row.groups.indexOf(g) < 0) row.groups.push(g);
  }

  const rows = [...agg.values()];
  for (const r of rows) {
    r.groups.sort();
    r.category = r.groups.slice(0, 3).join(' / ');   /* مثال: Herbicides */
    delete r.groups;
  }
  rows.sort((a, b) => a.name_norm < b.name_norm ? -1 : 1);
  rows.forEach((r, i) => { r.row = i + 1; });

  log('  active constituents: ' + rows.length + ' (links=' + links + ', unresolved codes=' + noName + ')');
  log('  with at least one registered product: ' + rows.filter(r => r.registered_products > 0).length);
  log('  CAS numbers in PUBCRIS: 0 — none are published, so none are invented');

  const retrieved = new Date().toISOString().slice(0, 10);
  const pack = {
    meta: {
      key: 'australia',
      name: 'أستراليا — APVMA',
      source: 'Australian Pesticides and Veterinary Medicines Authority (APVMA) — PUBCRIS',
      source_url: ZIP_URL,
      license: LICENSE,
      license_url: LICENSE_URL,
      attribution_en: ATTRIBUTION_EN,
      retrieved_date: retrieved,
      count: rows.length,
      registered: rows.filter(r => r.registered_products > 0).length,
      cas_present: 0,
      cas_note: 'PUBCRIS does not publish CAS numbers; the field is left empty on purpose',
      optional: true,
      built_with: 'scripts/build-australia.mjs',
      schema: 'name,name_norm,cas,cas_norm,status,status_raw,category,source,products,registered_products,row',
    },
    rows,
  };
  const json = JSON.stringify(pack);
  pack.meta.sha256 = createHash('sha256').update(json, 'utf8').digest('hex');

  mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'australia.json');
  const body = JSON.stringify(pack, null, 1);
  writeFileSync(outFile, body);
  /* the manifest carries the checksum of the FILE BYTES, so the app can
   * verify a download it did not build */
  const fileSha = createHash('sha256').update(body, 'utf8').digest('hex');
  writeFileSync(path.join(OUT_DIR, 'australia.manifest.json'), JSON.stringify({
    file: 'australia.json', source: pack.meta.source, source_url: pack.meta.source_url,
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
