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
console.log('[runner] goto', BASE + '/tests/v2-suite.html');
await page.goto(BASE + '/tests/v2-suite.html' + WINDOW, { waitUntil: 'domcontentloaded', timeout: 30000 });
console.log('[runner] page loaded');
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
