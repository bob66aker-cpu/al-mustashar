/*
 * tests/stage-b-browser.test.mjs — المرحلة ب/ج (2026-09-25) قياس في متصفح حقيقي
 * ------------------------------------------------------------------------------
 * Chromium حقيقي (puppeteer-core) مع جهاز كاميرا وهمي:
 *   - window.ScanLive كامل الوجود (واجهة المسار الحي).
 *   - الفحص الرخيص يقيس فعلًا: لوحة نص اصطناعية تجتاز، لوحة فارغة تُرفض
 *     (نفس منهجية docs/ocr-arabic-hallucination-diagnosis.md).
 *   - ج (قياس حقيقي بمسح حقيقي عبر ocr.js نفسه): أثناء قراءة فعّالة لا يغادر
 *     المستخدم شاشة المسح، وفور انتهاء القراءة يصبح التنقل حرًا تمامًا.
 *   - زر الكاميرا يبدأ البث الحي فعلًا (getUserMedia) ويظهر الإطار الإرشادي.
 *   - أ1: بدء الكاميرا الحية يمسح نتائج مسح سابق فورًا.
 *   - «إيقاف الكاميرا» يوقف البث ويعيد حالة الاستعداد بلا إعادة تحميل.
 * Run: node tests/stage-b-browser.test.mjs   (CHROME/BASE_URL env or defaults)
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const PORT = Number(process.env.PORT_B || 8091);
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.gz': 'application/gzip' };

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* tiny static server rooted at the project (no python, no external deps) */
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (p === '/' || p === '/index.html') p = '/index.html';
  const fp = join(ROOT, p);
  if (!existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
  res.end(readFileSync(fp));
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

let browser;
try {
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar',
           '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
           '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 900 });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));

  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction('!!window.ScanLive && !!window.OcrModule && !!window.SearchCore', { timeout: 20000 });

  /* ---------- واجهة المسار الحي موجودة ---------- */
  const api = await page.evaluate(() => ({
    scanLive: typeof window.ScanLive,
    fns: ['deviceClass', 'PROFILE', 'frameMetrics', 'cheapPass', 'sharpnessScore', 'cropROI', 'drawGuide', 'roiRect', 'grabFull', 'canvasToBlob']
      .map(k => typeof window.ScanLive[k]).join(',')
  }));
  check('ScanLive exposes the live-path API', api.scanLive === 'object'
    && api.fns.split(',').every(t => t !== 'undefined'), api.fns);

  /* ---------- الفحص الرخيص يقيس فعلًا (نص يُقبل / فارغ يُرفض) ---------- */
  const gates = await page.evaluate(() => {
    const mk = fill => {
      const c = document.createElement('canvas'); c.width = 200; c.height = 120;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 200, 120);
      fill(g);
      return window.ScanLive.frameMetrics(c);
    };
    const text = mk(g => { g.fillStyle = '#000'; for (let x = 4; x < 196; x += 14) g.fillRect(x, 40, 6, 40); });
    const blank = mk(() => {});
    return { textP: window.ScanLive.cheapPass(text), textLap: +text.lap.toFixed(1),
             blankP: window.ScanLive.cheapPass(blank), blankLap: +blank.lap.toFixed(1) };
  });
  check('cheap pre-check accepts a synthetic text panel (measured)', gates.textP, JSON.stringify(gates));
  check('cheap pre-check rejects a blank panel (measured)', !gates.blankP && gates.blankLap < gates.textLap, JSON.stringify(gates));

  /* ---------- ج: حماية القراءة الجارية (مسح حقيقي بملصق اصطناعي) ---------- */
  await page.evaluate(() => { location.hash = '#/scan'; });
  await sleep(300);
  /* feed a REAL file through the gallery input: canvas → PNG File → DataTransfer */
  await page.evaluate(() => new Promise(resolve => {
    const c = document.createElement('canvas'); c.width = 800; c.height = 300;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 800, 300);
    g.fillStyle = '#000000'; g.font = 'bold 48px sans-serif'; g.textBaseline = 'middle';
    g.fillText('Glyphosate', 60, 90);
    g.fillText('62-51-9', 60, 190);
    c.toBlob(b => {
      const f = new File([b], 'synthetic-label.png', { type: 'image/png' });
      const dt = new DataTransfer(); dt.items.add(f);
      const inp = document.querySelector('#gallery');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      resolve();
    }, 'image/png');
  }));
  /* the change handler runs synchronously: ocrBusy is already true here */
  const activeNow = await page.evaluate(() => document.querySelector('#cancelOcrBtn').hidden === false);
  check('read is active right after choosing an image (precondition for ج)', activeNow);
  await page.evaluate(() => { location.hash = '#/home'; });
  await sleep(250);
  check('ج: leaving the scan view is blocked while the read is active',
    await page.evaluate(() => location.hash) === '#/scan',
    'hash=' + await page.evaluate(() => location.hash));
  /* wait for a DEFINITIVE end of the read: cancel button hidden again AND
   * auto results painted with the completion message */
  await page.waitForFunction(
    'document.querySelector("#cancelOcrBtn").hidden === true && document.querySelector("#scanResults").children.length > 0',
    { timeout: 90000, polling: 500 });
  const scanDone = await page.evaluate(() => ({
    results: document.querySelector('#scanResults').children.length,
    msg: document.querySelector('#ocrMsg').textContent.trim().slice(0, 120)
  }));
  check('real OCR completed through the unchanged pipeline (auto results in scan view)',
    scanDone.results > 0, JSON.stringify(scanDone));
  await page.evaluate(() => { location.hash = '#/home'; });
  await sleep(250);
  check('ج: navigation is free again the moment the read finishes',
    await page.evaluate(() => location.hash) === '#/home',
    'hash=' + await page.evaluate(() => location.hash));

  /* ---------- أ1 + الإيقاف: الكاميرا الحية تبدأ وتمسح النتائج القديمة ---------- */
  await page.evaluate(() => { location.hash = '#/scan'; });
  await sleep(250);
  await page.evaluate(() => {
    document.querySelector('#scanResults').innerHTML = '<div class="row"><div>stale</div></div>';
  });
  check('stale result present before live start (precondition)',
    await page.evaluate(() => document.querySelector('#scanResults').textContent.includes('stale')));
  await page.click('#cameraBtn');
  await page.waitForFunction('!!document.querySelector("#liveVideo").srcObject && !document.querySelector("#liveSection").hidden', { timeout: 15000 });
  check('camera button starts a REAL live stream (getUserMedia + guide visible)',
    await page.evaluate(() => !!document.querySelector('#liveVideo').srcObject));
  check('أ1: starting the live camera cleared the stale result instantly',
    await page.evaluate(() => !document.querySelector('#scanResults').textContent.includes('stale')));

  /* ---------- إيقاف الكاميرا يعيد حالة الاستعداد ---------- */
  await page.click('#liveStopBtn');
  await sleep(300);
  const afterStop = await page.evaluate(() => ({
    stream: !!document.querySelector('#liveVideo').srcObject,
    sectionHidden: document.querySelector('#liveSection').hidden,
    camVisible: !document.querySelector('#cameraBtn').hidden
  }));
  check('stop button ends the stream and restores the ready state (no reload)',
    !afterStop.stream && afterStop.sectionHidden && afterStop.camVisible, JSON.stringify(afterStop));

  check('no page errors during the whole flow', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));
} finally {
  if (browser) await browser.close().catch(() => {});
  server.close();
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
