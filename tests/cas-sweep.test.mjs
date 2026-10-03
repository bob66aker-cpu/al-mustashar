/*
 * tests/cas-sweep.test.mjs — المسح الواسع لأرقام CAS
 * ------------------------------------------------------------------
 * Written during the night round of 2026-09-30, after CAS 50-00-0 was
 * observed returning nothing in farmer mode.
 *
 * WHAT THE EXPECTATIONS ARE, and are not:
 *   The table below was written DOWN BEFORE the app was run, and every entry
 *   in it was derived FROM THE DATA FILES — "does this source really contain
 *   a row carrying this CAS number" — not from whatever the app happens to
 *   do today. So the table is an independent claim about the data, and the
 *   app is measured against it. A snapshot of current behaviour would prove
 *   nothing; this is a claim that can fail.
 *
 *   Two things are asserted per CAS number:
 *     1) NO SILENT EMPTY BOX. Farmer mode is Libyan sources only, so a
 *        substance that exists only in the EU or EPA lists correctly shows no
 *        card — but it must still show the sentence that says not finding a
 *        substance does not mean it is permitted. Before the fix that case
 *        rendered a bare box holding nothing but the disclaimer strip, and
 *        a bare box is the one outcome a farmer can read as reassurance.
 *     2) NO INVENTED MATCH. Pro mode returns every source that genuinely
 *        holds the number, and no source that does not.
 *
 * The table is also re-derived from the data at run time, so a future data
 * update cannot let the test drift away from the files without saying so.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const ROOT = '/home/daytona/al-mustashar-work';
const KEYS = ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled'];
const LIBYA = ['libya-248', 'libya-500'];
/* D31: Canada and Australia are primary sources inside professional mode now,
   so they belong in the claim too. The EXPECT table above stays exactly as it
   was written about the five built-in files; the pack rows are derived from
   data-optional/ the same way, so the pro claim is still "what the data says",
   never "what the app happens to do today". */
const PACKS = [
  { key: 'canada', file: ROOT + '/data-optional/canada.json' },
  { key: 'australia', file: ROOT + '/data-optional/australia.json' },
];

