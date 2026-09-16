/*
 * tests/verify.mjs — read-only automated verification
 * Run: node tests/verify.mjs
 *
 * Verifies, WITHOUT modifying anything:
 *   1. the four JSON databases are valid, row counts unchanged,
 *      byte-identical to the recorded baseline (nothing removed/altered)
 *   2. search engine: exact-name, exact-CAS (incl. multi-CAS rows),
 *      typo/fuzzy, 80% minimum threshold, source priority, pro/farmer
 *      limits, parity with the original reference score()
 *   3. static analysis of sw.js precache list (all 4 DBs still cached),
 *      manifest icons existence, and offline strategy wiring
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  ok ? pass++ : fail++;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
}

/* ---------- load SearchCore (UMD-style, works in Node) ---------- */
globalThis.window = globalThis; // search-core.js attaches to window
require('./../src/search-core.js');
const SC = globalThis.SearchCore;
if (!SC) { console.error('FATAL: SearchCore failed to load'); process.exit(1); }

/* ---------- baseline ---------- */
const baseline = JSON.parse(fs.readFileSync('tests/data-baseline.json', 'utf8'));

/* ---------- 1. data integrity ---------- */
console.log('\n== 1. Data integrity (nothing removed or altered) ==');
const DBS = {};
for (const [file, exp] of Object.entries(baseline.files)) {
  const raw = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  let ok = hash === exp.sha256, detail = '';
  if (!ok) detail = 'sha256 mismatch: got ' + hash;
  check(file + ' byte-identical', ok, detail);
  let data = null, valid = false;
  try { data = JSON.parse(raw.toString('utf8')); valid = true; } catch (e) { detail = 'invalid JSON: ' + e.message; }
  check(file + ' valid JSON', valid, detail || '');
  if (valid) {
    const key = path.basename(file, '.json');
    DBS[key] = data;
    const cntOK = data.rows.length === exp.rows;
    check(file + ' row count ' + data.rows.length, cntOK, cntOK ? '' : 'expected ' + exp.rows);
    const metaOK = data.meta && data.meta.key === key && data.meta.count === data.rows.length;
    check(file + ' meta consistent', !!metaOK, metaOK ? '' : 'meta.count=' + (data.meta && data.meta.count));
  }
}

/* ---------- 2. search engine ---------- */
console.log('\n== 2. Search engine (semantics preserved) ==');
const sources = Object.entries(DBS).map(([key, data]) => ({ key, rows: data.rows }));
const search = SC.buildSearch(sources);
const byKey = Object.fromEntries(Object.entries(DBS));

/* 2a. exact-name search across every source (sampled) */
let nameHit = 0, nameTried = 0;
for (const [key, data] of Object.entries(DBS)) {
  const step = Math.max(1, Math.floor(data.rows.length / 100));
  for (let i = 0; i < data.rows.length; i += step) {
    const r = data.rows[i];
    nameTried++;
    const res = search(r.name);
    if (res.some(x => x.k === key && x.r.row === r.row && x.s.v === 100 && x.s.type === 'اسم مطابق')) nameHit++;
  }
}
check('exact-name reachability (sampled ' + nameTried + ')', nameHit === nameTried, nameHit + '/' + nameTried);

/* 2b. exact-CAS search (sampled, incl. multi-CAS rows) */
let casHit = 0, casTried = 0, multiTried = 0, multiHit = 0;
for (const [key, data] of Object.entries(DBS)) {
  const step = Math.max(1, Math.floor(data.rows.length / 100));
  for (let i = 0; i < data.rows.length; i += step) {
    const r = data.rows[i];
    const cass = SC.extractCass(r.cas);
    if (!cass.length) continue;
    casTried++;
    if (cass.length > 1) multiTried++;
    const res = search(cass[0]);
    const hit = res.some(x => x.k === key && x.r.row === r.row && x.s.v === 100);
    if (hit) { casHit++; if (cass.length > 1) multiHit++; }
  }
}
check('exact-CAS reachability (sampled ' + casTried + ')', casHit === casTried, casHit + '/' + casTried);
check('multi-CAS rows now findable', multiHit === multiTried, multiHit + '/' + multiTried);

/* 2c. typo/fuzzy */
const typo = search('glyphpate');
check('typo query "glyphpate" >= 80', typo.length > 0 && typo[0].s.v >= 80,
  typo.length ? 'top=' + typo[0].s.v + '% ' + typo[0].r.name.slice(0, 30) : 'no results');

/* 2d. minimum threshold 80% */
let below = 0, minSeen = 101;
for (const q of ['glyph', 'glyphosate isopropylamine', '2,4-D', 'mancozeb', 'paraquatt', 'imidaclopridd', 'carbofuran', 'سوفلفل']) {
  for (const x of search(q, true)) {
    minSeen = Math.min(minSeen, x.s.v);
    if (x.s.v < 80) below++;
  }
}
check('no results below 80%', below === 0, 'min seen = ' + (minSeen === 101 ? 'n/a' : minSeen + '%'));

