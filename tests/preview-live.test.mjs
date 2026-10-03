/*
 * tests/preview-live.test.mjs — فحص رابط المعاينة العام من كروم حقيقي
 * ------------------------------------------------------------------
 * يشغّل كرومًا على رابط المعاينة HTTPS نفسه (نفس المسار الذي يمرّ منه
 * الهاتف) ويتحقق من:
 *   1) استجابة الرابط + تحميل index.html بلا أخطاء شبكة.
 *   2) المانيفست صالح ومربوط بالصفحة.
 *   3) عامل الخدمة مسجَّل فعلًا (navigator.serviceWorker) ويفعّل التحكم.
 *   4) كاش mustashar-v50 موجود بعد التثبيت.
 *   5) القواعد الخمس محمَّلة (عبر واجهة الاستخدام) وبحث فعلي يجد نتيجة.
 *   6) عرض طبقة CAS يعمل على الرابط (Captan 133-06-2 + الخام مشطوبًا).
 * تشغيل: PREVIEW_URL=https://… node tests/preview-live.test.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.PREVIEW_URL || process.env.BASE_URL;
if (!BASE) { console.error('PREVIEW_URL is required'); process.exit(2); }

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('preview: ' + BASE);
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [], netFails = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) netFails.push(r.status() + ' ' + r.url()); });

  const resp = await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0', timeout: 45000 });
  must('the preview URL answers over the network', resp && resp.status() === 200, 'HTTP ' + (resp && resp.status()));
  must('the served page is the work-branch build (cache mustashar-v50, version 1.19.14)',
    await page.evaluate(async () => {
      const [sw, v] = await Promise.all([fetch('./sw.js').then(r => r.text()), fetch('./version.json').then(r => r.json())]);
      return sw.includes("mustashar-v50") && v.version === '1.19.14';
    }));
  must('no failed network responses', netFails.length === 0, netFails.slice(0, 3).join(' | '));

  /* manifest */
  const man = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]')?.getAttribute('href');
    if (!href) return { ok: false, why: 'no manifest link' };
    const r = await fetch(href);
    const j = await r.json();
    return { ok: r.ok, name: j.name, start: j.start_url, display: j.display, icons: (j.icons || []).length, href };
  });
  must('manifest is linked and valid JSON over the link', man.ok && !!man.name, JSON.stringify(man));

  /* service worker: registration + control + cache */
  const swState = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { secure: window.isSecureContext, supported: false };
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      secure: window.isSecureContext,
      supported: true,
      scope: reg ? reg.scope : null,
      active: !!(reg && reg.active),
      state: reg && reg.active ? reg.active.state : null
    };
  });
  must('the origin is a secure context (HTTPS)', swState.secure === true, 'isSecureContext=' + swState.secure);
  must('service worker registered and active', swState.supported && swState.active, JSON.stringify(swState));

  /* wait for the SW to finish precaching, then read the cache names */
  let caches = [];
  for (let i = 0; i < 12; i++) {
    caches = await page.evaluate(() => caches.keys());
    if (caches.includes('mustashar-v50')) break;
    await sleep(1500);
  }
  must('the mustashar-v50 cache exists after install', caches.includes('mustashar-v50'), JSON.stringify(caches));
  const cached = await page.evaluate(async () => {
    const c = await caches.open('mustashar-v50');
    const keys = await c.keys();
    return { n: keys.length, sample: keys.slice(0, 6).map(r => new URL(r.url).pathname) };
  });
  must('the mustashar-v50 cache holds the app shell and the databases', cached.n >= 20, cached.n + ' entries e.g. ' + JSON.stringify(cached.sample));

  /* the app itself works over the link: databases loaded + a real search */
  await sleep(1500);
  const dbState = await page.evaluate(() => (document.getElementById('dbState') || {}).textContent || '');
  must('the app reports its databases ready', /جاهزة|ready/i.test(dbState), dbState);

  await page.evaluate(() => { location.hash = '#/search'; });
  await sleep(400);
  await page.select('#mode', 'pro');
  await page.type('#query', 'Captan', { delay: 10 });
  await page.evaluate(() => document.getElementById('searchForm')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await sleep(1800);
  const cap = await page.evaluate(() => {
    const a = [...document.querySelectorAll('#results article.result')]
      .find(x => (x.querySelector('h3') || {}).textContent === 'Captan');
    if (!a) return null;
    return { meta: (a.querySelector('p.meta') || {}).innerText || '',
      raw: (a.querySelector('.cas-raw-old') || {}).textContent || '' };
  });
  must('search works over the link and shows the corrected CAS + struck raw',
    !!cap && /133-06-2/.test(cap.meta) && cap.raw === '133-06-02', cap ? cap.meta : 'no Captan card');

  const realErrors = errors.filter(e => !/favicon|manifest|storage|Quota|abort/i.test(e));
  must('zero console/page errors on the preview link', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}
console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
