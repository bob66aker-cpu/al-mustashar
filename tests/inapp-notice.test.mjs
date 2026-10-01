/*
 * tests/inapp-notice.test.mjs — فيدباك إطلاق 1: المتصفح الداخلي
 * ---------------------------------------------------------------------------
 * يحمّل التطبيق في كروم حقيقي بأكثر من userAgent واحد ويقيس ما يراه المزارع
 * فعلاً على الشاشة، لا ما يقوله الكود:
 *   1. UA فيسبوك على أندرويد  => البطاقة تظهر، سطر آيفون مخفي، زر النسخ ظاهر.
 *   2. النقر على «نسخ الرابط»  => الرابط ينتقل إلى الحافظة حقاً، ثم الزر يختفي.
 *   3. UA فيسبوك على آيفون    => نفس البطاقة + سطر سفاري/المشاركة ظاهر.
 *   4. UA كروم عادي            => لا بطاقة إطلاقاً (صفر أسطر في الشاشة).
 *   5. اللغات الأربع           => نص البطاقة يتبدّل فعلياً (لا نص واحد ثابت).
 * لا نصّ واجهة عربي مكتوب في هذا الملف: المقارنة على أنماط يونيكود وعلى ما
 * يقرؤه التطبيق من قاموسه وقت التشغيل، حتى لا يصير الحارس مصدر نصّ ثابت.
 * (الأسماء العربية هنا أسماء اختبارات فقط، كما في بقية حُرّاس المشروع.)
 *
 * تشغيل: node tests/inapp-notice.test.mjs [baseUrl]   (افتراضياً 127.0.0.1:8080)
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync } from 'node:fs';

const CHROME = '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = (process.argv[2] || 'http://127.0.0.1:8080').replace(/\/$/, '');

const UA_FB_ANDROID = 'Mozilla/5.0 (Linux; Android 13; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0.0.0.0;]';
const UA_FB_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) '
  + 'Version/17.2 Mobile/15E148 [FBAN/FBIOS;FBAV/460.0.0.0.0;FBBV/1234;FBDV/iPhone14,2]';
const UA_CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 13; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/120.0.0.0 Mobile Safari/537.36';
const UA_LINE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) '
  + 'Mobile/15E148 Safari/604.1 LINE/13.5.0';
const UA_WHATSAPP = 'Mozilla/5.0 (Linux; Android 13; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Version/17.0 Chrome/120.0.0.0 Mobile Safari/537.36 WhatsApp/2.23.20.0';

const ARABIC = /[\u0600-\u06FF]/;
const HAN = /[\u4E00-\u9FFF]/;

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + extra));
  ok ? pass++ : fail++;
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

async function openWithUA(ua, settle) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.setUserAgent(ua);
  /* the detector runs while app.js boots, so the card is settled long before
   * the databases finish loading: wait for that, not for the whole network */
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  /* the clipboard API only answers a focused, gesture-carrying page */
  await page.bringToFront();
  await page.waitForFunction((mode) => {
    const card = document.querySelector('#inappNotice');
    const title = document.querySelector('#inappTitle');
    const home = document.querySelector('#view-home');
    if (!card || !home) return false;
    return mode === 'chrome' ? card.hidden === true : (title && title.textContent.length > 0);
  }, { timeout: 20000 }, settle || 'inapp');
  return { page, errors };
}
const vis = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return null;
  return !el.hidden && el.getBoundingClientRect().height > 0;
}, sel);
const txt = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  return el ? (el.textContent || '').trim() : null;
}, sel);

