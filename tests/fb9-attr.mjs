/*
 * tests/fb9-attr.mjs — صلة الأثر (بند 0): هل السطر المشوَّش وعنوان التبويب من التطبيق أم من ترجمة خارجية؟
 * القياس على الرابط الحيّ، بتعطيل ترجمة المتصفح صراحةً، وقراءة DOM حرفياً.
 * usage: node tests/fb9-attr.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'https://al-mustashar.pages.dev').replace(/\/$/, '');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: [
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    /* صلة الأثر: الترجمة الآلية معطّلة صراحةً في هذه الجلسة */
    '--disable-features=Translate,TranslateUI',
    '--disable-translate',
    '--lang=ar'
  ],
  protocolTimeout: 300000
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('mustashar-lang', 'ar'); } catch (e) {}
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('translate', 'no');
    document.querySelectorAll('[translate]').forEach(e => e.setAttribute('translate', 'no'));
  });
});
await page.goto(BASE + '/index.html#/search', { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForFunction(() => window.SearchCore && document.querySelector('#query'), { timeout: 30000 });
await new Promise(r => setTimeout(r, 2500));

console.log('html lang =', await page.evaluate(() => document.documentElement.lang));
console.log('html translate attr =', await page.evaluate(() => document.documentElement.getAttribute('translate')));
console.log('<title> =', JSON.stringify(await page.title()));
console.log('navigator.language =', await page.evaluate(() => navigator.language));

const out = await page.evaluate(async () => {
  document.querySelector('#query').value = '17804-35-2';
  document.querySelector('#query').dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('#searchForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 2500));
  const cards = Array.from(document.querySelectorAll('#results article.result'));
  return cards.map(c => ({
    src: c.getAttribute('data-src'),
    name: (c.querySelector('h3') || {}).textContent || '',
    status: (c.querySelector('.status') || {}).textContent || '',
    categoryBlock: (c.querySelector('.cat-block') || {}).textContent || '',
    catLines: Array.from(c.querySelectorAll('.cat-line')).map(l => ({
      code: (l.querySelector('.cat-code') || {}).textContent || '',
      meaning: (l.querySelector('.cat-meaning') || {}).textContent || '',
      codeHTML: (l.querySelector('.cat-code') || {}).outerHTML || ''
    })),
    meta: Array.from(c.querySelectorAll('p.meta')).map(p => p.textContent.trim()),
    wholeText: c.textContent.replace(/\s+/g, ' ').trim()
  }));
});
console.log(JSON.stringify(out, null, 1));
await browser.close();