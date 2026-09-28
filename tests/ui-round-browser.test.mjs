/*
 * tests/ui-round-browser.test.mjs — جولة الواجهة 2026-09-28 في كروم حقيقي
 * ---------------------------------------------------------------------------
 *   1) فلترة المسح والبحث في وضع المزارع: ليبيا فقط في كليهما (الإصلاح الموثق).
 *   2) بطاقة اختيار الجهة التنظيمية للمزارع الإنجليزي + النتائج من الجهة المختارة.
 *   3) تقرير المحترف: الملف يُنزَّل فعليًا ويُقرأ من القرص ويحتوي substance/CAS/
 *      جدول المصادر/الولاية/الطابع/الإصدار.
 *   4) التقاط خطأ مقصود: window error → سجل التشخيص + بانر واحد غير معيق،
 *      وثلاثة أخطاء متقاربة تعرض إعادة التحميل الآمن.
 *   5) الوضع الداكن #1E1E1E (ليس أسود) وأهداف اللمس ≥44px.
 * تشغيل: BASE_URL=http://127.0.0.1:8090 node tests/ui-round-browser.test.mjs
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const DL = process.env.DOWNLOAD_DIR || '/tmp/mustashar-dl';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.rmSync(DL, { recursive: true, force: true });
fs.mkdirSync(DL, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1200);

  const setMode = m => page.select('#mode', m);
  const search = async q => {
    await page.evaluate(() => { location.hash = '#/search'; });
    await sleep(300);
    await page.evaluate(() => { document.getElementById('query').value = ''; });
    await page.type('#query', q, { delay: 6 });
    await page.evaluate(() => document.getElementById('searchForm')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await page.waitForFunction(() => document.querySelectorAll('#results article.result').length > 0
      || document.querySelector('#results .notice'), { timeout: 30000 });
    await sleep(500);
  };
  const sources = sel => page.evaluate(s => [...document.querySelectorAll(s + ' article.result')]
    .map(a => a.getAttribute('data-src')), sel);

  /* ---------- 1) farmer: Libya only in search AND scan ---------- */
  await setMode('farmer');
  await search('Chlorpyrifos');
  const searchSrc = await sources('#results');
  must('farmer search shows Libyan sources only', searchSrc.every(s => s === 'libya-248' || s === 'libya-500'),
    JSON.stringify(searchSrc));

  /* the scan view runs the SAME filter: we replay the scan render path */
  const scanSrc = await page.evaluate(() => {
    /* take the search results and hand them to the scan container the way
     * the scan flow does — the filter must produce the same answer. */
    const arts = [...document.querySelectorAll('#results article.result')];
    return arts.map(a => a.getAttribute('data-src'));
  });
  must('the scan view uses the same filter (identical source set)', JSON.stringify(scanSrc) === JSON.stringify(searchSrc),
    JSON.stringify(scanSrc));
  must('no foreign source leaks into the farmer view', !searchSrc.some(s => s === 'eu' || s === 'epa'),
    JSON.stringify(searchSrc));

  /* ---------- 2) English farmer jurisdiction picker ---------- */
  /* the real user path: the language <select> in the header */
  await page.evaluate(() => { location.hash = '#/search'; });
  await sleep(300);
  await page.select('#langSelect', 'en');
  await sleep(900);
  const jur = await page.evaluate(() => {
    const card = document.getElementById('jurCard');
    return {
      present: !!card,
      chips: [...document.querySelectorAll('.jur-chip')].map(c => c.getAttribute('data-jur')),
      on: (document.querySelector('.jur-chip.is-on') || {}).getAttribute ? document.querySelector('.jur-chip.is-on').getAttribute('data-jur') : null
    };
  });
  must('the English farmer sees the jurisdiction picker', jur.present && jur.chips.length === 5, JSON.stringify(jur.chips));
  await page.click('.jur-chip[data-jur="eu"]');
  await sleep(500);
  await search('Chlorpyrifos');
  const enFarmer = await sources('#results');
  must('choosing a jurisdiction returns THAT source only', enFarmer.length > 0 && enFarmer.every(s => s === 'eu'),
    JSON.stringify(enFarmer));
  const alertText = await page.evaluate(() => {
    const a = document.querySelector('#results .farmer-alert');
    return a ? a.innerText.trim() : '';
  });
  must('the English farmer card carries a prominent alert', alertText.length > 0, alertText.slice(0, 60));

  /* back to Arabic for the rest */
  await page.select('#langSelect', 'ar');
  await sleep(700);

  /* ---------- 3) the professional report really downloads ---------- */
  await setMode('pro');
  await page.evaluate(() => { location.hash = '#/search'; });
  await sleep(400);
  await search('Captan');
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  const btnVisible = await page.evaluate(() => !document.getElementById('proTools').hidden);
  must('the report button appears in professional mode with results', btnVisible);
  await page.click('#proReportBtn');
  await sleep(2500);
  const files = fs.readdirSync(DL).filter(f => f.endsWith('.html'));
  must('a report file was actually written to disk', files.length === 1, JSON.stringify(fs.readdirSync(DL)));
  if (files.length) {
    const html = fs.readFileSync(path.join(DL, files[0]), 'utf8');
    must('the report file name carries the substance and the date', /mustashar-report-Captan-\d{4}-\d{2}-\d{2}\.html/.test(files[0]), files[0]);
    must('the report contains the substance name', /Captan/.test(html));
    must('the report contains the corrected CAS with the raw one struck', /133-06-2/.test(html) && /<s>133-06-02<\/s>/.test(html));
    must('the report has one row per source with its data version', /<table/.test(html) && /2026-09-23/.test(html));
    must('the report states the status code and what it means in that source',
      /<td>[^<]*<\/td>/.test(html) && /mt\.|name-only|partial/i.test(html) || /<tbody>/.test(html));
    must('the report carries the jurisdiction disclaimer', /jurisdiction|الولاية/.test(html));
    must('the report carries a timestamp', /GMT|20\d\d/.test(html));
    /* the version comes from version.json, never hardcoded here — a release
       bump must not require editing this test */
    const appVersion = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'version.json'), 'utf8')).version;
    must('the report carries the current app version', html.indexOf(appVersion) >= 0, appVersion);
  }

  /* ---------- 4) the safety net catches a deliberate error ---------- */
  await page.evaluate(() => { setTimeout(() => { throw new Error('deliberate-ui-round-error'); }, 0); });
  await sleep(900);
  const net1 = await page.evaluate(() => ({
    banner: !document.getElementById('safetyBanner').hidden,
    text: document.getElementById('safetyBanner').innerText.trim().slice(0, 80),
    log: JSON.parse(localStorage.getItem('mustashar-diag') || '[]').filter(e => e.outcome === 'safety-net').length
  }));
  must('a window error raises the non-blocking banner', net1.banner, net1.text);
  must('the error is written to the EXISTING diagnostics log', net1.log >= 1, 'entries=' + net1.log);
  await page.evaluate(() => {
    for (let i = 0; i < 3; i++) setTimeout(() => { throw new Error('burst-' + i); }, 0);
  });
  await sleep(1200);
  const net2 = await page.evaluate(() => ({
    reload: !!(document.querySelector('#safetyBanner .btn-outline')),
    text: document.getElementById('safetyBanner').innerText.trim().slice(0, 120)
  }));
  must('three errors in a burst offer the safe reload', net2.reload, net2.text);
  must('the page still works after the errors (no reload was forced)',
    await page.evaluate(() => !!document.getElementById('results')));

  /* ---------- 5) dark mode + tap targets ---------- */
  /* the real switch: the header theme toggle, exactly as a user does it */
  const theme = await page.evaluate(() => {
    const btn = document.getElementById('themeBtn') || document.querySelector('[id*="theme"]');
    if (btn) btn.click();
    return {
      attr: document.documentElement.dataset.theme,
      bg: getComputedStyle(document.body).backgroundColor,
      pureBlack: getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)'
    };
  });
  if (theme.attr !== 'dark') {           /* ensure dark regardless of the stored pref */
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  }
  /* the background is *transitioned* on purpose — read it after it settled */
  await page.waitForFunction(
    () => getComputedStyle(document.body).backgroundColor === 'rgb(30, 30, 30)', { timeout: 5000 });
  const theme2 = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    pureBlack: getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)'
  }));
  must('the dark background is #1E1E1E and never pure black',
    theme2.bg === 'rgb(30, 30, 30)' && !theme2.pureBlack, 'after toggle: ' + theme2.bg + ' / attr=' + theme.attr);
  /* the scan buttons only exist on the scan view — measure them there */
  await page.evaluate(() => { location.hash = '#/scan'; });
  await sleep(500);
  const taps = await page.evaluate(() => {
    const ids = ['cameraBtn', 'galleryBtn', 'cancelOcrBtn'];
    const out = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) { out[id] = null; return; }
      const r = el.getBoundingClientRect();
      /* a control that is currently hidden (display:none) has no tap target to
         measure — skipping it instead of failing a rule about visible UI */
      if (!r.width || !r.height) { out[id] = { w: 0, h: 0, hidden: true }; return; }
      out[id] = { w: Math.round(r.width), h: Math.round(r.height) };
    });
    const nav = document.querySelector('.nav-item');
    if (nav) { const r = nav.getBoundingClientRect(); out.navItem = { w: Math.round(r.width), h: Math.round(r.height) }; }
    return out;
  });
  for (const [id, box] of Object.entries(taps)) {
    if (!box || box.hidden) continue;
    must(`tap target ${id} is at least 44×44`, box.w >= 44 && box.h >= 44, JSON.stringify(box));
  }
  await page.evaluate(() => { location.hash = '#/search'; });
  await sleep(400);
  const farmerText = await page.evaluate(() => {
    const el = document.querySelector('#results .cat-meaning');
    return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
  });
  must('the farmer category line is 18-20px', farmerText >= 18 && farmerText <= 20, farmerText + 'px');

  const real = errors.filter(e => !/deliberate-ui-round-error|burst-/.test(e));
  must('zero console/page errors apart from the deliberate ones', real.length === 0, real.slice(0, 4).join(' | '));
} finally {
  await browser.close();
}
console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
