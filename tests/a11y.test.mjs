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
 * The second round (2026-09-30) closed the two heading findings as well: the
 * routed views carried no level-one heading and the about view stepped
 * h1 -> h3. They are no longer printed notes but part of the gate — exactly
 * one VISIBLE h1 per view and no level that skips a step, measured on the
 * rendered page across all seven views. Other moderate findings stay notes,
 * because the stated gate is the heading structure and the critical set.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const AXE_PATH = process.env.AXE_PATH || '/home/daytona/lh/node_modules/axe-core/axe.min.js';
const AXE = readFileSync(AXE_PATH, 'utf8');
const VIEWS = ['home', 'search', 'scan', 'history', 'data', 'about', 'legend'];

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

    /* The heading structure of the page as it is actually rendered — an
     * element that exists but is hidden is not a heading the farmer can
     * reach, so visibility is part of the measurement, not the DOM alone. */
    const head = await page.evaluate(() => {
      const vis = el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
      };
      const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis)
        .map(h => Number(h.tagName[1]));
      const jumps = [];
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) jumps.push(levels[i - 1] + '->' + levels[i]);
      }
      return { h1: levels.filter(l => l === 1).length, levels, jumps };
    });
    check('view ' + v + ': exactly one visible level-one heading', head.h1 === 1,
      'h1=' + head.h1 + ' levels=' + head.levels.join(','));
    check('view ' + v + ': no heading level skips a step', head.jumps.length === 0,
      'jumps=' + (head.jumps.join(' ') || 'none'));
    const headingRules = res.filter(x => x.id === 'page-has-heading-one' || x.id === 'heading-order');
    check('view ' + v + ': axe reports no heading violation', headingRules.length === 0,
      headingRules.map(x => x.id).join(' '));
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
