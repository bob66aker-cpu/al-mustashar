/* scripts/advice-generate.mjs — مولّد بطاقات الإصابات «نبات ← نوع ← إصابة» — جولة D61
 * usage: node scripts/advice-generate.mjs
 *
 * العقد (لا اختراع — كل مدخل مُسنَد):
 *   1) الآفة يجب أن تكون في قائمة EPPO المُجَلَبة لذاك المحصول (data/advice/evidence/<id>.json).
 *   2) نوع الإصابة من تصنيف GBIF المخزَّن في _pest-taxonomy.json؛ المجهول (unknown)
 *      لا يُبنى له نوع ولا بطاقة ولا قائمة.
 *   3) «مظاهر الإصابة» و«العلاج» لا يأتيان إلا من ديوان مصدر مُسنَد (ملف في _dossiers/)
 *      يحمل رابط https وناشراً وتاريخ جلب؛ والبطاقة المرقّمة لا تُكتب خارج ديوان.
 *   4) بقية آفات EPPO تُدرج في ملف مرجعي منفصل (يُحمَّل عند الطلب) — عرض هويّتها لا اختراع علاج.
 *
 * المخرجات:
 *   data/advice/dossiers.json            — الدواوين كلها (يُقرأ مع الحزمة الأساسية)
 *   data/advice/infections/<crop>.json   — النواة الصغيرة: الأنواع + البطاقات المرقّمة (تُجهَّز مسبقاً)
 *   data/advice/infections/<crop>.ref.json — القائمة المرجعية الكبيرة (تُحمَّل عند الطلب وتُخزَّن)
 *   data/advice/manifest.json            — يُوسَّع بكل المحاصيل + ميتا الإصابات
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

const EV = 'data/advice/evidence';
const DOSS = EV + '/_dossiers';
const OUT_DIR = 'data/advice/infections';
const MANIFEST = 'data/advice/manifest.json';
mkdirSync(OUT_DIR, { recursive: true });

const TYPE_ORDER = ['insect', 'mite', 'fungus', 'pseudo_fungus', 'bacterium', 'virus', 'nematode', 'weed', 'mollusc', 'other'];
const HOST_RANK = { 'Major host': 0, 'Host': 1 };
const fail = m => { throw new Error('[generate] ' + m); };
const decode = s => String(s || '')
  .replace(/&#039;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/* ---------- 1) الدواوين: لا ديوان بلا مصدر ولا مظاهر ---------- */
