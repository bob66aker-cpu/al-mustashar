/*
 * tests/label-scan.mjs — label photo batch scan (2026-09-22).
 * Feeds the uploaded photos in tests/fixtures/labels/ to the PRODUCTION
 * OCR V2 engine + production SearchCore, with ZERO engine/preprocess
 * changes, and reports exactly what the engine produced per image.
 * No ground truth exists yet (ground-truth.csv has no data rows), so
 * this is a measurement report, NOT a correctness score.
 *
 * Usage (from /tmp/e2e, which has puppeteer-core):
 *   node label-scan.mjs <from> <to>   — 1-based inclusive range over LABELS
 * Output: JSON array on stdout (one entry per image).
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const FROM = parseInt(process.argv[2] || '1', 10);
const TO = parseInt(process.argv[3] || '17', 10);

const LABELS = [
  '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
  '100.jpg', '101.jpg', '103.jpg', '105.jpg', '106.jpg',
  'images.jpg', 'images (1).jpg', 'images (2).jpg', 'images (3).jpg',
  'pesticide_test_level1_ideal.png',
  'pesticide_test_level3_damaged.png',
  'pesticide_test_level4_lowlight.png'
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
try {
  const page = await browser.newPage();
  /* the suite page already loads search-core.js, tesseract and ocr.js,
     and does NOT auto-run anything — we only borrow its script tags */
  await page.goto(BASE + '/tests/v2-suite.html', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForFunction(() => !!(window.SearchCore && window.OcrModule && window.Tesseract), { timeout: 20000 });

  const out = await page.evaluate(async (from, to, labels) => {
    const specs = [
      ['libya-248', '/data/libya-248.json'], ['libya-500', '/data/libya-500.json'],
      ['eu', '/data/eu.json'], ['epa', '/data/epa.json']
    ];
    const sources = [];
    for (const [key, url] of specs) {
      const data = await (await fetch(url, { cache: 'no-store' })).json();
      sources.push({ key, rows: data.rows });
    }
    const search = SearchCore.buildSearch(sources);
    OcrModule.setSearchRef(search);

    /* same merge policy as the production suite: best score per row,
       source rank then score — this is exactly what users see as "top" */
    const rank = { 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3 };
    function bestOf(cas, cands) {
      const byRow = new Map();
      const pushAll = list => (list || []).forEach(x => {
        const prev = byRow.get(x.r);
        if (!prev || x.s.v > prev.s.v) byRow.set(x.r, x);
      });
      for (const casn of cas) pushAll(search(casn, true));
      for (const c of cands) pushAll(search(c, false));
      const merged = [...byRow.values()];
      merged.sort((a, b) => (rank[a.k] - rank[b.k]) || (b.s.v - a.s.v));
      return merged;
    }

    const results = [];
    for (let i = from; i <= to && i <= labels.length; i++) {
      const name = labels[i - 1];
      const entry = { n: i, name, ms: 0, passes: 0, confidence: 0, cas: [], top: [], raw: '', error: '' };
      const t0 = performance.now();
      try {
        const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent(name), { cache: 'no-store' })).blob();
        const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
        const res = await OcrModule.recognize(file, null, { search });
        entry.ms = Math.round(performance.now() - t0);
        entry.passes = res.passes || 0;
        entry.confidence = Math.round(res.confidence || 0);
        entry.cas = (res.cas || []).slice(0, 5);
        const merged = bestOf(res.cas, res.candidates);
        entry.top = merged.slice(0, 5).map(x => ({
          k: x.k, v: Math.round(x.s.v),
          name: String(x.r.name || '').slice(0, 48)
        }));
        entry.raw = String(res.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
      } catch (e) {
        entry.error = (e && typeof e === 'object' && 'message' in e) ? e.message : String(e);
      }
      console.log('[label] done ' + i + '/' + labels.length + ' ' + name);
      results.push(entry);
    }
    return results;
  }, FROM, TO, LABELS);

  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
}
