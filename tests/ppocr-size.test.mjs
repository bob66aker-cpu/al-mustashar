/*
 * tests/ppocr-size.test.mjs — the optional package must cost the farmer
 * --------------------------------------------------------------------
 * nothing. Not one byte, not one request, not one cache entry.
 *
 * "Default preparation" is measured here as the FOUR sets a farmer actually
 * prepares, all taken from the shipped code, not from a comment:
 *   SHELL      sw.js      — precached on install
 *   DATA       sw.js      — the four databases + alerts
 *   OCR_ASSETS sw.js      — written on first OCR use / the prep button
 *   PREFETCH   src/ocr.js — OcrModule.prefetch()'s own list
 *
 * The comparison is BEFORE vs AFTER: the same four lists are read out of the
 * phase's baseline commit (af61f4f, the last deposit of phase 3) and out of
 * the working tree, and every listed file is measured on disk. The optional
 * PP-OCRv5 package must move neither the list nor the byte total.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE_COMMIT = process.env.PPOCR_BASE || 'af61f4f';

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log('PASS ' + label + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); }
};

const read = rel => readFileSync(rel, 'utf8');
const at = (commit, rel) => execFileSync('git', ['show', commit + ':' + rel], { encoding: 'utf8', maxBuffer: 8 << 20 });

/* pulls a JS array literal out of a source file: const NAME = [ ... ]; */
function listOf(src, name) {
  const i = src.indexOf(name);
  if (i < 0) return null;
  const open = src.indexOf('[', i);
  let depth = 0, end = -1;
  for (let k = open; k < src.length; k++) {
    const ch = src[k];
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (!depth) { end = k; break; } }
  }
  if (end < 0) return null;
  /* keep only real quoted PATHS: the sources also contain comments and
   * fragments of concatenations (OCR.CORE + '/file'), which are not entries */
  return [...src.slice(open + 1, end).matchAll(/'([^']+)'/g)]
    .map(m => m[1])
    .filter(p => !/\s/.test(p) && !p.startsWith('/'));
}

/* raw text of a const array block, comments included — the only honest way
 * to compare a list that is assembled with concatenations */
function blockOf(src, name) {
  const i = src.indexOf(name);
  if (i < 0) return null;
  const open = src.indexOf('[', i);
  let depth = 0, end = -1;
  for (let k = open; k < src.length; k++) {
    const ch = src[k];
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (!depth) { end = k; break; } }
  }
  return end < 0 ? null : src.slice(open, end + 1);
}

const prep = (rootFiles) => {
  const sw = rootFiles.sw, ocr = rootFiles.ocr;
  return {
    SHELL: listOf(sw, 'const SHELL') || [],
    DATA: listOf(sw, 'const DATA') || [],
    OCR_ASSETS: listOf(sw, 'const OCR_ASSETS') || []
  };
};

/* './' is index.html, which SHELL already counts — never count it twice */
const onDisk = p => (p === './' ? 0 : (existsSync(p) ? statSync(p).size : -1));
const norm = p => p.replace(/^\.\//, '');

const now = { sw: read('sw.js'), ocr: read('src/ocr.js'), html: read('index.html') };
const before = { sw: at(BASE_COMMIT, 'sw.js'), ocr: at(BASE_COMMIT, 'src/ocr.js'), html: at(BASE_COMMIT, 'index.html') };

const setsNow = prep(now), setsBefore = prep(before);

for (const key of Object.keys(setsNow)) {
  ok(!!setsBefore[key] && setsNow[key].length === setsBefore[key].length,
    key + ' list is unchanged since ' + BASE_COMMIT,
    (setsBefore[key] || []).length + ' → ' + setsNow[key].length);
}

const total = sets => Object.values(sets).flat().reduce((a, p) => a + Math.max(0, onDisk(norm(p))), 0);
const missing = sets => Object.values(sets).flat().filter(p => p !== './' && !existsSync(norm(p)));

const prefetchNow = blockOf(now.ocr, 'const ocrAssets = [');
const prefetchBefore = blockOf(before.ocr, 'const ocrAssets = [');
ok(!!prefetchNow && prefetchNow === prefetchBefore,
  'OcrModule.prefetch() prepares the same list as ' + BASE_COMMIT,
  prefetchNow ? prefetchNow.length + ' chars, identical' : 'block not found');

const totalNow = total(setsNow), totalBefore = total(setsBefore);
ok(missing(setsNow).length === 0, 'every default-prepared file exists on disk',
  missing(setsNow).join(', ') || 'all present');
ok(totalNow === totalBefore, 'default preparation size is byte-for-byte unchanged',
  totalBefore + ' → ' + totalNow + ' bytes' + (totalNow === totalBefore ? '' : ' (Δ' + (totalNow - totalBefore) + ')'));

/* the package itself must be invisible to every default surface */
const html = now.html;
/* comments are allowed to NAME the package (that is how the next engineer
 * learns it exists); CODE may not touch it */
const codeOnly = src => src.split('\n')
  .filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l))
  .join('\n');
ok(!/ppocr|paddle/i.test(codeOnly(html)), 'index.html code never mentions the optional package');
ok(!/ppocr|paddle/i.test(codeOnly(now.sw)), 'the service worker code never mentions the optional package',
  'only the release note names it');
const prepPaths = Object.values(setsNow).flat().join(' ');
ok(!/ppocr|paddle/i.test(prepPaths), 'no optional-package path is in any prepared list');
ok(!existsSync('vendor/ppocr') && !existsSync('vendor/paddle'), 'no optional package bytes are vendored into the repo');
/* comments are allowed to NAME the package; CODE may not touch it */
const ocrCode = now.ocr.split('\n')
  .filter(l => !/^\s*(\*|\/\/|\/\*)/.test(l))                 /* comments */
  .filter(l => !/^\s*ppocr:\s*(true|false)\s*,?\s*$/.test(l))            /* the flag itself */
  .join('\n');
ok(!/ppocr|PpOcr|paddle/i.test(ocrCode), 'the OCR module neither imports nor fetches the package',
  'code mentions it nowhere; only the boolean flag and the note that documents it');

/* what the package WOULD cost, from its own pinned manifest */
const pp = read('src/ppocr.js');
const urlRe = /url:\s*'([^']+)'[\s\S]*?bytes:\s*(\d+)[\s\S]*?(?:sha256:\s*'([0-9a-f]{64})'|sha256:\s*null)/g;
const assets = [...pp.matchAll(urlRe)].map(m => ({ url: m[1], bytes: +m[2], sha256: m[3] || null }));
ok(assets.length >= 4, 'the manifest lists the optional assets with measured sizes', assets.length + ' assets');
ok(assets.every(a => /^https:\/\//.test(a.url)), 'every optional asset is a pinned https URL');
ok(assets.filter(a => a.sha256).length === 3, 'the three gated assets carry a sha256',
  assets.filter(a => a.sha256).length + ' hashed');
ok(assets.filter(a => !a.sha256).every(a => /gated: false/.test(pp.split(a.url)[1].slice(0, 200))),
  'an ungated asset says so in the manifest');
const gated = assets.filter(a => a.sha256).reduce((x, a) => x + a.bytes, 0);
const ungated = assets.filter(a => !a.sha256).reduce((x, a) => x + a.bytes, 0);
console.log('OPTIONAL PACKAGE  gated=' + gated + ' B  ungated=' + ungated + ' B  total=' + (gated + ungated) + ' B');
console.log('DEFAULT PREPARATION (unchanged) = ' + totalNow + ' B across ' +
  Object.values(setsNow).flat().filter(p => p !== './').length + ' files');

console.log('\nPPOCR-SIZE: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
