#!/usr/bin/env node
// img-pilot.mjs — جمع مرشّحات صور مفتوحة الرخصة من Wikimedia Commons (قراءة فقط، لا يغيّر التطبيق).
// يسجّل لكل صورة: الملف، المؤلف، الرخصة، الرابط. القبول: CC0 / Public domain / CC BY / CC BY-SA فقط.
import fs from 'node:fs';
const UA = 'AlMustasharImgPilot/1.0 (https://github.com/bob66aker-cpu/al-mustashar; bob66aker@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';
const SPECIES = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OK = /^(CC0|Public domain|PDM|CC BY(-SA)? \d)/i;
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
async function q(params) {
  const u = API + '?format=json&origin=*&' + new URLSearchParams(params);
  for (let i = 0; i < 4; i++) {
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (r.ok) return r.json();
    await new Promise(s => setTimeout(s, 2000 * (i + 1)));
  }
  throw new Error('API failed ' + u);
}
const info = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '900', iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|Categories|Credit' };
async function viaCategory(name) {
  const d = await q({ action: 'query', generator: 'categorymembers', gcmtitle: 'Category:' + name, gcmtype: 'file', gcmlimit: '60', ...info });
  return Object.values((d.query || {}).pages || {});
}
async function viaSearch(name) {
  const d = await q({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: '"' + name + '"', gsrlimit: '40', ...info });
  return Object.values((d.query || {}).pages || {});
}
const out = [];
fs.mkdirSync('img-pilot/thumbs', { recursive: true });
for (const sp of SPECIES) {
  let pages = [], via = 'category';
  for (const n of sp.names) { pages = await viaCategory(n); if (pages.length) { via = 'category:' + n; break; } }
  if (!pages.length) { via = 'search'; for (const n of sp.names) { pages = await viaSearch(n); if (pages.length) { via = 'search:' + n; break; } } }
  const c = [];
  for (const p of pages) {
    const ii = (p.imageinfo || [])[0]; if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    const m = ii.extmetadata || {}; const lic = strip((m.LicenseShortName || {}).value);
    if (!OK.test(lic)) continue;
    if (Math.min(ii.width, ii.height) < 600) continue;
    c.push({ file: p.title, page: ii.descriptionurl, thumb: ii.thumburl, w: ii.width, h: ii.height, license: lic, author: strip((m.Artist || {}).value), desc: strip((m.ImageDescription || {}).value).slice(0, 240), cats: strip((m.Categories || {}).value).slice(0, 300) });
  }
  c.sort((a, b) => b.w * b.h - a.w * a.h);
  const top = c.slice(0, 5);
  let k = 0;
  for (const t of top) {
    const r = await fetch(t.thumb, { headers: { 'User-Agent': UA } });
    if (r.ok) { const f = `img-pilot/thumbs/${sp.id}-${++k}.jpg`; fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); t.local = f; }
    await new Promise(s => setTimeout(s, 800));
  }
  out.push({ id: sp.id, ar: sp.ar, names: sp.names, via, total_files: pages.length, accepted_license: c.length, candidates: top });
  console.log(sp.id, via, pages.length, c.length);
}
fs.writeFileSync('img-pilot/candidates.json', JSON.stringify(out, null, 1));
