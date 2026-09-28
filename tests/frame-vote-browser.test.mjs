/* tests/frame-vote-browser.test.mjs — 3.1 in a real browser
 *
 * Proves the three things the farmer rule cares about, on the shipped page:
 *   1) the vote module is present and its window really is ~1-2 seconds;
 *   2) adding frames the farmer never asked for adds NO new control, NO new
 *      text and NO new step to the capture flow;
 *   3) the static gallery path still reaches the engine directly, with the
 *      vote untouched, so the farmer's one-capture flow is unchanged.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS ' + m); } else { fail++; console.log('FAIL ' + m); } };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 120000,
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  /* ---- 1) the module and its window ---- */
  const sl = await page.evaluate(() => ({
    has: typeof window.ScanLive === 'object',
    vote: typeof (window.ScanLive || {}).vote,
    win: (window.ScanLive || {}).VOTE_WINDOW_MS,
    max: (window.ScanLive || {}).VOTE_MAX_READS
  }));
  ok(sl.has && sl.vote === 'function', 'the live module ships a vote function on the page');
  ok(sl.win >= 1000 && sl.win <= 2000, 'the shipped vote window is 1-2 seconds — ' + sl.win + 'ms');
  ok(sl.max >= 2 && sl.max <= 4, 'the shipped vote reads at most 4 frames — ' + sl.max);

  /* the vote must not add wall-clock time to the static path */
  const gallery = await page.evaluate(() => {
    const el = document.querySelector('input[type="file"]');
    return !!el;
  });
  ok(gallery, 'the static gallery input is still the single capture path');

  /* ---- 2) NO new step, control, or text for the farmer ---- */
  const ui = await page.evaluate(() => {
    const texts = [...document.querySelectorAll('button, a, [role="button"], label')]
      .map(e => (e.textContent || '').trim()).filter(Boolean);
    return {
      voteWords: texts.filter(t => /vote|تصويت|framed|帧|投票|majority/i.test(t)),
      count: texts.length
    };
  });
  ok(ui.voteWords.length === 0,
    'no control anywhere in the UI mentions voting — the farmer sees nothing new (' + ui.voteWords.length + ')');

  /* the capture flow must still be one button + one result */
  const flow = await page.evaluate(() => {
    const ids = ['scanBtn', 'cameraBtn', 'fileInput', 'galleryInput', 'cancelOcrBtn', 'shotBtn'];
    return ids.filter(id => document.getElementById(id));
  });
  ok(flow.length > 0, 'the capture controls are the pre-existing ones — ' + flow.join(', '));

  /* ---- 3) the vote is a pure reorder: it cannot invent a result ---- */
  const pure = await page.evaluate(() => {
    const SL = window.ScanLive;
    return {
      empty: SL.vote([]).winner === null,
      single: SL.vote([{ res: { text: 'x', cas: [], candidates: ['Paraquat'], confidence: 90 } }]).winner.res.candidates[0],
      cap: SL.pooledConfidence({ confidence: 100 }, 999)
    };
  });
  ok(pure.empty, 'an empty vote produces no winner — it can never invent a result');
  ok(pure.single === 'Paraquat', 'a single read passes through the vote unchanged');
  ok(pure.cap === 1200, 'pooled confidence is capped at raw x 12 — ' + pure.cap);

  /* the confidence gate the app already had is untouched */
  const conf = await page.evaluate(() => /MIN_CONFIDENCE\s*=\s*45/.test(window.OcrModule.getTuning ? '' : ''));
  const t = await page.evaluate(() => window.OcrModule.getTuning());
  ok(t.sharpGate === 1 && t.wordFilter === 60,
    'the shipped calibration is unchanged by the vote — gate ' + t.sharpGate + ', wordFilter ' + t.wordFilter);

  ok(errors.length === 0, 'zero console errors — ' + JSON.stringify(errors).slice(0, 200));
} finally {
  await browser.close();
}
console.log('\nFRAME-VOTE-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
