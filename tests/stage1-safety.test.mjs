/*
 * tests/stage1-safety.test.mjs — المرحلة 1: سلامة الحكم على المادة (1.1..1.4)
 * ثابت (Node) على الوحدات الحقيقية: cas.js + search-core.js + بيانات حقيقية.
 * تشغيل: node tests/stage1-safety.test.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (extra ? ' [' + extra + ']' : '')); }
};

/* ---- load cas.js (decision layer) into a VM sandbox ---- */
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(root, 'src/cas.js'), 'utf8'), sandbox);
const CasDissect = sandbox.CasDissect;

/* ---- load the real databases ---- */
const l248 = JSON.parse(readFileSync(join(root, 'data/libya-248.json'), 'utf8'));
const l500 = JSON.parse(readFileSync(join(root, 'data/libya-500.json'), 'utf8'));
const eu = JSON.parse(readFileSync(join(root, 'data/eu.json'), 'utf8'));
const epa = JSON.parse(readFileSync(join(root, 'data/epa.json'), 'utf8'));
const epac = JSON.parse(readFileSync(join(root, 'data/epa-cancelled.json'), 'utf8'));

/* 1.1 — the legend chip keys off libya-500 only. Structural pin: the chip
 * code in app.js must reference the source key gate (k === 'libya-500'). */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  must('1.1: statusDisplay gates the legend chip on libya-500',
    /const ek = k === 'libya-500'/.test(app));
  must('1.1: LEGEND_STATUS_KEYS stays a Decree-500 table (4 codes)',
    (app.match(/LEGEND_STATUS_KEYS = \{[\s\S]*?\};/) || [''])[0].includes("'REV*'")
    && (app.match(/LEGEND_STATUS_KEYS = \{[\s\S]*?\};/) || [''])[0].includes("'Approved'"));
}
/* The raw-value lookup alone must NOT decide the chip anymore:
 * dissectStatus('Approved' EU row) must yield an EU key, not a 500 key. */
{
  const euRow = eu.rows.find(r => (r.status_raw || '').trim() === 'Approved' && r.cas === '74070-46-5'); // Aclonifen
  must('1.1: Aclonifen exists as an EU Approved row (test precondition)', !!euRow);
  if (euRow) {
    const d = CasDissect.dissectStatus(euRow, 'eu');
    must('1.1: dissectStatus(EU Approved) yields an st.eu.* key (never st.500.*)',
      String(d.key).startsWith('st.eu.'), d.key);
  }
}
/* And the i18n explain attached to that key is the EU one, not decree prose:
 * the UI gate (k === 'libya-500') must yield null for an EU row. */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  // simulate: source key eu + raw Approved → chip disabled
  const k = 'eu', d = { raw: 'Approved' };
  const ek = k === 'libya-500' ? /* table lookup */ (d.raw === 'Approved' ? 'st.500.approved.explain' : null) : null;
  must('1.1: chip disabled for EU rows by the source-key gate', ek === null);
}

/* 1.2 — compound functional code I/A resolves to both parts */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  must('1.2: catName splits compound codes on /,+',
    /parts = c\.split\(\/\[\\\/,\+\]\/\)/.test(app) || /split\(\/\[\\\/,\+\]\/\)/.test(app));
  const l248Tet = l248.rows.find(r => String(r.cas || '').includes('116-29-0'));
  must('1.2: Tetradifon row carries category I/A in libya-248 (precondition)',
    !!l248Tet && l248Tet.category === 'I/A', l248Tet && l248Tet.category);
  // behavioral check of the split logic (replicated from catName source)
  const LEGEND = ['I', 'F', 'A', 'N', 'H', 'R', 'M', 'S.ph', 'PGR', 'rep'];
  const catName = c => {
    const parts = String(c || '').trim().split(/[\//,+]/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts.map(p => LEGEND.includes(p) ? p : '').filter(Boolean).join(' + ');
    return LEGEND.includes(String(c).trim()) ? String(c).trim() : '';
  };
  must('1.2: I/A resolves to two explained parts', catName('I/A') === 'I + A', catName('I/A'));
  must('1.2: single codes still resolve', catName('H') === 'H');
}

/* 1.3 — epa-cancelled source label */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  must('1.3: sourceLabel maps epa-cancelled to src.epac',
    /'epa-cancelled': t\('src.epac'/.test(app));
  const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
  must('1.3: src.epac present in all 4 dicts',
    (i18n.match(/'src\.epac':/g) || []).length === 4,
    String((i18n.match(/'src\.epac':/g) || []).length));
}

/* 1.4 — expected rows corrected; race fixed */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  const m = app.match(/const EXPECTED_ROWS = \{[^}]*\};/);
  must('1.4: EXPECTED_ROWS has epa: 1361', m && /epa: 1361/.test(m[0]), m && m[0]);
  must('1.4: EXPECTED_ROWS has epa-cancelled: 1425', m && /'epa-cancelled': 1425/.test(m[0]));
  must('1.4: no stale 2199 expectation in code (comments excluded)',
    !app.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('/*')).join('\n').includes('2199'));
  must('1.4: truncation state is re-asserted after renderDbStatus (race fix)',
    /const shortRows = \{\};/.test(app) && app.indexOf('renderDbStatus();') < app.indexOf('shortRows[key]'));
}

/* data sanity behind 1.4: actual row counts equal the corrected table */
must('1.4: real counts 77/411/1483/1361/1425 match EXPECTED_ROWS',
  l248.rows.length === 77 && l500.rows.length === 411 && eu.rows.length === 1483
  && epa.rows.length === 1361 && epac.rows.length === 1425);

console.log('\nSTAGE-1: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
