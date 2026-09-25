/*
 * tests/stage-b.test.mjs — المرحلة ب والمرحلة ج (2026-09-25)
 * ---------------------------------------------------------------
 * تدقيق بنية الأسلاك (Node-only، قراءة فقط، بلا DOM ولا شبكة ولا محرك):
 *   ب1: مسار حي مستمر: فيديو + إطار إرشادي + فحص رخيص قبل المحرك الكامل،
 *       النجاح المبكر يوقف الحلقة، والقراءة التلقائية لها مهلة تبريد.
 *   ب2: «التقاط أفضل إطار» يختار الأوضح من عدة إطارات على كل الأجهزة.
 *   ب3: المحرك الكامل يعمل على منطقة الإطار فقط مكبّرة؛ الإطار الكامل
 *       يُعرض/يُحفظ للتشخيص (canvas → blob، لا createObjectURL(canvas)).
 *   ب4: أضعف الأجهزة لا تحصل على حلقة حية (PROFILE.weak.live = false).
 *   ب5: كل الإطارات تمر عبر OcrModule.recognize() نفسه — لا بوابات جديدة،
 *       ولا تجاوز للبوابات (لاتيني 60%، ثقة 45، إعفاء CAS الصالح).
 *   أ1: كل تغيّر لمصدر الاستعلام (بداية حية/إيقاف/إزالة) يمسح النتائج فورًا.
 *   ج: حماية القراءة الجارية — لا مغادرة لشاشة المسح أثناء عمل المحرك،
 *      والتنقل حرًا تمامًا فور انتهائها؛ بلا أي تغيير في تصميم القائم.
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
const live = readFileSync(join(root, 'src/scan-live.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');

/* ---------- ب1: المعالجة الحية المستمرة ---------- */
check('ب1: live video + guide canvas + hint exist in the scan view',
  html.includes('id="liveSection"') && html.includes('id="liveVideo"')
  && html.includes('id="liveGuide"') && html.includes('class="live-hint"'));
check('ب1: continuous processing from the stream — cheap probe ticks on an interval',
  /liveTimer = setInterval\(\(\) => liveProbeTick\(profile\), profile\.sampleMs\)/.test(app));
check('ب1: failing cheap pre-check skips the frame BEFORE the full engine',
  /const pass = window\.ScanLive\.cheapPass\(m\);/.test(app)
  && /if \(pass && Date\.now\(\) - liveLastPass >= LIVE_PASS_COOLDOWN\) void liveFullPass\('auto'\);/.test(app));
