const VERSION='andesdb-lms-20260912-v30';
const CORE=`${VERSION}-core`,RUNTIME=`${VERSION}-runtime`,BASE=new URL('./',self.location.href).pathname;
const ESSENTIAL=[
  './portal.html','./learning-hub.html','./reading.html','./calendar.html','./assignment.html','./verify.html','./teacher-dashboard.html','./manifest.webmanifest','./tools/curso.json',
  './assets/andesdb-icon.svg','./assets/icons/andesdb-192.png','./assets/icons/andesdb-512.png',
  './assets/learning/course-data.js','./assets/learning/lms-platform.js','./assets/learning/readings-v5.js','./assets/learning/access-gate.js','./assets/learning/learning-tracker.js','./assets/learning/analytics-config.js'
];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CORE);await Promise.allSettled(ESSENTIAL.map(async rel=>{try{const url=new URL(rel,self.location.href),r=await fetch(url,{cache:'reload'});if(r.ok)await cache.put(url,r.clone())}catch(_){}}));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('andesdb-')&&![CORE,RUNTIME].includes(k)).map(k=>caches.delete(k)));try{if(self.registration.navigationPreload)await self.registration.navigationPreload.enable()}catch(_){}await self.clients.claim()})())});
function allowed(url){return url.origin===self.location.origin&&url.pathname.startsWith(BASE)&&!/\.(pptx|docx|zip)$/i.test(url.pathname)}
async function networkFirst(request,preload){const cache=await caches.open(RUNTIME);try{let r=preload?await preload:null;if(!r)r=await fetch(request);if(r&&r.ok)await cache.put(request,r.clone());return r}catch(_){return(await caches.match(request))||(request.mode==='navigate'?await caches.match(new URL('./portal.html',self.location.href)):null)||Response.error()}}
async function cacheFirst(request){const cached=await caches.match(request);if(cached){fetch(request).then(async r=>{if(r.ok)await (await caches.open(RUNTIME)).put(request,r.clone())}).catch(()=>{});return cached}const r=await fetch(request);if(r.ok)await (await caches.open(RUNTIME)).put(request,r.clone());return r}
async function staleWhileRevalidate(request){const cache=await caches.open(RUNTIME),cached=await caches.match(request);const update=fetch(request).then(async r=>{if(r.ok)await cache.put(request,r.clone());return r}).catch(()=>null);return cached||await update||Response.error()}
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(!allowed(url))return;
  const original=/\/Presentaciones\/M\d+\/__original__\/[^/]+\.html$/i.test(url.pathname);
  const doc=req.mode==='navigate'||/\.html?$/i.test(url.pathname);
  const manifest=/\/tools\/curso\.json$/i.test(url.pathname);
  const runtime=/\/assets\/learning\/[^/]+\.(?:js|json)$/i.test(url.pathname);
  const staticAsset=/\.(?:js|mjs|css|json|webmanifest|wasm|db|svg|png|jpg|jpeg|webp|csv|parquet|sql)$/i.test(url.pathname);
  if(original){event.respondWith(cacheFirst(req));return}
  if(manifest||runtime){event.respondWith(staleWhileRevalidate(req));return}
  if(doc){event.respondWith(networkFirst(req,event.preloadResponse));return}
  if(staticAsset)event.respondWith(cacheFirst(req));
});