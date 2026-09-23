/*
 * tests/ui-browser.test.mjs — UI round (2026-09-21) measured-in-browser checks.
 * Real Chromium via puppeteer-core against a local static server.
 * Measures (not guesses):
 *   - text contrast >= 4.5 in both themes (sampled text elements)
 *   - no text rendered below 12px
 *   - interactive targets >= 44px
 *   - no horizontal scrolling at 320px viewport
 *   - developer photo fallback toggle: photo loads → fallback display:none;
 *     photo 404s → fallback visible (exactly one avatar circle either way).
 *     Guards the mustashar-v11 fix: author `display:flex` used to override
 *     the UA `[hidden] { display:none }` on #devPhotoFallback.
 * Chrome-109 feature usage is statically checked in verify.mjs (running the
 * real 109 binary is not possible here; recorded as "not measured" for the
 * manual user test).
 * Run: node tests/ui-browser.test.mjs   (expects CHROME + BASE_URL env or defaults)
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

function lum(rgb) {
  const [r, g, b] = rgb;
  const f = v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function parseColor(s) {
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null;
}
function effectiveBg(stack) {
  for (const c of stack) {
    const p = parseColor(c);
    if (p && p[3] > 0.9) return p;
  }
  return [255, 255, 255, 1]; /* worst case for light theme */
}
function contrast(a, b) {
  const l1 = lum(a), l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar']
});
const page = await browser.newPage();
page.on('pageerror', e => console.error('PAGE-ERROR:', e.message));

for (const theme of ['dark', 'light']) {
  await page.setViewport({ width: 360, height: 800 });
  await page.goto(BASE + '/index.html#/about', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(t => {
    localStorage.setItem('mustashar-theme', t);
    document.documentElement.dataset.theme = t;
  }, theme);
  await new Promise(r => setTimeout(r, 300));

  /* contrast of visible text nodes (sampled, skips clipped/hidden) */
  const bad = await page.evaluate(() => {
    function lum(rgb) {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    }
    function parseColor(s) {
      const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null;
    }
    function bgOf(el) {
      let node = el;
      while (node && node !== document.documentElement) {
        const p = parseColor(getComputedStyle(node).backgroundColor);
        if (p && p[3] > 0.9) return p;
        node = node.parentElement;
      }
      return [18, 30, 24, 1];
    }
    const out = [];
    const els = document.querySelectorAll('main h1, main h2, main h3, main p, main span, main b, main a, main label, main td, main th, main option, nav span');
    let seen = 0;
    for (const el of els) {
      if (seen > 220) break;
      const t = (el.textContent || '').trim();
      if (!t) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const fg = parseColor(cs.color);
      if (!fg) continue;
      const bg = bgOf(el);
      const c = contrast(fg, bg);
      seen++;
      if (c < 4.5) out.push({ text: t.slice(0, 24), c: Math.round(c * 100) / 100 });
    }
    function contrast(a, b) {
      const l1 = lum(a), l2 = lum(b);
      const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (hi + 0.05) / (lo + 0.05);
    }
    return out.slice(0, 12);
  }).catch(e => [{ text: 'eval-error: ' + e.message, c: 0 }]);
  check(`contrast >= 4.5 on sampled text (${theme})`, bad.length === 0,
    bad.map(x => `"${x.text}"=${x.c}`).join(' '));

  /* no text below 12px */
  const smallText = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('main *, nav *').forEach(el => {
      if (el.children.length) return;
      const t = (el.textContent || '').trim();
      if (!t) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const px = parseFloat(cs.fontSize);
      if (px < 12) out.push({ t: t.slice(0, 20), px });
    });
    return out.slice(0, 8);
  });
  check(`no text below 12px (${theme})`, smallText.length === 0,
    smallText.map(x => `"${x.t}"=${x.px}px`).join(' '));

  /* touch targets >= 44px for interactive elements */
  const smallTargets = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button, a[href], select, input[type="file"]').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const min = Math.min(r.width, r.height);
      if (min < 44) out.push({ tag: el.tagName + '.' + (el.className || ''), min: Math.round(min) });
    });
    return out.slice(0, 8);
  });
  check(`touch targets >= 44px (${theme})`, smallTargets.length === 0,
    smallTargets.map(x => `${x.tag}=${x.min}px`).join(' '));
}

/* no horizontal scroll at 320px, every view */
{
  await page.setViewport({ width: 320, height: 700 });
  const bad = [];
  for (const v of ['home', 'search', 'scan', 'history', 'data', 'about']) {
    await page.goto(BASE + '/index.html#/' + v, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 250));
    const over = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
      - document.documentElement.clientWidth);
    if (over > 0) bad.push(v + ' (+' + over + 'px)');
  }
  check('no horizontal scroll at 320px (all views)', bad.length === 0, bad.join(', '));
}

/* Developer photo / fallback toggle (about card).
 * The about card holds two avatar circles: <img id=devPhoto> and the icon
 * fallback <span id=devPhotoFallback>. app.js toggles `hidden` on them.
 * Exactly one circle must be visible in both states. */
{
  await page.setViewport({ width: 360, height: 800 });
  const state = () => page.evaluate(() => {
    const i = document.getElementById('devPhoto');
    const f = document.getElementById('devPhotoFallback');
    const circles = [i, f].filter(el => el && getComputedStyle(el).display !== 'none').length;
    return {
      nw: i ? i.naturalWidth : -1,
      iHidden: i ? i.hidden : null,
      iDisplay: i ? getComputedStyle(i).display : null,
      fHidden: f ? f.hidden : null,
      fDisplay: f ? getComputedStyle(f).display : null,
      circles
    };
  });

  /* (a) success: real assets/developer.jpg loads → photo circle only.
   * Wait for the true success end-state (fallback hidden), not the initial
   * markup state, to avoid measuring mid-load. */
  await page.goto(BASE + '/index.html#/about', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => {
    const f = document.getElementById('devPhotoFallback');
    const i = document.getElementById('devPhoto');
    return !!f && !!i && i.complete && i.naturalWidth > 0 && f.hidden;
  }, { timeout: 10000 }).catch(() => {});
  const ok = await state();
  check('photo loads → photo visible, fallback display:none',
    ok.nw > 0 && !ok.iHidden && ok.fHidden && ok.fDisplay === 'none', JSON.stringify(ok));
  check('exactly one avatar circle visible when photo loads', ok.circles === 1, JSON.stringify(ok));

  /* (b) failure: fake 404 → fallback circle only (the regression this guards).
   * Success end-state differs from failure by naturalWidth (photo >0, 404 =0). */
  await page.evaluate(() => { document.getElementById('devPhoto').src = '/__missing_404__/developer.jpg'; });
  await page.waitForFunction(() => {
    const i = document.getElementById('devPhoto');
    const f = document.getElementById('devPhotoFallback');
    return !!i && !!f && i.complete && i.naturalWidth === 0 && i.hidden && !f.hidden;
  }, { timeout: 10000 }).catch(() => {});
  const bad = await state();
  check('photo 404 → fallback visible, photo hidden',
    bad.nw === 0 && bad.iHidden && !bad.fHidden && bad.fDisplay !== 'none', JSON.stringify(bad));
  check('exactly one avatar circle visible when photo fails', bad.circles === 1, JSON.stringify(bad));
}

await browser.close();
console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
console.log('==============================');
process.exit(fail ? 1 : 0);
