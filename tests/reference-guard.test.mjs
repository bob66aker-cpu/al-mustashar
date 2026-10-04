/*
 * tests/reference-guard.test.mjs — حارس data/reference.json
 * ------------------------------------------------------------------
 * المرجع الموحّد الذي تقرأ منه طبقة العرض الشرح والأشكال حصراً. هذا
 * الحارس يقول ثلاثة أشياء، وكلها قابلة للفشل:
 *
 *   1) التغطية: كل قيمة فريدة في كل قاعدة (تصنيف أو حالة) لها مدخل في
 *      قسم مصدرها. قيمة بلا مدخل = الفحص يفشل، لا تمرّ صامتة.
 *   2) السيادة: حالات قرار 500 مثبتة بالعدّ (Approved 183 · REV 129 ·
 *      RAR 92 · REV* 7) — أي تغيير في البيانات أو في المرجع يُفشل.
 *   3) الاستقلال: الأقسام ستة مستقلة؛ لا نصّ مُكرَّر بين قسمين إلا ما
 *      يكون منقولاً ومُعلَناً في قسمه (fallbackSection) — ولا معنى
 *      بلا مصدر، ولا رمز «مشروح» بلا نصّ.
 *
 * تشغيل: node tests/reference-guard.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};
const read = p => JSON.parse(readFileSync(join(root, p), 'utf8'));
const unescape = s => String(s).replace(/\\'/g, "'").replace(/\\\\/g, '\\');

const REF = read('data/reference.json');
const SECTIONS = REF.sections || {};
const LANGS = ['ar', 'en', 'fr', 'zh'];
const HARD = /[,\/+]/;

/* the six mandated sections, and which files each one covers */
const COVERAGE = {
  libya500: ['data/libya-500.json'],
  libya248: ['data/libya-248.json'],
  eu: ['data/eu.json'],
  epa: ['data/epa.json', 'data/epa-cancelled.json'],
  canada: ['data-optional/canada.json'],
  australia: ['data-optional/australia.json']
};
/* no database may exist outside the six sections */
const ALL_FILES = Object.values(COVERAGE).flat();

check('the reference has EXACTLY the six mandated sections',
  Object.keys(SECTIONS).sort().join(',') === Object.keys(COVERAGE).sort().join(','),
  Object.keys(SECTIONS).join(','));
check('every section declares the exports it covers, and they are the real files',
  Object.keys(COVERAGE).every(k => JSON.stringify(SECTIONS[k].exports) === JSON.stringify(COVERAGE[k])),
  Object.keys(COVERAGE).map(k => k + '=' + JSON.stringify(SECTIONS[k].exports)).join(' '));

/* ---------- 1) COVERAGE: every unique value in every database ---------- */
const fold = x => String(x == null ? '' : x).toLowerCase().replace(/[.\s]/g, '');
const entryOf = (sec, code) => {
  const cats = sec.categories || {};
  const key = String(code == null ? '' : code).trim();
  if (cats[key]) return cats[key];
  for (const e of Object.values(cats))
    for (const sh of e.shapes || [])
      if (fold(sh) === fold(key)) return e;
  if (sec.fallbackSection && SECTIONS[sec.fallbackSection]) return entryOf(SECTIONS[sec.fallbackSection], code);
  return null;
};
const partsOf = (cell, sec) => String(cell || '').trim().split(HARD).map(p => p.trim()).filter(Boolean)
  .flatMap(p => p.includes('.') && p.split('.').every(q => entryOf(sec, q.trim())) ? p.split('.').map(q => q.trim()) : [p]);

