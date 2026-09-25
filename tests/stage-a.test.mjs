/*
 * tests/stage-a.test.mjs — المرحلة أ (2026-09-25)
 * ---------------------------------------------------------------
 * تدقيق بنية أسلاك السلوك الجديد في app.js/index.html/i18n/sw:
 *   أ1: أي تغيير لمصدر الاستعلام (كتابة/حذف نص، صورة جديدة، مسح جديد)
 *       يمسح كل النتائج المعروضة فورًا قبل بدء المعالجة الجديدة،
 *       ولا تُعرض أي نتيجة من مسح أُحل محله (حارس التوليد في runOcr).
 *   أ2: زر إزالة/تبديل الصورة الملتقطة يمسح الصورة ونتائجها ويعيد
 *       حالة الاستعداد بلا إعادة تحميل الصفحة.
 *   أ3: النص الذي يجتاز بوابات ocr.js (كما هي، بلا تعديل) يُمرَّر
 *       تلقائيًا لمحرك البحث الحالي وتُعرض النتائج داخل شاشة المسح
 *       بنفس العارض المستخدم في البحث اليدوي، بلا لوحة تأكيد.
 * Node-only, offline, read-only (no DOM, no network, no engine run).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');

/* ---------- أ1: مسار البحث اليدوي ---------- */
check('أ1: typing in the search box clears old results instantly',
  /queryInput\.addEventListener\('input'[\s\S]{0,200}clearSearchResults\(\)/.test(app));
check('أ1: clear-query button also clears the old results',
  /clearBtn\.addEventListener\('click'[\s\S]{0,300}clearSearchResults\(\)/.test(app));
check('أ1: cleared search box shows the empty-state (no stale cards)',
  /function clearResultsBox[\s\S]{0,400}results\.hint/.test(app));

/* ---------- أ1: مسار المسح ---------- */
check('أ1: new camera image bumps the generation and clears scan results before reading',
  /camera\.addEventListener\('change'[\s\S]{0,220}scanSeq\+\+[\s\S]{0,120}clearScanResults\(\)/.test(app));
check('أ1: new gallery image bumps the generation and clears scan results before reading',
  /gallery\.addEventListener\('change'[\s\S]{0,220}scanSeq\+\+[\s\S]{0,120}clearScanResults\(\)/.test(app));
check('أ1: superseded scan can never paint results (generation guard after recognize)',
  /if \(scanSeq !== activeScanSeq\) \{[\s\S]{0,160}outcome: 'superseded'/.test(app));
check('أ1: superseded scan failure stays silent (generation guard in catch)',
  /String\(e\.message \|\| e\)[\s\S]{0,140}if \(scanSeq === activeScanSeq\) \{/.test(app));

/* ---------- أ2: زر إزالة/تبديل الصورة ---------- */
{
  const i0 = app.indexOf('function resetScanUI()');
  const body = i0 >= 0 ? app.slice(i0, app.indexOf('cancelImageBtn', i0)) : '';
  check('أ2: floating cancel button exists over the preview (i18n title)',
    html.includes('id="cancelImageBtn"') && html.includes('preview-cancel')
    && html.includes('data-i18n-title="scan.cancelImage"'));
  check('أ2: resetScanUI bumps the generation (old results invalidated)',
    i0 >= 0 && body.includes('scanSeq++'));
  check('أ2: resetScanUI revokes the blob URL and empties both file inputs',
    i0 >= 0 && body.includes('revokeObjectURL') && body.includes("camera.value = ''")
    && body.includes("gallery.value = ''"));
  check('أ2: resetScanUI clears the linked results (أ1 rule)',
    i0 >= 0 && body.includes('clearScanResults()'));
  check('أ2: no page reload anywhere in the scan reset path',
    !/location\.reload/.test(app));
}

/* ---------- أ3: الأتمتة الكاملة ---------- */
check('أ3: confirmation panel is fully removed (no manual gate)',
  !html.includes('aiConfirm') && !app.includes('pendingScan') && !app.includes('showConfirmPanel'));
check('أ3: gate-passing OCR text feeds the EXISTING search automatically',
  /function proceedWithScan\(res, tips\) \{[\s\S]{0,240}searchCandidates\(res\.cas, res\.candidates\)/.test(app)
  && /proceedWithScan\(res, tips\);/.test(app));
check('أ3: scan results render in the scan view with the SAME decision-layer renderer',
  /render\(merged, '', '#scanResults'\)/.test(app) && html.includes('id="scanResults"'));
{
  const iScan = html.indexOf('id="view-scan"');
  const iRes = html.indexOf('id="scanResults"');
  const iHist = html.indexOf('id="view-history"');
  check('أ3: #scanResults lives inside the scan view (before history)',
    iScan > -1 && iRes > iScan && iHist > iRes);
}
check('أ3: candidate text stays available as OPTIONAL manual re-search',
  html.includes('id="ocrRerun"') && app.includes("$('#ocrRerun')"));
check('أ3: scan title used for scan-path results',
  /t\('ocr\.title'/.test(app));

/* ---------- البوابات لا تمس (عقد الحماية) ---------- */
check('gates: ocr.js untouched — Latin ratio, conf floor 45, valid-CAS exemption',
  (() => {
    const ocr = readFileSync(join(root, 'src/ocr.js'), 'utf8');
    return /ratio >= 0\.6/.test(ocr)
      && /const MIN_CONFIDENCE = 45;/.test(ocr)
      && /const structured = hasValidCas\(meta && meta\.cas\)/.test(ocr);
  })());

/* ---------- i18n: المفاتيح بالغات الأربع ---------- */
check('i18n: scan.cancelImage in 4 languages', (i18n.match(/'scan\.cancelImage':/g) || []).length === 4);
check('i18n: ocr.auto in 4 languages', (i18n.match(/'ocr\.auto':/g) || []).length === 4);

/* ---------- sw: الكاش رُفع في نفس الإيداع ---------- */
check('sw: cache bumped to mustashar-v18 with a v18 header comment',
  sw.includes("const CACHE = 'mustashar-v18'") && sw.includes('v18 (2026'));
check('sw: permanent OCR cache untouched',
  sw.includes("OCR_CACHE = 'mustashar-ocr'"));
check('version: 1.4.2 in version.json + package.json',
  JSON.parse(readFileSync(join(root, 'version.json'), 'utf8')).version === '1.4.2'
  && JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version === '1.4.2');

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
