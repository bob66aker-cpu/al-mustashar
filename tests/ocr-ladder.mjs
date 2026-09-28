#!/usr/bin/env node
/*
 * tests/ocr-ladder.mjs — 4) قياس سُلّم الذاكرة (MAX_DIM) قبل/بعد
 * ------------------------------------------------------------------
 * يقيس مجموعة الملصقات الحقيقية (17 صورة) مرتين بنفس الشروط، والفرق الوحيد
 * هو سقف أبعاد الصورة:
 *   before : maxDim مثبَّت على 1600 (القيمة قبل هذه الجولة)
 *   after  : بدون maxDim → السُلّم من navigator.deviceMemory
 *            (undefined→1280، ≤1GB→1280، 2GB→1920، ≥4GB→2560)
 * بوابات الجودة نفسها في الحالتين: لا عتبة جديدة ولا مسار جديد.
 *
 * سبب التكرار: كل تسمية تُقاس في رحلة ذهاب وإياب واحدة إلى الصفحة، وتُكتب
 * نتيجتها على القرص فورًا — ف runners طويلة لا تضيع عند مقاطعة البيئة، ويمكن
 * تقسيم 17 صورة على دفعات (الصور المتبقية في الذاكرة تراكم يضرّ).
 *
 *   node tests/ocr-ladder.mjs <before|after> <from> <to> <rowsFile>
 * ثم: node tests/ocr-ladder-report.mjs <rowsFile>  → الجدول
 */
import puppeteer from 'puppeteer-core';
import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const MODE = process.argv[2] || 'before';
const FROM = parseInt(process.argv[3] || '1', 10);
const TO = parseInt(process.argv[4] || '17', 10);
const ROWS = process.argv[5] || 'tests/fixtures/labels/ocr-ladder-rows.jsonl';
const BEFORE_DIM = 1600;

const LABELS = [
  '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
  '100.jpg', '101.jpg', '103.jpg', '105.jpg', '106.jpg',
  'images.jpg', 'images (1).jpg', 'images (2).jpg', 'images (3).jpg',
  'pesticide_test_level1_ideal.png',
  'pesticide_test_level3_damaged.png',
  'pesticide_test_level4_lowlight.png'
];

if (!existsSync(ROWS)) writeFileSync(ROWS, '');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 600000
});
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/tests/v2-suite.html', { waitUntil: 'domcontentloaded', timeout: 30000 });

  /* one page round-trip loads the five databases and builds the index ONCE */
  const env = await page.evaluate(async (mode, beforeDim) => {
    const specs = [
      ['libya-248', '/data/libya-248.json'], ['libya-500', '/data/libya-500.json'],
      ['eu', '/data/eu.json'], ['epa', '/data/epa.json'], ['epa-cancelled', '/data/epa-cancelled.json']
    ];
    const sources = [];
    for (const [key, url] of specs) {
      const data = await (await fetch(url, { cache: 'no-store' })).json();
      sources.push({ key, rows: (data.rows || data).map(r => ({ ...r, source: key })) });
    }
    const search = SearchCore.buildSearch(sources);
    window.__search = search;
    const rung = OcrModule.memoryRung();
    return { rung, mode, maxDim: mode === 'before' ? beforeDim : null, deviceMemory: (typeof navigator !== 'undefined' && navigator.deviceMemory !== undefined) ? navigator.deviceMemory : 'undefined' };
  }, MODE, BEFORE_DIM);

  console.log('ENV ' + JSON.stringify(env));
  appendFileSync(ROWS, JSON.stringify({ kind: 'env', ...env }) + '\n');

  for (let i = FROM; i <= TO; i++) {
    const name = LABELS[i - 1];
    const entry = await page.evaluate(async (idx, name, mode, beforeDim) => {
      const e = { mode, n: idx, name, ms: 0, passes: 0, confidence: 0, cas: [], top: '', raw: '', error: '' };
      const t0 = performance.now();
      try {
        const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent(name), { cache: 'no-store' })).blob();
        const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
        const opts = { search: window.__search };
        if (mode === 'before') opts.maxDim = beforeDim;
        const res = await OcrModule.recognize(file, null, opts);
        e.ms = Math.round(performance.now() - t0);
        e.passes = res.passes || 0;
        e.confidence = Math.round(res.confidence || 0);
        e.cas = (res.cas || []).slice(0, 5);
        const all = (res.cas || []).concat(res.candidates || []);
        /* not every candidate carries a score object — sort only those */
        const scored = all.filter(x => x && x.s && typeof x.s.v === 'number');
        scored.sort((a, b) => b.s.v - a.s.v);
        e.top = scored.length ? String((scored[0].r && scored[0].r.name) || '').slice(0, 40) : '';
        e.casCount = (res.cas || []).length;
        e.raw = String(res.text || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      } catch (err) {
        e.error = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
      }
      return e;
    }, i, name, MODE, BEFORE_DIM);
    appendFileSync(ROWS, JSON.stringify(entry) + '\n');
    console.log('[' + MODE + '] ' + i + '/' + LABELS.length + ' ' + name + ' ms=' + entry.ms + ' cas=' + entry.cas.length + (entry.error ? ' ERR=' + entry.error : ''));
  }
  console.log('BATCH DONE ' + MODE + ' ' + FROM + '-' + TO);
} finally {
  await browser.close();
}
