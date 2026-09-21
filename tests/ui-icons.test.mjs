/*
 * tests/ui-icons.test.mjs — UI round (2026-09-21) icon discipline guard.
 * Rule: one meaning = one icon, one icon = one meaning.
 *  - MEANINGS maps meanings to DISTINCT Lucide names (no duplicates
 *    in either direction).
 *  - Every data-icon="..." reference in index.html uses a known meaning.
 *  - No emoji anywhere in index.html, src/app.js, src/i18n.js, src/icons.js.
 * Run: node tests/ui-icons.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

global.window = global;
global.document = { readyState: 'loading', addEventListener() {}, querySelectorAll() { return []; } };
eval(readFileSync(join(root, 'src/icons.js'), 'utf8'));
const ICONS = window.UIIcons;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const appSrc = readFileSync(join(root, 'src/app.js'), 'utf8');
const i18nSrc = readFileSync(join(root, 'src/i18n.js'), 'utf8');
const iconsSrc = readFileSync(join(root, 'src/icons.js'), 'utf8');

/* 1. unique mapping both directions */
{
  const meanings = Object.keys(ICONS.MEANINGS);
  const names = meanings.map(m => ICONS.MEANINGS[m]);
  check('icon meanings are unique (no meaning with two icons)',
    new Set(meanings).size === meanings.length, String(meanings.length));
  check('icon names are unique (no icon with two meanings)',
    new Set(names).size === names.length, names.join(','));
}

/* 2. every data-icon reference resolves to a known meaning */
{
  const refs = [...html.matchAll(/data-icon="([^"]+)"/g)].map(m => m[1])
    .concat([...appSrc.matchAll(/(?:setAttribute\('data-icon',\s*'?([a-z-]+)'|\['data-icon',\s*'?([a-z-]+)')/g)]
      .map(m => m[1] || m[2]).filter(Boolean));
  const unknown = [...new Set(refs)].filter(r => !(r in ICONS.MEANINGS));
  check('all data-icon references are known meanings (' + new Set(refs).size + ' used)',
    unknown.length === 0, unknown.join(','));
}

/* 3. every referenced icon name exists in the path table */
{
  const missing = Object.values(ICONS.MEANINGS).filter(n => !ICONS.svg(n));
  check('every mapped icon has SVG markup', missing.length === 0, missing.join(','));
}

/* 4. no emoji in displayed files */
{
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
  const offenders = [
    ['index.html', html], ['src/app.js', appSrc], ['src/i18n.js', i18nSrc], ['src/icons.js', iconsSrc]
  ].filter(([f, s]) => emojiRe.test(s)).map(([f]) => f);
  check('no emoji in index.html / app.js / i18n.js / icons.js', offenders.length === 0, offenders.join(','));
}

/* 5. reserved meaning not rendered in the UI */
{
  check('reserved international icon is not used in UI markup',
    !html.includes('data-icon="international"'));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
console.log('==============================');
process.exit(fail ? 1 : 0);
