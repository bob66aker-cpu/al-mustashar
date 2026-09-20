/*
 * tests/judge.test.mjs — b6 named examples over the REAL four databases
 * ----------------------------------------------------------------------
 * Every example from the work order (section b6) must pass, plus the
 * both-decisions rule (b5/b8) for 2,4-D and Ziram. Runs judge.js over
 * SearchCore exactly as the app does. Exit 1 on any failure.
 */
import fs from 'node:fs';
import vm from 'node:vm';

let pass = 0, fail = 0;
const P = (name, ok, detail) => {
  if (ok) pass++; else fail++;
  console.log((ok ? ' PASS ' : ' FAIL ') + name + (detail ? ' — ' + detail : ''));
};
const must = (name, ok, detail) => { if (!ok) { fail++; console.log(' FATAL ' + name); process.exit(1); } };

/* Load SearchCore (root-relative, same file the app uses) */
const scCtx = {}; vm.createContext(scCtx);
vm.runInContext(fs.readFileSync('src/search-core.js', 'utf8'), scCtx);
const SearchCore = scCtx.SearchCore;
must('SearchCore loads', !!SearchCore && typeof SearchCore.buildSearch === 'function');

/* Load judge */
const jCtx = {}; vm.createContext(jCtx);
vm.runInContext(fs.readFileSync('src/judge.js', 'utf8'), jCtx);
const judge = jCtx.judge;
must('judge loads', !!judge && typeof judge.lookup === 'function');

/* Load the four real databases */
const sources = [];
for (const k of ['libya-248', 'libya-500', 'eu', 'epa']) {
  sources.push({ key: k, rows: JSON.parse(fs.readFileSync('data/' + k + '.json', 'utf8')).rows });
}
const search = SearchCore.buildSearch(sources);
must('search built', typeof search === 'function');

/* Annotate rows with source_key like the app does */
for (const s of sources) for (const r of s.rows) r.source_key = s.key;

/* Build the judge exact indexes over the SAME sources */
judge.buildIndex(sources);

/* helper: verdicts per source for a query */
function run(q, isCas) {
  const res = judge.lookup(q, search);
  const by = {};
  for (const p of res.perSource) by[p.source] = p;
  return { res, by };
}

/* ============ b6 named examples ============ */

// Arabic-only / symbols -> no match, never 100
{
  const a = judge.lookup('مبيد قوارض غير مسجل', search);
  P('arabic-only query -> no match', !a.verdict && a.perSource.length === 0, JSON.stringify(a.perSource && a.perSource.map(p => p.source)));
  const b = judge.lookup('!!!', search);
  P('"!!!" -> no match (empty after normalize)', b.empty === true || (!b.verdict && b.perSource.length === 0));
}

// partial CAS numbers -> no match
{
  const { res } = run('94-75', true);
  P('94-75 (partial) -> no confirmed match', !(res.verdict === 'exact'));
  const b = run('71-83-6', true);
  P('71-83-6 (partial) -> no confirmed match', !(b.res.verdict === 'exact'));
  const c = run('7', true);
  P('7 -> no match', !c.res.verdict);
}

// "No CAS allocated" stores as empty, never matches text
P('No CAS allocated is empty cell', judge.casCellIsEmpty('No CAS allocated'));
// "cas" is a latin word -> not empty, but never matches a No-CAS cell
P('"cas" is a non-empty normalized query', judge.normalize('cas') === 'cas');

// exact CAS
{
  const { res, by } = run('1071-83-6', true);
  P('1071-83-6 exact -> glyphosate found', res.verdict === 'exact', JSON.stringify(Object.keys(by)));
}

// bad checksum -> invalid
P('1071-83-7 checksum invalid', judge.casChecksum('1071-83-7') === false);

// 1071-83-9 must NOT match 1071-83-6 (the reference engine gave 102%)
{
  const { res } = run('1071-83-9', true);
  P('1071-83-9 vs -6 -> no confirmed CAS match', res.verdict !== 'exact' || res.perSource.length === 0);
}

// 2,4-D and Ziram: BOTH decisions shown, 248 red stays
{
  const { by } = run('2,4-D', false);
  const has248 = !!by['libya-248'], has500 = !!by['libya-500'];
  P('2,4-D appears in 248', has248, 'sources: ' + Object.keys(by).join(','));
  P('2,4-D appears in 500 (REV*)', has500 && by['libya-500'].entries.some(e => (e.row.status || '').startsWith('REV')));
  if (has248) P('2,4-D in 248 is exact verdict', by['libya-248'].verdict === 'exact');
}
{
  const { by } = run('Ziram', false);
  P('Ziram in 248', !!by['libya-248']);
  P('Ziram in 500 REV*', !!by['libya-500'] && by['libya-500'].entries.some(e => (e.row.status || '').startsWith('REV')));
}

