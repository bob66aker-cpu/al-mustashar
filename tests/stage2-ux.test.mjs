/*
 * tests/stage2-ux.test.mjs — المرحلة 2: تجربة الهاتف (2.1..2.4)
 * ثابت (Node): يثبّت البنية السلوكية للتغييرات على index.html/src/sw.
 * تشغيل: node tests/stage2-ux.test.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (extra ? ' [' + extra + ']' : '')); }
};

const html = readFileSync(join(root, 'index.html'), 'utf8');
const capture = readFileSync(join(root, 'src/install-capture.js'), 'utf8');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const icons = readFileSync(join(root, 'src/icons.js'), 'utf8');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');

/* ---------------- 2.1 install prompt ---------------- */
{
  must('2.1: head script (CSP-safe external) captures beforeinstallprompt + preventDefault',
    /beforeinstallprompt/.test(capture) && /e\.preventDefault\(\)/.test(capture)
    && html.indexOf('src/install-capture.js') > -1
    && html.indexOf('src/install-capture.js') < html.indexOf('src/i18n.js'));
  must('2.1: window.__install early store with pick()/set()',
    /window\.__install\s*=\s*\{/.test(capture) && /pick:\s*function/.test(capture));
  must('2.1: head script stores appinstalled flag (never missed even before app.js)',
    /appinstalled/.test(capture) && /mustashar-installed/.test(capture));
  must('2.1: install card exists, hidden by default, with i18n CTA',
    /id="installCard" hidden/.test(html) && /id="installBtn"/.test(html)
    && /data-i18n="install\.cta"/.test(html));
  must('2.1: install wiring consumes the stored prompt (pick) and honors userChoice',
    /window\.__install/.test(app) && /st\.pick\(\)/.test(app)
    && /choice\.outcome === 'accepted'/.test(app));
  must('2.1: appinstalled hides the card and shows a visible notice (no silent path)',
    /addEventListener\('appinstalled'/.test(app) && /hideInstallCard\(\)/.test(app)
    && /install\.done/.test(app));
  must('2.1: install card refreshes on boot and on language change',
    /refreshInstallCard\(\);\s*\/\/ 2\.1/.test(app)
    && /document\.addEventListener\('langchange', refreshInstallCard\)/.test(app));
  must('2.1: late prompt bridges to the UI (installavailable) — storage alone is not enough',
    /installavailable/.test(readFileSync(join(root, 'src/install-capture.js'), 'utf8'))
    && /window\.addEventListener\('installavailable', refreshInstallCard\)/.test(app));
}

/* ---------------- 2.2 unified camera flow ---------------- */
{
  must('2.2: duplicate home gallery shortcut removed from index.html',
    !/data-icon-action="gallery"/.test(html));
  must('2.2: duplicate shortcut handler removed from app.js',
    !/galShortcut/.test(app));
  must('2.2: scan view keeps exactly one camera card + one gallery card + retake button',
    /id="cameraBtn"/.test(html) && /id="galleryBtn"/.test(html) && /id="retakeBtn" hidden/.test(html));
  must('2.2: retake resets and re-enters the SAME unified flow (live or fallback capture)',
    /retakeBtn'\)\.addEventListener\('click', \(\) => \{\s*\n\s*resetScanUI\(\);\s*\n\s*if \(liveVideo && liveSupported\(\)\) startLive\(\);\s*\n\s*else camera\.click\(\);/.test(app));
  must('2.2: retake lifecycle — hidden during reads, shown when a read settles/live stops',
    /showRetake\(false\);\s*\/\/ 2\.2/.test(app) && /showRetake\(true\);\s*\/\/ 2\.2/.test(app)
    && /function showRetake\(on\)/.test(app));
  must('2.2: scan card copy describes the single flow (no second path in scan.msg)',
    !/data-i18n="scan\.msg"[^<]*اختر صورة/.test(html)
    && (i18n.match(/'scan\.msg': '([^']*)'/) || [])[1] && !/اختر صورة من المعرض/.test((i18n.match(/'scan\.msg': '([^']*)'/) || [])[1]));
  must('2.2: GLOBAL [hidden] rule — display classes never defeat the hidden attribute',
    /\[hidden\]\s*\{\s*display:\s*none\s*!important;/.test(html));
  must('2.2: scan.retake key present in all four dictionaries',
    ['إعادة التصوير', 'Retake photo', 'Reprendre la photo', '重新拍摄'].every(s => i18n.includes(s)));
}

/* ---------------- 2.3 busy gate never silent ---------------- */
{
  must('2.3: ocrBusy gate shows a message instead of returning silently',
    /'ocr\.busy'/.test(app) && /ocrMsg\.textContent = t\('ocr\.busy'/.test(app));
  must('2.3: staged NEW source cancels the running read and takes over (no ignored tap)',
    /scanSeq !== activeScanSeq/.test(app) && /OcrModule\.cancelCurrent\(\);\s*\n\s*for \(let i = 0; i < 100 && ocrBusy; i\+\+\)/.test(app));
  must('2.3: ocr.busy key present in all four dictionaries',
    ['مسح جارٍ — انتظر', 'Scan in progress — wait', 'Analyse en cours — attendez', '正在扫描——请等待'].every(s => i18n.includes(s)));
}

/* ---------------- 2.4 optional local QR ---------------- */
{
  must('2.4: vendored Nayuki encoder + license exist and are precached',
    readFileSync(join(root, 'src/vendor/qrcodegen.js'), 'utf8').includes('Project Nayuki')
    && readFileSync(join(root, 'src/vendor/LICENSE-qrcodegen.txt'), 'utf8').includes('MIT')
    && sw.includes("'./src/vendor/qrcodegen.js'") && sw.includes("'./src/qr.js'"));
  must('2.4: qr.js exposes ShowQR with URL-only payload and visible failure',
    /window\.ShowQR/.test(readFileSync(join(root, 'src/qr.js'), 'utf8'))
    && /qr\.fail/.test(readFileSync(join(root, 'src/qr.js'), 'utf8')));
  must('2.4: qr button present with icon and i18n label; qr icon maps to Lucide qr-code',
    /id="qrBtn"/.test(html) && /data-icon="qr"/.test(html) && /data-i18n="qr\.btn"/.test(html)
    && /'qr': 'qr-code'/.test(icons) && /'qr-code': '</.test(icons));
  must('2.4: qr keys present in all four dictionaries',
    ['إظهار رمز QR للمشاركة', 'Show share QR code', 'Afficher le code QR de partage', '显示分享二维码'].every(s => i18n.includes(s)));
  must('2.4: QR script loads after scan-live and before app.js',
    html.indexOf('src/vendor/qrcodegen.js') > -1
    && html.indexOf('src/qr.js') > html.indexOf('src/vendor/qrcodegen.js')
    && html.indexOf('src/qr.js') < html.indexOf('src/app.js'));
}

/* ---------------- version + SW bump ---------------- */
{
  must('SW is v30 with the dedicated permanent OCR cache intact',
    sw.includes("CACHE = 'mustashar-v32'") && sw.includes("OCR_CACHE = 'mustashar-ocr'"));
  must('version: 1.15.0 in version.json + package.json',
    JSON.parse(readFileSync(join(root, 'version.json'), 'utf8')).version === '1.15.0'
    && JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version === '1.15.0');
  must('sw.js changelog records stage 2 with today behavior-change note',
    /v26 \(2026-09-27\) — المرحلة 2/.test(sw) && /رفع الكاش v25→v26/.test(sw));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
