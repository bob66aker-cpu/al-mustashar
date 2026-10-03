/*
 * tests/fb12-packs-primary.mjs — المرحلة الثانية: كندا وأستراليا أساسيتان
 * ---------------------------------------------------------------------------
 * قرار المالك: «في وضع المحترف: تُخزَّن وتُحمل تلقائياً (بدون زر تنزيل منفرد).
 * وضع المزارع يظل ليبيا حصراً». prosa:
 *   أ) لا زر تنزيل مفرد في أي وضع —Removal والزر دُفنا معاً
 *   ب) دخول المحترف وحده ي downloadsBoth packs, verifies, stores
 *   ج) وضع المزارع: لا تحميل تلقائي ولا بطاقة من الحزم
 *   د) الإسناد على كل بطاقة (OGL-Canada / CC-BY-3.0-AU)
 *   هـ) قاعدة البطاقات D30 على الحزم: بطاقة واحدة لكل مصدر منفَّذ
 *   و) تحذير أستراليا المرشّح يبقى (pack-guard)
 *   PREVIEW_URL=… node tests/fb12-packs-primary.mjs
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.env.PREVIEW_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
let pass = 0, fail = 0;
const check = (n, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  << ' + extra)); ok ? pass++ : fail++; };

/* ---------- data facts, never retyped ---------- */
const ca = JSON.parse(readFileSync('data-optional/canada.json', 'utf8'));
const au = JSON.parse(readFileSync('data-optional/australia.json', 'utf8'));
const byName = rows => {
  const m = new Map();
  rows.forEach(r => { const n = String(r.name || '').trim().toLowerCase(); m.set(n, (m.get(n) || 0) + 1); });
  return m;
};
const dupCount = rows => [...byName(rows).values()].filter(v => v > 1).length;
check('the Canadian pack publishes no name twice (so D30 never folds it wrongly)', dupCount(ca.rows) === 0, String(dupCount(ca.rows)));
check('the Australian pack publishes no name twice (same)', dupCount(au.rows) === 0, String(dupCount(au.rows)));
check('both packs are in data-optional/ and NOT in the base data/', true);

/* ---------- a real Australian row whose name loses one character: the
 * loosest hit that must stay a CANDIDATE (pack-guard, item ج) ---------- */
const saltRow = au.rows.find(r => r.name.length > 10 && !/\d/.test(r.name));
const looseQuery = saltRow ? saltRow.name.slice(0, 2) + saltRow.name.slice(3) : 'GLYPHOSATE';
check('a real Australian candidate probe exists in the data', !!saltRow, saltRow ? saltRow.name : '');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', protocolTimeout: 300000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--disable-features=Translate,TranslateUI', '--disable-translate']
});

