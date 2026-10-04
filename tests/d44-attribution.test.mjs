/*
 * tests/d44-attribution.test.mjs — D44: إسناد ظاهر لمصدر شرح رموز 248
 * ---------------------------------------------------------------------------
 * القرار: الاحتياط قائم بشرط الإسناد الصادق. الرموز المشتركة في بطاقات
 * قرار 248 تُشرح من دليل 500 (لأن دليل 248 لا يشرح الرموز — D27)، فعلى
 * البطاقة أن يُقال للمزارع من أين جاء هذا الشرح.
 *
 * ما يقيسه: (1) الحقل بأربع لغات، ويظهر فقط حين يمرّ الرمز فعلاً بالاحتياط
 * المُعلَن، ولا يحمل حرفاً صينياً. (2) حيّاً (وضعان × حاويتان، مترجمة
 * المتصفح معطّلة): بطاقة 248 برمز مشترك تحمل النسبة، والرمز الخاص Mi يبقى
 * على «رمز غير مشروح في دليل هذا المصدر»، وبطاقة 500 لا نسبة (دليلها هو)،
 * والنسبة لا تتسرّب إلى كتلة الحالة.
 * تشغيل: node tests/d44-attribution.test.mjs   (المعاينة على 127.0.0.1:8080)
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
const cards = readFileSync(join(root, 'src/cards.js'), 'utf8');
const attr = REF.sections.libya248.attribution;

/* ---------- 1) static ---------- */
check('libya248.attribution exists in all four languages',
  ['ar', 'en', 'fr', 'zh'].every(l => typeof attr[l] === 'string' && attr[l].length > 20),
  JSON.stringify(Object.keys(attr || {})));
check('the Arabic attribution is the owner wording, in pure Arabic script',
  /^\s*يُشرح رمز التصنيف في هذا الصف بحسب دليل قرار وزارة الزراعة رقم 500 لسنة 2026 — دليل قرار 248 لا يشرح الرموز\.\s*$/.test(attr.ar)
  && !/[一-鿿]/.test(attr.ar), attr.ar);
check('the attribution names BOTH guides (an attribution, not a claim)',
  /500/.test(attr.ar) && /248/.test(attr.ar) && /500/.test(attr.en) && /248/.test(attr.en));

/* the shipped resolver, run against the shipped reference */
const slice = app.slice(app.indexOf('  function catAttribution(code, sourceKey) {'),
  app.indexOf('  function catTitle(code, sourceKey) {'));
const REF_BY_SOURCE = { 'libya-500': 'libya500', 'libya-248': 'libya248', eu: 'eu', epa: 'epa', canada: 'canada', australia: 'australia' };
const catFold = c => String(c == null ? '' : c).toLowerCase().replace(/[.\s]/g, '');
const refCatEntry = new Function('REF', 'catFold', 'REF_BY_SOURCE', `
  const refSection = k => (REF && REF.sections && REF.sections[k]) || null;
  return function refCatEntry(sectionKey, code) {
    const s = refSection(sectionKey);
    if (!s || !s.categories) return null;
    const direct = s.categories[code];
    if (direct) return direct;
    const fold = catFold(code);
    for (const k of Object.keys(s.categories)) {
      const e = s.categories[k] || {};
      for (const sh of e.shapes || []) if (catFold(sh) === fold) return e;
    }
    if (s.fallbackSection && s.fallbackSection !== sectionKey) return refCatEntry(s.fallbackSection, code);
    return null;
  };`)(REF, catFold, REF_BY_SOURCE);
const CAT_HARD_SEP = /[,\/+]/;
const CAT_DOT_SEP = /\./;
const catParts = new Function('refCatKey', 'CAT_HARD_SEP', 'CAT_DOT_SEP', `
  return function catParts(code, sectionKey) {
    const sec = sectionKey || 'libya500';
    const c = String(code || '').trim();
    if (!c) return [];
    return c.split(CAT_HARD_SEP).map(p => p.trim()).filter(Boolean)
      .flatMap(p => p.includes('.') && p.split(CAT_DOT_SEP).every(q => refCatKey(sec, q.trim()))
        ? p.split(CAT_DOT_SEP).map(q => q.trim()).filter(Boolean) : [p]);
  };`)((sec, code) => { const e = refCatEntry(sec, code); return e && e.i18nKey ? e.i18nKey : ''; },
  CAT_HARD_SEP, CAT_DOT_SEP);
const catAttribution = new Function('slice', 'REF_BY_SOURCE', 'refSectionOf', 'catParts', 'catFold', 'window',
  slice + '\nreturn catAttribution;')(
  slice, REF_BY_SOURCE, s => REF.sections[REF_BY_SOURCE[s]] || null, catParts, catFold,
  { I18N: { getLang: () => 'ar' } });
globalThis.I18N = { getLang: () => 'ar' };

check('a 248 card with a SHARED code carries the attribution',
  catAttribution('I/A', 'libya-248') === attr.ar, JSON.stringify(String(catAttribution('I/A', 'libya-248')).slice(0, 40)));
check('a 248 PRIVATE code carries none (FM · Mi · RP · T)',
  ['FM', 'Mi', 'RP', 'T'].every(c => catAttribution(c, 'libya-248') === ''),
  JSON.stringify(['FM', 'Mi', 'RP', 'T'].map(c => [c, catAttribution(c, 'libya-248')])));
