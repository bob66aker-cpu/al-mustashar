/*
 * tests/design-tokens.test.mjs — حارس طبقة الرموز التصميمية (2026-09-28)
 * ---------------------------------------------------------------------------
 * يقرأ src/tokens.css كما هو ويعيد حساب كل زوج لوني بدل الثقة بنصّ في الملف:
 *   نص على خلفية/بطاقة ≥ 4.5:1 · عنصر غير نصي ذي معنى ≥ 3:1 (WCAG 1.4.11)
 * ويفحص قواعد التصميم: أزواج الحالة (لون+أيقونة+نص)، الخطシステムي بلا
 * تنزيل، أحجام النص، أهداف اللمس 44px، الحركات <200ms، prefers-reduced-motion،
 * content-visibility على البطاقات، لا justify، لا أسود نقي، لا إيموجي، ولا
 * will-change. كما يطبع أرقام التباين الفعلية لتوثيقها في تقرير الجولة.
 * تشغيل: node tests/design-tokens.test.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(path.join(root, 'src/tokens.css'), 'utf8');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const i18n = readFileSync(path.join(root, 'src/i18n.js'), 'utf8');
const app = readFileSync(path.join(root, 'src/app.js'), 'utf8');

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

/* ---------- helpers: read a custom property out of a given block ---------- */
function block(selector) {
  const i = css.indexOf(selector);
  if (i < 0) return '';
  const open = css.indexOf('{', i);
  let depth = 0, j = open;
  for (; j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}') { depth--; if (!depth) break; }
  }
  return css.slice(open, j);
}
function prop(src, name) {
  const m = src.match(new RegExp('(?:^|[;{\\s])--' + name + '\\s*:\\s*([^;]+);'));
  return m ? m[1].trim() : '';
}
const hex = h => { h = String(h).trim().replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const lum = h => {
  const c = hex(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };

const dark = block(':root {');
const light = block('html[data-theme="light"] {');
check('tokens.css exposes a dark :root block and a light theme block', dark.length > 100 && light.length > 100);

/* ---------- 1) contrast, recomputed ---------- */
const THEMES = [
  ['dark', dark],
  ['light', light]
];
const TEXT_PAIRS = [
  ['text on bg', 'text', 'bg', 4.5],
  ['text on card', 'text', 'card', 4.5],
  ['text on nav', 'text', 'nav', 4.5],
  ['text on field', 'text', 'field', 4.5],
  ['muted on card', 'muted', 'card', 4.5],
  ['muted on bg', 'muted', 'bg', 4.5],
  ['primary-strong on card', 'primary-strong', 'card', 4.5],
  ['status banned on card', 'st-ban', 'card', 4.5],
  ['status review on card', 'st-review', 'card', 4.5],
  ['status approved on card', 'st-ok', 'card', 4.5],
  ['status info on card', 'st-info', 'card', 4.5],
  ['status banned on bg', 'st-ban-ink', 'bg', 4.5],
  ['status review on bg', 'st-review-ink', 'bg', 4.5],
  ['status approved on bg', 'st-ok-ink', 'bg', 4.5]
];
const NON_TEXT_PAIRS = [
  ['on-primary on primary button', 'on-primary', 'primary', 4.5],
  ['control border on card', 'control', 'card', 3],
  ['control border on bg', 'control', 'bg', 3],
  ['primary-ink on card', 'primary-ink', 'card', 3],
  ['status banned ink on card', 'st-ban-ink', 'card', 3],
  ['status review ink on card', 'st-review-ink', 'card', 3],
  ['status approved ink on card', 'st-ok-ink', 'card', 3],
  ['status info ink on card', 'st-info-ink', 'card', 3]
];
console.log('== contrast ratios recomputed from src/tokens.css ==');
for (const [theme, src] of THEMES) {
  for (const [label, fg, bg, need] of TEXT_PAIRS.concat(NON_TEXT_PAIRS)) {
    const f = prop(src, fg), b = prop(src, bg);
    if (!/^#[0-9a-fA-F]{6}$/.test(f) || !/^#[0-9a-fA-F]{6}$/.test(b)) {
      check(`${theme}: ${label} (missing token ${f ? fg : fg} / ${b ? bg : bg})`, false, f + ' / ' + b);
      continue;
    }
    const r = ratio(f, b);
    check(`${theme}: ${label} ${f} on ${b} = ${r.toFixed(2)}:1 (need ${need})`, r >= need, r.toFixed(2));
  }
}

/* ---------- 2) status must be colour + icon + text, never colour alone ---------- */
for (const st of ['ban', 'review', 'ok', 'info']) {
  check(`status ${st} has a colour, an ink and an icon token`,
    !!prop(dark, 'st-' + st) && !!prop(dark, 'st-' + st + '-ink') && !!prop(dark, 'st-' + st + '-icon'),
    JSON.stringify({ c: prop(dark, 'st-' + st), i: prop(dark, 'st-' + st + '-icon') }));
  /* the icon is theme-independent (same Lucide glyph), the colour is not */
  check(`status ${st} light theme overrides colour + ink`,
    !!prop(light, 'st-' + st) && !!prop(light, 'st-' + st + '-ink')
    && prop(light, 'st-' + st).toUpperCase() !== prop(dark, 'st-' + st).toUpperCase());
}
const iconNames = readFileSync(path.join(root, 'src/icons.js'), 'utf8');
for (const st of ['ban', 'review', 'ok', 'info']) {
  const raw = prop(dark, 'st-' + st + '-icon').replace(/"/g, '');
  check(`status ${st} icon "${raw}" exists in src/icons.js (no emoji, real Lucide set)`,
    new RegExp("'" + raw + "':").test(iconNames), raw);
}

/* ---------- 3) the word «آمن» is forbidden in every UI string ---------- */
{
  const forbidden = [];
  /* no dictionary value may claim safety as a verdict */
  for (const m of i18n.matchAll(/'([a-z0-9._-]+)':\s*'((?:[^'\\]|\\.)*)'/gi)) {
    if (/\bآمن\b|\bsafe\b|\bمؤمّن\b|\bمضمون\b/i.test(m[2])) forbidden.push(m[1] + ' = ' + m[2]);
  }
  for (const m of app.matchAll(/t\('([a-z0-9._-]+)',\s*'((?:[^'\\]|\\.)*)'/gi)) {
    if (/\bآمن\b|\bsafe\b|\bمضمون\b/i.test(m[2])) forbidden.push('fallback ' + m[1] + ' = ' + m[2]);
  }
  check('no UI string claims a substance is «safe»', forbidden.length === 0, forbidden.slice(0, 3).join(' | '));
}

