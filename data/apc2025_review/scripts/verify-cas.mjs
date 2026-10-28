#!/usr/bin/env node
/**
 * verify-cas.mjs — تحقق خارجي لأرقام CAS المرشحة في حزمة APC 2025.
 *
 * المخرجات (كلها داخل مجلد المراجعة المعزول data/apc2025_review/verification/):
 *   cache/ppdb/<id>.html   نسخة من صفحة المادة في PPDB كما فُتحت فعليًا
 *   cache/pubchem/<id>.json نتيجة استعلام PubChem RN
 *   cas-verification.json  النتيجة المدمجة لكل مادة
 *
 * قيود مقصودة:
 *   - لا يكتب في extracted/ ولا في بيانات التطبيق إطلاقًا.
 *   - لا يخمّن: أي مطابقة تُسجَّل بحالتها ومصدرها ودرجة يقينها.
 *   - قابل للاستئناف: يتجاوز ما هو موجود بالفعل في الكاش.
 *
 * الاستخدام: node scripts/verify-cas.mjs [--batch N]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..'); // data/apc2025_review
const VER = path.join(ROOT, 'verification');
const CACHE = path.join(VER, 'cache');
const PPDB_CACHE = path.join(CACHE, 'ppdb');
const PC_CACHE = path.join(CACHE, 'pubchem');
for (const d of [PPDB_CACHE, PC_CACHE]) fs.mkdirSync(d, { recursive: true });

const TODAY = '2026-10-28';
const batchArg = process.argv.indexOf('--batch');
const BATCH = batchArg > -1 ? parseInt(process.argv[batchArg + 1], 10) : Infinity;

const actives = JSON.parse(fs.readFileSync(path.join(ROOT, 'extracted/data/actives.json'), 'utf8')).actives;
const ppdbIndex = JSON.parse(fs.readFileSync(path.join(VER, 'ppdb_index.json'), 'utf8'));

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// مطابقة الاسم → إدخال PPDB (عنوان مباشر أو تهجئة بديلة أو مرادف داخل الكلمات المفتاحية)
const byTitle = new Map(ppdbIndex.map((e) => [norm(e.title), e]));
const byKeyword = new Map();
for (const e of ppdbIndex) {
  for (const k of e.keywords || []) {
    const nk = norm(k);
    if (nk && !byKeyword.has(nk)) byKeyword.set(nk, e);
  }
}
function matchPpdb(a) {
  const names = [a.name_en, ...(a.raw_spellings || []), ...(a.source_vs_reference?.['name_as_printed_in_book'] || [])]
    .filter(Boolean)
    .map(norm);
  for (const n of names) {
    if (byTitle.has(n)) return { entry: byTitle.get(n), via: 'title' };
  }
  for (const n of names) {
    if (byKeyword.has(n)) return { entry: byKeyword.get(n), via: 'keyword' };
  }
  // مطابقة برقم CAS نفسه: إما في عنوان الإدخال أو ضمن كلماته المفتاحية
  const cas = norm(a.cas || '');
  if (cas) {
    for (const e of ppdbIndex) {
      if (norm(e.title).includes(cas)) return { entry: e, via: 'cas-title' };
      if ((e.keywords || []).some((k) => norm(k).includes(cas))) return { entry: e, via: 'cas-keyword' };
    }
  }
  return { entry: null, via: null };
}

// CAS RN من صفحة PPDB المحفوظة: <td class="data1">542-75-6</td> بعد row_header "CAS RN"
function extractPpdbCas(html) {
  const i = html.indexOf('CAS RN');
  if (i < 0) return { cas: null, casName: null };
  const seg = html.slice(i, i + 4000);
  const m = seg.match(/<td class="data1">([^<]*)<\/td>/);
  const j = seg.indexOf('CAS name');
  let casName = null;
  if (j >= 0) {
    const seg2 = seg.slice(j, j + 4000);
    const m2 = seg2.match(/<td class="data1">([^<]*)<\/td>/);
    if (m2) casName = m2[1].trim() || null;
  }
  return { cas: m ? m[1].trim() : null, casName };
}

async function fetchText(url, file) {
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; data-audit/1.0)' } });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  fs.writeFileSync(file, body);
  await new Promise((r) => setTimeout(r, 350));
  return body;
}

async function ppdbFor(entry) {
  const id = entry.url.replace(/[^\d]/g, '');
  const file = path.join(PPDB_CACHE, `${id}.htm`);
  const html = await fetchText(`https://sitem.herts.ac.uk/aeru/ppdb/en/${entry.url}`, file);
  return extractPpdbCas(html);
}

// PubChem: قائمة أرقام السجل (RN) المرتبطة باسم المادة
async function pubchemRn(name) {
  const file = path.join(PC_CACHE, `${Buffer.from(name).toString('base64url')}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/xrefs/RN/JSON`;
  let out;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; data-audit/1.0)' } });
    if (res.status === 404) out = { rn: [], note: 'PUG 404 — لا يوجد تطابق اسم في PubChem' };
    else if (!res.ok) out = { rn: [], note: `PUG HTTP ${res.status}` };
    else {
      const j = await res.json();
      const rn = j?.InformationList?.Information?.flatMap((x) => x.RN || []) ?? [];
      out = { rn, note: null };
    }
  } catch (e) {
    out = { rn: [], note: `خطأ شبكة: ${e.message}` };
  }
  fs.writeFileSync(file, JSON.stringify(out));
  await new Promise((r) => setTimeout(r, 400));
  return out;
}

const results = [];
let processed = 0;
for (const a of actives) {
  if (processed >= BATCH) break;
  processed++;
  const names = [a.name_en, ...(a.raw_spellings || [])].filter(Boolean);
  const { entry, via } = matchPpdb(a);
  const row = {
    name_en: a.name_en,
    name_as_printed: a.source_vs_reference?.['name_as_printed_in_book'] || [],
    package_cas: a.cas || null,
    package_status: a.status,
    raw_spellings: a.raw_spellings || [],
    n_rows: a.n_rows,
    ppdb: { matched: !!entry, via, title: entry?.title ?? null, url: entry ? `https://sitem.herts.ac.uk/aeru/ppdb/en/${entry.url}` : null, cas: null, cas_name: null, error: null },
    pubchem: { queries: [], rn_union: [], errors: [] },
  };
  if (entry) {
    try {
      const { cas, casName } = await ppdbFor(entry);
      row.ppdb.cas = cas;
      row.ppdb.cas_name = casName;
    } catch (e) {
      row.ppdb.error = e.message;
    }
  }
  // استعلام PubChem بكل اسم (الاسم القياسي ثم كل تهجئة مطبوعة)
  for (const n of [...new Set(names)]) {
    const pc = await pubchemRn(n);
    row.pubchem.queries.push({ q: n, rn: pc.rn, note: pc.note });
    for (const r of pc.rn) if (!row.pubchem.rn_union.includes(r)) row.pubchem.rn_union.push(r);
  }
  results.push(row);
  if (processed % 25 === 0) console.error(`... ${processed}/${Math.min(actives.length, BATCH)}`);
}

fs.writeFileSync(path.join(VER, 'cas-verification.json'), JSON.stringify({ generated: TODAY, results }, null, 1));
console.error(`DONE ${results.length} rows -> verification/cas-verification.json`);
