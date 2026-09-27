/*
 * tests/ocr-eng-only.test.mjs — OCR language guard (2026-09-23).
 *
 * Round: Arabic-hallucination fix (docs/ocr-arabic-hallucination-diagnosis.md).
 * The engine must initialize with 'eng' ONLY: loading 'ara' alongside eng
 * made the classifier fall back to Arabic glyphs on foreign-label photos
 * (barcode stripes → Arabic-Indic digits, inverted passes → mixed Arabic).
 * This guard fails if 'ara' ever returns to the runtime OCR path:
 *   - src/ocr.js  : createWorker langs + prefetch asset list
 *   - src/app.js  : prep-panel asset list
 *   - sw.js       : OCR_ASSETS + isOcrUrl matcher + cache bumped (v13+)
 * Stage 3.4 (2026-09-27) UPDATE: ara returned to the runtime set as an
 * ON-DEMAND ADDITION — the engine initializes 'ara+eng' when the UI
 * language is Arabic (measured: hallucination 3.5→0.75 on the 17-label
 * baseline, docs/ocr-baseline.md §lang). The ORIGINAL invariant is kept
 * and now asserted twice as hard:
 *   1) 'eng' ALONE remains the DEFAULT (no hard-coded ara/eng+ara init).
 *   2) ara is loaded ONLY via the uiLang==='ar' ternary in app-facing code.
 * The vendored ara.traineddata.gz FILE must remain in the repo and is now
 * ALSO prefetched/cached (SW OCR_ASSETS + isOcrUrl) for the Arabic UI.
 * Also verifies the diagnosis document exists with the raw pre-fix evidence.
 * Run: node tests/ocr-eng-only.test.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const ocr = readFileSync(join(root, 'src/ocr.js'), 'utf8');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');

/* engine init language — 3.4: the DEFAULT worker language is eng; ara can
 * only enter through the uiLang ternary ('ara+eng' for Arabic UI). */
check('ocr.js DEFAULT worker language is eng (no hard-coded ara / eng+ara init)',
  /const lang = lang2 \|\| 'eng';/.test(ocr)
  && !/createWorker\(\s*['"]ara/.test(ocr) && !/createWorker\(\s*['"]eng\+ara['"]/.test(ocr));
check('ocr.js ara enters ONLY via the Arabic-UI ternary (ara+eng for ar, eng otherwise)',
  /opts\.uiLang === 'ar'\) \? 'ara\+eng' : 'eng'/.test(ocr));
/* 3.4: ara may appear in the SW/prefetch sets (on-demand asset); the app's
 * runtime engine choice is guarded above. */

/* prep panel — 3.4: ara path appears ONLY inside the Arabic-UI branch of the
 * prep measurement (never as an unconditional default asset list). */
check('app.js prep list mentions ara ONLY in the ar-only concat branch (never as a default)',
  (app.match(/'vendor\/tesseract\/lang\/ara\.traineddata\.gz'/g) || []).length === 1
  && /document\.documentElement\.lang === 'ar'\)\s*\?\s*OCR_ASSET_PATHS\.concat\(\['vendor\/tesseract\/lang\/ara\.traineddata\.gz'\]\)/.test(app));

/* service worker */
check('sw.js OCR_ASSETS now carries ara (on-demand 3.4) next to eng — both cached, neither default',
  /'\.\/vendor\/tesseract\/lang\/eng\.traineddata\.gz'/.test(sw)
  && /'\.\/vendor\/tesseract\/lang\/ara\.traineddata\.gz'/.test(sw));
check('sw.js isOcrUrl matcher accepts both lang files (eng|ara) + zxing wasm',
  /lang\\\/\(eng\|ara\)\\\.traineddata/.test(sw) && /zxing_reader\\\.wasm/.test(sw));
const cache = sw.match(/const CACHE = 'mustashar-v(\d+)';/);
check('sw.js cache version bumped with this round (>= v13)',
  cache && Number(cache[1]) >= 13, cache ? 'v' + cache[1] : 'not found');

/* the vendored asset file stays in the repo (runtime-only removal) */
check('vendor ara.traineddata.gz file remains in the repo',
  existsSync(join(root, 'vendor/tesseract/lang/ara.traineddata.gz')));

/* diagnosis document: exists, records raw pre-fix evidence and the verdict */
{
  const doc = join(root, 'docs/ocr-arabic-hallucination-diagnosis.md');
  check('diagnosis document exists', existsSync(doc));
  if (existsSync(doc)) {
    const d = readFileSync(doc, 'utf8');
    check('diagnosis records the label-case Arabic count before the fix (28)',
      d.includes('"arabicCount":28'));
    check('diagnosis records raw probe outputs for all three required cases',
      ['"case":"blank"', '"case":"noise"', '"case":"logo"'].every(s => d.includes(s)));
    check('diagnosis states the verdict (hypothesis confirmed)',
      d.includes('مؤكدة'));
  }
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
console.log('==============================');
process.exit(fail ? 1 : 0);
