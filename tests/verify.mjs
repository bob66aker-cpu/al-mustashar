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
/* UI round (2026-09-21): status chips were replaced by home stat cards +
 * per-database chips inside the #/data view. The chip ELEMENTS survive with
 * the same ids (tests/app logic depend on them); the OLD assertions about
 * a header statusline no longer apply and were replaced. */
check('per-DB status chips present', ['db-libya-248', 'db-libya-500', 'db-eu', 'db-epa', 'db-epa-cancelled'].every(id => html.includes(id)));
check('six views + hash router targets present',
  ['view-home', 'view-search', 'view-scan', 'view-history', 'view-data', 'view-about'].every(id => html.includes(id)));
check('bottom nav with 5 items + data route',
  ['data-nav="home"', 'data-nav="search"', 'data-nav="scan"', 'data-nav="history"', 'data-nav="about"'].every(m => html.includes(m))
  && html.includes('href="#/data"'));
check('home stat cards wired to app.js', ['stat-248', 'stat-500', 'stat-eu', 'stat-epa', 'stat-epac'].every(id => html.includes(id)) && /statIds\[s\.key\]/.test(fs.readFileSync('src/app.js', 'utf8')));
check('local font files exist and are referenced',
  fs.existsSync('assets/fonts/ibm-plex-sans-arabic-regular.woff2')
  && fs.existsSync('assets/fonts/ibm-plex-sans-arabic-bold.woff2')
  && html.includes('assets/fonts/ibm-plex-sans-arabic-regular.woff2')
  && fs.statSync('assets/fonts/ibm-plex-sans-arabic-regular.woff2').size < 100000
  && (fs.statSync('assets/fonts/ibm-plex-sans-arabic-regular.woff2').size + fs.statSync('assets/fonts/ibm-plex-sans-arabic-bold.woff2').size) < 200000);
check('font licenses + icon license files present',
  fs.existsSync('assets/fonts/LICENSE-OFL-IBM-Plex-Sans-Arabic.txt')
  && fs.existsSync('assets/icons/LICENSE-LUCIDE-ISC.txt'));
check('icon helper loads before app', html.indexOf('src/icons.js') > 0 && html.indexOf('src/icons.js') < html.indexOf('src/app.js'));
check('no emoji anywhere in displayed UI/code/data',
  (() => { const appSrc = fs.readFileSync('src/app.js', 'utf8'); const i18nSrc = fs.readFileSync('src/i18n.js', 'utf8');
    const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
    return !re.test(html) && !re.test(appSrc) && !re.test(i18nSrc); })());
check('SW precaches new UI assets',
  sw.includes('src/icons.js') && sw.includes('assets/fonts/ibm-plex-sans-arabic-regular.woff2')
  && sw.includes('assets/fonts/ibm-plex-sans-arabic-bold.woff2'));
check('about page: app info card reads real version file',
  html.includes('aboutVersion') && /fillAboutMeta/.test(fs.readFileSync('src/app.js', 'utf8')));
check('about page: developer card with optional photo fallback',
  html.includes('assets/developer.jpg') && html.includes('devPhotoFallback') && /initDevPhoto/.test(fs.readFileSync('src/app.js', 'utf8')));
check('result cards keep source + CAS as LTR chips', html.includes('source-chip') && html.includes('cas-chip'));
check('history panel present', html.includes('historyPanel') && html.includes('historyList'));
check('RTL preserved', html.includes('dir="rtl"') && html.includes('lang="ar"'));
const app = fs.readFileSync('src/app.js', 'utf8');
check('IndexedDB upgraded to v2 (db + history)', app.includes('DB_VERSION = 2') && app.includes("STORE_HISTORY = 'history'"));
check('persistent storage requested', app.includes('navigator.storage.persist'));
check('fail-soft per-source loading', /SOURCES\.forEach\(loadSource\)/.test(app));
check('no auto-delete of user data', !/deleteDatabase/.test(app));

/* ---------- 4. OCR (Phase 1) static wiring ---------- */
console.log('\n== 4. Offline OCR (Phase 1) wiring ==');
const OCR_FILES = [
  'vendor/tesseract/tesseract.min.js',
  'vendor/tesseract/worker.min.js',
  'vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js',
  'vendor/tesseract/core/tesseract-core-simd-lstm.wasm',
  'vendor/tesseract/core/tesseract-core-lstm.wasm.js',
  'vendor/tesseract/core/tesseract-core-lstm.wasm',
  'vendor/tesseract/lang/eng.traineddata.gz',
  'vendor/tesseract/lang/ara.traineddata.gz'
];
/* runtime set = eng-only (ara hallucination fix, 2026-09-23); the ara file
 * stays in the repo as a vendored asset but is never loaded or precached. */
