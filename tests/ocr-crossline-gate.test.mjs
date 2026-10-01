/* tests/ocr-crossline-gate.test.mjs — فيدباك 2: عبور الأسطر
 * ---------------------------------------------------------------------------
 * السبب المقيس للصمت التام: الاسم المطبوع على ثلاثة أسطر كان يُعامَل سطراً
 * سطراً، فلم يُصنع المرشح «ALUMINIUM SULPHATE» أبداً رغم أن المحرك قرأ
 * الملصق كاملاً (130 محرفاً، ثقة 95).
 *
 * ما يُثبَّت هنا، على المصدر الحقيقي (src/ocr.js) لا على نسخة:
 *   1) اسم من ثلاثة أسطر يُلتقط بأسطره وباسمه الكامل.
 *   2) النافذة ≤3 كلمات: لا مرشح من أربع كلمات مهما توفّرت الأسطر.
 *   3) لا عبور إلى سطر ضجيج (رقم تشغيل/وزن) ولا منه — الحدّ الفاصل حقيقي.
 *   4) لا عتبة جودة متحركة: ثوابت المحرك كما هي.
 *   5) لا قائمة تسوية إملائية في المحرك — قرار مرفوض بالأرقام (انظر
 *      docs/night-round-2026-10-01.md): تسوية «sulphate→sulfate» Raising
 *      اقتراباً خاطئاً حاسماً (100) لمادة أخرى على عيّنة المالك نفسها.
 * التشغيل: node tests/ocr-crossline-gate.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);
globalThis.window = globalThis;
require('./../src/ocr.js');
const O = globalThis.OcrModule;

let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? ' :: ' + d : '')); };
const cands = t => O.extractCandidates(t, { filterJunk: true });

const THREE = 'ACTIVE INGREDIENT:\nGROUND\nALUMINIUM\nSULPHATE\n17927-65-0\n88% W/W';
const c = cands(THREE);
check('the two-word name across the line break is a candidate', c.indexOf('ALUMINIUM SULPHATE') >= 0, c.join(' | '));
check('the full printed name across three lines is a candidate', c.indexOf('GROUND ALUMINIUM SULPHATE') >= 0, c.join(' | '));
check('every single-word candidate survives (no word is lost)', ['GROUND', 'ALUMINIUM', 'SULPHATE'].every(w => c.indexOf(w) >= 0));
check('the CAS line produces no word candidate (it is not a name)', c.every(x => x.indexOf('17927') < 0), c.join(' | '));

const FOUR = 'ALUMINIUM\nSULPHATE\nPOTASH\nCHLORIDE';
const c4 = cands(FOUR);
check('the window never exceeds three words',
  c4.every(x => x.split(' ').length <= 3), c4.join(' | '));
check('the three-word spans are the longest ones manufactured', c4.indexOf('ALUMINIUM SULPHATE POTASH') >= 0 && c4.indexOf('SULPHATE POTASH CHLORIDE') >= 0, c4.join(' | '));

const BLOCKED = 'ACTIVE INGREDIENT:\nALUMINIUM\nNET WEIGHT 25 KG\nSULPHATE';
const cb = cands(BLOCKED);
check('the join does not jump over a junk line', cb.indexOf('ALUMINIUM SULPHATE') < 0, cb.join(' | '));
const NOISE_AFTER = 'ALUMINIUM SULPHATE\nBATCH 4471-22-9 LOT 31820';
const cn = cands(NOISE_AFTER);
check('junk after the name is not pulled into a join', !cn.some(x => /^ALUMINIUM SULPHATE BATCH/.test(x)), cn.join(' | '));

/* the pool cap still holds on a pathological input */
const many = [];
for (let i = 0; i < 60; i++) many.push('ALUMINIUM' + i);
check('the 40-candidate cap is unchanged', cands(many.join('\n')).length <= 40, String(cands(many.join('\n')).length));

/* quality constants — not one digit may move */
const src = fs.readFileSync('src/ocr.js', 'utf8');
for (const [label, re] of [
  ['MAX_DIM = 1600', /MAX_DIM:\s*1600/],
  ['UPSCALE_MIN = 1100', /UPSCALE_MIN:\s*1100/],
  ['UPSCALE_MAX = 2000', /UPSCALE_MAX:\s*2000/],
  ['wordFilter = 60', /wordFilter:\s*60/],
  ['sharpGate = 1.0', /sharpGate:\s*1\.0/],
  ['MIN_CONFIDENCE = 45', /MIN_CONFIDENCE\s*=\s*45/],
  ['MAX_PASSES = 14', /MAX_PASSES\s*=\s*14/]
]) check('quality constant untouched: ' + label, re.test(src));

/* the rejected spelling expansion stays rejected until new numbers say otherwise */
const FOLD_MARKERS = ['sulphate\\/gi', 'sulphur\\/gi', 'aluminium\\/gi', 'SPELL_FOLD'];
const found = FOLD_MARKERS.filter(m => src.indexOf(m) >= 0);
check('no spelling-fold substitution is compiled into the engine', found.length === 0, found.join(','));

console.log('\n==============================\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