check('ب1: early success stops the live loop (result stays, camera stops)',
  /stopLive\(false\);\s*diagAdd\(\{ at: Date\.now\(\), outcome: 'scanned', src: 'live'/.test(app));

/* ---------- ب2: أفضل إطار ---------- */
check('ب2: capture takes N consecutive frames and keeps the sharpest',
  /const LIVE_BEST_OF = 3;/.test(app)
  && /async function liveBestOf\(n\)/.test(app)
  && /window\.ScanLive\.sharpnessScore\(small\)/.test(app)
  && /const best = await liveBestOf\(LIVE_BEST_OF\);/.test(app));

/* ---------- ب3: ROI + الإطار الكامل للسجل ---------- */
check('ب3: full-engine read crops the guide ROI only, upscaled',
  /const roiCanvas = window\.ScanLive\.cropROI\(liveVideo, roi\);/.test(app)
  && /function cropROI\(video, roiRect\)/.test(live));
check('ب3: diagnostics/history copy stays the FULL uncropped frame',
  /function grabFull\(video\)/.test(live) && /const full = window\.ScanLive\.grabFull\(liveVideo\);/.test(app)
  && /showPreviewCanvas\(snap\.full\)/.test(app));
check('ب3: live canvases are blob-encoded before preview (createObjectURL never sees a canvas)',
  /function showPreviewCanvas\(canvas\)/.test(app)
  && !/showPreview\(snap\.full\);/.test(app));

/* ---------- ب4: الأجهزة الضعيفة ---------- */
check('ب4: weakest devices never run the live loop (manual best-of-N only)',
  /weak:\s*\{ live: false,/.test(live));
check('ب4: touch/mobile/desktop get live mode with a conservative 500ms cadence',
  /mobile:\s*\{ live: true,\s*sampleMs: 500,/.test(live)
  && /medium:\s*\{ live: true,\s*sampleMs: 500,/.test(live));

/* ---------- ب5: لا بوابات جديدة ولا تجاوز ---------- */
check('ب5: every live frame goes through the SAME recognize() the photo path uses',
  /OcrModule\.recognize\(blob, p => \{/.test(app)
  && /async function liveFullPass\(kind, pre\)/.test(app));
check('ب5: scan-live.js adds no engine of its own (no OCR libraries inside)',
  !/import\s/.test(live) && !/XMLHttpRequest|fetch\(/.test(live)
  && /global\.ScanLive = \{/.test(live));
check('ب5: OCR gates untouched (Latin 60%, conf floor 45, valid-CAS exemption)',
  (() => {
    const ocr = readFileSync(join(root, 'src/ocr.js'), 'utf8');
    return /ratio >= 0\.6/.test(ocr)
      && /const MIN_CONFIDENCE = 45;/.test(ocr)
      && /const structured = hasValidCas\(meta && meta\.cas\)/.test(ocr);
  })());

/* ---------- أ1: كل تغيّر لمصدر الاستعلام يمسح النتائج ---------- */
check('أ1: starting the live camera bumps the generation and clears old results',
  /function startLive\(\)[\s\S]{0,900}scanSeq\+\+;[\s\S]{0,200}clearScanResults\(\);/.test(app));
check('أ1: a photo read still running is cancelled when the live camera starts',
  /if \(ocrBusy && typeof OcrModule !== 'undefined'\) OcrModule\.cancelCurrent\(\);/.test(app));
check('أ1: stop/cancel button kills live results immediately (stopLive(true) → resetScanUI)',
  /\$\('#liveStopBtn'\)\.addEventListener\('click', \(\) => stopLive\(true\)\);/.test(app)
  && /function stopLive\(supersede\)[\s\S]{0,900}if \(supersede\) \{[\s\S]{0,80}scanSeq\+\+;[\s\S]{0,80}resetScanUI\(\);/.test(app));
check('أ1: resetScanUI tears down the live camera too',
  /function resetScanUI\(\) \{\s*stopLive\(false\);/.test(app));
check('أ1: superseded live passes never paint (generation guard after recognize)',
  /if \(stale\) \{ diagAdd\(\{ at: Date\.now\(\), outcome: 'superseded', src: 'live', ms \}\); return; \}/.test(app));

/* ---------- أ2/أ3: الأزرار تعود لحالة الاستعداد بعد الإيقاف ---------- */
check('أ2: stopLive restores the capture/gallery buttons (no page reload needed)',
  /if \(camBtn\) \{ camBtn\.hidden = false; camBtn\.disabled = false; \}/.test(app)
  && /if \(galBtn\) \{ galBtn\.hidden = false; galBtn\.disabled = false; \}/.test(app));
check('أ3: live results render through the SAME decision renderer in the scan view',
  /proceedWithScan\(res, \[\]\);/.test(app) && /render\(merged, '', '#scanResults'\)/.test(app));

/* ---------- ج: حماية القراءة الجارية ---------- */
check('ج: leaving the scan view is blocked ONLY while a read is active',
  /if \(v !== 'scan' && ocrBusy\) \{ location\.hash = '#\/scan'; return; \}/.test(app));
check('ج: navigation is never blocked when no read is running (guard keyed on ocrBusy)',
  !/if \(v !== 'scan'\) \{ location\.hash/.test(app));
check('ج: no drawer/menu/backdrop redesign landed this round',
  !html.includes('id="drawer"') && !html.includes('class="backdrop"') && !html.includes('id="menuBtn"'));

/* ---------- i18n: المفاتيح بالغات الأربع ---------- */
for (const k of ['live.hint', 'live.capture', 'live.stop', 'live.unavailable',
  'live.denied', 'live.scanning', 'live.frame', 'live.result']) {
  check(`i18n: ${k} in 4 languages`, (i18n.match(new RegExp("'" + k + "':", 'g')) || []).length === 4);
}

/* ---------- sw: الكاش رُفع في نفس الإيداع ---------- */
check('sw: cache is mustashar-v19 or later with a matching header comment',
  /^const CACHE = 'mustashar-v(19|[2-9]\d)';/m.test(sw) && /v(19|[2-9]\d) \(2026/.test(sw));
check('sw: src/scan-live.js is precached in the shell',
  sw.includes("'./src/scan-live.js'"));
check('index.html loads src/scan-live.js before app.js',
  html.indexOf('src/scan-live.js') > -1
  && html.indexOf('src/scan-live.js') < html.indexOf('src/app.js'));
check('version: 1.5.0 in version.json + package.json',
  JSON.parse(readFileSync(join(root, 'version.json'), 'utf8')).version === '1.5.0'
  && JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version === '1.5.0');

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
