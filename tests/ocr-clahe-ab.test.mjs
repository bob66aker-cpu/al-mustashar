/*
 * tests/ocr-clahe-ab.test.mjs — CLAHE: does it earn its four pass slots?
 * ---------------------------------------------------------------------
 * CLAHE is a real variant (8×8 tiles, clip 2.5×) queued in lane `deep4`.
 * MAX_PASSES is 14, so those four slots are TAKEN FROM deep3/rotations —
 * they are not free. On the 17 real photos the trade looked harmless
 * (ACCEPT 1→1, +2.7% time, one image gained text), so the flag was turned
 * on; the functional E2E suite then lost a case (rotated_90).
 *
 * This test is the permanent guard. It runs the REAL engine both ways on the
 * rotation label the E2E suite uses, proves CLAHE variants actually EXECUTE
 * when the flag is on (execution, not code existence), and holds the SHIPPED
 * tuning to the owner's rule: no acceptance may be lost.
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';

let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
  if (cond) { pass++; console.log('PASS ' + label + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('FAIL ' + label + (extra ? ' — ' + extra : '')); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 600000,
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  /* the dev harness page has no favicon; that 404 is not ours */
  page.on('console', m => {
    const url = (m.location() && m.location().url) || '';
    if (m.type() === 'error' && !/favicon/.test(m.text() + ' ' + url)) errors.push(m.text() + ' ' + url);
  });
  await page.goto(BASE + '/tests/v2-suite.html', { waitUntil: 'domcontentloaded', timeout: 30000 });

  const r = await page.evaluate(async () => {
    const specs = [
      ['libya-248', '/data/libya-248.json'], ['libya-500', '/data/libya-500.json'],
      ['eu', '/data/eu.json'], ['epa', '/data/epa.json']
    ];
    const sources = [];
    for (const [k, u] of specs) {
      const d = await (await fetch(u, { cache: 'no-store' })).json();
      sources.push({ key: k, rows: (d.rows || d).map(x => ({ ...x, source: k })) });
    }
    const search = SearchCore.buildSearch(sources);

    /* the SAME case the functional suite calls rotated_90 */
    /* the label lines are copied verbatim from tests/v2-suite.html (case 12) */
    const AI = (chem, pct) => [
      { t: 'MAXXPRO 480 SC', size: 34, bold: true },
      { t: 'Suspension Concentrate', size: 20 },
      { t: 'ACTIVE INGREDIENT:', size: 24, bold: true },
      { t: chem + (pct ? ' ' + pct : ''), size: 26 },
      { t: 'OTHER INGREDIENTS: 60.0%', size: 22 },
      { t: 'EPA Reg. No. 264-1152', size: 20 },
      { t: 'Keep Out of Reach of Children', size: 20 }
    ];
    const canvas = window.__labelCanvas({ lines: AI('Glyphosate', '41%'), rotate: Math.PI / 2 });
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], 'rotated_90.png', { type: 'image/png' });

    const rank = { 'libya-248': 0, 'libya-500': 1, eu: 2, epa: 3, 'epa-cancelled': 4 };
    const bestOf = (cas, cands) => {
      const byRow = new Map();
      const pushAll = list => (list || []).forEach(x => {
        const prev = byRow.get(x.r);
        if (!prev || x.s.v > prev.s.v) byRow.set(x.r, x);
      });
      for (const casn of cas || []) pushAll(search(casn, true));
      for (const c of cands || []) pushAll(search(c, false));
      const merged = [...byRow.values()];
      merged.sort((a, b) => (rank[a.k] - rank[b.k]) || (b.s.v - a.s.v));
      return merged;
    };

    const run = async (clahe) => {
      OcrModule.setTuning({ clahe });
      const variants = [];
      OcrModule.setDiagnosticsSink(m => { if (m && m.variant) variants.push(String(m.variant)); });
      const t0 = performance.now();
      const res = await OcrModule.recognize(file, null, { search });
      const ms = Math.round(performance.now() - t0);
      OcrModule.setDiagnosticsSink(null);
      const merged = bestOf(res.cas, res.candidates);
      const top = merged[0];
      return {
        clahe, ms, passes: res.passes || 0,
        textLen: String(res.text || '').length,
        top: top ? String(top.r.name || '').slice(0, 40) : '',
        score: top ? Math.round(top.s.v) : 0,
        glyph: !!(top && /glyphosate/i.test(String(top.r.name || '')) && top.s.v >= 96),
        variants
      };
    };

    const shipped = !!(OcrModule.getTuning && OcrModule.getTuning().clahe);
    const off = await run(false);
    const on = await run(true);
    OcrModule.setTuning({ clahe: shipped });
    return { shipped, off, on };
  });

  const brief = a => JSON.stringify({ ms: a.ms, passes: a.passes, top: a.top, score: a.score, glyph: a.glyph, textLen: a.textLen });
  console.log('SHIPPED clahe=' + r.shipped);
  console.log('OFF  ' + brief(r.off));
  console.log('ON   ' + brief(r.on));

  ok(r.off.glyph === true, 'with CLAHE off the rotated label is read', brief(r.off));
  const claheSeen = r.on.variants.filter(v => /clahe/.test(v));
  ok(claheSeen.length > 0, 'CLAHE variants really execute when the flag is on',
    claheSeen.join(',') || 'none seen');
  ok(!r.off.variants.some(v => /clahe/.test(v)), 'no CLAHE variant runs when the flag is off',
    r.off.variants.length + ' variants, none clahe');

  if (r.shipped) {
    ok(r.on.glyph === r.off.glyph, 'shipped CLAHE does not lose the rotation acceptance',
      'off=' + r.off.glyph + ' on=' + r.on.glyph);
  } else {
    ok(r.on.glyph === false && r.off.glyph === true,
      'CLAHE stays disabled because the on-arm loses the rotation acceptance',
      'off=' + r.off.glyph + ' on=' + r.on.glyph);
  }

  ok(errors.length === 0, 'zero console errors', JSON.stringify(errors).slice(0, 200));
} finally {
  await browser.close();
}

console.log('\nOCR-CLAHE-AB: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
