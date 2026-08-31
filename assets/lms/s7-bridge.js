/* ANDESDB · Bridge S7 aislado.
 * Vive en el origen del laboratorio y NUNCA recibe tokens LMS.
 */
(function () {
  'use strict';

  var SOURCE_HOST = 'andesdb-s7-host-v1';
  var SOURCE_BRIDGE = 'andesdb-s7-bridge-v1';
  var labFrame = document.getElementById('labFrame');
  var statusNode = document.getElementById('bridgeStatus');
  var parentOrigin = null;
  var ready = false;

  function text(value) {
    if (statusNode) statusNode.textContent = value;
  }

  function resolveParentOrigin() {
    var raw = new URL(location.href).searchParams.get('parentOrigin') || '';
    try {
      var u = new URL(raw);
      if (u.origin !== raw || u.protocol !== 'https:') throw new Error('invalid origin');
      return u.origin;
    } catch (_) {
      return null;
    }
  }

  function child() {
    try { return labFrame && labFrame.contentWindow; } catch (_) { return null; }
  }

  function childReady() {
    var w = child();
    return !!(w && w.SQL && w.S && typeof w.exportar === 'function' &&
      typeof w.importar === 'function' && typeof w.pintar === 'function');
  }

  function serialize() {
    var w = child();
    if (!childReady()) throw new Error('LAB_NOT_READY');
    return {
      schema: 1,
      activity: 's7-restaurante-abc',
      case: String(w.CASO || 'abc'),
      modelCode: String(w.exportar()),
      step: Math.max(1, Math.min(7, Number(w.S.paso || 1)))
    };
  }

  function hydrate(state) {
    if (!state || state.schema !== 1 || typeof state.modelCode !== 'string') {
      throw new Error('INVALID_STATE');
    }
    if (state.modelCode.length > 400000) throw new Error('STATE_TOO_LARGE');
    var w = child();
    if (!childReady()) throw new Error('LAB_NOT_READY');
    var error = w.importar(state.modelCode);
    if (error) throw new Error('IMPORT_FAILED');
    if (w.S && state.step) w.S.paso = Math.max(1, Math.min(7, Number(state.step)));
    w.pintar();
    return {ok:true};
  }

  function post(type, payload) {
    if (!parentOrigin || window.parent === window) return;
    window.parent.postMessage(Object.assign({source:SOURCE_BRIDGE, type:type}, payload || {}), parentOrigin);
  }

  function reply(requestId, fn) {
    try {
      post('RESPONSE', {requestId:requestId, ok:true, result:fn()});
    } catch (err) {
      post('RESPONSE', {
        requestId:requestId,
        ok:false,
        error:String(err && err.message ? err.message : 'BRIDGE_ERROR').slice(0,160)
      });
    }
  }

  function attachChangeSignals() {
    var w = child();
    if (!w || !w.document) return;
    ['input','change','click'].forEach(function (eventName) {
      w.document.addEventListener(eventName, function () {
        post('CHANGE');
      }, true);
    });
  }

  function waitReady() {
    var started = Date.now();
    (function poll() {
      if (childReady()) {
        ready = true;
        attachChangeSignals();
        text('Laboratorio aislado listo');
        setTimeout(function(){ if (statusNode) statusNode.hidden = true; }, 1200);
        post('READY', {protocol:1});
        return;
      }
      if (Date.now() - started > 15000) {
        text('No se pudo iniciar el laboratorio');
        post('ERROR', {error:'LAB_TIMEOUT'});
        return;
      }
      setTimeout(poll, 100);
    })();
  }

  parentOrigin = resolveParentOrigin();
  if (!parentOrigin || window.parent === window) {
    text('Bridge bloqueado: origen padre inválido');
    return;
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || event.origin !== parentOrigin) return;
    var data = event.data;
    if (!data || data.source !== SOURCE_HOST || typeof data.type !== 'string') return;
    if (!ready && data.type !== 'PING') return;

    if (data.type === 'PING') {
      if (ready) post('READY', {protocol:1});
      return;
    }
    if (typeof data.requestId !== 'string' || data.requestId.length > 80) return;
    if (data.type === 'GET_STATE') {
      reply(data.requestId, serialize);
    } else if (data.type === 'SET_STATE') {
      reply(data.requestId, function () { return hydrate(data.state); });
    }
  });

  labFrame.addEventListener('load', waitReady, {once:true});
  if (labFrame.contentWindow && labFrame.contentDocument && labFrame.contentDocument.readyState === 'complete') {
    waitReady();
  }
})();