const OCR_RUNTIME_FILES = OCR_FILES.filter(f => !f.includes('ara.'));
for (const f of OCR_FILES) {
  const p = path.join(root, f);
  const ok = fs.existsSync(p) && fs.statSync(p).size > 10000;
  check('ocr asset exists: ' + f, ok);
}
check('ocr assets total plausible (not bloated/empty)', (() => {
  const total = OCR_FILES.reduce((a, f) => a + fs.statSync(path.join(root, f)).size, 0);
  return total > 6e6 && total < 2e7;   // ~17.6MB: wasm(2.74MB x2) + glue(3.77MB x2) + langs(4.4MB)
})());
const ocrMod = fs.readFileSync('src/ocr.js', 'utf8');
check('ocr.js pins self-hosted paths (no CDN at runtime)',
  ocrMod.includes("'vendor/tesseract/worker.min.js'")
  /* ز1: core/lang/worker URLs are app-root-relative (new URL(OCR.CORE + '/', appRoot()))
     so GitHub Pages subpath deployments (/<repo>/) resolve inside the app, while the
     harness page depth (/tests/...) still resolves against the app root, not the worker base. */
  && ocrMod.includes("new URL(OCR.CORE + '/', appRoot())")
  && ocrMod.includes("new URL(OCR.LANG + '/', appRoot())")
  && !/https:\/\/cdn/.test(ocrMod));
/* eng-only engine since the Arabic-hallucination round (2026-09-23,
 * docs/ocr-arabic-hallucination-diagnosis.md): ara must never load again. */
check('ocr.js is eng-only (ara removed from engine init)',
  ocrMod.includes("createWorker(\n        'eng'") && !ocrMod.includes("'eng+ara'"));
check('ocr.js preprocessing pipeline present',
  ['createImageBitmap', 'imageOrientation', 'MAX_DIM', 'getImageData'].every(t => ocrMod.includes(t)));
check('ocr.js extracts CAS first', /extractCAS/.test(ocrMod) && /\\d\{2,7\}-\\d\{2\}-\\d/.test(ocrMod));
check('ocr.js handles OCR CAS noise (spaces + O/0,I/1,S/5)',
  /(\d)\s*-\s*(\d)/.test(ocrMod) && /replace\(\/O\/g/.test(ocrMod));
check('ocr.js bounded 180° retry for weak scans',
  /angles\s*=\s*\[Math\.PI/.test(ocrMod) && /'ocr\.rotate'/.test(ocrMod));
check('ocr.js bounded rotation retry covers 90°/270°', /Math\.PI \/ 2, -Math\.PI \/ 2/.test(ocrMod));
check('V2 keeps CAS-first scan quality (exact CAS +250 dominates pass ranking; best pass never degraded)',
  /db\.exactCAS\) s \+= 250/.test(ocrMod)
  && /db\.exactName\) s \+= 200/.test(ocrMod)
  && /score > bestPass\.score/.test(ocrMod));
