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
for (const f of fs.readdirSync('gallery').filter(x => /^selected-.+\.json$/.test(x))) {
  const items = JSON.parse(fs.readFileSync('gallery/' + f, 'utf8'));
  const crop = items[0].crop_id, man = { crop_id: crop, items: [] };
  for (const it of items) {
    let buf = null;
    for (let i = 0; i < 4 && !buf; i++) {
      try { const r = await fetch(it.thumb, { headers: { 'User-Agent': UA } }); if (r.ok) buf = Buffer.from(await r.arrayBuffer()); } catch (e) {}
      if (!buf) await sleep(2000 * (i + 1));
    }
    if (!buf) { console.error('SKIP (download failed): ' + it.id); continue; }
    const img = sharp(buf).rotate().resize({ width: 800, withoutEnlargement: true });
    const out = await img.webp({ quality: 74 }).toBuffer({ resolveWithObject: true });
    fs.writeFileSync(`${OUT}/img/${it.id}.webp`, out.data);
    man.items.push({ id: it.id, n: it.n, kind: it.kind, file: it.id + '.webp', w: out.info.width, h: out.info.height, bytes: out.data.length,
      license: it.license, author: it.author, page: it.page, species: it.species, src: it.src, stage: it.stage || null, stage_basis: it.stage_basis || null });
    await sleep(400);
  }
  fs.writeFileSync(`${OUT}/${crop}.json`, JSON.stringify(man));
  const cards = {}; let bytes = 0;
  man.items.forEach(x => { [].concat(x.n).forEach(k => { cards[k] = (cards[k] || 0) + 1; }); bytes += x.bytes; });
  index.crops[crop] = { count: man.items.length, bytes, cards };
  console.log(crop, man.items.length, 'images', Math.round(bytes / 1024) + ' KB');
}
fs.writeFileSync(OUT + '/index.json', JSON.stringify(index));
