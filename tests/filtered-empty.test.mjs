/*
 * tests/filtered-empty.test.mjs — الحالة الحقيقية لرقم مُخفي بالفلتر (2026-09-30)
 * ---------------------------------------------------------------------------
 * إعادة إنتاج البلاغ الأصلي كما يعيشه المزارع، لا كعنصر واجهة:
 *
 *   50-00-0 (فورمالدهايد) موجود في مصادر أجنبية (EU صفّان · EPA صفّ)،
 *   ووضعية المزارع = المصادر الليبية فقط بقرار موثّق، فيُزال كل ما طابق.
 *   قبل الإصلاح كان render() يبني قائمة من مصفوفة فارغة ويترك صندوقاً فيه
 *   شريط الإخلاء فقط — أي صمت، وهو القراءة التي قد تُقرأ إذناً.
 *
 * ما يثبته هذا الملف:
 *   1) وضع المزارع + 50-00-0  ⇒ تنبيه «لم يتم العثور على تطابق موثوق» مع
 *      جملة السلامة، **مرئي فعلياً** (لا عنصر مخفي ولا صندوق فارغ)،
 *      وصفر بطاقة.
 *   2) وضع المحترف + 50-00-0  ⇒ العدد **المتوقَّع** من البطاقات، مقيَّداً
 *      بعدد الصفوف الحقيقية في ملفات البيانات، وبأسماء ومصادر مطابقة.
 *   3) لا انحدار: مادة ليبية حقيقية (1071-83-6 في libya-500) تُظهر بطاقاتها
 *      ولا تُظهر التنبيه.
 *   4) رقم مجهول فعلاً يقرأ نفس التنبيه — المسارتان تتساويتان.
 *   5) صفر أخطاء console.
 *
 * التوقعات تُشتقّ من ملفات البيانات عند كل تشغيل، فالاختبار لا ينزلق صامتاً
 * إن تغيّرت البيانات، ويرفض إن صارت لا تحوي شيئاً (اختبار فارغ).
 * تشغيل: BASE_URL=http://127.0.0.1:8080 node tests/filtered-empty.test.mjs
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

/* ---- ground truth: read the DATA, never assume it ---- */
const readPack = (key) => {
  const j = JSON.parse(readFileSync(join(ROOT, 'data', key + '.json'), 'utf8'));
  const rows = Array.isArray(j) ? j : (j.rows || j.data || j.items || Object.values(j)[0]);
  return Array.isArray(rows) ? rows : [];
};
const rowsWithCas = (key, cas) => readPack(key)
  .filter(r => String(r.cas || r.c || r.cas_no || r.casrn || '').trim() === cas)
  .map(r => String(r.n || r.name || r.en || r.common_name || '').trim());

const CAS_EU_ONLY = '50-00-0';
const FOREIGN = ['eu', 'epa', 'epa-cancelled'];
const foreignRows = FOREIGN.flatMap(k => rowsWithCas(k, CAS_EU_ONLY).map(n => ({ k, n })));
const CAS_LIBYAN = '1071-83-6';
const libyanRows = ['libya-248', 'libya-500'].flatMap(k => rowsWithCas(k, CAS_LIBYAN).map(n => ({ k, n })));
const CAS_UNKNOWN = '99999-99-9';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};

console.log(`\nfiltered-empty · ${BASE}`);
console.log(`  facts: ${CAS_EU_ONLY} in ${foreignRows.length} foreign row(s) [${foreignRows.map(r => r.k).join(', ')}] · `
  + `${CAS_LIBYAN} in ${libyanRows.length} Libyan row(s) · ${CAS_UNKNOWN} expected in none`);

