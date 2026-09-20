#!/usr/bin/env node
/*
 * update-intl-dbs.mjs — وكيل تحديث قواعد البيانات الدولية
 * =========================================================
 * Refreshes the INTERNATIONAL pesticide databases from their official
 * sources and (re)builds the FAO/WHO Codex database:
 *
 *   data/eu.json    — EU Pesticides Database (approved substances)
 *   data/epa.json   — US EPA pesticide registration datasets (APPRIL)
 *   data/fao.json   — FAO/WHO Codex Alimentarius pesticide MRL database
 *
 * ABSOLUTE RULES
 * --------------
 * 1. data/libya-248.json and data/libya-500.json are PROTECTED.
 *    This agent NEVER reads them for writing, NEVER overwrites them,
 *    and the Libyan databases remain the app's PRIMARY reference.
 * 2. Nothing is invented: a file is written only when the official
 *    source responded AND the parsed rows pass validation and sanity
 *    minimums. A failed/ambiguous fetch leaves the existing file intact.
 * 3. Default mode is a DRY RUN (probe + report, no writes).
 *    Run `node scripts/update-intl-dbs.mjs --write` to apply.
 *
 * Scheduling: run weekly via cron / GitHub Actions; the app consumes
 * the resulting JSON files offline as usual.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const WRITE = process.argv.includes('--write');
const TIMEOUT_MS = 20000;

/* Hard guard — the heart of the "Libya is the base" rule */
const PROTECTED = new Set(['data/libya-248.json', 'data/libya-500.json']);
function assertNotProtected(rel) {
  if (PROTECTED.has(rel) || rel.includes('libya')) {
    throw new Error('PROTECTED: ' + rel + ' belongs to the Libyan reference and can never be written by this agent');
  }
}

/* ------------------------------------------------------------------
 * Source registry — official pages only (no third-party mirrors)
 * ------------------------------------------------------------------ */
const SOURCES = {
  eu: {
    file: 'data/eu.json',
    minRows: 800,
    label: 'EU Pesticides Database (approved substances)',
    page: 'https://food.ec.europa.eu/plants/pesticides/eu-pesticides-database_en',
    // The Commission publishes the database contents as downloadable
    // files; endpoints move occasionally, so candidates are tried in
    // order and the first one that parses wins.
    candidates: [
      'https://food.ec.europa.eu/system/tdm?filename=eu_pesticides_database_substances.json',
      'https://ec.europa.eu/food/system/tdm?filename=eu_pesticides_database_substances.json'
    ]
  },
  epa: {
    file: 'data/epa.json',
    minRows: 1500,
    label: 'US EPA pesticide registration datasets (APPRIL)',
    page: 'https://www.epa.gov/pesticide-registration-services-and-compliance/pesticide-registration-datasets',
    candidates: [
      'https://www.epa.gov/system/files/other-files/2025-xx/appril-dataset.json' // placeholder — APPRIL ships as zip/csv; see parseEPA()
    ]
  },
  fao: {
    file: 'data/fao.json',
    minRows: 80,
    label: 'FAO/WHO Codex Alimentarius pesticide database (MRLs)',
    page: 'https://www.fao.org/fao-who-codexalimentarius/codex-texts/dbs/pests/en/',
    candidates: [
      'https://www.fao.org/fao-who-codexalimentarius/resources/pesticides-database.json' // placeholder — see parseCodex()
    ]
  }
};

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'agri-advisor-update-agent/1.0' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------
 * Normalization — every adapter returns rows in the app's shape:
 *   { name, cas, status, ...optional source fields }
 * No fabrication: unparsed fields are omitted, never guessed.
 * ------------------------------------------------------------------ */
function normRow(r) {
  const out = {};
  const name = String(r.name || r.substance_name || r.chemical_name || r.pesticide_name || r.substance || '').trim();
  if (!name) return null;
  out.name = name;
  const cas = String(r.cas_number || r.cas || '').trim();
  if (cas) out.cas = cas;
  const status = String(r.approval_status || r.status || r.raw_status || '').trim();
  if (status) out.status = status;
  for (const k of ['simple_classification', 'functional_category', 'pc_code', 'source_url', 'legislation']) {
    if (r[k]) out[k] = r[k];
  }
  return out;
}