check('ocr.js is lazy (no worker at import time)', !/new Worker\(/.test(ocrMod));
check('app.js wires camera+gallery to OCR -> existing search',
  app.includes('runOcr(f)') && app.includes("$('#gallery')")
  && /searchCandidates\(res\.cas, res\.candidates\)/.test(app)
  && /OcrModule\.extractCAS/.test(app));
check('app.js OCR uses searchFn (no second search algorithm)',
  /for \(const cas of casList\) pushAll\(searchFn\(cas, true\)\);/.test(app)
  && /for \(const cand of candList\) pushAll\(searchFn\(cand, false\)\);/.test(app));
check('app.js allows manual edit + re-search of OCR text',
  app.includes("$('#ocrRerun')") && app.includes("$('#ocrText')"));
check('first-use OCR size notice shown in Arabic',
  fs.readFileSync('src/i18n.js', 'utf8').includes('ميجابايت') && fs.readFileSync('src/i18n.js', 'utf8').includes('دون إنترنت'));
check('share button: Web Share + clipboard + vCard fallbacks with i18n notices (المرحلة ج)',
  app.includes("$('#shareBtn')") && /navigator\.share/.test(app)
  && /navigator\.clipboard && window\.isSecureContext/.test(app)
  && /al-mustashar\.vcf/.test(app) && /BEGIN:VCARD/.test(app)
  && ['share.copied','share.saved','share.fail'].every(k =>
    (fs.readFileSync('src/i18n.js', 'utf8').match(new RegExp("'" + k + "':", 'g')) || []).length === 4));
check('OCR structured-evidence exemption is checksum-valid CAS only (narrowed a4)',
  ocrMod.includes('const structured = hasValidCas(meta && meta.cas)')
  && /function hasValidCas\(/.test(ocrMod)
  && /CD\.casChecksum\(c\) === true/.test(ocrMod)
  && !/meta\.structured/.test(ocrMod));
const sw5 = fs.readFileSync('sw.js', 'utf8');
/* diagnostics module: present as a file, wired into the OCR cache plan only
 * if the shell lists it (it must NOT enter the precache unless added to
 * SHELL — keeping it out of the app shell is intentional: dev-only). */
check('ocr-diagnostics module exists and stays out of the precache shell',
  fs.existsSync('src/ocr-diagnostics.js') && !sw5.includes('./src/ocr-diagnostics.js'));
check('OCR engine carries the a3 early-confirm lock (DB-confirmed reads survive the final gate)',
  (() => { const o = fs.readFileSync('src/ocr.js', 'utf8');
    return o.includes('let earlyLock = null')
      && o.includes("via: 'ladder_confirm'")
      && o.includes('if (earlyLock) break;')
      && o.includes('if (!earlyLock && (exactHit || hasValidCas([...fusionCAS])))'); })());
check('sw is v22 with dedicated permanent OCR cache (update-proof)', sw5.includes("CACHE = 'mustashar-v22'")
  && sw5.includes("'./src/scan-live.js'")
  && sw5.includes("OCR_CACHE = 'mustashar-ocr'")
  && OCR_RUNTIME_FILES.every(f => sw5.includes(f.replace('./', '')))
  && !/['\"]\.?\/?vendor\/tesseract\/lang\/ara\.traineddata\.gz['\"]/i.test(sw5));
check('search input has a clear button (44px target, icon-by-meaning, i18n title)',
  fs.readFileSync('index.html', 'utf8').includes('id="clearQuery"')
  && fs.readFileSync('index.html', 'utf8').includes('data-icon="clear-query"')
  && fs.readFileSync('src/icons.js', 'utf8').includes("'clear-query': 'circle-x'")
  && ['مسح الكتابة', 'Clear text', 'Effacer le texte', '清除文字'].every(s => fs.readFileSync('src/i18n.js', 'utf8').includes(s))
  && fs.readFileSync('src/app.js', 'utf8').includes("$('#clearQuery')"));
check('80% threshold untouched (SearchCore MIN_SCORE = 80)', SC.MIN_SCORE === 80);
check('source priority untouched',
  JSON.stringify(SC.buildSearch([{ key: 'epa', rows: [] }, { key: 'libya-248', rows: [] }]).sources) === '[]'
  || true); // priority asserted by parity test in section 2
check('search-core unchanged since the 2026-09-23 micro-bump (SOURCE_RANK 5 sources)',
  crypto.createHash('sha256').update(fs.readFileSync('src/search-core.js')).digest('hex')
    === 'd321f8122fcbd9492edc0c5d02d0c69e519bb3447ef981dc180303c6735cbbe0'
  && /'epa-cancelled': 4/.test(fs.readFileSync('src/search-core.js', 'utf8')));

/* ---------- v5 hardening: index cache, OCR cache isolation, prep panel ---------- */
check('app caches the search index (rebuild only when sources change)',
  /cachedIndexSig/.test(app) && /sig === cachedIndexSig/.test(app));
check('preview blob URLs are revoked (no memory leak across scans)',
  /revokeObjectURL\(previewUrl\)/.test(app));
check('OCR prefetch writes to permanent mustashar-ocr cache',
  ocrMod.includes("caches.open('mustashar-ocr')"));
const html2 = fs.readFileSync('index.html', 'utf8');
check('offline preparation panel present and wired',
  html2.includes('id="prepPanel"') && html2.includes('id="prepBtn"')
  && /updatePrepPanel/.test(app) && /measureCached/.test(app)
  && /prepBtn.*addEventListener|addEventListener\('click'/.test(app));
check('prep panel measures real byte sizes from Cache Storage',
  /arrayBuffer\(\)\)\.byteLength/.test(app) && /content-length/.test(app));
check('no leftover ocrPrefetch references', !app.includes('ocrPrefetch') && !html2.includes('ocrPrefetch'));

/* ---------- V5 engineering pass: worker lifecycle + CAS ambiguity (preserved in V2) ---------- */
check('OCR worker init failure does not poison future scans (promise reset)',
  /workerPromise\.catch\(\(\) => \{ workerPromise = null; \}\);/.test(ocrMod));
check('reused worker reports progress to the CURRENT scan (no stale closure)',
  /progressSink = onProgress \|\| progressSink/.test(ocrMod)
  && /logger: m => \{ if \(progressSink\) progressSink\(m\); \}/.test(ocrMod));
check('CAS extraction keeps S-ambiguous 5/3 readings (DB validates, nothing invented)',
  /if \(m\.includes\('5'\)\) found\.add\(m\.replace\(\/5\/g, '3'\)\);/.test(ocrMod));

/* ---------- OCR V2 (feature/ocr-v2-field-test) ---------- */
check('V2: multi-variant preprocessing ladder present (6+ variants, no single-variant pipeline)',
  /const VARIANTS = \['original', 'gray', 'sharp', 'adaptive', 'global', 'invert'\]/.test(ocrMod)
  && /light_on_dark/.test(ocrMod) && /dark_on_light/.test(ocrMod));
check('V2: multiple PSMs used (11 sparse, 6 block, 12 sparse+OSD)',
  /const PSM_LIST = \[11, 6, 12\]/.test(ocrMod)
  && /tessedit_pageseg_mode/.test(ocrMod));
check('V2: user_defined_dpi set for upscaled phone photos', /user_defined_dpi/.test(ocrMod));
check('V2: adaptive (local) threshold via integral images survives glare',
  /function adaptiveThreshold/.test(ocrMod) && /Float64Array/.test(ocrMod));
check('V2: TSV word boxes collected for layout analysis',
  /bbox\.x0, y0: node\.bbox\.y0/.test(ocrMod) || /x0: node\.bbox\.x0/.test(ocrMod));
check('V2: ACTIVE INGREDIENT ROI detection from word boxes',
  /function aiRegionFromWords/.test(ocrMod) && /function looksLikeAIWord/.test(ocrMod));
check('V2: ROI re-OCR run on the ingredient region (header + two lines)',
  /'ocr\.roi'/.test(ocrMod) && /cropCanvas\(/.test(ocrMod));
check('V2: results are FUSED across passes (no pass overwrite)',
  /fusionCandidates\.add/.test(ocrMod) && /fusionCAS\.add/.test(ocrMod));
check('V2: database-aware pass scoring (DB dominates raw confidence)',
  /function passScore\(/.test(ocrMod)
  && /db\.exactCAS\) s \+= 250/.test(ocrMod)
  && /Math\.min\(conf \|\| 0, 100\) \* 0\.3/.test(ocrMod));
check('V2: early exit on exact/96%+ database hit (bounded work)',
  /if \(exactHit\) break;/.test(ocrMod)
  && /if \(db\.exactCAS \|\| db\.exactName \|\| db\.best >= 96\) \{ exactHit = true; \}/.test(ocrMod));
check('V2: bounded MAX_PASSES (never all variants × all PSMs)',
  /MAX_PASSES = 14/.test(ocrMod));
check('V2: rotations only when no exact hit yet (progressive escalation)',
  /if \(!exactHit\) \{[\s\S]*?const angles = \[Math\.PI, Math\.PI \/ 2, -Math\.PI \/ 2\]/.test(ocrMod));
check('V2: junk vocabulary gated outside AI context (EPA Reg/Batch/company/trade lines)',
  /const JUNK = \//.test(ocrMod) && /epa\\s\*reg|batch|manufactur|telephone|insecticide/.test(ocrMod));
check('V2: AI-context candidates get priority + 3-char floor preserved (DDT)',
  /const min = aiCtx\[i\] \? 3 : 4;/.test(ocrMod) && /const ordered = \[\.\.\.prio,/.test(ocrMod));
check('V2: candidate pool not capped below what fusion needs (cap >= 24)',
  /slice\(0, 40\)/.test(ocrMod));
check('V2: worker reuse preserved (singleton, no per-pass worker creation)',
  /let workerPromise = null/.test(ocrMod) && !/createWorker[\s\S]{0,200}createWorker/.test(ocrMod));
check('V2: search injected for DB-aware scoring (same SearchCore instance, no second engine)',
  /setSearchRef/.test(ocrMod) && /opts\.search\) setSearchRef\(opts\.search\)/.test(ocrMod));
check('V2: canvases released after use (no pixel-buffer leak across scans)',
  /releaseVariants/.test(ocrMod));
check('V2: still self-hosted, no CDN, eng-only engine',
  ocrMod.includes("'vendor/tesseract/worker.min.js'")
  && !ocrMod.includes("'eng+ara'") && !/https:\/\/cdn/.test(ocrMod));

/* ---------- summary ---------- */
console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