let cellTotal = 0, codeTotal = 0;
for (const [name, files] of Object.entries(COVERAGE)) {
  const sec = SECTIONS[name];
  for (const f of files) {
    const rows = read(f).rows;
    const total = COVERAGE[name].reduce((n, g) => n + read(g).rows.length, 0);
    check(`${name}: the section row count matches the file(s) it documents`,
      sec.rows === total, `${sec.rows} vs ${total}`);
    /* every printed category cell is recorded as a shape */
    const cells = [...new Set(rows.map(r => String(r.category || '').trim()).filter(Boolean))].sort();
    const declared = new Set((sec.shapes || []).map(fold));
    const missing = cells.filter(c => !declared.has(fold(c)));
    check(`${name}: every printed category CELL of ${f} is a recorded shape`,
      missing.length === 0, 'missing: ' + JSON.stringify(missing.slice(0, 6)));
    cellTotal += cells.length;
    /* every code the display resolves out of those cells has an entry */
    const codes = [...new Set(cells.flatMap(c => partsOf(c, sec)))].sort();
    const noEntry = codes.filter(c => !entryOf(sec, c));
    check(`${name}: every CODE of ${f} has a reference entry`,
      noEntry.length === 0, 'no entry: ' + JSON.stringify(noEntry.slice(0, 6)));
    const unexplainedButSilent = codes.filter(c => {
      const e = entryOf(sec, c);
      return e && e.explained !== true && !(SECTIONS[name].unexplainedCodes || []).includes(c)
        && !(e.note && String(e.note).length > 0);
    });
    check(`${name}: a code its guide does not explain is declared, not silent`,
      unexplainedButSilent.length === 0, JSON.stringify(unexplainedButSilent.slice(0, 6)));
    codeTotal += codes.length;
    /* every status value has an entry, and its raw form is recorded too */
    const statuses = [...new Set(rows.map(r => String(r.status || '').trim()).filter(Boolean))].sort();
    const noStatus = statuses.filter(s => !(sec.statusCodes || {})[s]);
    check(`${name}: every STATUS value of ${f} has a reference entry`,
      noStatus.length === 0, 'no entry: ' + JSON.stringify(noStatus));
    const raws = [...new Set(rows.map(r => String(r.status_raw || '').trim()).filter(Boolean))].sort();
    const forms = Object.values(sec.statusCodes || {}).flatMap(e => e.forms || []);
    const noForm = raws.filter(r => !forms.includes(r));
    check(`${name}: every raw status FORM of ${f} is recorded in the section`,
      noForm.length === 0, 'not recorded: ' + JSON.stringify(noForm.slice(0, 6)));
  }
}
console.log(`  (${cellTotal} printed cells · ${codeTotal} resolved codes checked)`);

/* ---------- 2) SOVEREIGNTY: the decree-500 status counts are pinned ---- */
{
  const rows = read('data/libya-500.json').rows;
  const counts = {};
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  check('Decree-500 statuses are exactly Approved 183 · REV 129 · RAR 92 · REV* 7',
    JSON.stringify(counts) === JSON.stringify({ REV: 129, Approved: 183, RAR: 92, 'REV*': 7 }),
    JSON.stringify(counts));
  check('the reference declares those same four codes and no other',
    JSON.stringify(Object.keys(SECTIONS.libya500.statusCodes).sort()) === JSON.stringify(['Approved', 'RAR', 'REV', 'REV*']));
  check('each 500 status is explained from the decree guide itself (source named)',
    Object.values(SECTIONS.libya500.statusCodes).every(e => e.explained === true
      && !!e.source && /500/.test(String(e.source))));
}

