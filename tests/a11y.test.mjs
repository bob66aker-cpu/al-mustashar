/*
 * tests/a11y.test.mjs — بوابة الوصول (axe-core)
 * ------------------------------------------------------------------
 * Added in the night round of 2026-09-30. The release gate is ZERO critical
 * violations, measured in a real browser on every view the farmer can reach.
 *
 * What it caught: the two file inputs (#camera, #gallery) are 1px and
 * clipped, and are opened by the visible scan buttons, so they carried no
 * accessible name of their own. axe called that critical, and it is the kind
 * of thing a screen reader announces as an unlabelled field.
 *
 * Moderate findings are reported but do not fail the gate, because the gate
 * is stated as critical-only. They are printed so a later round can see them
 * rather than discover them: a level-one heading is present on the document
 * but not on every routed view, and the about view steps h1 -> h3.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const AXE_PATH = process.env.AXE_PATH || '/home/daytona/lh/node_modules/axe-core/axe.min.js';
const AXE = readFileSync(AXE_PATH, 'utf8');
const VIEWS = ['home', 'search', 'scan', 'history', 'data', 'about'];

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ' — ' + detail}`);
  ok ? pass++ : fail++;
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 180000
});
const tally = { critical: 0, serious: 0, moderate: 0, minor: 0 };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const resp = await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  check('the page loads over the network', !!resp && resp.status() === 200, 'HTTP ' + (resp && resp.status()));
  await new Promise(r => setTimeout(r, 2500));

  for (const v of VIEWS) {
    await page.evaluate((view) => { location.hash = '#/' + view; }, v);
    await new Promise(r => setTimeout(r, 900));
    await page.evaluate(AXE);
    const res = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
      });
      return r.violations.map(x => ({
        id: x.id, impact: x.impact, help: x.help, nodes: x.nodes.length,
        sample: x.nodes.slice(0, 2).map(n => (n.html || '').replace(/\s+/g, ' ').slice(0, 110))
      }));
    });
    for (const x of res) if (x.impact && tally[x.impact] !== undefined) tally[x.impact]++;
    const crit = res.filter(x => x.impact === 'critical');
    check('view ' + v + ': zero critical violations', crit.length === 0,
      crit.map(c => c.id + ' (' + c.nodes + ' nodes) ' + c.sample.join(' / ')).join(' | '));
    for (const x of res.filter(c => c.impact !== 'critical')) {
      console.log('       note [' + x.impact + '] ' + v + ': ' + x.id + ' — ' + x.help + ' (' + x.nodes + ')');
    }
  }

  /* the accessible names must FOLLOW the language, not stay in one tongue */
  await page.evaluate(() => { location.hash = '#/scan'; });
  await new Promise(r => setTimeout(r, 700));
  const langs = await page.evaluate(async () => {
    const sel = document.getElementById('langSelect');
    const out = [];
    for (const code of ['ar', 'en', 'fr', 'zh']) {
      sel.value = code;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      out.push({
        code,
        camera: document.getElementById('camera').getAttribute('aria-label') || '',
        gallery: document.getElementById('gallery').getAttribute('aria-label') || ''
      });
    }
    return out;
  });
  for (const l of langs) {
    check('the file input names are translated in ' + l.code,
      !!l.camera.trim() && !!l.gallery.trim(), JSON.stringify(l));
  }
  const distinct = new Set(langs.map(l => l.camera)).size;
  check('the names really change with the language (not one fixed string)', distinct > 1,
    'distinct camera labels: ' + distinct);
} finally {
  await browser.close();
}

console.log('\n  axe tally: critical ' + tally.critical + ' | serious ' + tally.serious +
            ' | moderate ' + tally.moderate + ' | minor ' + tally.minor);
console.log('==============================');
console.log('A11Y: PASS ' + pass + '   FAIL ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
