#!/usr/bin/env node
/* tests/ocr-phase3-browser.test.mjs — المرحلة الثالثة في متصفح حقيقي
 * ------------------------------------------------------------------
 * على البناء المخدوم لا على نسخة محلية:
 *   1) الإعدادات المشحونة هي القيم المعايَرة المقيسة فعلاً.
 *   2) صورة ضبابية فعلاً تُرفض قبل القراءة الطويلة برسالة قصيرة واحدة.
 *   3) لا رفض زائف: الصورة المقبولة والملصق الحاد يمرّان.
 *   4) الرسالة موجودة بأربع لغات، بلا رقم ولا عتبة ولا إعداد.
 *   5) لا حارس قبول جديد: MIN_CONFIDENCE تبقى 45.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 600000,
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  /* ---- 1) the shipped defaults are the measured ones ---- */
  const t = await page.evaluate(() => OcrModule.getTuning());
  /* the gate is a normalised-Laplacian median, calibrated by
     * tests/ocr-sharp-calibrate.mjs through OcrModule.sharpness itself:
     * real photographs 1.120..2.848, the same label blurred 2px 1.503,
     * 3px 0.939, 4px 0.712, 6px 0.537. 1.0 is the only value above the
     * unreadable blur and below every real photograph. */
  ok(t.sharpGate === 1, 'the shipped sharpness gate is the calibrated 1.0 — ' + t.sharpGate);
  ok(t.wordFilter === 60, 'the shipped word filter is 60 — ' + t.wordFilter);
  ok(t.tesseractOem === true, 'the shipped engine is LSTM-only — ' + t.tesseractOem);

  /* ---- 2) a genuinely BLURRED frame stops before the slow read ----
   * The old gate judged 6.jpg "blurry" only because whole-frame Laplacian
   * variance measures ink density, not focus — 6.jpg is a real photo the
   * engine reads fine, and it scores 1.88, well above the calibrated gate.
   * The refusal is therefore tested on a frame that is blurred on purpose. */
  const blurry = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 620;
    const g = c.getContext('2d');
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, 900, 620);
    g.fillStyle = '#111';
    g.font = 'bold 34px "DejaVu Sans", Arial, sans-serif';
    g.fillText('MAXXPRO 480 SC', 40, 120);
    g.font = '24px "DejaVu Sans", Arial, sans-serif';
    g.fillText('ACTIVE INGREDIENT: Paraquat 42%', 40, 220);
    g.fillText('OTHER INGREDIENTS: 60.0%', 40, 290);
    const sharp = document.createElement('canvas');
    sharp.width = 900; sharp.height = 620;
    const sg = sharp.getContext('2d');
    sg.filter = 'blur(5px)';
    sg.drawImage(c, 0, 0);
    const blob = await new Promise(res => sharp.toBlob(res, 'image/png'));
    const r = await OcrModule.recognize(blob, null, { search: null });
    return { blockedBy: r.blockedBy || '', text: String(r.text || ''), v: r.sharpness, passes: r.passes };
  });
  ok(blurry.blockedBy === 'sharp', 'a blurred frame is stopped by the gate — ' + JSON.stringify(blurry));
  ok(blurry.text === '', 'the refused read invents no text at all');
  ok(blurry.passes === 0, 'it never spent a single OCR pass on it — passes=' + blurry.passes);

  /* ---- 2b) no REAL photograph is refused (no false rejection) ---- */
  const realPhotos = await page.evaluate(async () => {
    const out = [];
    for (const nm of ['6.jpg', 'pesticide_test_level1_ideal.png', '5.jpg', 'images (1).jpg']) {
      const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent(nm))).blob();
      const file = new File([blob], nm, { type: blob.type || 'image/jpeg' });
      const v = await OcrModule.sharpness(blob);
      out.push({ nm, v: Math.round(v * 1000) / 1000 });
    }
    return out;
  });
  for (const r of realPhotos) {
    ok(r.v > t.sharpGate, 'a real photograph is not called blurry — ' + r.nm + ' ' + r.v + ' > ' + t.sharpGate);
  }

  /* ---- 3) the one ACCEPT label is NOT refused (no false rejection) ---- */
  const good = await page.evaluate(async () => {
    const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent('images (2).jpg'))).blob();
    const file = new File([blob], 'good.jpg', { type: blob.type || 'image/jpeg' });
    const r = await OcrModule.recognize(file, null, { search: null });
    return { blockedBy: r.blockedBy || '', cas: (r.cas || []).length };
  });
  ok(good.blockedBy !== 'sharp', 'the accepted label passes the gate — ' + JSON.stringify(good));
  ok(good.cas >= 1, 'it still yields its CAS number — cas=' + good.cas);

  /* ---- 3b) a crisp label on a mostly flat canvas must NOT be called blurry ----
   * This is the regression a first threshold produced: a perfectly sharp
   * label scored LOWER than a blurred photo full of text, and the gate then
   * refused an image the OCR reads perfectly well. */
  const crisp = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 900; c.height = 620;
    const g = c.getContext('2d');
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, 900, 620);
    g.fillStyle = '#111';
    g.font = 'bold 44px "DejaVu Sans", Arial, sans-serif';
    g.fillText('Warfarin', 60, 300);
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const raw = await OcrModule.sharpness(blob);
    const v = Math.round(raw * 1000) / 1000;
    const r = await OcrModule.recognize(blob, () => {}, { search: null, messages: {} });
    return { v, blocked: r.blockedBy || '', text: String(r.text || '') };
  });
  ok(crisp.v > t.sharpGate, 'the crisp label scores above the gate — ' + crisp.v);
  ok(crisp.blocked !== 'sharp', 'the gate does not call a sharp label blurry — ' + JSON.stringify(crisp));
  ok(crisp.text.length > 0, 'that sharp label is still read — "' + crisp.text.slice(0, 30) + '"');

  /* ---- 4) the sentence is short, plain, and translated in all four ---- */
  const dicts = await page.evaluate(() => {
    const out = {};
    for (const l of ['ar', 'en', 'fr', 'zh']) {
      window.I18N.setLang(l);
      out[l] = window.I18N.t('ocr.sharp.retake', '');
    }
    window.I18N.setLang('ar');
    return out;
  });
  for (const l of ['ar', 'en', 'fr', 'zh']) {
    ok(dicts[l] && dicts[l].length > 0 && dicts[l].length < 60,
      'the retake sentence is short and translated in ' + l + ' — "' + dicts[l] + '"');
  }
  ok(!Object.values(dicts).some(v => /\d/.test(v)), 'no number, no threshold, no setting in any language');
  ok(new Set(Object.values(dicts)).size === 4, 'the four languages carry four different sentences');

  /* ---- 5) no new acceptance threshold ---- */
  const conf = await page.evaluate(() => OcrModule.MIN_CONFIDENCE);
  ok(conf === 45, 'MIN_CONFIDENCE is untouched at 45 — ' + conf);

  ok(errors.length === 0, 'zero console errors — ' + JSON.stringify(errors.slice(0, 3)));
} finally {
  await browser.close();
}

console.log('\nOCR-PHASE3-BROWSER: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
