/*
 * tests/fb9-matrix.mjs — مصفوفة الفشل (بند 1): إنتاج حي محايد (ترجمة معطّلة)
 * لكل شكل خلية تصنيف، في الوضعين، وعلى بطاقتَي البحث والمسح، بلغة واحدة.
 * النتيجة: «ينجح/يفشل» محسوبة من الخلية الخام لا من انطباع.
 * usage: node tests/fb9-matrix.mjs [baseUrl] [lang]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');
const LANG = process.argv[3] || 'ar';
const ONLY = process.argv[4] || '';   /* run one mode at a time: the shell here kills long runs */

const rowsOf = f => JSON.parse(readFileSync('data/' + f + '.json', 'utf8')).rows;
const byCat = (f, c) => (rowsOf(f).find(r => String(r.category || '').trim() === c) || {});
const SAMPLES = [
  ['libya-500', 'I + A'], ['libya-500', 'A + I'], ['libya-500', 'I+A+F'],
  ['libya-500', 'I+A+N'], ['libya-500', 'F+N+PGR'], ['libya-500', 'I + A + N'],
  ['libya-500', 'I+A,gr'], ['libya-500', 'I,rep'], ['libya-500', 'N+P.G.R'],
  ['libya-500', 'F+A,rep'], ['libya-500', 'R,rep'],
  ['libya-248', 'I/A'], ['libya-248', 'F/Mi'], ['libya-248', 'I/A/F'],
  ['libya-248', 'I/A/N/PGR'], ['libya-248', 'I/N/R/FM'], ['libya-248', 'I/N/F/A/R/FM']
].map(([f, c]) => {
  const r = byCat(f, c);
  /* a multi-line name is not one searchable string — reach that row by its CAS */
  const nm = String(r.name || '');
  const q = nm.includes('\n') ? String(r.cas || '').split('\n')[0].trim().replace(/[\[\]]/g, '') : nm.trim();
  return { src: f, cat: c, q, cas: r.cas };
}).filter(s => s.q);

/* D43/D45: the reference table lives in data/reference.json — read from it,
 * never retyped here; D45 adds the declared category kind, so a descriptive
 * section is measured as "no codes to resolve" instead of "unknown codes". */
const app = readFileSync('src/app.js', 'utf8');
const REF = JSON.parse(readFileSync('data/reference.json', 'utf8'));
const REF_BY_SOURCE = { 'libya-500': 'libya500', 'libya-248': 'libya248', eu: 'eu', epa: 'epa', canada: 'canada', australia: 'australia' };
const SECTION = srcKey => REF.sections[REF_BY_SOURCE[srcKey] || 'libya500'];
const fold = x => String(x || '').toLowerCase().replace(/[.\s]/g, '');
const entryOf = (srcKey, code) => {
  let sec = SECTION(srcKey);
  if (!sec || !sec.categories) return null;
  const key = String(code).trim();
  if (sec.categories[key]) return sec.categories[key];
  for (const e of Object.values(sec.categories))
    for (const sh of e.shapes || [])
      if (fold(sh) === fold(key)) return e;
  if (sec.fallbackSection && sec.fallbackSection !== sec && REF.sections[sec.fallbackSection]) {
    sec = REF.sections[sec.fallbackSection];
    return entryOf(REF_BY_SOURCE[srcKey], code);
  }
  return null;
};
const known = (p, srcKey = 'libya-500') => !!entryOf(srcKey, p);
const currentSrc = 'libya-500';

/* FB9's rule, computed from the raw cell: every part is either explained or
 * NAMED verbatim inside the sentence. The `/` slice stays one block. */
function verdict(cell, meaning, srcKey = currentSrc) {
  /* D45: a descriptive column has no codes to resolve — the cell IS the text. */
  if (SECTION(srcKey).categoryKind === 'descriptive')
    return { parts: [cell], unknowns: [], named: true, ok: meaning.trim() === cell.trim() };
  const parts = cell.split(/[/+,]/).map(p => p.trim()).filter(Boolean)
    .flatMap(p => p.includes('.') && p.split('.').every(q => known(q, srcKey)) ? p.split('.').map(q => q.trim()) : [p]);
  const unknowns = parts.filter(p => !known(p, srcKey));
  const named = unknowns.every(u => meaning.includes(u));
  const blocksKept = 1; /* the card renders the cell as ONE block; checked live */
  return { parts, unknowns, named, ok: named && blocksKept === 1 };
}

const ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
              '--disable-features=Translate,TranslateUI', '--disable-translate', '--lang=ar'];
const rowsOut = [];

/* The matrix is long; a single browser dies somewhere around the 30th sample,
 * so the run is chunked: a fresh browser per chunk, both containers measured
 * inside each chunk. A dead chunk is a FAILING row, never a silent skip. */
const CHUNK = 9;
async function runChunk(samples, mode) {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', protocolTimeout: 120000, args: ARGS
  });
  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(l => {
      try { localStorage.setItem('mustashar-lang', l); } catch (e) {}
      document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('translate', 'no'));
    }, LANG);
    await page.goto(BASE + '/index.html#/search', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.SearchCore && document.querySelector('#query'), { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2200));
    await page.evaluate(m => {
      const sel = document.querySelector('#mode'); sel.value = m; sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, mode);
    await new Promise(r => setTimeout(r, 400));

    for (const s of samples) {
      let found = null, crashed = false;
      try {
        found = await page.evaluate(async (q, srcKey) => {
          const read = box => {
            const card = Array.from(box.querySelectorAll('article.result')).find(c => c.getAttribute('data-src') === srcKey);
            if (!card) return null;
            return {
              lines: Array.from(card.querySelectorAll('.cat-line')).map(l => ({
                code: (l.querySelector('.cat-code') || {}).textContent.trim(),
                meaning: (l.querySelector('.cat-meaning') || {}).textContent.trim()
              }))
            };
          };
          document.querySelector('#query').value = q;
          document.querySelector('#query').dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelector('#searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 1200));
          const search = read(document.querySelector('#results'));
          location.hash = '#/scan';
          await new Promise(r => setTimeout(r, 250));
          await window.runScanPipeline(q);
          await new Promise(r => setTimeout(r, 1200));
          const scan = read(document.querySelector('#scanResults'));
          location.hash = '#/search';
          await new Promise(r => setTimeout(r, 150));
          return { search, scan };
        }, s.q, s.src);
      } catch (e) { crashed = true; }
      rowsOut.push(sample(s, mode, found, crashed));
    }
  } finally {
    try { await browser.close(); } catch (e) {}
  }
}

function sample(s, mode, found, crashed) {
  const lines = found && found.search ? found.search.lines : [];
  const cell = lines[0] ? lines[0].code : '';
  const meaning = lines[0] ? lines[0].meaning : '';
  const scanLines = found && found.scan ? found.scan.lines : [];
  const scanMeaning = scanLines[0] ? scanLines[0].meaning : '';
  const v = cell ? verdict(cell, meaning, s.src) : null;
  return {
    src: s.src, cell: s.cat, q: s.q, mode, crashed: !!crashed,
    searchCell: cell, meaning, scanMeaning,
    unknowns: v ? v.unknowns : null, ok: !!(v && v.ok),
    scanSame: scanLines.length === lines.length && scanMeaning === meaning,
    blocks: lines.length
  };
}

for (const mode of (ONLY ? [ONLY] : ['farmer', 'pro'])) {
  for (let i = 0; i < SAMPLES.length; i += CHUNK) {
    await runChunk(SAMPLES.slice(i, i + CHUNK), mode);
    process.stdout.write('  chunk ' + mode + ' ' + (i / CHUNK + 1) + '/' + Math.ceil(SAMPLES.length / CHUNK) + '\n');
  }
}

let pass = 0, fail = 0;
console.log('source      cell           mode    blocks  unknowns            verdict  search-meaning');
for (const r of rowsOut) {
  const ok = r.ok && r.scanSame && r.blocks === 1 && !r.crashed;
  ok ? pass++ : fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') +
    (r.src + '        ').slice(0, 11) + ' ' +
    (JSON.stringify(r.cell) + '               ').slice(0, 13) + ' ' +
    (r.mode + '     ').slice(0, 7) + ' ' +
    String(r.blocks).padEnd(7) + ' ' +
    (JSON.stringify(r.unknowns) + '                    ').slice(0, 18) + ' ' +
    (r.ok ? 'ok   ' : 'FAIL ') + '   ' + JSON.stringify(r.meaning).slice(0, 70));
}
console.log('\nFB9-MATRIX: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);