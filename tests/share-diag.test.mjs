/*
 * tests/share-diag.test.mjs — ج (readable diagnostics export) + د (share button)
 * ---------------------------------------------------------------------------
 * Real-execution-trace test for this round's fixes — deliberately NOT a
 * "element exists" check (that methodological gap is what let the share
 * button relapse go unnoticed last round).
 *
 * ج: clicks the real #diagBtn, intercepts the REAL download via CDP
 *    (Browser.setDownloadBehavior), reads the file from disk, and asserts
 *    the exported log is readable Arabic HTML (no raw JSON keys), plus the
 *    empty-log visible toast. Nothing is uploaded anywhere.
 *
 * د: executes the share handler through ALL THREE paths in real Chromium:
 *      1. Web Share available  → navigator.share invoked with the app URL.
 *      2. Clipboard (prototype-level stub) → writeText invoked + visible toast.
 *      3. Clipboard throws → vCard file really downloads + failure toast that
 *         names the exception (no silent path).
 *    Also proves #ocrMsg stays untouched by share (the v22 bug: notices were
 *    painted inside the hidden scan view = "nothing happens").
 * Run: node tests/share-diag.test.mjs  (needs BASE_URL static server)
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const DL = '/tmp/mustashar-dl';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  if (ok) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

/* Node-side wait for a real, COMPLETE download: name matches, file exists,
 * AND its content matches a marker (guards against reading leftovers from a
 * previous run or a still-writing partial file). */
