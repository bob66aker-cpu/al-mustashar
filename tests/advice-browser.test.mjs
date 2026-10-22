/*
 * tests/advice-browser.test.mjs — بوابة «التوصيات الزراعية» الحية (2026-10-21)
 * ---------------------------------------------------------------------------------
 * خلفية: هذه البوابة كانت تقيس واجهة «الإرشاد الزراعي» القديمة (D59/D61/D63).
 * بقرار المالك في جولة «التوصيات الزراعية» استُبدل القسم في التطبيق الأساسي،
 * فصارت البوابة تقيس الجديد فعلاً في كروم حقيقي:
 *   - القسم القديم خرج من التنقل والتوجيه (‏#/advice يعود للرئيسية) وملفاته محفوظة.
 *   - المسار الجديد: محصول ← إصابة ← بطاقة ← مصادر فوق data/advice الحقيقية.
 *   - البحث، زر رجوع المتصفح، حالات النقص (ديوان بلا مخطط علاج)، والعمل دون اتصال.
 *   - أحجام 320 و390 و1440 بلا تمرير أفقي. أي خطأ JavaScript = فشل.
 * تشغيل: node tests/advice-browser.test.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const argBase = process.argv[2];
const BASE = (argBase || 'http://127.0.0.1:8080').replace(/\/$/, '');
const CROPS = JSON.parse(readFileSync(join(root, 'data/tws/crops.json'), 'utf8')).crops;
const MAN = JSON.parse(readFileSync(join(root, 'data/tws/manifest.json'), 'utf8'));

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* اختيار بطاقتين حيّتين من البيانات نفسها: مُعالَجة وبلا مخطط علاج */
const treated = (() => {
  for (const c of CROPS) for (const i of c.infections)
    if (MAN.dossiers[i.dossier].has_treatment) return { crop: c.id, type: i.type, n: i.n };
  return null;
})();
const untreated = (() => {
  for (const c of CROPS) for (const i of c.infections)
    if (!MAN.dossiers[i.dossier].has_treatment) return { crop: c.id, type: i.type, n: i.n };
  return null;
})();