/* ---------- 3) INDEPENDENCE: six sections, no silent borrowing -------- */
{
  const owner = {};
  for (const [name, sec] of Object.entries(SECTIONS))
    for (const [key, texts] of Object.entries(sec.texts || {}))
      (owner[key] = owner[key] || []).push(name);
  const shared = Object.entries(owner).filter(([, list]) => list.length > 1);
  check('no explanation text is owned by two sections at once',
    shared.length === 0, JSON.stringify(shared.slice(0, 5)));
  check('a transferred code names the section it came from and owns nothing',
    Object.entries(SECTIONS).every(([, sec]) =>
      Object.values(sec.categories || {})
        .filter(e => e.transferredFrom)
        .every(e => SECTIONS[e.transferredFrom] && !(sec.texts || {})[e.i18nKey])));
  check('every explained entry carries a source and four languages',
    Object.entries(SECTIONS).every(([name, sec]) =>
      [...Object.values(sec.categories || {}), ...Object.values(sec.statusCodes || {}),
       ...Object.values(sec.statusVariants || {})]
        .filter(e => e.explained === true)
        .every(e => e.source && LANGS.every(l => e.meaning && e.meaning[l]))));
  check('an explained code without a meaning (or the reverse) exists nowhere',
    Object.entries(SECTIONS).every(([name, sec]) =>
      [...Object.values(sec.categories || {}), ...Object.values(sec.statusCodes || {})]
        .every(e => e.transferredFrom ? (e.explained === false && !!e.meaning && !!e.note)
                                       : ((e.explained === true) === !!(e.meaning && e.i18nKey)))));
  check('an unexplained entry always says why (a note), never a blank',
    Object.entries(SECTIONS).every(([name, sec]) =>
      [...Object.values(sec.categories || {}), ...Object.values(sec.statusCodes || {}),
       ...Object.values(sec.statusVariants || {})]
        .filter(e => e.explained !== true)
        .every(e => e.note && e.note.length > 4)));
  /* the single declared fallback is the Libyan one and is declared in place */
  const withFallback = Object.entries(SECTIONS).filter(([, s]) => s.fallbackSection);
  check('the only cross-section fallback is libya248 → libya500, declared in the file',
    withFallback.length === 1 && withFallback[0][0] === 'libya248'
    && withFallback[0][1].fallbackSection === 'libya500');
  check('the 248 section marks its transferred codes instead of claiming its own guide',
    (SECTIONS.libya248.transferredCodes || []).length > 0
    && (SECTIONS.libya248.transferredCodes || []).every(c => {
      const e = SECTIONS.libya248.categories[c];
      return e && e.explained === false && e.meaning && e.source && e.transferredFrom === 'libya500';
    }));
  check('EU and EPA explanations are their own export text, never each other’s',
    Object.keys(SECTIONS.eu.texts).every(k => k.startsWith('st.eu.'))
    && Object.keys(SECTIONS.epa.texts).every(k => k.startsWith('st.epa.')));
  check('the packs declare their codes unexplained instead of borrowing the Libyan table',
    SECTIONS.canada.unexplainedCodes.length === 0 && SECTIONS.canada.shapes.length === 0
    && Object.values(SECTIONS.canada.statusCodes).every(e => e.explained === false)
    && Object.values(SECTIONS.australia.statusCodes).every(e => e.explained === false)
    && SECTIONS.australia.unexplainedCodes.length > 0);
}

/* ---------- 4) the display really reads THIS file, and nothing else --- */
{
  const app = readFileSync(join(root, 'src/app.js'), 'utf8');
  const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  check('app.js pins the reference by sha256 and loads it before the databases',
    /'data\/reference\.json':\s*'[0-9a-f]{64}'/.test(app)
    && /loadReference\(\)\.then\(\(\) => loadAll\(\)\)/.test(app));
  check('app.js holds no category/status explanation table of its own',
    !/LEGEND_CAT_KEYS|LEGEND_STATUS_KEYS|CAT_FOLD_KEYS/.test(app)
    && !/'st\.500\.[a-z]+':\s*'/.test(app) && !/'legend\.cat\.[IVFANHRM]':\s*'/.test(app));
  check('src/i18n.js carries none of the source explanations any more',
    !/'(st\.500\.approved\.explain|st\.500\.rev\.explain|legend\.cat\.I|legend\.cat\.V|st\.eu\.approved|st\.epa\.registered|st\.248\.banned)':/.test(i18n));
  check('the dictionaries keep the no-guessing hint and the unknown-code badges',
    /'legend\.cat\.unknown':/.test(i18n) && /'legend\.cat\.unknownNamed':/.test(i18n)
    && /'st\.500\.unknown':/.test(i18n) && /'st\.unknown':/.test(i18n));
  check('i18n exposes the register() door the reference comes through',
    /function register\(byLang\)/ .test(i18n) && /register: register/.test(i18n));
  check('the service worker precaches the reference with the data',
    /'\.\/data\/reference\.json'/.test(sw));
  check('each card resolves its category inside ITS OWN source section',
    /catTitle\(c, x\.k\)/.test(readFileSync(join(root, 'src/cards.js'), 'utf8')));
}

console.log('==============================');
console.log(`REFERENCE GUARD: PASS ${pass}   FAIL ${fail}`);
process.exit(fail ? 1 : 0);