const waitDownload = async (re, ms, contentRe) => {
  const t0 = Date.now();
  for (;;) {
    try {
      const hit = readdirSync(DL).find(n => re.test(n));
      if (hit) {
        const txt = readFileSync(DL + '/' + hit, 'utf8');
        if (!contentRe || contentRe.test(txt)) return hit;
      }
    } catch (e) { /* dir may not exist / file mid-rename */ }
    if (Date.now() - t0 > ms) return null;
    await new Promise(r => setTimeout(r, 250));
  }
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const client = await browser.target().createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  rmSync(DL, { recursive: true, force: true });   // no leftovers from previous runs
  mkdirSync(DL, { recursive: true });

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() => window.__appReady === true
    || (document.querySelector('#results') && !document.querySelector('#results .notice')),
    { timeout: 30000 }).catch(() => {});

  /* ============ ج — readable diagnostics export (real download) ============ */
  await page.evaluate(() => {
    const now = Date.now();
    localStorage.setItem('mustashar-diag', JSON.stringify([
      { at: now, outcome: 'scanned', ms: 4210, conf: 0.91, variant: 'deep1/psm6', src: 'live', kind: 'capture' },
      { at: now - 60000, outcome: 'rejected', ms: 3800, reason: 0.38 }
    ]));
  });
  await page.evaluate(() => document.querySelector('#diagBtn').click());
  const diagFile = await waitDownload(/^mustashar-diagnostics-.*\.html$/, 15000, /<\/html>/);
  if (!diagFile) {
    must('ج: export downloads as a real file', false, 'no download appeared');
  } else {
    const exported = readFileSync(DL + '/' + diagFile, 'utf8');
    must('ج: export downloads as a real file', exported.length > 200, diagFile);
    must('ج: readable Arabic report, not raw JSON', exported.includes('سجل تشخيص المسح')
      && exported.includes('اكتمل المسح بنجاح') && exported.includes('الوقت المستغرق'));
    must('ج: no raw JSON keys leak to the report', !/"outcome"|latinRatio|"ms":|at":/.test(exported));
    must('ج: both entries present', exported.includes('محاولة 1') && exported.includes('محاولة 2'));
  }

  await page.evaluate(() => localStorage.setItem('mustashar-diag', '[]'));
  await page.evaluate(() => document.querySelector('#diagBtn').click());
  const emptyToast = await page.evaluate(() => {
    const m = document.querySelector('#ocrMsg');
    return m && m.textContent.length > 0;
  });
  must('ج: empty log shows a visible notice', emptyToast === true);

  /* ============ د — share button: real execution traces ============ */
  /* Clear the diag toast so share assertions see only their own state */
  await page.evaluate(() => { const m = document.querySelector('#ocrMsg'); if (m) m.textContent = ''; });

  /* --- path 1: Web Share available --- */
  const p1 = await page.evaluate(async () => {
    let sharePayload = null;
    navigator.share = async d => { sharePayload = d; };
    document.querySelector('#shareBtn').click();
    await new Promise(r => setTimeout(r, 300));
    const banner = document.querySelector('#dbBanner');
    return { payload: sharePayload, bannerShown: banner && !banner.hidden };
  });
  must('د: trace 1 — Web Share invoked with the app URL',
    !!(p1.payload && p1.payload.url && /https?:\/\//.test(p1.payload.url)),
    JSON.stringify(p1.payload));
  must('د: trace 1 — success path stays silent (no error toast)', p1.bannerShown === false);

  /* --- path 2: clipboard available (prototype-level stub) --- */
  const p2 = await page.evaluate(async () => {
    delete navigator.share;
    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get() { return { writeText: async t => { window.__copied = t; } }; }
    });
    document.querySelector('#shareBtn').click();
    await new Promise(r => setTimeout(r, 300));
    const banner = document.querySelector('#dbBanner');
    return { copied: window.__copied, toast: banner && !banner.hidden ? banner.textContent : '' };
  });
  must('د: trace 2 — clipboard.writeText invoked with the app URL',
    !!(p2.copied && /https?:\/\//.test(p2.copied)));
  must('د: trace 2 — visible "copied" toast, NOT inside the hidden scan view',
    p2.toast.includes('نُسخ رابط التطبيق'), p2.toast);
  const ocrClean2 = await page.evaluate(() =>
    !document.querySelector('#ocrMsg') || document.querySelector('#ocrMsg').textContent === '');
  must('د: trace 2 — #ocrMsg untouched by share', ocrClean2);

  /* --- path 3: clipboard throws → vCard downloads + failure notice --- */
  rmSync(DL + '/al-mustashar.vcf', { force: true });
  const p3 = await page.evaluate(async () => {
    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      get() { return { writeText: async () => { const e = new Error('denied'); e.name = 'NotAllowedError'; throw e; } }; }
    });
    document.querySelector('#shareBtn').click();
    await new Promise(r => setTimeout(r, 500));
    const banner = document.querySelector('#dbBanner');
    return { toast: banner && !banner.hidden ? banner.textContent : '' };
  });
  const vcf3 = await waitDownload(/^al-mustashar\.vcf$/, 15000, /END:VCARD/);
  must('د: trace 3 — clipboard failure falls through to vCard',
    !!vcf3 && readFileSync(DL + '/' + vcf3, 'utf8').includes('BEGIN:VCARD'), vcf3 || 'no vcf download');
  must('د: trace 3 — visible failure notice names the exception (no silent path)',
    p3.toast.includes('تعذّرت المشاركة') && p3.toast.includes('NotAllowedError'), p3.toast);

  /* --- path 3b: no share, no clipboard at all → vCard + saved notice --- */
  rmSync(DL + '/al-mustashar.vcf', { force: true });
  const p3b = await page.evaluate(async () => {
    delete Navigator.prototype.clipboard;
    document.querySelector('#shareBtn').click();
    await new Promise(r => setTimeout(r, 500));
    const banner = document.querySelector('#dbBanner');
    return { toast: banner && !banner.hidden ? banner.textContent : '' };
  });
  const vcf3b = await waitDownload(/^al-mustashar\.vcf$/, 15000, /END:VCARD/);
  must('د: trace 3b — no-share/no-clipboard → vCard downloaded',
    !!vcf3b && readFileSync(DL + '/' + vcf3b, 'utf8').includes('BEGIN:VCARD'), vcf3b || 'no vcf download');
  must('د: trace 3b — visible "saved card" toast', p3b.toast.includes('بطاقة اتصال'), p3b.toast);

  must('ج/د: no page errors during all traces', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
