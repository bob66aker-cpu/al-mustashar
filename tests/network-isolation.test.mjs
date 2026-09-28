/*
 * tests/network-isolation.test.mjs — الحارس الدائم لشبكة التطبيق
 * ---------------------------------------------------------------
 * هذا الاختبار هو الإثبات الحاسم لقاعدة المشروع: «لا اتصال بأي نطاق خارجي
 * أثناء التشغيل». وهو لا يفحص الكود ولا يثق بالمسح الآلي — بل يشغّل التطبيق
 * في كروم حقيقي، ويعترض كل طلب على مستوى الشبكة، ويسمح فقط لنطاق self،
 * ثم يجري جولة استخدام كاملة: بحث نصي + بحث برقم CAS + مسح صورة من المعرض
 * + تصدير التقرير. أي طلب خارج النطاق — بما فيه نطاق منصة التنفيذ — يوقف
 * الاختبار.
 *
 * ما لا يغطيه الاختبار (مذكور صراحةً في docs/security-audit.md): هو يفحص
 * Chromium على هذا الجهاز؛ ولا يستطيع إثبات ما يفعله محرك آخر على هاتف
 * المزارع. لكنه يمنع أي تسريب مستقبلي في الكود المُشحن.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log('PASS ' + label + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const origin = new URL(BASE).origin;
const isNetwork = u => /^(https?|wss?|ftp):/i.test(u);
const isSelf = u => { try { return new URL(u, BASE).origin === origin; } catch (e) { return false; } };

/* forbidden by name as well as by origin: a leak that names the platform
 * must fail even if it somehow resolved to our own origin */
const FORBIDDEN = /daytona|codebuff|freebuff|proxy01|google-analytics|googletagmanager|doubleclick|facebook|cdn\.jsdelivr|unpkg|esm\.sh|bcebos/i;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream',
         '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  protocolTimeout: 600000,
});

