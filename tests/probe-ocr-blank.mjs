/*
 * tests/probe-ocr-blank.mjs — Arabic-hallucination probe (2026-09-23).
 *
 * Purpose: confirm or refute the hypothesis that the OCR engine
 * (Tesseract.js, initialized with 'eng+ara') produces Arabic glyphs from
 * images that contain NO Arabic (including a completely blank image).
 *
 * Method: the probe runs the app's REAL pipeline — window.OcrModule.recognize(),
 * the exact function behind the camera-scan button (app.js line ~835) — in a
 * real Chromium against a local static server. No engine settings are touched:
 * the worker is created exactly as production creates it (langs 'eng+ara',
 * OEM 1, vendored core/lang paths, SW-style caching disabled).
 *
 * Cases (all 800×600, no text at all):
 *   blank : pure white canvas, every pixel identical
 *   noise : random RGB noise (seeded LCG for reproducibility)
 *   logo  : white background + black circle outline + sine wave (curved logo)
 *
 * Usage: node tests/probe-ocr-blank.mjs [blank|noise|logo|all]   (default: all)
 * Output: one JSON line per case with rawText, Arabic/latin/digit counts,
 *         per-pass breakdown and timing — consumed by
 *         docs/ocr-arabic-hallucination-diagnosis.md.
 */
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const PORT = 8099;
const BASE = 'http://127.0.0.1:' + PORT;
const CASES = (process.argv[2] || 'all');
const wanted = CASES === 'all' ? ['blank', 'noise', 'logo', 'label'] : [CASES];

/* ---------- tiny static server (child process, killed on exit) ---------- */
const SERVER_SRC = `
const http = require('http'), fs = require('fs'), path = require('path');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.wasm': 'application/wasm', '.gz': 'application/gzip', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(process.cwd(), p);
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(${PORT}, '127.0.0.1', () => console.log('LISTENING'));
`;
const srv = spawn(process.execPath, ['-e', SERVER_SRC], { stdio: ['ignore', 'pipe', 'inherit'] });
srv.stdout.on('data', () => {});
process.on('exit', () => srv.kill());

/* wait for the server */
{
  const t0 = Date.now();
  while (Date.now() - t0 < 15000) {
    try { const r = await fetch(BASE + '/index.html'); if (r.ok) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
}

/* ---------- in-page helpers (run inside the app's own page context) ---------- */
const MAKE_AND_SCAN = `
  async (caseName) => {
    const W = 800, H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    if (caseName === 'blank') {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    } else if (caseName === 'noise') {
      let s = 123456789;                       // seeded LCG: reproducible noise
      const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      const id = ctx.createImageData(W, H);
      for (let i = 0; i < id.data.length; i += 4) {
        id.data[i] = rnd() * 256 | 0;
        id.data[i + 1] = rnd() * 256 | 0;
        id.data[i + 2] = rnd() * 256 | 0;
        id.data[i + 3] = 255;
      }
      ctx.putImageData(id, 0, 0);
    } else if (caseName === 'logo') {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#111111'; ctx.lineWidth = 6;
      ctx.beginPath();                          // circle outline (curved logo)
      ctx.arc(W / 2, 220, 120, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();                          // sine wave
      for (let x = 80; x <= 720; x += 8) {
        const y = 450 + Math.sin((x - 80) / 60) * 40;
        if (x === 80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (caseName === 'label') {
      /* label-like: Latin text + barcode stripes + color bands, NO Arabic —
       * the closest synthetic analog of the user's 17 foreign-label photos */
      ctx.fillStyle = '#f4f2ec'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1c5c34'; ctx.fillRect(0, 0, W, 90);   // header band
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px sans-serif';
      ctx.fillText('AGROPLEX 480 EC', 24, 58);
      ctx.fillStyle = '#111111'; ctx.font = '22px sans-serif';
      ctx.fillText('ACTIVE INGREDIENT:', 24, 140);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('CHLORPYRIFOS 480 g/L', 24, 175);
      ctx.font = '20px sans-serif';
      ctx.fillText('EMULSIFIABLE CONCENTRATE', 24, 210);
      ctx.fillText('NET CONTENT: 1 L', 24, 245);
      for (let x = 24; x < 776; x += 6) {                    // barcode stripes
        const bh = 30 + ((x * 7) % 3) * 12;
        ctx.fillStyle = '#000000';
        if ((x / 6 | 0) % 2 === 0) ctx.fillRect(x, 290, 3, bh);
      }
      ctx.fillStyle = '#c8a028'; ctx.fillRect(0, 360, W, 50); // hazard band
      ctx.fillStyle = '#111111'; ctx.font = '18px sans-serif';
      ctx.fillText('KEEP OUT OF REACH OF CHILDREN', 24, 392);
      ctx.strokeStyle = '#333333'; ctx.lineWidth = 4;         // curved logo mark
      ctx.beginPath(); ctx.arc(700, 430, 55, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '16px sans-serif';
      ctx.fillText('Batch no. 2341A  EXP 09/2028', 24, 470);
      ctx.fillText('Reg. no. EPA-4787-XX', 24, 505);
    }

    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], caseName + '-probe.png', { type: 'image/png' });

    const AR = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/g;
    const t0 = performance.now();
    try {
      const res = await window.OcrModule.recognize(file);   // REAL pipeline, unchanged
      const dt = Math.round(performance.now() - t0);
      const text = String(res.text || '');
      const ar = text.match(AR) || [];
      const passes = Array.isArray(res.passes) ? res.passes.map(p => {
        const pt = String((p && p.text) || '');
        return { variant: p && p.variant, psm: p && p.psm,
                 textLen: pt.length, arabic: (pt.match(AR) || []).length };
      }) : [];
      return {
        case: caseName, ok: true, ms: dt,
        arabicCount: ar.length,
        arabicSample: [...new Set(ar)].slice(0, 24).join(' '),
        latinCount: (text.match(/[A-Za-z]/g) || []).length,
        digitCount: (text.match(/[0-9]/g) || []).length,
        rawLength: text.length,
        rawText: text,
        cas: res.cas || null,
        candidates: Array.isArray(res.candidates) ? res.candidates.length : null,
        confidence: typeof res.confidence === 'number' ? Math.round(res.confidence) : null,
        rejected: res.rejected || null,
        passes: passes
      };
    } catch (e) {
      return { case: caseName, ok: false, ms: Math.round(performance.now() - t0),
               error: String((e && e.message) || e) };
    }
  }
`;

/* ---------- run ---------- */
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ar']
});
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/index.html#/scan', { waitUntil: 'networkidle0', timeout: 45000 });
  await page.waitForFunction(() => !!(window.OcrModule && window.OcrModule.recognize),
    { timeout: 20000 });

  for (const c of wanted) {
    const out = await Promise.race([
      /* evaluate as a CALL EXPRESSION (a bare function string would
       * stringify to {} without running) */
      page.evaluate('(' + MAKE_AND_SCAN + ')(' + JSON.stringify(c) + ')'),
      new Promise(res => setTimeout(() => res(
        { case: c, ok: false, error: 'probe watchdog: 240s exceeded' }), 240000))
    ]);
    console.log('PROBE_JSON ' + JSON.stringify(out));
  }
} finally {
  await browser.close();
  srv.kill();
  process.exit(0);
}
