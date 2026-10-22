/*
 * tests/tawsiyat.test.mjs — فحص ساكن لقسم «التوصيات الزراعية» (2026-10-21)
 * ------------------------------------------------------------------
 * عقد البيانات والربط: فهرس data/tws/ مولَّد من data/advice/ بلا اختراع،
 * وحالات النقص محسوبة من المصدر لا من جدول ثابت، والواجهة مربوطة
 * بالقسم الجديد بينما خرج «الإرشاد» القديم من التوجيه.
 * Node-only، قراءة فقط، بلا DOM ولا شبكة (حارس مستقل ينضم للمجموعة الكاملة).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' — ' + extra}`);
  ok ? pass++ : fail++;
};
const J = p => JSON.parse(readFileSync(join(root, p), 'utf8'));

const twsM = J('data/tws/manifest.json');
const twsC = J('data/tws/crops.json');
const twsL = J('data/tws/labels.json');
const adM = J('data/advice/manifest.json');
const dos = J('data/advice/dossiers.json').dossiers;

/* ---------- 1) الفهرس المُولَّد يطابق المصدر حرفياً ---------- */
const coreFiles = readdirSync(join(root, 'data/advice/infections'))
  .filter(f => f.endsWith('.json') && !f.endsWith('.ref.json')).sort();
check('tws: crop count matches data/advice (68 files)',
  twsC.crops.length === coreFiles.length && twsC.crops.length === adM.infections.crops,
  twsC.crops.length + ' vs ' + coreFiles.length);

let cards = 0, mism = [];
for (const f of coreFiles) {
  const core = J('data/advice/infections/' + f);
  const idx = twsC.crops.find(c => c.id === core.crop_id);
  if (!idx) { mism.push(core.crop_id + ': missing'); continue; }
  if (idx.name_ar !== core.crop.ar || idx.name_en !== core.crop.en) mism.push(core.crop_id + ': name');
  if (idx.infections.length !== core.cards.length) mism.push(core.crop_id + ': count');
  else {
    for (let i = 0; i < core.cards.length; i++) {
      const a = core.cards[i], b = idx.infections[i];
      cards++;
      if (a.n !== b.n || a.name_ar !== b.name_ar || a.dossier !== b.dossier || a.type !== b.type || a.sci !== b.sci) {
        mism.push(core.crop_id + '/' + a.n + ': row');
      }
    }
  }
}
check('tws: every card row matches its core file verbatim (n/name/sci/type/dossier)',
  mism.length === 0, mism.slice(0, 4).join(', '));
check('tws: card total matches the declared registry (766)',
  cards === 766 && cards === adM.infections.cards_total, String(cards));
check('tws: manifest counts agree with the index',
  twsM.counts.crops === twsC.crops.length && twsM.counts.cards === cards
  && twsM.counts.dossiers === Object.keys(dos).length, JSON.stringify(twsM.counts));

/* ---------- 2) حالة النقص محسوبة من المصدر ---------- */
const dosKeys = Object.keys(dos);
check('tws: dossier index covers exactly the referenced dossiers (30)',
  JSON.stringify(Object.keys(twsM.dossiers).sort()) === JSON.stringify(dosKeys.slice().sort())
  && dosKeys.length === 30 && dosKeys.length === J('data/advice/dossiers.json').count,
  String(dosKeys.length));
let treatBad = [], evBad = [], refBad = [];
for (const k of dosKeys) {
  const src = !!dos[k].treatment, idx = twsM.dossiers[k];
  if (idx.has_treatment !== src) treatBad.push(k);
  if (idx.evidence !== (dos[k].evidence || '')) evBad.push(k);
  if (!idx.url || !idx.publisher) refBad.push(k);
}
check('tws: has_treatment mirrors the dossier truthfully (8 without schemes)',
  treatBad.length === 0 && dosKeys.filter(k => !dos[k].treatment).length === 8,
  treatBad.join(', '));
