/*
 * tests/fb11-d30b.test.mjs — D30-ب: الضابط الدائم للاسم العام المجمَّع
 * ---------------------------------------------------------------------------
 * قرار المالك: «EPA الرسمي (PRN 97-5 Appendix B) يربط الاسم العام بـPC Code
 * واحد 063503 وخانة CAS = «Numerous». لذلك الدمج 9→1 صحيح تنظيمياً فقط بعد
 * إثبات الصفوف» — والشرط أن تُثبَت الصفوف، وإلا تُعاد التسع.
 *
 * ما قِسناه في data/epa.json (قراءة فقط، لا مساس):
 *   «Aliphatic petroleum solvent» = 9 صفوف، pc_code = 063503 في التسعة،
 *   status = «مسموح» في التسعة ⇒ مبرَّر organizationally.
 *   مقابل ذلك: «copper ethanolamine complex» صفّان برمزين 024409/024410 ⇒
 *   المصدر لا يجمعهما، فيجب ألّا يجمعهما الدمج.
 *
 * القاعدة (D30-ب): اسم عام يجمّعه المصدر الرسمي تحت رمز تنظيمي واحد ⇒ بطاقة
 * مجموعة واحدة بأسطر CAS التابعة — ولا يُعمَّم على التشابه الاسمي وحده.
 *
 * تشغيل: node tests/fb11-d30b.test.mjs
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
const i18n = readFileSync('src/i18n.js', 'utf8');

/* ---------- the real function, lifted out of src/app.js ------------------ */
const start = app.indexOf('function collapseSameSource(rows) {');
check('src/app.js carries collapseSameSource', start > 0);
if (start < 0) { console.log('PASS: 1   FAIL: 1'); process.exit(1); }
function extract(src, from) {
  let i = src.indexOf('{', from), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (!depth) return src.slice(from, i + 1); }
  }
  return '';
}
const FNSRC = extract(app, start);
const build = src => new Function('console', '"use strict";\n' + src + '\nreturn collapseSameSource;')({ warn() {} });
const collapseSameSource = build(FNSRC);

/* ---------- the four real dictionaries, read out of src/i18n.js --------- */
function unescape(v) {
  return v.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
          .replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}
function dictOf(lang) {
  const s = i18n.search(new RegExp('^\\s+' + lang + ':\\s*\\{', 'm'));
  const rest = i18n.slice(s);
  const end = rest.search(/^\s{4}\};/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const map = new Map();
  for (const m of body.matchAll(/'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'/g)) {
    if (!map.has(m[1])) map.set(m[1], unescape(m[2]));
  }
  return map;
}
const LANGS = ['ar', 'en', 'fr', 'zh'];
const DICTS = Object.fromEntries(LANGS.map(l => [l, dictOf(l)]));
for (const l of LANGS) check('dictionary ' + l + ' read out of i18n.js', DICTS[l].size > 200, String(DICTS[l].size));

/* ---------- the data, read never retyped --------------------------------- */
const epa = JSON.parse(readFileSync('data/epa.json', 'utf8')).rows;
const NAME = 'aliphatic petroleum solvent';
const nine = epa.filter(r => String(r.name || '').trim().toLowerCase() === NAME);
check('the 9 rows really exist in data/epa.json', nine.length === 9, String(nine.length));
check('all nine carry the SAME regulatory code 063503',
      nine.length === 9 && new Set(nine.map(r => String(r.pc_code || '').trim())).size === 1
      && String(nine[0].pc_code || '').trim() === '063503',
      JSON.stringify([...new Set(nine.map(r => r.pc_code))]));
check('all nine carry the SAME status (no conflict, nothing is read away)',
      nine.length === 9 && new Set(nine.map(r => String(r.status || '').trim())).size === 1,
      JSON.stringify([...new Set(nine.map(r => r.status))]));
check('all nine carry DISTINCT CAS numbers',
      new Set(nine.map(r => String(r.cas || '').trim())).size === 9);
/* the counter-example measured in the same file */
const cu = epa.filter(r => String(r.name || '').trim().toLowerCase() === 'copper ethanolamine complex');
check('the counter-example exists too: one name, TWO codes',
      cu.length === 2 && new Set(cu.map(r => String(r.pc_code || '').trim())).size === 2,
      JSON.stringify(cu.map(r => [r.cas, r.pc_code])));

const card = (k, r, v, field, type) => ({ k, r, s: { v, field, type: type || 'اسم مطابق' } });
const fromData = list => list.map(r => card('epa', r, 100, NAME, 'name match')); // fromData-fix

/* ---------- 1) one code ⇒ one card, carrying every CAS ------------------- */
{
  const got = collapseSameSource(fromData(nine));
  check('the nine rows collapse to ONE card', got.length === 1, JSON.stringify(got.map(x => x.r.cas)));
  check('that card carries ALL NINE CAS numbers (identities are not hidden)',
        !!(got[0] && got[0].merged) && got[0].merged.cas.length === 9
        && nine.every(r => got[0].merged.cas.indexOf(String(r.cas).trim()) >= 0),
        JSON.stringify(got[0] && got[0].merged));
  check('it also carries the one code they share, read from the rows',
        !!(got[0] && got[0].merged) && got[0].merged.pc === '063503');
  check('the kept card is still one of the real rows (top score, declared order)',
        !!(got[0] && got[0].r) && nine.some(r => String(r.cas) === String(got[0].r.cas)));
}

