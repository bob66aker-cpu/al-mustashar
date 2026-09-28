#!/usr/bin/env node
/*
 * tests/data-packs-browser.test.mjs — المرحلة الثانية في متصفح حقيقي
 * ------------------------------------------------------------------
 * 1) قبل الضغط: زرٌ لكل حزمة، ولا نتيجة واحدة من كندا/أستراليا في البحث
 * 2) الضغط: تنزيل حقيقي من الخادم + تحقق sha256 + إشعار الجاهزية
 * 3) بعد التنزيل: النتيجة تظهر وعلى البطاقة إسناد ترخيصها حرفياً
 * 4) الحذف: القاعدة تخرج من النتائج
 * التشغيل: BASE_URL=http://127.0.0.1:8080 node tests/data-packs-browser.test.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  await page.goto(BASE + '/index.html#/data', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);

  console.log('=== 1) قبل الضغط ===');
  {
    const before = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#packList .pack-row')].map(r => ({
        id: r.id, hasBtn: !!r.querySelector('.pack-btn'),
        label: (r.querySelector('b') || {}).textContent || '',
        why: (r.querySelector('.pack-why') || {}).textContent || '',
        attr: (r.querySelector('.pack-attr') || {}).textContent || '',
        state: (r.querySelector('.pack-state') || {}).textContent || ''
      }));
      return { rows: rows, online: navigator.onLine };
    });
    must('both packs are listed with one button each',
      before.rows.length === 2 && before.rows.every(r => r.hasBtn), JSON.stringify(before.rows.map(r => r.id)));
    must('each row states its benefit in farmer words',
      before.rows.every(r => r.why.length > 10), JSON.stringify(before.rows.map(r => r.why.slice(0, 30))));
    must('the licence attribution sits on the row itself',
      before.rows[0].attr.indexOf('Open Government Licence') >= 0 &&
      before.rows[1].attr.indexOf('Creative Commons Attribution 3.0 Australia') >= 0);

    const search = await page.evaluate(async () => {
      location.hash = '#/search';
      await new Promise(r => setTimeout(r, 500));
      document.querySelector('#query').value = 'Chlorpyrifos';
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
      await new Promise(r => setTimeout(r, 900));
      const srcs = [...document.querySelectorAll('#results .source')].map(e => e.textContent.trim());
      return { srcs: [...new Set(srcs)], total: document.querySelectorAll('#results article.result').length };
    });
    must('a search before any pack is installed returns only the built-in sources',
      search.total > 0 && !search.srcs.some(s => /كندا|PMRA|APVMA|أستراليا/.test(s)),
      JSON.stringify(search.srcs));
  }

  console.log('=== 2) التنزيل الحقيقي ===');
  {
    await page.evaluate(() => { location.hash = '#/data'; });
    await sleep(600);
    const states = await page.evaluate(async () => {
      const seen = [];
      const row = document.querySelector('#pack-canada');
      const btn = row.querySelector('.pack-btn');
      const label = btn.textContent;
      btn.click();
      const st = row.querySelector('.pack-state');
      for (let i = 0; i < 60; i++) {
        seen.push(st.textContent);
        await new Promise(r => setTimeout(r, 200));
        if (/جاهزة|Ready|Prête|已就绪|تعذّر|failed/.test(st.textContent)) break;
      }
      return { label: label, last: st.textContent, cls: st.className, samples: seen.length, sawProgress: seen.some(x => /جارٍ التنزيل|Downloading|Téléchargement|下载/.test(x)) };
    });
    must('the button says "download an extra database" before installing', /قاعدة إضافية|extra database|base suppl|附加数据库/.test(states.label), states.label);
    must('a real progress line appears while downloading', states.sawProgress);
    must('the pack ends ready, with a count and a date', /جاهزة: 1311/.test(states.last), states.last);
    must('the ready state is the success tone, not the error tone', /ok/.test(states.cls), states.cls);
  }

  console.log('=== 3) النتيجة والإسناد على البطاقة ===');
  {
    const res = await page.evaluate(async () => {
      const mode = document.querySelector('#mode');
      mode.value = 'pro';
      mode.dispatchEvent(new Event('change', { bubbles: true }));
      location.hash = '#/search';
      await new Promise(r => setTimeout(r, 500));
      document.querySelector('#query').value = 'Chlorpyrifos';
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
      await new Promise(r => setTimeout(r, 1200));
      const cards = [...document.querySelectorAll('#results article.result')];
      const withAttr = cards.filter(c => (c.querySelector('.pack-attr') || {}).textContent
        && c.querySelector('.pack-attr').textContent.indexOf('Open Government Licence') >= 0);
      return {
        total: cards.length,
        canadaCards: cards.filter(c => /PMRA/.test(c.textContent)).length,
        withAttr: withAttr.length,
        sample: (withAttr[0] ? withAttr[0].querySelector('.pack-attr').textContent : '')
      };
    });
    must('the installed pack now contributes results', res.canadaCards > 0,
      'canada cards=' + res.canadaCards + ' of ' + res.total);
    must('every Canadian card carries the OGL attribution verbatim',
      res.withAttr === res.canadaCards, res.withAttr + '/' + res.canadaCards);
    must('the attribution text is the exact licensed sentence',
      res.sample === 'Contains information licensed under the Open Government Licence – Canada.', res.sample);
  }

  console.log('=== 4) الحذف ===');
  {
    const res = await page.evaluate(async () => {
      location.hash = '#/data';
      await new Promise(r => setTimeout(r, 500));
      const row = document.querySelector('#pack-canada');
      row.querySelector('.pack-btn').click();
      await new Promise(r => setTimeout(r, 1200));
      const st = row.querySelector('.pack-state').textContent;
      const btn = row.querySelector('.pack-btn').textContent;
      const mode = document.querySelector('#mode');
      mode.value = 'pro';
      mode.dispatchEvent(new Event('change', { bubbles: true }));
      location.hash = '#/search';
      await new Promise(r => setTimeout(r, 400));
      document.querySelector('#query').value = 'Chlorpyrifos';
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
      await new Promise(r => setTimeout(r, 1000));
      const cards = [...document.querySelectorAll('#results article.result')];
      return { state: st, btn: btn, canadaLeft: cards.filter(c => /PMRA/.test(c.textContent)).length };
    });
    must('after deleting, the row reports it is not downloaded', /غير منزَّلة/.test(res.state), res.state);
    must('the button offers the download again', /تنزيل قاعدة إضافية/.test(res.btn), res.btn);
    must('no Canadian result survives the deletion', res.canadaLeft === 0, 'left=' + res.canadaLeft);
  }

  must('zero page errors during the whole run', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
