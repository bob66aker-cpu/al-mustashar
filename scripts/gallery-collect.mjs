#!/usr/bin/env node
/*
 * gallery-collect.mjs — يجمع صورًا مرشَّحة مفتوحة الرخصة لمعرض الآفات (قراءة فقط، لا يغيّر التطبيق).
 * المصادر: Wikimedia Commons (ملفات بترخيص CC0/PD/CC BY/CC BY-SA) و iNaturalist (ملاحظات «بحثية» مؤكدة المجتمع،
 * وبترخيص صورة CC0/CC BY/CC BY-SA فقط). لا NC ولا ND. يسجّل لكل صورة المؤلف والرخصة والرابط ودليل الهوية.
 * Usage: node scripts/gallery-collect.mjs targets.json outdir
 */
import fs from 'node:fs';
const UA = 'AlMustasharGallery/1.0 (https://github.com/bob66aker-cpu/al-mustashar; bob66aker@gmail.com)';
const T = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3] || 'gallery-out';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const OKLIC = /^(CC0|Public domain|PDM|CC BY(-SA)? \d)/i;
async function jget(u) {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(u, { headers: { 'User-Agent': UA } }); if (r.ok) return r.json(); } catch (e) {}
    await sleep(2000 * (i + 1));
  }
  return null;
}
const CAPI = 'https://commons.wikimedia.org/w/api.php?format=json&origin=*&';
const info = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '900', iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription|Categories' };
const pagesOf = d => Object.values(((d || {}).query || {}).pages || {});
async function commons(t) {
  const seen = new Map();
  const add = (ps, via) => { for (const p of ps) if (!seen.has(p.title)) seen.set(p.title, { p, via }); };
  for (const n of t.names || []) {
    add(pagesOf(await jget(CAPI + new URLSearchParams({ action: 'query', generator: 'categorymembers', gcmtitle: 'Category:' + n, gcmtype: 'file', gcmlimit: '80', ...info }))), 'cat:' + n);
    await sleep(500);
  }
  for (const q of t.queries || []) {
    add(pagesOf(await jget(CAPI + new URLSearchParams({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: q, gsrlimit: '50', ...info }))), 'search:' + q);
    await sleep(500);
  }
  const host = t.host ? new RegExp(t.host, 'i') : null;
  const out = [];
  for (const { p, via } of seen.values()) {
    const ii = (p.imageinfo || [])[0]; if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    const m = ii.extmetadata || {}; const lic = strip((m.LicenseShortName || {}).value);
    if (!OKLIC.test(lic) || Math.min(ii.width, ii.height) < 500) continue;
    const desc = strip((m.ImageDescription || {}).value), cats = strip((m.Categories || {}).value);
    const txt = p.title + ' ' + desc + ' ' + cats;
    const nameHit = (t.names || []).some(n => txt.toLowerCase().includes(n.toLowerCase()));
    out.push({ src: 'commons', via, file: p.title, page: ii.descriptionurl, thumb: ii.thumburl, w: ii.width, h: ii.height, license: lic, author: strip((m.Artist || {}).value), desc: desc.slice(0, 240), cats: cats.slice(0, 200), host_hit: host ? host.test(txt) : null, name_hit: nameHit });
  }
  out.sort((a, b) => (b.name_hit - a.name_hit) || ((b.host_hit ? 1 : 0) - (a.host_hit ? 1 : 0)) || (b.w * b.h - a.w * a.h));
  return out.slice(0, 8);
}
async function inat(t) {
  const out = [];
  for (const n of t.inat || []) {
    const tx = await jget('https://api.inaturalist.org/v1/taxa?per_page=1&q=' + encodeURIComponent(n));
    const id = tx && tx.results && tx.results[0] && tx.results[0].id; if (!id) continue;
    const ob = await jget('https://api.inaturalist.org/v1/observations?per_page=30&order_by=votes&quality_grade=research&photos=true&photo_license=cc0,cc-by,cc-by-sa&taxon_id=' + id);
    for (const o of (ob && ob.results) || []) {
      const ph = (o.photos || [])[0]; if (!ph || !/^(cc0|cc-by|cc-by-sa)$/.test(ph.license_code || '')) continue;
      out.push({ src: 'inaturalist', via: 'taxon:' + n + '#' + id, file: 'obs' + o.id, page: o.uri, thumb: String(ph.url).replace('/square.', '/large.'), license: ph.license_code.toUpperCase().replace(/-/g, ' ').replace('CC BY SA', 'CC BY-SA'), author: strip(ph.attribution), desc: strip(o.description || '').slice(0, 200) + ' | taxon: ' + ((o.taxon || {}).name || '') + ' | place: ' + (o.place_guess || ''), faves: o.faves_count || 0, votes: o.cached_votes_total || 0, id_agree: (o.identifications || []).filter(i => i.current).length });
    }
    await sleep(800);
  }
  out.sort((a, b) => b.id_agree - a.id_agree || b.votes - a.votes);
  return out.slice(0, 6);
}
fs.mkdirSync(OUT + '/thumbs', { recursive: true });
const res = [];
for (const t of T) {
  const c = [...await commons(t), ...await inat(t)];
  let k = 0;
  for (const x of c) {
    try {
      const r = await fetch(x.thumb, { headers: { 'User-Agent': UA } });
      if (r.ok) { x.local = `${OUT}/thumbs/${t.id}-${++k}.jpg`; fs.writeFileSync(x.local, Buffer.from(await r.arrayBuffer())); }
    } catch (e) {}
    await sleep(500);
  }
  res.push({ id: t.id, ar: t.ar, names: t.names, host: t.host || null, candidates: c });
  console.log(t.id, 'commons', c.filter(x => x.src === 'commons').length, 'inat', c.filter(x => x.src !== 'commons').length);
}
fs.writeFileSync(OUT + '/candidates.json', JSON.stringify(res, null, 1));