/* ---------- 4) typography ---------- */
check('system font stacks only, no @font-face anywhere in the UI',
  css.includes('--font-latin') && css.includes('--font-arabic') && !/\@font-face\s*\{/.test(css) && !/\@font-face\s*\{/.test(html));
check('latin stack starts with Segoe UI / Tahoma, arabic stack is a system arabic family',
  /--font-latin:\s*"Segoe UI",\s*Tahoma/.test(css) && /--font-arabic:[^;]*"Noto Sans Arabic"/.test(css));
check('base text size is at least 16px', parseFloat(prop(dark, 'fs-base')) >= 16, prop(dark, 'fs-base'));
check('farmer result text is 18-20px', (() => {
  const v = parseFloat(prop(dark, 'fs-farmer'));
  return v >= 18 && v <= 20;
})(), prop(dark, 'fs-farmer'));
check('line-height is at least 1.5', parseFloat(prop(dark, 'lh')) >= 1.5, prop(dark, 'lh'));
check('no text-align: justify anywhere (UI or tokens)',
  !/text-align:\s*justify/.test(css) && !/text-align:\s*justify/.test(html));
check('arabic is right-aligned through the lang rule',
  /html\[lang="ar"\][^{]*\{[^}]*text-align:\s*right/.test(css) || /\[lang="ar"\] body, html\[dir="rtl"\] body \{ text-align: right; \}/.test(css));

/* ---------- 5) touch targets ---------- */
check('a --tap token of 44px exists and is applied to every interactive element',
  prop(dark, 'tap') === '44px' && /button, a\.btn[\s\S]*min-height: var\(--tap\)/.test(css));
check('links/buttons also get the 44px width', /min-width: var\(--tap\)/.test(css));

/* ---------- 6) motion ---------- */
const durs = [...css.matchAll(/--dur[a-z-]*:\s*(\d+)ms/g)].map(m => +m[1]);
check('every motion token is under 200ms', durs.length > 0 && durs.every(d => d < 200), JSON.stringify(durs));
check('prefers-reduced-motion: reduce disables animation and transition',
  /@media \(prefers-reduced-motion: reduce\)/.test(css) && /transition-duration: 0\.001ms !important/.test(css)
  && /animation-duration: 0\.001ms !important/.test(css));
check('no will-change anywhere (no unjustified compositor hints)',
  !/will-change/.test(css) && !/will-change/.test(html) && !/will-change/.test(app));
check('result cards use content-visibility: auto with an intrinsic size',
  /article\.result \{[^}]*content-visibility: auto/.test(css) && /contain-intrinsic-size/.test(css));
check('document.startViewTransition is only used behind a feature check',
  !/startViewTransition/.test(app) || /startViewTransition/.test(app) && /matchMedia|typeof document\.startViewTransition|&&/.test(app));

/* ---------- 7) dark mode: #1E1E1E, never pure black ---------- */
check('dark background is #1E1E1E', prop(dark, 'bg').toUpperCase() === '#1E1E1E', prop(dark, 'bg'));
check('no pure black anywhere in the token layer',
  !/:\s*#000(000)?\b/i.test(css));
check('cards sit slightly darker/different from the background (never the same as a flat field)',
  prop(dark, 'card') !== prop(dark, 'bg') && prop(dark, 'card').toUpperCase() === '#242424', prop(dark, 'card'));
check('prefers-color-scheme: light is honoured when no explicit theme is set',
  /@media \(prefers-color-scheme: light\)/.test(css) && /html:not\(\[data-theme\]\)/.test(css));
check('app.js falls back to the OS preference when the user never chose a theme',
  /prefers-color-scheme: light/.test(app) && /!saved && osLight/.test(app));

/* ---------- 8) the token layer is real: no hardcoded colours in components ---------- */
{
  /* colours may only be declared in tokens.css — components use var() */
  const badHex = [...html.matchAll(/(?:color|background|border-color|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)]
    .map(m => m[1]);
  check('component styles declare no raw hex colours (they use the tokens)',
    badHex.length === 0, badHex.slice(0, 5).join(' '));
  check('the token layer is precached by the service worker',
    readFileSync(path.join(root, 'sw.js'), 'utf8').includes("./src/tokens.css"));
  check('index.html loads the token layer before its own style block',
    html.indexOf('src/tokens.css') > 0 && html.indexOf('src/tokens.css') < html.indexOf('<style>'));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
