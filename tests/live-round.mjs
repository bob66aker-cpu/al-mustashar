/* tests/live-round.mjs — live verification round (not a unit test).
 * Route: 4 languages × 6 views at the phone viewport (420×900), counting
 * console errors, pageerrors and failed network responses per language.
 * Screenshots -> docs/ui-screenshots/live-round-<lang>-<view>.png
 * Run: BASE_URL=http://127.0.0.1:8080 node tests/live-round.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const OUT = '/home/daytona/al-mustashar-work/docs/ui-screenshots';
import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync(OUT, { recursive: true });

const LANGS = ['ar', 'en', 'fr', 'es'];
const VIEWS = ['home', 'search', 'scan', 'history', 'data', 'about'];
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
});
const page = await browser.newPage();
await page.setViewport({ width: 420, height: 900 });

let fails = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  if (!ok) fails++;
};

for (const lang of LANGS) {
  const errors = [];
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('response');
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push('net: ' + r.status() + ' ' + myUrl(r)); });
  function myUrl(r) { try { return new URL(r.url()).pathname; } catch (e) { return r.url(); } }

  await page.goto(BASE + '/index.html#/', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(l => {
    localStorage.setItem('mustashar-lang', l);
    localStorage.setItem('mustashar-theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    if (window.I18N) I18N.setLang(l);
  }, lang);
  await new Promise(r => setTimeout(r, 400));

  for (const v of VIEWS) {
    await page.evaluate(v => { location.hash = '#/' + v; }, v);
    await new Promise(r => setTimeout(r, 700));
    const name = `live-round-${lang}-${v}.png`;
    await page.screenshot({ path: path.join(signaturePath(name)), fullPage: true });
    console.log('shot', name);
  }
  const real = errors.filter(e =>
    !/favicon|manifest|sw registration|storage|Quota|abort|autoplay/i.test(e));
  check(`lang ${lang}: zero real errors across 6 views`, real.length === 0,
    real.slice(0, 4).join(' | '));
}
await browser.close();
function signaturePath(n) { return path.join(OUT, n); }
console.log(fails ? `ROUND FAILED: ${fails} fail(s)` : 'ROUND CLEAN: all langs zero-error');
process.exit(fails ? 1 : 0);
