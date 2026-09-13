# Regresión móvil · modo invitado

El congelamiento observado en Chrome Android al abrir `lab.html?...&guest=1` se originaba en `guest-mode-v1.js`: un `MutationObserver` sobre todo `document.documentElement` llamaba `decorate()`, y `decorate()` reemplazaba `innerHTML` dentro de `.sync-legend`. Ese reemplazo generaba una nueva mutación, que volvía a ejecutar `decorate()`, formando un ciclo de mutaciones en el hilo principal.

La corrección `guest-mode-v2.js` elimina el observador global, hace las decoraciones idempotentes y las ejecuta solo en puntos finitos (`DOMContentLoaded`, `requestAnimationFrame`, `pageshow` y `andesdb:lab-task-rendered`). Además, el invitado resuelve `api.ready()` localmente para no esperar autenticación remota.

No reintroducir observadores globales que escriban sobre el mismo subárbol que observan.