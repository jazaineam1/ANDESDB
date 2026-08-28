const VERSION = 'andesdb-v4-ruta-simple-20260828';
const CORE = `${VERSION}-core`;
const RUNTIME = `${VERSION}-runtime`;
const BASE = new URL('./', self.location.href).pathname;

const ESSENTIAL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/andesdb-icon.svg',
  './assets/andesdb-icon-maskable.svg',
  './assets/icons/andesdb-192.png',
  './assets/icons/andesdb-512.png',
  './assets/icons/andesdb-maskable-512.png',
  './assets/pwa-install.js',
  './assets/learning/learning-core.js',
  './assets/learning/learning-plan.json',
  './Presentaciones/M3/sesion-6-reglas-de-negocio.html',
  './Presentaciones/M3/sql-lab-s6.js',
  './Presentaciones/M2/base-datos/dvdrental.db'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE);
    await Promise.allSettled(ESSENTIAL.map(async rel => {
      try {
        const url = new URL(rel, self.location.href);
        const response = await fetch(url, { cache: 'reload' });
        if (response.ok) await cache.put(url, response.clone());
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('andesdb-') && ![CORE, RUNTIME].includes(k))
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function shouldCache(url) {
  if (url.origin !== self.location.origin) return false;
  if (!url.pathname.startsWith(BASE)) return false;
  if (/\.(pptx|docx|zip)$/i.test(url.pathname)) return false;
  return true;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const fresh = await fetch(request);
    if (fresh.ok && shouldCache(new URL(request.url))) {
      await cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const home = await caches.match(new URL('./index.html', self.location.href));
    return home || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then(async fresh => {
      if (fresh.ok && shouldCache(new URL(request.url))) {
        const cache = await caches.open(RUNTIME);
        await cache.put(request, fresh.clone());
      }
    }).catch(() => {});
    return cached;
  }
  const fresh = await fetch(request);
  if (fresh.ok && shouldCache(new URL(request.url))) {
    const cache = await caches.open(RUNTIME);
    await cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!shouldCache(url)) return;

  const isDocument = request.mode === 'navigate' || /\.html?$/i.test(url.pathname);
  const isLearningRuntime = /\/assets\/(?:learning\/learning-core\.js|learning\/learning-plan\.json|pwa-install\.js)$/i.test(url.pathname);
  const isAsset = /\.(js|mjs|css|json|webmanifest|wasm|db|svg|png|jpg|jpeg|webp|csv|parquet)$/i.test(url.pathname);

  // La interfaz pedagógica cambia con frecuencia: preferimos la versión de red
  // y usamos la caché solo si la conexión falla.
  if (isDocument || isLearningRuntime) event.respondWith(networkFirst(request));
  else if (isAsset) event.respondWith(cacheFirst(request));
});