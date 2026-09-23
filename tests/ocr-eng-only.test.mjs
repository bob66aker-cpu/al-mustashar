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
 * The vendored ara.traineddata.gz FILE itself must remain in the repo
 * (removal is runtime-only; the asset stays for any future explicit need).
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

/* engine init language */
check('ocr.js initializes the worker with eng only (no eng+ara)',
  /createWorker\(\s*'eng'/.test(ocr) && !/createWorker\(\s*'eng\+ara'/.test(ocr));
check('ocr.js prefetch list has no ara.traineddata.gz',
  !/OCR\.LANG \+ '\/ara\.traineddata\.gz'/.test(ocr));

/* prep panel */
check('app.js prep list has no ara.traineddata.gz',
  !/'vendor\/tesseract\/lang\/ara\.traineddata\.gz'/.test(app));

/* service worker */
check('sw.js OCR_ASSETS has no ara.traineddata.gz',
  !/\.\/vendor\/tesseract\/lang\/ara\.traineddata\.gz/.test(sw));
check('sw.js isOcrUrl matcher accepts eng only (no ara alternation)',
  /lang\\\/eng\\\.traineddata/.test(sw) && !/\(eng\|ara\)/.test(sw));
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
