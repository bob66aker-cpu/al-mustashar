/*
 * tests/ui-components.test.mjs — حارس مكوّنات العرض المشتركة (2026-09-28)
 * ---------------------------------------------------------------------------
 * يفحص src/cards.js كوحدة ويشغّلها بوهم صغير (قاموس إنجليزي وهمي) ليقرأ
 * ناتجها فعليًا بدل فحص نص الكود:
 *   (أ) بطاقة المزارع.Don't: لا نسبة مئوية في أي بطاقة، الحالة ثلاثية
 *       (لون + أيقونة + نص)، وشرح الرمز كاملًا داخل البطاقة.
 *   (ب) المحترف: نوع مطابقة صريح + CAS (مصحح + خام مشطوب) + نسخة البيانات.
 *   (ج) المزارع الإنجليزي: بطاقة اختيار «jurisdiction» قبل البحث، والنتائج من
 *       الجهة المختارة وحدها، مع تنبيه بارز.
 *   (د) المحترف الإنجليزي: الجهة المختارة أولًا ثم الباقي + سطر «الولاية
 *       القانونية تختلف بين المصادر».
 *   + توحيد فلترة المسح مع البحث (لا فرق بينهما في وضع المزارع).
 * تشغيل: node tests/ui-components.test.mjs
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
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const app = readFileSync('src/app.js', 'utf8');
const cardsSrc = readFileSync('src/cards.js', 'utf8');
const i18n = readFileSync('src/i18n.js', 'utf8');

/* ---------- the component under test, with tiny stubs ---------- */
const LABELS = { 'libya-248': 'Libya 248', 'libya-500': 'Libya 500', eu: 'EU', epa: 'EPA', 'epa-cancelled': 'EPA cancelled' };
const cards = Cards.create({
  t: (k, fb) => k + '|' + (fb || ''),
  tf: (k, fb, v) => k + '|' + (fb || '').replace(/\{(\w+)\}/g, (m, n) => (v && v[n]) || ''),
  esc: s => String(s),
  catTitle: c => ({ I: 'Insecticide', F: 'Fungicide', A: 'Acaricide' }[c] || (c === 'I/A' ? 'Insecticide + Acaricide' : '')),
  statusDisplay: (r, k) => k === 'libya-248'
    ? { text: 'BANNED', tone: 'banned', chip: '', extra: null }
    : { text: r.status || '', tone: 'neutral', chip: '', extra: null },
  sourceLabel: k => LABELS[k] || k,
  statusExplain: st => (st === 'Approved' ? 'temporarily allowed for one year' : ''),
  casApi: {
    casOf: x => String((x.r && x.r.cas) || '').split(/[\n[\]]/)[0].trim(),
    casChecksum: () => true,
    casDisplayCorrected: r => r.cas_corrected || '',
    casDisplayRaw: r => r.cas_raw || r.cas || '',
    casSourceKey: r => r.cas_source || '',
    casStereo: r => r.cas_stereo || '',
    casSuggested: () => [],
    casReview: () => '',
    casNote: () => '',
    casDuplicateNote: () => '',
    casFlag: () => ''
  },
  dataVersion: k => (k === 'epa' ? '2026-09-23' : ''),
  sourceKeys: ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled']
});

const CAPTAN = { k: 'libya-500', r: { name: 'Captan', name_norm: 'captan', cas: '133-06-2', cas_raw: '133-06-02', cas_corrected: '133-06-2', cas_source: 'epa-master', category: 'F', status: 'Approved' }, s: { v: 100, type: 'CAS مطابق تمامًا', field: '133-06-2' } };
const BANNED = { k: 'libya-248', r: { name: 'DDT', name_norm: 'ddt', cas: '50-29-3', category: 'I', status: 'محظور' }, s: { v: 100, type: 'اسم مطابق', field: 'DDT' } };
const EUR = { k: 'eu', r: { name: 'Captan', name_norm: 'captan', cas: '133-06-2', category: 'F', status: 'Approved', status_raw: 'Approved' }, s: { v: 100, type: 'CAS مطابق تمامًا', field: '133-06-2' } };
const EPAR = { k: 'epa', r: { name: 'Captan', name_norm: 'captan', cas: '133-06-2', category: 'F', status: 'مسموح', status_raw: 'له تسجيل نشط' }, s: { v: 100, type: 'CAS مطابق تمامًا', field: '133-06-2' } };
const ALL = [CAPTAN, BANNED, EUR, EPAR];

