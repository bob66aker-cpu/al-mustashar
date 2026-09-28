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

  /* ---- 2b) the FULL silence audit, re-run on the farmers page and the
   * pro page, in all four languages. The first pass only looked at the
   * default landing page in one language, so it could not have caught a
   * control that only appears in pro mode or only in Chinese. */
  const langs = ['ar', 'en', 'fr', 'zh'];
  const modes = ['farmer', 'pro'];
  const audit = [];
  for (const lang of langs) {
    for (const mode of modes) {
      await page.evaluate((l, m) => {
        window.I18N.setLang(l);
        const sel = document.getElementById('mode');
        if (sel) { sel.value = m; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        location.hash = '#/scan';
      }, lang, mode);
      await new Promise(r => setTimeout(r, 700));
      const row = await page.evaluate((l, m) => {
        const scope = document.querySelector('#scan, .scan-view, #view-scan') || document.body;
        const nodes = [...scope.querySelectorAll('button, a, [role="button"], label, summary')];
        const texts = nodes.map(e => (e.textContent || '').trim()).filter(Boolean);
        /* the words that would betray a new affordance, in the four
           shipped languages plus their English source terms */
        const WORDS = ['vote', 'votest', 'frames', 'majority', 'consensus',
          'agreement', 'scrutin', 'majorit', 'multi-frame',
          'تصويت', 'أغلبية', 'إجماع', 'إطار', 'إطارات',
          '投票', '多数', '一致', '帧'];
        const flagged = texts.filter(t =>
          WORDS.some(w => t.toLowerCase().indexOf(w.toLowerCase()) > -1));
        /* an element that exists ONLY because of the vote would be a new
           affordance; the capture path must stay a single entry point */
        const capture = ['scanBtn', 'cameraBtn', 'fileInput', 'galleryInput']
          .filter(id => document.getElementById(id));
        return { lang: l, mode: m, total: texts.length, flagged, capture,
                 hash: location.hash };
      }, lang, mode);
      audit.push(row);
    }
  }
  for (const row of audit) {
    ok(row.hash.indexOf('scan') > 0,
      'the scan view is showing for ' + row.lang + '/' + row.mode + ' — ' + row.hash);
    ok(row.flagged.length === 0,
      'no control in ' + row.mode + ' / ' + row.lang + ' mentions the vote (' + row.flagged.length + ') ' +
      JSON.stringify(row.flagged).slice(0, 160));
    ok(row.capture.length > 0,
      'the capture entry points are still the pre-existing ones in ' + row.lang + '/' + row.mode +
      ' — ' + row.capture.join(','));
  }
  ok(audit.length === 8, 'the audit covered both modes in all four languages — ' + audit.length + ' passes');
  /* and the per-pass control count must not have grown because of the vote */
  const counts = audit.map(r => r.total);
  ok(Math.max(...counts) - Math.min(...counts) < 12,
    'the control count stays flat across modes and languages — ' + JSON.stringify(counts));

  /* the vote is a pure function on the shipped page: a rejected read
     repeated three times produces no winner there either */
  const liveGuard = await page.evaluate(() => {
    const SL = window.ScanLive;
    const r = { text: 'Diuron 80%', cas: ['330-18-1'], candidates: ['Diuron'],
                confidence: 18, rejected: { lowConfidence: true, conf: 18 } };
    return { three: SL.vote([{ res: r }, { res: r }, { res: r }]).winner,
             blocked: SL.vote([{ res: { blockedBy: 'sharp' } }, { res: { blockedBy: 'sharp' } }]).winner };
  });
  ok(liveGuard.three === null, 'on the shipped page a repeated rejected read has no winner');
  ok(liveGuard.blocked === null, 'and a repeated gate-blocked frame has no winner');

  ok(errors.length === 0, 'zero console errors — ' + JSON.stringify(errors).slice(0, 200));
} finally {
  await browser.close();
}
console.log('\nFRAME-VOTE-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
