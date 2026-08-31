/* ANDESDB · Host S7 seguro.
 * El shell autenticado NO accede al DOM ni a globals del laboratorio. Toda
 * comunicación cruza un origen separado mediante postMessage validado.
 */
(function () {
  'use strict';

  var SOURCE_HOST = 'andesdb-s7-host-v1';
  var SOURCE_BRIDGE = 'andesdb-s7-bridge-v1';
  var frame = document.getElementById('activityFrame');
  var syncText = document.getElementById('syncText');
  var submitButton = document.getElementById('submitActivity');
  var logoutButton = document.getElementById('logoutButton');
  var conflictBox = document.getElementById('conflictBox');
  var conflictCopy = document.getElementById('conflictCopy');
  var conflictReload = document.getElementById('conflictReload');

  var activity = null;
  var revision = 0;
  var lastFingerprint = null;
  var saveTimer = null;
  var saveInFlight = false;
  var saveAgain = false;
  var conflict = false;
  var hydrated = false;
  var bridgeReady = false;
  var bridgeOrigin = '';
  var pending = new Map();
  var requestSeq = 0;
  var readyWaiters = [];

  function text(node, value) { if (node) node.textContent = value; }

  function setSync(label, state) {
    text(syncText, label);
    if (syncText) syncText.dataset.state = state || '';
  }

  function validOrigin(raw) {
    try {
      var u = new URL(raw);
      return u.protocol === 'https:' && u.origin === raw ? u.origin : '';
    } catch (_) { return ''; }
  }

  function bridgeWindow() {
    return frame && frame.contentWindow ? frame.contentWindow : null;
  }

  function post(message) {
    var target = bridgeWindow();
    if (!target || !bridgeOrigin) throw new Error('BRIDGE_NOT_CONFIGURED');
    target.postMessage(Object.assign({source:SOURCE_HOST}, message), bridgeOrigin);
  }

  function waitBridgeReady(timeoutMs) {
    if (bridgeReady) return Promise.resolve();
    timeoutMs = timeoutMs || 15000;
    return new Promise(function (resolve, reject) {
      var item = {resolve:resolve, reject:reject};
      readyWaiters.push(item);
      var timer = setTimeout(function () {
        var idx = readyWaiters.indexOf(item);
        if (idx >= 0) readyWaiters.splice(idx, 1);
        reject(new Error('BRIDGE_TIMEOUT'));
      }, timeoutMs);
      item.resolve = function () { clearTimeout(timer); resolve(); };
      item.reject = function (err) { clearTimeout(timer); reject(err); };
      try { post({type:'PING'}); } catch (_) {}
    });
  }

  function bridgeRequest(type, payload, timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    var requestId = 'r' + Date.now().toString(36) + '-' + (++requestSeq).toString(36);
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        pending.delete(requestId);
        reject(new Error('BRIDGE_REQUEST_TIMEOUT'));
      }, timeoutMs);
      pending.set(requestId, {
        resolve:function (value) { clearTimeout(timer); resolve(value); },
        reject:function (err) { clearTimeout(timer); reject(err); }
      });
      try {
        post(Object.assign({type:type, requestId:requestId}, payload || {}));
      } catch (err) {
        clearTimeout(timer);
        pending.delete(requestId);
        reject(err);
      }
    });
  }

  window.addEventListener('message', function (event) {
    if (!bridgeOrigin || event.origin !== bridgeOrigin || event.source !== bridgeWindow()) return;
    var data = event.data;
    if (!data || data.source !== SOURCE_BRIDGE || typeof data.type !== 'string') return;

    if (data.type === 'READY') {
      bridgeReady = true;
      var waiters = readyWaiters.splice(0);
      waiters.forEach(function (w) { w.resolve(); });
      return;
    }
    if (data.type === 'CHANGE') {
      scheduleSave();
      return;
    }
    if (data.type === 'ERROR') {
      setSync('El laboratorio aislado reportó un error', 'error');
      return;
    }
    if (data.type === 'RESPONSE' && typeof data.requestId === 'string') {
      var req = pending.get(data.requestId);
      if (!req) return;
      pending.delete(data.requestId);
      if (data.ok) req.resolve(data.result);
      else req.reject(new Error(String(data.error || 'BRIDGE_ERROR').slice(0,160)));
    }
  });

  async function serializeActivity() {
    var state = await bridgeRequest('GET_STATE');
    if (!state || state.schema !== 1 || typeof state.modelCode !== 'string') {
      throw new Error('INVALID_BRIDGE_STATE');
    }
    return state;
  }

  function fingerprint(state) {
    return JSON.stringify([state.schema, state.case, state.modelCode, state.step]);
  }

  async function hydrateActivity(serverState) {
    if (!serverState || serverState.schema !== 1 || typeof serverState.modelCode !== 'string') return false;
    await bridgeRequest('SET_STATE', {state:serverState});
    return true;
  }

  async function loadServerState() {
    var row = await window.ANDESDBLMS.loadActivityState(activity.activity_id);
    if (!row) {
      revision = 0;
      lastFingerprint = null;
      setSync('Aún sin guardado en la nube', 'idle');
      return;
    }
    await hydrateActivity(row.state);
    revision = Number(row.revision || 0);
    lastFingerprint = fingerprint(await serializeActivity());
    setSync('Guardado · versión ' + revision, 'saved');
  }

  async function doSave(force) {
    if (!hydrated || conflict || !activity) return;
    if (saveInFlight) {
      saveAgain = true;
      return;
    }

    saveInFlight = true;
    saveAgain = false;
    setSync('Guardando…', 'saving');
    try {
      var state = await serializeActivity();
      var fp = fingerprint(state);
      if (!force && fp === lastFingerprint) {
        setSync('Guardado · versión ' + revision, 'saved');
        return;
      }
      var result = await window.ANDESDBLMS.saveActivityState(
        activity.activity_id, state, revision, state.step
      );
      revision = Number(result && result.revision || revision);
      lastFingerprint = fp;
      setSync('Guardado · versión ' + revision, 'saved');
    } catch (err) {
      if (window.ANDESDBLMS.isRevisionConflict(err)) {
        conflict = true;
        if (conflictBox) conflictBox.hidden = false;
        setSync('Conflicto de edición: no se sobrescribió nada', 'conflict');
      } else if (err && err.status === 401) {
        setSync('Sesión vencida · vuelve a iniciar sesión', 'error');
      } else {
        setSync('No se pudo sincronizar · tu pantalla no se borró', 'error');
      }
    } finally {
      saveInFlight = false;
      if (saveAgain && !conflict) {
        saveAgain = false;
        scheduleSave();
      }
    }
  }

  function scheduleSave() {
    if (!hydrated || conflict) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { doSave(false); }, 800);
  }

  async function flushSave() {
    clearTimeout(saveTimer);
    await doSave(true);
    while (saveInFlight) await new Promise(function (r) { setTimeout(r, 50); });
    if (conflict) throw new Error('REVISION_CONFLICT');
  }

  async function submit() {
    if (!activity || conflict) return;
    submitButton.disabled = true;
    text(submitButton, 'Entregando…');
    try {
      await flushSave();
      var result = await window.ANDESDBLMS.submitActivity(activity.activity_id, revision);
      text(submitButton, 'Entregado · intento ' + result.attempt_no);
      setSync('Entrega registrada en el servidor', 'saved');
    } catch (err) {
      if (window.ANDESDBLMS.isRevisionConflict(err)) {
        conflict = true;
        if (conflictBox) conflictBox.hidden = false;
        setSync('Conflicto antes de entregar; no se creó una entrega', 'conflict');
      } else {
        text(submitButton, 'Reintentar entrega');
        setSync('La entrega no se registró', 'error');
      }
      submitButton.disabled = false;
    }
  }

  async function copyLocalWork() {
    var state = await serializeActivity();
    var code = state.modelCode;
    try {
      await navigator.clipboard.writeText(code);
      text(conflictCopy, 'Código copiado');
    } catch (_) {
      window.prompt('Copia este código antes de recargar:', code);
    }
  }

  async function reloadServer() {
    conflictReload.disabled = true;
    try {
      conflict = false;
      await loadServerState();
      if (conflictBox) conflictBox.hidden = true;
    } finally {
      conflictReload.disabled = false;
    }
  }

  async function init() {
    if (!window.ANDESDBAuth.isConfigured()) {
      setSync('Piloto aún no conectado a Supabase', 'error');
      if (submitButton) submitButton.disabled = true;
      return;
    }

    bridgeOrigin = validOrigin(window.ANDESDB_LMS_CONFIG.s7SandboxOrigin || '');
    if (!bridgeOrigin || bridgeOrigin === location.origin) {
      throw new Error('LAB_ORIGIN_MUST_BE_SEPARATE');
    }

    var session = await window.ANDESDBAuth.getSession();
    if (!session) {
      location.replace('./index.html');
      return;
    }

    frame.src = bridgeOrigin + '/pilot-lab/s7-bridge.html?parentOrigin=' + encodeURIComponent(location.origin);
    setSync('Cargando laboratorio aislado…', 'saving');
    await waitBridgeReady();

    activity = await window.ANDESDBLMS.resolveActivityBySlug(
      window.ANDESDB_LMS_CONFIG.s7ActivitySlug,
      window.ANDESDB_LMS_CONFIG.s7ActivityVersion
    );
    if (!activity) throw new Error('ACTIVITY_NOT_AVAILABLE');

    await loadServerState();
    hydrated = true;
    if (submitButton) submitButton.disabled = false;
  }

  if (submitButton) submitButton.addEventListener('click', submit);
  if (conflictCopy) conflictCopy.addEventListener('click', function () {
    copyLocalWork().catch(function () { setSync('No se pudo copiar el trabajo local', 'error'); });
  });
  if (conflictReload) conflictReload.addEventListener('click', function () {
    reloadServer().catch(function () { setSync('No se pudo recargar desde servidor', 'error'); });
  });
  if (logoutButton) logoutButton.addEventListener('click', async function () {
    await window.ANDESDBAuth.signOut();
    location.replace('./index.html');
  });

  window.addEventListener('beforeunload', function (event) {
    if (saveInFlight || saveAgain) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  init().catch(function (err) {
    setSync('No se pudo abrir el piloto: ' + (err && err.message ? err.message : 'error'), 'error');
    if (submitButton) submitButton.disabled = true;
  });
})();
