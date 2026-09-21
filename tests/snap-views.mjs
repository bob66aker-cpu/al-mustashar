/*
 * tests/snap-views.mjs — UI round screenshots for user review (not a test).
 * Captures the six views at 360 and 1024 widths, plus EN home (LTR check).
 * Output: docs/ui-screenshots/<view>-<w>.png + home-en-360.png
 * Run from /tmp/e2e (puppeteer-core lives there): see commands in PROGRESS.md.
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const OUT = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'ui-screenshots');
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = ['home', 'search', 'scan', 'history', 'data', 'about'];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar']
});
const page = await browser.newPage();

async function snap(view, w, h, lang) {
  await page.setViewport({ width: w, height: h });
  await page.goto(`${BASE}/index.html#/${view}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(l => {
    if (l) { localStorage.setItem('mustashar-lang', l); }
    localStorage.setItem('mustashar-theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    if (window.I18N && l) { I18N.setLang(l); }
  }, lang || null);
  await new Promise(r => setTimeout(r, 500));
  const name = lang ? `${view}-${lang}-${w}.png` : `${view}-${w}.png`;
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  console.log('saved', name);
}

for (const v of VIEWS) {
  await snap(v, 360, 800);
  await snap(v, 1024, 900);
}
await snap('home', 360, 800, 'en');
await browser.close();
console.log('done ->', OUT);
