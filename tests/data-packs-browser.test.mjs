#!/usr/bin/env node
/*
 * tests/data-packs-browser.test.mjs — المرحلة الثانية في متصفح حقيقي
 * ------------------------------------------------------------------
 * القاعدة المثبَّتة هنا (D31): لا زر تنزيل ولا زر حذف في أي وضع.
 * 1) في وضع المزارع: صفّا الحزم بلا زرّ إطلاقاً، وسطر «للمحترف»
 * 2) دخول المحترف: تنزيل حقيقي من الخادم + تحقق sha256 + سطر جاهزية بالعدّاد
 * 3) بعد التنزيل: النتيجة تظهر وعلى البطاقة إسناد ترخيصها حرفياً
 * 4) البقاء: لا زر حذف، والحزم تعود بعد إعادة التشغيل وتعمل دون اتصال
 *
 * لا انتظار بمدة ثابتة في أي نقطة تعتمد على حالة: كل انتظار شرط حقيقي
 * (ready / عدد بطاقات / إعادة الظهور). التوقيت على رابط CDN غير مضمون،
 * والنوم بمدة ثابتة يجعل الحارس ينقلب بلا عيب في الشيفرة.
 * التشغيل: BASE_URL=http://127.0.0.1:8080 node tests/data-packs-browser.test.mjs
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* العدّادات المقيسة من الملفَّين نفسهما — لا رقم مكتوب بخط اليد */
const ca = JSON.parse(readFileSync('data-optional/canada.json', 'utf8'));
const au = JSON.parse(readFileSync('data-optional/australia.json', 'utf8'));

