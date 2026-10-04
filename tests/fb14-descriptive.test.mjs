/*
 * tests/fb14-descriptive.test.mjs — D45: عمود التصنيف الوصفي يُعرض حرفياً
 * --------------------------------------------------------------------------
 * التشخيص (قبل الإصلاح، مقيس حيّاً بترجمة المتصفح معطّلة): بطاقة أسترالية
 * لـZIRAM تعرض «ACTIVE CONSTITUENT: رمز غير مشروح… + FUNGICIDE: رمز غير
 * مشروح…» — أي أن **نصاً وصفياً يمرّ عبر مسار البحث عن رمز فيفشل**. عيب
 * التطبيق لا أثر ترجمة (البطاقات الليبية في القياس نفسه سليمة).
 *
 * ما يقيسه بعد الإصلاح:
 *   1) ساكناً: كل قسم يعلن طبيعة عموده (codes · descriptive · none)،
 *      والتطبيق يقرأ الإعلان، والوصفية لا تُقسَّم ولا تأخذ القالب.
 *   2) حيّاً (وضعان × حاويتان): ZIRAM تعرض النص كما في التصدير بلا
 *      «غير مشروح»؛ وعيّنة ليبية مركّبة (F/Mi) سليمة؛ وعيّنة رموز سليمة.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = 'http://127.0.0.1:8080';
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};
const REF = JSON.parse(readFileSync(join(root, 'data/reference.json'), 'utf8'));
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const au = JSON.parse(readFileSync(join(root, 'data-optional/australia.json'), 'utf8')).rows;
const d248 = JSON.parse(readFileSync(join(root, 'data/libya-248.json'), 'utf8')).rows;
const d500 = JSON.parse(readFileSync(join(root, 'data/libya-500.json'), 'utf8')).rows;
const ziram = au.find(r => r.name.trim().toUpperCase() === 'ZIRAM');
const fmi = d248.find(r => r.category === 'F/Mi');
const row500 = d500.find(r => r.category === 'I + A');

/* ---------- 1) static: the declaration is measured, not assumed ---------- */
check('ZIRAM really carries a descriptive cell in the export',
  !!ziram && /[A-Z]/.test(ziram.category) && ziram.category.includes('/'),
  ziram ? ziram.category : 'no ZIRAM row');
check('every section declares its category kind, and the kinds match the data',
  Object.values(REF.sections).every(s => ['codes', 'descriptive', 'none'].includes(s.categoryKind))
  && REF.sections.libya500.categoryKind === 'codes' && REF.sections.libya248.categoryKind === 'codes'
  && REF.sections.australia.categoryKind === 'descriptive'
  && ['eu', 'epa', 'canada'].every(k => REF.sections[k].categoryKind === 'none'),
  JSON.stringify(Object.fromEntries(Object.entries(REF.sections).map(([k, v]) => [k, v.categoryKind]))));
check('the canadian column is declared `none` BY MEASUREMENT (every row empty), not by name',
  d248 && au && JSON.parse(readFileSync(join(root, 'data-optional/canada.json'), 'utf8')).rows
    .every(r => !String(r.category || '').trim())
  && REF.sections.canada.categorylessRows === 1311);
check('app.js reads the declared kind and prints a descriptive cell verbatim',
  /function catIsDescriptive\(sourceKey\)/.test(app)
  && /if \(catIsDescriptive\(sourceKey\)\) return String\(code == null \? '' : code\);/.test(app));
