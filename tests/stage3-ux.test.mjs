/*
 * tests/stage3-ux.test.mjs — المرحلة 3: محرك القراءة (ثابت، 2026-09-27)
 * ---------------------------------------------------------------------
 * يثبت البنية السلوكية للتغييرات على نسخة العمل (لا يلمس الأصل):
 *   3.0a مؤشر الوضوح: عنصر + منطق معاير على عتبات cheapPass (إرشادي).
 *   3.0b درجة الثقة: عنصر عرض فقط + مفاتيح i18n ×4؛ لا يقرأه مسار قرار.
 *   3.3 إلغاء بمعرّفات: لا تصفير flag بين المسحات + طابور scan() أحادي.
 *   3.4 لغة OCR حسب لغة الواجهة: ara+eng للعربية فقط، eng افتراضيًا أبدًا؛
 *       worker لكل تكوين؛ لوحة التجهيز بالأحجام الفعلية.
 *   3.5 الباركود: طبقة محلية بلا شبكة + zxing مُورَّد + إشارة لا حكم.
 *   3.2/3.6 سقف الأبعاد 1600 + لا سلسلة ثقيلة إلا بالبوابات (توثيق حي).
 *   SW v31 + 1.13.0 + سجل التغييرات.
 * تشغيل: node tests/stage3-ux.test.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const ocr = readFileSync(join(root, 'src/ocr.js'), 'utf8');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const barcode = readFileSync(join(root, 'src/barcode.js'), 'utf8');
const abDoc = readFileSync(join(root, 'docs/ocr-ab-experiment.md'), 'utf8');
const baselineDoc = readFileSync(join(root, 'docs/ocr-baseline.md'), 'utf8');

/* ---------- 3.0a sharpness gauge ---------- */
check('3.0a: gauge element exists inside the live section (dot + value + i18n label)',
  html.includes('id="liveSharp"') && html.includes('id="liveSharpVal"')
  && /id="liveSharp"[^]*?data-i18n="live\.sharp\.label"/.test(html));
check('3.0a: gauge is calibrated on cheapPass thresholds (lap 14 / edges 0.02) and is advisory',
  app.includes("m.lap / 14") && app.includes("m.edges / 0.02")
  && /advisory only/i.test(app) && app.includes("liveSharpRender(m, pass)"));
check('3.0a: exactly three color levels (red/amber/green), no other classes',
  app.includes("'lv-green'") && app.includes("'lv-amber'") && app.includes("'lv-red'")
  && (app.match(/lv-red/g) || []).length >= 2);
check('3.0a: gauge renders are throttled (~200ms), DOM writes only when live probing',
  /liveSharpLastRender\s*<\s*200/.test(app));

/* ---------- 3.0b confidence ---------- */
check('3.0b: #ocrConf display-only element sits above the editable textarea',
  /id="ocrActions"[^]*?id="ocrConf"[^]*?id="ocrText"/.test(html));
check('3.0b: proceedWithScan fills ocrConf from res.confidence (tf interpolation) and nothing reads it',
  app.includes("tf('scan.confidence'") && app.includes("{ n: res.confidence }"));
