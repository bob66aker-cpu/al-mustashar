/*
 * tests/fb7-status-explain.test.mjs — فيدباك 7: شرح حالة الاعتماد على البطاقة
 * ---------------------------------------------------------------------------
 * البلاغ: «شرح حالة الاعتماد مفقود في بطاقة النتيجة (الوضعان) رغم وجوده في
 * «حول → شرح الرموز»».
 *
 * ما قيس حيّاً قبل الإصلاح (هذا الحارس يبني على القياس لا على الذاكرة):
 *   · شارة 500 تحمل قوسين: «… رمز REV (رمز غير مفسَّر) (REV)» — القوس الأول نص
 *     القاموس (st.500.rev) والقوس الثاني يضيفه app.js statusDisplay عمداً
 *     ليبقى الرمز الخام مرئياً ⇒ ليس نصاً مقصوصاً ولا قيمة بيانات ناقصة.
 *   ·Approved و REV و RAR و 248 كانت تحمل سطر الشرح فعلاً.
 *   · REV* — ثغرة الجولة: البطاقة كانت تعرض جملة الربط وحدها
 *     «نفس شرح REV، مع إضافة الجملة التالية بعدها كسطر منفصل:»
 *     ولا تعرض ولا جملة REV ولا ملاحظة النجمة التي يشير إليها الجملة نفسها —
 *     بينما «شرح الرموز» يعرض الثلاث. هذا هو «الشرح المفقود في البطاقة».
 *   · بطاقات EU / EPA / EPA-cancelled بلا سطر شرح، وسببه حصراً أن دليل كل
 *     واحد منها لا يعرّف شرحاً مفصلاً (القواميس تحمل عبارة الشارة نفسها
 *     فقط) ⇒ تبقى رمزاً بلا سطر (D25 — لا اختلاق).
 *
 * القاعدة الحاكمة: الشرح من دليل مصدره حصراً. ما لا يعرفه الدليل لا يُكتب.
 *
 * ماذا يقيس: يقرأ الحالات من data/ مباشرة، ثم يشغّل src/cards.js الحقيقي
 * بوهم صغير against القواميس الأربعة الحقيقية المستخرجة من src/i18n.js،
 * ويطلب ناتج HTML للبطاقة في الوضعين ⇒ الفحص على ناتج العرض لا على نص الكود.
 * تشغيل: node tests/fb7-status-explain.test.mjs
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
  if (start < 0) return new Map();
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
for (const l of LANGS) check('dictionary ' + l + ' was read out of i18n.js', DICTS[l].size > 200, String(DICTS[l].size));

/* ---------- the status table, read out of src/app.js so it cannot drift --- */
const LEGEND_STATUS_KEYS = Object.fromEntries(
  [...app.match(/const LEGEND_STATUS_KEYS = \{([\s\S]*?)\};/)[1]
    .matchAll(/'([^']+)':\s*'([^']+)'/g)].map(m => [m[1], m[2]]));

/* ---------- the resolver under test, with the REAL dictionaries ---------- */
function mkT(lang) {
  const d = DICTS[lang];
  return (k, fb) => (d.has(k) ? d.get(k) : (fb != null ? fb : k));
}
/* mirrors app.js statusExplain / statusExplainLines / statusExplainFull —
   the shape itself is pinned by the source checks below */
function mkResolver(lang) {
  const t = mkT(lang);
  const statusExplain = st => {
    const k = LEGEND_STATUS_KEYS[String(st || '').trim()];
    return k ? t(k, '') : '';
  };
  const lines = code => {
    const c = String(code || '').trim();
    const body = statusExplain(c);
    if (!body) return [];
    if (c === 'REV*') return [body, statusExplain('REV'), t('st.500.revstar.note', '')].filter(Boolean);
    return [body];
  };
  return { statusExplain, statusExplainFull: c => lines(c).join(' '), lines };
}

const LABELS = { 'libya-248': 'Libya 248', 'libya-500': 'Libya 500', eu: 'EU', epa: 'EPA', 'epa-cancelled': 'EPA cancelled' };
function mkCards(lang) {
  const R = mkResolver(lang);
  const t = mkT(lang);
  return { Cards: Cards.create({
    t, tf: (k, fb, v) => t(k, fb), esc: s => String(s),
    catTitle: () => '', sourceLabel: k => LABELS[k] || k,
    statusDisplay: (r, k) => ({ text: String(r.status || ''), tone: 'neutral', chip: '', extra: null }),
    statusExplain: R.statusExplain, statusExplainFull: R.statusExplainFull,
    dataVersion: () => '', sourceKeys: Object.keys(LABELS)
  }), R, t };
}

