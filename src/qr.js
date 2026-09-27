/*
 * qr.js — المستشار الزراعي · بطاقة QR اختيارية (المرحلة 2.4)
 *
 * OPTIONAL local share channel: renders the app URL as a QR code so another
 * device can open the app without typing anything. The QR carries the page
 * URL ONLY — never database content, never user data, never diagnostics.
 * Encoding runs fully offline via the vendored Nayuki encoder
 * (src/vendor/qrcodegen.js, MIT — see src/vendor/LICENSE-qrcodegen.txt).
 *
 * Self-contained modal + rendering (no dependencies beyond the encoder):
 *   window.ShowQR.show(url?)  — open the modal with the resolved app URL
 *   window.ShowQR.canvas      — the <canvas> element (tests may inspect it)
 */
(function () {
  'use strict';

  var modal = null, canvas = null, urlLine = null, errLine = null;

  function appUrl() {
    try {
      return new URL('.', location.href).href.replace(/\/(?:src|tests)\/$/, '/');
    } catch (e) { return location.href; }
  }

  function ensureDom() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'qrModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="qr-card">'
      + '<button type="button" class="qr-close" aria-label="close"><span data-icon="close"></span></button>'
      + '<h3 data-i18n="qr.title">رمز المشاركة</h3>'
      + '<canvas id="qrCanvas" width="0" height="0" aria-label="QR"></canvas>'
      + '<p class="qr-url" dir="ltr"></p>'
      + '<p class="qr-err" data-i18n="qr.fail" hidden></p>'
      + '</div>';
    document.body.appendChild(modal);
    canvas = modal.querySelector('#qrCanvas');
    urlLine = modal.querySelector('.qr-url');
    errLine = modal.querySelector('.qr-err');
    modal.querySelector('.qr-close').addEventListener('click', hide);
    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) hide();
    });
  }

  function render(url) {
    errLine.hidden = true;
    canvas.hidden = false;
    try {
      if (typeof qrcodegen === 'undefined' || !qrcodegen.QrCode) throw new Error('encoder-missing');
      var qr = qrcodegen.QrCode.encodeText(url, qrcodegen.QrCode.Ecc.MEDIUM);
      var quiet = 4, scale = Math.max(2, Math.floor(232 / (qr.size + quiet * 2)));
      var dim = (qr.size + quiet * 2) * scale;
      canvas.width = dim; canvas.height = dim;
      var ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-canvas');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = '#121e18';
      for (var y = 0; y < qr.size; y++) for (var x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
      }
      urlLine.textContent = url;
    } catch (e) {
      canvas.hidden = true;
      urlLine.textContent = '';
      errLine.hidden = false;
      errLine.textContent = (window.I18N && I18N.t ? I18N.t('qr.fail', 'تعذّر إنشاء الرمز في هذا المتصفح.') : 'QR failed')
        + ' (' + ((e && e.message) || 'qr') + ')';
    }
  }

  function show(url) {
    ensureDom();
    if (window.UIIcons && UIIcons.paint) UIIcons.paint(modal);
    if (window.I18N && I18N.apply) I18N.apply();
    modal.hidden = false;
    render(String(url || appUrl()));
  }

  function hide() { if (modal) modal.hidden = true; }

  window.ShowQR = { show: show, hide: hide, appUrl: appUrl, get canvas() { return canvas; } };
})();
