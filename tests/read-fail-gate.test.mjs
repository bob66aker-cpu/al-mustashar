/*
 * tests/read-fail-gate.test.mjs — فيدباك 3: بوابة «لم أستطع القراءة»
 * ---------------------------------------------------------------------------
 * يمرّر صورة حقيقية لا يقرؤها المحرك (5.jpg — رفض بنسبة الحروف اللاتينية
 * على 0 محرف، كما في خط الأساس) عبر الواجهة المُطلَقة نفسها: اختيار من
 * المعرض ← قراءة حقيقية ← ما يراه المزارع على الشاشة.
 *
 * ما يُقاس هنا:
 *   1. الجملة الظاهرة هي جملة «لم أستطع القراءة» وليست الجملة المجرّدة.
 *   2. المحرّر اليدوي مفتوح — أي طريق للخروج موجود عند الفشل.
 *   3. زر البحث اليدوي ينقل إلى وضع البحث ويضع المؤشر في الحقل.
 *   4. الجملة تتبع لغة الواجهة (عربي + إنجليزي على المسار الحقيقي).
 *   5. صفر خطأ console/pageerror في المسار كله.
 *
 * ما لا يُقاس هنا (بصراحة): مسار الكاميرا الحية. لا يوجد في مختبر بلا واجهة
 * كاميرا تحمل ملصقاً — الجهاز الوهمي يعطي نمطاً متحركاً لا تكتمل عليه
 * قراءة. مسار الكاميرا محميّ بحارس ثابت على المصدر (كل مواقع الفشل الثلاثة
 * تستدعي showReadFailure نفسها) في tests/verify.mjs.
 *
 * تشغيل: node tests/read-fail-gate.test.mjs [baseUrl]   (افتراضياً 127.0.0.1:8080)
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');
const UNREADABLE = '5.jpg';
const ARABIC = /[\u0600-\u06FF]/;
const HAN = /[\u4E00-\u9FFF]/;

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  protocolTimeout: 300000
});

async function readThrough(lang) {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.evaluateOnNewDocument((l) => {
    try { localStorage.setItem('mustashar-lang', l); } catch (e) { /* storage blocked */ }
  }, lang);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.OcrModule && document.querySelector('#gallery'), { timeout: 30000 });
  await page.evaluate(() => { location.hash = '#/scan'; });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(async (n) => {
    const blob = await (await fetch('/tests/fixtures/labels/' + encodeURIComponent(n), { cache: 'no-store' })).blob();
    const f = new File([blob], n, { type: blob.type || 'image/jpeg' });
    const dt = new DataTransfer(); dt.items.add(f);
    const inp = document.querySelector('#gallery');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, UNREADABLE);
  await page.waitForFunction(() => document.querySelector('#cancelOcrBtn').hidden === true,
    { timeout: 180000, polling: 400 });
  const s = await page.evaluate(() => {
    const vis = el => el && !el.hidden && el.getBoundingClientRect().height > 0;
    return {
      lang: document.documentElement.lang,
      msg: (document.querySelector('#ocrMsg').textContent || '').trim(),
      editorOpen: vis(document.querySelector('#ocrActions')),
      manualBtn: vis(document.querySelector('#ocrManualBtn')),
      editorEmpty: (document.querySelector('#ocrText').value || '').trim().length === 0
    };
  });
  return { page, s, errors };
}

try {
  /* ---- 1) عربي: المسار الحقيقي كاملاً ---- */
  const ar = await readThrough('ar');
  const dict = await ar.page.evaluate(() => window.I18N.t('ocr.read.fail'));
  check('read-fail: an unreadable real photo ends in the read-failure sentence, not a dead end',
    ar.s.msg === dict && ar.s.msg.length > 30,
    JSON.stringify(ar.s).slice(0, 160));
  check('read-fail: the manual editor is open on failure (a way out exists)',
    ar.s.editorOpen === true);
  check('read-fail: nothing from a rejected text is offered for editing',
    ar.s.editorEmpty === true);
  check('read-fail: the manual-search button is on screen with the failure',
    ar.s.manualBtn === true);
  check('read-fail: the Arabic sentence is Arabic and comes from the dictionary',
    ARABIC.test(ar.s.msg) && !HAN.test(ar.s.msg), ar.s.msg.slice(0, 40));
  check('read-fail: zero console/page errors through the whole read',
    ar.errors.length === 0, ar.errors.join(' | '));

  /* ---- 2) الزر ينقل إلى البحث ---- */
  await ar.page.click('#ocrManualBtn');
  await new Promise(r => setTimeout(r, 500));
  const nav = await ar.page.evaluate(() => ({
    hash: location.hash,
    searchVisible: !document.querySelector('#view-search').hidden,
    focused: document.activeElement && document.activeElement.id
  }));
  check('read-fail: one tap opens the manual search view',
    nav.hash === '#/search' && nav.searchVisible === true, JSON.stringify(nav));
  check('read-fail: the caret lands in the search box',
    nav.focused === 'query', JSON.stringify(nav));
  await ar.page.close();

  /* ---- 3) إنجليزي: نفس المسار، جملة أخرى ---- */
  const en = await readThrough('en');
  check('read-fail: the sentence follows the interface language (English run differs)',
    en.s.lang === 'en' && en.s.msg !== '' && en.s.msg.length > 30
    && !ARABIC.test(en.s.msg) && !HAN.test(en.s.msg), en.s.msg.slice(0, 60));
  check('read-fail: the English run also opens the editor and the button',
    en.s.editorOpen === true && en.s.manualBtn === true);
  check('read-fail: zero console/page errors in the second run too',
    en.errors.length === 0, en.errors.join(' | '));
  await en.page.close();

  /* ---- 4) اللغتان الأخريان: من القاموس، بلا ادعاء مسار ---- */
  const frzh = await (async () => {
    const page = await browser.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.I18N, { timeout: 20000 });
    const out = await page.evaluate(() => {
      const read = (l) => { window.I18N.setLang(l); return window.I18N.t('ocr.read.fail'); };
      return { fr: read('fr'), zh: read('zh') };
    });
    await page.close();
    return out;
  })();
  check('read-fail: the French and Chinese sentences are their own writing, not the Arabic one',
    !ARABIC.test(frzh.fr) && !HAN.test(frzh.fr) && HAN.test(frzh.zh) && frzh.fr !== frzh.zh,
    JSON.stringify(frzh).slice(0, 120));
} finally {
  await browser.close();
}

console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
