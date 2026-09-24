/*
 * tests/ocr-compare.mjs — OCR engine comparison harness (Phase A, 2026-09-23).
 *
 * Measures engines over TWO sets, one JSON line per case on stdout:
 *   set=suite   24 synthetic cases (the 20 v2-suite equivalents + the four
 *               probe cases) classified against their expected outcome:
 *                 correct-accept / wrong-accept / correct-reject / wrong-reject
 *   set=labels  the 17 real fixture photos. ground-truth.csv has NO data rows
 *               (the user fills it from their own reading), so correctness is
 *               NOT measured — evidence (verdict, top row, CAS, time) is.
 *
 * Engines (choose with argv):
 *   current   the production OcrModule.recognize() pipeline, unchanged.
 *   paddle    @paddleocr/paddleocr-js@0.4.2 (PP-OCRv5 mobile, ORT-Web WASM)
 *             from esm.sh; its lines go through the SAME production
 *             SearchCore merge. Experiment only — never shipped.
 *
 * Usage: node tests/ocr-compare.mjs <current|paddle> <suite|labels> [from] [to]
 * Requires a static server on BASE (default http://127.0.0.1:8080).
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const ENGINE = process.argv[2] || 'current';
const SET = process.argv[3] || 'suite';
const FROM = parseInt(process.argv[4] || '1', 10);
const TO = parseInt(process.argv[5] || '99', 10);

const LABELS = [
  '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
  '100.jpg', '101.jpg', '103.jpg', '105.jpg', '106.jpg',
  'images.jpg', 'images (1).jpg', 'images (2).jpg', 'images (3).jpg',
  'pesticide_test_level1_ideal.png',
  'pesticide_test_level3_damaged.png',
  'pesticide_test_level4_lowlight.png'
];

const SUITE_COUNT = 24;

/* ---------- classification (in the runner, from the recorded verdict) --- */
function classify(rec) {
  if (rec.error) return { cls: 'error' };
  /* recompute expectations from the name (single source: the page) */
  const accepted = rec.verdict === 'confirmed';
  const expect = window.__EXPECT[rec.name];
  if (!expect) return { cls: 'unknown-case' };
  if (expect.accept) {
    if (accepted && expect.accept.test(rec.top || '')) return { cls: 'correct-accept' };
    if (accepted) return { cls: 'wrong-accept' };   /* accepted something else */
    return { cls: 'wrong-reject' };
  }
  /* expect.reject */
  if (accepted) return { cls: 'wrong-accept' };
  return { cls: 'correct-reject' };
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar'],
  protocolTimeout: 300000
});
try {
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('# PAGE-ERROR ' + String(e.message).slice(0, 200)));
  page.on('console', m => {
    const t = m.text();
    if (t.startsWith('[compare]')) console.log('# ' + t.slice(0, 250));
  });

  await page.goto(BASE + '/tests/ocr-compare.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !!(window.SearchCore && window.OcrModule), { timeout: 60000 });
  await page.evaluate(() => window.__loadDBs());

  /* expectations live here (names must match the page's case list) */
  await page.evaluate(() => {
    const AI = window.__AI;
    window.__EXPECT = {
      glyphosate_clear: { accept: /glyphosate/i },
      bifenthrin_trade: { accept: /bifenthrin/i },
      ddt_active: { accept: /ddt/i },
      acetamiprid_small: { accept: /acetamiprid/i },
      clethodim_lowcontrast: { accept: /clethodim/i },
      hexa_lightondark: { accept: /hexachloro/i },
      alum_sulfate: { accept: /alum/i },
      cas_exact: { accept: /glyphosate/i },
      cas_spaces: { accept: /glyphosate/i },
      cas_OI_confusion: { accept: /glyphosate/i },
      cas_S_confusion: { accept: /glyphosate/i },
      rotated_90: { accept: /glyphosate/i },
      rotated_180: { accept: /bifenthrin/i },
      rotated_270: { accept: /paraquat/i },
      tiny_text: { accept: /imidacloprid/i },
      noisy_image: { accept: /mancozeb/i },
      epa_reg_negative: { reject: true },
      noise_no_match: { reject: true },
      trade_name_only: { reject: true },
      multi_chemical: { accept: /(chlorpyrifos|cypermethrin)/i },
      probe_blank: { reject: true },
      probe_noise_random: { reject: true },
      probe_logo: { reject: true },
      probe_label: { accept: /chlorpyrifos/i }
    };
  });

  const runFn = ENGINE === 'paddle'
    ? (spec) => window.__paddleRun(spec)
    : (spec) => window.__compareRun(spec);
  const labelFn = ENGINE === 'paddle'
    ? (nm) => window.__paddleLabel(nm)
    : (nm) => window.__compareLabel(nm);

  if (ENGINE === 'paddle') {
    await page.waitForFunction(() => window.__paddleReady === true, { timeout: 240000, polling: 1000 });
  }

  if (SET === 'suite') {
    /* the case spec list mirrors the page's builders by name */
    const specs = await page.evaluate(() => {
      const AI = window.__AI;
      return [
        { name: 'glyphosate_clear', lines: AI('Glyphosate', '48.8%') },
        { name: 'bifenthrin_trade', lines: AI('Bifenthrin', '7.9%') },
        { name: 'ddt_active', lines: AI('DDT', '75%') },
        { name: 'acetamiprid_small', lines: AI('Acetamiprid', '20%'), W: 640, H: 460 },
        { name: 'clethodim_lowcontrast', lines: AI('Clethodim', '24%'), fg: '#8a8a86', bg: '#e4e4de' },
        { name: 'hexa_lightondark', lines: AI('Hexachlorobenzene', '10%'), bg: '#1c1c1e', fg: '#e8e8e2' },
        { name: 'alum_sulfate', lines: AI('Aluminum sulfate', '48%') },
        { name: 'cas_exact', lines: [{ t: 'Contains:', size: 22 }, { t: 'CAS 1071-83-6', size: 30, bold: true }] },
        { name: 'cas_spaces', lines: [{ t: 'CAS 1071 - 83 - 6', size: 30, bold: true }] },
        { name: 'cas_OI_confusion', lines: [{ t: 'CAS IO7I-83-6', size: 30, bold: true }] },
        { name: 'cas_S_confusion', lines: [{ t: 'CAS 1O7I-8S-6', size: 30, bold: true }] },
        { name: 'rotated_90', lines: AI('Glyphosate', '41%'), rotate: Math.PI / 2 },
        { name: 'rotated_180', lines: AI('Bifenthrin', '7.9%'), rotate: Math.PI },
        { name: 'rotated_270', lines: AI('Paraquat', '27.6%'), rotate: -Math.PI / 2 },
        { name: 'tiny_text', lines: [{ t: 'ACTIVE INGREDIENT:', size: 13 }, { t: 'Imidacloprid 17.8%', size: 12 }, { t: 'OTHER: 82.2%', size: 12 }], W: 480, H: 300 },
        { name: 'noisy_image', lines: AI('Mancozeb', '80%'), noise: 90 },
        { name: 'epa_reg_negative', lines: [{ t: 'EPA Reg. No. 264-1152', size: 28, bold: true }, { t: 'Batch 2451-02-7', size: 26 }] },
        { name: 'noise_no_match', streaks: true },
        { name: 'trade_name_only', lines: [{ t: 'MAXXPRO 480', size: 40, bold: true }] },
        { name: 'multi_chemical', lines: [
          { t: 'DUO COMBO', size: 30, bold: true }, { t: 'ACTIVE INGREDIENTS:', size: 22, bold: true },
          { t: 'Chlorpyrifos 30%', size: 24 }, { t: 'Cypermethrin 10%', size: 24 }] },
        { name: 'probe_blank', probe: 'blank' },
        { name: 'probe_noise_random', probe: 'noise' },
        { name: 'probe_logo', probe: 'logo' },
        { name: 'probe_label', probe: 'label' }
      ];
    });
    const list = specs.slice(FROM - 1, TO);
    for (const spec of list) {
      const out = await Promise.race([
        page.evaluate(runFn, spec),
        new Promise(res => setTimeout(() => res({ name: spec.name, engine: ENGINE, error: 'watchdog 280s' }), 280000))
      ]).catch(e => ({ name: spec.name, engine: ENGINE, error: String((e && e.message) || e).slice(0, 160) }));
      console.log('COMPARE_JSON ' + JSON.stringify(out));
    }
  } else {
    const list = LABELS.slice(FROM - 1, Math.min(TO, LABELS.length));
    for (let i = 0; i < list.length; i++) {
      const nm = list[i];
      const out = await Promise.race([
        page.evaluate(labelFn, nm),
        new Promise(res => setTimeout(() => res({ name: nm, engine: ENGINE, error: 'watchdog 280s' }), 280000))
      ]).catch(e => ({ name: nm, engine: ENGINE, error: String((e && e.message) || e).slice(0, 160) }));
      out.n = FROM + i;
      console.log('COMPARE_JSON ' + JSON.stringify(out));
    }
  }
} finally {
  await browser.close();
  process.exit(0);
}