const dossiers = {};
for (const f of readdirSync(DOSS).filter(x => x.endsWith('.json'))) {
  const code = f.replace(/\.json$/, '');
  const d = JSON.parse(readFileSync(DOSS + '/' + f, 'utf8'));
  if (d.schema !== 1) fail(f + ': schema');
  if (d.pest_code !== code) fail(f + ': pest_code');
  if (!d.name_ar || !d.name_ar.trim()) fail(f + ': name_ar مفقود');
  if (!d.source || !/^https:\/\//.test(d.source.url || '')) fail(f + ': source.url غير https');
  if (!d.source.publisher || !d.source.retrieved) fail(f + ': source.publisher/retrieved');
  if (!Array.isArray(d.symptoms_ar) || d.symptoms_ar.length < 2) fail(f + ': مظاهر أقل من 2');
  if (!Array.isArray(d.management_ar) || d.management_ar.length < 1) fail(f + ': علاج فارغ');
  if (!['A', 'B', 'C'].includes(d.evidence)) fail(f + ': evidence');
  dossiers[code] = {
    name_ar: d.name_ar, pest_name_en: d.pest_name_en, evidence: d.evidence,
    source: d.source, symptoms_ar: d.symptoms_ar, management_ar: d.management_ar
  };
}
if (!Object.keys(dossiers).length) fail('لا دواوين');

/* ---------- 2) تصنيف الآفات ---------- */
const tax = JSON.parse(readFileSync(EV + '/_pest-taxonomy.json', 'utf8')).pests;

/* ---------- 3) المحاصيل المُحاصَدة ---------- */
const cropFiles = readdirSync(EV).filter(x => x.endsWith('.json') && !x.startsWith('_'));
if (!cropFiles.length) fail('لا أدلة محاصيل');
const evidence = {};
for (const f of cropFiles) {
  const ev = JSON.parse(readFileSync(EV + '/' + f, 'utf8'));
  if (!ev.eppo || !Array.isArray(ev.eppo.pests)) fail(f + ': بلا قائمة EPPO');
  evidence[ev.crop_id] = ev;
}

/* تغطية كل ديوان عبر المحاصيل — لترتيب البطاقات (الأكثر انتشاراً أولاً) */
const cover = {};
for (const ev of Object.values(evidence))
  for (const p of ev.eppo.pests)
    if (dossiers[p.code]) cover[p.code] = (cover[p.code] || 0) + 1;

const bare = name => decode(String(name || '').replace(/\s*\([A-Z0-9]{5,6}\)\s*$/, '').trim());

/* ---------- 4) كتابة ملفين لكل محصول (نواة + مرجع) ---------- */
let totalCards = 0, totalOthers = 0;
const stats = [];
for (const [id, ev] of Object.entries(evidence)) {
  const cards = [], others = [];
  /* تجريد: لكل كود أفضل صف — «Major host» أولاً (الصف مُكرَّر في الدليل أحياناً) */
  const best = {};
  for (const p of ev.eppo.pests) {
    if (!best[p.code] || (HOST_RANK[p.type] ?? 2) < (HOST_RANK[best[p.code].type] ?? 2)) best[p.code] = p;
  }
  for (const p of Object.values(best)) {
    const t = tax[p.code];
    if (!t || t.group === 'unknown') continue;           // بلا تصنيف = لا نوع = لا بطاقة
    if (dossiers[p.code]) {
      cards.push({
        type: t.group, code: p.code, host: p.type,
        name_ar: dossiers[p.code].name_ar,
        sci: bare(t.name || p.name), family: t.family || null,
        dossier: p.code                                   // النص من dossiers.json
      });
    } else {
      others.push({ type: t.group, code: p.code, name: bare(t.name || p.name), host: p.type });
    }
  }
  cards.sort((a, b) =>
    ((HOST_RANK[a.host] ?? 2) - (HOST_RANK[b.host] ?? 2)) ||
    ((cover[b.code] || 0) - (cover[a.code] || 0)) ||
    a.name_ar.localeCompare(b.name_ar, 'ar'));
  others.sort((a, b) =>
    ((HOST_RANK[a.host] ?? 2) - (HOST_RANK[b.host] ?? 2)) ||
    a.name.localeCompare(b.name));
  /* ترقيم كل نوع على حدة: 1..N */
  const seq = {};
  for (const c of cards) { seq[c.type] = (seq[c.type] || 0) + 1; c.n = seq[c.type]; }
  const types = [];
  for (const ty of TYPE_ORDER) {
    const c = cards.filter(x => x.type === ty).length;
    const o = others.filter(x => x.type === ty).length;
    if (c + o > 0) types.push({ id: ty, cards: c, others: o, count: c + o });
  }
  const core = {
    schema: 1, crop_id: id, generated_by: 'scripts/advice-generate.mjs',
    built: new Date().toISOString().slice(0, 10),
    crop: {
      ar: ev.candidate.ar, en: ev.candidate.en, fr: ev.candidate.fr,
      sci: ev.gbif.canonicalName || ev.candidate.sci_expected,
      family: ev.gbif.family || null
    },
    eppo: {
      code: ev.eppo.code, overview_url: ev.eppo.overview_url,
      pests_url: ev.eppo.pests_url, pests_total_rows: ev.eppo.pests_total_rows
    },
    types, cards
  };
  writeFileSync(OUT_DIR + '/' + id + '.json', JSON.stringify(core, null, 2) + '\n');
  writeFileSync(OUT_DIR + '/' + id + '.ref.json', JSON.stringify({
    schema: 1, crop_id: id, generated_by: 'scripts/advice-generate.mjs',
    built: core.built, others
  }, null, 2) + '\n');
  totalCards += cards.length; totalOthers += others.length;
  stats.push([id, cards.length, others.length, types.length]);
}

/* ---------- 5) ملف الدواوين الموحّد ---------- */
writeFileSync('data/advice/dossiers.json', JSON.stringify({
  schema: 1, generated_by: 'scripts/advice-generate.mjs',
  built: new Date().toISOString().slice(0, 10),
  count: Object.keys(dossiers).length, dossiers
}, null, 2) + '\n');

/* ---------- 6) manifest: كل المحاصيل ---------- */
const mf = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const seen = new Set();
const crops = [];
for (const c of (mf.crops || [])) {          // العشرة القديمة أولاً كما هي
  if (!evidence[c.id]) fail('manifest قديم بلا دليل: ' + c.id);
  crops.push({ id: c.id, file: c.file, inf: OUT_DIR + '/' + c.id + '.json', name_ar: c.name_ar, name_en: c.name_en, name_fr: c.name_fr });
  seen.add(c.id);
}
const rest = Object.keys(evidence).filter(id => !seen.has(id))
  .sort((a, b) => evidence[a].candidate.ar.localeCompare(evidence[b].candidate.ar, 'ar'));
for (const id of rest) {
  const ev = evidence[id];
  crops.push({
    id, inf: OUT_DIR + '/' + id + '.json',
    name_ar: ev.candidate.ar, name_en: ev.candidate.en, name_fr: ev.candidate.fr
  });
}
mf.crops = crops;
mf.infections = {
  dir: OUT_DIR + '/', ref_suffix: '.ref',
  dossiers_file: 'data/advice/dossiers.json',
  types: TYPE_ORDER, built: new Date().toISOString().slice(0, 10),
  crops: crops.length, cards_total: totalCards, others_total: totalOthers,
  note_ar: 'بطاقات مرقّمة (مظاهر + علاج) من دواوين مسندة؛ وقائمة مرجعية لبقية آفات EPPO بلا اختراع. الآفات غير المصنَّفة لا تُعرض.'
};
writeFileSync(MANIFEST, JSON.stringify(mf, null, 2) + '\n');

console.log('GENERATE: crops=' + crops.length + ' cards=' + totalCards + ' others=' + totalOthers + ' dossiers=' + Object.keys(dossiers).length);
console.log('top cards:', stats.sort((a, b) => b[1] - a[1]).slice(0, 12).map(s => s.join('/')).join(' '));