const external = [];
const allowed = [];
try {
  await browser.defaultBrowserContext().overridePermissions(BASE, ['camera']);
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 900, isMobile: true, hasTouch: true });

  /* the decision point: abort anything that is not same-origin, and record it */
  await page.setRequestInterception(true);
  const local = [];
  page.on('request', req => {
    const u = req.url();
    if (!isNetwork(u)) { local.push(u.slice(0, 24)); req.continue().catch(() => {}); return; }  /* blob:/data:/about: */
    if (isSelf(u)) { allowed.push(u); req.continue().catch(() => {}); }
    else { external.push(u); req.abort().catch(() => {}); }
  });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message || e)));

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);

  ok(await page.evaluate(() => !!document.querySelector('#query')), 'the app shell is up');

  /* the page must have declared the policy that makes this possible */
  const csp = await page.evaluate(() => {
    const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return m ? m.getAttribute('content') : null;
  });
  ok(!!csp && /connect-src 'self'/.test(csp), 'the page ships connect-src \'self\'', csp ? 'found' : 'MISSING');
  ok(!!csp && /script-src 'self'/.test(csp), 'the page ships script-src \'self\'');

  /* ---------- a full round of use ---------- */
  const round = await page.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = { steps: [] };
    const q = document.querySelector('#query');
    const setVal = (el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    /* 1) text search */
    setVal(q, 'Glyphosate');
    const submit = async () => {
      q.focus();
      q.value = '';
      q.dispatchEvent(new Event('input', { bubbles: true }));
      q.value = out.__next;
      q.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    };
    out.__next = 'Glyphosate';
    await submit();
    submit();
    await sleep(1500);
    out.steps.push({ step: 'search-text', results: document.querySelectorAll('#results .result, #results .card').length });

    /* 2) CAS search */
    setVal(q, '1071-83-6');
    out.__next = '1071-83-6';
    await submit();
    await sleep(1500);
    out.steps.push({ step: 'search-cas', results: document.querySelectorAll('#results .result, #results .card').length });

    /* 2b) an injection attempt through the only user-typed string that is
     * rendered back — the audit must also prove the app does not execute it */
    out.__next = '<img src=x onerror="window.__pwned=1">';
    await submit();
    await sleep(1200);
    out.steps.push({ step: 'injection-probe', pwned: !!window.__pwned, imgs: document.querySelectorAll('#results img').length });

    /* 3) scan a picture from the gallery — the OCR path end to end */
    const c = document.createElement('canvas');
    c.width = 900; c.height = 620;
    const g = c.getContext('2d');
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, 900, 620);
    g.fillStyle = '#111';
    g.font = 'bold 34px "DejaVu Sans", Arial, sans-serif';
    g.fillText('MAXXPRO 480 SC', 30, 60);
    g.font = '24px "DejaVu Sans", Arial, sans-serif';
    g.fillText('ACTIVE INGREDIENT:', 30, 120);
    g.fillText('Glyphosate 41%', 30, 160);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'audit-label.png', { type: 'image/png' });
    location.hash = '#/scan';
    await sleep(400);
    const input = document.querySelector('#gallery');
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      /* the engine needs real seconds; the guard is the network, not the OCR */
      for (let i = 0; i < 40 && !document.querySelector('#ocrMsg'); i++) await sleep(300);
      for (let i = 0; i < 40; i++) {
        await sleep(1000);
        const msg = (document.querySelector('#ocrMsg') || {}).textContent || '';
        if (/تم|اكتملت|نتائج|تحليل|قراءة/i.test(msg) && !/جارٍ/.test(msg)) break;
      }
    }
    out.steps.push({ step: 'scan-image', hasInput: !!input, msg: (document.querySelector('#ocrMsg') || {}).textContent || '' });

    /* 4) export a report — the one documented local export */
    let exported = null;
    const before = document.querySelectorAll('a[download]').length;
    const btn = document.querySelector('#proReportBtn');
    if (btn) {
      const orig = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download) { exported = { name: this.download, href: String(this.href).slice(0, 12) }; return; }
        return orig.apply(this, arguments);
      };
      btn.click();
      await sleep(600);
      HTMLAnchorElement.prototype.click = orig;
    }
    out.steps.push({ step: 'export-report', button: !!btn, exported, anchorsBefore: before });

    /* 5) QR: the modal builds a canvas locally */
    const qrBtn = document.querySelector('#qrBtn');
    if (qrBtn) { qrBtn.click(); await sleep(500); }
    out.steps.push({ step: 'qr-modal', open: !!(document.querySelector('#qrModal') && !document.querySelector('#qrModal').hidden) });
    if (qrBtn) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }

    return out;
  });

  for (const s of round.steps) console.log('  · ' + s.step + ' ' + JSON.stringify(s));
  ok(round.steps[0].results > 0, 'the text search really returned results', String(round.steps[0].results));
  ok(round.steps[1].results > 0, 'the CAS search really returned results', String(round.steps[1].results));
  ok(round.steps[2].pwned === false, 'an <img onerror> typed into the search box is NOT executed',
    'window.__pwned=' + round.steps[2].pwned + ', injected <img> nodes=' + round.steps[2].imgs);
  ok(round.steps[3].hasInput, 'the gallery scan path was actually exercised');
  ok(round.steps[5].open, 'the QR modal opened (local canvas render)');

  /* ---------- the verdict ---------- */
  console.log('LOCAL (non-network) requests seen: ' + local.length + ' — ' + [...new Set(local)].slice(0, 3).join(', '));
  const named = external.filter(u => FORBIDDEN.test(u));
  ok(external.length === 0, 'ZERO requests left the origin during the whole round',
    external.length ? external.slice(0, 5).join(' | ') : allowed.length + ' same-origin requests allowed');
  ok(named.length === 0, 'no request named the platform or a third-party CDN',
    named.slice(0, 3).join(' | ') || 'none');
  ok(allowed.length > 0, 'the app really did load its own assets (the guard is not vacuous)',
    allowed.length + ' same-origin requests');
  ok(pageErrors.filter(e => !/ERR_FAILED|Failed to fetch|NetworkError/i.test(e)).length === 0,
    'no unexpected page errors', JSON.stringify(pageErrors).slice(0, 160));

  console.log('\nALLOWED (same-origin) sample:');
  [...new Set(allowed)].slice(0, 12).forEach(u => console.log('  ' + u.replace(origin, '')));
} finally {
  await browser.close();
}

console.log('\nNETWORK-ISOLATION: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
