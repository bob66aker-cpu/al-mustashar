#!/usr/bin/env node
/*
 * tests/ocr-measure.mjs — عدّاد قياس واحد لكل تحسين في المرحلة الثالثة
 * ------------------------------------------------------------------
 * يقيس مجموعة الاختبار الثابتة (17 صورة حقيقية) ويكتب ملخصاً:
 *   { tag, flags, n, ACCEPT, REJECT, EMPTY, HANG, avgMs, maxMs, avgPasses, rows[] }
 * القبول: صف يُعدّ ACCEPT إذا أعاد المحرك رقم CAS صالحاً (نفس عدّاد خط
 * الأساس 3.1)، وREJECT إذا قرأ نصاً بلا CAS، وEMPTY إن لم يقرأ شيئاً.
 *
 * كل تحسين يُقاس مرتين بنفس السكربت: control (العلم مطفأ) ثم treatment
 * (مفعّل) — لا استنتاج من جولة سابقة.
 *
 *   node tests/ocr-measure.mjs <tag> [flagJson]
 * مثال:
 *   node tests/ocr-measure.mjs baseline
 *   node tests/ocr-measure.mjs sharp '{"sharpGate":true}'
 */
import puppeteer from 'puppeteer-core';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const TAG = process.argv[2] || 'baseline';
const FLAGS = process.argv[3] ? JSON.parse(process.argv[3]) : {};

const LABELS = [
  '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
  '100.jpg', '101.jpg', '103.jpg', '105.jpg', '106.jpg',
  'images.jpg', 'images (1).jpg', 'images (2).jpg', 'images (3).jpg',
  'pesticide_test_level1_ideal.png',
  'pesticide_test_level3_damaged.png',
  'pesticide_test_level4_lowlight.png'
];
const FROM = parseInt(process.env.FROM || '1', 10);
const TO = parseInt(process.env.TO || '17', 10);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 600000,
});
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/tests/v2-suite.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const env = await page.evaluate(async (flags) => {
    if (typeof OcrModule.setTuning === 'function') OcrModule.setTuning(flags);
    const specs = [
      ['libya-248', '/data/libya-248.json'], ['libya-500', '/data/libya-500.json'],
      ['eu', '/data/eu.json'], ['epa', '/data/epa.json']
    ];
    const sources = [];
    for (const [key, url] of specs) {
      const data = await (await fetch(url, { cache: 'no-store' })).json();
      sources.push({ key, rows: (data.rows || data).map(r => ({ ...r, source: key })) });
    }
    window.__search = SearchCore.buildSearch(sources);
    return {
      tuning: (typeof OcrModule.getTuning === 'function') ? OcrModule.getTuning() : null,
      rung: OcrModule.memoryRung()
    };
  }, FLAGS);
  console.log('ENV ' + JSON.stringify(env));

  const rows = [];
  for (let i = FROM; i <= TO; i++) {
    const name = LABELS[i - 1];
    const entry = await page.evaluate(async (idx, nm) => {
      const e = { n: idx, name: nm, ms: 0, passes: 0, conf: 0, cas: 0, text: '', gate: '', error: '' };
      const t0 = performance.now();
      try {
        const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent(nm), { cache: 'no-store' })).blob();
        const file = new File([blob], nm, { type: blob.type || 'image/jpeg' });
        const res = await OcrModule.recognize(file, null, { search: window.__search });
        e.ms = Math.round(performance.now() - t0);
        e.passes = res.passes || 0;
        e.conf = Math.round(res.confidence || 0);
        e.cas = (res.cas || []).length;
        e.gate = String(res.gate || res.blockedBy || '');
        e.text = String(res.text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      } catch (err) {
        e.error = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
      }
      return e;
    }, i, name);
    rows.push(entry);
    console.log('[' + TAG + '] ' + i + '/' + LABELS.length + ' ' + name + ' ms=' + entry.ms + ' cas=' + entry.cas + (entry.gate ? ' gate=' + entry.gate : '') + (entry.error ? ' ERR=' + entry.error : ''));
  }

  const grade = e => (e.error ? 'HANG' : (e.cas ? 'ACCEPT' : (e.text ? 'REJECT' : 'EMPTY')));
  const ms = rows.map(r => r.ms);
  const summary = {
    tag: TAG, flags: FLAGS, tuning: env.tuning, rung: env.rung,
    measuredAt: new Date().toISOString().slice(0, 10),
    n: rows.length,
    ACCEPT: rows.filter(r => grade(r) === 'ACCEPT').length,
    REJECT: rows.filter(r => grade(r) === 'REJECT').length,
    EMPTY: rows.filter(r => grade(r) === 'EMPTY').length,
    HANG: rows.filter(r => grade(r) === 'HANG').length,
    avgMs: Math.round(ms.reduce((a, b) => a + b, 0) / ms.length),
    maxMs: Math.max(...ms),
    avgPasses: +(rows.reduce((a, r) => a + r.passes, 0) / rows.length).toFixed(2),
    rows: rows.map(r => ({ n: r.n, name: r.name, ms: r.ms, passes: r.passes, cas: r.cas, grade: grade(r), gate: r.gate, error: r.error }))
  };
  /* a long sweep runs in batches; each batch MERGES into the same summary
   * file (a re-run of the same label replaces its row) so the final numbers
   * describe the whole set, not whichever batch finished last */
  const outFile = 'tests/fixtures/labels/measure-' + TAG + '.json';
  if (existsSync(outFile)) {
    try {
      const prev = JSON.parse(readFileSync(outFile, 'utf8'));
      if (prev.flags && JSON.stringify(prev.flags) === JSON.stringify(FLAGS)) {
        const byN = new Map(prev.rows.map(r => [r.n, r]));
        rows.forEach(r => byN.set(r.n, {
          n: r.n, name: r.name, ms: r.ms, passes: r.passes, cas: r.cas, grade: grade(r), gate: r.gate, error: r.error
        }));
        summary.rows = [...byN.values()].sort((a, b) => a.n - b.n);
        summary.n = summary.rows.length;
        const ms2 = summary.rows.map(r => r.ms);
        summary.ACCEPT = summary.rows.filter(r => r.grade === 'ACCEPT').length;
        summary.REJECT = summary.rows.filter(r => r.grade === 'REJECT').length;
        summary.EMPTY = summary.rows.filter(r => r.grade === 'EMPTY').length;
        summary.HANG = summary.rows.filter(r => r.grade === 'HANG').length;
        summary.avgMs = Math.round(ms2.reduce((x, y) => x + y, 0) / ms2.length);
        summary.maxMs = Math.max(...ms2);
        summary.avgPasses = +(summary.rows.reduce((x, r) => x + (r.passes || 0), 0) / ms2.length).toFixed(2);
      }
    } catch (e) { /* a corrupt summary is simply replaced */ }
  }
  writeFileSync(outFile, JSON.stringify(summary, null, 1));
  console.log('SUMMARY ' + JSON.stringify({
    tag: TAG, n: summary.n, ACCEPT: summary.ACCEPT, REJECT: summary.REJECT, EMPTY: summary.EMPTY,
    HANG: summary.HANG, avgMs: summary.avgMs, maxMs: summary.maxMs, avgPasses: summary.avgPasses
  }));
} finally {
  await browser.close();
}