check('a mixed cell keeps the attribution (its shared half IS explained by 500)',
  catAttribution('F/Mi', 'libya-248') === attr.ar);
check('a 500 card carries none — its own guide explains the code',
  catAttribution('I/A', 'libya-500') === '' && catAttribution('S.Ph', 'libya-500') === '');
check('no other source has an attribution to show',
  ['eu', 'epa', 'canada', 'australia'].every(k => catAttribution('I', k) === ''));
check('cards.js renders it inside the category block, after the chips',
  /catAttribution\(cells\[0\], x\.k\)/.test(cards) && /class="cat-attrib"/.test(cards));

/* ---------- 2) live: 2 modes × 2 containers ---------- */
const d248 = JSON.parse(readFileSync(join(root, 'data/libya-248.json'), 'utf8')).rows;
const shared = d248.find(r => r.category === 'I/A');
const mixed = d248.find(r => r.category === 'F/Mi');
const d500 = JSON.parse(readFileSync(join(root, 'data/libya-500.json'), 'utf8')).rows;
const row500 = d500.find(r => r.category === 'I + A');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-features=Translate,TranslateUI', '--disable-translate'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate(() => { document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'; });
  await new Promise(r => setTimeout(r, 2500));
  const readCard = name => page.evaluate(n => {
    const cards = [...document.querySelectorAll('#results article.result')];
    const c = cards.find(x => (x.querySelector('h3') || {}).textContent === n);
    if (!c) return null;
    const attrib = c.querySelector('.cat-attrib');
    return {
      attrib: attrib ? attrib.textContent.trim() : '',
      attribVisible: attrib ? !!(attrib.checkVisibility && attrib.checkVisibility()) : false,
      codes: [...c.querySelectorAll('.cat-code')].map(x => ({
        code: x.textContent, meaning: (x.parentElement.querySelector('.cat-meaning') || {}).textContent || ''
      })),
      statusHasAttrib: !!c.querySelector('.st-explain-full .cat-attrib')
    };
  }, name);
  const search = async q => {
    await page.evaluate(() => { location.hash = '#/search'; });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => { document.getElementById('query').value = ''; });
    await page.type('#query', q, { delay: 8 });
    await page.evaluate(() => document.getElementById('searchForm')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await new Promise(r => setTimeout(r, 1800));
  };

  for (const mode of ['farmer', 'pro']) {
    await page.evaluate(m => { document.getElementById('mode').value = m; }, mode);
    await search(shared.name.split('\n')[0]);
    const hit = await readCard(shared.name.split('\n')[0]);
    check(`[${mode} · بحث] the 248 shared-code card (row ${shared.row}) carries the attribution`,
      !!hit && hit.attrib === attr.ar && hit.attribVisible, hit ? JSON.stringify(hit).slice(0, 160) : 'no card');

    await search(mixed.name.split('\n')[0]);
    const mx = await readCard(mixed.name.split('\n')[0]);
    /* the chip is the WHOLE cell («F/Mi»); its meaning line is the parts line —
       so the private part must be named inside it with the hint, never given a
       meaning of its own. */
    const cell = mx && mx.codes.find(c => c.code === 'F/Mi');
    check(`[${mode} · بحث] the PRIVATE part Mi still shows the hint (no invented meaning)`,
      !!cell && /Mi: رمز غير مشروح في دليل هذا المصدر/.test(cell.meaning)
      && !/^[^:]*مبيد/.test((cell.meaning.split(' + ')[1] || '').replace('Mi: ', '')),
      cell ? cell.meaning : 'no F/Mi cell');
    check(`[${mode} · بحث] the attribution never sits inside the status block`,
      !!mx && !mx.statusHasAttrib);

    await search(row500.name.split('\n')[0]);
    const c500 = await readCard(row500.name.split('\n')[0]);
    check(`[${mode} · بحث] a 500 card carries NO attribution (its own guide explains it)`,
      !!c500 && c500.attrib === '', c500 ? JSON.stringify(c500.attrib) : 'no card');

    await page.evaluate(() => { location.hash = '#/scan'; });
    await new Promise(r => setTimeout(r, 400));
    const scan = await page.evaluate(async q => {
      await window.runScanPipeline(q);
      await new Promise(r => setTimeout(r, 2500));
      const box = document.querySelector('#scanResults');
      const c = [...box.querySelectorAll('article.result')].find(x => x.getAttribute('data-src') === 'libya-248');
      if (!c) return null;
      const attrib = c.querySelector('.cat-attrib');
      return { attrib: attrib ? attrib.textContent.trim() : '',
        attribVisible: attrib ? !!(attrib.checkVisibility && attrib.checkVisibility()) : false };
    }, shared.name.split('\n')[0]);
    check(`[${mode} · مسح] the same attribution is on the scan card`,
      !!scan && scan.attrib === attr.ar && scan.attribVisible, JSON.stringify(scan).slice(0, 160));
  }
} finally {
  await browser.close();
}
console.log('==============================');
console.log(`D44 ATTRIBUTION: PASS ${pass}   FAIL ${fail}`);
process.exit(fail ? 1 : 0);
