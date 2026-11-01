#!/usr/bin/env node
/*
 * stamp-datacheck.mjs — يختم تاريخ آخر تحقق في version.json لقواعد دولية فقط.
 *   node scripts/stamp-datacheck.mjs canada australia [--date 2026-11-16]
 * يرفض ختم القواعد الليبية، ويحافظ على data_updated = أحدث تاريخ (يشترطه tests/verify.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { INTERNATIONAL } from './db-freshness.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const di = argv.indexOf('--date');
const date = di >= 0 ? argv[di + 1] : new Date().toISOString().slice(0, 10);
const dbs = argv.filter((a, i) => !a.startsWith('--') && (di < 0 || i !== di + 1));
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { console.error('bad --date'); process.exit(2); }
if (!dbs.length) { console.error('usage: stamp-datacheck.mjs <db...> [--date YYYY-MM-DD]'); process.exit(2); }
const bad = dbs.filter(d => !INTERNATIONAL.includes(d));
if (bad.length) { console.error('refused (not an international DB): ' + bad.join(', ')); process.exit(2); }
const f = path.join(root, 'version.json');
const vj = JSON.parse(fs.readFileSync(f, 'utf8'));
dbs.forEach(d => { vj.dataCheck[d] = date; });
vj.data_updated = Object.values(vj.dataCheck).sort().pop();
fs.writeFileSync(f, JSON.stringify(vj, null, 2) + '\n');
console.log('stamped ' + dbs.join(', ') + ' = ' + date + ' ; data_updated = ' + vj.data_updated);
