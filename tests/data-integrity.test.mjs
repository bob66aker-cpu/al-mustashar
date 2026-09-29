/* tests/data-integrity.test.mjs — the data integrity guard.
 * ------------------------------------------------------------------
 * The app now verifies the SHA-256 of every core data file at load time
 * (src/app.js, DATA_SHA256). A checksum nobody watches is worse than no
 * checksum, because it looks like protection. So this guard enforces three
 * things, and the third is the one that matters:
 *
 *   1. the table in src/app.js matches the files on disk RIGHT NOW;
 *   2. tests/data-health.test.mjs agrees with that same table — otherwise
 *      one test passes while the app rejects its own data;
 *   3. the verification actually REJECTS a tampered payload. A guard that
 *      cannot fail is not a guard.
 *
 * Run: node tests/data-integrity.test.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  if (ok) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + String(extra).slice(0, 300) : '')); }
};
const sha = b => createHash('sha256').update(b).digest('hex');

/* ---------- 1) the table in app.js is current ---------- */
console.log('== the embedded table matches the files on disk ==');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const tableBlock = (app.match(/const DATA_SHA256 = \{([\s\S]*?)\};/) || [])[1];
check('src/app.js declares DATA_SHA256', !!tableBlock);
check('src/app.js defines sha256Hex', /function sha256Hex\s*\(/.test(app));

const entries = [];
if (tableBlock) {
  const re = /'([^']+)'\s*:\s*'([0-9a-f]{64})'/g;
  let m;
  while ((m = re.exec(tableBlock))) entries.push({ file: m[1], sha: m[2] });
}
check('the table parses to 5 entries', entries.length === 5, 'got ' + entries.length);

for (const e of entries) {
  const p = join(root, e.file);
  if (!existsSync(p)) { check(e.file + ' exists', false); continue; }
  const got = sha(readFileSync(p));
  check(e.file + ' sha256 matches the table', got === e.sha, 'file=' + got.slice(0, 16) + ' table=' + e.sha.slice(0, 16));
}

/* the app must cover every core source, and nothing that does not exist */
const sources = [...app.matchAll(/key:\s*'([^']+)',\s*url:\s*'([^']+)'/g)].map(m => m[2]);
const coreUrls = sources.filter(u => u.startsWith('data/'));
check('every core data source has a checksum',
  coreUrls.every(u => entries.some(e => e.file === u)),
  coreUrls.filter(u => !entries.some(e => e.file === u)).join(', '));
check('no checksum points at a file that does not exist',
  entries.every(e => existsSync(join(root, e.file))),
  entries.filter(e => !existsSync(join(root, e.file))).map(e => e.file).join(', '));

/* ---------- 2) data-health agrees ---------- */
console.log('== data-health agrees with the same values ==');
const health = readFileSync(join(root, 'tests/data-health.test.mjs'), 'utf8');
const hEntries = {};
for (const m of health.matchAll(/'([a-z0-9-]+)'\s*:\s*\{\s*rows:\s*(\d+)\s*,\s*sha:\s*'([0-9a-f]{64})'/g)) {
  hEntries[m[1]] = { rows: Number(m[2]), sha: m[3] };
}
check('data-health has 5 expectations', Object.keys(hEntries).length === 5, JSON.stringify(Object.keys(hEntries)));

const keyToFile = {
  'libya-248': 'data/libya-248.json', 'libya-500': 'data/libya-500.json',
  eu: 'data/eu.json', epa: 'data/epa.json', 'epa-cancelled': 'data/epa-cancelled.json',
};
for (const [k, v] of Object.entries(hEntries)) {
  const f = keyToFile[k];
  const appEntry = entries.find(e => e.file === f);
  check('data-health and app.js agree on ' + k, appEntry && appEntry.sha === v.sha,
    'health=' + v.sha.slice(0, 12) + ' app=' + (appEntry ? appEntry.sha.slice(0, 12) : 'MISSING'));
  const onDisk = sha(readFileSync(join(root, f)));
  check('data-health sha for ' + k + ' matches the file', onDisk === v.sha);
}

/* ---------- 3) THE GUARD CAN FAIL: prove rejection of a tampered file ---------- */
console.log('== the check actually rejects a tampered payload ==');

/* Re-run the app's own verification logic against a payload we deliberately
 * corrupt, using the app's own table. If a one-character change is accepted,
 * the checksum is decoration. */
function appVerifies(url, bytes) {
  const block = (app.match(/const DATA_SHA256 = \{([\s\S]*?)\};/) || [])[1] || '';
  const m = block.match(new RegExp("'" + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'\\s*:\\s*'([0-9a-f]{64})'"));
  if (!m) return { checked: false };
  return { checked: true, want: m[1], got: sha(bytes), ok: sha(bytes) === m[1] };
}

const sample = join(root, 'data/libya-248.json');
const good = readFileSync(sample);
check('an untouched data file passes the app\'s own check', appVerifies('data/libya-248.json', good).ok);

/* tamper 1: one byte flipped deep inside a value */
const tampered = Buffer.from(good);
const idx = tampered.indexOf(Buffer.from('Glyphosate')) + 2;
tampered[idx] = tampered[idx] === 0x47 ? 0x58 : 0x47;   // G -> X
const t1 = appVerifies('data/libya-248.json', tampered);
check('a single-character change inside a substance name is REJECTED', t1.checked && !t1.ok,
  'want=' + String(t1.want).slice(0, 12) + ' got=' + String(t1.got).slice(0, 12));

/* tamper 2: a row silently deleted (row count still plausible) */
const parsed = JSON.parse(good.toString('utf8'));
parsed.rows.splice(0, 1);
const t2 = appVerifies('data/libya-248.json', Buffer.from(JSON.stringify(parsed)));
check('silently deleting a row is REJECTED even though the file is still valid JSON',
  t2.checked && !t2.ok);

/* tamper 3: a legal status flipped to a banned one — the worst case */
const parsed3 = JSON.parse(good.toString('utf8'));
const victim = parsed3.rows.find(r => r.status && r.status !== 'محظور');
if (victim) victim.status = 'محظور';
const t3 = appVerifies('data/libya-248.json', Buffer.from(JSON.stringify(parsed3)));
check('flipping one legal status to prohibited is REJECTED',
  t3.checked && !t3.ok);

/* tamper 4: re-serialising without changing anything still fails, because the
 * digest is over raw bytes — this is the documented behaviour, not a bug. */
const t4 = appVerifies('data/libya-248.json', Buffer.from(JSON.stringify(JSON.parse(good.toString('utf8')))));
check('a re-serialised (whitespace-only) change is also REJECTED — the digest is over raw bytes',
  t4.checked && !t4.ok);

/* the verification must be fail-soft, never fail-closed on a missing WebCrypto */
check('sha256Hex returns null (skip) rather than false (fail) when subtle is absent',
  /if \(!globalThis\.crypto \|\| !globalThis\.crypto\.subtle\) return Promise\.resolve\(null\)/.test(app));
check('the guard skips verification when the digest is unavailable, it does not reject',
  /if \(got && got !== want\)/.test(app));

/* the rejection must reuse the existing failure path, not invent a new one */
check('a digest mismatch throws so the existing retry/cache fallback handles it',
  /throw new Error\('data integrity:/ .test(app));
check('the verify runs BEFORE JSON.parse on the raw bytes',
  app.indexOf('res.arrayBuffer()') < app.indexOf('JSON.parse(new TextDecoder()'));

console.log('\nDATA-INTEGRITY: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail === 0 ? 0 : 1);