/* ---------- 2) two codes ⇒ the rows stay (the D30-b red line) ------------ */
{
  const got = collapseSameSource(fromData(cu));
  check('one name + TWO regulatory codes is NOT collapsed', got.length === 2, JSON.stringify(got.map(x => x.r.cas)));
  check('nothing is merged when the code differs', got.every(x => !x.merged));
  /* rows that carry no code at all (the Libyan packs) are untouched by the
   * new condition — «لا pc_code» is one state, not two */
  const libya = [card('libya-500', { name: 'x', cas: '1-1-1', status: 'Approved', row: 1 }, 100),
                 card('libya-500', { name: 'x', cas: '2-2-2', status: 'Approved', row: 2 }, 100)];
  check('rows with no regulatory code still collapse as before',
        collapseSameSource(libya).length === 1
        && collapseSameSource(libya)[0].merged.cas.join(',') === '1-1-1,2-2-2');
}

/* ---------- 3) the card PRINTS them — 4 dicts × 2 modes × 2 containers --- */
{
  const kept = collapseSameSource(fromData(nine))[0];
  const LABELS = { epa: 'US EPA', 'epa-cancelled': 'US EPA (cancelled)', 'libya-500': 'Libya 500' };
  for (const lang of LANGS) {
    const d = DICTS[lang];
    const t = (k, fb) => (d.has(k) ? d.get(k) : (fb != null ? fb : k));
    const C = Cards.create({
      t, tf: (k, fb) => t(k, fb), esc: s => String(s),
      catTitle: () => '', statusExplain: () => '', statusExplainFull: () => '',
      statusDisplay: r => ({ text: String(r.status || ''), tone: 'neutral', chip: '', extra: null }),
      sourceLabel: k => LABELS[k] || k,
      casApi: { casOf: x => String((x.r && x.r.cas) || ''), casChecksum: () => true },
      dataVersion: () => '', sourceKeys: Object.keys(LABELS)
    });
    for (const mode of ['farmer', 'pro']) {
      for (const target of ['#results', '#scanResults']) {
        const html = C.card(kept, '', { lang, mode, jurisdiction: 'epa' });
        const tag = '[' + lang + '/' + mode + '/' + target + ']';
        const missing = nine.map(r => String(r.cas).trim()).filter(c => !html.includes(c));
        check(tag + ' the card prints every CAS number of the group',
              missing.length === 0, 'missing: ' + JSON.stringify(missing));
        check(tag + ' the card prints the regulatory code they share', html.includes('063503'));
        check(tag + ' the label is the dictionary one, not a hardcoded Arabic',
              html.includes(d.get('cas.group.badge') || 'X'));
      }
    }
  }
}

/* ---------- 4) MUTATIONS: the rule must be breakable --------------------- */
{
  /* (a) drop the code condition ⇒ the copper pair collapses (the FB5 mistake) */
  const CODE_COND = "const pcs = [...new Set(list.map(x => String((x.r || {}).pc_code || '').trim()).filter(Boolean))];\n      if (pcs.length > 1) { splitCodes++; out.push(...list); continue; }";
  const noCode = FNSRC.replace(CODE_COND, 'const pcs = [];'); // noCode-fix
  check('MUTATION (a): the code condition exists and removing it really changes the code',
        noCode !== FNSRC, 'nothing to remove');
  if (noCode !== FNSRC) {
    const mutant = build(noCode);
    check('MUTATION (a): without the code condition the two-code name WOULD collapse',
          mutant(fromData(cu)).length === 1 && collapseSameSource(fromData(cu)).length === 2);
  }
  /* (b) keep the collapse but throw the identities away */
  const PAYLOAD_LINE = "out.push(casList.length > 1\n        ? Object.assign({}, best, { merged: { cas: casList, pc: pcs[0] || '' } })\n        : best);";
  const noPayload = FNSRC.replace(PAYLOAD_LINE, 'out.push(best);'); // noPayload-fix
  if (noPayload !== FNSRC) {
    const mutant = build(noPayload);
    check('MUTATION (b): without the payload the CAS list disappears from the card',
          !!mutant(fromData(nine))[0] && !mutant(fromData(nine))[0].merged
          && !!collapseSameSource(fromData(nine))[0].merged); // payload-assert-fix
  }
  /* (c) hide the line in the card */
  const cardsSrc = readFileSync('src/cards.js', 'utf8');
  check('MUTATION (c): the card line is present in src/cards.js',
        /cas\.group\.badge/.test(cardsSrc) && /x\.merged/.test(cardsSrc));
  check('MUTATION (c): the line is NOT inside the pro-only casBlock (farmers see it too)',
        /function groupBlock\(x\)/.test(cardsSrc)
        && /out \+= groupBlock\(x\);/.test(cardsSrc)
        && cardsSrc.indexOf('groupBlock(x);') < cardsSrc.indexOf('if (!farmer)'));
  /* (d) the payload must be read from the ROWS, never hardcoded */
  const payloadSrc = FNSRC.slice(FNSRC.indexOf('const casList'), FNSRC.indexOf('const casList') + 320);
  check('MUTATION (d): the CAS list is read from the rows, not typed in',
        /String\(\(x\.r \|\| \{\}\)\.cas/.test(payloadSrc) && !/063503|8002-05-9/.test(payloadSrc));
}

console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);