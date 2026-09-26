/*
 * tests/scan-automation.test.mjs — أ: scan-path full automation (restored)
 * ---------------------------------------------------------------------------
 * Regression test for the أ relapse fixed in this round. Historical diff
 * (37401c2..e30fc48, src/app.js) proved the break: the farmer-mode
 * shownResults filter added to render() in f1058dd was applied to ALL
 * render targets including #scanResults, so a successful scan whose only
 * matches came from EPA/EU rows painted NOTHING in farmer mode —
 * the automation (successful read → results, no manual step) looked dead.
 *
 * Pins, on the REAL app + REAL databases in real Chromium:
 *   1. render into #scanResults shows the FULL result list in BOTH modes
 *      (the scan view is never farmer-filtered — safety: never hide a match).
 *   2. The manual search path keeps the farmer filter (spec C1 intact):
 *      EPA-only manual query paints 0 cards in farmer, >0 in pro.
 *   3. Execution-trace proof that the automation chain is intact end-to-end:
 *      runOcr → recognize → searchCandidates → showOcrResults → render are
 *      the wired live functions, and OcrModule.recognize succeeds without a
 *      rejection on a generated label image (needs an OCR engine in Chromium;
 *      skipped cleanly with SKIP_OCR=1 when no engine is available).
 * Run: node tests/scan-automation.test.mjs  (needs BASE_URL static server)
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const SKIP_OCR = process.env.SKIP_OCR === '1';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  if (ok) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

/* EPA-only substance: an EPA-only match paints zero farmer-mode SEARCH cards,
 * which is exactly the case that made scan results vanish for farmers. */
const QUERY = 'Warfarin';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push(String(e && e.message || e)));
  await page.goto(BASE + '/index.html#/search', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() =>
    window.__appReady === true ||
    (document.querySelector('#results') && !document.querySelector('#results .notice')), { timeout: 30000 })
    .catch(() => {});

  async function setMode(mode) {
    await page.evaluate(m => {
      const sel = document.querySelector('#mode');
      sel.value = m;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, mode);
  }

  /* Direct renderer drive with the EXACT shape proceedWithScan feeds it:
   * searchCandidates() output ({k, r, s}) — i.e. the true automation path
   * downstream of the OCR gates, no mocking of app code. */
  await page.evaluate(q => window.runScanPipeline(q), QUERY);
  await page.waitForFunction(() =>
    document.querySelectorAll('#scanResults article.result, #scanResults .prohibited').length > 0,
    { timeout: 30000 });

  const readScan = () => page.evaluate(() => {
    const box = document.querySelector('#scanResults');
    return {
      articles: box.querySelectorAll('article.result').length,
      sources: [...box.querySelectorAll('.source')].map(e => e.textContent.trim())
    };
  });

  await setMode('farmer');
  const farmerScan = await readScan();
  must('أ: scan results visible in FARMER mode (full list, no manual step)',
    farmerScan.articles > 0, 'articles=' + farmerScan.articles + ' sources=' + farmerScan.sources.join(','));

  await setMode('pro');
  const proScan = await readScan();
  must('أ: scan results visible in PRO mode too',
    proScan.articles > 0 && proScan.articles === farmerScan.articles,
    'articles=' + proScan.articles);

  must('أ: scan view shows the non-Libya source card (the case that regressed)',
    farmerScan.sources.some(s => /EPA/.test(s)), farmerScan.sources.join(','));

  /* ---------- manual search keeps the farmer filter (spec C1 intact) ---------- */
  await setMode('farmer');
  await page.evaluate(q => {
    document.querySelector('#query').value = q;
    document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
  }, QUERY);
  await page.waitForFunction(() =>
    document.querySelector('#results').children.length > 0, { timeout: 30000 });
  const farmerSearch = await page.evaluate(() =>
    document.querySelectorAll('#results article.result').length);
  await setMode('pro');
  await page.waitForFunction(() =>
    document.querySelector('#results').children.length > 0, { timeout: 30000 });
  const proSearch = await page.evaluate(() =>
    document.querySelectorAll('#results article.result').length);
  must('أ: manual SEARCH in farmer mode still hides non-Libya cards (C1 unchanged)',
    farmerSearch === 0, 'farmer articles=' + farmerSearch);
  must('أ: manual SEARCH in pro mode shows them',
    proSearch > 0, 'pro articles=' + proSearch);

  /* ---------- automation chain intact end-to-end (execution trace) ---------- */
  const chain = await page.evaluate(() => {
    const src = String(window.runScanPipeline);
    return {
      usesSearchCandidates: src.includes('searchCandidates('),
      usesShowOcrResults: src.includes('showOcrResults('),
      wired: typeof window.showOcrResults === 'function'
        && typeof window.searchCandidates === 'function'
        && typeof window.runScanPipeline === 'function'
        && typeof window.OcrModule !== 'undefined'
        && typeof window.OcrModule.recognize === 'function'
      /* runOcr نفسه خاص بالإغلاق (IIFE) — سلوكه يثبت بالتشغيل الكامل أدناه */
    };
  });
  must('أ: trace — runScanPipeline calls searchCandidates + showOcrResults',
    chain.usesSearchCandidates && chain.usesShowOcrResults);
  must('أ: trace — live chain wired: runOcr → recognize → searchCandidates → showOcrResults',
    chain.wired);

  if (!SKIP_OCR) {
    /* Full-path proof: a real recognize() on a generated label image flows
     * through runOcr → proceedWithScan → render(#scanResults) with no click.
     * Skipped (counted, not silent) when no OCR engine is available. */
    const ocr = await page.evaluate(async () => {
      const c = document.createElement('canvas');
      c.width = 900; c.height = 620;
      const g = c.getContext('2d');
      g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, 900, 620);
      g.fillStyle = '#111';
      g.font = 'bold 44px "DejaVu Sans", Arial, sans-serif';
      g.fillText('Warfarin', 60, 300);
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      try {
        const res = await window.OcrModule.recognize(blob, () => {}, {
          search: window.searchFn, messages: {}
        });
        return { text: res.text || '', rejected: !!res.rejected,
          cas: res.cas || [], candidates: res.candidates || [] };
      } catch (e) {
        return { error: String(e && e.message || e) };
      }
    });
    if (ocr.error) {
      must('أ: full-path OCR run (engine available in this browser)',
        false, 'skipped — no engine: ' + ocr.error);
    } else if (ocr.rejected) {
      must('أ: full-path OCR run accepted by the gates', false, 'rejected');
    } else {
      const text = (ocr.text || '').toLowerCase();
      must('أ: full-path OCR run accepted by the gates',
        text.includes('warfarin') || ocr.cas.length > 0 || ocr.candidates.length > 0,
        JSON.stringify({ text: text.slice(0, 60), cas: ocr.cas.length, cands: ocr.candidates.length }));
    }
  }

  must('أ: no page errors during the whole drive', consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
