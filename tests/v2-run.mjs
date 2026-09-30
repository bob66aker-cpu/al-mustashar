/* V2 browser E2E runner — real Chromium via puppeteer-core (background-safe).
 * CHROME and BASE_URL are honored so the runner can also point at a deployed
 * instance (same convention as tests/probe-ocr-blank.mjs). */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
/* optional case window ?from=N&to=M (short CI chunks) */
const WINDOW = (process.env.CASE_FROM || process.env.CASE_TO)
  ? '?' + new URLSearchParams({ from: process.env.CASE_FROM || '1', to: process.env.CASE_TO || '99' }).toString()
  : '';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--lang=ar']
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
page.on('pageerror', e => console.error('PAGE-ERROR:', e.message));
page.on('console', m => {
  const t = m.text();
  if (t.startsWith('[case]') || /PAGE-ERROR|FAIL/.test(t)) console.log(t.slice(0, 300));
});
/* Cloudflare Pages serves "pretty URLs": a request for a .html path answers
 * 308 to the extension-less path. Chasing that redirect lands on the SPA
 * fallback (index.html), which loads the app globals but NOT the suite, so
 * window.__run stays undefined and the run would abort for a reason that has
 * nothing to do with the code under test. Both spellings are therefore
 * probed and the first one that really exposes the suite is used. */
const SUITE_PATHS = ['/tests/v2-suite', '/tests/v2-suite.html'];

/* The suite ships its driver as an INLINE <script>, and the deployed CSP is
 * script-src 'self' 'wasm-unsafe-eval' with no 'unsafe-inline'. On the real
 * Pages deployment that block is therefore REFUSED — which is the correct and
 * intended outcome, not a defect: index.html contains zero inline scripts
 * (verified by grep), so the farmer app is unaffected, and the refusal is
 * itself fresh proof that the header is enforced by the real edge rather than
 * only by our local injection. To still run the assertions against the
 * deployed build, the runner re-delivers the suite's own code over the
 * debugger channel (Runtime.evaluate), which CSP does not govern. The code is
 * fetched from the host under test, not from the local disk, and not one
 * assertion is altered. */
/* Both spellings are tried: Pages answers the extension-less one, a plain
 * static preview server answers the .html one. */
let suiteHtml = '';
for (const p of SUITE_PATHS) {
  const r = await fetch(BASE + p).catch(() => null);
  if (r && r.ok) { suiteHtml = await r.text(); console.log('[runner] driver source: ' + p); break; }
}
const inlineBlocks = [...suiteHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1]).filter(code => code.includes('__run'));
const inlineCode = inlineBlocks.length ? inlineBlocks[inlineBlocks.length - 1] : '';
if (!inlineCode) {
  console.error('[runner] could not find the suite driver under ' + BASE + SUITE_PATHS.join(' or '));
  await browser.close();
  process.exit(1);
}
console.log('[runner] suite driver recovered over HTTP: ' + inlineCode.length + ' bytes');

let suitePath = null;
for (const p of SUITE_PATHS) {
  console.log('[runner] goto', BASE + p + WINDOW);
  const resp = await page.goto(BASE + p + WINDOW, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const isSuite = await page.evaluate(() =>
    document.title === 'OCR V2 functional suite' && !!document.getElementById('out')
  ).catch(() => false);
  if (!isSuite) {
    console.log('[runner] ' + p + ' answered HTTP ' + (resp && resp.status()) +
                ' but is NOT the suite document — skipping');
    continue;
  }
  let ready = await page.evaluate(() => typeof window.__run === 'function').catch(() => false);
  if (!ready) {
    await page.evaluate(inlineCode);
    ready = await page.evaluate(() => typeof window.__run === 'function').catch(() => false);
    console.log('[runner] inline driver re-delivered into the suite page: __run=' + ready);
  }
  if (ready) { suitePath = p; console.log('[runner] suite exposed at', p); break; }
  console.log('[runner] suite page at ' + p + ' refused the driver — trying the next spelling');
}
if (!suitePath) {
  console.error('[runner] the E2E suite never exposed window.__run at ' + BASE);
  await browser.close();
  process.exit(1);
}
const globals = await page.evaluate(() => ({
  SearchCore: typeof window.SearchCore,
  Tesseract: typeof window.Tesseract,
  OcrModule: typeof window.OcrModule
}));
console.log('[runner] globals:', JSON.stringify(globals));
await page.evaluate(() => { window.__run(); });
console.log('[runner] suite started');
try {
  await page.waitForFunction('window.__results', { timeout: 600000, polling: 5000 });
} catch (e) {
  const lines = await page.$$eval('#out div', els => els.map(e => e.textContent)).catch(() => []);
  console.log('[runner] TIMEOUT after 600s. Completed cases:\n' + lines.join('\n'));
  await browser.close();
  process.exit(1);
}
const results = await page.evaluate('window.__results');
console.log('=== V2 FUNCTIONAL SUITE (real browser, real Tesseract, real 4-DB search) ===');
for (const r of results.results) console.log((r.ok ? ' PASS ' : ' FAIL ') + r.name + (r.detail ? ' — ' + r.detail : ''));
console.log('TOTAL: PASS ' + results.pass + ' / FAIL ' + results.fail);
fs.writeFileSync('/tmp/e2e/v2-results.json', JSON.stringify(results, null, 2));
await browser.close();
process.exit(results.fail ? 1 : 0);
