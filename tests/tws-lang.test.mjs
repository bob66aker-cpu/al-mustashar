/*
 * tests/tws-lang.test.mjs — بوابة اللغات الأربع في قسم «التوصيات الزراعية»
 * --------------------------------------------------------------------------------
 * عقد مهمة «إصلاح تعدد اللغات في قسم بطاقة التوصيات» (2026-10-26):
 *   1) لغة القسم = لغة التطبيق (ar/en/fr/zh): العنوان والبحث وزر الرجوع
 *      وعناوين الحقول ورسائل الحالة تتبع نظام I18N — ولا تسقط أي لغة غير
 *      عربية إلى العربية (الخلل الأصلي للمهمة).
 *   2) الاتجاه: RTL للعربية وLTR للإنجليزية والفرنسية والصينية، على مستوى
 *      الصفحة، مع عزل المحتوى العربي (lang/dir) داخل الواجهة غير العربية.
 *   3) المحتوى الزراعي بمعرّف ثابت tws.card.<crop>/<type>.<n>.<field>:
 *      غياب الترجمة ⇒ النص العربي الأصلي حرفياً مع شارة صراحة صريحة، بلا
 *      ادّعاء ترجمة وبلا نص زراعي مخترع (وتنقلب الشارة فور توفّر ترجمة).
 *   4) تغيير اللغة يُعيد رسم المسار المفتوح حيًّا بلا إعادة تحميل الصفحة.
 *   5) القيم العلمية (اسم علمي/اسم مادة/معدل/WHO/PHI/CAS) تطابق بيانات
 *      الكتاب حرفياً في كل اللغات، وبيانات data/** لا تُمسّ.
 *   6) أي خطأ JavaScript في أي لغة = فشل.
 * المقارَب خارج كود القسم: ar/en من data/tws/labels.json (مصدر تسميات القسم)،
 * وfr/zh من مفاتيح tws.* في ملف الترجمة — حتى لا يدور الاختبار في حلقة مع
 * نفس الكود الذي يفحصه.
 * تشغيل: node tests/tws-lang.test.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const argBase = process.argv[2];
const BASE = (argBase || 'http://127.0.0.1:8080').replace(/\/$/, '');
const LANGS = ['ar', 'en', 'fr', 'zh'];
const RTL = { ar: 'rtl', en: 'ltr', fr: 'ltr', zh: 'ltr' };
const IDX = { ar: 0, en: 1, fr: 2, zh: 3 };
const AR = /[؀-ۿ]/;

const J = p => JSON.parse(readFileSync(join(root, p), 'utf8'));
const LABELS = J('data/tws/labels.json');                       // ar + en (مصدر القسم)
const CROPS = J('data/tws/crops.json').crops;
const SECTIONS = J('data/tws/sections.json').sections;
const I18N_SRC = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const WHEAT = CROPS.find(c => c.id === 'wheat');

/* مفتاح tws.* يظهر في أربعة مواضع (ar,en,fr,zh) للرسائل الجديدة، وفي موضعين
 * (fr,zh) لتسميات الكتاب التي تعيش في labels.json لـ ar/en */
const dictVals = key => {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...I18N_SRC.matchAll(new RegExp("'" + esc + "':\\s*'([^']*)'", 'g'))].map(m => m[1]);
};
const exp = (key, lang) => {
  if ((lang === 'ar' || lang === 'en') && LABELS[lang][key]) return LABELS[lang][key];
  const all = dictVals('tws.' + key);
  if (all.length === 4) return all[IDX[lang]];
  if (all.length === 2) return all[lang === 'fr' ? 0 : 1];
  throw new Error('لا مصدر ترجمة متوقع للمفتاح tws.' + key);
};

/* بطاقة القمح ذات أكثر المنتجات — لتغطية الجدول والـCAS في المسار التفاعلي */
const treated = SECTIONS.filter(s => s.crop_id === 'wheat')
  .sort((a, b) => b.products.length - a.products.length)[0];
