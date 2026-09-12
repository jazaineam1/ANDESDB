(() => {
  'use strict';

  const current = document.currentScript || [...document.scripts].find(s => /pwa-install\.js(?:\?|$)/.test(s.src));
  if (!current) return;

  const ROOT = new URL('../', current.src);

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
    if (!('serviceWorker' in navigator)) return;
    try {
      await navigator.serviceWorker.register(new URL('service-worker.js', ROOT).href, { scope: ROOT.pathname });
    } catch (err) {
      console.warn('[ANDESDB PWA] No se pudo registrar el service worker:', err);
    }
  }

  async function init() {
    // La PWA permanece disponible para quien quiera instalarla desde las
    // opciones nativas del navegador, pero el sitio no muestra banners,
    // tarjetas, modales ni llamados de instalación propios.
    document.getElementById('andes-pwa-install')?.remove();
    document.getElementById('andes-pwa-modal')?.remove();
    ensureManifest();
    await registerServiceWorker();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
