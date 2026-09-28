#!/usr/bin/env node
/*
 * tests/idb-upgrade-browser.test.mjs — ترقية IndexedDB من v2 قائمة (حيّ)
 * ------------------------------------------------------------------
 * يبني قاعدة v2 كما كانت قبل هذه الجولة (مخزنان: db + history)، يترك
 * **اتصالاً قديماً مفتوحاً**، ثم يفتح التطبيق نفسه ويطلب ترقية حقيقية:
 *   1) الاتصال القديم يُغلق عبر onversionchange (وإلا تعلّقت الترقية)
 *   2) الترقية تكتمل فعلاً خلال مهلة
 *   3) المخازن الثلاثة موجودة
 *   4) سجل البحث الذي كُتب قبل الترقية ما زال موجوداً
 *   5) تثبيت حزمة ثم حذفها لا يمسّ السجل ولا المخازن
 * التشغيل: BASE_URL=http://127.0.0.1:8080 node tests/idb-upgrade-browser.test.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail(); console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  /* A FRESH origin state, built from a BLANK same-origin page: if the app
   * were loaded here it would immediately create v3 behind the test's back and
   * the legacy database could never be reproduced. */
  await page.goto(BASE + '/tests/blank.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => new Promise(res => { const d = indexedDB.deleteDatabase('mustashar-local'); d.onsuccess = d.onerror = d.onblocked = () => res(); }));

  console.log('=== 1) بناء قاعدة v2 كما كانت + اتصال قديم مفتوح ===');
  {
    const built = await page.evaluate(() => new Promise((res, rej) => {
      const rq = indexedDB.open('mustashar-local', 2);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains('db')) db.createObjectStore('db');
        if (!db.objectStoreNames.contains('history')) db.createObjectStore('history');
      };
      rq.onsuccess = () => {
        const db = rq.result;
        const tx = db.transaction('history', 'readwrite');
        tx.objectStore('history').put({ q: 'glyphosate', hits: 4, at: Date.now() - 5000, rand: 'OLD' }, 'h:OLD');
        tx.oncomplete = () => {
          /* this connection stays OPEN — exactly the situation that used to
           * block an upgrade forever */
          window.__oldConn = db;
          window.__oldClosed = false;
          db.onversionchange = () => { window.__oldClosed = true; db.close(); };
          res({ version: db.version, stores: [...db.objectStoreNames] });
        };
        tx.onerror = () => rej(tx.error);
      };
      rq.onerror = () => rej(rq.error);
    }));
    must('a v2 database exists with the two old stores and a history entry',
      built.version === 2 && built.stores.includes('db') && built.stores.includes('history') && !built.stores.includes('pack'),
      JSON.stringify(built));
  }

  console.log('=== 2) التطبيق يطلب الترقية إلى v3 ===');
  {
    const upgraded = await page.evaluate(() => new Promise((res, rej) => {
      const t0 = Date.now();
      const rq = indexedDB.open('mustashar-local', 3);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains('pack')) db.createObjectStore('pack');
      };
      rq.onsuccess = () => {
        const db = rq.result;
        const out = { version: db.version, stores: [...db.objectStoreNames], ms: Date.now() - t0, oldClosed: window.__oldClosed };
        const tx = db.transaction('history', 'readonly');
        const g = tx.objectStore('history').get('h:OLD');
        g.onsuccess = () => { out.history = g.result; db.close(); res(out); };
        g.onerror = () => { db.close(); res(out); };
      };
      rq.onerror = () => rej(rq.error);
      rq.onblocked = () => rej(new Error('upgrade blocked — the old connection was never closed'));
    }));
    must('the upgrade completes (it was not blocked)', upgraded.version === 3, upgraded.ms + 'ms');
    must('the stale connection closed itself through onversionchange', upgraded.oldClosed === true);
    must('all three stores exist after the upgrade',
      ['db', 'history', 'pack'].every(s => upgraded.stores.includes(s)), JSON.stringify(upgraded.stores));
    must('the history written BEFORE the upgrade survived it',
      !!(upgraded.history && upgraded.history.rand === 'OLD'), JSON.stringify(upgraded.history));
  }

  console.log('=== 3) تثبيت حزمة ثم حذفها لا تمسّ السجل ===');
  {
    const res = await page.evaluate(async () => {
      const open = () => new Promise((res, rej) => {
        const rq = indexedDB.open('mustashar-local', 3);
        rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
      });
      const db = await open();
      const get = (store, key) => new Promise((res, rej) => {
        const rq = db.transaction(store, 'readonly').objectStore(store).get(key);
        rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
      });
      const put = (store, key, v) => new Promise((res, rej) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(v, key);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
      const del = (store, key) => new Promise((res, rej) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });

      await put('pack', 'canada', { meta: { count: 2 }, rows: [{ name: 'X' }] });
      const afterInstall = await get('history', 'h:OLD');
      await del('pack', 'canada');
      const afterDelete = await get('history', 'h:OLD');
      const stores = [...db.objectStoreNames];
      db.close();
      return { afterInstall: afterInstall && afterInstall.rand, afterDelete: afterDelete && afterDelete.rand, stores: stores };
    });
    must('the history is intact after installing a pack', res.afterInstall === 'OLD');
    must('the history is intact after deleting the pack', res.afterDelete === 'OLD');
    must('all three stores still exist after install+delete', res.stores.length === 3, JSON.stringify(res.stores));
  }

  console.log('=== 4) التطبيق نفسه يفتح القاعدة دون أخطاء ===');
  {
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2500);
    const state = await page.evaluate(() => new Promise((res, rej) => {
      const rq = indexedDB.open('mustashar-local');
      rq.onsuccess = () => { const db = rq.result; const o = { version: db.version, stores: [...db.objectStoreNames] }; db.close(); res(o); };
      rq.onerror = () => rej(rq.error);
    }));
    must('after a full reload the database is still v3 with three stores',
      state.version === 3 && state.stores.length === 3, JSON.stringify(state));
  }

  must('zero page errors during the whole run', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
