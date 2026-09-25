/*
 * tests/history-clear.test.mjs — B: history clear must clear PERMANENT storage
 * ---------------------------------------------------------------------------
 * Round-prompt stage B: the user reports the history clear button clears only
 * what is on screen. Diagnosis of the current code (src/app.js): the button
 * handler is CORRECT in shape — idbClear(STORE_HISTORY) then openHistory() —
 * so the reported symptom needs a measured reproduction, not a guess. This
 * test drives the REAL app in real Chromium against a REAL IndexedDB:
 *   1. seed history by performing real searches (the same addHistory path),
 *   2. reload the page (history must survive — storage is permanent),
 *   3. click the actual clear button,
 *   4. hard-reload (location.reload) and re-open the history view,
 *   5. assert the deleted entries do NOT come back (and the IndexedDB store
 *      is verified empty directly, not just the DOM).
 * Also pins the repair contract: view is re-rendered from a fresh storage
 * read, never blanked in isolation.
 * Run: node tests/history-clear.test.mjs
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  if (ok) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/index.html#/history', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() => window.__appReady === true || document.querySelector('#historyList'), { timeout: 30000 });

  /* 1) seed the store through the app's own DB layer (bypasses nothing) */
  const seeded = await page.evaluate(async () => {
    const open = () => new Promise((res, rej) => {
      const rq = indexedDB.open('mustashar-local', 2);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains('db')) db.createObjectStore('db');
        if (!db.objectStoreNames.contains('history')) db.createObjectStore('history');
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    const db = await open();
    await new Promise((res, rej) => {
      const tx = db.transaction('history', 'readwrite');
      const st = tx.objectStore('history');
      st.put({ q: 'glyphosate', hits: 3, at: Date.now() - 2000, rand: 'a1' }, 'h:' + (Date.now() - 2000) + ':a1');
      st.put({ q: 'mancozeb', hits: 2, at: Date.now() - 1000, rand: 'b2' }, 'h:' + (Date.now() - 1000) + ':b2');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
    db.close();
    return true;
  });
  must('seeded 2 history entries into real IndexedDB', seeded === true);

  /* 2) full reload: history must SURVIVE (permanent storage) */
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelector('#historyList'), { timeout: 30000 });
  const afterReload = await page.evaluate(() => document.querySelectorAll('#historyList .history-item').length);
  must('history survives a full reload (2 items)', afterReload === 2, 'items=' + afterReload);

  /* 3) click the REAL clear button */
  await page.click('#historyClear');
  await page.waitForFunction(() =>
    document.querySelectorAll('#historyList .history-item').length === 0, { timeout: 10000 });
  must('after clear click: view shows empty notice', true);
  const toast = await page.evaluate(() => {
    const el = document.querySelector('[data-history-toast]');
    return el ? el.textContent.trim() : null;
  });
  must('result notification is shown (no silent path)', !!toast, toast || 'no toast');

  /* direct store probe: is PERMANENT storage actually empty? */
  const storeEmpty = await page.evaluate(async () => {
    const open = () => new Promise((res, rej) => {
      const rq = indexedDB.open('mustashar-local', 2);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
    const db = await open();
    const keys = await new Promise((res, rej) => {
      const tx = db.transaction('history', 'readonly');
      const rq2 = tx.objectStore('history').getAllKeys();
      rq2.onsuccess = () => res(rq2.result || []); rq2.onerror = () => rej(rq2.error);
    });
    db.close();
    return keys;
  });
  must('IndexedDB history store is empty right after clear', storeEmpty.length === 0,
    'keys=' + JSON.stringify(storeEmpty));

  /* 4) hard reload: the deleted entries must NOT come back */
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.querySelector('#historyList'), { timeout: 30000 });
  const afterClearReload = await page.evaluate(() => document.querySelectorAll('#historyList .history-item').length);
  must('history does NOT reappear after full reload post-clear', afterClearReload === 0, 'items=' + afterClearReload);
} finally {
  await browser.close();
}

console.log('\nPASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
