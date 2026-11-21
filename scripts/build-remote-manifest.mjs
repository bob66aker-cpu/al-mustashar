#!/usr/bin/env node
/*
 * build-remote-manifest.mjs — يبني data/remote-manifest.json
 * بصمة SHA-256 وعدد صفوف كل قاعدة دولية قابلة للتحديث من داخل نسخة أندرويد (src/remote-data.js).
 * يُستدعى من scripts/bump-shell.mjs، فيتجدد مع كل تحديث بيانات. الليبيتان خارجه عمدًا.
 *   node scripts/build-remote-manifest.mjs
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const FILES = ['data/eu.json', 'data/epa.json', 'data/epa-cancelled.json',
  'data-optional/canada.json', 'data-optional/canada.manifest.json',
  'data-optional/australia.json', 'data-optional/australia.manifest.json'];
const ver = JSON.parse(fs.readFileSync('version.json', 'utf8'));
const dc = ver.dataCheck || {};
const KEYS = ['eu', 'epa', 'epa-cancelled', 'canada', 'australia'];
const built = KEYS.map(k => dc[k] || '').sort().pop();
const files = {};
for (const p of FILES) {
  const raw = fs.readFileSync(p);
  const e = { sha256: crypto.createHash('sha256').update(raw).digest('hex'), bytes: raw.length };
  if (!p.endsWith('.manifest.json')) e.rows = JSON.parse(raw.toString('utf8')).rows.length;
  files[p] = e;
}
const dataCheck = {}; for (const k of KEYS) if (dc[k]) dataCheck[k] = dc[k];
const out = { schema: 1, built, dataCheck, files };
fs.writeFileSync('data/remote-manifest.json', JSON.stringify(out, null, 1) + '\n');
console.log('remote-manifest: built ' + built + ', ' + Object.keys(files).length + ' files');