/* a test that asserts nothing is worse than no test */
if (foreignRows.length < 2) {
  console.log(`  FAIL precondition — ${CAS_EU_ONLY} must exist in at least 2 foreign rows, found ${foreignRows.length}`);
  process.exit(1);
}
if (libyanRows.length < 1) {
  console.log(`  FAIL precondition — ${CAS_LIBYAN} must exist in a Libyan pack, found ${libyanRows.length}`);
  process.exit(1);
}
if (rowsWithCas('eu', CAS_UNKNOWN).length || rowsWithCas('epa', CAS_UNKNOWN).length
  || rowsWithCas('epa-cancelled', CAS_UNKNOWN).length || rowsWithCas('libya-248', CAS_UNKNOWN).length
  || rowsWithCas('libya-500', CAS_UNKNOWN).length) {
  console.log(`  FAIL precondition — ${CAS_UNKNOWN} must be absent from every pack`);
  process.exit(1);
}

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

  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 40000 });
  await sleep(1500);

  const setMode = async (m) => {
    await page.select('#mode', m);
    await page.evaluate(() => document.getElementById('mode')
      .dispatchEvent(new Event('change', { bubbles: true })));
    await sleep(400);
  };

  const search = async (q) => {
    await page.evaluate(() => { location.hash = '#/search'; });
    await sleep(250);
    await page.evaluate(() => { document.getElementById('query').value = ''; });
    await page.type('#query', q, { delay: 8 });
    await page.evaluate(() => document.getElementById('searchForm')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await sleep(1600);
  };

  /* What the farmer actually SEES in the results box, not what the DOM
   * merely contains: text, visibility, and the card list. */
  const readView = () => page.evaluate(() => {
    const box = document.getElementById('results');
    const cards = [...box.querySelectorAll('article.result')];
    const notice = box.querySelector('.notice');
    const visible = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
        && Number(cs.opacity || 1) > 0.05;
    };
    return {
      text: (box.innerText || '').trim(),
      html: box.innerHTML,
      cardCount: cards.length,
      cards: cards.map(c => ({
        title: ((c.querySelector('h3') || {}).textContent || '').trim(),
        text: (c.innerText || '').trim(),
        visible: visible(c),
        source: (c.querySelector('.cas-src, .src, .source, [data-source]') || {}).textContent || ''
      })),
      notice: notice ? {
        text: (notice.innerText || '').trim(),
        warn: /warn/i.test(notice.className),
        visible: visible(notice)
      } : null,
      hasDisclaimer: !!box.querySelector('.disclaimer-strip'),
      children: box.children.length,
      lang: document.documentElement.lang,
      mode: document.getElementById('mode').value
    };
  });

  /* 1) the reported case: farmer mode, EU/EPA-only substance */
  await setMode('farmer');
  await search(CAS_EU_ONLY);
  let v = await readView();
  must('farmer mode is the mode under test', v.mode === 'farmer', 'mode=' + v.mode);
  must('farmer + 50-00-0 shows no result card', v.cardCount === 0, 'cards=' + v.cardCount);
  must('farmer + 50-00-0 shows the "no reliable match" notice', !!v.notice
    && /لم يتم العثور على تطابق موثوق/.test(v.notice.text), v.notice ? v.notice.text.split('\n')[0] : 'no notice');
  const noticeLines = v.notice ? v.notice.text.split('\n').map(x => x.trim()).filter(Boolean) : [];
  must('the notice carries the safety sentence under the heading', noticeLines.length >= 2
    && /لا يعني/.test(noticeLines[1]), noticeLines.join(' / ') || 'no notice');
  must('the notice is a warning, not a plain note', !!v.notice && v.notice.warn,
    v.notice ? v.notice.text.replace(/\n/g, ' ') : 'no notice');
  must('the notice is VISIBLE, not just present in the DOM', !!v.notice && v.notice.visible,
    v.notice ? 'visible=' + v.notice.visible : 'no notice');
  must('the box is not left empty: the notice occupies it', v.children > 0
    && v.text.length > 0, 'children=' + v.children + ' chars=' + v.text.length);
  must('the notice is the whole box, not a leftover shell', v.children === 1,
    'children=' + v.children);
  must('the notice text is in the Arabic farmer language', /[؀-ۿ]/.test(v.text),
    'lang=' + v.lang);

  /* 2) the same number in pro mode: the expected cards are really displayed */
  await setMode('pro');
  await search(CAS_EU_ONLY);
  v = await readView();
  must('pro + 50-00-0 shows exactly the rows that carry it', v.cardCount === foreignRows.length,
    'cards=' + v.cardCount + ' expected=' + foreignRows.length);
  const shown = v.cards.map(c => c.title).sort();
  const want = foreignRows.map(r => r.n).sort();
  must('pro card titles are the substance names from the data', JSON.stringify(shown) === JSON.stringify(want),
    JSON.stringify(shown) + ' vs ' + JSON.stringify(want));
  must('every pro card is visible on screen', v.cards.length > 0 && v.cards.every(c => c.visible),
    'visible=' + v.cards.filter(c => c.visible).length + '/' + v.cards.length);
  const foreignText = v.cards.map(c => c.text).join(' ').toLowerCase();
  must('the foreign source is named on the card, so the farmer can see it is not Libyan',
    v.cardCount > 0 && v.cards.every(c => /أوروبا|أوروبي|الاتحاد|epaa?|epa|union|europe/i.test(c.text + c.source)),
    v.cards.map(c => c.text.replace(/\s+/g, ' ').slice(0, 60)).join(' || '));
  must('pro mode shows no "not found" notice', v.notice === null,
    v.notice ? v.notice.text.replace(/\n/g, ' ') : 'none');
  must('pro mode keeps the disclaimer strip', v.hasDisclaimer, 'strip=' + v.hasDisclaimer);
  must('no Libyan source is invented in pro mode', !/ليبيا/.test(foreignText) || v.cardCount === 0,
    'cards=' + v.cardCount);

  /* 3) no regression: a substance a Libyan farmer CAN see still shows cards */
  await setMode('farmer');
  await search(CAS_LIBYAN);
  v = await readView();
  must('farmer + 1071-83-6 still shows its Libyan card(s)', v.cardCount >= 1,
    'cards=' + v.cardCount + ' (libyan rows=' + libyanRows.length + ')');
  must('farmer + 1071-83-6 shows no "not found" notice', v.notice === null,
    v.notice ? v.notice.text.replace(/\n/g, ' ') : 'none');

  /* 4) parity: a genuinely unknown number reads exactly the same way */
  await search(CAS_UNKNOWN);
  v = await readView();
  must('an unknown CAS shows the same notice', !!v.notice
    && /لم يتم العثور على تطابق موثوق/.test(v.notice.text) && v.notice.visible,
    v.notice ? v.notice.text.split('\n')[0] : 'no notice');
  must('an unknown CAS shows no card', v.cardCount === 0, 'cards=' + v.cardCount);

  /* 5) no console noise through the whole round */
  must('zero console/page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
} finally {
  await browser.close();
}

console.log(`\n  PASS ${pass} · FAIL ${fail}`);
process.exit(fail ? 1 : 0);
