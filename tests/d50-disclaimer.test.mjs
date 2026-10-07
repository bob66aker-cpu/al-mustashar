/*
 * tests/d50-disclaimer.test.mjs — D50: تنبيه الإخلاء يُقرأ من المرجع ويظهر في الوضعين
 * ------------------------------------------------------------------------------
 * ما يثبته هذا الحارس (أربعة ادعاءات حيّة، لا ادعاء بلا قياس):
 *   1) الظهور: meta.disclaimer يظهر مرة واحدة قرب النتائج في الوضعين معاً
 *      (بحث #results · مسح #scanResults) عبر render() نفسها.
 *   2) الحصرية: النص المعروض يطابق حرفياً meta.disclaimer[لغة الواجهة]
 *      في data/reference.json — ولا يحمله src/i18n.js ولا src/app.js ولا
 *      src/cards.js (فحص ساكن على النصوص الأربع نفسها، بلا نسخة في الاختبار).
 *   3) السلوك السلبي: عند غياب المفتاح (المرجع يُقدَّم بلا meta.disclaimer
 *      مع تثبيت البصمة تماشياً مع ذلك) لا يظهر عنصر ولا نص بديل إطلاقاً،
 *      بينما يظل شريط الإخلاء العادي يظهر — أي أن render() نُفِّذ فعلاً.
 *   4) precache في sw.js يحمل './data/reference.json' مرة واحدة فقط.
 * التشغيل: node tests/d50-disclaimer.test.mjs
 *   (يُشغّل tests/static-server.mjs بنفسه على 127.0.0.1:8080 ثم يقتله)
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const PORT = 8080;
const BASE = `http://127.0.0.1:${PORT}`;
const QUERY = 'DDT';              /* exact-banned row, proven in search by mode-split */
const SCAN_QUERY = 'Chlorpyrifos'; /* Libyan row proven in #scanResults (scan-automation):
                                   * >=4 chars for extractCandidates + farmer-visible */
const LANGS = ['ar', 'en', 'fr', 'zh'];

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' — ' + extra));
  ok ? pass++ : fail++;
};

/* ---------- static: the four strings live ONLY in the reference ---------- */
const ref = JSON.parse(readFileSync(join(root, 'data/reference.json'), 'utf8'));
const texts = (ref.meta && ref.meta.disclaimer) || null;
const langsOk = !!texts
  && LANGS.length === Object.keys(texts).length
  && LANGS.every(k => typeof texts[k] === 'string' && texts[k].length > 40);
check('data/reference.json carries meta.disclaimer with exactly ar/en/fr/zh',
  langsOk, JSON.stringify(Object.keys(texts || {})));

const srcOf = f => readFileSync(join(root, f), 'utf8');
for (const f of ['src/i18n.js', 'src/app.js', 'src/cards.js']) {
  const src = srcOf(f);
  const leaked = texts ? LANGS.filter(k => src.includes(texts[k])) : ['no-texts'];
  check(`${f} contains none of the four disclaimer strings`, leaked.length === 0, leaked.join(','));
}
const app = srcOf('src/app.js');
check('app.js reads meta.disclaimer from REF (no local copy, lang-keyed)',
  /REF && REF\.meta && REF\.meta\.disclaimer && REF\.meta\.disclaimer\[refLang\]/.test(app)
  && (app.split('data-ref-disclaimer').length - 1) === 1
  && /box\.innerHTML = refDisclaimerHtml \+ disclaimerHtml/.test(app));
check('app.js renders nothing when the key is missing (empty-string branch, no substitute)',
  /refDisclaimerHtml = refDisclaimer\s*\n\s*\?[\s\S]{0,300}:\s*''/.test(app));
const sw = srcOf('sw.js');
check("sw.js precaches './data/reference.json' exactly once",
  (sw.split('./data/reference.json').length - 1) === 1,
  String(sw.split('./data/reference.json').length - 1));

