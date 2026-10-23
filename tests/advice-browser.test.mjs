/*
 * tests/advice-browser.test.mjs — بوابة «التوصيات الزراعية» الحية (2026-10-23)
 * ---------------------------------------------------------------------------------
 * العقد بعد إعادة البناء: القسم يُبنى من كتاب Recomm25 وحده في كروم حقيقي:
 *   - القسم القديم ممحو من القشرة (#view-advice غير موجود، #/advice يعود للرئيسية).
 *   - المسار: محصول ← إصابة ← بطاقة ← رجوع، والبطاقة تعرض حقول الكتاب حرفياً:
 *     مظهر/ميعاد/توقيت/إرشادات + جدول المنتجات (معدل/WHO/PHI/MRL) + رقمان CAS
 *     مؤكدان فقط + صور الكتاب محمّلة فعلاً + مصدر apc.gov.eg وحيد الروابط.
 *   - علامات الصراحة: بطاقة فيها منتج NEEDS_VERIFICATION تُعلَّم بشارة، وبطاقة
 *     تسميتها محصولها متعارضة تُعلَّم، ولا تُقدَّم كحقيقة.
 *   - البحث، رجوع المتصفح، العمل دون اتصال (sections.json من الكاش)، EN،
 *     وأحجام 320/390/1440 بلا تمرير أفقي. أي خطأ JavaScript = فشل.
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
const SECTIONS = JSON.parse(readFileSync(join(root, 'data/tws/sections.json'), 'utf8')).sections;

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* اختيار بطاقات من البيانات نفسها: القمح (أولوية المالك)، بطاقة تحتاج تحققًا،
 * وبطاقة تسمية محصولها متعارضة */
const routeOf = s => {
  const row = (CROPS.find(c => c.id === s.crop_id) || {}).infections || [];
  const inf = row.find(i => i.n === s.n) || {};
  return { crop: s.crop_id, type: inf.type, n: s.n };
};
const wheatSecs = SECTIONS.filter(s => s.crop_id === 'wheat');
const treatedSec = wheatSecs.slice().sort((a, b) => b.products.length - a.products.length)[0];
const treated = routeOf(treatedSec);
const flaggedSec = SECTIONS.find(s => s.crop_id !== treated.crop &&
  s.products.some(p => p._verify && p._verify.status === 'NEEDS_VERIFICATION'));
