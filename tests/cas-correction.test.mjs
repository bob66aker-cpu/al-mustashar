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

/* ===================================================================
 * D42 (2026-10-03) — the contract changed, and this guard now pins the
 * state the OWNER adopted, not the state a previous round used to keep.
 * The provenance triple (cas_raw / cas_corrected / cas_source) is GONE by
 * owner decision: libya-500 is rebuilt, the corrected value IS the value,
 * and there is no second copy to disagree with. What must never come back
 * is a silent correction — so the guard proves the triple is absent and
 * that each named row carries the number the diff register adopted.
 * Register of record: docs/libya-500-diff-register.md (deposit 1836934).
 * =================================================================== */
const ADOPTED = [
  { row: 187, name: 'Florpyrauxifen-benzyl', cas: '1390661-72-9',
    why: 'register §1أ: the printed official page for item 187 settles it' },
  { row: 114, name: 'Captan', cas: '133-06-2', why: 'register: approved' },
  { row: 258, name: 'Mesotrione', cas: '104206-82-8', why: 'register: approved' },
  { row: 117, name: 'Carvone', cas: '2244-16-8', why: 'register: adopted as-is' },
];
check('libya-500 row count intact (411)', d5.rows.length === 411, String(d5.rows.length));
check('meta.count matches rows', d5.meta.count === d5.rows.length);

/* the adopted numbering, from the register — 8 gaps, one shift region each */
const NUM = [130, 253, 254, 295, 312, 321, 333, 364];
const nums = d5.rows.map(r => r.row);
check('the official numbering has exactly the eight adopted gaps',
  NUM.every(n => !nums.includes(n)), 'gaps now: ' + JSON.stringify(
    [...new Set(Array.from({ length: 419 }, (_, i) => i + 1).filter(n => !nums.includes(n)))]));
const at = n => d5.rows.find(r => r.row === n);
check('row 255 is Mefentrifluconazole (register §9أ)',
  at(255) && at(255).name === 'Mefentrifluconazole', at(255) && at(255).name);
check('row 322 is the DSMZ strain, 323 PL 11, 324 strain 251 (register §9أ)',
  at(322) && /DSMZ 13134/.test(at(322).name)
  && at(323) && /PL 11/.test(at(323).name)
  && at(324) && /strain 251/.test(at(324).name),
  [at(322) && at(322).name, at(323) && at(323).name, at(324) && at(324).name].join(' / '));
check('row 350 is Silthiofam and 351 is Sintofen (register §9)',
  at(350) && at(350).name === 'Silthiofam' && at(351) && /Sintofen/.test(at(351).name),
  (at(350) && at(350).name) + ' / ' + (at(351) && at(351).name));

/* each adopted number is present AT ITS NAMED ROW, and only there */
for (const a of ADOPTED) {
  const r = at(a.row);
  check(`row ${a.row} ${a.name} carries the adopted number ${a.cas}`,
    r && r.name === a.name && r.cas === a.cas,
    r ? JSON.stringify({ name: r.name, cas: r.cas }) : 'row missing');
}

/* The old-copy layer is gone EVERYWHERE. cas_source survives only as the
   provenance of a DOCUMENTED CANDIDATE number (src/cards.js:197 labels it),
   i.e. exactly on the rows that carry cas_suggested — never as a
   'this value was corrected from x' trace. */
const OLD_COPY = ['cas_raw', 'cas_corrected'];
check('no libya-500 row still carries an old-copy field (cas_raw / cas_corrected)',
  d5.rows.every(r => OLD_COPY.every(k => !(k in r))),
  String(d5.rows.filter(r => OLD_COPY.some(k => k in r)).length) + ' rows');
check('cas_source survives only where cas_suggested documents candidate numbers',
  d5.rows.every(r => ('cas_source' in r) === ('cas_suggested' in r))
  && d5.rows.filter(r => 'cas_source' in r).map(r => r.row).sort((a, b) => a - b).join(',') === '228,243,261,271,347',
  d5.rows.filter(r => 'cas_source' in r).map(r => r.row).join(','));
check('the display layer has no correction and no source to attribute, and shows the single value verbatim',
  d5.rows.every(r => CD.casDisplayCorrected(r) === '' && CD.casSourceKey(r) === ''
    && CD.casDisplayRaw(r) === String(r.cas || '').trim()),
  String(d5.rows.filter(r => CD.casDisplayCorrected(r) !== '' || CD.casSourceKey(r) !== '').length) + ' rows');

/* every adopted number passes the check digit; nothing is invented */
check('every adopted value passes casChecksum',
  ADOPTED.every(a => CD.casChecksum(a.cas) === true),
  ADOPTED.filter(a => CD.casChecksum(a.cas) !== true).map(a => a.cas).join(','));

/* the numbers the previous round repaired still stand, under the same rows */
const STILL = [
  { name: 'Capric acid (CAS 334-48-5)', cas: '334-48-5' },
  { name: 'Cycloxydim', cas: '101205-02-1' },
  { name: 'Metalaxyl-M', cas: '70630-17-0' },
  { name: 'Mandipropamid', cas: '374726-62-2' },
  { name: 'Prosulfocarb', cas: '52888-80-9' },
];
for (const e of STILL) {
  const r = d5.rows.find(x => x.name === e.name);
  check(`${e.name} keeps ${e.cas}`, r && r.cas === e.cas,
    r ? r.cas : 'row missing');
}

/* the annotation layer is NOT the old copy and must survive */
check('the annotation fields survive the rebuild',
  d5.rows.filter(r => r.cas_suggested).length === 5
  && d5.rows.filter(r => r.cas_review).length === 1
  && d5.rows.filter(r => r.cas_stereo).length === 1,
  'sug=' + d5.rows.filter(r => r.cas_suggested).length
  + ' rev=' + d5.rows.filter(r => r.cas_review).length
  + ' stereo=' + d5.rows.filter(r => r.cas_stereo).length);

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
