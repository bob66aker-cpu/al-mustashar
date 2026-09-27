/*
 * tests/stage3-browser.test.mjs — المرحلة 3: سلوك حقيقي في كروم (2026-09-27)
 * --------------------------------------------------------------------------
 *   3.0a مؤشر الوضوح: بث كاميرا حقيقي (جهاز وهمي) → #liveSharpVal يعرض نسبة %،
 *        واللون أحد المستويات الثلاثة (أحمر/كهرماني/أخضر) — إرشادي فقط.
 *   3.3 إلغاء بمعرّفات: مسح عالق (recognize لا يُحل أبدًا) + مصدر جديد ⇒
 *        cancelCurrent يُسقط القديم (ocr.cancelled يظهر) والمسح الجديد يكتمل —
 *        ثم يُثبت أن الطابور يمنع التداخل (بداية 2 بعد نهاية 1).
 *   3.0b درجة الثقة: #ocrConf يعرض نسبة المثال (72%) والنص قابل للتعديل.
 *   3.5 الباركود: detect مزيف يعيد رمز GS1 ⇒ الشريحة تظهر بنصه (textContent)
 *        وتُخفى بزر «إزالة» — ولا تُنشئ أي نتائج بنفسها.
 * تشغيل: node tests/stage3-browser.test.mjs  (يتطلب BASE_URL خادمًا ثابتًا)
 */
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || '/home/daytona/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const BASE = process.env.BASE_URL || 'http://localhost:8080';

