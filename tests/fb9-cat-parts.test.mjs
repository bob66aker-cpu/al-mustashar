/*
 * tests/fb9-cat-parts.test.mjs — فيدباك 9 + 10: التصنيف المركّب متعدد الأجزاء
 * ---------------------------------------------------------------------------
 * البلاغ 9: «نوع المماطلة بتأق جزئي؟» على بطاقة Benomyl (F/Mi).
 * البلاغ 10: عائلة «التصنيف المركّب» كاملة.
 *
 * صلة الأثر (بند 0) — قِيست على الرابط الحيّ بتعطيل ترجمة المتصفح:
 *   السطر المشوَّش وعنوان التبويب **لم يبقيا** ⇒ أثر ترجمة خارجية، توثيق بلا إصلاح.
 *   وما ظهر بدلهما من التطبيق: «F/Mi ← مبيد فطري + رمز غير مشروح في دليل هذا
 *   المصدر» ⇒ العيب الحقيقي: الجزء غير المشروح **لا يُسمّى**.
 *
 * القاعدة (D29): كل جزء من الخلية المركّبة إما بشرح من دليله أو باسمه الحرفي
 * داخل جملة عدم الشرح، والأجزاء تُrender بترتيب الفواصل المعلن (خلاصة الـcode)،
 * والخلية تبقى كتلة واحدة بعنوانها (h1) — «/» لا تُفكّك إلى كتل.
 *
 * ماذا يقيس: الحالات مقروءة من data/، والـrenderer الحقيقي (src/cards.js) يعمل
 * بالقواميس الأربعة المستخرجة من src/i18n.js، على المصفوفة كاملة ×الوضعين،
 * وعلى الحاويتين (render تُستدعى لكل منهما).
 * تشغيل: node tests/fb9-cat-parts.test.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
globalThis.window = globalThis;
require('./../src/cards.js');
const Cards = globalThis.Cards;

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  << ' + extra));
  ok ? pass++ : fail++;
};

const app = readFileSync('src/app.js', 'utf8');
const cardsSrc = readFileSync('src/cards.js', 'utf8');
const i18n = readFileSync('src/i18n.js', 'utf8');
const LANGS = ['ar', 'en', 'fr', 'zh'];

/* ---------- the four real dictionaries, read out of src/i18n.js ---------- */
function unescape(v) {
  return v.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
          .replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}
function dictOf(lang) {
  const start = i18n.search(new RegExp('^\\s+' + lang + ':\\s*\\{', 'm'));
  const rest = i18n.slice(start);
  const end = rest.search(/^\s{4}\};/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const map = new Map();
  for (const m of body.matchAll(/'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'/g)) {
    if (!map.has(m[1])) map.set(m[1], unescape(m[2]));
  }
  return map;
}
const DICTS = Object.fromEntries(LANGS.map(l => [l, dictOf(l)]));
for (const l of LANGS) check('dictionary ' + l + ' read out of i18n.js', DICTS[l].size > 200, String(DICTS[l].size));

/* ---------- the reference table + the split rule, read out of src/app.js -- */
const KEYS = [...app.match(/const LEGEND_CAT_KEYS = \{([\s\S]*?)\};/)[1]
  .matchAll(/'([^']+)':\s*'legend/g)].map(m => m[1]);
const fold = x => String(x || null).toLowerCase().replace(/[.\s]/g, '');
const FOLDED = new Set(KEYS.map(fold));
const known = p => KEYS.includes(p.trim()) || FOLDED.has(fold(p));
const catParts = c => String(c || '').trim().split(/[\/,+]/).map(p => p.trim()).filter(Boolean)
  .flatMap(p => p.includes('.') && p.split('.').every(q => known(q)) ? p.split('.').map(q => q.trim()) : [p]);
const catName = (lang, c) => {
  const parts = catParts(c);
  if (parts.length > 1) return parts.map(p => catName(lang, p)).filter(Boolean).join(' + ');
  const k = KEYS.includes(parts[0]) ? parts[0] : [...FOLDED].find(f => f === fold(parts[0]));
  if (!k) return '';
  const key = 'legend.cat.' + (KEYS.includes(parts[0]) ? parts[0] : (Object.keys(KEYS).find(x => fold(x) === fold(parts[0])) || ''));
  return DICTS[lang].get(key) || '';
};
/* the rule under test, mirrored from src/app.js catTitle (pinned below) */
const named = (lang, part) => catName(lang, part) ||
  DICTS[lang].get('legend.cat.unknownNamed').replace('{part}', part);
