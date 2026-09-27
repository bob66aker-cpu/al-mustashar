/*
 * tests/barcode-chip-isolation.test.mjs — user decision 2026-09-27 (2):
 * the barcode chip is a HINT LAYER, never a verdict channel. Guards:
 *   1) every dictionary's scan.barcode.found explicitly denies product
 *      identity / result status (no auto-linking language),
 *   2) the chip lives OUTSIDE #scanResults and nothing in it is rendered
 *      into results containers,
 *   3) app.js has no call path from showBarcodeChip into search/render
 *      functions (source-level isolation),
 *   4) app renders the chip via textContent only (no innerHTML = no
 *      injected markup that could look like a result card),
 *   5) GS1 AI (01) — the GTIN/product-identity application identifier — is
 *      labelled with the format prefix only, never resolved to a rule.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');

/* 1 — the four dictionaries must carry an explicit denial */
{
  const found = i18n.match(/'scan\.barcode\.found':\s*'([^']+)'/g) || [];
  check('scan.barcode.found exists in all 4 dictionaries', found.length === 4,
    'found=' + found.length);
  const deny = /ليس هوية منتج|not a product identity|ni identité de produit|并非产品身份/;
  const autoLink = /هوية المنتج|product is|يطابق منتج|matches a product|registered|مسجل باسم/;
  const texts = found.map(m => m.match(/'([^']*)'$/)[1]);
  check('all 4 texts explicitly deny product identity / result status',
    texts.every(t => deny.test(t)), JSON.stringify(texts));
  check('no auto-linking language in any dictionary text',
    texts.every(t => !autoLink.test(t)), JSON.stringify(texts.filter(t => autoLink.test(t))));
}

/* 2 — structural isolation: chip markup outside every results container */
{
  const chip = html.indexOf('id="barcodeChip"');
  const results = ['id="scanResults"', 'id="historyList"', 'id="results"']
    .map(id => ({ id, at: html.indexOf(id) }))
    .filter(x => x.at > -1);
  check('chip exists in index.html', chip > -1);
  check('chip markup sits outside all results containers',
    results.every(r => r.at === -1 || chip < r.at || htmlLastClose(html, r.id) < chip),
    JSON.stringify(results));
}
function htmlLastClose(src, id) {
  const open = src.indexOf(id);
  const close = src.indexOf('</section>', open) === -1 ? src.length
    : src.indexOf('</section>', open);
  return close;
}

/* 3 — no call path from the chip into search/render verdict functions */
{
  const m = app.match(/function showBarcodeChip[\s\S]*?\n  \}/);
  check('showBarcodeChip found in app.js', !!m);
  const body = m ? m[0] : '';
  const forbidden = /\b(searchNow|renderResults|renderCard|runSearch|doSearch|performSearch|showResults|displayResults)\s*\(/;
  check('showBarcodeChip never calls search/verdict renderers', !forbidden.test(body),
    (body.match(forbidden) || []).join(','));
  check('showBarcodeChip renders text only (textContent, no innerHTML)',
    /textContent/.test(body) && !/innerHTML/.test(body));
  check('chip metadata uses the denial i18n key',
    /scan\.barcode\.found/.test(body));
}

/* 4 — GS1 GTIN is labelled as a code, never resolved */
{
  const bc = readFileSync(join(root, 'src/barcode.js'), 'utf8');
  const gs1 = bc.match(/gs1Parse[\s\S]{0,600}/);
  check('barcode.js keeps GS1 parse presentational (AI labels only)',
    !!gs1 && !/search|match|rule|verdict/i.test(gs1[0].replace(/\/\*[\s\S]*?\*\//g, ' ')));
  check('barcode.js exposes no search/verdict API',
    !/searchNow|renderResults|verdict/i.test(bc.replace(/\/\*[\s\S]*?\*\//g, ' ')));
}

/* 5 — the hide timer + clear button keep the chip transient (no persistence) */
{
  check('chip auto-hides (transient hint, not stored anywhere)',
    /setTimeout\(hideBarcodeChip,\s*12000\)/.test(app)
    && !/localStorage|sessionStorage|indexedDB/.test(
      app.match(/function showBarcodeChip[\s\S]*?\n  \}/)[0]));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