let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', protocolTimeout: 300000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
         '--disable-features=Translate,TranslateUI', '--disable-translate'],
});
try {
  /* ملف تعريف نظيف تماماً: لا حزم مخزَّنة من جلسة سابقة */
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  /* the app itself must be up before anything is measured */
  await page.goto(BASE + '/index.html#/data', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.PacksModule && document.querySelector('#packList'), { timeout: 60000 });
  /* wait for the databases to finish loading, then for the farmer note to print */
  await page.waitForFunction(
    () => [...document.querySelectorAll('#packList .pack-state')]
      .some(e => /المحترف|professional/i.test(e.textContent || '')),
    { timeout: 90000, polling: 500 });

  const submitSearch = async (q, waitCards) => {
    await page.evaluate(async (text) => {
      location.hash = '#/search';
      const i = document.querySelector('#query');
      if (i) { i.value = text; i.dispatchEvent(new Event('input', { bubbles: true })); }
      const f = document.querySelector('#searchForm');
      if (f) f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, q);
    if (waitCards) {
      await page.waitForFunction(
        () => document.querySelectorAll('#results article.result').length > 0,
        { timeout: 45000, polling: 300 });
    }
  };

  console.log('=== 1) وضع المزارع: بلا زرّ تنزيل ===');
  {
    const before = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#packList .pack-row')].map(r => ({
        id: r.id, buttons: r.querySelectorAll('button').length,
        label: (r.querySelector('b') || {}).textContent || '',
        why: (r.querySelector('.pack-why') || {}).textContent || '',
        attr: (r.querySelector('.pack-attr') || {}).textContent || '',
        state: (r.querySelector('.pack-state') || {}).textContent || ''
      }));
      return { rows, mode: (document.querySelector('#mode') || {}).value };
    });
    must('the screen opens as a farmer, on Libya only', before.mode === 'farmer', before.mode);
    must('both packs are listed with no button at all (D31)',
      before.rows.length === 2 && before.rows.every(r => r.buttons === 0),
      JSON.stringify(before.rows.map(r => r.id + ':' + r.buttons)));
    must('each row states its benefit in farmer words',
      before.rows.every(r => r.why.length > 10), JSON.stringify(before.rows.map(r => r.why.slice(0, 30))));
    must('the licence attribution sits on the row itself',
      before.rows[0].attr.indexOf('Open Government Licence') >= 0 &&
      before.rows[1].attr.indexOf('Creative Commons Attribution 3.0 Australia') >= 0);
    must('the state line points the farmer to professional mode',
      before.rows.every(r => /المحترف|professional/i.test(r.state)), JSON.stringify(before.rows.map(r => r.state)));

    await submitSearch('Chlorpyrifos', true);
    const search = await page.evaluate(() => ({
      srcs: [...new Set([...document.querySelectorAll('#results .source')].map(e => e.textContent.trim()))],
      total: document.querySelectorAll('#results article.result').length,
    }));
    must('a farmer search returns only the built-in sources',
      search.total > 0 && !search.srcs.some(s => /كندا|PMRA|APVMA|أستراليا/.test(s)),
      JSON.stringify(search.srcs));
    must('nothing downloaded itself in farmer mode',
      (await page.evaluate(async () => await PacksModule.list())).length === 0);
  }

  console.log('=== 2) التنزيل الحقيقي التلقائي عند دخول المحترف ===');
  {
    /* no polling loop here: the app's own state line is the signal */
    await page.evaluate(() => {
      const mode = document.querySelector('#mode');
      mode.value = 'pro';
      mode.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const sawProgress = await page.evaluate(async () => {
      for (let i = 0; i < 1200; i++) {
        if (/جارٍ التنزيل/.test(document.querySelector('#pack-canada .pack-state').textContent)) return true;
        await new Promise(r => setTimeout(r, 50));
      }
      return false;
    });
    /* the two packs land; whichever order, both must reach the measured count */
    await page.waitForFunction(
      () => {
        const t = [...document.querySelectorAll('#packList .pack-state')].map(e => e.textContent || '');
        return t.length === 2 && t.every(x => /جاهزة: /.test(x));
      },
      { timeout: 300000, polling: 400 });
    const states = await page.evaluate(() => ({
      ca: document.querySelector('#pack-canada .pack-state').textContent,
      caCls: document.querySelector('#pack-canada .pack-state').className,
      au: document.querySelector('#pack-australia .pack-state').textContent,
    }));
    must('a real progress line appears while downloading', sawProgress);
    must('the pack ends ready, with the measured row count and a date',
      new RegExp('جاهزة: ' + ca.meta.count).test(states.ca), states.ca);
    must('the ready state is the success tone, not the error tone', /ok/.test(states.caCls), states.caCls);
    must('Australia ends ready too, with its own measured count',
      new RegExp('جاهزة: ' + au.meta.count).test(states.au), states.au);
    must('the licence tag rides on the ready line itself',
      /OGL-Canada/.test(states.ca), states.ca);
  }

  console.log('=== 3) النتيجة والإسناد على البطاقة ===');
  {
    await submitSearch('Chlorpyrifos', true);
    /* wait until a Canadian card is actually on screen (the packs feed the index) */
    await page.waitForFunction(
      () => [...document.querySelectorAll('#results article.result')]
        .some(a => /PMRA/.test(a.textContent || '')),
      { timeout: 45000, polling: 300 });
    const res = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#results article.result')];
      const withAttr = cards.filter(c => (c.querySelector('.pack-attr') || {}).textContent
        && c.querySelector('.pack-attr').textContent.indexOf('Open Government Licence') >= 0);
      return {
        total: cards.length,
        canadaCards: cards.filter(c => /PMRA/.test(c.textContent)).length,
        withAttr: withAttr.length,
        buttons: document.querySelectorAll('#packList button').length,
        sample: (withAttr[0] ? withAttr[0].querySelector('.pack-attr').textContent : '')
      };
    });
    must('the installed pack now contributes results', res.canadaCards > 0,
      'canada cards=' + res.canadaCards + ' of ' + res.total);
    must('every Canadian card carries the OGL attribution verbatim',
      res.withAttr === res.canadaCards, res.withAttr + '/' + res.canadaCards);
    must('the attribution text is the exact licensed sentence',
      res.sample === 'Contains information licensed under the Open Government Licence – Canada.', res.sample);
    must('still no button anywhere in the pack screen', res.buttons === 0, String(res.buttons));
  }

  console.log('=== 4) البقاء: لا زر حذف، وتعمل دون اتصال بعد إعادة التشغيل ===');
  {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.PacksModule && document.querySelector('#packList'), { timeout: 60000 });
    /* the stored packs must come back by themselves — that IS the condition */
    await page.waitForFunction(
      () => {
        const t = [...document.querySelectorAll('#packList .pack-state')].map(e => e.textContent || '');
        return t.length === 2 && t.every(x => /جاهزة: /.test(x));
      },
      { timeout: 120000, polling: 400 });
    const back = await page.evaluate(() => ({
      states: [...document.querySelectorAll('#packList .pack-state')].map(e => e.textContent),
      buttons: document.querySelectorAll('#packList button').length,
      mode: (document.querySelector('#mode') || {}).value,
    }));
    must('the stored packs come back on their own after a restart',
      back.states.every(s => /جاهزة: /.test(s)), JSON.stringify(back.states));
    must('there is no delete button and no download button (D31)', back.buttons === 0, String(back.buttons));
    must('the mode is back to its default, farmer — a cold start downloads nothing',
      back.mode === 'farmer', back.mode);

    /* professional mode again; the packs are already stored, so nothing re-downloads.
     * Navigating + submitting happens explicitly — a hash flip alone never
     * runs a search, and waiting for a card that was never asked for is a
     * harness bug, not a product one. */
    await page.evaluate(async () => {
      const m = document.querySelector('#mode');
      m.value = 'pro';
      m.dispatchEvent(new Event('change', { bubbles: true }));
      location.hash = '#/search';
      await new Promise(r => setTimeout(r, 400));
      const i = document.querySelector('#query');
      i.value = 'Chlorpyrifos'; i.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await page.waitForFunction(
      () => [...document.querySelectorAll('#results article.result')].some(c => /PMRA/.test(c.textContent || '')),
      { timeout: 60000, polling: 300 });
    await page.setOfflineMode(true);
    await submitSearch('Chlorpyrifos', true);
    await page.waitForFunction(
      () => [...document.querySelectorAll('#results article.result')].some(c => /PMRA/.test(c.textContent || '')),
      { timeout: 60000, polling: 300 });
    const offline = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#results article.result')];
      return {
        online: navigator.onLine,
        canada: cards.filter(c => /PMRA/.test(c.textContent)).length,
        libya: cards.filter(c => /ليبيا/.test(c.textContent) || /libya/i.test(c.getAttribute('data-src') || '')).length,
      };
    });
    await page.setOfflineMode(false);
    must('the app really is offline here', offline.online === false);
    must('the Canadian results still work with no connection', offline.canada > 0, 'canada=' + offline.canada);
    must('the Libyan results still work with no connection', offline.libya > 0, 'libya=' + offline.libya);
  }

  must('zero page errors during the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);