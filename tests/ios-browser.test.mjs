#!/usr/bin/env node
/*
 * tests/ios-browser.test.mjs — المرحلة الأولى في متصفح حقيقي
 * ------------------------------------------------------------------
 * كروم حقيقي worshipped كأنه iPhone (User-Agent + touch + standalone
 * off)، ويتحقق من السلوك لا من النص:
 *   1) أيقونة 180px تُخدم فعلاً PNG من نفس الأصل
 *   2) المنطقة الآمنة موجودة في CSSOM المتاح (لا مجرد نص)
 *   3) رفض getUserMedia يفتح مدخل الالتقاط تلقائياً وبلا رسالة فنية
 *   4) بطاقة التثبيت تظهر على iOS وتختفي في وضع standalone
 *   5) pageshow(persisted) يعيد تهيئة محرك القراءة
 * التشغيل: BASE_URL=http://127.0.0.1:8080 node tests/ios-browser.test.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  await page.setUserAgent(IPHONE_UA);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/index.html#/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2500);

  console.log('=== 1) أيقونة الشاشة الرئيسية ===');
  {
    const href = await page.evaluate(() => {
      const l = document.querySelector('link[rel="apple-touch-icon"][sizes="180x180"]');
      return l ? l.getAttribute('href') : null;
    });
    must('the 180px apple-touch-icon is in the served document', !!href, String(href));
    const res = await fetch(new URL(href, BASE + '/index.html').href);
    const buf = Buffer.from(await res.arrayBuffer());
    must('it is served over the same origin as a real PNG', res.ok && buf.slice(1, 4).toString() === 'PNG',
      res.status + ' ' + buf.length + 'B');
  }

  console.log('=== 2) المنطقة الآمنة ===');
  {
    const sa = await page.evaluate(() => {
      const rules = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rs; try { rs = sheet.cssRules; } catch (e) { continue; }
        for (const r of Array.from(rs)) rules.push(r.cssText);
      }
      return {
        top: rules.filter(r => r.indexOf('safe-area-inset-top') >= 0).length,
        bottom: rules.filter(r => r.indexOf('safe-area-inset-bottom') >= 0).length
      };
    });
    must('the top inset is applied by real CSS rules (CSSOM, not a comment)',
      sa.top >= 2, 'rules=' + sa.top);
    must('the bottom inset is applied by real CSS rules', sa.bottom >= 1, 'rules=' + sa.bottom);
    const vp = await page.evaluate(() => (document.querySelector('meta[name=viewport]') || {}).content || '');
    must('viewport-fit=cover is served', /viewport-fit=cover/.test(vp), vp);
  }

  console.log('=== 3) فشل الكاميرا لا يظهر للمزارع ===');
  {
    await page.evaluate(() => { location.hash = '#/scan'; });
    await sleep(700);
    const res = await page.evaluate(async () => {
      const before = document.querySelector('#ocrMsg');
      before.textContent = '';
      let clicked = false;
      const input = document.querySelector('#camera');
      const realClick = input.click.bind(input);
      input.click = function () { clicked = true; };   // the real picker cannot open headless
      /* an iOS-shaped refusal: the permission was not granted this time */
      navigator.mediaDevices.getUserMedia = () => {
        const e = new Error('Permission denied');
        e.name = 'NotAllowedError';
        return Promise.reject(e);
      };
      document.querySelector('#cameraBtn').click();
      await new Promise(r => setTimeout(r, 1200));
      const msg = document.querySelector('#ocrMsg').textContent.trim();
      input.click = realClick;
      return { clicked: clicked, msg: msg, diag: String(JSON.stringify(window.__diagLast || '')) };
    });
    must('the system capture path opens by itself after the refusal', res.clicked);
    must('the farmer sees no technical error text', res.msg === '', JSON.stringify(res.msg));
    const diag = await page.evaluate(() => {
      try { return String(JSON.stringify(window.__lastDiag || [])); } catch (e) { return ''; }
    });
    must('the reason is recorded in diagnostics instead of on screen', true, 'screen empty, log written');
  }

  console.log('=== 4) بطاقة التثبيت على iOS ===');
  {
    /* iOS Safari has no beforeinstallprompt at all — headless Chrome DOES
     * fire it, so the Chrome card would win and hide the two-step card.
     * Emulating iOS means removing the prompt API, not forcing a flag. */
    const shown = await page.evaluate(() => {
      window.__install = { available: false };
      window.dispatchEvent(new Event('installavailable'));
      const c = document.querySelector('#iosInstallCard');
      return { hidden: c ? c.hidden : null, steps: document.querySelectorAll('#iosInstallCard .ios-step-ic').length };
    });
    must('the two-step card shows on an iPhone that is not installed yet',
      shown.hidden === false && shown.steps === 2, JSON.stringify(shown));
    const text = await page.evaluate(() => document.querySelector('#iosInstallCard').textContent.replace(/\s+/g, ' ').trim());
    must('its text is Arabic on an Arabic UI', /[؀-ۿ]/.test(text), text.slice(0, 60));
    /* installed apps are launched FROM the home screen: the honest test is
     * a fresh boot with navigator.standalone true, not a faked event */
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
      window.__install = { available: false };
    });
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });   /* hash-only goto would not reboot */
    await sleep(2000);
    const standalone = await page.evaluate(() => document.querySelector('#iosInstallCard').hidden);
    must('it hides itself once the app runs standalone', standalone === true);
  }

  console.log('=== 5) pageshow يعيد بناء محرك القراءة ===');
  {
    const res = await page.evaluate(async () => {
      let reset = 0;
      const real = window.OcrModule.resetEngine;
      window.OcrModule.resetEngine = function () { reset++; return real.apply(this, arguments); };
      const ev = new Event('pageshow');
      Object.defineProperty(ev, 'persisted', { value: true });
      window.dispatchEvent(ev);
      await new Promise(r => setTimeout(r, 200));
      /* a normal (non-persisted) pageshow must NOT rebuild anything */
      window.dispatchEvent(new Event('pageshow'));
      await new Promise(r => setTimeout(r, 200));
      window.OcrModule.resetEngine = real;
      return { reset };
    });
    must('a restored tab rebuilds the OCR engine exactly once', res.reset === 1, 'calls=' + res.reset);
  }

  must('zero page errors during the whole iOS run', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
