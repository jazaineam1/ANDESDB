/* ANDESDB · Adaptador S7 para el piloto LMS.
 * La actividad original permanece aislada y reutilizable. Este host traduce su
 * estado mediante exportar()/importar() y lo persiste en el servidor.
 */
(function () {
  'use strict';

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

  function text(node, value) {
    if (node) node.textContent = value;
  }

  function setSync(label, state) {
    text(syncText, label);
    if (syncText) syncText.dataset.state = state || '';
  }

  function child() {
    try { return frame && frame.contentWindow; } catch (_) { return null; }
  }

  function childReady() {
    var w = child();
    return !!(w && w.SQL && w.S && typeof w.exportar === 'function' && typeof w.importar === 'function' && typeof w.pintar === 'function');
  }

  function waitChildReady(timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise(function (resolve, reject) {
      var started = Date.now();
      (function poll() {
        if (childReady()) return resolve(child());
        if (Date.now() - started > timeoutMs) return reject(new Error('ACTIVITY_TIMEOUT'));
        setTimeout(poll, 100);
      })();
    });
  }

  function serializeActivity() {
    var w = child();
    if (!w || !w.S || typeof w.exportar !== 'function') throw new Error('ACTIVITY_NOT_READY');
    return {
      schema: 1,
      activity: 's7-restaurante-abc',
      case: String(w.CASO || 'abc'),
      modelCode: String(w.exportar()),
      step: Math.max(1, Math.min(7, Number(w.S.paso || 1)))
    };
  }

  function fingerprint(state) {
    return JSON.stringify([state.schema, state.case, state.modelCode, state.step]);
  }

  function hydrateActivity(serverState) {
    if (!serverState || serverState.schema !== 1 || typeof serverState.modelCode !== 'string') {
      return false;
    }
    var w = child();
    var error = w.importar(serverState.modelCode);
    if (error) throw new Error('STATE_IMPORT_FAILED: ' + error);
    if (w.S && serverState.step) w.S.paso = Math.max(1, Math.min(7, Number(serverState.step)));
    w.pintar();
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
    hydrateActivity(row.state);
    revision = Number(row.revision || 0);
    lastFingerprint = fingerprint(serializeActivity());
    setSync('Guardado · versión ' + revision, 'saved');
  }

  async function doSave(force) {
    if (!hydrated || conflict || !activity) return;
    if (saveInFlight) {
      saveAgain = true;
      return;
    }

    var state = serializeActivity();
    var fp = fingerprint(state);
    if (!force && fp === lastFingerprint) return;

    saveInFlight = true;
    saveAgain = false;
    setSync('Guardando…', 'saving');
    try {
      var result = await window.ANDESDBLMS.saveActivityState(
        activity.activity_id,
        state,
        revision,
        state.step
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

  function attachActivityListeners() {
    var doc = child().document;
    ['input', 'change', 'click'].forEach(function (eventName) {
      doc.addEventListener(eventName, scheduleSave, true);
    });
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
    var code = serializeActivity().modelCode;
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

    var session = await window.ANDESDBAuth.getSession();
    if (!session) {
      location.replace('./index.html');
      return;
    }

    setSync('Cargando tu trabajo…', 'saving');
    activity = await window.ANDESDBLMS.resolveActivityBySlug(
      window.ANDESDB_LMS_CONFIG.s7ActivitySlug,
      window.ANDESDB_LMS_CONFIG.s7ActivityVersion
    );
    if (!activity) throw new Error('ACTIVITY_NOT_AVAILABLE');

    await waitChildReady();
    await loadServerState();
    attachActivityListeners();
    hydrated = true;
    if (submitButton) submitButton.disabled = false;
  }

  if (submitButton) submitButton.addEventListener('click', submit);
  if (conflictCopy) conflictCopy.addEventListener('click', copyLocalWork);
  if (conflictReload) conflictReload.addEventListener('click', reloadServer);
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
