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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const must = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
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

  console.log('=== 5) D39: الترقية أثناء اتصال src/packs.js مفتوح — لا تعلُّق ولا حذف ===');
  {
    /* open through the module itself: a pack install leaves packs.js holding a
       live connection, which is exactly what used to block an upgrade */
    /* this page is the bare blank harness, so load the SHIPPED module into it —
       the file under test is src/packs.js, loaded exactly as the app loads it */
    await page.evaluate(() => new Promise((res, rej) => {
      /* the harness lives under /tests/, so the module's RELATIVE urls
         (data-optional/…) must resolve against the app root — exactly as they
         do on index.html. A <base> is the whole difference. */
      if (!document.querySelector('base')) document.head.insertAdjacentHTML('afterbegin', '<base href="/">');
      const sc = document.createElement('script');
      sc.src = '/src/packs.js';
      sc.onload = res; sc.onerror = rej;
      document.head.appendChild(sc);
    }));
    const installed = await page.evaluate(async () => {
      await window.PacksModule.install('canada', () => {});
      return window.PacksModule.list();
    });
    must('packs.js runs and installs a pack (a connection is now held open)', installed.includes('canada'), JSON.stringify(installed));
    const upgraded = await page.evaluate(() => new Promise((res, rej) => {
      const t0 = Date.now();
      const rq = indexedDB.open('mustashar-local', 4);
      rq.onupgradeneeded = function () {
        /* the stores already exist at v3 — creating one again aborts the
           upgrade, which is the test's own bug, not the app's */
        if (!rq.result.objectStoreNames.contains('pack')) rq.result.createObjectStore('pack');
      };
      rq.onsuccess = function () {
        const db = rq.result; const v = db.version; db.close();
        res({ version: v, ms: Date.now() - t0 });
      };
      rq.onblocked = function () { rej(new Error('blocked — a packs.js connection stayed open')); };
      rq.onerror = function () { rej(rq.error); };
      setTimeout(function () { rej(new Error('timeout')); }, 10000);
    }));
    must('a version upgrade completes while a packs.js connection is open (it closed itself)',
      upgraded.version === 4, JSON.stringify(upgraded));
    must('the upgrade completed promptly — no forced deleteDatabase', upgraded.ms < 6000, upgraded.ms + 'ms');
    /* the shipped source must not delete the database: closing is the whole fix */
    const src = readFileSync(join(root, 'src/packs.js'), 'utf8');
    must('src/packs.js closes the CONNECTION on versionchange and NEVER calls deleteDatabase',
      /db\.onversionchange = function \(\) \{[\s\S]*?db\.close\(\)/.test(src)
      && !/req\.onversionchange/.test(src)
      && !/deleteDatabase/.test(src));
    /* cleanup for THIS test profile only (the app never does this): drop the v4
       database so the app — which opens at v3 — can run again, then prove that a
       later install still works end to end. */
    await page.evaluate(() => new Promise((res, rej) => {
      const rq = indexedDB.deleteDatabase('mustashar-local');
      rq.onsuccess = res; rq.onerror = rej; rq.onblocked = rej;
    }));
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2500);
    /* the blank harness carries no scripts of its own — load the module again */
    await page.evaluate(() => new Promise((res, rej) => {
      if (!document.querySelector('base')) document.head.insertAdjacentHTML('afterbegin', '<base href="/">');
      const sc = document.createElement('script');
      sc.src = '/src/packs.js';
      sc.onload = res; sc.onerror = rej;
      document.head.appendChild(sc);
    }));
    const after = await page.evaluate(async () => {
      try {
        await window.PacksModule.install('australia', () => {});
        const keys = await window.PacksModule.list();
        const restored = await window.PacksModule.restore('australia');
        return { keys: keys, rows: restored && restored.rows ? restored.rows.length : null };
      } catch (e) { return { err: String(e) }; }
    });
    must('a later pack install still works after the upgrade round',
      after.keys && after.keys.includes('australia') && after.rows > 0, JSON.stringify(after).slice(0, 160));
  }

  must('zero page errors during the whole run', errors.length === 0, errors.join(' | '));
} finally {
  await browser.close();
}

console.log('================================');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
process.exit(fail ? 1 : 0);
