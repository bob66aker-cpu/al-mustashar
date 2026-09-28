/*
 * tests/cas-correction.test.mjs — documented CAS-correction layer (2026-09-27)
 * ---------------------------------------------------------------------------
 * Round 2 (also approved, 2026-09-27) adds two more repairs with their own
 * documented source key, the binary checksum proof (raw fails / fixed passes)
 * for every named pair, and searches by the two new corrected numbers.
 * Contract (user-approved round): libya-500 broken decree numbers are stored
 * with a provenance triple (cas_raw / cas_corrected / cas_source); the main
 * `cas` field carries the CORRECTED value so search matches real numbers;
 * the display layer (src/cas.js + app.js) always exposes the raw decree value
 * with a struck-through marker and a machine-translated source label.
 * NOTHING is corrected silently and no other file/field is touched.
 * Run: node tests/cas-correction.test.mjs
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

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

const d5 = JSON.parse(fs.readFileSync('data/libya-500.json', 'utf8'));
const d2 = JSON.parse(fs.readFileSync('data/libya-248.json', 'utf8'));
const app = fs.readFileSync('src/app.js', 'utf8');
/* the CAS block is rendered by src/cards.js since the shared-component
   round — guard the pair so the rule cannot be dropped by a move */
const render = app + '\n' + fs.readFileSync('src/cards.js', 'utf8');
const i18n = fs.readFileSync('src/i18n.js', 'utf8');

/* ---------- 1) the eight documented repairs, stored correctly ---------- */
const EXPECTED = [
  { name: 'Capric acid (CAS 334-48-5)', raw: '334485', fixed: '334-48-5' },
  { name: 'Captan', raw: '133-06-02', fixed: '133-06-2' },
  { name: 'Carvone', raw: '244-16-8', fixed: '2244-16-8' },
  { name: 'Cycloxydim', raw: '101 205-02-1', fixed: '101205-02-1' },
  { name: 'Mesotrione', raw: '104206-8', fixed: '104206-82-8' },
  { name: 'Metalaxyl-M', raw: '70630-17-0 (R)', fixed: '70630-17-0' },
  /* round 2 — same pattern, own documented source keys (the `cas` value was
   * already corrected on 2026-09-20; the triple itself was simply missing) */
  { name: 'Mandipropamid', raw: '374726-22-2', fixed: '374726-62-2', src: 'epa-master' },
  { name: 'Prosulfocarb', raw: '52888-90-9', fixed: '52888-80-9', src: 'eu+pubchem' },
];
check('libya-500 row count intact (411)', d5.rows.length === 411, String(d5.rows.length));
check('meta.count matches rows', d5.meta.count === d5.rows.length);
for (const e of EXPECTED) {
  const r = d5.rows.find(x => x.name === e.name);
  check(`${e.name}: triple + corrected main field`,
    r && r.cas === e.fixed && r.cas_raw === e.raw
    && r.cas_corrected === e.fixed && r.cas_source === (e.src || 'epa-master'),
    r ? JSON.stringify({ cas: r.cas, raw: r.cas_raw, src: r.cas_source }) : 'row missing');
}
check('all eight corrected values pass casChecksum',
  EXPECTED.every(e => CD.casChecksum(e.fixed) === true));
check('raw decree values are preserved verbatim (never lost)',
  EXPECTED.every(e => (d5.rows.find(x => x.name === e.name) || {}).cas_raw === e.raw));

/* ---------- 2) every other numeric row keeps verbatim + provenance ---------- */
const numeric = d5.rows.filter(r => /[0-9]/.test(String(r.cas || '')));
check('all numeric rows carry cas_source provenance',
  numeric.every(r => typeof r.cas_source === 'string' && r.cas_source.length > 0),
  String(numeric.filter(r => !r.cas_source).length) + ' missing');
check('uncorrected rows: cas_displayRaw == stored value, no corrected flag',
  numeric.filter(r => !String(r.cas_corrected || '').trim())
    .every(r => CD.casDisplayRaw(r) === String(r.cas).trim()
      && CD.casDisplayCorrected(r) === ''));
/* documented source keys only — a correction carrying an unknown key is a bug */
const DOC_SOURCES = ['epa-master', 'eu+pubchem'];
check('no row invents a correction without a documented source key',
  numeric.every(r => (String(r.cas_corrected || '').trim() ? DOC_SOURCES.includes(r.cas_source) : true)));

/* the two round-2 values are corroborated INSIDE the repo, not by us */
{
  const epa = JSON.parse(fs.readFileSync('data/epa.json', 'utf8'));
  const eu = JSON.parse(fs.readFileSync('data/eu.json', 'utf8'));
  const mp = epa.rows.find(r => r.name === 'Mandipropamide Technical');
  check('Mandipropamid corrected value exists in EPA Master (PC 036602)',
    mp && mp.cas === '374726-62-2' && mp.pc_code === '036602', mp ? mp.cas : 'missing');
  const euPro = eu.rows.find(r => r.name === 'Prosulfocarb');
  check('Prosulfocarb corrected value exists in the EU file',
    euPro && euPro.cas === '52888-80-9', euPro ? euPro.cas : 'missing');
}

/* Carvone is THE documented special case: decree dropped a digit; EU db has
 * the same defect — the correction comes from EPA Master, not from EU. */
const eu = JSON.parse(fs.readFileSync('data/eu.json', 'utf8'));
const euCarv = eu.rows.find(r => r.name === 'Carvone');
check('Carvone correction is independent of the (equally broken) EU row',
  euCarv && euCarv.cas === '244-16-8' && CD.casChecksum(euCarv.cas) === false,
  euCarv ? euCarv.cas : 'missing');

