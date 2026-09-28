#!/usr/bin/env node
/*
 * tests/ocr-sharp-calibrate.mjs — معايرة عتبة الحدة عبر دالة sharpness نفسها
 * ------------------------------------------------------------------
 * القياس الأول (ocr-sharp-metrics.mjs) أعاد بناء التصغير يدوياً فاختلف
 * قليلاً عن مسار التطبيق. هنا نقيس عبر OcrModule.sharpness مباشرة على
 * المجموعة الثابتة كاملة (17 صورة حقيقية) + ملصقات اصطناعية حادة
 * وملصقات مصمَّمة ضبابية، فتكون العتبة مقيسة على الكود المشحون نفسه.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const LABELS = [
  '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
  '100.jpg', '101.jpg', '103.jpg', '105.jpg', '106.jpg',
  'images.jpg', 'images (1).jpg', 'images (2).jpg', 'images (3).jpg',
  'pesticide_test_level1_ideal.png',
  'pesticide_test_level3_damaged.png',
  'pesticide_test_level4_lowlight.png'
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 600000,
});
const page = await browser.newPage();
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1500));

const rows = [];
for (const nm of LABELS) {
  rows.push({ kind: 'real', name: nm, v: await page.evaluate(async (nm) => {
    const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent(nm), { cache: 'no-store' })).blob();
    const v = await OcrModule.sharpness(blob);
    return v === null ? null : Math.round(v * 1000) / 1000;
  }, nm) });
}

/* synthetic: a full label drawn on canvas, then blurred by 0..6 px */
for (const blur of [0, 1, 2, 3, 4, 5, 6]) {
  rows.push({ kind: 'synth', name: 'label_blur_' + blur, v: await page.evaluate(async (blur) => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 620;
    const g = c.getContext('2d');
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, 900, 620);
    g.fillStyle = '#111';
    const F = '"DejaVu Sans", Arial, sans-serif';
    const lines = [
      { t: 'MAXXPRO 480 SC', size: 34, bold: true },
      { t: 'Suspension Concentrate', size: 20 },
      { t: 'ACTIVE INGREDIENT:', size: 24, bold: true },
      { t: 'Paraquat 42%', size: 26 },
      { t: 'OTHER INGREDIENTS: 60.0%', size: 22 },
      { t: 'Keep Out of Reach of Children', size: 20 }
    ];
    let y = 40;
    for (const L of lines) { g.font = (L.bold ? 'bold ' : '') + L.size + 'px ' + F; g.fillText(L.t, 30, y); y += L.size + 14; }
    const out = document.createElement('canvas');
    out.width = 900; out.height = 620;
    const og = out.getContext('2d');
    if (blur) og.filter = 'blur(' + blur + 'px)';
    og.drawImage(c, 0, 0);
    const blob = await new Promise(res => out.toBlob(res, 'image/png'));
    const v = await OcrModule.sharpness(blob);
    return v === null ? null : Math.round(v * 1000) / 1000;
  }, blur) });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('kind', 7) + pad('name', 24) + 'sharpness');
for (const r of rows) console.log(pad(r.kind, 7) + pad(r.name, 24) + r.v);
const reals = rows.filter(r => r.kind === 'real' && r.v !== null).map(r => r.v).sort((a, b) => a - b);
const synths = rows.filter(r => r.kind === 'synth' && r.v !== null).map(r => r.v).sort((a, b) => a - b);
console.log('\nlowest REAL  = ' + reals[0] + '  (' + reals.slice(0, 4).join(', ') + ')');
console.log('highest BLUR = ' + synths[synths.length - 1] + ' (blur series, highest first: ' + synths.join(' > ') + ')');
await browser.close();
