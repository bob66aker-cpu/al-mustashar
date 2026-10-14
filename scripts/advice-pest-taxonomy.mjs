/* مصنّف الآفات — جولة D61
 * usage: node scripts/advice-pest-taxonomy.mjs [offset] [limit]
 * يجمع الآفات الفريدة من كل الأدلة المُحاصَدة، ويطلب من GBIF موضعها التصنيفي،
 * ويصنّفها لمجموعات عربية: حشرات/عناكب/فطريات/فطريات كاذبة/بكتيريا/فيروسات/
 * نماتود/بزاقات/أخرى. لا تصنيف بلا تطابق GBIF مقبول — والفاشل يبقى مجهولاً
 * فلا تُبنى له بطاقة (لا اختراع). المخرج: data/advice/evidence/_pest-taxonomy.json
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const EV = join(process.cwd(), 'data', 'advice', 'evidence');
const OUT = join(EV, '_pest-taxonomy.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 2; i++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'advice-taxonomy/1.0' } });
      return { status: r.status, text: await r.text() }; }
    catch (e) { if (i === 1) return { status: 0, text: '' }; await sleep(900); }
  }
}
function classify(j) {
  const k = (j.klass || '').toLowerCase(), p = (j.phylum || '').toLowerCase(), o = (j.order || '').toLowerCase();
  const realm = (j.realm || '').toLowerCase(), kg = (j.kingdom || '').toLowerCase();
  if (realm.includes('riboviria') || kg.includes('vir') || k.includes('viri')) return 'virus';
  if (k === 'insecta' || o === 'coleoptera' || o === 'lepidoptera' || o === 'diptera' || o === 'hemiptera' || o === 'thysanoptera' || o === 'hymenoptera' || o === 'orthoptera' || o === 'blattodea' || o === 'ziphiidae') return 'insect';
  if (k === 'arachnida' && (o === 'acari' || o === 'trombidiformes' || o === 'sarcoptiformes')) return 'mite';
  if (kingdom === 'bacteria' || p.includes('proteobacteria') || p.includes('firmicutes') || p.includes('actinobacter') || p.includes('pseudomonadota') || p.includes('bacillota')) return 'bacterium';
  if (k === 'arachnida' || o === 'trombidiformes' || o === 'acari' || o === 'sarcoptiformes') { if (o === 'trombidiformes' || o === 'acari' || o === 'sarcoptiformes') return 'mite'; }
  if (p === 'oomycota' || k === 'oomycetes') return 'pseudo_fungus';
  if (['ascomycota','basidiomycota','zygomycota','mucoromycota','chytridiomycota','microsporidia','entomophthoromycota'].includes(p)) return 'fungus';
  if (['pseudomonadota','bacillota','actinomycetota','cyanobacteriota','campylobacterota','myxococcota'].includes(p) || k.includes('bacter')) return 'bacterium';
  if (p === 'nematoda' || k === 'nematoda') return 'nematode';
  if (p === 'mollusca' || k === 'gastropoda' || o === 'stylommatophora') return 'mollusc';
  return 'other';
}
const GROUP_AR = { insect: 'حشرات', mite: 'عناكب', fungus: 'فطريات', pseudo_fungus: 'فطريات كاذبة',
  bacterium: 'بكتيريا', virus: 'فيروسات', nematode: 'نماتود', mollusc: 'بزاقات وحلزونات', weed: 'أعشاب ضارة', other: 'أخرى', unknown: 'غير مصنَّف' };
let tax = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { schema: 1, generated_by: 'scripts/advice-pest-taxonomy.mjs', pests: {} };
const uniq = new Map();
for (const f of readdirSync(EV).filter(x => x.endsWith('.json') && !x.startsWith('_'))) {
  const d = JSON.parse(readFileSync(join(EV, f), 'utf8'));
  for (const pt of d.eppo.pests) {
    const bare = pt.name.replace(/\s*\([A-Z0-9]{5,6}\)\s*$/, '').trim();
    if (!uniq.has(pt.code)) uniq.set(pt.code, bare);
  }
}
const todo = [...uniq.entries()].filter(([c]) => !tax.pests[c]);
const offset = Number(process.argv[2] || 0), limit = Number(process.argv[3] || 9999);
const batch = todo.slice(offset, offset + limit);
let ok = 0, fail = 0;
for (const [code, name] of batch) {
  await sleep(350);
  const g = await get('https://api.gbif.org/v1/species/match?name=' + encodeURIComponent(name));
  let j = null; try { j = JSON.parse(g.text); } catch {}
  if (j && (j.status === 'ACCEPTED' || j.status === 'SYNONYM') && j.confidence >= 85 && (j.usageKey || j.acceptedUsageKey)) {
    const key = j.status === 'SYNONYM' ? j.acceptedUsageKey : j.usageKey;
    let group = classify(j);
    if (group === 'other' && /virus|viroid|viridae|virales/i.test(name)) group = 'virus';
    if (group === 'other' && /phytoplasma/i.test(name)) group = 'bacterium';
    tax.pests[code] = { name, gbif_key: key, gbif_url: 'https://www.gbif.org/species/' + key,
      family: j.family || null, order: j.order || null, klass: j.klass || null, phylum: j.phylum || null,
      kingdom: j.kingdom || null, realm: j.realm || null, status: j.status, confidence: j.confidence, group, group_ar: GROUP_AR[group] };
    ok++;
  } else {
    tax.pests[code] = { name, group: 'unknown', group_ar: GROUP_AR.unknown, note: 'لا تطابق GBIF مقبول — بلا بطاقة' };
    fail++;
  }
}
writeFileSync(OUT, JSON.stringify(tax, null, 2) + '\n');
const counts = {};
for (const v of Object.values(tax.pests)) counts[v.group] = (counts[v.group] || 0) + 1;
console.log('TAXONOMY: this-batch ok=' + ok + ' fail=' + fail + ' | total=' + Object.keys(tax.pests).length);
console.log('groups:', JSON.stringify(counts));