const winf = WHEAT.infections.find(i => i.n === treated.n) || WHEAT.infections[0];
const CARD_HREF = '#/tws/wheat/' + winf.type + '.' + winf.n;
const present = [];
if (treated.images && treated.images.length) present.push('images');
if (treated.symptom && treated.symptom.length) present.push('symptoms');
if (treated.appearance) present.push('appearance');
if (treated.timing) present.push('timing');
if (treated.guidance) present.push('guidance');
present.push('products');
present.push('source');
const P0 = treated.products[0] || {};
const P0_VALS = [P0['اسم المادة الفعالة'], P0['معدل الاستخدام'], P0['تصنيف WHO'], P0['فترة الأمان']]
  .filter(v => v != null && String(v).trim() !== '' && String(v) !== '—').map(String);
const CAS_ROWS = (P0['مكونات فعالة'] || []).filter(m => m.cas).map(m => {
  const how = String(m.how || '');
  return { cas: String(m.cas), show: how === 'exact' || how === 'tokens' };
});

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

let srv = null;
if (!argBase) {
  srv = spawn('node', ['tests/static-server.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const probe = () => new Promise(res => {
    const req = http.get(BASE + '/', r => { r.resume(); res(r.statusCode === 200); });
    req.on('error', () => res(false));
    req.setTimeout(2000, () => { req.destroy(); res(false); });
  });
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) { ready = await probe(); if (!ready) await sleep(250); }
  if (!ready) { console.log('FAIL static server did not start'); process.exit(1); }
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 120000
});
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  page.on('pageerror', e => errors.push('pageerror: ' + String((e && e.message) || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const resp = await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  check('the app loads', !!resp && resp.status() === 200, 'HTTP ' + (resp && resp.status()));
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (e) {}
    window.__tws_lang_gate = 'alive';   /* علامة بقاء الصفحة (لا إعادة تحميل) */
  });

  for (const lang of LANGS) {
    /* تبديل اللغة حيًّا فوق أي مسار مفتوح — يعيد رسم القسم بلا تحميل */
    await page.evaluate(l => window.I18N.setLang(l), lang);
    await sleep(300);

    const root0 = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      marker: window.__tws_lang_gate
    }));
    check(`[${lang}] <html lang/dir> follow the app language (RTL only for Arabic)`,
      root0.lang === lang && root0.dir === RTL[lang], JSON.stringify(root0));
    check(`[${lang}] no page reload happened on the language switch`, root0.marker === 'alive');

    await page.evaluate(() => { location.hash = '#/tws'; });
    await page.waitForFunction(() => {
      const v = document.getElementById('view-tws');
      return v && !v.hidden && document.querySelectorAll('.tws-crop').length > 0;
    }, { timeout: 15000 });

    const grid = await page.evaluate(() => ({
      h1: (document.querySelector('#view-tws h1') || {}).textContent || '',
      ph: (document.getElementById('twsFilter') || {}).placeholder || '',
      notes: document.querySelectorAll('#view-tws .tws-ar-fb').length
    }));
    check(`[${lang}] crops-grid title follows the translation system`,
      grid.h1 === exp('title', lang), grid.h1 + ' ≠ ' + exp('title', lang));
    check(`[${lang}] search placeholder follows the translation system`,
      grid.ph === exp('search_ph', lang), grid.ph);
    check(`[${lang}] the grid carries no untranslated-content notice (it shows ar+en names)`,
      grid.notes === 0, String(grid.notes));

    /* اختيار المحصول: بحث محايد بالـid ثم فتح قمح */
    await page.evaluate(() => {
      const el = document.getElementById('twsFilter');
      el.value = 'wheat';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(250);
    const found = await page.evaluate(() =>
      !!document.querySelector('a.tws-crop[href="#/tws/wheat"]'));
    check(`[${lang}] searching "wheat" reaches the wheat crop card`, found);
    await page.evaluate(() => {
      const a = document.querySelector('a.tws-crop[href="#/tws/wheat"]');
      if (a) a.click();
    });
    await page.waitForFunction(() => document.querySelectorAll('.tws-inf').length > 0, { timeout: 15000 });

    const cropView = await page.evaluate(() => ({
      back: (document.querySelector('#view-tws .tws-crumb a') || {}).textContent || '',
      sci: (document.querySelector('#view-tws .tws-cropband em') || {}).textContent || '',
      firstName: (document.querySelector('#view-tws .tws-list .nm b') || {}).textContent || '',
      notes: [...document.querySelectorAll('#view-tws .tws-ar-fb')].map(n => n.textContent)
    }));
    check(`[${lang}] crop-view back button follows the translation system`,
      cropView.back === exp('back_crops', lang), cropView.back);
    check(`[${lang}] the scientific name stays verbatim from the book data`,
      cropView.sci === (WHEAT.sci || '—'), cropView.sci);
    check(`[${lang}] infection names keep the original Arabic text`,
      AR.test(cropView.firstName), cropView.firstName);
    if (lang === 'ar') {
      check('[ar] crop view shows no Arabic-fallback notice in Arabic', cropView.notes.length === 0);
    } else {
      check(`[${lang}] crop view states honestly that the content is untranslated Arabic`,
        cropView.notes.length === 1 && cropView.notes[0] === exp('content_ar_fallback', lang),
        cropView.notes.join(' | '));
    }

    /* فتح بطاقة التوصية */
    await page.evaluate(h => {
      const a = document.querySelector('a.tws-inf[href="' + h + '"]');
      if (a) a.click();
    }, CARD_HREF);
    await page.waitForSelector('.tws-card', { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll('.tws-card h3').length > 0, { timeout: 15000 });

    const card = await page.evaluate(() => {
      const h2el = document.querySelector('.tws-card h2');
      return {
        h2: (h2el || {}).textContent || '',
        h2dir: h2el ? h2el.getAttribute('dir') : null,
        h2lang: h2el ? h2el.getAttribute('lang') : null,
        h3: [...document.querySelectorAll('.tws-card h3')].map(x => x.textContent),
        notes: [...document.querySelectorAll('.tws-card .tws-ar-fb')].map(n => n.textContent),
        lis: [...document.querySelectorAll('.tws-card ul li')].map(x => x.textContent),
        text: (document.querySelector('.tws-card') || {}).textContent || ''
      };
    });
    check(`[${lang}] the card title is the original Arabic name from the book`,
      card.h2 === treated.name_ar, card.h2);
    check(`[${lang}] the Arabic card title is direction-isolated inside the card`,
      card.h2dir === 'rtl' && card.h2lang === 'ar', card.h2dir + '/' + card.h2lang);

    const fieldProblems = present.filter(k => {
      const want = exp(k, lang);
      const shown = card.h3.find(t => t.indexOf(want) >= 0);
      if (shown === undefined) return true;                        // لا ترجمة المعامل
      if (lang !== 'ar' && shown.indexOf(LABELS.ar[k]) >= 0) return true; // سقط إلى العربية
      return false;
    });
    check(`[${lang}] every card heading (${present.join('+')}) follows the translation system`,
      fieldProblems.length === 0, 'missing/wrong: ' + fieldProblems.join(','));

    if (treated.symptom && treated.symptom.length) {
      check(`[${lang}] the symptom list keeps the book text verbatim`,
        card.lis.length === treated.symptom.length &&
        card.lis.every((t, i) => t === treated.symptom[i]),
        card.lis.length + ' vs ' + treated.symptom.length);
    }

    if (lang === 'ar') {
      check('[ar] card shows no Arabic-fallback notice in Arabic', card.notes.length === 0);
    } else {
      check(`[${lang}] the card states honestly that its content is untranslated Arabic`,
        card.notes.length === 1 && card.notes[0] === exp('content_ar_fallback', lang),
        card.notes.join(' | '));
    }

    check(`[${lang}] product values stay verbatim (active/rate/WHO/PHI)`,
      P0_VALS.every(v => card.text.indexOf(v) >= 0),
      P0_VALS.filter(v => card.text.indexOf(v) < 0).join(' | '));
    check(`[${lang}] CAS honesty: numbers shown only for confirmed matches`,
      CAS_ROWS.every(r => r.show ? card.text.indexOf(r.cas) >= 0 : card.text.indexOf(r.cas) < 0),
      JSON.stringify(CAS_ROWS));

    const doseNotes = await page.evaluate(() =>
      [...document.querySelectorAll('.tws-card .tws-note')].filter(x =>
        x.className.indexOf('tws-ar-fb') < 0).map(x => x.textContent));
    check(`[${lang}] the permanent dose/source note is translated UI text`,
      doseNotes.length === 1 && doseNotes[0] === exp('dose_note', lang),
      doseNotes.join(' | ').slice(0, 120));
  }

  /* التبديل الحي فوق البطاقة المفتوحة: fr ← ar ← zh بلا إعادة تحميل */
  await page.evaluate(() => window.I18N.setLang('fr'));
  await sleep(300);
  const FR_PRODUCTS = exp('products', 'fr');
  const FR_FB = exp('content_ar_fallback', 'fr');
  const liveFr = await page.evaluate((want, fb) => ({
    dir: document.documentElement.dir,
    has: [...document.querySelectorAll('.tws-card h3')].some(x =>
      x.textContent.indexOf(want) >= 0),
    note: document.querySelectorAll('.tws-card .tws-ar-fb').length,
    noteText: (document.querySelector('.tws-card .tws-ar-fb') || {}).textContent || '',
    dose: [...document.querySelectorAll('.tws-card .tws-note')].some(x =>
      x.className.indexOf('tws-ar-fb') < 0 && x.textContent.indexOf(fb) < 0),
    marker: window.__tws_lang_gate
  }), FR_PRODUCTS, FR_FB);
  check('live switch to French re-renders the open card (heading + LTR + notice, no reload)',
    liveFr.dir === 'ltr' && liveFr.has && liveFr.note === 1 &&
    liveFr.noteText === FR_FB && liveFr.dose && liveFr.marker === 'alive',
    JSON.stringify(liveFr));

  await page.evaluate(() => window.I18N.setLang('ar'));
  await sleep(300);
  const AR_PRODUCTS = LABELS.ar.products;
  const liveAr = await page.evaluate(want => ({
    dir: document.documentElement.dir,
    ar: [...document.querySelectorAll('.tws-card h3')].some(x =>
      x.textContent.indexOf(want) >= 0),
    note: document.querySelectorAll('.tws-card .tws-ar-fb').length
  }), AR_PRODUCTS);
  check('live switch back to Arabic restores RTL Arabic labels and hides the notice',
    liveAr.dir === 'rtl' && liveAr.ar && liveAr.note === 0, JSON.stringify(liveAr));

  await page.evaluate(() => window.I18N.setLang('zh'));
  await sleep(300);
  const ZH_PRODUCTS = exp('products', 'zh');
  const liveZh = await page.evaluate(want => ({
    dir: document.documentElement.dir,
    has: [...document.querySelectorAll('.tws-card h3')].some(x =>
      x.textContent.indexOf(want) >= 0),
    note: document.querySelectorAll('.tws-card .tws-ar-fb').length
  }), ZH_PRODUCTS);
  check('live switch to Chinese re-renders the open card (heading + LTR + notice)',
    liveZh.dir === 'ltr' && liveZh.has && liveZh.note === 1, JSON.stringify(liveZh));

  /* شاشة هاتف ضيقة (320) بالصينية: لا تمرير أفقي داخل البطاقة */
  await page.setViewport({ width: 320, height: 720, isMobile: true, hasTouch: true });
  await sleep(300);
  const wide = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    win: window.innerWidth
  }));
  check('no horizontal overflow at 320px with the Chinese card',
    wide.doc <= wide.win + 1 && wide.body <= wide.win + 1, JSON.stringify(wide));

  check('no JavaScript errors in any language', errors.length === 0, errors.slice(0, 3).join(' || '));
} finally {
  await browser.close().catch(() => {});
  if (srv) srv.kill();
}
console.log('LANG-GATE ' + pass + '/' + (pass + fail));
process.exit(fail ? 1 : 0);