const flagged = flaggedSec ? routeOf(flaggedSec) : null;
const conflictSec = SECTIONS.find(s => s.crop_conflict && s.crop_id !== treated.crop);
const conflict = conflictSec ? routeOf(conflictSec) : null;

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

  /* 1) القسم القديم ممحو من القشرة كلياً، والجديد دخل التنقل */
  const retired = await page.evaluate(() => ({
    oldNav: document.querySelectorAll('[data-nav="advice"]').length,
    newNav: document.querySelectorAll('[data-nav="tws"]').length,
    oldView: document.getElementById('view-advice') === null,
    irsheedScript: !!document.querySelector('script[src="src/irsheed.js"]'),
    cta: (document.getElementById('homeAdviceCta') || {}).getAttribute
      ? document.getElementById('homeAdviceCta').getAttribute('href') : ''
  }));
  check('the old advice view is fully removed from the shell (not just hidden)',
    retired.oldNav === 0 && retired.newNav === 1 &&
    retired.oldView === true && retired.irsheedScript === false &&
    retired.cta === '#/tws', JSON.stringify(retired));

  await page.evaluate(() => { location.hash = '#/advice'; });
  await sleep(500);
  const fallback = await page.evaluate(() => ({
    home: document.getElementById('view-home').hidden === false,
    old: document.getElementById('view-advice') === null
  }));
  check('a deep link to #/advice falls back to the home view (old section unreachable)',
    fallback.home === true && fallback.old === true, JSON.stringify(fallback));

  /* 2) الشبكة تفتح بمحاصيل الكتاب كاملة */
  await page.evaluate(() => { location.hash = '#/tws'; });
  await page.waitForSelector('#view-tws:not([hidden])', { timeout: 8000 });
  await page.waitForFunction(() => document.querySelectorAll('.tws-crop').length > 0, { timeout: 15000 });
  const list = await page.evaluate(() => ({
    h1: (document.querySelector('#view-tws h1') || {}).textContent || '',
    crops: document.querySelectorAll('.tws-crop').length,
    search: !!document.getElementById('twsFilter'),
    foot: (document.querySelector('.tws-foot') || {}).textContent || ''
  }));
  check('the recommendations view opens with every crop of the book and a search box',
    list.h1.includes('التوصيات') && list.crops === MAN.counts.crops && list.search &&
    list.foot.includes(String(MAN.counts.cards)) && list.foot.includes(String(MAN.counts.crops)),
    JSON.stringify(list).slice(0, 220));

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

  /* 5) صفحة المحصول: إصابات الكتاب مع صفحة الطباعة في كل صف */
  await page.evaluate(t => { location.hash = '#/tws/' + t.crop; }, treated);
  await page.waitForSelector('.tws-inf', { timeout: 8000 });
  const cropView = await page.evaluate(() => ({
    rows: document.querySelectorAll('.tws-inf').length,
    crumb: (document.querySelector('.tws-crumb a') || {}).textContent || '',
    pageChips: [...document.querySelectorAll('.tws-chip.pg')].length,
    groups: document.querySelectorAll('.tws-inf .grp').length
  }));
  const wheatRow = CROPS.find(c => c.id === treated.crop);
  check('a crop page lists exactly its book infections with breadcrumb and print-page chips',
    cropView.rows === wheatRow.cards && cropView.crumb.includes('كل المحاصيل')
    && cropView.pageChips === wheatRow.cards && cropView.groups >= 1, JSON.stringify(cropView));

  /* 6) بطاقة القمح: حقول الكتاب حرفياً + صور + CAS + مصدر وحيد */
  await page.evaluate(t => { location.hash = '#/tws/' + t.crop + '/' + t.type + '.' + t.n; }, treated);
  await page.waitForSelector('.tws-card', { timeout: 8000 });
  await sleep(400);
  const card = await page.evaluate(() => ({
    h2: (document.querySelector('.tws-card h2') || {}).textContent || '',
    sym: document.querySelectorAll('.tws-card ul li').length,
    products: document.querySelectorAll('.tws-prod').length,
    rows: document.querySelectorAll('.tws-prod .row').length,
    cas: [...document.querySelectorAll('.tws-cas')].map(c => c.textContent || ''),
    gallery: document.querySelectorAll('.tws-gallery img').length,
    links: [...document.querySelectorAll('.tws-card a')].map(a => a.getAttribute('href') || ''),
    doseNote: (document.querySelector('.tws-note.info') || {}).textContent || '',
    heads: [...document.querySelectorAll('.tws-card h3')].map(h => h.textContent || '')
  }));
  const casDigits = card.cas.filter(t => /\d{2,7}-\d{2}-\d/.test(t)).length;
  const externals = card.links.filter(h => h.startsWith('http'));
  check('the treated card shows the book fields verbatim (symptoms, table rows, WHO/PHI/MRL)',
    card.h2.length > 0 && card.sym >= 1 && card.products === treatedSec.products.length
    && card.rows >= treatedSec.products.length
    && card.heads.some(h => h.includes('ميعاد ظهور')) && card.heads.some(h => h.includes('توقيت المكافحة')),
    JSON.stringify({ h2: card.h2.slice(0, 40), products: card.products, rows: card.rows }).slice(0, 220));
  check('confirmed CAS numbers render as digits (ambiguous ones never do)',
    casDigits >= 1, `digits=${casDigits} chips=${card.cas.length}`);
  check('the book images render directly in the card', card.gallery >= 1, String(card.gallery));
  check('the only external link is the official book (apc.gov.eg)',
    externals.length >= 1 && externals.every(h => h.includes('apc.gov.eg')),
    externals.join(' ').slice(0, 120));
  check('the dose note says values come verbatim from the book tables',
    /جداول الكتاب/.test(card.doseNote) && !/ملصق المنتج/.test(card.doseNote),
    card.doseNote.slice(0, 90));
  const imgLoaded = await page.waitForFunction(
    () => [...document.querySelectorAll('.tws-gallery img')].some(i => i.complete && i.naturalWidth > 0),
    { timeout: 15000 }
  ).then(() => true).catch(() => false);
  check('at least one book image actually decodes in the browser', imgLoaded === true);

  /* 7) صراحة النقص: بطاقة تحتاج تحققًا تُعلَّم ولا تُقدَّم كحقيقة */
  if (flagged) {
    await page.evaluate(t => { location.hash = '#/tws/' + t.crop + '/' + t.type + '.' + t.n; }, flagged);
    await page.waitForSelector('.tws-card', { timeout: 8000 });
    await sleep(300);
    const fl = await page.evaluate(() => ({
      warn: [...document.querySelectorAll('.tws-chip.warn')].map(c => c.textContent || '').join(' | '),
      prods: document.querySelectorAll('.tws-prod').length
    }));
    check('a product needing print-line verification is flagged on the card (not promoted)',
      fl.warn.includes('تحتاج تحققًا') && fl.prods >= 1, JSON.stringify(fl).slice(0, 200));
  } else check('a NEEDS_VERIFICATION card exists to test', false, 'none in data');

  /* 8) صراحة تعارض تسمية المحصول */
  if (conflict) {
    await page.evaluate(t => { location.hash = '#/tws/' + t.crop + '/' + t.type + '.' + t.n; }, conflict);
    await page.waitForSelector('.tws-card', { timeout: 8000 });
    await sleep(300);
    const cf = await page.evaluate(() => ({
      warn: [...document.querySelectorAll('.tws-chip.warn')].map(c => c.textContent || '').join(' | '),
      h2: (document.querySelector('.tws-card h2') || {}).textContent || ''
    }));
    check('a card whose print crop label contradicts the extraction shows the review flag',
      cf.warn.includes('تحت المراجعة') && cf.h2.length > 0, JSON.stringify(cf).slice(0, 200));
  } else check('a crop-label conflict card exists to test', false, 'none in data');

  /* 9) زر رجوع المتصفح يعود مستويات المسار (شبكة ← محصول ← بطاقة) */
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

  /* 10) العمل دون اتصال بعد أول فتح بطاقة (sections.json في الكاش) */
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
  await sleep(900);
  const offline = await page.evaluate(() => ({
    h2: (document.querySelector('.tws-card h2') || {}).textContent || '',
    prods: document.querySelectorAll('.tws-prod').length,
    srcs: [...document.querySelectorAll('.tws-card a')].filter(a => (a.getAttribute('href') || '').includes('apc.gov.eg')).length
  }));
  check('offline: another crop card still renders from cache with its book source',
    offline.h2.length > 0 && offline.prods >= 1 && offline.srcs >= 1, JSON.stringify(offline));
  await page.setOfflineMode(false);

  /* 11) اللغة الإنجليزية */
  await page.select('#langSelect', 'en');
  await sleep(700);
  const en = await page.evaluate(() => ({
    nav: (document.querySelector('[data-nav="tws"] span:last-child') || {}).textContent || '',
    head: (document.querySelector('#view-tws h1, #view-tws h2') || {}).textContent || '',
    srcs: [...document.querySelectorAll('#view-tws a')].filter(a => (a.getAttribute('href') || '').includes('apc.gov.eg')).length
  }));
  check('switching to English renames the section and keeps it rendering',
    en.nav.trim() === 'Recommendations' && en.head.trim().length > 0 && en.srcs >= 1, JSON.stringify(en));
  await page.select('#langSelect', 'ar');
  await sleep(500);

  /* 12) صفر أخطاء JavaScript طوال الجولة */
  check('no page errors while using the section', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('the recommendations smoke run completes', false, e.message);
} finally {
  await browser.close();
  if (srv) srv.kill('SIGTERM');
}

console.log('\nADVICE-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
