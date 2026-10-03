/*
 * tests/fb11-d30.test.mjs — فيدباك 11 / D30: بطاقتان لاMore من واحدة لكل (مصدر × هوية)
 * ---------------------------------------------------------------------------
 * قرار المالك الحرفي: «البطاقات منفصلة لكل مصدر (500 · 248 · EU · EPA · كندا ·
 * أستراليا)، وتُعرض أعلى نتيجة فقط لكل (هوية المادة × مصدر)، وتُخفى الأدنى
 * المكررة لنفس الهوية داخل نفس المصدر عند كل درجات التطابق».
 *
 * صلة القياس (قبل التعديل، حياً، 5 عينات معلنة — بديلة لا لقطة المالك):
 *   Glyphosate 3 بطاقات (500=1 eu=1 epa=1) · Captan 3 (رقم مشترك: FB5-b) ·
 *   aliphatic petroleum solvent ⇒ **9 بطاقات في epa** (اسم واحد، 9 أرقام CAS) ·
 *   64-19-7 ⇒ 5 بطاقات، منها 500=2 «Acetic acid Approved» و«Vinegar REV»
 *   — **تعارض حالة داخل هوية واحدة ⇒ يبقى كلّه سليماً** (خط المالك «ج»).
 * بعد الإصلاح: petroleum solvent = بطاقة واحدة، و64-19-7 كما هو.
 *
 * تشغيل: node tests/fb11-d30.test.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  << ' + extra));
  ok ? pass++ : fail++;
};

const app = readFileSync('src/app.js', 'utf8');

/* ---------- the rule, lifted out of src/app.js and exercised directly ----- */
const start = app.indexOf('function collapseSameSource(rows) {');
check('src/app.js carries collapseSameSource', start > 0);
if (start < 0) { console.log('PASS: 1   FAIL: 1'); process.exit(1); }
/* brace-matched extraction: no regex guessing, no re-typed copy */
function extract(src, from) {
  let i = src.indexOf('{', from), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (!depth) return src.slice(from, i + 1); }
  }
  return '';
}
const FNSRC = extract(app, start);
const body = FNSRC.replace(/^function collapseSameSource\(rows\) \{/, '').replace(/\}$/, '');
const collapseSameSource = new Function('console', '"use strict";\n' + FNSRC + '\nreturn collapseSameSource;')({ warn() {} });

const row = (name, cas, status, rowNo) => ({ name, name_norm: String(name).toLowerCase(), cas, status, row: rowNo });
const card = (k, r, v, field, type) => ({ k, r, s: { v, field, type: type || 'اسم مطابق' } });
const casCard = (k, r, v, cas) => ({ k, r, s: { v, field: cas || r.cas, type: 'CAS مطابق تمامًا' } });
const names = list => list.map(x => x.k + '/' + x.r.name);

/* ---------- 1) duplicates inside one source collapse to the TOP one -------- */
{
  const nine = Array.from({ length: 9 }, (_, i) =>
    card('epa', row('Aliphatic petroleum solvent', '8002-0' + i + '-9', 'مسموح', i), 100));
  const got = collapseSameSource(nine);
  check('9 same-name rows in one source collapse to ONE card', got.length === 1, JSON.stringify(names(got)));
  check('the card kept is the highest-scoring one',
        collapseSameSource([card('epa', row('x', 'c', 's', 1), 80), card('epa', row('x', 'c', 's', 2), 100)]).length === 1
        && collapseSameSource([card('epa', row('x', 'c', 's', 1), 80), card('epa', row('x', 'c', 's', 2), 100)])[0].s.v === 100);
  const tie = collapseSameSource([card('epa', row('same name', 'c1', 'مسموح', 7), 100),
                                  card('epa', row('same name', 'c2', 'مسموح', 3), 100)]);
  check('a tie is decided by the source row order (the declared order)',
        tie.length === 1 && tie[0].r.row === 3, JSON.stringify(tie.map(x => x.r.row)));
  check('duplicates collapse at EVERY score, not only at 100',
        collapseSameSource([card('epa', row('x', 'c', 's', 1), 95), card('epa', row('x', 'c', 's', 2), 84)]).length === 1);
}

/* ---------- 2) three sources stay three cards (the owner's first clause) --- */
{
  const list = [card('libya-500', row('Glyphosate', '1071-83-6', 'REV*', 1), 100),
                card('eu', row('Glyphosate', '1071-83-6', 'محظور', 1), 100),
                card('epa', row('Glyphosate', '1071-83-6', 'مسموح', 1), 100)];
  check('one row per source stays three cards', collapseSameSource(list).length === 3, JSON.stringify(names(collapseSameSource(list))));
}

/* ---------- 3) different substances are never merged (FB5-ج, safety) ------ */
{
  const two = [casCard('libya-500', row('Acetic acid', '64-19-7', 'Approved', 1), 100),
               card('libya-500', row('Glyphosate', '1071-83-6', 'REV', 2), 100)];
  check('two different substances in one source both stay', collapseSameSource(two).length === 2);
  const sharedCas = [casCard('libya-500', row('Captan', '133-06-2', 'Approved', 1), 100),
                     casCard('epa', row('Captan', '133-06-2', 'مسموح', 2), 100)];
  check('the same CAS in two sources never merges (FB5-b Captan)', collapseSameSource(sharedCas).length === 2);
}

