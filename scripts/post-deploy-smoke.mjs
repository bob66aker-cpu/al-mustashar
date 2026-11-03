#!/usr/bin/env node
/*
 * post-deploy-smoke.mjs — فحص ما بعد النشر (قراءة فقط، طلبات GET فقط)
 *   node scripts/post-deploy-smoke.mjs https://al-mustashar.pages.dev [--expect 1.19.36] [--no-headers]
 * يتحقق أن الموقع المنشور هو الإصدار المقصود وأن ملفات القسم والقواعد تُخدم وأن
 * الترويسات الأساسية سليمة. لا يكتب شيئًا ولا يغيّر حالة الموقع.
 */
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) { console.error('usage: post-deploy-smoke.mjs <base-url> [--expect X.Y.Z] [--no-headers]'); process.exit(2); }
const ei = process.argv.indexOf('--expect');
const expect = ei > 0 ? process.argv[ei + 1] : null;
const checkHeaders = !process.argv.includes('--no-headers');
let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
async function get(p) { const r = await fetch(base + p, { cache: 'no-store' }); return r; }
async function json(p) { const r = await get(p); return { r, j: r.ok ? await r.json().catch(() => null) : null }; }

const v = await json('/version.json');
ok('version.json reachable', v.r.ok && v.j, 'HTTP ' + v.r.status);
if (v.j) {
  console.log('  version=' + v.j.version + ' shell=' + v.j.shell + ' released=' + v.j.released);
  if (expect) ok('version equals expected ' + expect, v.j.version === expect, v.j.version);
}
const sw = await get('/sw.js');
const swText = sw.ok ? await sw.text() : '';
ok('sw.js reachable and cache name matches version.json shell', sw.ok && v.j && swText.includes("'" + v.j.shell + "'"), v.j && v.j.shell);
if (checkHeaders) ok('sw.js is never cached (Cache-Control no-cache/no-store)', /no-cache|no-store/.test(sw.headers.get('cache-control') || ''), sw.headers.get('cache-control') || 'none');
const mf = await json('/manifest.json');
ok('manifest.json valid (standalone, icons incl. maskable)', mf.j && mf.j.display === 'standalone' && (mf.j.icons || []).some(i => i.purpose === 'maskable') && (mf.j.icons || []).some(i => /512/.test(i.sizes)));
for (const i of (mf.j && mf.j.icons) || []) { const r = await get('/' + i.src); ok('icon ' + i.src, r.ok && /image\//.test(r.headers.get('content-type') || '')); }
const man = await json('/data/tws/manifest.json');
ok('tws manifest: 338 cards, 65 crops', man.j && man.j.counts && man.j.counts.cards === 338 && man.j.counts.crops === 65, man.j && JSON.stringify(man.j.counts));
const sec = await json('/data/tws/sections.json');
const arr = sec.j && (sec.j.sections || sec.j);
ok('sections.json: 338 cards', Array.isArray(arr) && arr.length === 338, arr && arr.length);
const a7 = await json('/data/tws/appendix7.json');
ok('appendix7.json: 9 sections', a7.j && a7.j.secs && a7.j.secs.length === 9);
for (const f of ['/data/tws/crops.json', '/data/tws/labels.json', '/data/tws/card_i18n.json', '/data/libya-248.json', '/data/libya-500.json', '/data/eu.json', '/data/epa.json', '/data/epa-cancelled.json']) {
  const r = await get(f); ok('serves ' + f, r.ok);
}
const idx = await get('/');
const html = idx.ok ? await idx.text() : '';
ok('index.html reachable and links the recommendations section', idx.ok && html.includes('#/tws'));
if (checkHeaders) {
  const csp = idx.headers.get('content-security-policy') || '';
  ok('CSP header present, no remote script/connect', /default-src 'self'/.test(csp) && !/https?:\/\//.test(csp.replace(/https:\/\/[^ ;]*fonts[^ ;]*/g, '')), csp.slice(0, 80));
  ok('nosniff + X-Frame-Options DENY', idx.headers.get('x-content-type-options') === 'nosniff' && /deny/i.test(idx.headers.get('x-frame-options') || ''));
}
const al = await get('/.well-known/assetlinks.json');
console.log('  assetlinks.json: ' + (al.ok ? 'present (needed only for a verified Play TWA)' : 'absent (OK for sideload APK / PWA)'));
console.log('==============================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