/* ---------- the live part: a real browser on the real build ---------- */
const srv = spawn('node', ['tests/static-server.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stderr.on('data', d => process.stderr.write(d));
const srvLine = new Promise((resolve) => {
  srv.stdout.on('data', d => { if (String(d).includes('static server on')) resolve(); });
  setTimeout(() => resolve(), 4000);   /* fallback: the fetch poll below decides anyway */
});

async function waitServer() {
  await srvLine;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/index.html')).ok) return; } catch (e) { /* retry */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('static server never became reachable on ' + BASE);
}

const launch = () => puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  protocolTimeout: 300000
});

async function openReady(browser, lang, intercept) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e && e.message)));
  if (lang) await page.evaluateOnNewDocument(l => {
    try {
      localStorage.setItem('mustashar-lang', l);
      /* The English farmer shows ONLY the picked jurisdiction (default
       * libya-500); DDT has its row in libya-248 — pin the jurisdiction
       * that carries the probe row. Ignored for every other language. */
      localStorage.setItem('mustashar-jurisdiction', 'libya-248');
    } catch (e) { /* storage blocked */ }
  }, lang);
  if (intercept) await intercept(page);
  await page.goto(BASE + '/index.html#/search', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 60000 }).catch(() => {});
  return { page, pageErrors };
}

async function search(page, q) {
  await page.evaluate(qq => {
    document.querySelector('#query').value = qq;
    document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
  }, q);
  await page.waitForFunction(() => document.querySelectorAll('#results article.result').length > 0,
    { timeout: 60000 });
}

const grab = (page, sel) => page.evaluate(s => {
  const box = document.querySelector(s);
  if (!box) return { missing: true };
  const els = box.querySelectorAll('[data-ref-disclaimer]');
  return {
    missing: false,
    count: els.length,
    text: els.length ? els[0].textContent.trim() : null,
    attrLang: els.length ? els[0].getAttribute('data-ref-disclaimer') : null,
    strip: !!box.querySelector('.disclaimer-strip'),
    cards: box.querySelectorAll('article.result').length,
    html: box.innerHTML
  };
}, sel);