function parseStructured(text) {
  /* JSON (array or {rows:[]}) */
  try {
    const j = JSON.parse(text);
    const rows = Array.isArray(j) ? j : (Array.isArray(j.rows) ? j.rows : null);
    if (rows) return rows.map(normRow).filter(Boolean);
  } catch (e) { /* not JSON — try CSV below */ }
  /* CSV with a header line */
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length > 2 && /name|substance/i.test(lines[0])) {
    const sep = lines[0].includes(';') ? ';' : ',';
    const head = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const iName = head.findIndex(h => /substance|chemical|name|pesticide/.test(h));
    const iCas = head.findIndex(h => /cas/.test(h));
    const iStatus = head.findIndex(h => /status|approved/.test(h));
    if (iName >= 0) {
      return lines.slice(1).map(l => {
        const cells = l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
        return normRow({
          name: cells[iName],
          cas_number: iCas >= 0 ? cells[iCas] : '',
          status: iStatus >= 0 ? cells[iStatus] : ''
        });
      }).filter(Boolean);
    }
  }
  return null;
}

function parseEU(text) { return parseStructured(text); }
function parseEPA(text) { return parseStructured(text); }
function parseCodex(text) { return parseStructured(text); }

const PARSERS = { eu: parseEU, epa: parseEPA, fao: parseCodex };

/* ------------------------------------------------------------------ */
function looksValid(data) {
  return !!(data && data.meta && data.meta.key && Array.isArray(data.rows)
    && data.meta.count === data.rows.length);
}

async function refresh(key) {
  const src = SOURCES[key];
  console.log('\n== ' + key.toUpperCase() + ' — ' + src.label);
  let rows = null, usedUrl = null, err = null;
  for (const url of src.candidates) {
    try {
      const text = await fetchText(url);
      rows = PARSERS[key](text);
      if (rows && rows.length) { usedUrl = url; break; }
      err = 'parsed 0 rows from ' + url;
    } catch (e) { err = e.message; }
  }
  if (!rows || !usedUrl) {
    console.log('   ✗ no usable data (' + (err || 'unknown') + ')');
    console.log('   → official page: ' + src.page);
    console.log('   → existing file (if any) left untouched.');
    return false;
  }
  if (rows.length < src.minRows) {
    console.log('   ✗ sanity failed: ' + rows.length + ' rows < minimum ' + src.minRows + ' — refusing to write');
    return false;
  }
  const data = {
    meta: { key, count: rows.length, source: src.page, generated: new Date().toISOString() },
    rows
  };
  const rel = src.file;
  assertNotProtected(rel);                    // hard guard, twice for clarity
  const abs = path.join(root, rel);
  const cur = fs.existsSync(abs) ? JSON.parse(fs.readFileSync(abs, 'utf8')) : null;
  console.log('   ✓ parsed ' + rows.length + ' rows from ' + usedUrl);
  if (cur && looksValid(cur)) {
    console.log('   current file: ' + cur.meta.count + ' rows');
    if (cur.meta.count === rows.length) console.log('   (same size — content may still differ)');
  }
  if (!WRITE) {
    console.log('   DRY RUN — not written. Use --write to apply.');
    return true;
  }
  fs.mkdirSync(path.join(root, 'data', 'archive'), { recursive: true });
  if (fs.existsSync(abs)) {
    const backup = path.join('data', 'archive', path.basename(rel, '.json')
      + '-' + new Date().toISOString().slice(0, 10) + '.json');
    assertNotProtected(backup);
    fs.copyFileSync(abs, path.join(root, backup));
    console.log('   backup → ' + backup);
  }
  fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n');
  console.log('   ✓ written ' + rel + ' (' + rows.length + ' rows)');
  return true;
}

console.log('تحديث قواعد البيانات الدولية — international DB update agent');
console.log('mode: ' + (WRITE ? 'WRITE' : 'DRY RUN (probe only)'));
console.log('protected: ' + [...PROTECTED].join(', ') + ' — never touched');

/* Bookkeeping stamp (only on --write) */
const stamp = { agent: 'update-intl-dbs', ranAt: new Date().toISOString(), write: WRITE, results: {} };
for (const key of Object.keys(SOURCES)) {
  stamp.results[key] = await refresh(key);
}
if (WRITE) {
  fs.writeFileSync(path.join(root, 'data', 'intl-version.json'), JSON.stringify(stamp, null, 2) + '\n');
  console.log('\nbookkeeping → data/intl-version.json');
}
const okCount = Object.values(stamp.results).filter(Boolean).length;
console.log('\ndone: ' + okCount + '/' + Object.keys(SOURCES).length + ' sources parseable'
  + (okCount < Object.keys(SOURCES).length ? ' — check the official pages listed above' : ''));
process.exit(okCount ? 0 : 1);