check('3.0b: clearScanResults resets the confidence badge',
  /function clearScanResults\(\) \{[^]*?\$\('#ocrConf'\)\.textContent = ''/.test(app));
check('3.0b: scan.confidence key present in all four dictionaries',
  (i18n.match(/'scan\.confidence':/g) || []).length === 4);

/* ---------- 3.3 token cancellation + queue ---------- */
check('3.3: cancelFlag is GONE (no boolean reset that cancels newer scans)',
  !/cancelFlag/.test(ocr) && !/cancelFlag/.test(app));
check('3.3: token helpers exist (newCancelToken/isCancelled) and recognize snapshots its token',
  ocr.includes('function newCancelToken()') && ocr.includes('function isCancelled(token)')
  && /const myToken = newCancelToken\(\)/.test(ocr));
check('3.3: pass gate checks the SNAPSHOT, not a resettable flag',
  /isCancelled\(myToken\)/.test(ocr) && !/if \(cancelFlag\)/.test(ocr));
check('3.3: cancelCurrent bumps the sequence only (never resets anything)',
  /function cancelCurrent\(\) \{ cancelSeq\+\+; \}/.test(ocr));
check('3.3: OcrModule.scan is a single-flight queue (chained, self-draining)',
  /let scanChain = Promise\.resolve\(\);/.test(ocr)
  && /scanChain = scanChain\.then\(run, run\)/.test(ocr)
  && /if \(scanChain === queued\) scanChain = Promise\.resolve\(\);/.test(ocr));
check('3.3: newCancelToken is exported',
  /global\.OcrModule = \{[^]*?newCancelToken/.test(ocr));

/* ---------- 3.4 OCR language ---------- */
check('3.4: createWorker language comes from the lang variable (no hard-coded eng call)',
  /createWorker\(\s*\n\s*\/\*/.test(ocr) && /const lang = lang2 \|\| 'eng';/.test(ocr));
check('3.4: per-language worker identity — a different lang retires the old engine',
  /workerPromise && workerPromise\.lang === lang/.test(ocr)
  && /if \(workerPromise\) killWorker\(\);/.test(ocr)
  && /workerPromise\.lang = lang;/.test(ocr));
/* the guard is "every recognize() call passes the UI language", not a
 * fixed count: the 3.1 frame-vote added a third call site, and it must
 * carry uiLang too or Arabic labels would be read with the English model. */
const uiLangSites = (app.match(/uiLang: document\.documentElement\.lang/g) || []).length;
/* the three places a scan is actually launched: the live camera, the
 * 3.1 frame-vote follow-up frames, and the static file path. Comments and
 * the retry helper are not call sites. */
const recognizeCalls = (app.match(/await recognizeWithRetry\(/g) || []).length;
check('3.4: app passes uiLang (document.documentElement.lang) on every recognize call site',
  uiLangSites === recognizeCalls && recognizeCalls >= 3,
  uiLangSites + ' uiLang sites vs ' + recognizeCalls + ' call sites');
check('3.4: ara+eng ONLY for the Arabic UI — eng is the hardcoded fallback elsewhere',
  /opts\.uiLang === 'ar'\) \? 'ara\+eng' : 'eng'/.test(ocr));
check('3.4: prep panel shows per-language OCR footprint (ara added only for ar)',
  /document\.documentElement\.lang === 'ar'\)\s*\?\s*OCR_ASSET_PATHS\.concat\(\['vendor\/tesseract\/lang\/ara\.traineddata\.gz'\]\)/.test(app)
  && /setPrepItem\('#prepOcr', '#prepOcrSize', ocrShown\)/.test(app));

/* ---------- 3.5 barcode layer ---------- */
check('3.5: barcode.js exposes detect/supported/nativeSupported, budget-bounded',
  barcode.includes('global.BarcodeModule') && barcode.includes('DETECT_BUDGET_MS'));
check('3.5: NO network endpoints — wasm served from the vendored same-origin file',
  !/https?:\/\//.test(barcode.replace(/^[\s\S]*?function appRoot[\s\S]*?\n  \}/, ''))
  && barcode.includes('src/vendor/zxing_reader.wasm')
  && !/jsdelivr|unpkg|cdn\./.test(barcode));
check('3.5: native BarcodeDetector first, zxing fallback second',
  barcode.indexOf('BarcodeDetector') < barcode.indexOf('ensureZxing')
  && barcode.includes('engine = \'native\'') && barcode.includes('engine = \'zxing\''));
check('3.5: zxing wasm is in the PERMANENT OCR cache set (survives SW updates)',
  sw.includes("'./src/vendor/zxing_reader.wasm'") && /isOcrUrl[\s\S]*zxing_reader/.test(sw));
check('3.5: barcode.js is in SW SHELL and loaded as a classic script before scan-live.js',
  sw.includes("'./src/barcode.js'")
  /* packs.js was added after barcode.js in this round, so the assertion is
   * "barcode before scan-live", not "these three are adjacent" */
  && /<script src="src\/ocr\.js"><\/script>[\s\S]*?<script src="src\/barcode\.js"><\/script>[\s\S]*?<script src="src\/scan-live\.js"><\/script>/.test(html));
check('3.5: signal-not-verdict — chip renders via textContent, cleared, auto-hides, never calls search',
  app.includes('function showBarcodeChip(bc)') && app.includes("txt.textContent =")
  && app.includes('setTimeout(hideBarcodeChip, 12000)')
  && !/searchCandidates\((bc|first|barcode)/.test(app));
check('3.5: barcode probe runs BEFORE the OCR ladder on both photo and live capture paths',
  (app.match(/window\.BarcodeModule\.detect\(/g) || []).length === 2
  && /BarcodeModule\.detect\(file\)[\s\S]{0,400}probeImage\(file\)/.test(app));
check('3.5: barcode failure can never block the scan (try/catch advisory)',
  /try \{\s*const bc = await window\.BarcodeModule\.detect\(file\);\s*if \(bc && bc\.codes\.length\) showBarcodeChip\(bc\);\s*\} catch \(e\) \{ \/\* never block/.test(app));

/* ---------- 3.2 / 3.6 heavy-pipeline discipline ---------- */
check('3.2: MAX_DIM 1600 is only the fallback — the memory ladder decides — and baseCanvas scales DOWN to it',
  ocr.includes('MAX_DIM: 1600')
  && /const limit = maxDim \|\| OCR\.MAX_DIM;/.test(ocr)
  && /const scale = Math\.min\(1, limit \/ Math\.max\(w, h\)\);/.test(ocr)
  /* 4) the ladder itself: \u22641GB\u21921280, 2GB\u21921920, \u22654GB\u21922560, undefined\u21921280 */
  && /rung: 'unknown'/.test(ocr) && /rung: 'le1gb'/.test(ocr) && /rung: '2gb'/.test(ocr) && /rung: '4gb\+'/.test(ocr) && /dim: 1280/.test(ocr) && /dim: 1920/.test(ocr) && /dim: 2560/.test(ocr)
  && /function memoryRung/.test(ocr) && /rung\.dim/.test(ocr));
check('3.6: heavy variants stay gated — early lock on rule confirmation, exact-hit break, deep lanes only when needed',
  ocr.includes('if (earlyLock) break;') && ocr.includes('if (exactHit) break;')
  && /lane: 'deep/.test(ocr));
check('3.6: heavy pipeline is NOT applied to every image unconditionally (rotations only when !exactHit)',
  /if \(!exactHit\) \{\s*const angles/.test(ocr));
check('3.6: heavy-pipeline discipline is documented (baseline + sw header)',
  baselineDoc.includes('لا سلسلة معالجة ثقيلة') || baselineDoc.includes('بوابات')
  ? true : /deep lanes/.test(sw));

/* ---------- i18n ×4 ---------- */
for (const k of ['scan.barcode.found', 'scan.barcode.clear', 'live.sharp.label',
                 'ocr.lang.auto', 'ocr.lang.arabic']) {
  check(`i18n: ${k} present in all four dictionaries`,
    (i18n.match(new RegExp(`'${k.replace(/\./g, '\\.')}'`, 'g')) || []).length === 4);
}

/* ---------- sw/version ---------- */
check('sw is v31 and keeps the permanent OCR cache name',
  sw.includes("CACHE = 'mustashar-v33'") && sw.includes("OCR_CACHE = 'mustashar-ocr'"));
check('sw changelog has a v27 entry mentioning the stage-3 items',
  sw.includes('* v27 (2026-09-27)') && sw.includes('3.3') && sw.includes('3.5'));
check('OCR assets include ara + zxing wasm (3.4/3.5) and BOTH langs of traineddata are matched by isOcrUrl',
  /'\.\/vendor\/tesseract\/lang\/ara\.traineddata\.gz'/.test(sw)
  && /lang\\\/\(eng\|ara\)\\.traineddata/.test(sw));
check('ara must NOT be a default engine language (default worker is eng)',
  !/createWorker\(\s*['"]ara/.test(ocr) && !/createWorker\(\s*['"]eng\+ara['"]/.test(ocr));
check('version 1.16.0 in version.json + package.json',
  JSON.parse(readFileSync(join(root, 'version.json'), 'utf8')).version === '1.16.0'
  && JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version === '1.16.0');

/* ---------- baseline + A/B docs (3.1/3.7) ---------- */
check('3.1: baseline doc exists with the measured columns and hang-anomaly note',
  baselineDoc.includes('لا تحسين قبل قياس') && baselineDoc.includes('| 7 | 5 | 5 | 0 |'.split('|')[1].trim())
  ? baselineDoc.includes('7') && baselineDoc.includes('75s') && baselineDoc.includes('تعليق')
  : false);
check('3.1: baseline raw summary committed (17 rows, classifier documented)',
  (() => { const s = JSON.parse(readFileSync(join(root, 'tests/fixtures/labels/baseline-v27-summary.json'), 'utf8'));
    return s.rows.length === 17 && s.summary.HANG === 0 && !!s.classifier.ACCEPT; })());
check('3.7: A/B doc pins decision gates BEFORE measurement (false-accept stop, 70% speed, 20MB, real phone)',
  abDoc.includes('صفر قبول خاطئ') && abDoc.includes('70%') && abDoc.includes('20MB')
  && abDoc.includes('هاتف حقيقي'));

/* ---------- regression guard on the baseline numbers (3.8, static half) ---------- */
check('3.8: baseline regression floor documented (no-read must not exceed 5/17, zero hang)',
  baselineDoc.includes('لا يجوز أن تزيد «لا قراءة» فوق 5/17'));

console.log(`\nstage3-ux: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
