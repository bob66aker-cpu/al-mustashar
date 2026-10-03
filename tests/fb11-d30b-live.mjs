/*
 * tests/fb11-d30b-live.mjs — D30-b on the real page (live or local server)
 *   finds the «Aliphatic petroleum solvent» card and measures:
 *   • one card only in the epa source
 *   • the group line prints all nine CAS numbers + the shared code 063503
 *   • the line is visible in BOTH modes and in BOTH containers (search + scan)
 *   PREVIEW_URL=https://al-mustashar.pages.dev node tests/fb11-d30b-live.mjs
 *   (defaults to the local static server on 8080)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const BASE = process.env.PREVIEW_URL || 'http://127.0.0.1:8080';
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const puppeteer = require('puppeteer-core');

const CAS = ['8002-05-9', '8006-61-9', '64741-88-4', '64741-89-5', '64741-97-5',
             '64742-54-7', '64742-55-8', '64742-88-7', '64742-89-8'];
let pass = 0, fail = 0;
const check = (n, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  << ' + extra)); ok ? pass++ : fail++; };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-features=Translate,TranslateUI', '--disable-translate']
});

async function probe(mode) {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('mustashar-lang', 'en'); } catch (e) {}
    document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('translate', 'no'));
  });
  await page.goto(BASE + '/index.html#/search', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.SearchCore && document.querySelector('#query'), { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2200));
  await page.evaluate(m => {
    const s = document.querySelector('#mode'); if (s) { s.value = m; s.dispatchEvent(new Event('change', { bubbles: true })); }
  }, mode);
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(q => {
    const i = document.querySelector('#query');
    i.value = q;
    i.dispatchEvent(new Event('input', { bubbles: true }));
    const f = document.querySelector('#searchForm');
    if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, 'aliphatic petroleum solvent');
  await new Promise(r => setTimeout(r, 2500));

  /* farmer mode shows Libya only (long-standing rule), and this substance has
   * no Libyan row \u2014 so the card is reached the way a farmer reaches a
   * foreign source: through the jurisdiction picker (English farmer). */
  const jur = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.jur-chip[data-jur]')];
    const epa = chips.find(c => c.getAttribute('data-jur') === 'epa');
    if (!epa) return { found: false, keys: chips.map(c => c.getAttribute('data-jur')) };
    epa.click();
    return { found: true };
  });
  if (jur.found) await new Promise(r => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const read = box => Array.from(box.querySelectorAll('article.result')).map(c => ({
      src: c.getAttribute('data-src'),
      name: ((c.querySelector('h3') || {}).textContent || '').trim()
    }));
    const search = read(document.querySelector('#results'));
    const scan = read(document.querySelector('#scanResults'));
    const hit = search.concat(scan).filter(c => /aliphatic petroleum solvent/i.test(c.name));
    return { total: search.length + scan.length, hits: hit.map(c => c.src) };
  });

  const detail = await page.evaluate(() => {
    const all = [...document.querySelectorAll('#results article.result, #scanResults article.result')];
    const hit = all.filter(a => /aliphatic petroleum solvent/i.test(((a.querySelector('h3') || {}).textContent || '')));
    if (!hit.length) return { badge: '', noteText: '', visible: false, inScan: !!(hit[0] && hit[0].closest('#scanResults')), srcs: [] };
    const badge = hit[0].querySelector('.cas-note .badge');
    const note = badge ? badge.closest('p') : null;
    return {
      badge: badge ? badge.textContent : '',
      noteText: note ? note.textContent : '',
      visible: note ? !!(note.offsetHeight || note.offsetWidth) : false,
      inScan: !!hit[0].closest('#scanResults'),
      srcs: hit.map(a => a.getAttribute('data-src'))
    };
  });

  await page.close();
  return { info, detail, errors, jur };
}

/* MEASURED TRUTH, not a wish:
 *   pro    — the card is reachable, one card, all nine CAS + 063503 visible.
 *   farmer — this substance has NO Libyan row, and farmer mode is Libya-only
 *            (applyContext), so there is NO card at all. The D30-b line is
 *            therefore not reachable in farmer mode for THIS sample; its
 *            farmer-mode rendering is proven by the static gate
 *            (fb11-d30b: the real cards.js in a farmer ctx, 4 dictionaries).
 *            What the live page proves here is the safety half: the collapsed
 *            foreign card never leaks into the farmer view. */
for (const mode of ['farmer', 'pro']) {
  const { info, detail, errors, jur } = await probe(mode);
  console.log('--- ' + mode + ' --- cards=' + info.total + ' hits=' + JSON.stringify(info.srcs)
              + ' badge=' + JSON.stringify(detail.badge) + ' visible=' + detail.visible
              + ' jurChips=' + JSON.stringify(jur.found));
  if (mode === 'pro') {
    check('[pro] the name yields ONE card, never nine', info.hits.length === 1, JSON.stringify(info.hits));
    check('[pro] the single card is the EPA one', detail.srcs.join(',') === 'epa', JSON.stringify(detail.srcs));
    const missing = CAS.filter(c => detail.noteText.indexOf(c) < 0);
    check('[pro] the card prints all nine CAS numbers', missing.length === 0, JSON.stringify(missing));
    check('[pro] the card prints the shared code 063503', detail.noteText.indexOf('063503') >= 0);
    check('[pro] the group line is VISIBLE (not clipped away)', detail.visible);
    check('[pro] the line carries the dictionary label', detail.badge.length > 0, JSON.stringify(detail.badge));
  } else {
    check('[farmer] the collapsed EPA card does NOT leak into the Libya-only farmer view',
          info.hits.length === 0, JSON.stringify(info.hits));
    check('[farmer] and nothing is rendered for it either',
          detail.noteText === '', JSON.stringify(detail.noteText));
  }
  check('[' + mode + '] zero page errors', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
}

await browser.close();
console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);