check('the unexplained-code hint still exists, for real codes only',
  /legend\.cat\.unknown/.test(readFileSync(join(root, 'src/i18n.js'), 'utf8'))
  && /t\('legend\.cat\.unknown'/.test(readFileSync(join(root, 'src/cards.js'), 'utf8')));

/* ---------- 2) live: 2 modes × 2 containers ---------- */
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-features=Translate,TranslateUI', '--disable-translate'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate(() => { document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'; });
  await new Promise(r => setTimeout(r, 2500));
  /* the optional pack is installed through the app's own door */
  const installed = await page.evaluate(async () => {
    await window.PacksModule.install('australia', () => {});
    return window.PacksModule.list();
  });
  check('the australian pack installs through the app door', installed.includes('australia'), JSON.stringify(installed));

  const readSrc = src => page.evaluate(s => {
    const c = [...document.querySelectorAll('#results article.result')].find(x => x.getAttribute('data-src') === s);
    if (!c) return null;
    const chip = c.querySelector('.cat-code');
    return { cell: chip ? chip.textContent : '', title: chip ? chip.getAttribute('title') : '',
      meaning: (c.querySelector('.cat-meaning') || {}).textContent || '' };
  }, src);
  const search = async q => {
    await page.evaluate(() => { location.hash = '#/search'; });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => { document.getElementById('query').value = ''; });
    await page.type('#query', q, { delay: 8 });
    await page.evaluate(() => document.getElementById('searchForm')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await new Promise(r => setTimeout(r, 1800));
  };
  const scan = async src => {
    await page.evaluate(() => { location.hash = '#/scan'; });
    await new Promise(r => setTimeout(r, 400));
    return page.evaluate(async s => {
      await window.runScanPipeline('ZIRAM');
      await new Promise(r => setTimeout(r, 2500));
      const box = document.querySelector('#scanResults');
      const c = [...box.querySelectorAll('article.result')].find(x => x.getAttribute('data-src') === s);
      if (!c) return null;
      const chip = c.querySelector('.cat-code');
      return { cell: chip ? chip.textContent : '',
        meaning: (c.querySelector('.cat-meaning') || {}).textContent || '' };
    }, src);
  };

  for (const mode of ['farmer', 'pro']) {
    await page.evaluate(m => { const el = document.getElementById('mode'); el.value = m; el.dispatchEvent(new Event('change', { bubbles: true })); }, mode);
    await search('ZIRAM');
    const auCard = await readSrc('australia');
    check(`[${mode} · بحث] ZIRAM shows the exported text VERBATIM (no hint, no split, no translation)`,
      mode === 'farmer' ? true : (!!auCard && auCard.meaning === ziram.category && auCard.title === ziram.category
        && !/غير مشروح/.test(auCard.meaning) && !auCard.meaning.includes(' + ')),
      auCard ? JSON.stringify(auCard).slice(0, 180) : (mode === 'farmer' ? 'not a farmer source (expected)' : 'no card'));
    const ly = await readSrc('libya-248');
    check(`[${mode} · بحث] the Libyan ZIRAM card is untouched (F → its own meaning)`,
      !!ly && ly.cell === 'F' && /مبيد فطري/.test(ly.meaning) && !/غير مشروح/.test(ly.meaning),
      JSON.stringify(ly).slice(0, 160));
    const s248 = await scan('libya-248');
    check(`[${mode} · مسح] the scan container keeps the Libyan meaning`,
      !!s248 && /مبيد فطري/.test(s248.meaning), JSON.stringify(s248).slice(0, 160));
  }
  /* the compound Libyan sample with a private part — FB9 behaviour must survive */
  await page.evaluate(() => { const el = document.getElementById('mode'); el.value = 'pro'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await search(fmi.name.split('\n')[0]);
  const mx = await page.evaluate(n => {
    const c = [...document.querySelectorAll('#results article.result')].find(x => (x.querySelector('h3') || {}).textContent === n);
    if (!c) return null;
    const chip = c.querySelector('.cat-code');
    return { cell: chip ? chip.textContent : '', meaning: (c.querySelector('.cat-meaning') || {}).textContent || '' };
  }, fmi.name.split('\n')[0]);
  check('the compound Libyan cell «F/Mi» is untouched: shared part explained, Mi keeps the hint',
    !!mx && mx.cell === 'F/Mi' && /مبيد فطري/.test(mx.meaning)
    && /Mi: رمز غير مشروح في دليل هذا المصدر/.test(mx.meaning),
    mx ? mx.meaning : 'no card');
  /* a symbolic Libyan cell, searched on its own row (the codes path is intact) */
  await search(row500.name.split('\n')[0]);
  const five = await readSrc('libya-500');
  check('a 500 code cell keeps its symbolic meaning (no descriptive path leaked)',
    !!five && five.cell === row500.category && /مبيد/.test(five.meaning)
    && !/غير مشروح في دليل هذا المصدر/.test(five.meaning),
    JSON.stringify(five).slice(0, 160));
} finally {
  await browser.close();
}
console.log('==============================');
console.log(`FB14 DESCRIPTIVE: PASS ${pass}   FAIL ${fail}`);
process.exit(fail ? 1 : 0);
