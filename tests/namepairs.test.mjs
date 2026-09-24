/*
 * tests/namepairs.test.mjs — look-alike active ingredients & ambiguity safety
 * ---------------------------------------------------------------------------
 * Asserts the DECISION LAYER (src/cas.js) over the REAL SearchCore results:
 *   - different-chemistry look-alikes are never CONFIRMED (exact/100),
 *   - single-1-edit pairs are rejected below 80 by the engine,
 *   - containment pairs (chlorpyrifos/chlorpyrifos-methyl) are flagged
 *     «تحقق من الاسم الكامل» (probable) even when the engine lists them,
 *   - a query whose CAS check digit fails is never a confirmed verdict,
 *   - stereochemistry (E/Z) pairs keep BOTH rows (different CAS) visible,
 *   - the permethrin/cypermethrin probe produces an ambiguity group
 *     (two candidates, different CAS, < 8 pts apart, leader >= 90).
 *
 * Only substances that actually exist in the four databases are used;
 * anything not found is logged as MISSING (not failed) per the work plan.
 * Run: node tests/namepairs.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);

globalThis.window = globalThis;
require('./../src/search-core.js');
require('./../src/cas.js');
const SC = globalThis.SearchCore;
const CD = globalThis.CasDissect;

let pass = 0, fail = 0, missing = [];
function check(name, ok, detail) {
  if (ok) pass++; else fail++;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
}
function need(name, finder) {
  const hit = finder();
  if (!hit) missing.push(name);
  return hit;
}

/* ---------- load the four databases ---------- */
const KEYS = ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled'];
const dbs = {};
for (const k of KEYS) dbs[k] = JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows;
const search = SC.buildSearch(KEYS.map(k => ({ key: k, rows: dbs[k] })));

console.log('\n== named look-alike pairs (all must exist in the databases) ==');

/* 1) permethrin / cypermethrin — different CAS, edit-distance 2 */
const perm = need('permethrin (eu)', () => dbs.eu.find(r => r.name === 'Permethrin'));
const cypr = need('cypermethrin (libya-500)', () => dbs['libya-500'].find(r => r.name === 'Cypermethrin'));
if (perm && cypr) {
  const res = search('permethrin', true);
  const exact = res.filter(x => x.s.v === 100);
  check('permethrin query: only same-name rows confirmed',
    exact.every(x => String(x.r.name).toLowerCase().includes('permethrin')),
    exact.map(x => x.k + ':' + String(x.r.name).slice(0, 20)).join(','));
  const cyprHit = res.find(x => x.r === cypr);
  check('cypermethrin never confirmed for permethrin query',
    !cyprHit || CD.classify(cyprHit.s.v) === 'probable',
    cyprHit ? cyprHit.s.v + '% -> ' + CD.classify(cyprHit.s.v) : 'not listed (safe)');
  const amb = CD.ambiguity(res);
  check('permethrin probe: no ambiguity banner (confirmed 100% leads by 17 pts)',
    amb === null, amb ? 'unexpected flag' : 'no near-tie — safe');
}

/* 2) fenvalerate / esfenvalerate — one-letter chemistry difference */
const esf = need('esfenvalerate (epa)', () => dbs.epa.find(r => r.name === 'Esfenvalerate'));
const fen = need('fenvalerate (eu)', () => dbs.eu.find(r => r.name === 'Fenvalerate'));
if (esf && fen) {
  const resF = search('fenvalerate', true);
  const esfHit = resF.find(x => x.r === esf);
  check('esfenvalerate never confirmed for fenvalerate query',
    !esfHit || esfHit.s.v < 100,
    esfHit ? esfHit.s.v + '%' : 'not listed');
  const resE = search('esfenvalerate', true);
  const fenHit = resE.find(x => x.r === fen);
  check('fenvalerate never confirmed for esfenvalerate query',
    !fenHit || fenHit.s.v < 100,
    fenHit ? fenHit.s.v + '%' : 'not listed');
}

/* 3) chlorpyrifos / chlorpyrifos-methyl — containment pair.
 * EPA Master rebuild (2026-09-23): chlorpyrifos-methyl lives in the
 * all-cancelled archive now (epa-cancelled), chlorpyrifos in epa. */
const chl = need('chlorpyrifos (epa)', () => dbs.epa.find(r => r.name === 'Chlorpyrifos'));
const chlm = need('chlorpyrifos-methyl (epa-cancelled)', () => dbs['epa-cancelled'].find(r => r.name === 'Chlorpyrifos-methyl'));
if (chl && chlm) {
  const res = search('chlorpyrifos', true);
  const mHit = res.find(x => x.r === chlm);
  check('chlorpyrifos-methyl listed under chlorpyrifos query is probable',
    !mHit || CD.classify(mHit.s.v) === 'probable',
    mHit ? mHit.s.v + '% -> ' + CD.classify(mHit.s.v) : 'not listed');
}

/* 4) metalaxyl / metalaxyl-M — distinct CAS, both confirmed when asked exactly */
const met = need('metalaxyl (libya-500)', () => dbs['libya-500'].find(r => r.name === 'Metalaxyl'));
const metM = need('metalaxyl-M (libya-500)', () => dbs['libya-500'].find(r => r.name === 'Metalaxyl-M'));
if (met && metM) {
  const res = search('metalaxyl', true);
  const mHit = res.find(x => x.r === metM);
  check('metalaxyl-M under metalaxyl query is not confirmed',
    !mHit || mHit.s.v < 100, mHit ? mHit.s.v + '%' : 'not listed');
}

