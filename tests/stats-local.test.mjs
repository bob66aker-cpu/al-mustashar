/*
 * tests/stats-local.test.mjs — usage-measurement guard (2026-10-07, D55)
 * ----------------------------------------------------------------------
 * The local stats round may measure usage but must never send anything
 * anywhere: no network API in the module, no query text or identifier in
 * the stored schema, CSP-safe rendering in the view, instrumentation at
 * every counting point, 4-language parity for every stats string, and
 * version/cache consistency after the v57→v58 bump.
 * Run: node tests/stats-local.test.mjs
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
const read = p => readFileSync(join(root, p), 'utf8');

const stats = read('src/stats.js');
const app = read('src/app.js');
const html = read('index.html');
const i18n = read('src/i18n.js');
const sw = read('sw.js');
const version = read('version.json');
const pkg = read('package.json');

/* 1 — the module exists and registers the seam */
check('src/stats.js registers window.Stats with the full API',
  /window\.Stats\s*=/.test(stats)
  && ['count', 'setLang', 'snapshot', 'reset'].every(k => stats.includes(k + ':')));

/* 2 — NO network surface at all in the measurement module. Code, not comments:
 * a comment may NAME the API it avoids (that is how the file documents the
 * promise) — same convention as ppocr-size's codeOnly(). */
const codeOnly = src => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|\s)\/\/.*$/gm, '$1');
const statsCode = codeOnly(stats);
const NET = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource', 'importScripts'];
const netHits = NET.filter(n => statsCode.includes(n));
check('stats.js CODE contains no network API whatsoever (comments may name them)', netHits.length === 0, netHits.join(','));
check('stats.js code contains no absolute URL (http/https)', !/https?:\/\//.test(statsCode));
check('stats.js never touches the DOM (no innerHTML, no script injection)',
  !/innerHTML|outerHTML|document\.write|insertAdjacentHTML/.test(statsCode));

/* 3 — counters only: no text, no identifiers */
check('stats.js persists only the whitelisted counters (closed EVENTS list)',
  /var EVENTS = \['open', 'search', 'searchHit', 'searchMiss',/.test(stats)
  && /'modeFarmer', 'modePro', 'langSwitch'\];/.test(stats));
check('stats.js never reads a query/input value', !/\.value|getElementById|querySelector/.test(stats));
check('no persistent identifier beyond the day buckets',
  !/randomUUID|Math\.random|fingerprint|deviceId|userId/.test(stats));
check('day buckets are capped (30 days kept)', /var DAYS_KEPT = 30;/.test(stats));

/* 4 — every counting point exists in app.js */
const inst = [
  ['session open counted at boot', "Stats.count('open')"],
  ['boot records the UI language', "Stats.setLang(document.documentElement.lang || 'ar')"],
  ['every search counts', "Stats.count('search')"],
  ['search hit/miss split', "Stats.count(results.length ? 'searchHit' : 'searchMiss')"],
  ['mode switches count', "Stats.count(modeSel.value === 'pro' ? 'modePro' : 'modeFarmer')"],
  ['language switches count', "Stats.count('langSwitch')"],
  ['completed scans count', "Stats.count('scan')"],
  ['scan hit/miss split', "Stats.count(merged.length ? 'scanHit' : 'scanMiss')"],
  ['offline prep attempt counts', "Stats.count('prep')"],
  ['offline prep success counts', "Stats.count('prepOk')"],
  ['offline prep failure counts', "Stats.count('prepFail')"]
];
for (const [name, needle] of inst) check('app.js instrumentation: ' + name, app.includes(needle));
check('the query text itself is never counted or stored',
  !/Stats\.count\(q\)|Stats\.count\(String\(q/.test(app));

/* 5 — the view is wired into the router and rendered CSP-safely */
check('router knows the stats view', /'about', 'legend', 'stats'\]/.test(app));
check('applyView renders the stats view', app.includes("if (v === 'stats') renderStats();"));
const rsStart = app.indexOf('function renderStats()');
const rsEnd = app.indexOf('const statsResetBtn');
const rsBlock = rsStart > 0 && rsEnd > rsStart ? app.slice(rsStart, rsEnd) : '';
check('renderStats exists and uses textContent/DOM builders only',
  !!rsBlock && rsBlock.includes('textContent') && !/innerHTML/.test(rsBlock));
check('the reset control erases and re-renders', /Stats\.reset\(\)/.test(app));

/* 6 — index.html: the section, the entry link, the script order */
check('index.html has the stats section with its data-view',
  html.includes('id="view-stats"') && html.includes('data-view="stats"'));
check('the about view links to #/stats', html.includes('href="#/stats"'));
check('stats.js is loaded BEFORE app.js',
  html.indexOf('src/stats.js') > 0 && html.indexOf('src/stats.js') < html.indexOf('src/app.js'));
check('the section carries its controls', ['statsOpen', 'statsSearch', 'statsHitRate', 'statsMiss',
  'statsScan', 'statsPrep', 'statsModeFarmer', 'statsModePro', 'statBars', 'statLangs',
  'statsReset', 'statsResetNote'].every(id => html.includes('id="' + id + '"')));
const secAt = html.indexOf('id="view-stats"');
const sec = secAt > 0 ? html.slice(secAt, html.indexOf('</section>', secAt)) : '';
check('exactly one h1 in the stats section', (sec.match(/<h1[ >]/g) || []).length === 1);
check('headings inside the section are level 2 only (no skip after the h1)',
  (sec.match(/<h2[ >]/g) || []).length >= 1 && !/<h[3456][ >]/.test(sec));

/* 7 — i18n parity: every stats key exists in all four dictionaries */
const statsKeys = [...html.matchAll(/data-i18n="(stats\.[^"]+)"/g)].map(m => m[1]);
const dynKeys = ['stats.lang.ar', 'stats.lang.en', 'stats.lang.fr', 'stats.lang.zh'];
const allKeys = [...new Set([...statsKeys, ...dynKeys])];
const missing = allKeys.filter(k =>
  (i18n.match(new RegExp("'" + k.replace(/\./g, '\\.') + "':", 'g')) || []).length !== 4);
check('every stats string exists in all 4 dictionaries (' + allKeys.length + ' keys)',
  missing.length === 0, missing.join(','));
check('the dynamic renderer asks i18n for the language names',
  app.includes("t('stats.lang.' + code,"));

/* 8 — release consistency after the v57→v58 bump */
const cache = (sw.match(/const CACHE = '(mustashar-v\d+)'/) || [])[1];
check('sw cache is mustashar-v58', cache === 'mustashar-v58', String(cache));
check('version.json and package.json agree (1.19.22)',
  /"version": "1\.19\.22"/.test(version) && /"version": "1\.19\.22"/.test(pkg));
check('the default preparation payload is untouched — stats.js stays out of SHELL/DATA (ppocr-size contract)',
  !/stats\.js/.test(sw.slice(sw.indexOf('const SHELL'), sw.indexOf('const DATA'))));

console.log(`\nSTATS-LOCAL: PASS ${pass}  FAIL ${fail}`);
process.exit(fail ? 1 : 0);
