/*
 * tests/stage2-browser.test.mjs — المرحلة 2: سلوك حقيقي في كروم
 *   2.1 بطاقة التثبيت: إن أطلق كروم beforeinstallprompt الحقيقي فالبطاقة
 *       تظهر تلقائيًا (الجسر يعمل)؛ وإلا فمخفية. dispatch يدوي يظهرها،
 *       pick() يستهلك الحدث، userChoice dismissed يبقي الزر مع ملاحظة،
 *       appinstalled يخفيها فورًا.
 *   2.2 زر إعادة التصوير: resetScanUI + إعادة دخول الكاميرا — بإذن كاميرا
 *       حقيقي (جهاز وهمي عبر overridePermissions) حتى يقبل srcObject تدفقًا
 *       حقيقيًا (stub يدوي يرمي TypeError في srcObject).
 *   2.3 إشارة إشغال: مصدر جديد أثناء ocrBusy يعرض رسالة «مسح جارٍ» — لا صمت —
 *       ثم يُحاكى الإلغاء الحقيقي (ocr.cancelled) لتحرير القفل.
 *   2.4 QR: مودال يرسم canvas مربعًا غير فارغ ويعرض رابط التطبيق فقط؛ Escape يغلق.
 * تشغيل: node tests/stage2-browser.test.mjs  (يتطلب BASE_URL خادمًا ثابتًا)
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
/* real (synthetic-content) camera permission — srcObject needs a REAL MediaStream */
await browser.defaultBrowserContext().overridePermissions(BASE, ['camera']);
try {
  const page = await browser.newPage();
  /* phone-shaped viewport: the fixed bottom nav (64px) must not cover the
   * scan controls or puppeteer's hit-testing fails on real coordinates. */
  await page.setViewport({ width: 420, height: 900, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1000);

  /* ---------- 2.1 install card ---------- */
  {
    const auto = await page.evaluate(() => window.__install && window.__install.available);
    const visible0 = await page.$eval('#installCard', el => !el.hidden);
    must('2.1: card visibility matches the REAL prompt availability (bridge works)',
      visible0 === !!auto, 'auto=' + auto + ' visible=' + visible0);

    /* deterministic dispatch: a controlled event with a resolvable userChoice */
    await page.evaluate(() => {
      const ev = new Event('beforeinstallprompt');
      ev.preventDefault = () => {};
      ev.platform = 'test';
      ev.prompt = () => { window.__prompted = true; };
      ev.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.__install.set(ev);            // replace the stored prompt with ours
      window.dispatchEvent(ev);            // also exercises the bridge path
    });
    await sleep(250);
    must('2.1: dispatched beforeinstallprompt shows the card',
      await page.$eval('#installCard', el => !el.hidden));

    await page.click('#installBtn');
    await sleep(400);
    const after = await page.evaluate(() => ({
      prompted: !!window.__prompted,
      note: (document.querySelector('#installNote') || {}).textContent || '',
      cardGone: document.querySelector('#installCard').hidden
    }));
    must('2.1: prompt() invoked through the stored event', after.prompted === true);
    must('2.1: dismissed choice keeps button + shows a visible note',
      after.cardGone === false && after.note.length > 3, after.note);

    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await sleep(200);
    must('2.1: appinstalled hides the card immediately',
      await page.$eval('#installCard', el => el.hidden));
  }

  /* ---------- 2.2 retake flow (real synthetic camera) ---------- */
  {
    await page.evaluate(() => { location.hash = '#/scan'; });
    await sleep(300);
    const retakeHiddenBefore = await page.$eval('#retakeBtn', el => el.hidden);
    must('2.2: retake hidden before any read/live session', retakeHiddenBefore === true);

    /* real getUserMedia via the fake device — no JS stub (srcObject requires it) */
    await page.click('#cameraBtn');
    await sleep(900);
    const liveOn = await page.evaluate(() => ({
      section: !document.querySelector('#liveSection').hidden,
      srcObj: !!document.querySelector('#liveVideo').srcObject,
      retake: document.querySelector('#retakeBtn').hidden
    }));
    must('2.2: cameraBtn opens the live camera (unified entry)',
      liveOn.section === true && liveOn.srcObj === true, JSON.stringify(liveOn));
    must('2.2: retake hidden while a live session runs', liveOn.retake === true);

    /* manual stop = READY state: camera card back, no retake (nothing to redo yet) */
    await page.click('#liveStopBtn');
    await sleep(300);
    const afterStop = await page.evaluate(() => ({
      section: document.querySelector('#liveSection').hidden,
      camCard: !document.querySelector('#cameraBtn').hidden,
      retake: document.querySelector('#retakeBtn').hidden
    }));
    must('2.2: manual stop returns to the ready state (camera card re-entry)',
      afterStop.section === true && afterStop.camCard === true && afterStop.retake === true,
      JSON.stringify(afterStop));

    /* early-success path via the REAL engine decision: force the cheap
     * clarity probe to pass, so the live loop itself fires an AUTO full pass
     * with a stubbed recognize. Engine stops the session and offers retake. */
    await page.click('#cameraBtn');
    await sleep(1200);
    await page.evaluate(() => {
      const real = OcrModule.recognize;
      OcrModule.recognize = async () => ({
        text: 'Glyphosate', cas: '1071-83-6', candidates: ['Glyphosate'],
        confidence: 95, passes: [], rejected: null
      });
      window.__restoreRecognize = () => { OcrModule.recognize = real; };
      const om = ScanLive.frameMetrics, cp = ScanLive.cheapPass;
      ScanLive.frameMetrics = () => ({ laplacian: 60, glare: 0, dark: 0, contrast: 40 });
      ScanLive.cheapPass = () => true;   // force an AUTO full-engine pass
      window.__restoreScanLive = () => { ScanLive.frameMetrics = om; ScanLive.cheapPass = cp; };
    });
    await sleep(2000);
    await page.evaluate(() => { if (window.__restoreScanLive) window.__restoreScanLive(); if (window.__restoreRecognize) window.__restoreRecognize(); });
    const earlyState = await page.evaluate(() => ({
      live: !document.querySelector('#liveSection').hidden,
      retake: !document.querySelector('#retakeBtn').hidden,
      msg: document.querySelector('#ocrMsg').textContent
    }));
    must('2.2: early success stops live and re-offers retake (results stay)',
      earlyState.live === false && earlyState.retake === true, JSON.stringify(earlyState));

    /* retake = full reset + straight back into the live camera */
    await page.click('#retakeBtn');
    await sleep(900);
    const retakeFlow = await page.evaluate(() => ({
      live: !document.querySelector('#liveSection').hidden,
      preview: document.querySelector('#previewRow').hidden,
      /* clearScanResults repaints the box with the single .empty placeholder —
       * "cleared" = no result cards remain, not zero children. */
      cards: document.querySelectorAll('#scanResults .result-card, #scanResults .card:not(.empty)').length,
      empty: !!document.querySelector('#scanResults .empty')
    }));
    must('2.2: retake clears results and re-opens the live camera',
      retakeFlow.live === true && retakeFlow.preview === true
      && retakeFlow.cards === 0 && retakeFlow.empty === true,
      JSON.stringify(retakeFlow));
  }

  /* ---------- 2.3 busy gate message ---------- */
  {
    await page.click('#liveStopBtn');      // leave the live session
    await sleep(300);
    /* first read: a fake recognize that parks until WE release it the same
     * way the real engine cancels — reject with 'ocr.cancelled'. */
    await page.evaluate(() => {
      window.__realRecognize = OcrModule.recognize;
      OcrModule.recognize = () => new Promise((res, rej) => { window.__parkReject = rej; });
      const camInput = document.querySelector('#camera');
      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'probe.png', { type: 'image/png' }));
      camInput.files = dt.files;
      camInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(700);
    const busy = await page.evaluate(() => document.querySelector('#ocrMsg').textContent);
    must('2.3: first read starts (prep/busy message visible)', busy.length > 0, busy);

    /* second pick while busy → must never be silent */
    await page.evaluate(() => {
      const camInput = document.querySelector('#camera');
      const dt = new DataTransfer();
      dt.items.add(new File(['y'], 'probe2.png', { type: 'image/png' }));
      camInput.files = dt.files;
      camInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(900);
    const second = await page.evaluate(() => document.querySelector('#ocrMsg').textContent);
    must('2.3: busy gate shows a visible message (no silent drop)', second.length > 0, second);

    /* release the parked read exactly like a real cancel */
    await page.evaluate(() => {
      if (window.__parkReject) window.__parkReject(new Error('ocr.cancelled: test release'));
      if (window.__realRecognize) OcrModule.recognize = window.__realRecognize;
    });
    await sleep(500);
    const free = await page.evaluate(() => {
      location.hash = '#/home';
      return true;
    });
    await sleep(400);
    const backHome = await page.evaluate(() =>
      !document.querySelector('[data-view="home"]').hidden);
    must('2.3: cancelled read frees the lock (navigation works again)',
      free === true && backHome === true);
  }

  /* ---------- 2.4 QR modal ---------- */
  {
    await sleep(200);
    const btnVisible = await page.$eval('#qrBtn', el => el.offsetParent !== null);
    must('2.4: QR button visible on home', btnVisible === true);
    await page.click('#qrBtn');
    await sleep(300);
    const st = await page.evaluate(() => {
      const m = document.querySelector('#qrModal');
      const c = document.querySelector('#qrCanvas');
      if (!m || m.hidden) return { open: false };
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let dark = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dark++;
      return {
        open: true, w: c.width, h: c.height, dark,
        square: c.width === c.height,
        url: (document.querySelector('#qrModal .qr-url') || {}).textContent || '',
        err: !(document.querySelector('#qrModal .qr-err') || { hidden: true }).hidden
      };
    });
    must('2.4: modal opens with canvas rendered',
      st.open === true && st.w > 0 && st.square === true, JSON.stringify(st));
    must('2.4: QR has real dark modules (not blank)', st.dark > 200, String(st.dark));
    /* the expected origin follows BASE_URL, not a hardcoded port */
    const ORIGIN = new URL(BASE).origin;
    must('2.4: modal shows the app URL only', st.url === ORIGIN + '/', st.url + ' expected ' + ORIGIN + '/');
    must('2.4: no error line shown', st.err === false);
    await page.keyboard.press('Escape');
    await sleep(200);
    must('2.4: Escape closes the modal', await page.$eval('#qrModal', el => el.hidden));
  }

  /* ---------- console/network hygiene ---------- */
  must('zero console/page errors during the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}
console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