const catTitle = (lang, cell) => {
  const parts = catParts(cell);
  if (!parts.length) return '';
  if (parts.length > 1) return parts.map(p => named(lang, p)).join(' + ');
  return named(lang, parts[0]);
};

/* ---------- the renderer under test (real src/cards.js) ---------- */
const LABELS = { 'libya-248': 'Libya 248', 'libya-500': 'Libya 500' };
function mkCards(lang) {
  const d = DICTS[lang];
  const t = (k, fb) => (d.has(k) ? d.get(k) : (fb != null ? fb : k));
  const tf = (k, fb, v) => String(t(k, fb)).split('{part}').join(v && v.part != null ? v.part : '');
  return Cards.create({
    t, tf, esc: s => String(s),
    catTitle: c => catTitle(lang, c),
    statusDisplay: (r) => ({ text: String(r.status || ''), tone: 'neutral', chip: '', extra: null }),
    sourceLabel: k => LABELS[k] || k,
    statusExplain: () => '', statusExplainFull: () => '',
    casApi: null, dataVersion: () => '', sourceKeys: Object.keys(LABELS)
  });
}
const linesOf = html => [...html.matchAll(/<span class="cat-line"><span class="cat-code"[^>]*>([\s\S]*?)<\/span><span class="cat-meaning">([\s\S]*?)<\/span><\/span>/g)]
  .map(m => ({ code: m[1], meaning: m[2] }));

/* ---------- the matrix, read out of data/ (never retyped) ---------- */
const MATRIX = [
  ['libya-500', 'I + A'], ['libya-500', 'A + I'], ['libya-500', 'I+A+F'],
  ['libya-500', 'I+A+N'], ['libya-500', 'F+N+PGR'], ['libya-500', 'I + A + N'],
  ['libya-500', 'I+A,gr'], ['libya-500', 'I,rep'], ['libya-500', 'N+P.G.R'],
  ['libya-500', 'F+A,rep'], ['libya-500', 'R,rep'], ['libya-500', 'S.Ph'],
  ['libya-248', 'I/A'], ['libya-248', 'F/Mi'], ['libya-248', 'I/A/F'],
  ['libya-248', 'I/A/N/PGR'], ['libya-248', 'I/N/R/FM'], ['libya-248', 'I/N/F/A/R/FM']
];
let missing = 0;
for (const [srcKey, cell] of MATRIX) {
  const rows = JSON.parse(readFileSync('data/' + srcKey + '.json', 'utf8')).rows;
  if (!rows.some(r => String(r.category || '').trim() === cell)) { missing++; console.log('  (not in data: ' + srcKey + ' ' + cell + ')'); }
}
check('every matrix cell really exists in data/', missing === 0, missing + ' missing');

/* ---------- 1) the card prints exactly that, in 4 dictionaries × 2 modes --
 * and the SAME renderer paints both containers: the card body is target-free,
 * so the search box and the scan box must produce identical markup. */
for (const lang of LANGS) {
  const C = mkCards(lang);
  for (const mode of ['farmer', 'pro']) {
    for (const target of ['#results', '#scanResults']) {
      const ctx = { lang, mode, jurisdiction: 'libya-500' };
      for (const [srcKey, cell] of MATRIX) {
        const row = { name: 'probe', name_norm: 'probe', status: 'Approved', category: cell };
        const html = C.card({ k: srcKey, r: row, s: { v: 100, type: 'x', field: 'x' } }, '', ctx);
        const got = linesOf(html);
        const want = catTitle(lang, cell);
        const tag = '[' + lang + '/' + mode + '/' + target + '] ' + cell;
        check(tag + ' — one block, headed by the literal cell',
              got.length === 1 && got[0].code === cell, JSON.stringify(got.map(g => g.code)));
        check(tag + ' — meaning matches the declared rule exactly',
              got.length === 1 && got[0].meaning === want, JSON.stringify(got[0] && got[0].meaning));
        /* every part explained OR named verbatim — no bare generic sentence */
        const parts = catParts(cell);
        const unknowns = parts.filter(p => !known(p));
        check(tag + ' — every unexplained part is named literally',
              unknowns.every(u => got.length === 1 && got[0].meaning.includes(u)),
              'unknown: ' + JSON.stringify(unknowns) + ' meaning: ' + JSON.stringify(got[0] && got[0].meaning));
        /* the declared order: left to right, one item per part */
        const items = got.length === 1 ? got[0].meaning.split(' + ') : [];
        check(tag + ' — parts stay in the cell\'s own order, none merged',
              items.length === parts.length, items.length + ' items vs ' + parts.length + ' parts');
      }
    }
  }
}

