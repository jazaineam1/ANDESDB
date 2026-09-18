const VERSION = 'andesdb-auto-e281f932c1cc';
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
  './evaluador-s15.html',
  './evaluador-s15-v6.html',
  './assets/vendor/apache-arrow/apache-arrow.mjs',
  './assets/vendor/duckdb/duckdb-browser-mvp.worker.js',
  './assets/vendor/duckdb/duckdb-mvp.wasm',
  './assets/vendor/duckdb/duckdb-browser.mjs',
  './Plantillas/proyecto-final/Datos/eventos_dirty.csv',
  './Plantillas/proyecto-final/Datos/casos_dirty.csv',
  './assets/learning/s15-workbench-v7.css',
  './assets/learning/s15-nested-duckdb-v1.mjs',
  './assets/learning/s15-autograder-v7.js',
  './evaluador-s15-v7.html',
  './Plantillas/proyecto-final/Datos/casos.csv',
  './Plantillas/proyecto-final/Datos/eventos.csv',
  './Plantillas/proyecto-final/Datos/evidencias.json',
  './Presentaciones/M3/sesion-6-reglas-de-negocio.html',
  './Presentaciones/M3/sql-lab-s6.js',
  './Presentaciones/M3/sesion-7-de-las-reglas-al-modelo.html',
  './Presentaciones/M3/sesion-8-modelado-y-normalizacion.html',
  './Presentaciones/M3/sesion-9-ddl-supabase.html',
  './Presentaciones/M3/tutorial-supabase.html',
  './Presentaciones/M3/formulario-reservas.html',
  './Presentaciones/M3/constructor-abc.html',
  './Scripts/S9.sql',
  './Scripts/S9-restaurante-abc.sql',
  './assets/vendor/sqljs/sql-wasm.js',
  './assets/vendor/sqljs/sql-wasm.wasm',
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
  const isLearningRuntime = /\/assets\/(?:analytics(?:-config)?\.js|learning\/(?:learning-core|presentation-timer|analytics-fallback-link|s15-autograder-v7)\.js|learning\/(?:s15-workbench-v7\.css|learning-plan\.json)|pwa-install\.js)$/i.test(url.pathname) || /\/assets\/learning\/s15-nested-duckdb-v1\.mjs$/i.test(url.pathname);
  const isAsset = /\.(js|mjs|css|json|webmanifest|wasm|db|svg|png|jpg|jpeg|webp|csv|parquet|sql)$/i.test(url.pathname);

  if (isDocument || isLearningRuntime) event.respondWith(networkFirst(request));
  else if (isAsset) event.respondWith(cacheFirst(request));
});