try {
  /* the three clipboard permissions together: with fewer, headless chrome
   * refuses the real write (measured, not assumed) and the copy path would
   * silently fall back to the manual-selection branch */
  await browser.defaultBrowserContext().overridePermissions(BASE,
    ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

  /* ---- 1. فيسبوك على أندرويد ---- */
  {
    const { page, errors } = await openWithUA(UA_FB_ANDROID, 'inapp');
    check('in-app: the card shows when the page is opened in the Facebook browser',
      await vis(page, '#inappNotice') === true);
    check('in-app: the card is on the home view and the first thing under the heading',
      await page.evaluate(() => {
        const home = document.querySelector('#view-home');
        const card = document.querySelector('#inappNotice');
        if (!home || !card) return false;
        const kids = [...home.children];
        return kids.indexOf(card) === 1 && kids[0].classList.contains('hero');
      }));
    check('in-app: the copy button is offered',
      await vis(page, '#inappCopy') === true);
    check('in-app: the iPhone route line stays hidden on Android',
      await vis(page, '#inappIos') === false);
    check('in-app: the title is filled from the dictionary (not an empty heading)',
      ((await txt(page, '#inappTitle')) || '').length > 3);
    check('in-app: the printed link is the app URL without the hash',
      /^https?:\/\/.+\/$/.test((await txt(page, '#inappUrl')) || ''),
      await txt(page, '#inappUrl'));
    check('in-app: the note is hidden until a copy actually happens',
      await vis(page, '#inappNote') === false);

    /* ---- 2. النسخ: الحافظة أولاً، ثم إخفاء الزر ---- */
    await page.click('#inappCopy');
    await new Promise(r => setTimeout(r, 400));
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
    check('in-app: clicking the button really writes the app link to the clipboard',
      typeof clip === 'string' && /^https?:\/\//.test(clip), String(clip).slice(0, 60));
    check('in-app: the copy button disappears after a successful copy',
      await vis(page, '#inappCopy') === false);
    check('in-app: a confirmation line replaces the button',
      await vis(page, '#inappNote') === true);
    check('in-app: no page or console error while detecting and copying',
      errors.length === 0, errors.join(' | '));
    await page.close();
  }

  /* ---- 3. فيسبوك على آيفون: الطريق عبر سفاري ---- */
  {
    const { page } = await openWithUA(UA_FB_IOS, 'inapp');
    check('in-app: the same card shows for iPhone in Facebook',
      await vis(page, '#inappNotice') === true);
    check('in-app: the iPhone line (Safari then share) shows on iPhone',
      await vis(page, '#inappIos') === true);
    const iosLine = (await txt(page, '#inappIos')) || '';
    const genericLine = (await txt(page, '#inappNotice p[data-i18n="inapp.text"]')) || '';
    /* the iPhone route is a second, different sentence — not the generic line again */
    check('in-app: the iPhone line is its own sentence, not the generic install line',
      iosLine.length > 10 && iosLine !== genericLine, iosLine.slice(0, 60));
    await page.close();
  }

  /* ---- 3b. البطاقة واصلاٍ: أسناساء + مقاس لون وهدف للمساس ---- */
  {
    const { page } = await openWithUA(UA_FB_IOS, 'inapp');
    const geo = await page.evaluate(() => {
      const view = document.querySelector('#view-home');
      const card = document.querySelector('#inappNotice');
      const btn = document.querySelector('#inappCopy');
      const cb = card.getBoundingClientRect(), vb = btn.getBoundingClientRect();
      return {
        cardW: Math.round(cb.width), viewW: Math.round(view.getBoundingClientRect().width),
        btnH: Math.round(vb.height), btnW: Math.round(vb.width),
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        heading: (card.querySelector('h2') || {}).tagName || 'none',
        h1: [...document.querySelectorAll('#view-home h1')].filter(e => e.getBoundingClientRect().height > 0).length
      };
    });
    check('in-app: the card is as wide as the home column and adds no sideways scroll',
      geo.cardW === geo.viewW && geo.overflowX === false,
      JSON.stringify(geo));
    check('in-app: the copy button keeps the 44px touch target and a real width',
      geo.btnH >= 44 && geo.btnW >= 88, 'h=' + geo.btnH + ' w=' + geo.btnW);
    check('in-app: the card heading is a level two right after the single level one',
      geo.heading === 'H2' && geo.h1 === 1, JSON.stringify(geo));

    const AXE_PATH = '/home/daytona/lh/node_modules/axe-core/axe.min.js';
    if (existsSync(AXE_PATH)) {
      await page.evaluate(readFileSync(AXE_PATH, 'utf8'));
      const res = await page.evaluate(async () => {
        const r = await window.axe.run(document, { resultTypes: ['violations'] });
        return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length }));
      });
      const crit = res.filter(v => v.impact === 'critical' || v.impact === 'serious');
      check('in-app: the open card carries zero critical/serious accessibility findings',
        crit.length === 0, JSON.stringify(crit));
    } else {
      console.log('NOTE axe-core not present: the accessibility check above was not measured');
    }
    await page.close();
  }

  /* ---- 4. متصفحات داخلية أخرى ---- */
  for (const [label, ua] of [['Line', UA_LINE], ['WhatsApp', UA_WHATSAPP]]) {
    const { page } = await openWithUA(ua);
    check('in-app: the card also shows for ' + label, await vis(page, '#inappNotice') === true);
    await page.close();
  }

  /* ---- 5. كروم عادي: لا شيء يظهر ---- */
  {
    const { page, errors } = await openWithUA(UA_CHROME_ANDROID, 'chrome');
    check('in-app: nothing is added to the screen in a normal Chrome browser',
      await vis(page, '#inappNotice') === false
      && await vis(page, '#inappTitle') === false
      && await vis(page, '#inappCopy') === false);
    check('in-app: the detection left the page clean on a normal browser',
      errors.length === 0, errors.join(' | '));
    await page.close();
  }

  /* ---- 6. اللغات الأربع: النص يتبدّل فعلاً ---- */
  {
    const seen = [];
    for (const lang of ['ar', 'en', 'fr', 'zh']) {
      const { page } = await openWithUA(UA_FB_ANDROID);
      await page.select('#langSelect', lang);
      await new Promise(r => setTimeout(r, 250));
      const body = ((await txt(page, '#inappNotice')) || '');
      const title = ((await txt(page, '#inappTitle')) || '');
      const label = ((await txt(page, '#inappCopy')) || '').trim();
      seen.push({
        lang, body, title, label,
        btn: await vis(page, '#inappCopy'),
        ar: ARABIC.test(body), han: HAN.test(body)
      });
      await page.close();
    }
    const byLang = Object.fromEntries(seen.map(s => [s.lang, s]));
    check('in-app: the Arabic text is Arabic and the Chinese text is Han script',
      byLang.ar.ar && !byLang.ar.han && byLang.zh.han && !byLang.zh.ar
      && !byLang.en.ar && !byLang.en.han && !byLang.fr.ar && !byLang.fr.han,
      seen.map(s => s.lang + ':' + (s.ar ? 'ar' : '') + (s.han ? 'zh' : '')).join(' '));
    check('in-app: the four languages really differ (no single fixed string)',
      new Set(seen.map(s => s.body)).size === 4 && new Set(seen.map(s => s.title)).size === 4);
    check('in-app: the browser name sits in the heading of the card in every language',
      seen.every(s => s.title.length > 3 && s.body.indexOf(s.title) === 0),
      seen.map(s => s.lang + '=' + s.title).join(' | '));
    check('in-app: the copy button stays offered in all four languages',
      seen.every(s => s.btn === true && s.label.length >= 2),
      seen.map(s => s.lang + '=' + s.label).join(' | '));
  }
} finally {
  await browser.close();
}

console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
