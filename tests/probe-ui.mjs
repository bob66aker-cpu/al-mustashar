/* tests/probe-ui.mjs — one-shot browser probe (not committed as a test). */
import puppeteer from 'puppeteer-core';
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = 'http://localhost:8080';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.setViewport({ width: 360, height: 800 });
await page.goto(BASE + '/index.html#/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
const stats = await page.evaluate(() => ({
  s248: document.getElementById('stat-248').textContent,
  s500: document.getElementById('stat-500').textContent,
  seu: document.getElementById('stat-eu').textContent,
  sepa: document.getElementById('stat-epa').textContent,
  conn: document.getElementById('offlineState').textContent,
  activeNav: (document.querySelector('.nav-item.active span:last-child') || {}).textContent,
  theme: document.documentElement.dataset.theme,
  font: getComputedStyle(document.body).fontFamily.split(',')[0]
}));
console.log('HOME:', JSON.stringify(stats));
await page.goto(BASE + '/index.html#/about', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 800));
const about = await page.evaluate(() => ({
  version: document.getElementById('aboutVersion').textContent,
  date: document.getElementById('aboutDate').textContent,
  devFallbackHidden: document.getElementById('devPhotoFallback').hidden,
  folds: ['aboutPrivacyCard', 'aboutSourcesCard', 'aboutDevCard'].map(id => ({ id, open: document.getElementById(id).open }))
}));
console.log('ABOUT:', JSON.stringify(about));
await page.goto(BASE + '/index.html#/data', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1200));
const data = await page.evaluate(() => ({
  state: document.getElementById('dbState').textContent,
  count: document.getElementById('dbCount').textContent,
  chip248: document.getElementById('db-libya-248').textContent
}));
console.log('DATA:', JSON.stringify(data));
console.log('PAGE-ERRORS:', errs.length ? errs.join(' | ') : 'none');
await browser.close();
