/* OCR speed diagnostics runner (أ2) — real Chromium via puppeteer-core.
 * Drives tests/ocr-diag-suite.html with the fixture file list injected,
 * collects window.__results (per-attempt gate evidence per image), and
 * writes /tmp/ocr-diag.json for docs/ocr-speed-diagnosis.md.
 * Usage: node tests/ocr-diag-run.mjs [from] [to]
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

const FROM = parseInt(process.argv[2] || '1', 10);
const TO = parseInt(process.argv[3] || '99', 10);

const fixturesDir = path.resolve('tests/fixtures/labels');
const fixtures = fs.existsSync(fixturesDir)
  ? fs.readdirSync(fixturesDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort()
  : [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('console', m => { const t = m.text(); if (t.startsWith('[diag]') || t.includes('FAIL')) console.log(t); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));

  /* inject the fixture list BEFORE any page script runs */
  await page.evaluateOnNewDocument(list => { window.__FIXTURES = list; }, fixtures);

  await page.goto(BASE + '/tests/ocr-diag-suite.html?from=' + FROM + '&to=' + TO, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const t0 = Date.now();
  /* __run is NOT awaited here: a long fixture batch exceeds the CDP
   * protocol timeout (~180s). The page appends results as it goes; the
   * runner polls for completion via window.__results.done. */
  page.evaluate(() => window.__run()).catch(() => {});
  await page.waitForFunction(() => window.__results && window.__results.done === true, { timeout: 500000, polling: 3000 })
    .catch(() => { console.log('[runner] waitForFunction timeout — collecting partial results'); });
  const results = await page.evaluate(() => window.__results);
  results.done = true;   // local marker: this process completed its window
  console.log(`[runner] done in ${Math.round((Date.now() - t0) / 1000)}s — PASS:${results.pass} FAIL:${results.fail}`);

  fs.mkdirSync('/tmp', { recursive: true });
  fs.writeFileSync('/tmp/ocr-diag.json', JSON.stringify(results, null, 1));
  console.log('[runner] wrote /tmp/ocr-diag.json (' + Object.keys(results.runs || {}).length + ' image runs)');
  if (results.fail > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