/* card() takes (x, query, ctx) — the query is irrelevant here */
const card = (C, x, ctx) => C.card(x, '', ctx);
function explainLinesOf(html) {
  return [...html.matchAll(/<p class="st-explain-full[^"]*">([\s\S]*?)<\/p>/g)].map(m => m[1]);
}

/* ---------- 1) the measured set of statuses, straight out of data/ ------- */
const sources = ['libya-500', 'libya-248', 'eu', 'epa', 'epa-cancelled'];
const statusesOf = {};
for (const s of sources) {
  const rows = JSON.parse(readFileSync('data/' + s + '.json', 'utf8')).rows;
  const set = new Map();
  for (const r of rows) {
    const st = String(r.status == null ? '' : r.status).trim();
    if (!set.has(st)) set.set(st, r);
  }
  statusesOf[s] = [...set.entries()];
  check('data/' + s + '.json carries measurable statuses', statusesOf[s].length > 0);
}

/* ---------- 2) every code its own guide defines IS explained (D25) -------- */
/* the guide that defines a code is the one whose rows carry it:
 * libya-500 → LEGEND_STATUS_KEYS · libya-248 → card.status.banned.248 */
check('every status in data/libya-500.json has an explanation key in LEGEND_STATUS_KEYS',
      statusesOf['libya-500'].every(([st]) => !!LEGEND_STATUS_KEYS[st]),
      JSON.stringify(statusesOf['libya-500'].map(([st]) => st)));
check('the 500 status table is exactly the four codes the data carries',
      Object.keys(LEGEND_STATUS_KEYS).length === statusesOf['libya-500'].length
      && statusesOf['libya-500'].every(([st]) => !!LEGEND_STATUS_KEYS[st]));
check('libya-248 has exactly one status and it has its own dictionary entry',
      statusesOf['libya-248'].length === 1
      && LANGS.every(l => DICTS[l].has('card.status.banned.248')));

/* ---------- 3) the card carries it: 4 dictionaries × 2 modes ------------- */
for (const lang of LANGS) {
  const { Cards: C, R, t } = mkCards(lang);
  for (const mode of ['farmer', 'pro']) {
    const ctx = { lang, mode, jurisdiction: 'libya-500' };
    for (const [st, row] of statusesOf['libya-500']) {
      const html = card(C, { k: 'libya-500', r: row, s: { v: 100, type: 'CAS مطابق تمامًا', field: 'x' } }, ctx);
      const lines = explainLinesOf(html);
      check('[' + lang + '/' + mode + '] 500 card explains ' + JSON.stringify(st),
            lines.length === 1 && lines[0] === R.statusExplainFull(st),
            'got ' + JSON.stringify(lines));
      /* verbatim: the card text is built ONLY from this dictionary entry and,
         for REV*, from the guide's own additional lines — nothing else */
      const guideText = R.lines(st).join(' ');
      check('[' + lang + '/' + mode + '] the explanation shown is the dictionary text verbatim',
            lines.length === 1 && lines[0] === guideText && lines[0].length > 20
            && lines[0].startsWith(t(LEGEND_STATUS_KEYS[st], '')),
            'card: ' + JSON.stringify(lines[0]) + ' / dictionary: ' + JSON.stringify(guideText));
    }
    const [st248, row248] = statusesOf['libya-248'][0];
    const html248 = card(C, { k: 'libya-248', r: row248, s: { v: 100, type: 'CAS مطابق تمامًا', field: 'x' } }, ctx);
    check('[' + lang + '/' + mode + '] 248 card explains its own status',
          explainLinesOf(html248).join('') === t('card.status.banned.248', ''),
          JSON.stringify(explainLinesOf(html248)));

    /* the three foreign sources: no guide defines an explanation, so no line
       in the farmer view — the rule, not an oversight (asserted below) */
    for (const s of ['eu', 'epa', 'epa-cancelled']) {
      for (const [st, row] of statusesOf[s]) {
        const html = card(C, { k: s, r: row, s: { v: 100, type: 'CAS مطابق تمامًا', field: 'x' } },
                            { lang, mode: 'farmer', jurisdiction: s });
        check('[' + lang + '/farmer] ' + s + ' status ' + JSON.stringify(st) + ' stays a bare code',
              explainLinesOf(html).length === 0, JSON.stringify(explainLinesOf(html)));
      }
    }
  }
}

/* the pro-mode fallback may only ever print the row's own source text */
for (const lang of LANGS) {
  const { Cards: C } = mkCards(lang);
  for (const s of ['eu', 'epa', 'epa-cancelled']) {
    for (const [st, row] of statusesOf[s]) {
      if (!String(row.status_raw || '').trim()) continue;
      const html = card(C, { k: s, r: row, s: { v: 100, type: 'CAS مطابق تمامًا', field: 'x' } },
                          { lang, mode: 'pro', jurisdiction: s });
      const lines = explainLinesOf(html);
      check('[' + lang + '/pro] ' + s + ' prints only the row\'s own source text',
            lines.length === 0 || lines[0] === String(row.status_raw).trim(),
            JSON.stringify(lines));
    }
  }
}

/* ---------- 4) REV*: the whole explanation, not the pointer to it -------- */
for (const lang of LANGS) {
  const { Cards: C, R } = mkCards(lang);
  const revstar = statusesOf['libya-500'].find(([st]) => st === 'REV*');
  check('data/ really carries REV* rows to test', !!revstar);
  if (!revstar) continue;
  for (const mode of ['farmer', 'pro']) {
    const html = card(C, { k: 'libya-500', r: revstar[1], s: { v: 100, type: 'CAS مطابق تمامًا', field: 'x' } },
                        { lang, mode, jurisdiction: 'libya-500' });
    const text = explainLinesOf(html).join(' ');
    const want = R.lines('REV*');
    check('[' + lang + '/' + mode + '] REV* card carries all ' + want.length + ' lines the guide gives it',
          want.length === 3 && want.every(l => text.includes(l)), JSON.stringify(want));
    check('[' + lang + '/' + mode + '] REV* card carries REV\'s own sentence too',
          text.includes(R.statusExplain('REV')) && R.statusExplain('REV').length > 20);
    check('[' + lang + '/' + mode + '] REV* card carries the asterisk note it points at',
          text.includes(DICTS[lang].get('st.500.revstar.note')));
  }
  check('st.500.revstar.note is defined in all four dictionaries',
        LANGS.every(l => DICTS[l].has('st.500.revstar.note')));
}

/* ---------- 5) the rule is pinned in the source, not only in the harness -- */
check('app.js builds the explanation lines once, for the card AND the legend',
      /function statusExplainLines\(code\)/.test(app)
      && /if \(c === 'REV\*'\) \{\s*return \[body, statusExplain\('REV'\), t\('st\.500\.revstar\.note', ''\)\]/.test(app)
      && /function statusExplainFull\(code\)/.test(app));
check('legendCard renders those same lines (one text, one place)',
      /const lines = statusExplainLines\(code\);/.test(app)
      && /lines\.map\(function \(line, i\)/.test(app)
      && !/esc\(statusExplain\('REV'\)\)/.test(app),
      'the popover must not assemble its own text any more');
check('the card resolver is the full one, bound by name',
      /statusExplain: statusExplain, statusExplainFull: statusExplainFull,/.test(app)
      && /var statusExplainFull = deps\.statusExplainFull \|\| statusExplain;/.test(cardsSrc)
      && /if \(x\.k === 'libya-500'\) explain = statusExplainFull\(x\.r\.status\) \|\| '';/.test(cardsSrc));
check('the card has exactly two source-bound explanation branches, and no third',
      (cardsSrc.match(/explain = /g) || []).length === 4 /* var + two branches + the pro fallback */
      && /else if \(x\.k === 'libya-248'\) explain = t\('card\.status\.banned\.248'/.test(cardsSrc)
      && !/explain = '[^']+'/.test(cardsSrc),
      'an authored explanation string would appear here');

/* ---------- 6) D25 — the foreign sources really are undefined -------------
 * If a future round adds a real explanation for EU/EPA, this test FAILS and
 * forces a decision — it can never be quietly added or quietly claimed. */
for (const s of ['eu', 'epa', 'epa-cancelled']) {
  const invented = [...i18n.matchAll(/'(st\.(?:eu|epa)[^']*\.explain)'\s*:/g)].map(m => m[1]);
  check('no invented explanation key exists for the foreign sources (' + s + ')',
        invented.length === 0, JSON.stringify(invented));
}
check('no foreign source is given a decree-500 explanation on its card',
      !/st\.500\.[a-z]+\.explain/.test(cardsSrc),
      'the Aclonifen regression must stay impossible');
check('libya-500 prose is never shown on a foreign card, and vice versa',
      /if \(x\.k === 'libya-500'\)/.test(cardsSrc) && /else if \(x\.k === 'libya-248'\)/.test(cardsSrc));

/* ---------- 7) every key the card reads exists in all four dictionaries ---- */
const used = new Set([...Object.values(LEGEND_STATUS_KEYS), 'card.status.banned.248', 'st.500.revstar.note']);
for (const key of used) {
  const n = LANGS.filter(l => DICTS[l].has(key)).length;
  check(key + ' is defined in all four dictionaries', n === 4, 'found ' + n);
}

console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);