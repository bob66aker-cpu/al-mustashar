#!/usr/bin/env node
/*
 * tests/data-packs.test.mjs — المرحلة الثانية: القواعد الاختيارية + الإسناد
 * ------------------------------------------------------------------
 * لا يعيد البناء — بل يتحقق مما يجب أن يبقى صحيحاً في المستودع:
 *   1) الحزمتان مبنيتان بمخطّطنا وmanifest فيه الترخيص والتاريخ والبصمة
 *   2) الإسناد الإلزامي حرفياً في صفحة القواعد وفي القواميس الأربعة
 *   3) الحزم لا تدخل النتائج قبل الضغط (لا تحميل تلقائي في app.js)
 *   4) سطر الخصوصية موجود حرفياً
 *   5) دليل الاستمرارية موجود ويغطي كل قاعدة
 * التشغيل: node tests/data-packs.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
process.chdir(root);

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.js', 'utf8');
const i18n = fs.readFileSync('src/i18n.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const packs = fs.readFileSync('src/packs.js', 'utf8');
const guide = fs.readFileSync('docs/data-update-guide.md', 'utf8');
const ckTool = fs.readFileSync('tools/check-cas-checksums.mjs', 'utf8');

const OGL = 'Contains information licensed under the Open Government Licence – Canada.';
const CCBY = 'Contains information licensed under the Creative Commons Attribution 3.0 Australia licence.';

console.log('=== 1) الحزم مبنية بمخطّطنا ===');
for (const key of ['canada', 'australia']) {
  const f = 'data-optional/' + key + '.json';
  check(key + ': the pack is in the repository', fs.existsSync(f));
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  check(key + ': it has meta + rows', !!(d.meta && Array.isArray(d.rows)));
  check(key + ': every row carries our fields',
    d.rows.every(r => r && typeof r.name === 'string' && r.name &&
      'name_norm' in r && 'cas' in r && 'status' in r && 'status_raw' in r && r.source === key));
  check(key + ': row numbers are sequential from 1',
    d.rows.every((r, i) => r.row === i + 1));
  check(key + ': meta.count equals the real row count', d.meta.count === d.rows.length,
    d.meta.count + ' vs ' + d.rows.length);
  const man = JSON.parse(fs.readFileSync('data-optional/' + key + '.manifest.json', 'utf8'));
  check(key + ': the manifest names the source, licence and date',
    !!man.source && !!man.license && !!man.retrieved_date && !!man.count);
  check(key + ': the manifest sha256 matches the file bytes on disk',
    man.sha256 === createHash('sha256').update(fs.readFileSync(f)).digest('hex'));
  check(key + ': the build script that produced it is committed',
    fs.existsSync('scripts/build-' + key + '.mjs'));
}

console.log('=== 2) الإسناد الإلزامي ===');
{
  check('the OGL-Canada sentence is verbatim in the rules page', html.indexOf(OGL) >= 0);
  check('the CC-BY 3.0 Australia sentence is verbatim in the rules page', html.indexOf(CCBY) >= 0);
  check('both sentences are marked lang="en" (they are English by law)',
    (html.match(/class="attr" lang="en"/g) || []).length === 2);
  check('the attribution is also printed on the card itself, not only in About',
    /packAttribution/.test(app) && /pack-attr/.test(fs.readFileSync('src/cards.js', 'utf8')));
  check('attr.canada exists in all four dictionaries',
    (i18n.match(/'attr\.canada':/g) || []).length === 4);
  check('attr.australia exists in all four dictionaries',
    (i18n.match(/'attr\.australia':/g) || []).length === 4);
  check('the licence and its official URL are in the pack metadata',
    JSON.parse(fs.readFileSync('data-optional/canada.json', 'utf8')).meta.license === 'OGL-Canada' &&
    JSON.parse(fs.readFileSync('data-optional/australia.json', 'utf8')).meta.license === 'CC-BY-3.0-AU');
  check('the AU licence URL is the official CC one',
    JSON.parse(fs.readFileSync('data-optional/australia.json', 'utf8')).meta.license_url
      === 'https://creativecommons.org/licenses/by/3.0/au/');
}

console.log('=== 3) لا نتائج قبل الضغط ===');
{
  check('the optional data files are NOT in the service-worker shell',
    !sw.includes('data-optional/canada.json') && !sw.includes('data-optional/australia.json'));
  check('the app never fetches a pack on boot',
    !/loadAll\([^)]*data-optional/.test(app) && !/SOURCES\s*=\s*\[[^\]]*data-optional/.test(app));
  check('a pack enters the source list only when DB[key] exists',
    /Object\.keys\(PACK_SOURCES\)\.filter\(function \(k\) \{ return !!DB\[k\]; \}\)/.test(app));
  check('the button is the only entry point (one per pack)',
    (app.match(/t\('packs\.download'/g) || []).length === 1 &&
    (fs.readFileSync('index.html', 'utf8').match(/id="packList"/g) || []).length === 1);
  check('the pack wording is farmer language, not technical',
    /packs\.why\.' \+ pack\.key/.test(app)
    && /ليس نصيبًا ليبيا/.test(i18n) && /not a Libyan ruling/.test(i18n));
  check('a downloaded pack is verified by sha256 before it is used',
    /checksum mismatch/.test(packs) && /crypto\.subtle\.digest\('SHA-256'/.test(packs));
  check('the progress is real (streamed bytes), not a fake timer',
    /getReader/.test(packs) && /content-length/.test(packs));
  check('the pack can be deleted (removes rows and cache)', /function remove\(key\)/.test(packs));
  check('an installed pack comes back on the next visit without re-downloading',
    /PacksModule\.list\(\)/.test(app) && /PacksModule\.restore\(k\)/.test(app));
}

console.log('=== 4) سطر الخصوصية ===');
{
  check('the exact privacy sentence is on the About page',
    html.indexOf('التطبيق لا يرفع صور الملصقات أو نصوص البحث.') >= 0);
  check('the old "never leaves the device" sentence is gone from the page (2026-09-30)',
    html.indexOf('صورك وبحثك لا يغادران جهازك أبداً.') < 0
    && i18n.indexOf('صورك وبحثك لا يغادران جهازك أبداً.') < 0);
  check('it is translated in all four dictionaries',
    (i18n.match(/['"]about\.privacy\.lead['"]:/g) || []).length === 4);
  check('the older, longer privacy paragraph is still there (nothing lost)',
    /about\.privacy"/.test(html) || /'about\.privacy':/.test(i18n));
}

console.log('=== 5) دليل الاستمرارية ===');
{
  check('the guide exists', fs.existsSync('docs/data-update-guide.md'));
  for (const needle of ['scripts/build-canada.mjs', 'scripts/build-australia.mjs',
    'tools/check-cas-checksums.mjs', 'data-optional/canada.json', 'data-optional/australia.json',
    'Open Government Licence', 'CC-BY 3.0']) {
    check('the guide names ' + needle, guide.indexOf(needle) >= 0);
  }
  check('the guide states the human review gate (differences log)',
    /سجل الفروق/.test(guide));
  check('the guide says checksum failures are reported, never corrected',
    /يُبلَّغ ولا يُصحَّح/.test(guide) || /تُبلَّغ ولا تُصحَّح/.test(guide));
  check('the guide records the Canadian check-digit failures found in this build',
    /68609-28-3/.test(guide) && /10028-15-1/.test(guide));
  check('the guide explains the missing Australian CAS on purpose',
    /PUBCRIS لا ينشر أرقام CAS/.test(guide));
  check('the checksum tool audits the optional packs too',
    /\['canada', 'australia'\]/.test(ckTool));
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
