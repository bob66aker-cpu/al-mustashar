#!/usr/bin/env node
/*
 * tests/ab-run.mjs — drives tests/ab-ocr.html once per OCR config (EXPERIMENTAL only)
 * Usage: BASE_URL=... node tests/ab-run.mjs
 * Produces tests/ab-results.json + a human-readable table.
 */
import puppeteer from 'puppeteer-core';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const BASE = process.env.BASE_URL;
if (!BASE) { console.error('Set BASE_URL'); process.exit(1); }
const CHROME = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');

const CONFIGS = [
  { id: 'ara_eng', qs: 'eng+ara', label: 'A) ara+eng (الحالي)' },
  { id: 'eng_only', qs: 'eng', label: 'B) eng-only (تجريبي)' }
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar'],
  defaultViewport: { width: 1000, height: 800 }
});
const page = await browser.newPage();
page.setDefaultTimeout(300000);
const all = [];

for (const cfg of CONFIGS) {
  const url = BASE + '/tests/ab-ocr.html?config=' + encodeURIComponent(cfg.qs);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try {
    await page.waitForFunction(() => window.__AB_DONE__ || window.__AB_ERROR__, { timeout: 280000, polling: 1000 });
  } catch (e) {
    const title = await page.title();
    console.error(cfg.id + ': timeout (title=' + title + ')');
    continue;
  }
  const err = await page.evaluate(() => window.__AB_ERROR__ || null);
  if (err) { console.error(cfg.id + ' ERROR: ' + err); continue; }
  const rows = await page.evaluate(() => window.__AB_RESULTS__);
  for (const r of rows) { r.configId = cfg.id; r.label = cfg.label; }
  all.push(...rows);
  console.error(cfg.id + ': ' + rows.length + ' rows collected');
}
await browser.close();

/* ---- aggregate ---- */
const agg = {};
for (const cfg of CONFIGS) {
  const rows = all.filter(r => r.configId === cfg.id);
  const withName = rows.filter(r => r.gtName);
  const withCas = rows.filter(r => r.gtCas);
  const negatives = rows.filter(r => !r.gtName && !r.gtCas);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  agg[cfg.id] = {
    label: cfg.label,
    scanned: rows.length,
    nameAccuracy: withName.length ? +(withName.filter(r => r.nameHit).length / withName.length * 100).toFixed(1) : null,
    casAccuracy: withCas.length ? +(withCas.filter(r => r.casHit).length / withCas.length * 100).toFixed(1) : null,
    dbMatchRate: withName.length ? +(rows.filter(r => r.resultCount > 0).length / rows.length * 100).toFixed(1) : null,
    falseMatches: rows.filter(r => r.falseMatch).map(r => r.id),
    avgConfidence: +avg(rows.map(r => r.conf || 0)).toFixed(1),
    avgMs: Math.round(avg(rows.map(r => r.ms))),
    needManual: rows.filter(r => r.needManual).map(r => r.id),
    negativesHandledCleanly: negatives.filter(r => !r.falseMatch).length + '/' + negatives.length
  };
}

const out = { generated: new Date().toISOString(), branch: 'experiment/ocr-eng-only', perCase: all, summary: agg };
fs.writeFileSync(new URL('./ab-results.json', import.meta.url), JSON.stringify(out, null, 2));

/* ---- printable table ---- */
console.log('\n=== per-case ===');
console.log('case'.padEnd(22) + '| A ara+eng: name/cas/false/conf/ms | B eng-only: name/cas/false/conf/ms');
for (const spec of ['clear_label','small_text','low_contrast','heavy_noise','rot90','rot180','rot270','spaced_cas','confusion_O0_I1','confusion_I1_B8','tiny_cas_only','haloxyfop','diuron','paraquat_branding','name_24d','dark_photo','mixed_arabic_english','arabic_only','noise_only']) {
  const a = all.find(r => r.id === spec && r.configId === 'ara_eng') || {};
  const b = all.find(r => r.id === spec && r.configId === 'eng_only') || {};
  const f = r => r.id ? `${r.nameHit === null ? '-' : (r.nameHit ? 'Y' : 'N')}/${r.casHit === null ? '-' : (r.casHit ? 'Y' : 'N')}/${r.falseMatch ? 'F' : '-'}/${r.conf ?? '-'}/${r.ms}` : 'missing';
  console.log(spec.padEnd(22) + '| ' + f(a).padEnd(34) + '| ' + f(b));
}
console.log('\n=== summary ===');
console.log(JSON.stringify(agg, null, 2));
process.exit(0);
