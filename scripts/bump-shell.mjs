#!/usr/bin/env node
/* bump-shell.mjs — يرفع رقم الإصدار (patch) وكاش sw.js معًا بعد تغيير ملف مخزَّن في الصدفة (مثل قواعد EU/EPA).
   يطابق ما كان يُفعل يدويًا: sw.js CACHE + version.json (version, shell, released) + package.json + README --expect. */
import fs from 'node:fs';
const vj = JSON.parse(fs.readFileSync('version.json', 'utf8'));
const [a, b, c] = vj.version.split('.').map(Number);
const nv = [a, b, c + 1].join('.');
const n = Number(String(vj.shell).replace(/\D/g, '')) + 1;
const today = new Date().toISOString().slice(0, 10);
let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/const CACHE = 'mustashar-v\d+';/, "const CACHE = 'mustashar-v" + n + "';");
fs.writeFileSync('sw.js', sw);
vj.version = nv; vj.shell = 'mustashar-v' + n; vj.released = today;
fs.writeFileSync('version.json', JSON.stringify(vj, null, 2) + '\n');
const pj = JSON.parse(fs.readFileSync('package.json', 'utf8')); pj.version = nv;
fs.writeFileSync('package.json', JSON.stringify(pj, null, 2) + '\n');
let rd = fs.readFileSync('README.md', 'utf8').replace(/--expect \d+\.\d+\.\d+/, '--expect ' + nv);
fs.writeFileSync('README.md', rd);
console.log('bumped to ' + nv + ' / mustashar-v' + n);
