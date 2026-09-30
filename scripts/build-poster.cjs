#!/usr/bin/env node
/*
 * scripts/build-poster.cjs — البوستر (ورقة A4 للطباعة)
 * ---------------------------------------------------------------------------
 * يولّد poster.html في جذر المستودع: صفحة ثابتة بلا جافاسكربت، فيها رمز QR
 * كبيروجملة واحدة وتذييل الترخيص.
 *
 * principles:
 *  - الترميز يتم بالمُرمِّز المُورَّد في المستودع نفسه
 *    (src/vendor/qrcodegen.js — MIT) عبر vm: **لا CDN ولا شبكة إطلاقاً**.
 *    تشغيل السكربت بلا إنترنت ينتج نفس الملف حرفاً.
 *  - الرمز يحمل **رابط النشر الحي فقط**. لا اسم بريد ولا قناة ولا رقم ولا أي
 *    بيانات تشغيلية.
 *  - الناتج ساكن: SVG مُضمَّن (بلا <img> خارجي وبلا سكربت) حتى يعمل على أي
 *    طابعة ومن أي متصفح، ويمرّ من CSP بلا استثناء.
 *
 * التشغيل:  node scripts/build-poster.cjs [--url https://…] [--out poster.html]
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const arg = (flag, dflt) => (process.argv.includes(flag)
  ? process.argv[process.argv.indexOf(flag) + 1]
  : dflt);

const APP_URL = arg('--url', 'https://al-mustashar.pages.dev');
const OUT = path.resolve(ROOT, arg('--out', 'poster.html'));
const SOURCE_URL = 'https://github.com/bob66aker-cpu/al-mustashar/tree/work-branch';

/* ---------- المُرمِّز المُورَّد (بلا CDN) ---------- */
function loadEncoder() {
  const file = path.join(ROOT, 'src', 'vendor', 'qrcodegen.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  if (!sandbox.qrcodegen || !sandbox.qrcodegen.QrCode) {
    throw new Error('qrcodegen did not expose QrCode');
  }
  return sandbox.qrcodegen;
}

/* ---------- الرمز إلى SVG ---------- */
function qrSvg(qrcodegen, text, opts) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const quiet = opts.quiet || 4;
  const dim = qr.size + quiet * 2;
  let d = '';
  for (let y = 0; y < qr.size; y++) {
    let x = 0;
    while (x < qr.size) {
      if (!qr.getModule(x, y)) { x++; continue; }
      let w = 1;
      while (x + w < qr.size && qr.getModule(x + w, y)) w++;
      d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h' + w + 'v1h-' + w + 'z';
      x += w;
    }
  }
  return {
    version: qr.version,
    size: qr.size,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" '
      + 'shape-rendering="crispEdges" role="img" aria-label="QR">'
      + '<rect width="' + dim + '" height="' + dim + '" fill="#ffffff"/>'
      + '<path d="' + d + '" fill="#121e18"/></svg>'
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const enc = loadEncoder();
const qr = qrSvg(enc, APP_URL, { quiet: 4 });

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>بوستر — المستشار الزراعي</title>
<meta name="description" content="ورقة طباعة A4 تحمل رمز QR للتطبيق ورابطه.">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<style>
  /* A4 = 210×297mm. الهوامش مقصودة للطابعة المنزلية. */
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, system-ui, sans-serif;
    background: #eef2ef; color: #121e18; print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  .sheet {
    width: 186mm; min-height: 273mm; margin: 10mm auto; background: #ffffff;
    border: 1px solid #d6ded9; border-radius: 4mm; padding: 16mm 14mm;
    display: flex; flex-direction: column; gap: 6mm; text-align: center;
  }
  .mark { width: 26mm; height: 26mm; margin: 0 auto; border-radius: 50%;
          background: #1f6b45; color: #ffffff; display: flex; align-items: center;
          justify-content: center; font-size: 15mm; line-height: 1; }
  h1 { font-size: 30pt; line-height: 1.25; color: #14512f; }
  .latin { font-size: 11pt; letter-spacing: .18em; color: #5a6b62; direction: ltr; }
  .lead { font-size: 16pt; line-height: 1.6; color: #1d2a23; font-weight: 600; }
  .qr { width: 108mm; height: 108mm; margin: 2mm auto 0; }
  .qr svg { width: 100%; height: 100%; }
  .url { font-size: 11pt; color: #3c4a43; direction: ltr; letter-spacing: .02em;
         border-top: 1px dashed #c3cdc7; padding-top: 4mm; word-break: break-all; }
  .langs { display: flex; justify-content: center; gap: 6mm; flex-wrap: wrap;
           font-size: 11pt; color: #37463e; border-top: 1px solid #e2e9e5; padding-top: 4mm; }
  .langs span { padding: 1mm 3mm; border: 1px solid #cfdad3; border-radius: 2mm; }
  .foot { margin-top: auto; font-size: 9pt; color: #55635b; line-height: 1.7;
          border-top: 1px solid #e2e9e5; padding-top: 4mm; direction: ltr; }
  .foot a { color: #1f6b45; word-break: break-all; }
  .note { font-size: 8.5pt; color: #6b7970; }
  .screen-hint { width: 186mm; margin: 0 auto 8mm; font-size: 9pt; color: #5a6b62; }
  @media print {
    body { background: #ffffff; }
    .screen-hint { display: none; }
    .sheet { margin: 0; border: 0; width: auto; min-height: auto; }
  }
</style>
</head>
<body>
<p class="screen-hint">للطباعة: Ctrl/Cmd + P ثم اختر A4 بلا هوامش متصفح. لاScaling.</p>
<div class="sheet">
  <div class="mark" aria-hidden="true">&#9679;</div>
  <h1>المستشار الزراعي</h1>
  <p class="latin">AGRICULTURAL ADVISOR</p>
  <p class="lead">صوّر ملصق المبيد فاعرف حكمه — يعمل دون إنترنت</p>
  <div class="qr">${qr.svg}</div>
  <p class="url">${esc(APP_URL)}</p>
  <p class="langs" aria-label="languages">
    <span>العربية</span><span>English</span><span>Français</span><span>中文</span>
  </p>
  <div class="foot">
    <p>رخصة برمجيات حرّة: GNU AGPLv3</p>
    <p>شيفرة هذا الإصدار: <a href="${esc(SOURCE_URL)}">${esc(SOURCE_URL)}</a></p>
    <p class="note">مساندة معلوماتية — الحكم الملزم هو نص القرار الرسمي.</p>
  </div>
</div>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
const st = fs.statSync(OUT);
console.log('WROTE ' + path.relative(ROOT, OUT) + '  ' + st.size + ' bytes');
console.log('  qr version=' + qr.version + ' modules=' + qr.size + '  payload=' + APP_URL);
