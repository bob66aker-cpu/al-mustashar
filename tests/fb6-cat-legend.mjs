/*
 * tests/fb6-cat-legend.mjs — feedback 6: does the category code get explained?
 * ---------------------------------------------------------------------------
 * Drives the real UI on a real build, in BOTH modes, over the three samples the
 * owner named — and one code no source guide explains, so the test also proves
 * the existing correct behaviour survived: the fallback message stays.
 *
 *   53939-28-9  (Z)-11-Hexadecenal   S.Ph      the reported card
 *   571-58-4    1,4-Dimethylnaphthalene  P.G.R   the guide's other spelling
 *   9012-76-4   Chitosan             F+N+PGR   a compound code
 *   17804-35-2    Benomyl (F/Mi)      Mi        NO source explains it
 *
 * Rule under test: a code the guide explains must show its meaning in both
 * modes; a code no guide explains must keep the existing fallback sentence.
 *
 * usage: node tests/fb6-cat-legend.mjs [baseUrl]   (default http://127.0.0.1:8080)
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');

/* the fallback sentence as it exists in the app (all four dictionaries) */
const FALLBACK_RE = /\u063a\u064a\u0631 \u0645\u0634\u0631\u0648\u062d \u0641\u064a \u062f\u0644\u064a\u0644|not explained/i;

const SAMPLES = [
  { cas: '53939-28-9', mustExplain: true,
    hit: /\u0641\u0631\u0645\u0648\u0646 \u062c\u0646\u0633\u064a|Sex [Pp]heromone/i,
    label: 'S.Ph \u2014 the reported card' },
  { cas: '571-58-4', mustExplain: true,
    hit: /\u0645\u0646\u0638\u0645 \u0646\u0645\u0648 \u0646\u0628\u0627\u062a|Plant growth regulator/i,
    label: 'P.G.R \u2014 the guide spelling of PGR' },
  { cas: '9012-76-4', mustExplain: true,
    hit: /\u0645\u0628\u064a\u062f \u0641\u0637\u0631\u064a|\u0645\u0628\u064a\u062f \u0646\u064a\u0645\u0627\u062a\u0648\u062f\u064a|\u0645\u0646\u0638\u0645 \u0646\u0645\u0648 \u0646\u0628\u0627\u062a|Fungicide|Nematicide/i,
    label: 'F+N+PGR \u2014 a compound code' },
  { cas: '17804-35-2', mustExplain: false, hit: /$^/,
    label: 'Mi \u2014 no guide explains it, fallback must stay' }
];

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  << ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  protocolTimeout: 300000
});

for (const mode of ['farmer', 'pro']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.evaluateOnNewDocument((m) => {
    try { localStorage.setItem('mustashar-lang', 'ar'); localStorage.setItem('mustashar-mode', m); } catch (e) {}
  }, mode);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.SearchCore && document.querySelector('#query'), { timeout: 30000 });
  await sleep(1500);

  for (const s of SAMPLES) {
    const got = await page.evaluate(async (cas) => {
      const q = document.querySelector('#query');
      q.value = cas;
      q.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 1600));
      const box = document.getElementById('results');
      const text = box ? box.textContent : '';
      return {
        cards: box ? box.querySelectorAll('[class*=result], article, .card').length : 0,
        text: (text || '').replace(/\s+/g, ' ').slice(0, 400),
        full: (text || '').replace(/\s+/g, ' ')
      };
    }, s.cas);

    const explained = s.hit.test(got.full);
    const fallback = FALLBACK_RE.test(got.full);
    if (s.mustExplain) {
      check(mode + ' | ' + s.label + ': explained, no fallback', explained && !fallback,
            'cards=' + got.cards + ' :: ' + got.text.slice(0, 180));
    } else {
      check(mode + ' | ' + s.label + ': the fallback sentence is still what shows',
            fallback && !explained, 'cards=' + got.cards + ' :: ' + got.text.slice(0, 180));
    }
  }
  check(mode + ': zero console/page errors', errors.length === 0, errors.join(' | '));
  await page.close();
}

await browser.close();
console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
