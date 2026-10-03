/*
 * tests/fb11-dupes.mjs — فيدباك 11 / D30: قياس «قبل» لتكرار البطاقات
 * ---------------------------------------------------------------------------
 * جدول (المادة × المصدر × عدد البطاقات المعروضة) على عينات معلنة.
 * كلمة بحث المالك لم تصل ⇒ العينات **بديلة لا اللقطة** (موسومة كذلك في المخرج).
 * القياس على حاويتين: البحث (#results) والمسح (#scanResults).
 * usage: node tests/fb11-dupes.mjs [baseUrl] [mode]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');
const ONLY = process.argv[3] || '';

/* declared samples (alternates, clearly labelled) */
const SAMPLES = [
  { q: 'Glyphosate', why: 'declared 1 — one row per source today (the CONTROL: must not shrink)' },
  { q: 'Captan', why: 'declared 2 — a SHARED CAS (FB5-b protection: must not merge)' },
  { q: 'Bacillus', why: 'declared 3 — the Bacillus family (17 rows in 500 alone)' },
  { q: 'aliphatic petroleum solvent', why: 'declared 4 — one NAME, 9 rows in EPA, 9 different CAS' },
  { q: '64-19-7', why: 'declared 5 — one CAS, two NAMES, CONFLICTING status (Acetic acid/Approved vs Vinegar/REV)' }
];

const rows = JSON.parse(readFileSync('data/libya-500.json', 'utf8')).rows
  .concat(JSON.parse(readFileSync('data/libya-248.json', 'utf8')).rows);
for (const s of SAMPLES) {
  const hits = rows.filter(r => String(r.name || '').toLowerCase().includes(s.q.toLowerCase().split(' ')[0].toLowerCase()));
  s.dbHits = hits.length;
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--disable-features=Translate,TranslateUI', '--disable-translate']
});

const out = [];
for (const mode of (ONLY ? [ONLY] : ['farmer', 'pro'])) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('mustashar-lang', 'ar'); } catch (e) {}
    document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('translate', 'no'));
  });
  await page.goto(BASE + '/index.html#/search', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.SearchCore && document.querySelector('#query'), { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2200));
  await page.evaluate(m => {
    const s = document.querySelector('#mode'); s.value = m; s.dispatchEvent(new Event('change', { bubbles: true }));
  }, mode);
  await new Promise(r => setTimeout(r, 400));

  for (const s of SAMPLES) {
    const got = await page.evaluate(async (q) => {
      const read = box => Array.from(box.querySelectorAll('article.result')).map(c => ({
        src: c.getAttribute('data-src'),
        name: ((c.querySelector('h3') || {}).textContent || '').trim(),
        match: ((c.querySelector('.mt-partial, .mt-candidate, p.match') || {}).textContent || '').trim()
      }));
      document.querySelector('#query').value = q;
      document.querySelector('#query').dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 2000));
      const search = read(document.querySelector('#results'));
      location.hash = '#/scan';
      await new Promise(r => setTimeout(r, 250));
      await window.runScanPipeline(q);
      await new Promise(r => setTimeout(r, 2000));
      const scan = read(document.querySelector('#scanResults'));
      location.hash = '#/search';
      await new Promise(r => setTimeout(r, 150));
      return { search, scan };
    }, s.q);

    const bySource = {};
    for (const c of got.search) (bySource[c.src] = bySource[c.src] || []).push(c.name);
    out.push({ mode, sample: s.q, why: s.why, dbHits: s.dbHits,
               searchCards: got.search.length, scanCards: got.scan.length, bySource,
               searchIdentical: got.search.map(c => c.src + '|' + c.name).join(' ~ ') === got.scan.map(c => c.src + '|' + c.name).join(' ~ ') });
  }
  await page.close();
}
await browser.close();

console.log('\n=== FB11 / D30 card matrix — samples are ALTERNATES, not the owner\'s snapshot ===');
console.log('mode    sample                  dbRows  cards(search/scan)  per-source card counts');
for (const r of out) {
  const per = Object.entries(r.bySource).map(([k, v]) => k + '=' + v.length).join(' ') || '(none)';
  console.log((r.mode + '        ').slice(0, 7) + (r.sample + '                    ').slice(0, 23) +
    String(r.dbHits).padEnd(8) + (r.searchCards + '/' + r.scanCards).padEnd(18) + per);
}
for (const r of out) if (r.bySource) {
  for (const [src, names] of Object.entries(r.bySource)) {
    if (names.length > 1) console.log('  DUPLICATE ' + r.mode + ' ' + src + ': ' + JSON.stringify(names));
  }
}
const mismatched = out.filter(r => !r.searchIdentical);
console.log('\nsearch vs scan disagreement rows: ' + mismatched.length);