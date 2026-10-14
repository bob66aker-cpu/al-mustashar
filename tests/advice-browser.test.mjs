/*
 * tests/advice-browser.test.mjs — بوابة «إرشاد» الحية (D59 + مسار الإصابات D61)
 * -------------------------------------------------------------------------------
 * تقيس ما يراه المزارع فعلاً في كروم حقيقي: الشاشة تفتح، شبكة المحاصيل
 * تكتمل بعدد الحزمة، النقر يُخرج البطاقات، ملف المزرعة يُظهر الإرشاد
 * المخفي بعدّاده، ثم مسار D61 الجديد: محصول ← نوع إصابة ← بطاقات مرقّمة
 * بمظاهر الإصابة وعلاجها ومصدرها، وقائمة مرجعية صريحة لبقية آفات EPPO.
 * أي خطأ JavaScript أثناء ذلك = فشل (لا شاشة صامتة في الإنتاج).
 * تشغيل: node tests/advice-browser.test.mjs [baseUrl]
 *   (بلا وسيط: يُشغّل tests/static-server.mjs بنفسه على 127.0.0.1:8080 ثم يقتله)
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const argBase = process.argv[2];
const BASE = (argBase || 'http://127.0.0.1:8080').replace(/\/$/, '');
const MF = JSON.parse(readFileSync(join(root, 'data/advice/manifest.json'), 'utf8'));

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

let srv = null;
if (!argBase) {
  srv = spawn('node', ['tests/static-server.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    try { const r = await fetch(BASE + '/'); ready = r.ok; }
    catch (e) { await sleep(250); }
  }
  if (!ready) { console.log('FAIL static server did not start'); process.exit(1); }
}

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
    crops: document.querySelectorAll('#adviceCrops .crop-chip').length,
    search: !document.getElementById('adviceCropSearch').hidden,
    typesHidden: document.getElementById('adviceTypesCard').hidden
  }));
  check('the advice view opens with its heading', head.h1.trim().length > 0, head.h1);
  check('the farm profile carries all six modifiers with real choices',
    head.fields === 6 && head.opts.every(n => n >= 3), JSON.stringify(head));
  check('the crop grid lists every crop in the pack',
    head.crops === MF.crops.length, head.crops + ' ≠ ' + MF.crops.length);
  check('a big pack shows the crop search and hides the type step until a crop is chosen',
    head.search === true && head.typesHidden === true, JSON.stringify(head));

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

  /* 5) اللغة الإنجليزية تتبدّل فعلاً (بطاقات يدوية + إصابات) */
  await page.select('#langSelect', 'en');
  await sleep(900);
  const en = await page.evaluate(() => ({
    nav: (document.querySelector('[data-nav="advice"] span:last-child') || {}).textContent || '',
    langnote: document.querySelectorAll('#adviceCards .langnote, #adviceInfections .langnote').length,
    cards: document.querySelectorAll('#adviceCards .advice-card').length,
    infs: document.querySelectorAll('#adviceInfections .inf-card').length
  }));
  check('switching to English translates the chrome and keeps the cards',
    en.nav.trim() === 'Advice' && en.langnote === en.cards + en.infs && en.cards >= 1,
    JSON.stringify(en));

  /* 6) مسار D61: محصول ← نوع إصابة ← بطاقات مرقّمة بمظاهر وعلاج ومصدر */
  await page.click('[data-crop="tomato"]');
  await page.waitForSelector('#adviceTypesCard:not([hidden])', { timeout: 8000 });
  await sleep(600);
  const chips = await page.evaluate(() => ({
    n: document.querySelectorAll('#adviceTypes .type-chip').length,
    labels: [...document.querySelectorAll('#adviceTypes .type-chip .tt')].map(e => e.textContent || ''),
    allFirst: (document.querySelector('#adviceTypes .type-chip') || {}).getAttribute
      ? document.querySelector('#adviceTypes .type-chip').getAttribute('data-type') : ''
  }));
  check('choosing tomato opens the infection-type step with translated chips',
    chips.n >= 3 && chips.allFirst === '' && chips.labels.some(l => /Insect/.test(l)),
    JSON.stringify(chips));

  await page.click('#adviceTypes .type-chip[data-type="insect"]');
  await page.waitForSelector('#adviceInfections .inf-card', { timeout: 8000 });
  const insect = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#adviceInfections .inf-card')];
    return {
      n: cards.length,
      nums: cards.map(c => Number((c.querySelector('.inf-num') || {}).textContent || '0')),
      sym: cards.map(c => c.querySelectorAll('.inf-sec')[0]
        ? c.querySelectorAll('.inf-sec')[0].querySelectorAll('li').length : 0),
      trt: cards.map(c => c.querySelectorAll('.inf-sec')[1]
        ? c.querySelectorAll('.inf-sec')[1].querySelectorAll('li').length : 0),
      srcs: cards.map(c => (c.querySelector('.inf-src a') || {}).href || ''),
      ev: cards.filter(c => c.querySelector('.ev')).length
    };
  });
  check('insect cards are numbered 1..N with symptoms and treatment',
    insect.n >= 2 &&
    insect.nums.every((v, i) => v === i + 1) &&
    insect.sym.every(x => x >= 2) && insect.trt.every(x => x >= 1),
    JSON.stringify({ n: insect.n, nums: insect.nums.slice(0, 5), sym: insect.sym.slice(0, 5) }));
  check('every infection card cites a real https source with an evidence chip',
    insect.srcs.every(h => h.startsWith('https://')) && insect.ev === insect.n,
    JSON.stringify({ srcs: insect.srcs.slice(0, 2), ev: insect.ev, n: insect.n }));

  const ref = await page.evaluate(() => {
    const det = document.querySelector('#adviceInfections .inf-ref');
    if (!det) return { open: false };
    const sum = (det.querySelector('summary') || {}).textContent || '';
    return {
      open: true, sum,
      items: det.querySelectorAll('.inf-ref-list li').length,
      links: [...det.querySelectorAll('.inf-ref-list a')].map(a => a.getAttribute('href') || '')
        .filter(h => h.startsWith('https://gd.eppo.int/taxon/')).length
    };
  });
  check('the EPPO reference list renders with its count and EPPO links',
    ref.open && /\(\d+\)/.test(ref.sum) && ref.items >= 1 && ref.links === ref.items,
    JSON.stringify(ref));

  await page.click('#adviceTypes .type-chip[data-type=""]');
  await sleep(400);
  const all = await page.evaluate(() => document.querySelectorAll('#adviceInfections .inf-card').length);
  check('"All" shows the cards of every type together', all > insect.n,
    all + ' ≤ ' + insect.n);

  /* 7) صفر أخطاء JavaScript على الشاشة كلها */
  check('no page errors while using the advice view', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('the advice smoke run completes', false, e.message);
} finally {
  await browser.close();
  if (srv) srv.kill('SIGTERM');
}

/* 8) نغمة التحديث موصولة في المسارين (فحص ساكن يكمّل الحيّ) */
const appSrc = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
check('the update chime is wired at both banner sites',
  (appSrc.match(/playUpdateChime\(\);/g) || []).length === 2 && /function playUpdateChime/.test(appSrc));

console.log('\nADVICE-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
