#!/usr/bin/env node
/* tests/tess-wordbox-guard.test.mjs — حارس دائم لصناديق الكلمات
 * ------------------------------------------------------------------
 * Why this file exists. The `blocks: null` discovery showed that a test
 * can be green while the real recognition path never runs: the code read
 * correctly, every earlier test passed, and the ingredient-region detector
 * had in fact been receiving an EMPTY word list the whole time. A test
 * that only checks the source, or only checks a stub, cannot catch that.
 *
 * So this guard runs the actual engine on an actual label, through the
 * actual collector the app uses, and asserts on what came back:
 *
 *   1) Tesseract's DEFAULT output set really does return null blocks
 *      in this build. If it ever stops doing so the guard would be
 *      proving nothing, and it must say so.
 *   2) Asking for blocks returns a real structure.
 *   3) The collector yields REAL leaf words with REAL geometry — boxes
 *      that are positive-area, inside the image, and paired with numeric
 *      confidences.
 *   4) Every word is collected ONCE. The bug that tripled a label
 *      collected blocks, paragraphs and lines as well; the node census
 *      below makes a recurrence impossible to miss.
 *   5) The recognised text is the label, read once.
 */
import fs from 'fs';
import crypto from 'crypto';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { fail++; console.log('  FAIL ' + m); } };

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 600000,
});

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  /* ---- build a label the engine can certainly read, then probe ---- */
  const probe = await page.evaluate(async () => {
    OcrModule.setTuning({ exposeEngine: true, wordFilter: 0 });
    const c = document.createElement('canvas');
    c.width = 900; c.height = 620;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 900, 620);
    g.fillStyle = '#101010';
    g.font = 'bold 46px "DejaVu Sans", Arial, sans-serif';
    g.fillText('ACTIVE INGREDIENT', 40, 140);
    g.font = '38px "DejaVu Sans", Arial, sans-serif';
    g.fillText('Paraquat Dichloride 42%', 40, 230);
    g.fillText('Chlorpyrifos 480 SC', 40, 300);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const out = await OcrModule.probeEngine(blob);
    OcrModule.setTuning({});
    return out;
  });
  /* The bundle carries no static version string, so a version claim
     read out of a source file would prove nothing about the phone. What
     CAN be proved is that the bytes the preview serves are exactly the
     bytes this repository holds (sha256, both sides), plus the v6
     behavioural signature asserted below. The vendored version itself
     (tesseract.js 6.0.1) is recorded in docs/THIRD_PARTY.md. */
  const servedBytes = await page.evaluate(async () => {
    const buf = await (await fetch('/vendor/tesseract/worker.min.js')).arrayBuffer();
    return [...new Uint8Array(buf)];
  });
  const repoBytes = [...fs.readFileSync(
    new URL('../vendor/tesseract/worker.min.js', import.meta.url))];
  const sha = b => crypto.createHash('sha256').update(Buffer.from(b)).digest('hex').slice(0, 16);
  const served = { worker: sha(servedBytes), repo: sha(repoBytes) };

  console.log('  probe: ' + JSON.stringify({
    served, version: probe.version, defaultBlocksIsNull: probe.defaultBlocksIsNull,
    blockCount: probe.blockCount, collected: probe.collected,
    confidence: probe.engineConfidence, nodes: probe.raw && probe.raw.nodes,
  }));

  /* ---- 1) the engine really is the build this guard was written for ---- */
  ok(served.worker === served.repo && servedBytes.length === repoBytes.length,
    'the engine bundle the phone downloads is byte-for-byte the one in this repo — ' +
    served.worker + ' / ' + servedBytes.length + ' bytes');
  ok(servedBytes.length > 100000,
    'that bundle is the real worker, not an error page — ' + servedBytes.length + ' bytes');
  /* if this ever fails the rest of the file is still valid, but the
     "default is null" half of the guard has lost its teeth — say so */
  ok(probe.defaultBlocksIsNull === true,
    'Tesseract v6 hands back null blocks unless they are asked for — ' + probe.defaultBlocksIsNull);
  ok(probe.askedBlocksIsArray === true && probe.blockCount > 0,
    'asking for blocks returns a real structure — ' + probe.blockCount + ' blocks');
  ok(typeof probe.engineConfidence === 'number' && probe.engineConfidence > 0,
    'the engine reports a real confidence — ' + probe.engineConfidence);

  /* ---- 2) real leaf words with real geometry ---- */
  ok(probe.collected > 0, 'the app collector produced words — ' + probe.collected);
  ok(probe.collected >= 6, 'a whole label yields more than a handful of words — ' + probe.collected);
  const first = probe.firstWords[0] || {};
  ok(typeof first.text === 'string' && first.text.length > 0,
    'the first word is text, not a placeholder — "' + first.text + '"');
  const boxes = probe.firstWords.filter(w => typeof w.x0 === 'number');
  ok(boxes.length === probe.firstWords.length, 'every word carries a box');
  ok(boxes.every(w => w.x1 > w.x0 && w.y1 > w.y0),
    'every box has positive area — ' + JSON.stringify(probe.firstWords.map(w => [w.x0, w.y0, w.x1, w.y1])));
  ok(boxes.every(w => w.x0 >= 0 && w.y0 >= 0 && w.x1 <= 900 && w.y1 <= 620),
    'every box lies inside the image — the coordinates are real, not zeroed');
  ok(boxes.every(w => typeof w.conf === 'number' && w.conf >= 0 && w.conf <= 100),
    'every confidence is a number in 0..100 — ' + JSON.stringify(probe.firstWords.map(w => w.conf)));

  /* ---- 3) each word once — the tripling bug cannot come back quietly ---- */
  const nodes = (probe.raw && probe.raw.nodes) || {};
  ok(nodes.words > 0, 'the engine returned leaf words of its own — ' + nodes.words);
  ok(probe.collected === nodes.words,
    'the collector returns exactly the leaf words, nothing more — collected ' +
    probe.collected + ' vs engine leaves ' + nodes.words);
  ok(nodes.words > nodes.lines,
    'the structure really is nested (words below lines) — ' +
    JSON.stringify(nodes) + ' — so the old triple-count could recur if the leaf test were removed');
  const words = probe.firstWords.map(w => w.text);
  ok(new Set(words).size === words.length,
    'no word is emitted twice — ' + JSON.stringify(words));

  /* ---- 4) the text is the label, read once ---- */
  const txt = String(probe.text || '');
  ok(txt.length > 10, 'the collector hands back real text — "' + txt.slice(0, 60) + '"');
  const twice = (txt.match(/Paraquat/g) || []).length;
  ok(twice <= 2, '"Paraquat" is not repeated into a wall of text — ' + twice + ' time(s)');
  ok(txt.indexOf('Chlorpyrifos') > -1, 'the second line was read too');

  ok(errors.length === 0, 'zero console errors — ' + JSON.stringify(errors.slice(0, 3)));
} finally {
  await browser.close();
}

console.log('\nTESS-WORDBOX-GUARD: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
