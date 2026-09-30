/*
 * tests/poster-qr.test.mjs — الرمز في البوستر يُفكّ بفكّ حقيقي
 * ---------------------------------------------------------------------------
 * المولِّد يكتب SVG داخل poster.html. الاختبار لا يثق بالنصّ المولَّد: يحمّل
 * الصفحة في كروم حقيقي، يحوّل الرمز المرسوم إلى صورة نقطية، ثم يمرّرها إلى
 * **طبقة zxing نفسها المستعملة في التطبيق** (مُورَّدة محلياً، بلا CDN). ما يخرج
 * من الفكّ يُقارن حرفاً بحرف برابط النشر الحي.
 *
 * تشغيل: node tests/poster-qr.test.mjs [baseUrl]   (افتراضياً 127.0.0.1:8080)
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');
const LIVE_URL = 'https://al-mustashar.pages.dev';

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
try {
  const page = await browser.newPage();
  const errors = [], netFails = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) netFails.push(r.status() + ' ' + r.url()); });

  const markup = await (await fetch(BASE + '/poster.html')).text();
  check('poster.html has no script tag (print-safe, CSP-clean)', !/<script/i.test(markup));
  check('the poster shows the app name, the one-line promise and the licence footer',
    markup.includes('المستشار الزراعي')
    && markup.includes('صوّر ملصق المبيد فاعرف حكمه — يعمل دون إنترنت')
    && markup.includes('AGPLv3'));
  check('the poster carries no private operational data (no address, no channel)',
    !/mailto:|whatsapp|wa\.me|tel:/i.test(markup));
  check('the QR is an inline SVG, not an external image',
    /<svg[^>]*viewBox/.test(markup) && !/<img\b/i.test(markup));

  const resp = await page.goto(BASE + '/poster.html', { waitUntil: 'networkidle0', timeout: 30000 });
  check('poster.html answers 200 on the served origin', resp && resp.status() === 200,
    'HTTP ' + (resp && resp.status()));
  check('poster.html loads with zero console errors and zero failed requests',
    errors.length === 0 && netFails.length === 0, (errors.concat(netFails)).slice(0, 2).join(' | '));

  /* رسترة الرمز المرسوم ثم فكّه بطبقة zxing نفسها */
  const decoded = await page.evaluate(async () => {
    const svg = document.querySelector('.qr svg');
    if (!svg) return { error: 'no-svg' };
    const box = svg.viewBox.baseVal;
    const scale = 10;
    const inner = new XMLSerializer().serializeToString(svg);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(inner);
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im); im.onerror = () => rej(new Error('svg-render-failed'));
      im.src = url;
    });
    const c = document.createElement('canvas');
    c.width = box.width * scale; c.height = box.height * scale;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));

    const lib = await fetch('src/vendor/zxing-reader.min.js').then(r => r.text());
    const wasmUrl = new URL('src/vendor/zxing_reader.wasm', location.href).href;
    const boot = lib + '\n;ZXingWASM.setZXingModuleOverrides({locateFile:function(p){'
      + 'return p.slice(-5)===".wasm"?' + JSON.stringify(wasmUrl) + ':p;}});\n'
      + 'self.onmessage=function(e){var d=e.data;'
      + 'ZXingWASM.readBarcodes(d.blob,{tryHarder:true,tryRotate:true,tryInvert:true,'
      + 'tryDownscale:true,maxNumberOfSymbols:3}).then(function(ms){'
      + 'self.postMessage({codes:ms.map(function(m){return{text:m.text,format:m.format};})});'
      + '},function(err){self.postMessage({error:String(err&&err.message||err)});});};';
    const w = new Worker(URL.createObjectURL(new Blob([boot], { type: 'text/javascript' })));
    return await new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error('decode-timeout')), 20000);
      w.onmessage = e => { clearTimeout(timer); res(e.data); };
      w.onerror = () => { clearTimeout(timer); rej(new Error('worker-error')); };
      w.postMessage({ blob: blob });
    });
  });

  check('a real decoder read the poster QR',
    !decoded.error && decoded.codes && decoded.codes.length > 0,
    JSON.stringify(decoded).slice(0, 120));
  const text = (decoded.codes && decoded.codes[0] && decoded.codes[0].text) || '';
  check('the decoded text is EXACTLY the live publication URL, character for character',
    text === LIVE_URL, 'decoded=' + JSON.stringify(text));
} finally {
  await browser.close();
}

console.log('==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
