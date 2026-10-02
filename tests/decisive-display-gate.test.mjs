/* tests/decisive-display-gate.test.mjs — فيدباك 5: الأعلى يبقى والأدنى يختفي
 * ---------------------------------------------------------------------------
 * القاعدة معتمدة من المالك 2026-10-01، وهي **قاعدة عرض فقط**:
 *   (أ) حاسم ⇒ المادة الحاسمة وحدها، واقتراحات المواد الأضعف من نفس القراءة
 *       تختفي من الشاشة كلياً (لا قسم مطوي ولا زحام).
 *   (ب) «الأدنى» = مواد بديلة فقط. سجلّات المادة الحاسمة من كل المصادر
 *       (ليبيا/أوروبا/أمريكا) وحالاتها تبقى كلها ظاهرة.
 *   (ج) غير حاسم (80-99) ⇒ لا إخفاء إطلاقاً، ويبقى تحذير «تطابق محتمل».
 *   (د) مادة مختلفة حقيقية قُرئت فعلاً تبقى ظاهرة ولو حسمت أخرى — الفاصل
 *       معرّف المادة (اسم+رقم) لا رقم CAS وحده.
 *   (هـ) وضع المزارع لا يتغيّر: المصادر الليبية وحدها.
 *
 * الفحص الأخير أدناه يثبت أن ما يقرّره المحرك لم يتغيّر: القائمة التي
 * تُرفض أو تُقبل هي نفسها. الاختفاء في طبقة العرض وحدها.
 * التشغيل: node tests/decisive-display-gate.test.mjs [baseUrl]
 */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');

let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? ' :: ' + d : '')); };

/* the rule is source-level: a display filter, not a data change */
const appSrc = fs.readFileSync('src/app.js', 'utf8');
check('the rule keeps every row when nothing is decisive',
  /if \(!decisive\.length\) return rows;/.test(appSrc));
check('the ban banner is still computed from the UNFILTERED list',
  /const prohibited = results\.filter\(x => x\.k === 'libya-248'\)/.test(appSrc));
check('the ambiguity banner follows the displayed list, not the raw one',
  /CasDissect\.ambiguity\(displayResults\)/.test(appSrc));
check('provenance is recorded per read, so a different read is not hidden',
  /x\.via = via; byRow\.set\(x\.r, x\)/.test(appSrc));

/* the four dictionaries still carry the ambiguity sentence the rule switches */
const i18n = fs.readFileSync('src/i18n.js', 'utf8');
check('the ambiguity sentence exists in all four dictionaries',
  (i18n.match(/'results\.ambiguous'/g) || []).length >= 4,
  String((i18n.match(/'results\.ambiguous'/g) || []).length));

/* the real screens, through the real renderer */
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 420, height: 900 });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push(String(e.message || e)));
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 90000 });
await page.waitForFunction(() => window.OcrModule && document.querySelector('#query') && window.runScanPipeline, { timeout: 30000 });
await new Promise(r => setTimeout(r, 2500));