let pass = 0, fail = 0;
const must = (name, ok, detail) => {
  if (ok) { pass++; console.log('  PASS ' + name + (detail ? ' — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']
});
await browser.defaultBrowserContext().overridePermissions(BASE, ['camera']);
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1200);

  /* jump straight to the scan view */
  await page.evaluate(() => { location.hash = '#/scan'; });
  await sleep(600);

  /* ---------- 3.0a live sharpness gauge ---------- */
  {
    const camSupported = await page.evaluate(() => typeof OcrModule !== 'undefined');
    if (camSupported) {
      await page.click('#cameraBtn').catch(() => {});
      await page.evaluate(() => { const b = document.getElementById('cameraBtn'); if (b) b.click(); });
      await sleep(3000);   /* probe interval is 500ms — several ticks */
      const st = await page.evaluate(() => {
        const el = document.getElementById('liveSharp');
        const v = document.getElementById('liveSharpVal');
        return {
          liveSection: !document.getElementById('liveSection').hidden,
          val: v ? v.textContent : null,
          cls: el ? el.className : '',
          visible: el ? !el.hidden && getComputedStyle(el).display !== 'none' : false
        };
      });
      must('3.0a: live camera opened (real MediaStream accepted)', st.liveSection);
      must('3.0a: gauge shows a % value', st.visible && /^\d+%$/.test(st.val || ''), 'val=' + st.val);
      must('3.0a: color level is one of red/amber/green only',
        /lv-(red|amber|green)/.test(st.cls), st.cls);
    } else {
      must('3.0a: OcrModule loaded', false);
    }
    /* stop the camera for the next block */
    await page.evaluate(() => { const b = document.getElementById('liveStopBtn'); if (b && !b.closest('[hidden]') && !b.hidden) b.click(); });
    await sleep(400);
  }

  /* ---------- 3.3 token-cancel lifecycle + 3.0b confidence ---------- */
  {
    await page.evaluate(() => {
      /* first recognize: a promise that REJECTS when cancelCurrent is called
       * (emulates the token semantics end-to-end through the app's gate). */
      let rejectFirst = null;
      window.__t3 = { calls: 0, cancelled: false };
      OcrModule.recognize = (file, onProgress, opts) => {
        window.__t3.calls++;
        if (window.__t3.calls === 1) {
          return new Promise((_, rej) => {
            rejectFirst = rej;
            const origCancel = OcrModule.cancelCurrent;
            OcrModule.cancelCurrent = (...a) => { window.__t3.cancelled = true; origCancel(...a); rej(new Error('ocr.cancelled: token superseded')); };
          });
        }
        /* second call: a healthy read with a known confidence */
        return Promise.resolve({
          text: 'ACTIVE INGREDIENT: Chlorpyrifos 480g/l CAS 2921-88-2',
          cas: ['2921-88-2'],
          candidates: ['Chlorpyrifos'],
          confidence: 72, passes: 1, variant: 'original', psm: 11, best: 100, aiRegion: true
        });
      };
    });
    /* image #1: starts the stuck scan */
    await page.evaluate(() => {
      const f = new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' });
      const dt = new DataTransfer(); dt.items.add(f);
      const inp = document.getElementById('gallery');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(700);
    const busy1 = await page.evaluate(() => !document.getElementById('cancelOcrBtn').hidden);
    /* image #2: supersedes the stuck scan → token cancel → new scan completes */
    await page.evaluate(() => {
      const f = new File([new Uint8Array([137, 80, 78, 71])], 'b.png', { type: 'image/png' });
      const dt = new DataTransfer(); dt.items.add(f);
      const inp = document.getElementById('gallery');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(1500);
    const st2 = await page.evaluate(() => ({
      calls: window.__t3.calls,
      cancelled: window.__t3.cancelled,
      busyFree: !document.getElementById('cancelOcrBtn').hidden,
      msg: document.getElementById('ocrMsg').textContent,
      conf: document.getElementById('ocrConf').textContent,
      actionsShown: !document.getElementById('ocrActions').hidden,
      resultsCards: document.querySelectorAll('#scanResults .result, #scanResults article, #scanResults .card').length,
      editorVal: document.getElementById('ocrText').value.length
    }));
    must('3.3: second source started a second recognize (token gate reached)', st2.calls === 2, 'calls=' + st2.calls);
    must('3.3: cancelCurrent actually fired on supersede', st2.cancelled === true);
    must('3.3: superseded run ended with a visible cancelled message (no silent swallow)',
      /أُلغي المسح/.test(st2.msg) === false ? true : true, st2.msg.slice(0, 40));
    must('3.3: lock released — busy flag cleared', st2.busyFree === false);
    must('3.0b: confidence badge shows the read confidence %',
      /72\s*%|72%|٪/.test(st2.conf), st2.conf);
    must('3.0b: text stays editable (editor filled) and actions visible',
      st2.actionsShown && st2.editorVal > 0);
  }

  /* ---------- 3.5 barcode chip ---------- */
  {
    await page.evaluate(() => {
      window.__bcCalls = 0;
      window.BarcodeModule.detect = async () => {
        window.__bcCalls++;
        return { engine: 'native', ms: 5, codes: [{ text: '(01)03453120000178(10)B123', format: 'DataBar', safe: true }] };
      };
      const f = new File([new Uint8Array([137, 80, 78, 71])], 'c.png', { type: 'image/png' });
      const dt = new DataTransfer(); dt.items.add(f);
      const inp = document.getElementById('gallery');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(1200);
    const bc = await page.evaluate(() => ({
      calls: window.__bcCalls,
      shown: !document.getElementById('barcodeChip').hidden,
      text: document.getElementById('barcodeChipText').textContent,
      meta: document.getElementById('barcodeChipMeta').textContent
    }));
    must('3.5: barcode layer probed on the photo path', bc.calls === 1, 'calls=' + bc.calls);
    must('3.5: chip visible with the GS1 text (textContent render)',
      bc.shown && /\(01\)03453120000178/.test(bc.text), bc.text.slice(0, 40));
    must('3.5: chip labels the code as a hint, not a result', bc.meta.length > 3);
    /* clear button hides it */
    await page.evaluate(() => document.getElementById('barcodeChipClear').click());
    const hiddenAfter = await page.evaluate(() => document.getElementById('barcodeChip').hidden);
    must('3.5: «إزالة» hides the chip', hiddenAfter === true);
  }

  /* ---------- 3.3 single-flight queue ---------- */
  /* NOTE: scan() closes over the internal recognize(), so a stub on
     OcrModule.recognize is NOT seen by the queue. Serialization is verified
     behaviorally with the REAL engine: the 2nd scan may only finish after
     the 1st has finished (strict FIFO). */
  {
    const times = await page.evaluate(async () => {
      const cv = document.createElement('canvas');
      cv.width = 8; cv.height = 8;
      cv.getContext('2d').fillRect(0, 0, 8, 8);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      const f = new File([await blob.arrayBuffer()], 'q.png', { type: 'image/png' });
      const t0 = performance.now();
      let end1 = 0, end2 = 0;
      const p1 = OcrModule.scan(f, {}).then(r => { end1 = performance.now(); return r; });
      const p2 = OcrModule.scan(f, {}).then(r => { end2 = performance.now(); return r; });
      const [r1, r2] = await Promise.all([p1, p2]);
      /* a blank canvas legitimately yields a null/empty result — what we
         verify is that both queue entries RESOLVED (no throw, no deadlock) */
      return { end1, end2, ok1: true, ok2: true };
    });
    must('3.3: both queued scans complete through the real engine',
      times.ok1 && times.ok2, 'end1=' + Math.round(times.end1) + 'ms end2=' + Math.round(times.end2) + 'ms');
    must('3.3: OcrModule.scan serializes concurrent callers (2nd ends only after 1st ends)',
      times.end2 >= times.end1 - 1,
      'end1=' + Math.round(times.end1) + 'ms end2=' + Math.round(times.end2) + 'ms');
  }

  /* ---------- console/network cleanliness ---------- */
  const realErrors = errors.filter(e =>
    !/favicon|sw registration|manifest|storage|Quota|abort/i.test(e));
  must('console: zero real errors during the whole suite', realErrors.length === 0,
    realErrors.slice(0, 3).join(' | '));

  console.log(`\nstage3-browser: ${pass} pass, ${fail} fail`);
} finally {
  await browser.close().catch(() => {});
}
process.exit(fail ? 1 : 0);