let browserPos = null, browserNeg = null;
try {
  await waitServer();

  /* ===== NEGATIVE first (fresh profile, doctor'd payload) ===== */
  browserNeg = await launch();
  const modRef = JSON.parse(JSON.stringify(ref));
  delete modRef.meta.disclaimer;                       /* the key is simply absent */
  const modRefText = JSON.stringify(modRef, null, 1);
  const modRefSha = createHash('sha256').update(modRefText, 'utf8').digest('hex');
  let modApp = app;
  const NEW_SHA = createHash('sha256').update(readFileSync(join(root, 'data/reference.json'))).digest('hex');
  if ((modApp.split(NEW_SHA).length - 1) !== 1) throw new Error('current reference sha not found exactly once in app.js');
  modApp = modApp.split(NEW_SHA).join(modRefSha);      /* integrity must PASS on the doctor'd file */
  if ((modApp.split(modRefSha).length - 1) !== 1) throw new Error('doctor sha substitution failed');
  const NOOP_SW = '/* d50 test: registration kept valid, nothing cached */\n'
    + 'self.addEventListener("install", () => self.skipWaiting());\n';

  const neg = await openReady(browserNeg, 'ar', async (page) => {
    await page.setRequestInterception(true);
    page.on('request', req => {
      const u = req.url();
      if (u.endsWith('/data/reference.json')) {
        req.respond({ status: 200, contentType: 'application/json', body: modRefText });
      } else if (u.endsWith('/src/app.js')) {
        req.respond({ status: 200, contentType: 'application/javascript', body: modApp });
      } else if (u.endsWith('/sw.js')) {
        req.respond({ status: 200, contentType: 'application/javascript', body: NOOP_SW });
      } else {
        req.continue().catch(() => {});
      }
    });
  });
  await search(neg.page, QUERY);
  const negBox = await grab(neg.page, '#results');
  check('negative: NO data-ref-disclaimer element when meta.disclaimer is absent',
    negBox.count === 0, JSON.stringify(negBox).slice(0, 200));
  const leakedNeg = texts ? LANGS.filter(k => negBox.html.includes(texts[k])) : ['no-texts'];
  check('negative: none of the four reference texts appear anywhere in #results',
    leakedNeg.length === 0, leakedNeg.join(','));
  check('negative: the regular disclaimer strip still renders (render() really ran)',
    negBox.strip === true && negBox.cards > 0, JSON.stringify({ strip: negBox.strip, cards: negBox.cards }));
  check('negative: zero uncaught page errors', neg.pageErrors.length === 0,
    neg.pageErrors.join(' | ').slice(0, 300));
  await neg.page.close();
  await browserNeg.close(); browserNeg = null;

  /* ===== POSITIVE: search mode (ar) ===== */
  browserPos = await launch();
  const ar = await openReady(browserPos, 'ar');
  await search(ar.page, QUERY);
  const arBox = await grab(ar.page, '#results');
  check('search: exactly ONE data-ref-disclaimer near the results',
    arBox.count === 1, JSON.stringify({ count: arBox.count }));
  check('search: attribute carries the current UI language (ar)',
    arBox.attrLang === 'ar', String(arBox.attrLang));
  check('search: text is VERBATIM meta.disclaimer.ar from data/reference.json',
    arBox.text === texts.ar, JSON.stringify(arBox.text || '').slice(0, 160));

  /* ===== POSITIVE: scan mode (same build) ===== */
  await ar.page.evaluate(() => { location.hash = '#/scan'; });
  await new Promise(r => setTimeout(r, 300));
  await ar.page.evaluate(q => window.runScanPipeline(q), SCAN_QUERY);
  await ar.page.waitForFunction(() =>
    document.querySelectorAll('#scanResults article.result, #scanResults .prohibited').length > 0,
    { timeout: 60000 });
  const scanBox = await grab(ar.page, '#scanResults');
  check('scan: exactly ONE data-ref-disclaimer near the results',
    scanBox.count === 1, JSON.stringify({ count: scanBox.count }));
  check('scan: attribute carries the current UI language (ar)',
    scanBox.attrLang === 'ar', String(scanBox.attrLang));
  check('scan: text is VERBATIM meta.disclaimer.ar from data/reference.json',
    scanBox.text === texts.ar, JSON.stringify(scanBox.text || '').slice(0, 160));
  check('search+scan: the SAME text once in both modes',
    arBox.text === scanBox.text && arBox.count === 1 && scanBox.count === 1);
  check('positive: zero uncaught page errors', ar.pageErrors.length === 0,
    ar.pageErrors.join(' | ').slice(0, 300));

  /* ===== POSITIVE: the text follows the UI language ===== */
  const en = await openReady(browserPos, 'en');
  await search(en.page, QUERY);
  const enBox = await grab(en.page, '#results');
  check('search (en): attribute carries the current UI language (en)',
    enBox.attrLang === 'en', String(enBox.attrLang));
  check('search (en): text is VERBATIM meta.disclaimer.en from data/reference.json',
    enBox.text === texts.en, JSON.stringify(enBox.text || '').slice(0, 160));
  check('language switch changes the text (ar != en, both from the reference)',
    enBox.text !== arBox.text && enBox.text === texts.en);
  await en.page.close();

  /* ===== scan render stays stable while other pages ran ===== */
  const scanAgain = await grab(ar.page, '#scanResults');
  check('scan keeps its single ar text after unrelated pages opened',
    scanAgain.text === texts.ar && scanAgain.count === 1,
    JSON.stringify(scanAgain).slice(0, 160));

  await ar.page.close();
  await browserPos.close(); browserPos = null;
} finally {
  if (browserNeg) await browserNeg.close().catch(() => {});
  if (browserPos) await browserPos.close().catch(() => {});
  srv.kill('SIGTERM');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
