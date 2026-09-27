#!/usr/bin/env node
/*
 * tests/run-baseline.cjs — 3.1: one-shot runner for the real-label baseline
 * Starts tests/static-server.mjs as a child, then runs tests/label-scan.mjs
 * (the existing measurement harness) against it; both die when this exits.
 * Usage: node tests/run-baseline.cjs [from] [to]   (default 1..17)
 */
const { spawn } = require('child_process');
const root = require('path').resolve(__dirname, '..');

const FROM = process.argv[2] || '1';
const TO = process.argv[3] || '17';

const srv = spawn('node', ['tests/static-server.mjs'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stdout.on('data', d => process.stdout.write('[srv] ' + d));
srv.stderr.on('data', d => process.stderr.write('[srv!] ' + d));

const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await wait(1200);
  const scan = spawn('node', ['tests/label-scan.mjs', FROM, TO], {
    cwd: root,
    env: Object.assign({}, process.env, {
      BASE_URL: 'http://127.0.0.1:8080',
      CHROME: '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
    }),
    stdio: ['ignore', 'inherit', 'inherit']
  });
  scan.on('exit', code => { console.log('SCAN EXIT ' + code); srv.kill(); process.exit(code || 0); });
})();
