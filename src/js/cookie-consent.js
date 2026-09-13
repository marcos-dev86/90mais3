/* =========================================================
   90+3 — Banner de Gerenciamento de Cookies (LGPD)
   =========================================================
   Como usar:
   1. Inclua no <head> de CADA página (index.html, produto.html):
        <link rel="stylesheet" href="src/css/cookie-consent.css">
   2. Inclua antes do </body>:
        <script src="src/js/cookie-consent.js" defer></script>
   3. (Opcional) Ajuste os textos e o link da política de
      privacidade no objeto CONFIG abaixo.
   4. Para carregar scripts opcionais só quando o usuário
      ACEITAR (ex.: Google Analytics, Meta Pixel), escute:

        document.addEventListener('cc:accepted', function () {
          // ex: carregar gtag.js aqui
        });

        document.addEventListener('cc:rejected', function () {
          // opcional: garantir que nada de rastreamento rode
        });

   O consentimento é salvo em localStorage + cookie e expira
   sozinho após 6 meses, quando o banner volta a aparecer
   (boa prática LGPD).
   ========================================================= */

(function () {
  'use strict';

  var CONFIG = {
    storageKey: '90mais3_cookie_consent',
    cookieName: '90mais3_cookies',
    expirationDays: 180,
    // Caminho calculado na hora: como agora existem páginas em profundidades
    // diferentes (index.html na raiz; produto.html e politica-de-privacidade.html
    // em src/html/), um caminho fixo não serve pros dois casos. Continua sendo
    // relativo (nunca começa com "/"), então funciona tanto na Vercel (site na
    // raiz do domínio) quanto no GitHub Pages (site numa subpasta do domínio).
    privacyPolicyUrl: (window.location.pathname.indexOf('/src/html/') !== -1)
      ? 'politica-de-privacidade.html'
      : 'src/html/politica-de-privacidade.html',
    texts: {
      title: 'Usamos cookies 🍪',
      body:
        'Usamos cookies essenciais para o site funcionar corretamente e cookies opcionais para melhorar sua navegação e personalizar ofertas. Você pode aceitar ou rejeitar quando quiser.',
      accept: 'Aceitar',
      reject: 'Rejeitar',
      learnMore: 'Saiba mais',
    },
  };

  function getStoredConsent() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var ageMs = Date.now() - new Date(data.date).getTime();
      var maxAgeMs = CONFIG.expirationDays * 24 * 60 * 60 * 1000;
      if (ageMs > maxAgeMs) return null; // expirou, pede consentimento de novo
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(status) {
    var data = { status: status, date: new Date().toISOString() };
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch (e) {
      /* localStorage indisponível — segue só no cookie */
    }
    var maxAge = CONFIG.expirationDays * 24 * 60 * 60;
    document.cookie =
      CONFIG.cookieName +
      '=' +
      status +
      '; max-age=' +
      maxAge +
      '; path=/; SameSite=Lax';
  }

  function applyConsent(status) {
    var eventName = status === 'accepted' ? 'cc:accepted' : 'cc:rejected';
    document.dispatchEvent(new CustomEvent(eventName, { detail: { status: status } }));
  }

  function buildMarkup() {
    var wrapper = document.createElement('div');
    wrapper.innerHTML =
      '<div class="cc-banner" id="cc-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies">' +
      '  <div class="cc-banner__content">' +
      '    <span class="cc-banner__icon" aria-hidden="true">🍪</span>' +
      '    <div class="cc-banner__text">' +
      '      <strong>' + CONFIG.texts.title + '</strong>' +
      '      <p>' + CONFIG.texts.body + ' <a href="' + CONFIG.privacyPolicyUrl + '">' + CONFIG.texts.learnMore + '</a></p>' +
      '    </div>' +
      '  </div>' +
      '  <div class="cc-banner__actions">' +
      '    <button type="button" id="cc-reject" class="cc-btn cc-btn--ghost">' + CONFIG.texts.reject + '</button>' +
      '    <button type="button" id="cc-accept" class="cc-btn cc-btn--primary">' + CONFIG.texts.accept + '</button>' +
      '  </div>' +
      '</div>' +
      '<button type="button" id="cc-reopen" class="cc-reopen" aria-label="Gerenciar cookies" title="Gerenciar cookies">🍪</button>';

    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }

  function showBanner() {
    var banner = document.getElementById('cc-banner');
    if (banner) banner.classList.add('cc-visible');
  }

  function hideBanner() {
    var banner = document.getElementById('cc-banner');
    if (banner) banner.classList.remove('cc-visible');
  }

  function showReopenButton() {
    var btn = document.getElementById('cc-reopen');
    if (btn) btn.classList.add('cc-show');
  }

  function init() {
    buildMarkup();

    var acceptBtn = document.getElementById('cc-accept');
    var rejectBtn = document.getElementById('cc-reject');
    var reopenBtn = document.getElementById('cc-reopen');

    acceptBtn.addEventListener('click', function () {
      saveConsent('accepted');
      applyConsent('accepted');
      hideBanner();
      showReopenButton();
    });

    rejectBtn.addEventListener('click', function () {
      saveConsent('rejected');
      applyConsent('rejected');
      hideBanner();
      showReopenButton();
    });

    reopenBtn.addEventListener('click', function () {
      showBanner();
    });

    var existing = getStoredConsent();
    if (existing) {
      applyConsent(existing.status);
      showReopenButton();
    } else {
      // pequeno delay para não competir com o carregamento inicial da página
      setTimeout(showBanner, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();