check('tws: evidence badges mirror the dossier (A/B only)', evBad.length === 0, evBad.join(', '));
check('tws: every dossier carries a source url + publisher', refBad.length === 0, refBad.join(', '));
let dangling = [];
for (const c of twsC.crops) for (const i of c.infections) if (!twsM.dossiers[i.dossier]) dangling.push(c.id + '/' + i.n);
check('tws: no card references a missing dossier', dangling.length === 0, dangling.slice(0, 4).join(', '));
let noTreatCrops = [];
for (const c of twsC.crops) if (c.infections.some(i => !twsM.dossiers[i.dossier].has_treatment)) noTreatCrops.push(c.id);
check('tws: crops_without_treatment is recomputed from the data',
  JSON.stringify(twsM.crops_without_treatment) === JSON.stringify(noTreatCrops.slice().sort()),
  noTreatCrops.length + ' crops');

/* ---------- 3) التسميات مكتملة باللغتين ---------- */
const arKeys = Object.keys(twsL.ar).sort(), enKeys = Object.keys(twsL.en).sort();
check('tws: labels carry identical key sets in ar and en',
  JSON.stringify(arKeys) === JSON.stringify(enKeys), arKeys.length + ' vs ' + enKeys.length);
const src = readFileSync(join(root, 'src/tawsiyat.js'), 'utf8');
const used = [...src.matchAll(/L\('([a-z_]+)'\)/g)].map(m => m[1]);
const missing = [...new Set(used)].filter(k => !twsL.ar[k]);
check('tws: every label key used by the engine exists in labels.json', missing.length === 0, missing.join(', '));
check('tws: engine embeds the same ar fallbacks as labels.json',
  Object.keys(twsL.ar).every(k => src.includes("'" + k + "'")));

/* ---------- 4) الربط في index.html وapp.js ---------- */
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'src/app.js'), 'utf8');
const i18n = readFileSync(join(root, 'src/i18n.js'), 'utf8');
check('html: the home CTA points at #/tws with the new name',
  html.includes('href="#/tws" id="homeAdviceCta"') && html.includes('data-i18n="advice.cta.title">التوصيات الزراعية'));
check('html: the nav carries data-nav="tws" and no advice link remains',
  html.includes('data-nav="tws"') && !html.includes('data-nav="advice"') && !html.includes('href="#/advice"'));
check('html: the legacy #view-advice section and its old Irsheed script are removed',
  !html.includes('id="view-advice"') && !html.includes('src="src/irsheed.js"')
  && !html.includes('data-view="advice"'));
check('html: src/tawsiyat.js loads before src/app.js',
  html.indexOf('src/tawsiyat.js') > -1 && html.indexOf('src/tawsiyat.js') < html.indexOf('src/app.js'));
check('app: VIEWS lists tws and no longer lists advice',
  /const VIEWS = \[[^\]]*'tws'[^\]]*\]/.test(app) && !/const VIEWS = \[[^\]]*'advice'[^\]]*\]/.test(app));
check('app: applyView mounts Tawsiyat and no longer mounts Irsheed',
  app.includes("if (v === 'tws' && window.Tawsiyat) Tawsiyat.mount();")
  && !app.includes("if (v === 'advice' && window.Irsheed) Irsheed.mount();"));
check('app: currentView accepts sub-routes (#/tws/<crop>/<n>)',
  app.includes("const base = h.split('/')[0];"));
check('i18n: nav.advice renamed in all four languages',
  (i18n.match(/'nav\.advice':/g) || []).length === 4 && i18n.includes("'nav.advice': 'التوصيات'")
  && i18n.includes("'nav.advice': 'Recommendations'"));

/* ---------- 5) محرك القسم: لا شبكة خارجية ولا جرعات ---------- */
check('engine: exported mount + no external origins',
  src.includes('window.Tawsiyat') && !/https?:\/\//.test(src.replace(/https:\/\/gd\.eppo[^\n]*/g, '')));
const fetches = [...src.matchAll(/fetchJSON\('([^']+)'\)/g)].map(m => m[1]);
check('engine: data loads only from data/tws/ + data/advice/',
  fetches.every(u => u.startsWith('data/tws/') || u.startsWith('data/advice/')) && fetches.length >= 3,
  fetches.join(', '));
check('engine: actives render verbatim from the data arrays',
  src.includes('esc(a.ar || a.en)') && src.includes('esc(s)') && !/parseFloat|toFixed/.test(src));
check('engine: sw shell untouched (no SHELL growth)',
  !readFileSync(join(root, 'sw.js'), 'utf8').includes('tawsiyat'));

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