/* ---------- 4) CONFLICT GUARD: a status disagreement keeps every card -----
 * 64-19-7 is real: «Acetic acid Approved» and «Vinegar REV» share the CAS inside
 * libya-500. Dropping either would change the legal reading, so nothing is
 * dropped — and the guard must not be silently switchable off. */
{
  const conflict = [casCard('libya-500', row('Acetic acid', '64-19-7', 'Approved', 1), 100),
                    casCard('libya-500', row('Vinegar', '64-19-7', 'REV', 2), 100)];
  const got = collapseSameSource(conflict);
  check('conflicting statuses inside one identity keep EVERY card', got.length === 2, JSON.stringify(names(got)));
  check('the conflict guard keys on the status field, not the name',
        collapseSameSource([card('epa', row('a', 'c', 'مسموح', 1), 100), card('epa', row('b', 'c', 'محظور', 2), 100)]).length === 2);
  check('the guard is a hard rule in the source (not a flag)',
        /statuses\.size > 1\) \{ conflicts\+\+; out\.push\(\.\.\.list\); continue; \}/.test(app));
}

/* ---------- 5) identity is the search engine's, not CAS alone, not name ----- */
{
  const byName = [card('epa', row('Alpha', '111-11-1', 'مسموح', 1), 100),
                  card('epa', row('Beta', '222-22-2', 'مسموح', 2), 100)];
  check('two names are two identities even at the same score', collapseSameSource(byName).length === 2);
  const casOnly = [casCard('epa', row('Alpha', '333-33-3', 'مسموح', 1), 100),
                   casCard('epa', row('Beta', '333-33-3', 'مسموح', 2), 100)];
  check('a shared CAS inside ONE source is one identity (Acetic/Vinegar shape)',
        collapseSameSource(casOnly).length === 1, JSON.stringify(names(collapseSameSource(casOnly))));
}

/* ---------- 6) the rule lives inside the ONE filter render() owns --------- */
check('collapseSameSource is called from collapseToDecisive, not from a second filter',
  /return collapseSameSource\(kept\);/.test(app)
  && /const kept = rows\.filter/.test(app)
  && (app.match(/\bcollapseSameSource\(/g) || []).length === 2 /* the definition + the one call */);
check('render() still performs exactly one filtering step',
  (app.match(/const displayResults = collapseToDecisive\(results\);/g) || []).length === 1
  && !/collapseSameSource\(results\)/.test(app));

/* ---------- 7) MUTATIONS: each rule must be breakable ------------------- */
{
  /* (a) break the order rule: score ignored ⇒ the lowest row could win */
  const withoutScore = FNSRC.replace(/\(\(b\.s && b\.s\.v\) \|\| 0\) - \(\(a\.s && a\.s\.v\) \|\| 0\)/, '0');
  const mutant = new Function('console', '"use strict";\n' + withoutScore + '\nreturn collapseSameSource;')({ warn() {} });
  /* with the score ignored the winner is decided by row order alone — proof the
     score is really what picks the top result */
  check('MUTATION (a): dropping the score comparison really changes which card wins',
        withoutScore !== FNSRC
        /* row 9 scores 100, row 1 scores 80: the real rule keeps row 9 (top
         * score); the mutant falls back to row order and keeps row 1 */
        && mutant([card('epa', row('same name', 'c1', 'مسموح', 9), 100), card('epa', row('same name', 'c2', 'مسموح', 1), 80)])[0].r.row === 1
        && collapseSameSource([card('epa', row('same name', 'c1', 'مسموح', 9), 100), card('epa', row('same name', 'c2', 'مسموح', 1), 80)])[0].r.row === 9,
        'the mutant keeps row 1, the real rule keeps row 9');
  /* (b) hide the conflict guard */
  const withoutGuard = FNSRC.replace(/if \(statuses\.size > 1\) \{ conflicts\+\+; out\.push\(\.\.\.list\); continue; \}/, '');
  check('MUTATION (b): removing the conflict guard really changes the code', withoutGuard !== body);
  /* (c) key on the CAS only (the Captan mistake) */
  check('MUTATION (c): keying on the CAS alone would merge two substances (FB5-b)',
        collapseSameSource([casCard('epa', row('Alpha', '444-44-4', 'مسموح', 1), 100),
                            card('epa', row('Beta', '444-44-4', 'محظور', 2), 100)]).length === 2,
        'the real key keeps the status-conflict pair; a naive CAS key would hide one');
}

/* ---------- 8) data/ untouched, and the samples are real rows ------------ */
const rows500 = JSON.parse(readFileSync('data/libya-500.json', 'utf8')).rows;
const rowsEpa = JSON.parse(readFileSync('data/epa.json', 'utf8')).rows;
check('the 64-19-7 conflict really exists in data/libya-500.json',
  rows500.filter(r => String(r.cas || '').trim() === '64-19-7').map(r => r.name + '/' + r.status).sort().join(' ~ ')
  === 'Acetic acid/Approved ~ Vinegar/REV');
check('the 9-row EPA duplicate really exists in data/epa.json',
  rowsEpa.filter(r => String(r.name || '').trim().toLowerCase() === 'aliphatic petroleum solvent').length === 9);

console.log('\n=========================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);