/* shared-CAS index (data-driven, read-only) */
cards.buildCasIndex({
  'libya-248': { rows: [{ name: 'DDT', name_norm: 'ddt', cas: '50-29-3' }] },
  'libya-500': { rows: [{ name: 'Captan', name_norm: 'captan', cas: '133-06-2' }] },
  eu: { rows: [{ name: 'Captan', name_norm: 'captan', cas: '133-06-2' }] },
  epa: { rows: [{ name: 'Captan', name_norm: 'captan', cas: '133-06-2' }, { name: 'Captan isomer mix', name_norm: 'captan isomer mix', cas: '133-06-2' }] }
});

/* ---------- (أ) farmer Arabic ---------- */
{
  const ctx = { lang: 'ar', mode: 'farmer', jurisdiction: 'libya-500' };
  const html = cards.card(CAPTAN, 'Captan', ctx);
  check('farmer card has no percentage anywhere', !/\d+%/.test(html), (html.match(/\d+%/g) || []).join(','));
  check('farmer card shows the status code AND its full meaning inside the card',
    /Approved/.test(html) && /temporarily allowed for one year/.test(html));
  check('farmer card status is a triple (colour class + icon + text)',
    /class="status tone-neutral"/.test(html) && /data-icon="check"/.test(html));
  check('farmer card shows the category on its own line with the full meaning',
    /cat-line/.test(html) && /Fungicide/.test(html) && /cat-meaning/.test(html));
  check('farmer card hides the CAS line (professional only)', !/CAS:/.test(html));
  check('farmer card shows the cautious reminder', /results.caution/.test(html));
}

