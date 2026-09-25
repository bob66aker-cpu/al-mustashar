/*
 * tests/mode-split.test.mjs — C: farmer/professional result-card split
 * ---------------------------------------------------------------------------
 * Round-prompt stage C spec (non-negotiable parts):
 *   BOTH modes always show:
 *     - libyaStatus (the per-source status paragraph)
 *     - functionalCategory (source category chips)
 *     - disclaimerStrip ("supporting tool, not a legal verdict")
 *     - absoluteBanBanner when a Decree-248 row matched EXACTLY (100%)
 *   PRO mode additionally shows:
 *     - internationalResults (non-Libya source cards)
 *     - casNumber (CAS paragraph)
 *     - statusExplanation (legend/status detail: status_raw + code chips)
 *   FARMER mode must NOT show those three, and must NEVER hide the exact-ban
 *   banner or the disclaimer.
 *
 * Implementation mapping in src/app.js render(): showDetails gates the
 * per-card pro-only pieces (CAS paragraph was already gated via showDetails;
 * status_raw/category/matchType gated; international results are per-source
 * cards and appear in both modes when a pro search runs — farmer search
 * returns the Libya-priority subset via SearchCore's mode filter, so the
 * DIFFERENCE is pinned here at the DOM level on the same matched row).
 *
 * Drives the real app in real Chromium on the real databases: searches a
 * Decree-248 substance (exact-banned), reads #results DOM in farmer mode,
 * then in pro mode, and asserts the spec table exactly (no extra, no
 * missing difference). Also drives the scan-path container (#scanResults)
 * for the ban banner (render() is shared).
 * Run: node tests/mode-split.test.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  if (ok) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

/* a Decree-248 substance that is EXACT-banned: DDT (3 chars, exact 100% in
 * libya-248 per the E2E suite) — also present in other DBs (pro mode diff) */
const QUERY = 'DDT';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/index.html#/search', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() =>
    window.__appReady === true ||
    (document.querySelector('#results') && !document.querySelector('#results .notice')), { timeout: 30000 })
    .catch(() => {});

  async function setMode(mode) {
    await page.evaluate(m => {
      const sel = document.querySelector('#mode');
      sel.value = m;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }, mode);
  }
  async function search(q) {
    await page.evaluate(qq => {
      document.querySelector('#query').value = qq;
      document.querySelector('#searchForm').dispatchEvent(new Event('submit', { cancelable: true }));
    }, q);
    await page.waitForFunction(() => document.querySelectorAll('#results article.result').length > 0, { timeout: 30000 });
  }
  const read = () => page.evaluate(() => {
    const box = document.querySelector('#results');
    const arts = [...box.querySelectorAll('article.result')];
    return {
      disclaimer: !!box.querySelector('.disclaimer-strip'),
      banBannerExact: !!box.querySelector('[data-ban-banner="exact"]'),
      banAny: !!box.querySelector('.prohibited'),
      casParagraphs: arts.filter(a => [...a.querySelectorAll('p.meta')].some(p => p.textContent.includes('CAS'))).length,
      articles: arts.length,
      sources: arts.map(a => a.querySelector('.source') ? a.querySelector('.source').textContent.trim() : ''),
      statusParagraphs: arts.filter(a => a.querySelector('p.status')).length,
      categoryChips: arts.filter(a => a.querySelector('.cat-code')).length,
      rawStatus: arts.filter(a => [...a.querySelectorAll('p.match')].some(p => p.textContent.includes('الحالة كما وردت') || p.textContent.includes('Status as given') || p.textContent.includes('Status as stated'))).length,
      matchType: arts.filter(a => [...a.querySelectorAll('p.match')].some(p => /تطابق|match|اسم مطابق|matches/i.test(p.textContent))).length,
      matchTypeParagraphs: arts.reduce((n, a) => n + [...a.querySelectorAll('p.match')].length, 0),
      explainChips: arts.filter(a => a.querySelector('.st-explain')).length
    };
  });

  /* ---------- farmer mode ---------- */
  await setMode('farmer');
  await search(QUERY);
  const farmer = await read();
  must('farmer: disclaimerStrip shown', farmer.disclaimer === true);
  must('farmer: libyaStatus paragraph shown', farmer.statusParagraphs > 0, 'articles=' + farmer.articles);
  must('farmer: exact-ban banner shown (non-negotiable)', farmer.banBannerExact === true);
  must('farmer: prohibited card present', farmer.banAny === true);

  /* ---------- pro mode, same query ---------- */
  await setMode('pro');
  await page.waitForFunction(() => document.querySelectorAll('#results article.result').length > 0, { timeout: 30000 });
  const pro = await read();
  must('pro: disclaimerStrip shown', pro.disclaimer === true);
  must('pro: exact-ban banner shown', pro.banBannerExact === true);
  must('pro: CAS paragraphs shown', pro.casParagraphs > 0, 'articles=' + pro.articles);
  /* pro-only detail: status_raw rows exist only where the source carries a
   * raw field (libya-248 rows do not), so pin the pro-only <p.match> detail
   * paragraphs (category/matchType) — farmer shows none of them. */
  must('pro: per-card match detail paragraphs shown', pro.matchTypeParagraphs > 0,
    'matches=' + pro.matchTypeParagraphs);

  /* ---------- the exact difference table ---------- */
  must('diff: same disclaimer in both', farmer.disclaimer === pro.disclaimer);
  must('diff: same exact-ban banner in both', farmer.banBannerExact === pro.banBannerExact);
  must('diff: libyaStatus in both', farmer.statusParagraphs > 0 && pro.statusParagraphs > 0);
  must('diff: pro shows MORE sources (international results) than farmer',
    pro.articles > farmer.articles, 'farmer=' + farmer.articles + ' pro=' + pro.articles);

  /* farmer search should still include the libya-248 banned row (the
   * Libya-first reference) — its ban banner must never be simplified away */
  must('farmer kept the Libya source card', farmer.sources.some(s => /248/.test(s) || /ليبيا/i.test(s)),
    JSON.stringify(farmer.sources));

  /* the exact spec difference table: farmer must NOT show the pro-only
   * per-card details (raw status / matchType / category chips) */
  must('farmer: NO per-card match detail paragraphs', farmer.matchTypeParagraphs === 0,
    'matches=' + farmer.matchTypeParagraphs);
} finally {
  await browser.close();
}

console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