let srv = null;
if (!argBase) {
  srv = spawn('node', ['tests/static-server.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const probe = () => new Promise(res => {
    const req = http.get(BASE + '/', r => { r.resume(); res(r.statusCode === 200); });
    req.on('error', () => res(false));
    req.setTimeout(2000, () => { req.destroy(); res(false); });
  });
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) { ready = await probe(); if (!ready) await sleep(250); }
  if (!ready) { console.log('FAIL static server did not start'); process.exit(1); }
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 120000
});
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const resp = await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  check('the app loads', !!resp && resp.status() === 200, 'HTTP ' + (resp && resp.status()));
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });

  /* 1) القسم القديم خرج من التجربة، والجديد دخل التنقل */
  const retired = await page.evaluate(() => ({
    oldNav: document.querySelectorAll('[data-nav="advice"]').length,
    newNav: document.querySelectorAll('[data-nav="tws"]').length,
    oldView: (() => { const v = document.getElementById('view-advice'); return v ? { hidden: v.hidden, dv: v.hasAttribute('data-view') } : null; })(),
    cta: (document.getElementById('homeAdviceCta') || {}).getAttribute
      ? document.getElementById('homeAdviceCta').getAttribute('href') : ''
  }));
  check('the old advice view is out of the nav and out of routing',
    retired.oldNav === 0 && retired.newNav === 1 &&
    retired.oldView && retired.oldView.hidden === true && retired.oldView.dv === false &&
    retired.cta === '#/tws', JSON.stringify(retired));

  await page.evaluate(() => { location.hash = '#/advice'; });
  await sleep(500);
  const fallback = await page.evaluate(() => ({
    home: document.getElementById('view-home').hidden === false,
    old: document.getElementById('view-advice').hidden
  }));
  check('a deep link to #/advice falls back to the home view (old section unreachable)',
    fallback.home === true && fallback.old === true, JSON.stringify(fallback));

  /* 2) القسم الجديد يفتح بشبكة المحاصيل كاملة */
  await page.evaluate(() => { location.hash = '#/tws'; });
  await page.waitForSelector('#view-tws:not([hidden])', { timeout: 8000 });
  await page.waitForFunction(() => document.querySelectorAll('.tws-crop').length > 0, { timeout: 15000 });
  const list = await page.evaluate(() => ({
    h1: (document.querySelector('#view-tws h1') || {}).textContent || '',
    crops: document.querySelectorAll('.tws-crop').length,
    search: !!document.getElementById('twsFilter'),
    foot: (document.querySelector('.tws-foot') || {}).textContent || ''
  }));
  check('the recommendations view opens with all 68 crops and a search box',
    list.h1.includes('التوصيات') && list.crops === 68 && list.search &&
    /30/.test(list.foot) && /766/.test(list.foot), JSON.stringify(list).slice(0, 220));

  /* 3) أحجام الشاشة الثلاثة بلا تمرير أفقي */
  for (const w of [320, 390, 1440]) {
    await page.setViewport({ width: w, height: 844, isMobile: w < 700, hasTouch: w < 700 });
    await sleep(250);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('no horizontal overflow at ' + w + 'px', over <= 1, over + 'px');
  }
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  /* 4) البحث داخل القسم */
  await page.click('#twsFilter');
  await page.type('#twsFilter', 'الزيتون');
  await sleep(300);
  const filtered = await page.evaluate(() => ({
    n: document.querySelectorAll('.tws-crop').length,
    first: (document.querySelector('.tws-crop b') || {}).textContent || ''
  }));
  check('typing a crop name filters the grid', filtered.n >= 1 && filtered.first.includes('الزيتون'), JSON.stringify(filtered));
  await page.evaluate(() => { const f = document.getElementById('twsFilter'); f.value = 'zzzzz'; f.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(300);
  const none = await page.evaluate(() => document.querySelectorAll('.tws-err').length);
  check('an impossible query shows the honest empty note', none === 1, String(none));
  await page.evaluate(() => { const f = document.getElementById('twsFilter'); f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(300);

  /* 5) المسار: محصول ← إصابة ← بطاقة بمصادر */
  await page.evaluate(t => { location.hash = '#/tws/' + t.crop; }, treated);
  await page.waitForSelector('.tws-inf', { timeout: 8000 });
  const cropView = await page.evaluate(() => ({
    rows: document.querySelectorAll('.tws-inf').length,
    crumb: (document.querySelector('.tws-crumb a') || {}).textContent || '',
    chips: document.querySelectorAll('.tws-chip').length
  }));
  check('a crop page lists its sourced infections with breadcrumb and chips',
    cropView.rows >= 1 && cropView.crumb.includes('كل المحاصيل') && cropView.chips >= 1, JSON.stringify(cropView));

  await page.evaluate(t => { location.hash = '#/tws/' + t.crop + '/' + t.type + '.' + t.n; }, treated);
  await page.waitForSelector('.tws-card', { timeout: 8000 });
  await sleep(400);
  const card = await page.evaluate(() => ({
    h2: (document.querySelector('.tws-card h2') || {}).textContent || '',
    sym: document.querySelectorAll('.tws-card ul li').length,
    schemes: document.querySelectorAll('.tws-scheme').length,
    srcs: [...document.querySelectorAll('.tws-card a')].map(a => a.getAttribute('href') || ''),
    doseNote: (document.querySelector('.tws-note.info') || {}).textContent || ''
  }));
  check('a treated card shows symptoms, treatment schemes and https sources',
    card.h2.length > 0 && card.sym >= 1 && card.schemes >= 1 &&
    card.srcs.filter(h => h.startsWith('https://')).length >= 1, JSON.stringify(card).slice(0, 240));
  check('the card states that doses come from the local label (no doses shown)',
    /الجرعة/.test(card.doseNote), card.doseNote.slice(0, 80));

  /* 6) بطاقة بلا مخطط علاج: حالة صريحة لا تخمين */
  if (untreated) {
    await page.evaluate(t => { location.hash = '#/tws/' + t.crop; }, untreated);
    await sleep(500);
    await page.evaluate(t => { location.hash = '#/tws/' + t.crop + '/' + t.type + '.' + t.n; }, untreated);
    await page.waitForSelector('.tws-card', { timeout: 8000 });
    await sleep(300);
    const ut = await page.evaluate(() => ({
      note: [...document.querySelectorAll('.tws-note')].map(e => e.textContent || '').join(' '),
      sym: document.querySelectorAll('.tws-card ul li').length,
      schemes: document.querySelectorAll('.tws-scheme').length
    }));
    check('a dossier without schemes shows the honest amber note, keeps symptoms, invents nothing',
      /لا يوجد مخطط علاج/.test(ut.note) && ut.sym >= 1 && ut.schemes === 0, JSON.stringify(ut).slice(0, 200));
  } else check('an untreated card exists to test', false, 'none in data');

  /* 7) زر رجوع المتصفح يعود مستويات المسار (تسلسل نظيف: شبكة ← محصول ← بطاقة) */
  await page.evaluate(() => { location.hash = '#/tws'; });
  await page.waitForFunction(() => !!document.getElementById('twsFilter'), { timeout: 5000 });
  await sleep(400);
  const pickCrop = CROPS.find(c => c.id !== treated.crop && c.infections.length > 0) || CROPS[0];
  await page.click('a.tws-crop[href="#/tws/' + pickCrop.id + '"]');
  await page.waitForFunction(id => location.hash === '#/tws/' + id, { timeout: 5000 }, pickCrop.id)
    .catch(() => {});
  await page.waitForSelector('.tws-inf', { timeout: 8000 });
  const pc = pickCrop.infections[0];
  await page.click('a.tws-inf[href="#/tws/' + pickCrop.id + '/' + pc.type + '.' + pc.n + '"]');
  await page.waitForFunction(t => location.hash === '#/tws/' + t.id + '/' + t.type + '.' + t.n,
    { timeout: 5000 }, { id: pickCrop.id, type: pc.type, n: pc.n }).catch(() => {});
  await page.waitForSelector('.tws-card', { timeout: 8000 });
  const hCard = await page.evaluate(() => location.hash);
  await page.evaluate(() => history.back());
  await page.waitForFunction(h => location.hash === '#/tws/' + h, { timeout: 5000 }, pickCrop.id)
    .catch(() => {});
  await sleep(400);
  const back1 = await page.evaluate(() => ({
    rows: document.querySelectorAll('.tws-inf').length,
    hash: location.hash
  }));
  check('browser Back returns to the crop infection list',
    back1.rows >= 1 && back1.hash === '#/tws/' + pickCrop.id, JSON.stringify({ hCard, back1 }));
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => location.hash === '#/tws', { timeout: 5000 }).catch(() => {});
  await sleep(400);
  const back2 = await page.evaluate(() => ({ search: !!document.getElementById('twsFilter'), hash: location.hash }));
  check('Back again returns to the crop grid', back2.search === true && back2.hash === '#/tws', JSON.stringify(back2));

  /* 8) العمل دون اتصال بعد أول تحميل */
  await page.evaluate(t => { location.hash = '#/tws/' + t.crop + '/' + t.type + '.' + t.n; }, treated);
  await page.waitForSelector('.tws-card', { timeout: 8000 });
  const swReady = await page.evaluate(async () => {
    try { await navigator.serviceWorker.ready; return !!navigator.serviceWorker.controller; } catch (e) { return false; }
  });
  if (!swReady) { await page.reload({ waitUntil: 'networkidle0' }); await page.evaluate(() => { location.hash = '#/tws'; }); await sleep(800); }
  const other = CROPS.find(c => c.id !== treated.crop && c.infections.length > 0) || CROPS[0];
  const otherCard = other.infections[0];
  await page.setOfflineMode(true);
  await page.evaluate(id => { location.hash = '#/tws/' + id; }, other.id);
  await sleep(600);
  await page.evaluate(t => { location.hash = '#/tws/' + t.id + '/' + t.type + '.' + t.n; },
    { id: other.id, type: otherCard.type, n: otherCard.n });
  await sleep(800);
  const offline = await page.evaluate(() => ({
    h2: (document.querySelector('.tws-card h2') || {}).textContent || '',
    srcs: [...document.querySelectorAll('.tws-card a')].filter(a => (a.getAttribute('href') || '').startsWith('https://')).length
  }));
  check('offline: another crop card still renders from cache with its sources',
    offline.h2.length > 0 && offline.srcs >= 1, JSON.stringify(offline));
  await page.setOfflineMode(false);

  /* 9) اللغة الإنجليزية */
  await page.select('#langSelect', 'en');
  await sleep(700);
  const en = await page.evaluate(() => ({
    nav: (document.querySelector('[data-nav="tws"] span:last-child') || {}).textContent || '',
    head: (document.querySelector('#view-tws h1, #view-tws h2') || {}).textContent || '',
    srcs: [...document.querySelectorAll('#view-tws a')].filter(a => (a.getAttribute('href') || '').startsWith('https://')).length
  }));
  check('switching to English renames the section and keeps it rendering',
    en.nav.trim() === 'Recommendations' && en.head.trim().length > 0 && en.srcs >= 1, JSON.stringify(en));
  await page.select('#langSelect', 'ar');
  await sleep(500);

  /* 10) صفر أخطاء JavaScript طوال الجولة */
  check('no page errors while using the section', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('the recommendations smoke run completes', false, e.message);
} finally {
  await browser.close();
  if (srv) srv.kill('SIGTERM');
}

console.log('\nADVICE-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