/* the claim about the data, written before the app was consulted */
const EXPECT = {
  '50-00-0':      ['eu', 'epa'],
  '1071-83-6':    ['libya-500', 'eu', 'epa'],
  '133-06-2':     ['libya-500', 'epa'],
  '116-29-0':     ['libya-248', 'eu', 'epa-cancelled'],
  '1563-66-2':    ['libya-248', 'eu', 'epa-cancelled'],
  '94-75-7':      ['libya-248', 'libya-500', 'eu', 'epa'],
  '70630-17-0':   ['libya-500', 'eu', 'epa'],
  '8018-01-7':    ['libya-248', 'eu', 'epa'],
  '1910-42-5':    ['libya-248', 'epa'],
  '138261-41-3':  ['eu', 'epa'],
  '30560-19-1':   ['libya-248', 'eu', 'epa'],
  '121-75-5':     ['libya-500', 'eu', 'epa'],
  '77-83-1':      [],
  '50-78-2':      ['epa-cancelled'],
  '7647-14-5':    ['libya-500', 'eu', 'epa'],
  '108-95-2':     ['epa'],
  '97-56-3':      [],
  '120-83-2':     [],
  '2687-78-1':    [],
  '3407-84-0':    []
};
const CASES = Object.keys(EXPECT);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${ok || !detail ? '' : ' — ' + detail}`);
  ok ? pass++ : fail++;
};

/* ---------- 0) the claim is re-derived from the data ---------- */
const compact = s => String(s ?? '').replace(/[\s./-]/g, '');
const derived = {};
for (const c of CASES) {
  derived[c] = [];
  for (const k of KEYS) {
    const rows = JSON.parse(readFileSync(ROOT + '/data/' + k + '.json', 'utf8')).rows;
    if (rows.some(r => {
      const raw = String(r.cas || '');
      if (compact(raw) === compact(c)) return true;
      const m = raw.match(/\d{2,7}-\d{2}-\d/g);
      return !!m && m.some(x => compact(x) === compact(c));
    })) derived[c].push(k);
  }
}
let drift = 0;
for (const c of CASES) {
  const a = derived[c].slice().sort().join(',');
  const b = EXPECT[c].slice().sort().join(',');
  if (a !== b) { console.log(`  FAIL the written expectation for ${c} no longer matches the data — table says [${b}], data says [${a}]`); drift++; fail++; }
  else pass++;
}
if (!drift) console.log('  PASS the written expectation table still matches all five data files (20/20)');

/* the pack half of the pro claim: which packs genuinely carry each CAS number */
const carries = (rows, c) => rows.some(r => {
  const raw = String(r.cas || '');
  if (compact(raw) === compact(c)) return true;
  const m = raw.match(/\d{2,7}-\d{2}-\d/g);
  return !!m && m.some(x => compact(x) === compact(c));
});
const packData = PACKS.map(p => ({ key: p.key, rows: JSON.parse(readFileSync(p.file, 'utf8')).rows }));
let packDrift = 0;
for (const c of CASES) {
  derived[c] = derived[c].concat(packData.filter(p => carries(p.rows, c)).map(p => p.key));
}
for (const p of packData) {
  if (!p.rows.length) { console.log(`  FAIL the ${p.key} pack is empty in data-optional/`); packDrift++; fail++; }
}
if (!packDrift) console.log('  PASS the two pack files were read and joined into the pro claim (' + packData.map(p => p.key + ':' + p.rows.length).join(' ') + ')');

/* the engine itself, run in isolation, must already agree */
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(readFileSync(ROOT + '/src/search-core.js', 'utf8'), ctx);
const sources = KEYS.map(k => ({ key: k, rows: JSON.parse(readFileSync(ROOT + '/data/' + k + '.json', 'utf8')).rows }))
  .concat(packData.map(p => ({ key: p.key, rows: p.rows })));
const engine = ctx.SearchCore.buildSearch(sources);
for (const c of CASES) {
  const got = [...new Set(engine(c).map(x => x.k))].sort().join(',');
  const want = derived[c].slice().sort().join(',');
  check('engine: ' + c + ' -> [' + got + ']', got === want, 'expected [' + want + ']');
}

/* ---------- 1) the real app in a real browser ---------- */
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 180000
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));

  /* D31: in professional mode the two packs install themselves. The sweep has
     to wait for that before it measures the pro sources, otherwise it would
     read the packs' absence as an engine defect. */
  await page.evaluate(() => {
    const m = document.getElementById('mode');
    m.value = 'pro';
    m.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(
    () => window.PacksModule && PacksModule.list().then(k => k.includes('canada') && k.includes('australia')),
    { timeout: 240000, polling: 1000 }).catch(() => {});
  const packKeys = await page.evaluate(async () => await PacksModule.list());
  check('both packs are installed and stored before the sweep starts (D31)',
    packKeys.includes('canada') && packKeys.includes('australia'), JSON.stringify(packKeys));

  const probe = await page.evaluate(async (cases) => {
    const q = document.getElementById('query');
    const mode = document.getElementById('mode');
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const run = async (text, m) => {
      mode.value = m;
      mode.dispatchEvent(new Event('change', { bubbles: true }));
      q.value = text;
      q.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await sleep(700);
      const box = document.getElementById('results');
      const cards = [...box.querySelectorAll('.result')].map(c => c.getAttribute('data-src'));
      const warn = box.querySelector('.notice.warn');
      return {
        cards,
        warn: !!warn,
        warnText: warn ? warn.textContent.replace(/\s+/g, ' ').trim() : '',
        /* the defect this test was written for: a box with neither a card nor
         * the notice — nothing at all for the farmer to read */
        bare: !cards.length && !warn
      };
    };
    const out = {};
    for (const c of cases) {
      out[c] = { pro: await run(c, 'pro'), farmer: await run(c, 'farmer') };
    }
    return out;
  }, CASES);

  for (const c of CASES) {
    /* pro claim = the written built-in claim + the packs that truly carry the CAS */
    const wantPro = derived[c].slice().sort();
    const gotPro = [...new Set(probe[c].pro.cards)].sort();
    check('pro ' + c + ': sources [' + gotPro + ']', gotPro.join(',') === wantPro.join(','),
      'expected [' + wantPro + ']');
    check('pro ' + c + ': nothing invented outside the data',
      gotPro.every(k => wantPro.includes(k)));

    /* the farmer claim stays the built-in one: the packs are professional-only */
    const want = EXPECT[c].slice().sort();
    const libyan = want.filter(k => LIBYA.includes(k));
    if (libyan.length) {
      const f = probe[c].farmer;
      check('farmer ' + c + ': a Libyan source is shown (' + libyan.join(',') + ')',
        f.cards.length > 0 && f.cards.every(k => LIBYA.includes(k)) && libyan.some(k => f.cards.includes(k)),
        'cards=' + JSON.stringify(f.cards));
    } else {
      const f = probe[c].farmer;
      check('farmer ' + c + ': no card from a non-Libyan source', f.cards.length === 0,
        'cards=' + JSON.stringify(f.cards));
      check('farmer ' + c + ': the safety notice is shown, not silence', f.warn,
        'bare box — this is the 2026-09-30 defect');
      check('farmer ' + c + ': the notice says absence is not permission',
        /لا يعني أنه مسموح|does not mean it is approved|ne signifie pas qu|并不代表它已被批准/.test(f.warnText),
        f.warnText.slice(0, 120));
    }
    check('farmer ' + c + ': the box is never bare', !probe[c].farmer.bare);
  }

  check('no page or console errors during the whole sweep', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log('\n==============================');
console.log('CAS SWEEP: PASS ' + pass + '   FAIL ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
