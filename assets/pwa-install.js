(() => {
  'use strict';

  const current = document.currentScript || [...document.scripts].find(s => /pwa-install\.js(?:\?|$)/.test(s.src));
  if (!current) return;

  const ROOT = new URL('../', current.src);
  let deferredPrompt = null;
  const isAndroid = /Android/i.test(navigator.userAgent || '');

  const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    navigator.standalone === true;

  function injectStyle() {
    if (document.getElementById('andes-pwa-style')) return;
    const style = document.createElement('style');
    style.id = 'andes-pwa-style';
    style.textContent = `
      #andes-pwa-install{position:fixed;left:16px;bottom:16px;z-index:2147481800;max-width:min(360px,calc(100vw - 32px));font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#171717;color:#fff;border-radius:16px;box-shadow:0 14px 44px #0006;padding:13px 14px;display:flex;gap:12px;align-items:center}
      #andes-pwa-install[hidden]{display:none!important}
      #andes-pwa-install .api-icon{width:42px;height:42px;border-radius:11px;background:#ffd600;display:grid;place-items:center;color:#171717;font-size:23px;font-weight:900;flex:none}
      #andes-pwa-install .api-copy{min-width:0;flex:1}.api-copy b{display:block;font-size:14px;line-height:1.2}.api-copy small{display:block;margin-top:3px;color:#d3d3d3;line-height:1.25}
      #andes-pwa-install .api-actions{display:flex;gap:6px;align-items:center}.api-btn{border:0;border-radius:9px;padding:9px 10px;font:800 12px/1 system-ui;cursor:pointer}.api-btn.install{background:#ffd600;color:#171717}.api-btn.close{background:#ffffff18;color:#fff;font-size:16px;width:34px;height:34px;padding:0}
      #andes-pwa-modal{position:fixed;inset:0;z-index:2147483500;background:#000b;display:none;align-items:center;justify-content:center;padding:18px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
      #andes-pwa-modal.open{display:flex}.api-modal-card{width:min(520px,96vw);background:#fff;color:#171717;border-radius:20px;padding:22px;box-shadow:0 24px 80px #0008}.api-modal-card h2{margin:0 0 8px;font-size:21px}.api-modal-card p{line-height:1.45}.api-modal-card ol{padding-left:22px;line-height:1.5}.api-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.api-modal-actions button{border:0;border-radius:10px;padding:10px 13px;font-weight:800;cursor:pointer}.api-modal-actions .primary{background:#171717;color:#fff}.api-installed{background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:10px 12px;color:#14532d;font-weight:700}
      @media(max-width:640px){#andes-pwa-install{left:10px;right:10px;bottom:10px;max-width:none}.api-copy small{font-size:11px}.api-modal-card{padding:18px}}
    `;
    document.head.appendChild(style);
  }

  function ensureManifest() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = new URL('manifest.webmanifest', ROOT).href;
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#171717';
      document.head.appendChild(meta);
    }
    if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
      const meta = document.createElement('meta');
      meta.name = 'mobile-web-app-capable';
      meta.content = 'yes';
      document.head.appendChild(meta);
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.register(new URL('service-worker.js', ROOT).href, { scope: ROOT.pathname });
      await navigator.serviceWorker.ready;
      return !!reg;
    } catch (err) {
      console.warn('[ANDESDB PWA] No se pudo registrar el service worker:', err);
      return false;
    }
  }

  function helpText() {
    if (isAndroid) {
      return {
        title: 'Instalar ANDESDB en Android',
        body: `
          <p>ANDESDB puede quedar como una app independiente, con icono en tu pantalla de inicio y apertura sin la barra del navegador.</p>
          <ol>
            <li>Abre esta página en <b>Google Chrome</b>.</li>
            <li>Toca el menú <b>⋮</b> de Chrome.</li>
            <li>Elige <b>Instalar aplicación</b>. En algunas versiones puede aparecer como <b>Agregar a pantalla principal</b>.</li>
            <li>Confirma <b>Instalar</b>.</li>
          </ol>
          <p><small>Si Chrome ya detectó que la PWA es instalable, el botón amarillo abre directamente el diálogo de instalación.</small></p>`
      };
    }
    return {
      title: 'Instalar ANDESDB',
      body: '<p>Usa la opción <b>Instalar ANDESDB</b> o <b>Instalar aplicación</b> del menú de tu navegador. En navegadores compatibles, el botón de esta página abrirá directamente el diálogo de instalación.</p>'
    };
  }

  function ensureModal() {
    let modal = document.getElementById('andes-pwa-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'andes-pwa-modal';
    modal.innerHTML = `
      <div class="api-modal-card" role="dialog" aria-modal="true" aria-labelledby="api-modal-title">
        <h2 id="api-modal-title"></h2>
        <div id="api-modal-body"></div>
        <div class="api-modal-actions"><button type="button" class="primary" id="api-modal-close">Entendido</button></div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.classList.remove('open');
    modal.querySelector('#api-modal-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    return modal;
  }

  function showHelp() {
    const modal = ensureModal();
    const help = helpText();
    modal.querySelector('#api-modal-title').textContent = help.title;
    modal.querySelector('#api-modal-body').innerHTML = help.body;
    modal.classList.add('open');
  }

  function ensureInstallCard() {
    if (isStandalone()) return null;
    let card = document.getElementById('andes-pwa-install');
    if (card) return card;
    card = document.createElement('aside');
    card.id = 'andes-pwa-install';
    card.setAttribute('aria-label', 'Instalar ANDESDB como aplicación');
    card.innerHTML = `
      <div class="api-icon">DB</div>
      <div class="api-copy"><b>Instalar ANDESDB</b><small>${isAndroid ? 'Úsalo como app en tu Android' : 'Ábrelo como una aplicación independiente'}</small></div>
      <div class="api-actions">
        <button type="button" class="api-btn install" id="api-install-btn">Instalar</button>
        <button type="button" class="api-btn close" id="api-install-close" aria-label="Cerrar">×</button>
      </div>`;
    document.body.appendChild(card);
    card.querySelector('#api-install-close').addEventListener('click', () => {
      card.hidden = true;
      try { sessionStorage.setItem('andesdb.install.dismissed', '1'); } catch (_) {}
    });
    card.querySelector('#api-install-btn').addEventListener('click', install);
    return card;
  }

  function updateInstallUi() {
    if (isStandalone()) {
      document.getElementById('andes-pwa-install')?.remove();
      return;
    }
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('andesdb.install.dismissed') === '1'; } catch (_) {}
    if (dismissed && !deferredPrompt) return;
    const card = ensureInstallCard();
    if (!card) return;
    card.hidden = false;
    const btn = card.querySelector('#api-install-btn');
    if (btn) btn.textContent = deferredPrompt ? 'Instalar' : 'Cómo instalar';
  }

  async function install() {
    if (isStandalone()) return;
    if (!deferredPrompt) {
      showHelp();
      return;
    }
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try {
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === 'accepted') {
        document.getElementById('andes-pwa-install')?.remove();
      } else {
        updateInstallUi();
      }
    } catch (err) {
      console.warn('[ANDESDB PWA] No se pudo abrir el diálogo de instalación:', err);
      showHelp();
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    updateInstallUi();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('andes-pwa-install')?.remove();
    const modal = document.getElementById('andes-pwa-modal');
    if (modal) {
      modal.querySelector('#api-modal-title').textContent = 'ANDESDB instalado';
      modal.querySelector('#api-modal-body').innerHTML = '<div class="api-installed">✓ Ya puedes abrir ANDESDB desde tu pantalla de inicio o el cajón de aplicaciones.</div>';
      modal.classList.add('open');
    }
  });

  async function init() {
    injectStyle();
    ensureManifest();
    await registerServiceWorker();
    updateInstallUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
