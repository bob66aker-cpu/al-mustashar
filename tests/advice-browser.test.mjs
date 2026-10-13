/*
 * tests/advice-browser.test.mjs — بوابة «إرشاد» الحية (D59)
 * ---------------------------------------------------------
 * تقيس ما يراه المزارع فعلاً في كروم حقيقي: الشاشة تفتح، شبكة المحاصيل
 * تكتمل، النقر يُخرج البطاقات، ملف المزرعة يُظهر الإرشاد المخفي بعدّاده
 * ثم يُزيل التلميح بعد الضبط، واللغة تتبدّل فعلاً. أي خطأ JavaScript
 * أثناء ذلك = فشل (لا شاشة صامتة في الإنتاج).
 * تشغيل: node tests/advice-browser.test.mjs [baseUrl]   (افتراضياً 127.0.0.1:8080)
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 120000
});
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const resp = await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  check('the app loads', !!resp && resp.status() === 200, 'HTTP ' + (resp && resp.status()));
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.evaluate(() => { location.hash = '#/advice'; });
  await page.waitForSelector('#view-advice:not([hidden])', { timeout: 8000 });

  /* 1) الشاشة والملف والشبكة */
  await page.waitForSelector('#adviceCrops .crop-chip', { timeout: 8000 });
  const head = await page.evaluate(() => ({
    h1: (document.querySelector('#view-advice h1') || {}).textContent || '',
    fields: document.querySelectorAll('#adviceFarmFields select').length,
    opts: [...document.querySelectorAll('#adviceFarmFields select')].map(s => s.options.length),
    crops: document.querySelectorAll('#adviceCrops .crop-chip').length
  }));
  check('the advice view opens with its heading', head.h1.trim().length > 0, head.h1);
  check('the farm profile carries all six modifiers with real choices',
    head.fields === 6 && head.opts.every(n => n >= 3), JSON.stringify(head));
  check('the crop grid lists every crop in the pack', head.crops === 10, String(head.crops));

  /* 2) النقر يُخرج البطاقات، و applies_if يخفي بند التربة الجيرية بعدّاده */
  await page.click('[data-crop="citrus"]');
  await page.waitForSelector('#adviceCards .advice-card', { timeout: 8000 });
  const before = await page.evaluate(() => ({
    items: [...document.querySelectorAll('#adviceCards .advice-card ul.ac-list > li.adv-item')].length,
    ctxBanner: [...document.querySelectorAll('#adviceCards .ctx-banner')].map(e => e.textContent || '').join(' '),
    srcLinks: [...document.querySelectorAll('#adviceCards a.src-link')].map(a => a.getAttribute('href') || '')
  }));
  check('a card renders with real https source links',
    before.srcLinks.length >= 4 && before.srcLinks.every(h => h.startsWith('https://')), before.srcLinks.join(' '));
  check('the context banner counts the guidance hidden behind the unbuilt profile',
    /1/.test(before.ctxBanner), before.ctxBanner);

  /* 3) ضبط التربة الجيرية يُظهر البند المخفي ويُزيل التلميح */
  await page.select('#af-soil', 'calcareous');
  await page.click('#adviceFarmSave');
  await sleep(700);
  const after = await page.evaluate(() => ({
    ctxBanner: document.querySelectorAll('#adviceCards .ctx-banner').length,
    lis: document.querySelectorAll('#adviceCards .advice-card ul.ac-list > li.adv-item').length
  }));
  check('completing the profile removes the hint and reveals the conditional item',
    after.ctxBanner === 0 && after.lis === before.items + 1,
    'items ' + before.items + ' -> ' + after.lis + ' banner=' + after.ctxBanner);

  /* 4) الشق المرخّص في بطاقة الزيتون: خيارات + شارة آلية العمل */
  await page.click('[data-crop="olive"]');
  await sleep(900);
  const olive = await page.evaluate(() => ({
    opts: document.querySelectorAll('#adviceCards .chem-opt').length,
    badges: [...document.querySelectorAll('#adviceCards .frac-badge')].map(b => b.textContent || ''),
    ev: document.querySelectorAll('#adviceCards .ev').length,
    loc: (document.querySelector('#adviceCards .loc-chip') || {}).textContent || ''
  }));
  check('the licensed side renders options with FRAC/IRAC badges and evidence chips',
    olive.opts >= 1 && olive.badges.some(b => /M1|M\d|FRAC/.test(b)) && olive.ev >= 3,
    JSON.stringify(olive));
  check('the local-status chip is honest', olive.loc.length > 0, olive.loc);

  /* 5) اللغة الإنجليزية تتبدّل فعلاً */
  await page.select('#langSelect', 'en');
  await sleep(900);
  const en = await page.evaluate(() => ({
    nav: (document.querySelector('[data-nav="advice"] span:last-child') || {}).textContent || '',
    langnote: document.querySelectorAll('#adviceCards .langnote').length,
    cardStill: document.querySelectorAll('#adviceCards .advice-card').length
  }));
  check('switching to English translates the chrome and keeps the cards',
    en.nav.trim() === 'Advice' && en.langnote === 1 && en.cardStill >= 1, JSON.stringify(en));

  /* 6) صفر أخطاء JavaScript على الشاشة كلها */
  check('no page errors while using the advice view', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('the advice smoke run completes', false, e.message);
} finally {
  await browser.close();
}

/* 7) نغمة التحديث موصولة في المسارين (فحص ساكن يكمّل الحيّ) */
const appSrc = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
check('the update chime is wired at both banner sites',
  (appSrc.match(/playUpdateChime\(\);/g) || []).length === 2 && /function playUpdateChime/.test(appSrc));

console.log('\nADVICE-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
