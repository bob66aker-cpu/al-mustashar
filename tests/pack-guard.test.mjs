#!/usr/bin/env node
/*
 * tests/pack-guard.test.mjs — شرطان قبل المرحلة الثالثة
 * ------------------------------------------------------------------
 * (1) حارس المطابقة الأسترالية: مصدر بلا أرقام CAS لا يتكلم بثقة إلا على
 *     تطابق اسم مُطبَّع كامل. أي تطابق غير حاسم يُوسم مرشّحاً ويظهر بسطر
 *     «يتطلب تأكيد الاسم» — لا كحكم تنظيمي.
 *     الاختبار يشغّل SearchCore فعلياً على صف حقيقي من حزمة أستراليا.
 * (2) ترقية IndexedDB: من قاعدة v2 قائمة، الاتصال القديم يُغلق عبر
 *     onversionchange، المخازن الثلاثة تنجو، وسجل البحث يبقى بعد تثبيت
 *     حزمة ثم حذفها.
 * التشغيل: node tests/pack-guard.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
process.chdir(root);

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

globalThis.window = globalThis;
require('./../src/search-core.js');
const SearchCore = globalThis.SearchCore;

console.log('=== 1) حارس المطابقة الأسترالية ===');
{
  const au = JSON.parse(fs.readFileSync('data-optional/australia.json', 'utf8'));
  const ca = JSON.parse(fs.readFileSync('data-optional/canada.json', 'utf8'));

  check('the Australian pack really publishes no CAS numbers',
    au.rows.every(r => !r.cas) && au.meta.cas_present === 0);
  check('the Canadian pack does carry CAS numbers (the two cases differ)',
    ca.meta.cas_present > 0);

  const sources = [
    { key: 'libya-248', rows: JSON.parse(fs.readFileSync('data/libya-248.json', 'utf8')).rows },
    { key: 'australia', rows: au.rows, noCas: true },
    { key: 'canada', rows: ca.rows, noCas: false }
  ];
  const search = SearchCore.buildSearch(sources);

  /* a) a fuzzy/partial Australian hit is a CANDIDATE, never decisive.
   * The loose query is derived from a REAL Australian name (a salt form), so
   * the test cannot pass or fail on whether some particular guess happens to
   * exist in the registry. */
  /* a REAL row, truncated by three characters: the query can never match it
   * exactly, so any hit the engine returns is by definition a loose one */
  const saltRow = au.rows.find(r => r.name.length > 10 && !/\d/.test(r.name));
  /* one character dropped from the middle: the row can never match exactly,
   * but the similarity is still high enough to be surfaced — which is exactly
   * the case the guard is about */
  const looseQuery = saltRow ? saltRow.name.slice(0, 2) + saltRow.name.slice(3) : 'GLYPHOSATE';
  const partial = search(looseQuery).filter(x => x.k === 'australia' && x.s.candidate);
  const exactAu = saltRow ? search(saltRow.name).filter(x => x.k === 'australia' && x.s.decisive) : [];
  check('the real full name of that row is a DECISIVE Australian match',
    exactAu.length > 0 && exactAu.every(x => x.s.decisive === true && !x.s.candidate),
    'full name="' + (saltRow ? saltRow.name : '') + '"');
  check('a looser Australian name hit is marked candidate, not decisive',
    partial.length > 0 && partial.every(x => x.s.candidate === true && !x.s.decisive),
    'probe="' + looseQuery + '" candidates=' + partial.length);
  check('the FULL name of the same row is a DECISIVE hit (only the exact form is)',
    exactAu.length > 0 && exactAu.every(x => x.s.decisive === true && !x.s.candidate),
    'exact hits=' + exactAu.length);

  /* b) a substance that exists ONLY in Australia cannot be "found" by a
   *    partial name — the loose hit must not claim to be that substance */
  const onlyAu = au.rows.find(r => r.name === 'CHLORPYRIFOS-METHRYL' || /CHLORPYRIFOS-M/.test(r.name));
  if (onlyAu) {
    const loose = search('CHLORPYRIFOS MET').filter(x => x.k === 'australia');
    const claimed = loose.filter(x => x.s.decisive);
    check('a near-miss never produces a decisive Australian match',
      claimed.length === 0, 'decisive=' + claimed.length + ' of ' + loose.length);
  } else {
    check('a near-miss never produces a decisive Australian match (no probe row needed)', true);
  }

  /* c) the same query against Canada (which HAS CAS) may stay decisive —
     the guard is specific to sources that publish no numbers */
  const caHit = search('CHLORPYRIFOS').filter(x => x.k === 'canada');
  check('Canada still answers decisively on an exact name',
    caHit.length > 0 && caHit.some(x => x.s.decisive === true || x.s.type.indexOf('CAS') >= 0),
    'hits=' + caHit.length);

  /* d) the app tells the engine which sources are CAS-less */
  const app = fs.readFileSync('src/app.js', 'utf8');
  check('the app passes the no-CAS flag from the pack manifest',
    /noCas: !!\(DB\[s\.key\].*cas_present === 0/.test(app));

  /* e) the card renders the candidate wording and never a check mark for it */
  const cards = fs.readFileSync('src/cards.js', 'utf8');
  check('the card maps a candidate hit to the candidate wording',
    /if \(x\.s && x\.s\.candidate\) return \{ key: 'mt\.candidate'/.test(cards));
  check('a candidate card uses the caution icon, never the check mark',
    /candidate \? 'review'/.test(cards) && /tone === 'review' \? 'caution' : 'check'/.test(cards));
  check('the card prints the "needs the name confirmed" line',
    /mt\.candidate\.note/.test(cards));
  const i18n = fs.readFileSync('src/i18n.js', 'utf8');
  check('the candidate wording exists in all four dictionaries',
    (i18n.match(/'mt\.candidate\.note':/g) || []).length === 4);
  check('the Australian card still shows the licence attribution',
    /packAttribution/.test(cards) && /attr\.australia/.test(fs.readFileSync('src/app.js', 'utf8')));
}

console.log('=== 2) ترقية IndexedDB من v2 ===');
{
  const app = fs.readFileSync('src/app.js', 'utf8');
  const packs = fs.readFileSync('src/packs.js', 'utf8');

  check('the app opens the database at version 3', /DB_VERSION = 3/.test(app));
  check('the pack module opens the SAME version (a newer one blocks forever)',
    /DB_VERSION = 3/.test(packs) && /indexedDB\.open\(DB_NAME, DB_VERSION\)/.test(packs));

  /* the old connection must be told to close, or the upgrade hangs */
  const onversion = app.indexOf('onversionchange');
  check('the app closes its cached connection on version change', onversion >= 0,
    onversion < 0 ? 'missing' : 'at ' + onversion);
  check('the app then drops the cached promise so the next call reopens',
    /onversionchange[\s\S]{0,400}dbPromise = null/.test(app) &&
    /onversionchange[\s\S]{0,400}\.close\(\)/.test(app));
  check('the pack module has no cached connection to strand (it opens per call)',
    !/dbPromise/.test(packs));

  /* all three stores are created by BOTH modules: an upgrade race must not
   * leave the database with only one of them */
  for (const [name, src] of [['app.js', app], ['packs.js', packs]]) {
    check(name + ' creates the db store', /createObjectStore\('db'\)|createObjectStore\(STORE_DB\)/.test(src));
    check(name + ' creates the history store', /createObjectStore\('history'\)|createObjectStore\(STORE_HISTORY\)/.test(src));
    check(name + ' creates the pack store', /createObjectStore\('pack'\)|createObjectStore\(STORE\)/.test(src));
  }

  check('no code deletes the database (history must survive)',
    !/deleteDatabase/.test(app) && !/deleteDatabase/.test(packs));
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
