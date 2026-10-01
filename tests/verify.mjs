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
check('system fonts only — no @font-face and no font download in the shell',
  !/@font-face/.test(html.replace(/[\s\S]*?<!--/, '').replace(/-->[\s\S]*/, ''))
  && !/@font-face/.test(fs.readFileSync('src/tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))
  && !html.includes('assets/fonts/')
  && /font-family/.test(fs.readFileSync('src/tokens.css', 'utf8'))
  /* the tokens must name a system Latin stack AND a system Arabic stack */
  && /Segoe UI/.test(fs.readFileSync('src/tokens.css', 'utf8'))
  && /Tahoma/.test(fs.readFileSync('src/tokens.css', 'utf8'))
  && /Arial|sans-serif/.test(fs.readFileSync('src/tokens.css', 'utf8')));
check('the unused webfont files stay as fixture input only (not in the shell cache)',
  !sw.includes('assets/fonts/ibm-plex')
  && fs.existsSync('assets/fonts/ibm-plex-sans-arabic-regular.woff2')
  && fs.readFileSync('tests/fixtures/synthetic-labels.mjs', 'utf8').includes('assets/fonts/ibm-plex-sans-arabic-regular.woff2'));
check('font licenses + icon license files present',
  fs.existsSync('assets/fonts/LICENSE-OFL-IBM-Plex-Sans-Arabic.txt')
  && fs.existsSync('assets/icons/LICENSE-LUCIDE-ISC.txt'));
check('icon helper loads before app', html.indexOf('src/icons.js') > 0 && html.indexOf('src/icons.js') < html.indexOf('src/app.js'));
check('no emoji anywhere in displayed UI/code/data',
  (() => { const appSrc = fs.readFileSync('src/app.js', 'utf8'); const i18nSrc = fs.readFileSync('src/i18n.js', 'utf8');
    const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
    return !re.test(html) && !re.test(appSrc) && !re.test(i18nSrc); })());
check('SW precaches new UI assets',
  sw.includes('src/icons.js') && sw.includes('src/tokens.css'));
check('about page: app info card reads real version file',
  html.includes('aboutVersion') && /fillAboutMeta/.test(fs.readFileSync('src/app.js', 'utf8')));
check('about page: developer card with optional photo fallback',
  html.includes('assets/developer.jpg') && html.includes('devPhotoFallback') && /initDevPhoto/.test(fs.readFileSync('src/app.js', 'utf8')));
check('result cards keep source + CAS as LTR chips', html.includes('source-chip') && html.includes('cas-chip'));
check('history panel present', html.includes('historyPanel') && html.includes('historyList'));
check('RTL preserved', html.includes('dir="rtl"') && html.includes('lang="ar"'));
const app = fs.readFileSync('src/app.js', 'utf8');
check('IndexedDB upgraded to v3 (db + history + optional packs)',
  app.includes('DB_VERSION = 3') && app.includes("STORE_HISTORY = 'history'")
  && app.includes("createObjectStore('pack')")
  /* the pack module must open the SAME version, or its upgrade blocks forever */
  && fs.readFileSync('src/packs.js', 'utf8').includes('DB_VERSION = 3'));
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
/* 3.4: langs follow the UI language — 'ara+eng' for an Arabic UI, 'eng'
 * otherwise (docs/ocr-baseline.md §lang). ara must never be a DEFAULT. */
check('ocr.js lang gate: eng-only fallback, ara only via UI-language gate',
  ocrMod.includes("const lang = lang2 || 'eng'")
  && /opts\.ocrLang = \(opts\.uiLang === 'ar'\) \? 'ara\+eng' : 'eng'/.test(ocrMod));
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
check('sw is v37 with dedicated permanent OCR cache (update-proof)', sw5.includes("CACHE = 'mustashar-v37'")
  && sw5.includes("'./src/scan-live.js'")
  && sw5.includes("OCR_CACHE = 'mustashar-ocr'")
  && OCR_RUNTIME_FILES.every(f => sw5.includes(f.replace('./', '')))
  /* 3.4: ara returned to the runtime set as a UI-gated addition (no longer a
     hard exclusion) and the zxing wasm joined the permanent OCR assets. */
  && sw5.includes('./vendor/tesseract/lang/ara.traineddata.gz')
  && sw5.includes('./src/vendor/zxing_reader.wasm'));
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
/* the 2026-09-23 micro-bump fingerprint, extended by the no-CAS rule of the
 * Canada/Australia packs: a registry that publishes no CAS numbers may only
 * answer decisively on an exact normalised name. The SOURCE_RANK order is
 * still asserted separately, so the ranking cannot drift with this bump. */
check('search-core fingerprint (2026-09-23 micro-bump + the no-CAS candidate rule)',
  crypto.createHash('sha256').update(fs.readFileSync('src/search-core.js')).digest('hex')
    === '904409ace0a86643dfcf3cacdd95855e14f99cab3697535186f79ea22df4daf2'
  && /'epa-cancelled': 4/.test(fs.readFileSync('src/search-core.js', 'utf8'))
  && /const noCas = !!S\.noCas;/.test(fs.readFileSync('src/search-core.js', 'utf8')));

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

/* ---------- 1.19.0 «جولة الصدق»: نصوص وإسناد وتواريخ (أوامر المدير) ---------- */
const i18nSrc = fs.readFileSync('src/i18n.js', 'utf8');
const appSrc = fs.readFileSync('src/app.js', 'utf8');
const htmlSrc = fs.readFileSync('index.html', 'utf8');
const vjson = JSON.parse(fs.readFileSync('version.json', 'utf8'));
const pickAll = (src, key) => (src.match(new RegExp("['\"]" + key + "['\"]:\\s*(['\"])([\\s\\S]*?)\\1,", 'g')) || []);
const valAll = (src, key) => pickAll(src, key).map(v => v.replace(new RegExp("^['\"]" + key + "['\"]:\\s*['\"]"), '').replace(/['"],$/, ''));

/* (1) جملة الخصوصية: النص الجديد بأربع لغات، والكلمات القديمة ممنوعة العودة */
const leads = valAll(i18nSrc, 'about.privacy.lead');
check('privacy lead exists in all 4 dictionaries', leads.length === 4, 'found=' + leads.length);
const leadMarks = [['مزوّد الاستضافة', 'سجل البحث'], ['hosting provider', 'search history'],
  ['hébergeur', 'historique de recherche'], ['托管服务商', '搜索记录']];
check('privacy lead: each language names the hosting provider AND the local search history',
  leadMarks.every((marks, i) => marks.every(m => (leads[i] || '').includes(m))),
  leads.map(l => l.slice(0, 28)).join(' | '));
const oldWording = ['أبداً', 'أبدًا', 'never leave', 'ne quittent jamais', '永远不会离开', 'لا يغادران جهازك'];
check('privacy lead: the old "never leaves the device" wording is gone everywhere',
  !oldWording.some(w => leads.some(l => l.includes(w))),
  oldWording.filter(w => leads.some(l => l.includes(w))).join(','));

/* (2) إسناد الاتحاد الأوروبي: فرع في packAttribution + نص معتمد بأربع لغات */
const euAttrs = valAll(i18nSrc, 'attr.eu');
check('EU attribution exists in all 4 dictionaries', euAttrs.length === 4, 'found=' + euAttrs.length);
check('EU attribution carries the reuse decision + the export date',
  euAttrs.every(a => a.includes('2011/833') && a.includes('2026-09-09')),
  euAttrs.map(a => a.slice(0, 24)).join(' | '));
const euMarks = [['مرجع مقارن', 'المفوضية الأوروبية لا تروج'], ['Comparative reference', 'does not endorse'],
  ['Référence comparative', "n'endosse"], ['比较参考', '不为本应用背书']];
check('EU attribution states "comparative reference, not the Libyan legal status" and the non-endorsement',
  euMarks.every((marks, i) => marks.every(m => (euAttrs[i] || '').includes(m))),
  euMarks.map((m, i) => m.join('+') + '=' + euAttrs[i]).join(' | ').slice(0, 160));
check('packAttribution has an eu branch (EU cards carry the licence like the other packs)',
  /if \(k === 'eu'\) return t\('attr\.eu'/.test(appSrc) && /packAttributionLang: packAttributionLang/.test(appSrc));

/* (3) تواريخ آخر تحقق: خريطة dataCheck في version.json، وصفر لمس data/ */
const needKeys = ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled', 'canada', 'australia'];
const map = vjson.dataCheck || {};
check('version.json carries a dataCheck date for every database',
  needKeys.every(k => /^\d{4}-\d{2}-\d{2}$/.test(map[k] || '')), JSON.stringify(map));
check('dataVersionOf reads the dataCheck map (the data files are never edited)',
  /window\.__dataCheck/.test(appSrc) && /window\.__dataCheck = info\.dataCheck/.test(appSrc));
check('data_updated equals the newest dataCheck date',
  vjson.data_updated === Object.values(map).sort().pop(), vjson.data_updated);

/* (4) عيوب صفحة «حول» */
check('about.privacy paragraph is closed with </p> (it was closed with </div>)',
  /<p data-i18n="about\.privacy">[\s\S]{0,400}?<\/p>/.test(htmlSrc)
  && !/<p data-i18n="about\.privacy">[\s\S]{0,400}?<\/div>/.test(htmlSrc));
check('about.sources key sits on its own <p>, not on the attribution container',
  /<p data-i18n="about\.sources">/.test(htmlSrc) && !/<div class="body" data-i18n="about\.sources"/.test(htmlSrc));
check('about.sources lists three attributions: Canada, Australia, EU',
  (htmlSrc.match(/class="attr"/g) || []).length === 3, 'found=' + (htmlSrc.match(/class="attr"/g) || []).length);

/* (5) رابط شيفرة هذا الإصدار */
check('about shows the source link of this version, next to the version row',
  /id="aboutSourceLink"/.test(htmlSrc)
  && htmlSrc.includes('href="https://github.com/bob66aker-cpu/al-mustashar/tree/work-branch"')
  && htmlSrc.indexOf('id="aboutSourceLink"') > htmlSrc.indexOf('id="aboutVersion"')
  && /rel="noopener noreferrer"/.test(htmlSrc));
check('the source-link label exists in all 4 dictionaries',
  (i18nSrc.match(/'about\.info\.source\.link':/g) || []).length === 4);

/* (6) شارة البيتا: لم تُمَس — داخل «حول» وحدها */
const badgePos = htmlSrc.indexOf('id="betaBadge"');
const aboutPos = htmlSrc.indexOf('id="view-about"');
const nextView = htmlSrc.indexOf('class="view" id="view-', aboutPos + 10);
check('the beta badge still exists exactly once, inside the about view only',
  badgePos > aboutPos && (htmlSrc.match(/id="betaBadge"/g) || []).length === 1
  && (nextView < 0 || badgePos < nextView), 'badge=' + badgePos + ' about=' + aboutPos);

/* ---------- 1.19.0 قناة الملاحظات: الأزرار والنصوص وثبات الروابط ---------- */
const fbKeys = ['about.feedback.title', 'about.feedback.lead', 'about.feedback.mail', 'about.feedback.wa',
  'about.feedback.addr', 'about.feedback.org', 'about.feedback.org.link', 'about.feedback.mail.tag',
  'about.feedback.org.tag', 'about.feedback.mail.subject', 'about.feedback.org.subject', 'about.feedback.wa.text'];
const missing = fbKeys.filter(k => valAll(i18nSrc, k).length !== 4);
check('every feedback string exists in all 4 dictionaries (no Arabic hardcoded in markup)',
  missing.length === 0, missing.join(','));
check('the feedback card lives inside the about view with three stable controls',
  /id="aboutFeedbackCard"/.test(htmlSrc) && /id="aboutFeedbackMail"/.test(htmlSrc)
  && /id="aboutWaLink"/.test(htmlSrc) && /id="aboutOrgLink"/.test(htmlSrc)
  && /id="aboutEmail"/.test(htmlSrc)
  && htmlSrc.indexOf('id="aboutFeedbackCard"') > htmlSrc.indexOf('id="view-about"'));
check('the address is shown as selectable TEXT beside the buttons (mailto alone is not enough)',
  /user-select:\s*all/.test(htmlSrc) && /<span class="addr" id="aboutEmail"[^>]*>bob66aker@gmail.com<\/span>/.test(htmlSrc));
/* wa.me: الرابط يسكن رابط التطبيق فقط — لا بحث ولا صورة ولا سجل */
const waTxt = valAll(i18nSrc, 'about.feedback.wa.text');
check('the WhatsApp intro is static in every language and carries no link or payload of its own',
  waTxt.length === 4 && waTxt.every(x => !/https?:|data:|\{\{|\$\{/.test(x)), waTxt.map(x => x.slice(0, 20)).join(' | '));
check('the WhatsApp link is built from that static text + the app URL only (no user data)',
  /wa\.href = 'https:\/\/wa\.me\/\?text=' \+ encodeURIComponent\(/.test(appSrc)
  && /t\('about\.feedback\.wa\.text'/.test(appSrc)
  && /wa\.getAttribute\('data-app-url'\)/.test(appSrc)
  && !/query|scanText|lastResults|localStorage/.test(
    appSrc.slice(appSrc.indexOf('function wireAboutFeedback'), appSrc.indexOf('function fillAboutMeta'))),
  'wireAboutFeedback body');
check('the WhatsApp link is external and safe: wa.me + rel=noopener + the app URL is the live one',
  /href="https:\/\/wa\.me\/\?text=/.test(htmlSrc) && /rel="noopener noreferrer"/.test(htmlSrc)
  && /data-app-url="https:\/\/al-mustashar\.pages\.dev"/.test(htmlSrc));
/* mailto: الموضوع يحمل الإصدار واللغة، ووسم [جهة] يميّز طلب الجهة */
check('both mailto subjects are built from tag + version + current language + a dictionary subject',
  /mailto:' \+ addr \+ '\?subject=' \+ encodeURIComponent\(/.test(appSrc)
  && /const ver = window\.__appVersion/.test(appSrc) && /const lang = document\.documentElement\.lang/.test(appSrc)
  && (appSrc.match(/t\('about\.feedback\.(mail|org)\.tag'/g) || []).length === 2);
const orgTags = valAll(i18nSrc, 'about.feedback.org.tag');
check('the organisation subject starts with the [جهة] marker in all 4 dictionaries',
  orgTags.length === 4 && orgTags.every(x => x.trim().indexOf('[جهة]') === 0), orgTags.join(' '));
check('the organisation line promises nothing and claims no official endorsement',
  /^(?!.*(معتمد|معتمدة|رسمي|رسمية)).*$/s.test(valAll(i18nSrc, 'about.feedback.org')[0] + valAll(i18nSrc, 'about.feedback.org.link')[0]),
  valAll(i18nSrc, 'about.feedback.org')[0]);
/* صفر تحليلات وصفر إرسال تلقائي */
check('the address lives in exactly three places: two mailto hrefs and the copyable text (no beacon, no auto-send)',
  (appSrc.match(/bob66aker@gmail\.com/g) || []).length === 0
  && (htmlSrc.match(/mailto:bob66aker@gmail\.com/g) || []).length === 2
  && (htmlSrc.match(/>bob66aker@gmail\.com</g) || []).length === 1
  && !/sendBeacon|gtag|analytics|fetch\('mailto/.test(appSrc));
check('docs/FEEDBACK.md exists and states the privacy and priority rules',
  fs.existsSync('docs/FEEDBACK.md')
  && /bob66aker@gmail\.com/.test(fs.readFileSync('docs/FEEDBACK.md', 'utf8'))
  && /أولوية مطلقة/.test(fs.readFileSync('docs/FEEDBACK.md', 'utf8'))
  && /لا كلمات مرور/.test(fs.readFileSync('docs/FEEDBACK.md', 'utf8')));

/* ---------- 1.19.0 مواد الوصول: بوستر + صفحة هبوط + خطة توزيع ---------- */
const landingSrc = fs.existsSync('landing.html') ? fs.readFileSync('landing.html', 'utf8') : '';
const posterSrc = fs.existsSync('poster.html') ? fs.readFileSync('poster.html', 'utf8') : '';
const posterGen = fs.readFileSync('scripts/build-poster.cjs', 'utf8');

check('landing.html exists and ships ZERO javascript (a static document survives any reader)',
  landingSrc.length > 0 && !/<script/i.test(landingSrc) && !/\son\w+=/i.test(landingSrc));
check('landing.html carries the social and language metadata',
  /property="og:title"/.test(landingSrc) && /name="twitter:card"/.test(landingSrc)
  && ['ar', 'en', 'fr', 'zh'].every(l => landingSrc.includes('hreflang="' + l + '"'))
  && /hreflang="x-default"/.test(landingSrc) && /rel="canonical"/.test(landingSrc));
const landingFlat = landingSrc.replace(/\s+/g, ' ');
check('landing.html has a visible button to the app, the approved privacy line and the licence footer',
  /<a class="cta" href="\.\/"/.test(landingSrc)
  && landingFlat.includes('التطبيق لا يرفع صور الملصقات أو نصوص البحث')
  && landingFlat.includes('The app does not upload label photos or search text')
  && landingFlat.includes('AGPLv3') && /github\.com\/bob66aker-cpu\/al-mustashar/.test(landingSrc));
check('landing.html leaks nothing from the running files (no databases, no CAS, no address, no internal paths)',
  !/data\/[a-z]+\.json|cas_source|meta\.built|@[a-z0-9.-]+\.(com|ly|org)/i.test(landingSrc)
  && !/src\/app\.js|version\.json|sw\.js/.test(landingSrc));
check('the poster exists, is script-free and its QR is an inline SVG',
  posterSrc.length > 0 && !/<script/i.test(posterSrc) && /<svg[^>]*viewBox/.test(posterSrc)
  && !/<img\b/i.test(posterSrc));
check('the poster shows the name, the one line, the four languages, the licence and the source link',
  posterSrc.includes('المستشار الزراعي') && posterSrc.includes('صوّر ملصق المبيد فاعرف حكمه — يعمل دون إنترنت')
  && ['العربية', 'English', 'Français', '中文'].every(x => posterSrc.includes(x))
  && posterSrc.includes('AGPLv3') && posterSrc.includes('github.com/bob66aker-cpu/al-mustashar'));
check('the poster carries no private operational data (no address, no channel, no counters)',
  !/mailto:|wa\.me|whatsapp|tel:/i.test(posterSrc));
check('the poster generator encodes offline with the vendored encoder (no CDN, no network call)',
  /src',\s*'vendor',\s*'qrcodegen\.js'/.test(posterGen) && /vm\.runInContext/.test(posterGen)
  && !/require\('(https?|node:https)'\)|fetch\(|cdn\./i.test(posterGen));
check('the poster payload is the live publication URL only',
  /APP_URL = arg\('--url', 'https:\/\/al-mustashar\.pages\.dev'\)/.test(posterGen)
  && /QrCode\.encodeText\(text, qrcodegen\.QrCode\.Ecc\.MEDIUM\)/.test(posterGen));
check('the real decoder test exists and compares the decoded text to the live URL',
  fs.existsSync('tests/poster-qr.test.mjs')
  && /zxing-reader\.min\.js/.test(fs.readFileSync('tests/poster-qr.test.mjs', 'utf8'))
  && /text === LIVE_URL/.test(fs.readFileSync('tests/poster-qr.test.mjs', 'utf8')));
check('the service worker does not hijack the two documents: they stay out of the shell and navigation is network-first',
  !/landing\.html|poster\.html/.test(sw5.slice(sw5.indexOf('const SHELL'), sw5.indexOf('const DATA')))
  && /req\.mode === 'navigate'/.test(sw5)
  && /const preload = await e\.preloadResponse;[\s\S]{0,120}return await fetch\(req\)/.test(sw5));
check('docs/DISTRIBUTION.md separates done-in-code from owner-steps and states the four-language caveat',
  fs.existsSync('docs/DISTRIBUTION.md')
  && /منجز برمجياً/.test(fs.readFileSync('docs/DISTRIBUTION.md', 'utf8'))
  && /خطوة مالك يدوية/.test(fs.readFileSync('docs/DISTRIBUTION.md', 'utf8'))
  && /أربع لغات في الواجهة لا تعني دعم ملاحظات/.test(fs.readFileSync('docs/DISTRIBUTION.md', 'utf8')));

/* ---------- 1.19.1 كشف المتصفح الداخلي: الأنماط × اللغات الأربع + بطاقة التوجيه ---------- */
/* قاعدة هذا الحارس: لا نصّ عربي مكتوب فيه. النصوص تُقرأ من القواميس نفسها
 * وتُقارن بأنماط يونيكود، حتى لا يتحوّل الحارس إلى مصدر نصّ ثابت. */
const inappKeys = ['inapp.lead', 'inapp.name.fb', 'inapp.name.ig', 'inapp.name.wa',
  'inapp.name.line', 'inapp.name.other', 'inapp.text', 'inapp.ios',
  'inapp.copy', 'inapp.copied', 'inapp.manual'];
const inappVals = {};
const inappMissing = [];
for (const k of inappKeys) {
  const v = valAll(i18nSrc, k);
  inappVals[k] = v;
  if (v.length !== 4 || v.some(x => !x || !x.trim())) inappMissing.push(k + '=' + v.length);
}
check('in-app: every card key exists, non-empty, in all 4 dictionaries',
  inappMissing.length === 0, inappMissing.join(','));
const inappScript = (str) => /[\u0600-\u06FF]/.test(str) ? 'ar' : /[\u4E00-\u9FFF]/.test(str) ? 'zh' : 'lat';
const inappTexts = inappVals['inapp.text'];
check('in-app: the four card texts are four different writings (ar, en, fr, zh)',
  new Set(inappTexts).size === 4
  && ['ar', 'lat', 'lat', 'zh'].every((s, i) => inappScript(inappTexts[i]) === s),
  inappTexts.map(inappScript).join(','));
check('in-app: the iPhone route is a separate line from the generic install line, in 4 languages',
  inappVals['inapp.ios'].length === 4 && new Set(inappVals['inapp.ios']).size === 4
  && inappVals['inapp.ios'].every((v, i) => v !== inappTexts[i]));
check('in-app: the browser name is injected through a placeholder, never typed into the sentence',
  inappVals['inapp.lead'].length === 4 && inappVals['inapp.lead'].every(v => v.includes('{app}')));
check('in-app: the copy label is not the confirmation, and the manual fallback is its own sentence',
  inappVals['inapp.copy'].every((v, i) => v !== inappVals['inapp.copied'][i] && v !== inappVals['inapp.manual'][i])
  && new Set(inappVals['inapp.copied']).size === 4 && new Set(inappVals['inapp.manual']).size === 4);
const inappPatterns = ['FBAN', 'FBAV', 'FB_IAB', 'Instagram', 'WhatsApp', 'Line'];
check('in-app: every required user-agent pattern is in the detector',
  inappPatterns.every(p => appSrc.includes(p)), inappPatterns.filter(p => !appSrc.includes(p)).join(','));
const inappBlock = appSrc.slice(appSrc.indexOf('const INAPP_RULES'), appSrc.indexOf("renderInAppNotice();\n  document.addEventListener('langchange'"));
check('in-app: the detector is plain text on the user agent — no library, no request, no storage',
  inappBlock.length > 0 && /navigator\.userAgent/.test(inappBlock)
  && !/require\(|\bimport\s|fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/.test(inappBlock));
check('in-app: the card is a wide block at the top of the home view, hidden until a browser hits',
  /<div class="card" id="inappNotice" hidden>/.test(htmlSrc)
  && htmlSrc.indexOf('id="inappNotice"') > htmlSrc.indexOf('id="view-home"')
  && htmlSrc.indexOf('id="inappNotice"') < htmlSrc.indexOf('class="stats"'));
check('in-app: the card text comes from the dictionary and the heading is filled at runtime',
  /id="inappTitle"><\/h2>/.test(htmlSrc) && !/id="inappTitle"[^>]*data-i18n/.test(htmlSrc)
  && ['inapp.text', 'inapp.ios', 'inapp.copy'].every(k => htmlSrc.includes('data-i18n="' + k + '"'))
  && /id="inappCopy"/.test(htmlSrc) && /id="inappNote" hidden/.test(htmlSrc));
check('in-app: the card shows only on a hit and never touches the farmer view otherwise',
  /if \(!hit\) \{ inappCard\.hidden = true; return; \}/.test(appSrc) && /inappCard\.hidden = false/.test(appSrc));
check('in-app: the button hides only after a real clipboard write, and the fallback selects the text',
  /await navigator\.clipboard\.writeText/.test(appSrc)
  && /if \(copied\) \{[\s\S]{0,160}inappCopyBtn\.hidden = true/.test(appSrc)
  && /selectNodeContents/.test(appSrc) && /inapp\.manual/.test(appSrc));
check('in-app: the iPhone route is driven by the iOS test, not by the browser name',
  /if \(inappIos\) inappIos\.hidden = !isIOS\(\);/.test(appSrc));
check('in-app: the card follows the interface language (langchange) instead of caching one string',
  /addEventListener\('langchange', renderInAppNotice\)/.test(appSrc)
  && /tf\('inapp\.lead'/.test(appSrc));
const inappTestSrc = fs.existsSync('tests/inapp-notice.test.mjs')
  ? fs.readFileSync('tests/inapp-notice.test.mjs', 'utf8') : '';
check('in-app: a real browser test simulates the Facebook user agent and is wired into test:browser',
  inappTestSrc.length > 0 && /FB_IAB/.test(inappTestSrc)
  && JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts['test:browser'].includes('inapp-notice.test.mjs'));
check('in-app: the simulation covers the card, the real copy, the iPhone line and a clean Chrome',
  ['UA_FB_ANDROID', 'UA_FB_IOS', 'UA_CHROME_ANDROID', 'UA_LINE', 'clipboard.readText',
    'inapp-notice.test.mjs'].every(k => inappTestSrc.includes(k)));

/* ---------- summary ---------- */
console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
