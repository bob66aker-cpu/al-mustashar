/*
 * tests/nearpairs-regression.test.mjs — near-pair confirmation guard
 * --------------------------------------------------------------------
 * Uses the machine list produced by scripts/near-pairs.mjs
 * (tests/near-pairs.json) and asserts, through the REAL engine:
 *
 *   For every sampled near pair (two rows, different CAS):
 *     querying one member must NEVER classify the other member as an
 *     exact/confirmed verdict (100%), UNLESS the ambiguity banner fires
 *     (same-name pairs legitimately both return 100 «اسم مطابق» — the
 *     safety contract is that the UI is forced to show the ambiguity
 *     group instead of silently confirming one of them).
 *
 * Run: node tests/nearpairs-regression.test.mjs
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

const KEYS = ['libya-248', 'libya-500', 'eu', 'epa', 'epa-cancelled'];
const dbs = {};
for (const k of KEYS) dbs[k] = JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows;
const search = SC.buildSearch(KEYS.map(k => ({ key: k, rows: dbs[k] })));

const list = JSON.parse(fs.readFileSync('tests/near-pairs.json', 'utf8'));
const rowsOf = k => dbs[k];

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) pass++; else fail++;
  if (!ok) console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
}

console.log('guarding ' + list.pairs.length + ' sampled near pairs (total ' + list.total + ')');
for (const p of list.pairs) {
  const a = rowsOf(p.a.k).find(r => r.row === p.a.row);
  const b = rowsOf(p.b.k).find(r => r.row === p.b.row);
  if (!a || !b) { check('pair rows resolvable ' + p.a.k + '#' + p.a.row, false, 'missing row'); continue; }
  const q = String(a.name).split('\n')[0];
  const res = search(q, true);
  const bHit = res.find(x => x.r === b);
  if (!bHit) { check('ok (other member not listed): ' + p.type, true); continue; }
  if (bHit.s.v < 100) { check('ok (probable only): ' + p.type + ' ' + bHit.s.v + '%', true); continue; }
  /* bHit at 100 — legal ONLY when the ambiguity banner fires */
  const amb = CD.ambiguity(res);
  check('confirmed-100 pair shows ambiguity banner: ' + p.a.k + '#' + p.a.row + '~' + p.b.k + '#' + p.b.row,
    !!amb && CD.casOf(amb.a) !== CD.casOf(amb.b),
    amb ? 'banner ok' : 'SILENT CONFIRMATION — unsafe');
}

console.log('==============================');
console.log('near-pair guard: PASS ' + pass + '   FAIL ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