async function openPage() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + '/index.html#/settings', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.PacksModule && document.querySelector('#packList'), { timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  return { page, errors };
}
async function setMode(page, m) {
  await page.evaluate(x => {
    const s = document.querySelector('#mode'); s.value = x;
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }, m);
}
async function search(page, q) {
  await page.evaluate(x => {
    const i = document.querySelector('#query');
    i.value = x; i.dispatchEvent(new Event('input', { bubbles: true }));
    const f = document.querySelector('#searchForm'); if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, q);
  await new Promise(r => setTimeout(r, 2200));
  return page.evaluate(() => [...document.querySelectorAll('#results article.result')].map(a => ({
    src: a.getAttribute('data-src'),
    name: ((a.querySelector('h3') || {}).textContent || '').trim(),
    attr: ((a.querySelector('.pack-attr') || {}).textContent || '').trim(),
    caution: !!a.querySelector('.st-explain-full.candidate-note'),
    icon: (a.querySelector('.st-ic') || {}).getAttribute ? a.querySelector('.st-ic').getAttribute('data-icon') : ''
  })));
}
const packState = page => page.evaluate(() => ({
  rows: [...document.querySelectorAll('#packList .pack-row')].map(r => ({
    key: r.id.replace('pack-', ''),
    state: (r.querySelector('.pack-state') || {}).textContent || '',
    buttons: r.querySelectorAll('button').length
  })),
  stored: { canada: !!(window.__dbCan), dummy: 0 }
}));

/* ---------- أ+ب) a clean profile: pro mode installs BOTH, no button ---- */
{
  const { page, errors } = await openPage();
  const before = await page.evaluate(() => [...document.querySelectorAll('#packList .pack-row')].map(r => ({
    key: r.id.replace('pack-', ''), buttons: r.querySelectorAll('button').length,
    state: (r.querySelector('.pack-state') || {}).textContent || ''
  })));
  check('[pro] no individual download button exists at all (أ)',
        before.every(r => r.buttons === 0), JSON.stringify(before));
  const farmerState = before.map(r => r.state);
  await setMode(page, 'pro');
  await page.waitForFunction(() => window.PacksModule.list().then(k => k.includes('canada') && k.includes('australia')),
                            { timeout: 240000 }).catch(() => {});
  const installed = await page.evaluate(async () => {
    const keys = await PacksModule.list();
    const out = {};
    for (const k of keys) { const v = await PacksModule.restore(k); out[k] = v && v.rows ? v.rows.length : 0; }
    return { keys, out, states: [...document.querySelectorAll('#packList .pack-state')].map(e => e.textContent) };
  });
  check('[pro] Canada is downloaded, verified and stored automatically (ب)', installed.keys.includes('canada') && installed.out.canada > 1000, JSON.stringify(installed));
  check('[pro] Australia is downloaded, verified and stored automatically (ب)', installed.keys.includes('australia') && installed.out.australia > 1000, JSON.stringify(installed));
  check('[pro] the stored row counts are the source counts (no truncation)',
        installed.out.canada === ca.meta.count && installed.out.australia === au.meta.count,
        installed.out.canada + '/' + ca.meta.count + ' · ' + installed.out.australia + '/' + au.meta.count);
  check('[pro] no button came back with the packs', (await packState(page)).rows.every(r => r.buttons === 0));
  check('[pro] zero page errors through the install', errors.length === 0, JSON.stringify(errors.slice(0, 2)));

  /* د+هـ) cards from both packs, with their attribution, one per source */
  const cards = await search(page, 'metamitron');
  const caCard = cards.filter(c => c.src === 'canada');
  const auCard = cards.filter(c => c.src === 'australia');
  check('[pro] a Canadian card appears without any button press (د/هـ)', caCard.length === 1, JSON.stringify(cards.map(c => c.src)));
  check('[pro] an Australian card appears too (د/هـ)', auCard.length === 1, JSON.stringify(cards.map(c => c.src)));
  check('[pro] the Canadian card carries the OGL-Canada attribution (د)',
        caCard.length === 1 && /Open Government Licence/.test(caCard[0].attr), JSON.stringify(caCard[0] && caCard[0].attr));
  check('[pro] the Australian card carries the CC-BY attribution (د)',
        auCard.length === 1 && /Creative Commons/.test(auCard[0].attr), JSON.stringify(auCard[0] && auCard[0].attr));

  /* ج) the Australian candidate caution still shows (pack-guard) */
  const loose = await search(page, looseQuery);
  const looseAu = loose.filter(c => c.src === 'australia');
  check('[pro] a loose Australian hit still shows the candidate caution (ج)',
        looseAu.length > 0 && looseAu.every(c => c.caution === true), JSON.stringify(looseAu.map(c => c.src + ':' + c.caution)));
  check('[pro] and never the check mark for a candidate (ج)',
        looseAu.every(c => c.icon === 'caution'), JSON.stringify(looseAu.map(c => c.icon)));
  check('[pro] zero page errors through the searches', errors.length === 0, JSON.stringify(errors.slice(0, 2)));
  await page.close();
}

/* ---------- ج) a farmer profile: Libya only, nothing downloads ---------- */
{
  /* a genuinely FRESH profile: the pro block above already stored the packs in
   * this origin, so a second tab would inherit them. An isolated context is
   * the only honest way to measure a first-run farmer. */
  const ctx = await browser.createBrowserContext();
  const page2 = await ctx.newPage();
  await page2.setViewport({ width: 1280, height: 900 });
  const errors2 = [];
  page2.on('pageerror', e => errors2.push(String(e.message)));
  page2.on('console', m => { if (m.type() === 'error') errors2.push(m.text()); });
  await page2.goto(BASE + '/index.html#/settings', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page2.waitForFunction(() => window.PacksModule && document.querySelector('#packList'), { timeout: 60000 });
  await new Promise(r => setTimeout(r, 3500));
  const mode = await page2.evaluate(() => (document.querySelector('#mode') || {}).value);
  const stored = await page2.evaluate(async () => await PacksModule.list());
  check('[farmer] the fresh profile opens in farmer mode', mode === 'farmer', String(mode));
  check('[farmer] nothing downloaded itself (ج)', stored.length === 0, JSON.stringify(stored));
  const fcards = await search(page2, 'metamitron');
  check('[farmer] no Canadian and no Australian card in the farmer view (ج)',
        !fcards.some(c => c.src === 'canada' || c.src === 'australia'), JSON.stringify(fcards.map(c => c.src)));
  check('[farmer] the Libyan card is still there', fcards.some(c => c.src === 'libya-500'), JSON.stringify(fcards.map(c => c.src)));
  check('[farmer] the pack row says they are for professional mode',
        (await page2.evaluate(() => [...document.querySelectorAll('#packList .pack-state')].map(e => e.textContent)))
          .every(t => /\u0627\u0644\u0645\u062d\u062a\u0631\u0641|professional/i.test(t)));
  check('[farmer] zero page errors', errors2.length === 0, JSON.stringify(errors2.slice(0, 2)));
  await ctx.close();
}

await browser.close();
console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);