/*
 * tests/ppocr-optional.test.mjs — the optional package, at runtime
 * --------------------------------------------------------------
 * The static test (tests/ppocr-size.test.mjs) proves the default lists did
 * not move. This one proves the BEHAVIOUR on the real shipped page:
 *
 *   1. the app never even loads src/ppocr.js (window.PpOcr is undefined);
 *   2. loading it by hand while the flag is off, load() REFUSES — it does
 *      not start fetching because the file exists;
 *   3. zero requests leave the page for the package's hosts;
 *   4. flipping the flag on makes the first request the PINNED entry URL —
 *      and the test aborts it there, so no 40 KB of remote code and no
 *      21 MB of models is ever executed or downloaded by CI.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const HOSTS = /jsdelivr\.net|bcebos\.com/;

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log('PASS ' + label + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 120000,
});

try {
  const page = await browser.newPage();
  const external = [];
  const errors = [];
  page.on('request', r => { if (HOSTS.test(r.url())) external.push(r.url()); });
  page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 45000 });

  ok(await page.evaluate(() => typeof window.PpOcr) === 'undefined',
    'the shipped app never loads the optional package', 'window.PpOcr is undefined');
  ok(external.length === 0, 'the shipped app makes no request to the package hosts',
    external.length ? external.join(', ') : 'zero external requests');

  /* load it by hand, flag still off */
  /* a fresh profile still shares the preview origin's caches, and the SW
   * caches same-origin GETs at runtime — clear both so the test reads the file
   * on disk, not a copy cached by an earlier run */
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  });
  await page.addScriptTag({ url: '/src/ppocr.js?fresh=' + Date.now() });
  const off = await page.evaluate(async () => {
    let err = '';
    try { await window.PpOcr.load(); } catch (e) { err = String(e && e.message || e); }
    return {
      present: typeof window.PpOcr,
      enabled: window.PpOcr.enabled(),
      tuning: window.OcrModule.getTuning().ppocr,
      budget: window.PpOcr.budget(),
      error: err
    };
  });
  ok(off.present === 'object', 'the package can be loaded by hand for a measurement session');
  ok(off.tuning === false && off.enabled === false, 'it is off in the shipped tuning', 'ppocr=' + off.tuning);
  ok(/disabled/.test(off.error), 'load() refuses while the flag is off — it does not self-start', off.error);
  ok(external.length === 0, 'still zero external requests after the refused load',
    external.length ? external.join(', ') : 'none');

  /* Flag on. The shipped page runs connect-src 'self', so the package is
   * REFUSED BY THE CSP — deterministically, with no network involved. That
   * refusal is the feature: the optional engine cannot start on a farmer's
   * phone even if a stray flag said so. The message must say WHY. */
  const on = await page.evaluate(async () => {
    window.OcrModule.setTuning({ ppocr: true });
    let err = '';
    try { await window.PpOcr.load(); } catch (e) { err = String((e && e.message) || e); }
    return { enabled: window.PpOcr.enabled(), hosts: window.PpOcr.CSP_HOSTS, err };
  });
  ok(on.enabled === true, 'the flag really is on', 'ppocr=true');
  ok(/connect-src/.test(on.err) && /cdn\.jsdelivr\.net/.test(on.err),
    'load() names the CSP as the blocker instead of a bare "Failed to fetch"', on.err.slice(0, 90));
  ok(on.hosts.length === 2 && on.hosts.every(h => /^[a-z0-9.-]+$/.test(h)),
    'the package publishes exactly the hosts a deliberate CSP change would allow', on.hosts.join(' + '));
  ok(external.length === 0, 'no request ever left the page — the CSP stopped it first',
    external.length ? external.join(', ') : 'zero external requests');

  /* the pinned manifest and the declared budget are the ones in the test */
  const m = await page.evaluate(() => ({ assets: window.PpOcr.ASSETS, budget: window.PpOcr.budget() }));
  ok(m.assets.det.bytes === 4843520 && m.assets.rec.bytes === 16701440 && m.assets.esm.bytes === 40902,
    'the manifest still carries the measured sizes',
    [m.assets.esm.bytes, m.assets.det.bytes, m.assets.rec.bytes].join(' / '));
  ok(m.budget.gated + m.budget.ungated === m.budget.total,
    'the budget adds up', 'gated ' + m.budget.gated + ' + ungated ' + m.budget.ungated + ' = ' + m.budget.total);

  await page.setRequestInterception(false);
  ok(errors.filter(e => !/Failed to fetch|NetworkError|ERR_FAILED|aborted/i.test(e)).length === 0,
    'no unexpected page errors', JSON.stringify(errors).slice(0, 160));
} finally {
  await browser.close();
}

console.log('\nPPOCR-OPTIONAL: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