const searchIn = async (q, mode) => {
  await page.evaluate((q, mode) => {
    const m = document.querySelector('#mode'); if (m) m.value = mode;
    const s = document.querySelector('#query'); s.value = q;
    location.hash = '#/search';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    const f = s.closest('form'); if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, q, mode);
  await new Promise(r => setTimeout(r, 900));
  return page.evaluate(() => (document.querySelector('#results') || {}).innerText || '');
};
const scanIn = async (q) => {
  await page.evaluate(q => { window.runScanPipeline(q); }, q);
  await new Promise(r => setTimeout(r, 900));
  return page.evaluate(() => (document.querySelector('#scanResults') || {}).innerText || '');
};

/* (أ)(ب) Glyphosate: its own records stay, the 80% look-alike goes */
for (const mode of ['farmer', 'pro']) {
  const t = await searchIn('Glyphosate', mode);
  /* farmer mode is Libyan-only by design, so one record is the whole truth there;
   * pro mode shows the same substance across three registries. */
  const min = mode === 'farmer' ? 1 : 2;
  check('Glyphosate (' + mode + '): its own records stay visible', (t.match(/Glyphosate/g) || []).length >= min, String((t.match(/Glyphosate/g) || []).length));
  check('Glyphosate (' + mode + '): the 80% look-alike is gone', t.indexOf('Glyphosine') < 0);
  check('Glyphosate (' + mode + '): the Libyan status paragraph stays', /REV|RAR/.test(t));
}

/* (د) Captan: one substance name, two CAS — the shared-CAS banner must stay */
const captan = await searchIn('Captan', 'farmer');
check('Captan: the shared-CAS ambiguity banner stays (two CAS, one substance name)',
  /ملتبسة|مشابهة/.test(captan), captan.slice(0, 160));
check('Captan: the Libyan card still shows', /Captan/.test(captan));

/* (أ) Aluminium sulfate: the alternatives go, the Libyan record stays whole */
for (const mode of ['farmer', 'pro']) {
  const t = await searchIn('Aluminium sulfate', mode);
  check('Aluminium sulfate (' + mode + '): Ammonium sulfate is gone', t.indexOf('Ammonium sulfate') < 0);
  check('Aluminium sulfate (' + mode + '): the US-spelled alternative is gone', t.indexOf('Aluminum sulfate') < 0);
  check('Aluminium sulfate (' + mode + '): the ambiguity banner it caused is gone', !/ملتبسة|مشابهة/.test(t), t.slice(0, 160));
  check('Aluminium sulfate (' + mode + '): the Libyan RAR paragraph stays', /RAR|تداول مؤقت/.test(t), t.slice(0, 220));
}

/* (هـ) farmer mode is still Libyan-only */
const aluFarmer = await searchIn('Aluminium sulfate', 'farmer');
const aluPro = await searchIn('Aluminium sulfate', 'pro');
check('farmer mode still returns Libyan sources only',
  /\u0627\u0644\u0627\u062a\u062d\u0627\u062f \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064a/.test(aluPro)
  && !/\u0627\u0644\u0627\u062a\u062d\u0627\u062f \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064a|USA \/ EPA/.test(aluFarmer),
  'farmer=' + aluFarmer.slice(0, 120));

/* (ج) nothing is hidden while nothing is decisive */
const weak = await searchIn('aluminium', 'pro');
check('a non-decisive read hides nothing: its only card still shows', /Aluminum/.test(weak), weak.slice(0, 200));
check('a non-decisive read shows no invented "no match" verdict', weak.indexOf('لم يتم العثور') < 0);

/* (د) a different substance genuinely read stays beside a decisive one */
const multi = await scanIn('GLYPHOSATE AMMONIUM SULPHATE');
check('multi-substance: the decisive substance is shown', /Glyphosate/.test(multi), multi.slice(0, 300));
check('multi-substance: the second substance that was really read stays visible',
  /Ammonium sulpha/.test(multi), multi.slice(0, 400));

/* the scan view: both branches of the rule, where the farmer meets it.

 * Decisive needs the printed name to equal the stored name. The data stores
 * «Aluminium sulfate» (f), so the UK spelling on the printed label scores 88
 * and stays a candidate — rule (ج) — while the stored spelling is decisive. */
const scanDecisive = await scanIn('Aluminium sulfate');
check('scan view (decisive): the ambiguity banner it caused is gone',
  !/ملتبسة|مشابهة/.test(scanDecisive), scanDecisive.slice(0, 300));
check('scan view (decisive): the Libyan RAR paragraph is still there',
  /RAR|تداول مؤقت/.test(scanDecisive), scanDecisive.slice(0, 400));
/* three lines, no CAS: 88 is NOT decisive, so nothing is hidden and the
 * caution that goes with a non-decisive read stays. Rule (ج), same screen. */
const scanCandidate = await scanIn('GROUND\nALUMINIUM\nSULPHATE');
check('scan view (88, not decisive): the substance is still shown', /Aluminium sulfate/.test(scanCandidate), scanCandidate.slice(0, 300));
check('scan view (88, not decisive): the caution that goes with it stays',
  /ملتبسة|مشابهة|تطابق محتمل/.test(scanCandidate), scanCandidate.slice(0, 400));

/* the decision path itself is untouched: the engine still returns every row */
const raw = await page.evaluate(() => {
  const hits = window.searchCandidates([], window.OcrModule.extractCandidates('GROUND ALUMINIUM SULPHATE'));
  return { names: hits.map(x => String(x.r.name || '')), allHaveVia: hits.every(x => x.via !== undefined) };
});
check('the engine still returns every row (the rule is display-only)',
  /Ammonium sulpha/.test(raw.names.join(',')), raw.names.join(' | '));
check('every row carries the read that produced it', raw.allHaveVia);

check('zero console/page errors through the whole gate', errs.length === 0, errs.slice(0, 3).join(' | '));
await browser.close();
console.log('\n==============================\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
