#!/usr/bin/env node
/*
 * build-gallery.mjs — يبني حزم معرض الصور من قوائم الاختيار المعتمدة gallery/selected-<crop>.json.
 * يحمّل كل صورة من مصدرها المفتوح (Commons / iNaturalist)، يصغّرها إلى 800px عرضًا بصيغة webp،
 * ويكتب data/tws/gallery/img/<id>.webp و data/tws/gallery/<crop>.json ثم index.json (يُجمع منها).
 * لا يخترع: كل صورة تحمل المؤلف والرخصة والرابط كما سُجّلت عند الجمع.
 * Usage: node scripts/build-gallery.mjs [outdir=data/tws/gallery]
 */
import fs from 'node:fs';
import sharp from 'sharp';
const OUT = process.argv[2] || 'data/tws/gallery';
const UA = 'AlMustasharGallery/1.0 (https://github.com/bob66aker-cpu/al-mustashar; bob66aker@gmail.com)';
fs.mkdirSync(OUT + '/img', { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const index = { schema: 1, built: new Date().toISOString().slice(0, 10), crops: {} };
async function build(it) {
  let buf = null;
  for (let i = 0; i < 4 && !buf; i++) {
    try { const r = await fetch(it.thumb, { headers: { 'User-Agent': UA } }); if (r.ok) buf = Buffer.from(await r.arrayBuffer()); } catch (e) {}
    if (!buf) await sleep(2000 * (i + 1));
  }
  if (!buf) { console.error('SKIP (download failed): ' + it.id); return null; }
  const out = await sharp(buf).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(`${OUT}/img/${it.id}.webp`, out.data);
  await sleep(400);
  return { id: it.id, kind: it.kind, file: it.id + '.webp', w: out.info.width, h: out.info.height, bytes: out.data.length,
    license: it.license, author: it.author, page: it.page, species: it.species, src: it.src, stage: it.stage || null, stage_basis: it.stage_basis || null };
}
const crops = {};
for (const f of fs.readdirSync('gallery').filter(x => /^selected-.+\.json$/.test(x))) {
  const items = JSON.parse(fs.readFileSync('gallery/' + f, 'utf8'));
  const crop = items[0].crop_id; crops[crop] = crops[crop] || { crop_id: crop, items: [] };
  for (const it of items) { const r = await build(it); if (r) crops[crop].items.push({ ...r, n: it.n }); }
}
/* بنك الآفات المشتركة: صورة كائن واحدة تُربط ببطاقات عدة محاصيل عبر gallery/map.json (لا تُكرَّر الملفات) */
if (fs.existsSync('gallery/bank.json') && fs.existsSync('gallery/map.json')) {
  const bank = JSON.parse(fs.readFileSync('gallery/bank.json', 'utf8')), map = JSON.parse(fs.readFileSync('gallery/map.json', 'utf8'));
  const built = {};
  for (const it of bank) { const r = await build(it); if (r) built[it.id] = r; }
  for (const [crop, cards] of Object.entries(map)) {
    const per = {};
    for (const [n, ids] of Object.entries(cards)) for (const id of ids) if (built[id]) (per[id] = per[id] || []).push(Number(n));
    crops[crop] = crops[crop] || { crop_id: crop, items: [] };
    for (const [id, ns] of Object.entries(per)) crops[crop].items.push({ ...built[id], n: ns.length === 1 ? ns[0] : ns });
  }
}
for (const [crop, man] of Object.entries(crops)) {
  fs.writeFileSync(`${OUT}/${crop}.json`, JSON.stringify(man));
  const cards = {}; let bytes = 0;
  man.items.forEach(x => { [].concat(x.n).forEach(k => { cards[k] = (cards[k] || 0) + 1; }); bytes += x.bytes; });
  index.crops[crop] = { count: man.items.length, bytes, cards };
  console.log(crop, man.items.length, 'images', Math.round(bytes / 1024) + ' KB');
}
fs.writeFileSync(OUT + '/index.json', JSON.stringify(index));
