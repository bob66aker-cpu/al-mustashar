#!/usr/bin/env node
/*
 * tests/fb6-cat-legend.mjs — فيدباك 6: هل يُشرح رمز التصنيف S.Ph؟
 * ---------------------------------------------------------------------------
 * يقيس ما يراه المزارع على البناء الحيّ في الوضعين (المزارع والمحترف)
 * لبطاقة CAS 53939-28-9 «(Z)-11-Hexadecenal» تصنيفها S.Ph، ويسجّل الرسالة
 * الاحتياطية إن ظهرت.
 *
 * الوضع:  node tests/fb6-cat-legend.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');
const CAS = '53939-28-9';

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  << ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  protocolTimeout: 120000
});

const results = {};
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
  await sleep(1200);
  const got = await page.evaluate(async (cas) => {
    const q = document.querySelector('#query');
    q.value = cas;
    q.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 1400));
    const box = document.getElementById('results');
    const text = box ? box.textContent : '';
    /* the category cell: every element whose text mentions the code or the hint */
    const catNodes = [...document.querySelectorAll('[data-cat], [class*=cat], [class*=legend], .hint, .muted, small')]
      .map(n => (n.textContent || '').trim())
      .filter(t => t && t.length < 400 && (t.indexOf('S.Ph') >= 0 || t.indexOf('S.ph') >= 0 ||
                 t.indexOf('غير مشروح') >= 0 || t.indexOf('غير معرّف') >= 0 ||
                 t.indexOf('فرمون') >= 0 || t.indexOf('pheromone') >= 0));
    /* the tooltip/title on the category, if the card exposes one */
    const titled = [...document.querySelectorAll('[title]')]
      .map(n => (n.getAttribute('title') || '').trim())
      .filter(t => t && t.length < 400);
    return {
      mode: document.body.getAttribute('data-mode') || localStorage.getItem('mustashar-mode') || '',
      cards: box ? box.querySelectorAll('[class*=result], article, .card').length : 0,
      hasSubstance: /Hexadecenal/i.test(text),
      hasSexPheromone: /فرمون جنسي|Sex pheromone|Sex Pheromone/i.test(text),
      hasFallback: /غير مشروح|غير معرّف|not explained/i.test(text),
      catNodes: [...new Set(catNodes)].slice(0, 8),
      titled: [...new Set(titled)].filter(t => /S\.Ph|S\.ph|فرمون|pheromone|غير مشروح|غير معرّف|غير مجهول/i.test(t)).slice(0, 8),
      text: (text || '').replace(/\s+/g, ' ').slice(0, 300)
    };
  }, CAS);
  got.errors = errors;
  results[mode] = got;
  console.log('\n--- MODE ' + mode + ' ---');
  console.log('  cards: ' + got.cards + ' | substance: ' + got.hasSubstance +
              ' | explains S.Ph: ' + got.hasSexPheromone + ' | fallback shown: ' + got.hasFallback);
  if (got.catNodes.length) console.log('  cat nodes: ' + JSON.stringify(got.catNodes, null, 1));
  if (got.titled.length) console.log('  titles: ' + JSON.stringify(got.titled, null, 1));
  console.log('  errors: ' + (errors.length ? errors.join(' | ') : 'none'));
  await page.close();
}

await browser.close();

console.log('\n================ RESULTS ================');
for (const mode of ['farmer', 'pro']) {
  const g = results[mode];
  check(mode + ': the card renders the substance', g.hasSubstance, g.text);
  check(mode + ': S.Ph carries its real meaning (فرمون جنسي), not the fallback',
        g.hasSexPheromone && !g.hasFallback, JSON.stringify(g.catNodes) + ' :: ' + g.text);
  check(mode + ': zero console/page errors', g.errors.length === 0, g.errors.join(' | '));
}
console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);