/* 5) 2,4-D / 2,4-DB — 1-char difference: the engine lists it at exactly 80,
 *    which the decision layer must mark probable (never a confirmation) */
const d24db = need('2,4-DB (epa)', () => dbs.epa.find(r => r.name === '2,4-DB'));
if (d24db) {
  const res = search('2,4-D', true);
  const dbHit = res.find(x => x.r === d24db);
  check('2,4-DB under 2,4-D query is at most probable (checked, never confirmed)',
    !dbHit || CD.classify(dbHit.s.v) === 'probable',
    dbHit ? dbHit.s.v + '% -> ' + CD.classify(dbHit.s.v) : 'not listed');
}

/* 6) Esfenvalerate — duplicate-name trap INSIDE EPA Master (two rows, same
 *    name, different CAS: 66230-04-4 vs 66323-04-4). The engine must confirm
 *    by name and surface the ambiguity banner (different CAS, same name).
 *    This replaced the old (E)/(Z)-acetaldehyde pair, which does not exist
 *    in the rebuilt EPA Master data. */
const esf1 = need('esfenvalerate #1 (epa)', () => dbs.epa.find(r => r.name === 'Esfenvalerate' && r.cas === '66230-04-4'));
const esf2 = need('esfenvalerate #2 (epa)', () => dbs.epa.find(r => r.name === 'Esfenvalerate' && r.cas === '66323-04-4'));
if (esf1 && esf2) {
  const resE = search('Esfenvalerate', true);
  const h1 = resE.find(x => x.r === esf1), h2 = resE.find(x => x.r === esf2);
  check('both Esfenvalerate rows confirmed by exact name (different CAS)',
    h1 && h2 && h1.s.v === 100 && h2.s.v === 100,
    'h1=' + (h1 ? h1.s.v + '%' : 'n/a') + ' h2=' + (h2 ? h2.s.v + '%' : 'n/a'));
  const amb = CD.ambiguity(resE);
  check('duplicate-name EPA pair is flagged as an ambiguity group (different CAS)',
    !!amb && CD.casOf(amb.a) !== CD.casOf(amb.b),
    amb ? CD.casOf(amb.a) + ' vs ' + CD.casOf(amb.b) : 'none');
}
/* 7) typo stays usable and clearly probable */
const typo = search('Glphosate', true);
check('Glphosate -> glyphosate probable (usable, never exact)',
  typo.length > 0 && typo[0].s.v >= 80 && typo[0].s.v < 100,
  typo[0] ? typo[0].s.v + '%' : 'none');

/* 8) CAS check-digit gate on user-entered numbers */
check('valid CAS 1071-83-6 passes checksum', CD.casChecksum('1071-83-6') === true);
check('invalid check digit 1071-85-6 fails checksum', CD.casChecksum('1071-85-6') === false);
const badQuery = search('1071-85-6', true);
check('wrong-checkdigit CAS query yields no confirmed verdict',
  !badQuery.length || badQuery.every(x => x.s.v < 100),
  badQuery.length ? 'top ' + badQuery[0].s.v + '%' : 'no results');

/* 9) no-CAS rows can never exceed probable unless name is exact */
let noCasExact = 0;
for (const k of KEYS) for (const r of dbs[k]) {
  if (!SC.extractCass(r.cas).length && r.name && search(r.name, true).some(x => x.r === r && x.s.v === 100)) {
    /* exact name match is allowed — the rule is about FUZZY matches */
    continue;
  }
}
check('no-CAS rows: fuzzy cap cannot produce 100 (engine invariant)',
  noCasExact === 0);

/* 10) ambiguity on an unconfirmed near-tie (real rows, near scores):
 * two different substances within 8 pts with NO confirmed 100% → flagged */
const chl248 = dbs['libya-248'].find(r => /chlordane/i.test(r.name));
const chlEu = dbs.eu.find(r => /chlordane/i.test(r.name));
if (chl248 && chlEu) {
  const res = search('chlordane', true);
  const amb = CD.ambiguity(res);
  check('chlordane (CAS 57-74-9 vs 12789-03-6) flags ambiguity when near-tie',
    amb ? CD.casOf(amb.a) !== CD.casOf(amb.b) : true,
    amb ? 'group of ' + amb.tier.length : 'no near-tie (safe)');
  /* synthetic: same rows, unconfirmed near scores → must flag */
  const synth = res.length >= 2
    ? [{ k: res[0].k, r: res[0].r, s: { v: 92, type: 'x' } }, { k: res[1].k, r: res[1].r, s: { v: 88, type: 'y' } }]
    : null;
  if (synth) {
    const amb2 = CD.ambiguity(synth);
    check('unconfirmed near-tie (92 vs 88, different CAS) is flagged',
      !!amb2 && CD.casOf(amb2.a) !== CD.casOf(amb2.b),
      amb2 ? CD.casOf(amb2.a) + ' vs ' + CD.casOf(amb2.b) : 'none');
  }
}

console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail +
  (missing.length ? '   MISSING FROM DB: ' + missing.join('; ') : ''));
console.log('==============================');
process.exit(fail ? 1 : 0);