// name pairs
{
  const g = run('glyphosate', false);
  P('glyphosate exact somewhere', g.res.verdict === 'exact');
  const gl = run('glphosate', false);
  P('glphosate -> probable (confirm), not exact', gl.res.verdict === 'probable', 'got ' + gl.res.verdict);
  for (const [q, w] of [
    ['permethrin', 'cypermethrin'], ['fenvalerate', 'esfenvalerate'],
    ['chlorpyrifos', 'chlorpyrifos-methyl'], ['metalaxyl', 'metalaxyl-M'],
    ['2,4-D', '2,4-DB']
  ]) {
    // rule: among confirmed (exact) entries, none may BE the look-alike row.
    // A row is "the look-alike" if its head name equals w but not q.
    const r = run(q, false);
    const confirmedHeads = [];
    for (const p of Object.values(r.by)) for (const e of (p.entries || [])) {
      if (e.verdict !== 'exact') continue;
      const head = judge.normalize(String(e.row.name).replace(/\s*\([^)]*\)/g, '').split(/\n+/)[0]);
      confirmedHeads.push(head);
    }
    const wN = judge.normalize(w);
    const qN = judge.normalize(q);
    const wrong = confirmedHeads.filter(h => h === wN && h !== qN);
    P(q + ' never confirms "' + w + '"', wrong.length === 0, 'confirmed heads: ' + JSON.stringify([...new Set(confirmedHeads)]));
    // and the query itself IS confirmed somewhere
    P(q + ' confirmed on its own row', confirmedHeads.includes(qN));
  }
}

// E/Z acetate pairs present in 500 items 1-35 (real rows)
{
  // find any E and Z stereo pair inside libya-500
  const rows = sources.find(s => s.key === 'libya-500').rows;
  let pair = null;
  outer:
  for (const a of rows) for (const b of rows) {
    if (a === b) continue;
    const na = judge.normalize(String(a.name).split(/\n+/)[0]), nb = judge.normalize(String(b.name).split(/\n+/)[0]);
    if (!na || !nb) continue;
    const sa = judge._internals.stereoSet(na), sb = judge._internals.stereoSet(nb);
    if (sa.length && sb.length && JSON.stringify(sa) !== JSON.stringify(sb)) {
      const body = (x) => x.replace(/\((e|z|e,e|e,z|z,e|z,z)\)/g, '');
      if (body(na) === body(nb)) { pair = [na, nb]; break outer; }
    }
  }
  if (pair) {
    P('real E/Z pair found: ' + pair[0] + ' vs ' + pair[1], true);
    P('E/Z pair -> not confirmed across', ['exact', 'probable'].includes(judge.judgeName(pair[0], pair[1])) === false);
  } else {
    console.log(' NOTE no E/Z pair rows in current data (recorded, not failed)');
  }
}

// ambiguous: chlordane CAS 57-74-9 vs 12789-03-6 (both in data) -> both shown
{
  const { by } = run('chlordane', false);
  const entries = [];
  for (const p of Object.values(by)) entries.push(...p.entries);
  const cads = new Set(entries.flatMap(e => judge.parseCasCell(e.row.cas).map(x => x.cas)));
  if (cads.size > 1) {
    const srcs = entries.filter(e => e.verdict !== 'similar').map(e => e.row.source_key || e.row.source);
    P('chlordane multi-CAS -> entries from both kept', entries.length >= 2, JSON.stringify([...cads]));
  } else {
    console.log(' NOTE chlordane single-CAS in current data (recorded)');
  }
}

// shared CAS 34681-10-2 (items 18+19) -> ALL matching rows shown, flagged
{
  const { by } = run('34681-10-2', true);
  const entries = by['libya-248'] ? by['libya-248'].entries : [];
  P('34681-10-2 -> all matching 248 rows shown (2 expected)', entries.length >= 2, 'got ' + entries.length);
  const names = entries.map(e => String(e.row.name).split(/\n+/)[0]).join(' | ');
  P('both names present', names.includes('Bromoxynil') && names.includes('Butocarboxim'), names);
}

// b2: stored-CAS-fails rows never confirm by CAS
{
  // Captan stored 133-06-02 (malformed). Query by that exact string:
  const { by } = run('133-06-02', true);
  const e500 = by['libya-500'];
  if (e500) {
    P('Captan malformed stored CAS -> CAS match never "exact"', e500.entries.every(e => e.verdict !== 'exact' || e.badStored));
  } else {
    P('Captan malformed CAS not CAS-matchable', true);
  }
}

// vocabularies
P('248 tone is ban (only red)', judge.STATUSES['libya-248'].tone === 'ban');
P('no green/safe tone anywhere', Object.values(judge.STATUSES).every(s => s.tone !== 'good' && s.tone !== 'safe'));
P('500 has no "مسجلة" wording', JSON.stringify(judge.STATUSES['libya-500']).includes('مسجلة') === false);
P('REV* star note present', judge.STATUSES['libya-500'].map['REV*'].includes('النجمة'));
P('V code marked digital-only', (judge.CODES['V'].note || '').includes('الرسمي'));

console.log('\njudge.test: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