/* ---------- 3) display layer honesty ---------- */
const cap = d5.rows.find(x => x.name === 'Captan');
check('casDisplayCorrected exposes the fixed value',
  CD.casDisplayCorrected(cap) === '133-06-2');
check('casDisplayRaw exposes the decree value (the display honesty contract)',
  CD.casDisplayRaw(cap) === '133-06-02');
check('casSourceKey resolves to the epa-master machine key',
  CD.casSourceKey(cap) === 'epa-master');

/* ---------- 3b) (هـ3) binary checksum proof, computed live ----------
 * For every pair named by the owner: the raw decree value FAILS the check
 * digit and the corrected value PASSES it. No hardcoded verdict. */
const WELL_SHAPE = /^[0-9]{2,7}-[0-9]{2}-[0-9]$/;
for (const [raw, fixed] of [['133-06-02', '133-06-2'], ['244-16-8', '2244-16-8'],
  ['104206-8', '104206-82-8']]) {
  check(`check-digit pair ${raw} (fails) → ${fixed} (passes)`,
    CD.casChecksum(raw) === false && CD.casChecksum(fixed) === true,
    `raw=${CD.casChecksum(raw)} fixed=${CD.casChecksum(fixed)}`);
}
/* HONEST EXCEPTION, measured not assumed: 334485 does NOT fail the check
 * digit (33448·5+3344·4… sums to 55 → 55%10 === 5). Its defect is the SHAPE —
 * it is not a well-formed CAS because the hyphens are missing, which is why
 * the audit lists it under MALF, not under FAIL. The repair restores the
 * shape and the value keeps passing the digit. */
check('334485 is not a well-formed CAS (shape, not digit) while 334-48-5 is',
  WELL_SHAPE.test('334485') === false && WELL_SHAPE.test('334-48-5') === true
  && CD.casChecksum('334-48-5') === true && CD.casChecksum('334485') === true,
  'shape raw=' + WELL_SHAPE.test('334485') + ' digit raw=' + CD.casChecksum('334485'));
for (const [raw, fixed] of [['374726-22-2', '374726-62-2'], ['52888-90-9', '52888-80-9']])
  check(`round-2 pair ${raw} (fails) → ${fixed} (passes)`,
    CD.casChecksum(raw) === false && CD.casChecksum(fixed) === true);

/* ---------- 4) search matches by the corrected number ---------- */
{
  const search = SC.buildSearch([
    { key: 'libya-500', rows: d5.rows, rank: 0 },
    { key: 'libya-248', rows: d2.rows, rank: 1 },
  ]);
  const byFixed = search('133-06-2', true).filter(x => x.k === 'libya-500');
  check('search finds Captan by the CORRECTED number', byFixed.some(x => x.r.name === 'Captan' && x.s.v === 100));
  const byCarvone = search('2244-16-8', true).filter(x => x.k === 'libya-500');
  check('search finds Carvone by the corrected number 2244-16-8',
    byCarvone.some(x => x.r.name === 'Carvone' && x.s.v === 100));
  const mand = search('374726-62-2', true).filter(x => x.k === 'libya-500');
  check('search finds Mandipropamid by the corrected number 374726-62-2',
    mand.some(x => x.r.name === 'Mandipropamid' && x.s.v === 100));
  const pro = search('52888-80-9', true).filter(x => x.k === 'libya-500');
  check('search finds Prosulfocarb by the corrected number 52888-80-9',
    pro.some(x => x.r.name === 'Prosulfocarb' && x.s.v === 100));
  const glyph = search('1071-83-6', true).filter(x => x.k === 'libya-500');
  check('untouched rows keep matching (Glyphosate regression)',
    glyph.some(x => x.r.name === 'Glyphosate' && x.s.v === 100));
}

/* ---------- 5) display wiring + i18n ×4 + no silent correction ---------- */
check('the card renders corrected + struck raw + source label',
  /casDisplayCorrected/.test(render) && /cas-raw-old/.test(render) && /cas-src/.test(render)
  && /cas\.source\.' \+ srcKey/.test(render));
check('the card keeps the report-only badsum marking',
  /cas\.badsum/.test(render) && /casChecksum\(c\) === false/.test(render));
{
  const keys = ['cas.source.epa-master', 'cas.source.official-500',
    'cas.source.official-248', 'cas.corrected'];
  for (const k of keys) {
    const n = (i18n.match(new RegExp("'" + k.replace(/\./g, '\\.') + "':", 'g')) || []).length;
    check(`i18n ${k} present in all 4 dictionaries`, n === 4, 'found=' + n);
  }
}

/* ---------- 6) libya-248 explanations (no data rewrite beyond labelling) ---------- */
{
  const multi = d2.rows.filter(r => r.cas_multi === true);
  check('libya-248 multi-CAS rows labelled cas_multi (6 rows)', multi.length === 6, String(multi.length));
  check('libya-248 rows carry official-248 provenance',
    d2.rows.filter(r => /[0-9]/.test(String(r.cas || '')))
      .every(r => r.cas_source === 'official-248'));
  check('libya-248 checksum state unchanged (0 failures)',
    d2.rows.every(r => String(r.cas || '').split(/[\n[\]]/)
      .map(s => s.trim()).filter(s => /^[0-9]{2,7}-[0-9]{2}-[0-9]$/.test(s))
      .every(c => CD.casChecksum(c) !== false)));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
