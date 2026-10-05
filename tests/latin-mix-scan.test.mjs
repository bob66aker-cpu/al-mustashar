/* latin-mix-scan.test.mjs — حارس كاشف التجاور (D47)
 * يبني ملفات مؤقتة ويفحصها، ويثبت ثلاث قواعد:
 *   1) التجاور (حرف عربي ملاصق لحرف لاتيني بلا فاصل) ⇒ إصابة.
 *   2) الكلمة اللاتينية الحرّة في سطر عربي ⇒ مرور (صفر قوائم سماح).
 *   3) التشكيل بين الحرفين لا يفلت الإصابة.
 * أمثلة الإصابة الحرفية تعيش هنا (tests/ خارج نطاق الكاشف) ولا
 * تُكتب أبداً داخل ملف خاضع للمسح.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanText, scanFile, collectScope, loadExclusions, partition } from '../scripts/latin-mix-scan.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

let pass = 0, fail = 0;
function check(name, ok, detail) {
  ok ? pass++ : fail++;
  console.log((ok ? '  PASS ' : '  FAIL ') + name + (detail ? ' — ' + detail : ''));
}

const dir = mkdtempSync(join(tmpdir(), 'latin-mix-'));
const A = 'العربية';                       // Arabic sample
const LAT = 'zebra';                       // Latin sample
const HIT = A[0] + LAT;                    // adjacency -> must be caught
const DIA = A[0] + 'َ' + LAT;         // tashkeel between -> still caught
const SEP = A + ' ' + LAT;             // space between -> free word, allowed

try {
  /* ---- 1) adjacency is a hit ---- */
  const h = scanText('سطر فيه ' + HIT + ' وسط الجملة.\n');
  check('1. adjacency of an Arabic and a Latin letter is a hit',
        h.length === 1 && h[0].token === HIT, JSON.stringify(h[0] && h[0].token));

  /* ---- 2) the free Latin word passes: no allowlist, just a separator ---- */
  const free = scanText('المصدر ' + LAT + ' و ' + A + ' و activeSources و 133-06-2 و src/app.js\n');
  check('2. a free Latin word, a CAS and a path in an Arabic line all pass',
        free.length === 0, 'hits=' + free.length);

  /* ---- 3) diacritics do not let it escape ---- */
  const d = scanText('سطر فيه ' + DIA + ' في Wort.\n');
  check('3. a tashkeel between the two letters does not hide the hit',
        d.length === 1, 'hits=' + d.length);

  /* ---- the detector reports the position, so a real file can be fixed ---- */
  const f = join(dir, 'sample.md');
  writeFileSync(f, 'سطر نظيف ' + LAT + '.\nسطر ملوَّث ' + HIT + ' هنا.\n', 'utf8');
  const fh = scanFile(f);
  check('4. the hit carries its line number',
        fh.length === 1 && fh[0].line === 2, JSON.stringify(fh));

  /* ---- 5) a purely Arabic or purely Latin file is clean ---- */
  check('5. pure Arabic text is clean', scanText(A + ' و ' + A + '.\n').length === 0);
  check('6. pure Latin text is clean', scanText(LAT + ' ' + LAT + '\n').length === 0);

  /* ---- 7) the declared exclusions cannot rot ---- */
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { exclusions } = loadExclusions(root);
  let stale = 0, orphan = 0;
  for (const f of collectScope(root)) {
    const rel = f.split(root + '/')[1];
    const hits = scanFile(f);
    const { declared, undeclared } = partition(hits, exclusions, rel);
    stale += undeclared.length;                       // a hit nobody declared => the gate fails
    for (const d of declared) {
      if (!exclusions.some(e => e.file === rel && e.line === d.line && e.token === d.token
          && e.reason && e.class)) orphan++;
    }
  }
  check('7. every declared exclusion still matches a real hit, with a reason',
        stale === 0 && orphan === 0, 'undeclared=' + stale + ' malformed=' + orphan);
  const manifest = loadExclusions(root);
  const openBad = manifest.exclusions.filter(e => e.status === 'open' && !(manifest.questions || {})[e.question]);
  const closedBad = manifest.exclusions.filter(e => e.status === 'closed' && !(manifest.rulings || {})[e.ruling]);
  check('8. every exclusion carries its verdict: open names an open question, closed names a recorded ruling',
        openBad.length === 0 && closedBad.length === 0,
        'open=' + manifest.exclusions.filter(e => e.status === 'open').length
        + ' closed=' + manifest.exclusions.filter(e => e.status === 'closed').length);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('\n==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
console.log('==============================');
process.exit(fail ? 1 : 0);