/* 2e. source priority */
const pr = search('Glyphosate');
const order = pr.map(x => x.k);
const rankOf = k => ({ 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 })[k] ?? 99;
check('source priority Libya248>500>EU>EPA',
  order.every((k, i) => i === 0 || rankOf(order[i - 1]) <= rankOf(k)), order.join(' → '));

/* 2f. farmer/pro limits */
check('farmer limit 16', search('e', false).length <= 16, String(search('e', false).length));
check('pro limit 80', search('e', true).length <= 80, String(search('e', true).length));

/* 2g. parity with a direct (non-indexed) reference implementation.
 * The reference replicates the documented rules: score() verbatim for
 * names/CAS, plus the multi-CAS exact rule via extractCass() (the one
 * intentional improvement over the original score(), which could not
 * find rows whose cas field is a bracketed CAS list). */
function referenceSearch(q) {
  const isCas = SC.isCAS(q);
  const refs = [];
  for (const [key, data] of Object.entries(DBS)) {
    for (const r of data.rows) {
      if (isCas) {
        const c = SC.extractCass(r.cas).find(cas => SC.compact(cas) === SC.compact(q));
        if (c) { refs.push({ k: key, r, s: { v: 100, type: 'CAS مطابق تمامًا', field: c } }); continue; }
        const s0 = SC.score(q, r);            // original: CAS-vs-CAS miss returns 0
        if (s0.v >= 80) refs.push({ k: key, r, s: s0 });
        continue;
      }
      const s = SC.score(q, r);
      if (s.v >= 80) refs.push({ k: key, r, s });
    }
  }
  refs.sort((a, b) => (({ 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 })[a.k] - ({ 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 })[b.k]) || b.s.v - a.s.v);
  return refs.slice(0, 80);
}
let mism = 0, compared = 0;
const probes = ['Glyphosate', '1071-83-6', 'glyphpate', 'Mancozeb', '2,4,5-T', 'Paraquat', '1910-42-5', 'Glyphosate isopropylamine'];
for (const q of probes) {
  const refTop = referenceSearch(q).map(x => x.k + ':' + x.r.row + ':' + x.s.v + ':' + x.s.type).join('|');
  const gotTop = search(q, true).map(x => x.k + ':' + x.r.row + ':' + x.s.v + ':' + x.s.type).join('|');
  compared++;
  if (refTop !== gotTop) { mism++; console.log('    parity mismatch for ' + q); }
}
check('indexed search matches direct reference (' + compared + ' queries)', mism === 0, mism + ' mismatches');

/* ---------- 3. PWA / offline wiring ---------- */
console.log('\n== 3. PWA & offline wiring ==');
const sw = fs.readFileSync('sw.js', 'utf8');
for (const f of ['data/libya-248.json', 'data/libya-500.json', 'data/eu.json', 'data/epa.json']) {
  check('sw precaches ' + f, sw.includes(f));
}
check('sw caches app shell', ['./index.html', './src/search-core.js', './src/app.js'].every(f => sw.includes(f)));
check('sw handles version.json network-first', /version\.json/.test(sw) && sw.includes("cache: 'no-store'"));
check('sw data strategy stale-while-revalidate', sw.includes('stale-while-revalidate'.slice(0, 20)) || /DATA\.some/.test(sw));
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
check('manifest has 3 icons incl. maskable', manifest.icons.length === 3 && manifest.icons.some(i => i.purpose === 'maskable'));
for (const i of manifest.icons) {
  const p = path.join(root, i.src);
  check('icon exists: ' + i.src, fs.existsSync(p));
}
check('manifest keeps dir rtl + lang ar', manifest.dir === 'rtl' && manifest.lang === 'ar');
const html = fs.readFileSync('index.html', 'utf8');
check('index loads search-core before app', html.indexOf('src/search-core.js') < html.indexOf('src/app.js'));
check('per-DB status chips present', ['db-libya-248', 'db-libya-500', 'db-eu', 'db-epa'].every(id => html.includes(id)));
check('history panel present', html.includes('historyPanel') && html.includes('historyBtn'));
check('RTL preserved', html.includes('dir="rtl"') && html.includes('lang="ar"'));
const app = fs.readFileSync('src/app.js', 'utf8');
check('IndexedDB upgraded to v2 (db + history)', app.includes('DB_VERSION = 2') && app.includes("STORE_HISTORY = 'history'"));
check('persistent storage requested', app.includes('navigator.storage.persist'));
check('fail-soft per-source loading', /SOURCES\.forEach\(loadSource\)/.test(app));
check('no auto-delete of user data', !/deleteDatabase/.test(app));

/* ---------- summary ---------- */
console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
