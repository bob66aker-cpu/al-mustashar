#!/usr/bin/env node
/* tests/ocr-sharp-calibrate.mjs — معايرة عتبة الحدة من القياس
 * ------------------------------------------------------------------
 * يقرأ مجموعة الاختبار الثابتة نفسها (17 صورة) ويطبع قيمة تباين
 * Laplacian لكل صورة (عبر نفس دالة sharpness في src/ocr.js)، ثم
 * يقرنها بدرجة خط الأساس في measure-baseline.json:
 *   ACCEPT / REJECT / EMPTY.
 * الغرض: اختيار أصغر عتبة تُبقي كل صف ACCEPT فوقها، حتى لا ترفض
 * البوابة أي صورة كانت مقبولة.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

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
await page.goto(BASE + '/tests/v2-suite.html', { waitUntil: 'domcontentloaded', timeout: 30000 });

const values = [];
for (let i = 0; i < LABELS.length; i++) {
  const name = LABELS[i];
  const v = await page.evaluate(async (n) => {
    const url = '/tests/fixtures/labels/' + encodeURIComponent(n);
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await OcrModule.sharpness(blob);
  }, name);
  values.push({ n: i + 1, name, v: v === null ? null : Math.round(v) });
}
await browser.close();

let baseline = { rows: [] };
try { baseline = JSON.parse(readFileSync('tests/fixtures/labels/measure-baseline.json', 'utf8')); } catch (e) {}
const grade = new Map(baseline.rows.map(r => [r.n, r.grade]));

console.log('n  file                            sharpness   grade');
values.forEach(r => {
  console.log(String(r.n).padStart(2) + ' ' + r.name.padEnd(30) + String(r.v).padStart(9) + '   ' + (grade.get(r.n) || '?'));
});
const accepts = values.filter(r => grade.get(r.n) === 'ACCEPT');
if (accepts.length) {
  const minAccept = Math.min(...accepts.map(r => r.v));
  console.log('\nlowest ACCEPT sharpness = ' + minAccept + '  (a gate must stay BELOW this)');
}
const sorted = values.filter(r => r.v !== null).map(r => r.v).sort((a, b) => a - b);
console.log('all values sorted: ' + JSON.stringify(sorted));