/* ---------- (ب) professional Arabic ---------- */
{
  const ctx = { lang: 'ar', mode: 'pro', jurisdiction: 'libya-500' };
  const html = cards.card(CAPTAN, 'Captan', ctx);
  check('pro card shows corrected + struck raw + source', /133-06-2/.test(html) && /cas-raw-old">133-06-02/.test(html) && /epa-master/.test(html));
  check('pro card shows an explicit match type, not a score', /mt\.cas-name/.test(html) && !/\d+%/.test(html));
  check('pro card shows the data version line when the source has one', !/prov-line/.test(html));
  check('pro card of an EPA row shows its data version', /prov-line/.test(cards.card(EPAR, 'Captan', ctx)) && /2026-09-23/.test(cards.card(EPAR, 'Captan', ctx)));
  check('pro card keeps the 248 ban explanation', /banned\.248/.test(cards.card(BANNED, 'DDT', ctx)));
}

/* ---------- (ج) English farmer ---------- */
{
  const ctx = { lang: 'en', mode: 'farmer', jurisdiction: 'eu' };
  const picker = cards.jurisdictionPicker(ctx);
  check('the picker is titled as a jurisdiction, never as a database',
    /jur\.title/.test(picker) && !/database|قاعدة بيانات/i.test(picker));
  check('the picker lists all five sources as buttons', (picker.match(/data-jur="/g) || []).length === 5);
  check('the picker warns that a foreign result is not a Libyan judgement', /jur\.note/.test(picker));
  const only = cards.applyContext(ALL, ctx);
  check('English farmer gets the CHOSEN source only', only.length === 1 && only[0].k === 'eu', JSON.stringify(only.map(x => x.k)));
  const html = cards.card(EUR, 'Captan', ctx);
  check('English farmer card carries the jurisdiction caveat line', /jurisdiction\.caveat/.test(html));
  check('English farmer card shows a prominent alert', /farmer-alert/.test(html) && /alert\.listed/.test(html));
  check('a prohibited row gets the RED treatment with the ban icon',
    /farmer-alert is-banned/.test(cards.card(BANNED, 'DDT', { lang: 'en', mode: 'farmer', jurisdiction: 'libya-248' })));
}

/* ---------- (د) English professional ---------- */
{
  const ctx = { lang: 'en', mode: 'pro', jurisdiction: 'eu' };
  const list = cards.applyContext(ALL, ctx);
  check('English pro: the chosen source comes FIRST, the rest follow', list[0].k === 'eu' && list.length === 4,
    JSON.stringify(list.map(x => x.k)));
  const html = cards.card(list.filter(x => x.k === 'epa')[0] || list[1], 'Captan', ctx);
  check('English pro card carries source + status meaning + version + match type + CAS',
    /class="source"/.test(html) && /mt\./.test(html) && /cas.label/.test(html) && /caveat-jur/.test(html)
    && /prov-line/.test(html) && /2026-09-23/.test(html), html.slice(0, 200));
  check('English pro card has no percentage', !/\d+%/.test(html));
}

/* ---------- farmer filtering is identical for search and scan ---------- */
{
  const ctx = { lang: 'ar', mode: 'farmer', jurisdiction: 'libya-500' };
  const list = cards.applyContext(ALL, ctx);
  check('farmer mode keeps Libyan sources only, for every view', list.every(x => cards.LIBYA.indexOf(x.k) !== -1)
    && list.length === 2, JSON.stringify(list.map(x => x.k)));
  /* THE RULE, not one spelling of it. The old assertion here read the
   * literal `cards.applyContext(results, ctx)`, so FB5 (896e14c) broke it by
   * inserting collapseToDecisive() in front of the filter - a documented owner
   * decision (night-round-2026-10-01.md stage 3), verified by its own guard
   * tests/decisive-display-gate.test.mjs. The BEHAVIOUR never changed: one
   * filter, no per-target branch. So the check now pins the rule itself:
   * exactly one filter call inside render(), no target-conditional filter, and
   * both containers routed through that same render(). Pinning a spelling
   * would have broken again on the next harmless refactor; pinning the rule
   * is what actually guards search and scan staying identical. */
  const renderBody = app.slice(app.indexOf('function render(results, q, target)'),
                              app.indexOf('function renderHistory('));
  check('render() applies the context filter EXACTLY ONCE, so #results and #scanResults cannot diverge',
    (renderBody.match(/cards\.applyContext\(/g) || []).length === 1,
    (renderBody.match(/cards\.applyContext\(/g) || []).length + ' call sites');
  check('that one filter is not conditional on the render target',
    !/applyContext\([^)]*target/.test(renderBody)
    && !/isScanView[\s\S]{0,400}shownResults = \(showDetails \|\| isScanView\)/.test(app));
  check('both containers are rendered by that same render()',
    /render\([^)]*'#scanResults'\)/.test(app) && /function render\(results, q, target\)/.test(app));
  check('app.js routes BOTH #results and #scanResults through the same context filter',
    /cards\.applyContext\(displayResults, ctx\)/.test(renderBody)
    && renderBody.indexOf('collapseToDecisive(') < renderBody.indexOf('cards.applyContext('));  check('the exact-ban banner is computed from the UNFILTERED list (narrowing can never hide a ban)',
    /const prohibited = results\.filter\(x => x\.k === 'libya-248'\)/.test(app));
}

/* ---------- shared-CAS honesty ---------- */
{
  const ctx = { lang: 'ar', mode: 'pro', jurisdiction: 'epa' };
  const shared = cards.matchKind(EPAR, 'something else');
  check('a number carried by two substances is flagged as shared', shared.shared === true, JSON.stringify(shared));
  const html = cards.card(EPAR, 'something else', ctx);
  check('the shared-number note is shown on the card', /mt\.shared\.note/.test(html));
}

/* ---------- one structure, not four copies ---------- */
check('app.js has no duplicated result-card markup (it delegates to cards.js)',
  /cards\.card\(x, q, ctx\)/.test(app) && !/scorebar/.test(app));
check('cards.js exposes one card builder plus a context filter',
  /function card\(x, q, ctx\)/.test(cardsSrc) && /function applyContext/.test(cardsSrc));
check('the component module is loaded before app.js and precached by the SW',
  readFileSync('index.html', 'utf8').indexOf('src/cards.js') > 0
  && /src\/cards\.js/.test(readFileSync('sw.js', 'utf8')));
for (const k of ['mt.cas-name', 'mt.name', 'mt.shared', 'mt.partial', 'jur.title', 'card.jurisdiction.caveat', 'alert.banned', 'card.dataVersion']) {
  const n = (i18n.match(new RegExp("'" + k.replace(/\./g, '\\.') + "':", 'g')) || []).length;
  check(`i18n ${k} exists in all 4 dictionaries`, n === 4, 'found=' + n);
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