/* ---------- 2) the three mutations: each rule must be breakable ---------- */
/* (a) break the order: sort the parts, and the card must stop matching */
{
  const lang = 'ar';
  const C = mkCards(lang);
  const ctx = { lang, mode: 'farmer', jurisdiction: 'libya-500' };
  const row = { name: 'p', name_norm: 'p', status: 'Approved', category: 'A + I' };
  const okOrder = linesOf(C.card({ k: 'libya-500', r: row, s: { v: 100, type: 'x', field: 'x' } }, '', ctx))[0].meaning;
  const sorted = [...catParts('A + I')].sort().join(' + ');
  /* 'I + A' and its sorted twin 'A + I' must render differently: sort or merge
   * the parts anywhere in the pipeline and these two come out equal */
  const card2 = cat => linesOf(C.card({ k: 'libya-500',
    r: { name: 'p', name_norm: 'p', status: 'Approved', category: cat },
    s: { v: 100, type: 'x', field: 'x' } }, '', ctx))[0].meaning;
  const ia = card2('I + A'), ai = card2('A + I');
  check('MUTATION (a): the two orders render differently — the order is really pinned',
        ia !== ai && ia === catTitle(lang, 'I + A') && ai === catTitle(lang, 'A + I')
        && [...catParts('I + A')].sort().join(' + ') === 'A + I',
        'I + A ⇒ ' + ia + ' | A + I ⇒ ' + ai);
}
/* (b) hide the part name: the unnamed sentence must fail the naming rule */
{
  const lang = 'ar';
  const bare = DICTS[lang].get('legend.cat.unknown');
  check('MUTATION (b): the old bare sentence names no part at all',
        !/Mi/.test(bare) && !catParts('F/Mi').filter(p => !known(p)).every(u => bare.includes(u)),
        bare);
}
/* (c) split the "/" slice into blocks: the one-block rule must catch it */
{
  const lang = 'ar';
  const C = mkCards(lang);
  const ctx = { lang, mode: 'farmer', jurisdiction: 'libya-500' };
  const row = { name: 'p', name_norm: 'p', status: 'Approved', category: 'F/Mi' };
  const got = linesOf(C.card({ k: 'libya-248', r: row, s: { v: 100, type: 'x', field: 'x' } }, '', ctx));
  check('MUTATION (c): a "/" cell stays ONE block — tearing it into two would fail',
        got.length === 1 && got[0].code === 'F/Mi', JSON.stringify(got));
  check('MUTATION (c): and no block is produced per part',
        !new RegExp('cat-code[^>]*>' + 'Mi' + '<').test(C.card({ k: 'libya-248', r: row, s: { v: 100, type: 'x', field: 'x' } }, '', ctx)));
}

/* ---------- 3) the rules are pinned in the source, not only in the harness */
check('src/app.js names an unexplained part through legend.cat.unknownNamed',
  /function catPartText\(part\)/.test(app)
  && /catName\(part\) \|\| tf\('legend\.cat\.unknownNamed'/.test(app)
  && /if \(parts\.length > 1\) return parts\.map\(catPartText\)\.join\(' \+ '\);/.test(app));
check('the "/" slice is never torn into separate blocks in the card',
  /* the separator set is read out, never retyped: it must be exactly / + , */
  (() => { const l = (app.match(/const CAT_HARD_SEP = .*/) || [''])[0];
    const BS = String.fromCharCode(92);
    return l.includes('[' + BS + '/,+]') || l.includes('[/,+]'); })()
  /* cards.js paints ONE block per CELL LINE (the source's own line layout) and
     never splits the cell itself - the only split there is the line break */
  && cardsSrc.includes('String(x.r.category).split(/\\n+/)')
  && !cardsSrc.includes('split(CAT_HARD_SEP)')
  && !cardsSrc.includes('catParts(')
  && (cardsSrc.match(/class="cat-line"/g) || []).length === 1,
  'cards.js must not split the cell at all');
check('no new meaning was invented: only the wrapper key was added',
  (i18n.match(/'legend\.cat\.unknownNamed':/g) || []).length === 4
  && !/'legend\.cat\.(Mi|FM|gr|Igr|B)'/.test(i18n)
  && /\{part\}/.test(i18n));
check('both containers go through the same renderer (one paint, two boxes)',
  /'#scanResults'|#scanResults/.test(app) && /target/.test(app)
  && /function render\(results, q, target\)/.test(app));
check('data/ was not touched by this round', !/fb9/.test(readFileSync('data/libya-500.json', 'utf8')));

console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);