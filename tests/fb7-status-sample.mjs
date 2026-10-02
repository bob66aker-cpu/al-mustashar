/*
 * tests/fb7-status-sample.mjs — فيدباك 7: البوابة الحيّة
 * ---------------------------------------------------------------------------
 * تشغّل بطاقات حقيقية من data/ في متصفح حقيقي (لا وهم) وتقرأ ما يراه المزارع:
 *   · 2,4-D (94-75-7) → الرمز REV* — الحالة التي كانت تعرض جملة الربط وحدها
 *     ولا تعرض ولا جملة REV ولا ملاحظة النجمة (هذه هي العينة الحاسمة).
 *   · 1-Decanol (112-30-1) → REV.
 *   · مادة Approved من البيانات (تُقرأ من data/libya-500.json وقت التشغيل).
 *   · DDT من قرار 248.
 *   · مادة أوروبية Not approved في وضع المحترف (الاحتياطي يطبع نص المصدر حرفاً).
 * الوضعان: farmer و pro.
 * تشغيل: node tests/fb7-status-sample.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const check = (n, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  << ' + extra));
  ok ? pass++ : fail++;
};

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');

/* real rows, read out of the data itself — the sample can never drift */
const rows500 = JSON.parse(readFileSync('data/libya-500.json', 'utf8')).rows;
const rowOf = st => rows500.find(r => r.status === st);
const euRows = JSON.parse(readFileSync('data/eu.json', 'utf8')).rows;
/* the sample must be findable: a name that only ONE row of the WHOLE data set
 * carries, plain Latin, no CAS shared with another substance */
const allRows = ['libya-500', 'libya-248', 'eu', 'epa', 'epa-cancelled']
  .flatMap(k => JSON.parse(readFileSync('data/' + k + '.json', 'utf8')).rows);
const nameCount = new Map();
for (const r of allRows) {
  const n = String(r.name || '').trim().toLowerCase();
  nameCount.set(n, (nameCount.get(n) || 0) + 1);
}
const euNA = euRows.find(r => r.status_raw === 'Not approved'
  && /^[A-Za-z][A-Za-z0-9\-]{4,40}$/.test(String(r.name || '').trim())
  && nameCount.get(String(r.name).trim().toLowerCase()) === 1);
if (!euNA) throw new Error('no European "Not approved" row with a unique plain name');
const SAMPLES = [
  { q: '94-75-7', src: 'libya-500', status: 'REV*' },
  { q: '112-30-1', src: 'libya-500', status: 'REV' },
  { q: String(rowOf('Approved').cas), src: 'libya-500', status: 'Approved' },
  { q: 'DDT', src: 'libya-248', status: 'محظور' },
  { q: String(euNA.name).trim(), src: 'eu', status: euNA.status_raw, proOnly: true }
];
/* the three lines the guide gives REV*, taken from the ar dictionary itself */
const I18N_SRC = readFileSync('src/i18n.js', 'utf8');
function dictOf(lang) {
  const start = I18N_SRC.search(new RegExp('^\\s+' + lang + ':\\s*\\{', 'm'));
  const rest = I18N_SRC.slice(start);
  const end = rest.search(/^\s{4}\};/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const map = new Map();
  for (const m of body.matchAll(/'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'/g)) {
    if (!map.has(m[1])) map.set(m[1], m[2]
      .replace(/\\u([0-9a-fA-F]{4})/g, (x, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\'/g, "'"));
  }
  return map;
}
const AR = dictOf('ar');
check('the ar dictionary was read out of i18n.js', AR.size > 200, String(AR.size));
const REVSTAR_LINES = ['st.500.revstar.explain', 'st.500.rev.explain', 'st.500.revstar.note'].map(k => AR.get(k) || '');
check('the three REV* lines exist in the dictionary', REVSTAR_LINES.every(l => l.length > 20));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  protocolTimeout: 300000
});

for (const mode of ['farmer', 'pro']) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewport({ width: 430, height: 1000, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('mustashar-lang', 'ar'); } catch (e) {}
  });
  await page.goto(BASE + '/#/search', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.SearchCore && document.querySelector('#query'), { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  /* the mode is NOT persisted: it lives in the #mode select, like a farmer
     would set it — setting a localStorage key here would silently test farmer
     twice */
  await page.evaluate(m => {
    const sel = document.querySelector('#mode');
    sel.value = m;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, mode);
  await page.waitForFunction(m => document.querySelector('#mode').value === m, {}, mode);
  const modeNow = await page.evaluate(() => document.querySelector('#mode').value);
  check('[' + mode + '] the mode select really is ' + mode, modeNow === mode, modeNow);

  for (const s of SAMPLES) {
    if (s.proOnly && mode !== 'pro') continue;
    const got = await page.evaluate(async (q, srcKey) => {
      const el = document.querySelector('#query');
      el.value = q;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#searchForm button[type=submit]').click();
      await new Promise(r => setTimeout(r, 2500));
      const card = Array.from(document.querySelectorAll('#results article.result'))
        .find(c => c.getAttribute('data-src') === srcKey);
      if (!card) return null;
      const line = card.querySelector('.st-explain-full');
      return {
        badge: (card.querySelector('.status') || {}).textContent || '',
        explain: line ? line.textContent.trim() : '',
        visible: line ? !!(line.checkVisibility && line.checkVisibility()) : false,
        h: line ? Math.round(line.getBoundingClientRect().height) : 0
      };
    }, s.q, s.src);
    const tag = '[' + mode + '] ' + s.src + ' ' + s.status;
    if (!got) {
      const all = await page.evaluate(() => Array.from(document.querySelectorAll('#results article.result'))
        .map(c => c.getAttribute('data-src') + ':' + (c.querySelector('h3') || {}).textContent));
      console.log('    (cards present for ' + s.q + ': ' + JSON.stringify(all) + ')');
    }
    check(tag + ' — the card exists', !!got, 'query ' + s.q);
    if (!got) continue;
    if (s.src === 'libya-500') {
      check(tag + ' — the explanation line is on the card and visible',
            got.explain.length > 30 && got.visible && got.h > 20, JSON.stringify(got).slice(0, 220));
      if (s.status === 'REV*') {
        check(tag + ' — all three lines the guide gives it are printed',
              REVSTAR_LINES.every(l => l && got.explain.includes(l)), got.explain);
      } else {
        check(tag + ' — the line is the dictionary text verbatim',
              got.explain === AR.get('st.500.' + ({ REV: 'rev', Approved: 'approved', RAR: 'rar' })[s.status] + '.explain'),
              got.explain);
      }
    } else if (s.src === 'libya-248') {
      check(tag + ' — the 248 line is on the card and visible',
            got.explain === AR.get('card.status.banned.248') && got.visible, JSON.stringify(got).slice(0, 220));
    } else {
      /* no guide defines an explanation here: farmer mode must stay bare,
         pro mode may only repeat the row's own source text */
      check(tag + (mode === 'farmer'
            ? ' — an unexplained status stays a bare code (D25)'
            : ' — pro mode prints only the row\'s own source text'),
            mode === 'farmer' ? got.explain === '' : got.explain === String(euNA.status_raw).trim(),
            JSON.stringify(got).slice(0, 220));
    }
  }
  check('[' + mode + '] zero page errors', errors.length === 0, errors.join(' | '));
  await page.close();
}
await browser.close();
console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);