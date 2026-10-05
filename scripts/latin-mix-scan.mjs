/* كاشف التجاور — latin-mix-scan.mjs
 * usage: node scripts/latin-mix-scan.mjs [<file-or-dir> ...]
 *        (بلا وسائط = النطاق المعلَن أسفله)
 *
 * الأساس (قرار المالك 4.10.2026 · D47): حدث مرتين داخل جملة عربية، مرة
 * في ملاحظة المراجعة الثانية (68e9e83) ومرة في جولة التنظيف، والسبب
 * أن cjk-scan كاشف CJK/FFFD حصراً ولا يرى التلوث اللاتيني. فهذان
 * الفاحصان مكملان لا متراكبان: cjk-scan يبقى على نطاقه، وهذا الفاحص
 * على نطاقه.
 *
 * القاعدة الوحيدة: حرف عربي ملاصق لحرف لاتيني داخل الكلمة نفسها — بلا
 * فاصل بينهما — إصابة. صفر قوائم سماح: الكلمة اللاتينية الحرّة في سطر
 * عربي (activeSources · جدول Not approved · أرقام CAS · المسارات)
 * استخدام مشروع يمرّ، لأن الفاصل مسافة أو علامة ترقيم فلا تجاور.
 *
 * القيد المعلن الإلزامي: التلوث المفصول بمسافة خارج نطاق هذا الكاشف —
 * يُدرس فاحص تشخيصي منفصل إن تكرر.
 *
 * النطاق: PROJECT_MEMORY.md وكل ملفات .md داخل مجلد docs بتمامه.
 * src/ و tests/ خارج النطاق: لاتينيته مقصودة.
 *
 * أمثلة الإصابة تُكتب هنا وفي الاختبار فقط (خارج النطاق)، لا داخل أي
 * ملف خاضع للمسح.
 */
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/* المدى العربي كما في قرار المالك: \u0600-\u06FF */
const ARABIC_RE = /[؀-ۿ]/;
/* الحرف اللاتيني بخاصية script في يونيكود، لا مدى ساجد */
const LATIN_RE = /\p{Script=Latin}/u;
/* التشكيل لا يفصل بين حرفين متجاورين: نزيله قبل الحكم على التجاور */
const DIACRITIC_RE = /[ً-ْ]/g;
/* الكلمة = سلسلة حروف وعلامات؛ ما عداها (مسافة · ترقيم · backtick ·
 * شرطة · slash · @ …) فاصل ينهي الكلمة */
const WORD_RE = /[\p{L}\p{M}]+/gu;

/** يُعيد إصابات التجاور في نصّ واحد: [{ line, token, col }] */
export function scanText(text) {
  const hits = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(WORD_RE)) {
      const core = m[0].replace(DIACRITIC_RE, '');
      if (ARABIC_RE.test(core) && LATIN_RE.test(core)) {
        hits.push({ line: i + 1, token: m[0], col: m.index + 1 });
      }
    }
  });
  return hits;
}

/** يُعيد MAPK: مسار -> إصابات */
export function scanFile(file) {
  return scanText(readFileSync(file, 'utf8'));
}

/** النطاق المعلَن: ملف واحد + شجرة docs كاملة */
export function collectScope(root = process.cwd()) {
  const files = [];
  const pm = join(root, 'PROJECT_MEMORY.md');
  if (existsSync(pm)) files.push(pm);
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) files.push(p);
    }
  };
  const docs = join(root, 'docs');
  if (existsSync(docs)) walk(docs);
  return files;
}

/* ---------- الإعفاءات المعلَنة (ليست قوائم سماح) ----------
 * الملف يسرد كل إصابة قائمة مع موضعها وسببها. الكاشف يكتشف الكل بلا
 * استثناء؛ والإعفاء هنا إعلانٌ عن إصابة محالة إلى قرار المالك، لا
 * قاعدة تخطّي. مُدخل لا يقابل إصابة قائمة = مُدخل متقادم يُرفض.
 */
export function loadExclusions(root = process.cwd()) {
  const f = join(root, 'scripts', 'latin-mix-scan-exclusions.json');
  if (!existsSync(f)) return { exclusions: [], questions: {} };
  return JSON.parse(readFileSync(f, 'utf8'));
}

/** يفصل بين الإصابة المُعلَنة(non pass) والأخرى */
export function partition(hits, exclusions, relFile) {
  const declared = [], undeclared = [];
  const match = (h) => exclusions.some(e =>
    e.file === relFile && e.line === h.line && e.token === h.token);
  for (const h of hits) (match(h) ? declared : undeclared).push(h);
  return { declared, undeclared };
}

/* ---------- واجهة سطر الأوامر ---------- */
const isMain = process.argv[1] && process.argv[1].endsWith('latin-mix-scan.mjs');
if (isMain) {
  const args = process.argv.slice(2);
  const root = process.cwd();
  const files = args.length
    ? args.flatMap((a) => {
        const st = statSync(a);
        if (!st.isDirectory()) return [a];
        return collectScope(root).filter((f) => f.startsWith(a));
      })
    : collectScope(root);

  if (!files.length) {
    console.log('نطاق فارغ: لا ملف خاضع للمسح (' + root + ')');
    process.exit(0);
  }
  const { exclusions, questions } = loadExclusions(root);
  let bad = 0, declaredTotal = 0;
  for (const f of files) {
    const rel = relative(root, f);
    const hits = scanFile(f);
    const { declared, undeclared } = partition(hits, exclusions, rel);
    for (const h of undeclared) {
      console.log('  ' + rel + ':' + h.line + ':' + h.col + '  ' + JSON.stringify(h.token));
    }
    for (const d of declared) {
      const meta = exclusions.find(e => e.file === rel && e.line === d.line && e.token === d.token);
      console.log('  -- ' + rel + ':' + d.line + '  ' + JSON.stringify(d.token) + '  (مُعلن: ' + meta.class + ')');
    }
    console.log((undeclared.length ? 'FAIL ' : 'ok   ') + rel +
      '  تجاور=' + hits.length + '  مُعلن=' + declared.length);
    bad += undeclared.length;
    declaredTotal += declared.length;
  }
  console.log('=====');
  console.log('ملفات: ' + files.length + '   اصابات غير معلنة: ' + bad + '   اعفاءات معلنة: ' + declaredTotal);
  for (const [k, q] of Object.entries(questions || {})) console.log('سؤال للمالك ' + k + ': ' + q);
  console.log(bad ? 'FAIL latin-mix-scan' : 'PASS latin-mix-scan');
  process.exit(bad ? 1 : 0);
}
