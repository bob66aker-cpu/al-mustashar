/*
 * tests/cas-display-browser.test.mjs — عرض طبقة CAS في كروم حقيقي (2026-09-27)
 * ---------------------------------------------------------------------------
 * يثبت في المتصفح ما طلبه المالك في التحقق الإلزامي:
 *   1) بحث Captan يعرض الرقم المعتمد 133-06-2 وحده (D42: بلا نسخة قديمة).
 *   2) بطاقة صف 18 في قرار 248 تعرض شارة التحذير المترجمة + نص الشرح.
 *   3) Tetradifon (I/A) يُفكّ إلى I و A معًا (tooltip الشريحة).
 *   4) بطاقة Carvone تعرض التباس المتماكب (نص الجولة) والرقم المعتمد.
 *   5) بطاقة Metalaxyl-M تعرض (R) بجوار الرقم المطبَّع.
 *   6) بطاقة قاعدة 500 تعرض العدّ المحسوب من عمود status + توضيح تعدد الاستخدامات.
 *   + صفر أخطاء console في كل الجولة.
 * تشغيل: BASE_URL=http://127.0.0.1:8080 node tests/cas-display-browser.test.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500);

  /* pro mode shows the CAS line; farmer mode hides it by design (stage ج) */
  const setMode = m => page.select('#mode', m);
  const search = async q => {
    await page.evaluate(() => { location.hash = '#/search'; });
    await sleep(300);
    await page.evaluate(() => { const i = document.getElementById('query'); i.value = ''; });
    await page.type('#query', q, { delay: 8 });
    await page.evaluate(() => document.getElementById('searchForm')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await sleep(1400);
  };
  const card = name => page.evaluate(n => {
    const a = [...document.querySelectorAll('#results article.result')]
      .find(x => (x.querySelector('h3') || {}).textContent === n);
    if (!a) return null;
    const meta = a.querySelector('p.meta');
    return {
      text: a.innerText,
      meta: meta ? meta.innerText : '',
      rawOld: (a.querySelector('.cas-raw-old') || {}).textContent || '',
      src: (a.querySelector('.cas-src') || {}).textContent || '',
      notes: [...a.querySelectorAll('p.cas-note')].map(p => p.innerText),
      catChips: [...a.querySelectorAll('.cat-code')].map(c => c.getAttribute('data-cat') + ' :: ' + (c.getAttribute('title') || ''))
    };
  }, name);

  await setMode('pro');

  /* ---------- 1) Captan: ONE value, the one the register adopts ---------- */
  /* D42: the old-copy layer (struck raw value + correction source label) was
     abolished by owner decision. What must stay is the ADOPTED number itself
     shown once, and the card must no longer pretend a second value exists. */
  await search('Captan');
  {
    const c = await card('Captan');
    must('Captan card exists', !!c);
    must('the register-adopted number 133-06-2 is the displayed value', c && /\b133-06-2\b/.test(c.meta), c && c.meta);
    must('the abolished raw value is nowhere on the card', c && c.rawOld === '' && !/133-06-02/.test(c.text), c && c.rawOld);
    must('no struck-through old value and no correction-source label are rendered', c && await page.evaluate(() => {
      return document.querySelectorAll('#results .cas-raw-old').length === 0
        && document.querySelectorAll('#results .cas-src').length === 0;
    }));
  }

  /* ---------- 4) Carvone: stereo ambiguity is on the card ---------- */
  await search('Carvone');
  {
    const c = await card('Carvone');
    must('Carvone card exists with the corrected number', !!c && /\b2244-16-8\b/.test(c.meta), c && c.meta);
    must('Carvone shows the stereo-ambiguity note (never removed)',
      !!c && c.notes.some(n => /\(\+\)-Carvone/.test(n) && /99-49-0/.test(n)),
      c && JSON.stringify(c.notes));
    must('the note is inside a warning badge',
      !!c && await page.evaluate(() => {
        const p = [...document.querySelectorAll('#results p.cas-note.warn')]
          .find(x => /\(\+\)-Carvone/.test(x.innerText));
        return !!(p && p.querySelector('.badge.warn'));
      }));
  }

  /* ---------- 5) Metalaxyl-M: (R) next to the normalised number ---------- */
  /* the descriptor comes from cas_stereo and must survive D42's abolition of
     the old-copy layer — the decree prints «(R)» and the farmer must see it */
  await search('Metalaxyl-M');
  {
    const c = await card('Metalaxyl-M');
    must('Metalaxyl-M shows 70630-17-0 with the (R) descriptor',
      !!c && /70630-17-0\s*\(R\)/.test(c.meta), c && c.meta);
    must('no struck-through duplicate of the number is rendered',
      !!c && c.rawOld === '' && !/70630-17-0[^\n]*70630-17-0/.test(c.meta), c && c.rawOld);
  }

  /* ---------- 2) Decree-248 row 18: translated warning badge + note ---------- */
  await search('Bromoxynil octanoate');
  {
    const c = await card('Bromoxynil octanoate');
    must('248 row 18 card exists', !!c);
    must('the CAS note is displayed with the translated badge',
      !!c && c.notes.some(n => /Butocarboxim/.test(n) && /1689-99-2/.test(n)),
      c && JSON.stringify(c.notes));
    must('the badge text is the translated label, not a raw key',
      !!c && await page.evaluate(() => {
        const b = [...document.querySelectorAll('#results p.cas-note .badge')].pop();
        return b ? (b.textContent.trim().length > 2 && !/^cas\./.test(b.textContent.trim())) : false;
      }));
  }

  /* ---------- 3) Tetradifon: I/A explained as I + A ---------- */
  await search('Tetradifon');
  {
    const chips = await page.evaluate(() => [...document.querySelectorAll('#results .cat-code')]
      .map(c => ({ code: c.getAttribute('data-cat'), title: c.getAttribute('title') || '' })));
    const t = chips.find(c => c.code === 'I/A');
    must('Tetradifon carries the raw I/A code chip (verbatim)', !!t, JSON.stringify(chips));
    /* both parts explained = two meanings joined by «+» (the tooltip is the
     * translated meaning, not the code) and NOT the unexplained-code hint */
    must('the I/A chip explains BOTH parts (two meanings joined by +)',
      !!t && /\+/.test(t.title) && t.title.split('\+').length === 2
      && t.title.split('\+').every(x => x.trim().length > 3), t && t.title);
    must('no «unexplained code» hint on the I/A chip', !!t && !/غير مشروح/.test(t.title), t && t.title);
  }

  /* an unexplained dotted code must stay literal and get the hint */
  await search('Lavandulyl senecioate');   /* 500 row 237 — category «I.Ph» */
  {
    const chips = await page.evaluate(() => [...document.querySelectorAll('#results .cat-code')]
      .map(c => ({ code: c.getAttribute('data-cat'), title: c.getAttribute('title') || '' })));
    const dotted = chips.find(c => /\./.test(c.code));
    must('a dotted code (I.Ph) is printed verbatim, not split', !!dotted, JSON.stringify(chips.map(c => c.code)));
    must('its explanation is the unexplained-code hint (no guessed meaning)',
      !!dotted && /غير مشروح/.test(dotted.title), dotted && dotted.title);
  }

  /* ---------- 6) Decree-500 status breakdown under the data card ---------- */
  await page.evaluate(() => { location.hash = '#/data'; });
  await sleep(1200);
  {
    const brk = await page.evaluate(() => {
      const el = document.getElementById('dbBreak500');
      return el ? { hidden: el.hidden, text: el.textContent } : null;
    });
    must('the 500 breakdown is visible on the data screen', !!brk && !brk.hidden, brk && brk.hidden);
    must('it lists the status counts computed from the data',
      !!brk && /Approved/.test(brk.text) && /REV/.test(brk.text) && /RAR/.test(brk.text), brk && brk.text.slice(0, 120));
    must('the status counts sum to 411 rows', !!brk && /411/.test(brk.text), brk && brk.text.slice(0, 160));
    must('it explains that the category total exceeds 411 (multi-use)',
      !!brk && /تعدد الاستخدامات/.test(brk.text), brk && brk.text.slice(-160));
  }

  must('zero console/page errors in the whole round', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
}
console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
