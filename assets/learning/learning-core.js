(() => {
  'use strict';

  const script = document.currentScript || [...document.scripts].find(s => /learning-core\.js(?:\?|$)/.test(s.src));
  if (!script) return;

  const BASE = new URL('./', script.src);
  const PLAN_URL = new URL('learning-plan.json', BASE).href;
  const ROOT = new URL('../../', BASE);
  const STORAGE_KEY = 'andesdb.learning.v1';
  const SESSION_RE = /(?:sesi[oó]n|sesion)[-_\s]*(\d{1,2})/i;
  let installPrompt = null;

  function sessionNumber() {
    const candidates = [document.title, location.pathname, document.body?.innerText?.slice(0, 500) || ''];
    for (const text of candidates) {
      const m = text.match(SESSION_RE);
      if (m) return String(Number(m[1]));
    }
    return null;
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { sessions: {} };
    } catch (_) {
      return { sessions: {} };
    }
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function ensureSession(state, n) {
    state.sessions ||= {};
    state.sessions[n] ||= {
      visited: false,
      core: false,
      challenge: false,
      quiz: {},
      quizScore: null,
      confidence: null,
      updatedAt: null
    };
    return state.sessions[n];
  }

  function mark(n, field, value = true) {
    const state = readState();
    const s = ensureSession(state, n);
    s[field] = value;
    s.updatedAt = new Date().toISOString();
    writeState(state);
    return s;
  }

  function esc(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  function injectStyle() {
    if (document.getElementById('andes-learning-style')) return;
    const st = document.createElement('style');
    st.id = 'andes-learning-style';
    st.textContent = `
      /* Ruta de aprendizaje: deliberadamente separada de los controles de la presentación */
      #andes-learning-route{position:fixed;left:12px;bottom:18px;z-index:2147481800;border:1px solid #ffffff66;border-radius:999px;padding:9px 12px;background:#171717eF;color:#fff;font:800 12px/1 system-ui,sans-serif;box-shadow:0 5px 20px #0004;cursor:pointer;display:flex;align-items:center;gap:7px;backdrop-filter:blur(8px)}
      #andes-learning-route .dot{width:8px;height:8px;border-radius:50%;background:#ffd600}
      #andes-learning-route.done .dot{background:#4ade80}
      #andes-learning-overlay{position:fixed;inset:0;z-index:2147483000;background:#000b;display:none;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#171717}
      #andes-learning-overlay.open{display:flex}
      .al-panel{width:min(920px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 30px 90px #0008}
      .al-head{position:sticky;top:0;z-index:3;background:#171717;color:#fff;padding:18px 22px;display:flex;gap:15px;align-items:center;border-radius:22px 22px 0 0}
      .al-head h2{font-size:20px;margin:0;flex:1}.al-head small{display:block;color:#bbb;margin-top:3px;font-weight:500}.al-close{border:0;background:#ffffff18;color:#fff;border-radius:10px;width:38px;height:38px;font-size:23px;cursor:pointer}
      .al-body{padding:22px;display:grid;gap:18px}.al-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.al-card{border:1px solid #ddd;border-radius:16px;padding:17px;background:#fff}.al-card.core{border-top:6px solid #22c55e}.al-card.challenge{border-top:6px solid #3b82f6}.al-card.dp{border-top:6px solid #8b5cf6}.al-card.meta{border-top:6px solid #ffd600}.al-card.info{border-top:6px solid #94a3b8}.al-card h3{margin:0 0 8px;font-size:17px}.al-card p{margin:7px 0;line-height:1.45}.al-card ul{margin:8px 0 0;padding-left:20px}.al-card li{margin:5px 0}.al-pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#f2f2f2;font-size:12px;font-weight:800;margin-bottom:8px}.al-btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;background:#171717;color:#fff;margin-top:10px}.al-btn.alt{background:#ececec;color:#171717}.al-btn.ok{background:#15803d;color:#fff}.al-btn.blue{background:#1d4ed8;color:#fff}.al-btn.blue.done{background:#1e40af}.al-autonomous{background:#fff8cc;border:1px solid #e5c900;border-radius:14px;padding:14px 16px;font-weight:650;line-height:1.45}.al-q{padding:14px 0;border-top:1px solid #e7e7e7}.al-q:first-child{border-top:0;padding-top:3px}.al-q b{display:block;margin-bottom:9px}.al-opt{display:block;border:1px solid #ddd;border-radius:10px;padding:9px 11px;margin:7px 0;cursor:pointer}.al-opt:has(input:checked){border-color:#171717;background:#f7f7f7}.al-feedback{margin-top:9px;padding:10px 12px;border-radius:10px;display:none}.al-feedback.show{display:block}.al-feedback.good{background:#dcfce7;color:#14532d}.al-feedback.bad{background:#fee2e2;color:#7f1d1d}.al-muted{color:#666;font-size:13px}.al-actions{display:flex;flex-wrap:wrap;gap:9px}.al-link{display:inline-flex;align-items:center;text-decoration:none}.al-real{background:#eef6ff;border:1px solid #9cc7ff;border-radius:12px;padding:12px 14px;margin-top:10px}.al-offline{font-size:12px;font-weight:750;color:#555}.al-score{font-weight:900;font-size:20px}.al-utility{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:0 2px}.al-utility .al-muted{flex:1;min-width:220px}

      /* Mi avance vive en la portada, no dentro de la presentación */
      .ahp-wrap{margin-top:16px;padding-top:15px;border-top:1px solid #e3e7ea;text-align:left}
      .ahp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.ahp-head b{font-size:15px}.ahp-head small{display:block;color:#66717b;margin-top:2px;line-height:1.35}.ahp-summary{font-weight:800;font-size:12px;background:#f1f5f9;border-radius:999px;padding:5px 9px;white-space:nowrap}
      .ahp-list{display:grid;gap:7px}.ahp-row{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;padding:8px 9px;border:1px solid #e5e7eb;border-radius:11px;background:#fff}.ahp-row.next{border-color:#f2c900;background:#fffbe6}.ahp-num{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#f2f4f6;font-size:12px;font-weight:900}.ahp-row.complete .ahp-num{background:#dcfce7;color:#166534}.ahp-row.inprogress .ahp-num{background:#dbeafe;color:#1d4ed8}.ahp-title{font-size:12px;font-weight:800;line-height:1.25}.ahp-meta{font-size:10.5px;color:#6b7280;margin-top:2px;line-height:1.3}.ahp-state{font-size:10.5px;font-weight:900;white-space:nowrap}.ahp-state.complete{color:#166534}.ahp-state.next{color:#8a6500}.ahp-state.inprogress{color:#1d4ed8}.ahp-state.pending{color:#7b8490}.ahp-more{margin-top:9px;font-size:11px;color:#53606c}.ahp-more summary{cursor:pointer;font-weight:800}.ahp-more .ahp-list{margin-top:7px}.ahp-note{font-size:10.5px;color:#7a838c;margin-top:10px;line-height:1.35}

      @media(max-width:700px){
        #andes-learning-route{left:10px;bottom:12px;padding:8px 10px;font-size:11px}
        .al-grid{grid-template-columns:1fr}#andes-learning-overlay{padding:0}.al-panel{width:100vw;max-height:100vh;height:100vh;border-radius:0}.al-head{border-radius:0}.al-body{padding:16px}
      }
    `;
    document.head.appendChild(st);
  }

  function addManifest() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = new URL('manifest.webmanifest', ROOT).href;
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#171717';
      document.head.appendChild(theme);
    }
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.register(new URL('service-worker.js', ROOT).href);
      await navigator.serviceWorker.ready;
      return !!reg;
    } catch (err) {
      console.warn('[ANDESDB] Service Worker no disponible:', err);
      return false;
    }
  }

  function renderQuiz(session, stateSession, n) {
    const qs = session.dp900 || [];
    if (!qs.length) return '';
    const stored = stateSession.quiz || {};
    return `<div class="al-card dp" style="grid-column:1/-1">
      <span class="al-pill">🎓 DP-900 · recuperación acumulativa</span>
      <h3>Chequeo de 2–3 minutos</h3>
      <p class="al-muted">Preguntas cortas sobre lo que acabas de aprender. Sirven para recuperar el concepto varias veces antes del examen.</p>
      ${qs.map((q, qi) => `<div class="al-q" data-q="${qi}">
        <b>${qi+1}. ${esc(q.pregunta)}</b>
        ${q.opciones.map((o, oi) => `<label class="al-opt"><input type="radio" name="al-q-${n}-${qi}" value="${oi}" ${stored[qi] == oi ? 'checked' : ''}> ${esc(o)}</label>`).join('')}
        <button class="al-btn alt al-check" data-q="${qi}">Verificar</button>
        <div class="al-feedback" id="al-fb-${qi}"></div>
      </div>`).join('')}
      <div><span>Resultado: </span><strong id="al-score" class="al-score">${stateSession.quizScore == null ? '—' : stateSession.quizScore + '/' + qs.length}</strong></div>
    </div>`;
  }

  function renderPanel(session, n, offlineReady) {
    const state = readState();
    const ss = ensureSession(state, n);
    const autonomous = session.trabajo_autonomo_min
      ? `<div class="al-autonomous">🧭 <b>Trabajo autónomo guiado.</b> Después del briefing tendrás <b>${session.trabajo_autonomo_min} minutos</b> de trabajo sostenido. El objetivo es producir y decidir, no seguir una demostración paso a paso.</div>`
      : '';
    const real = session.servicio_real?.requerido
      ? `<div class="al-real"><b>☁️ Servicio real:</b> ${esc(session.servicio_real.nombre)}<br><span class="al-muted">${esc(session.servicio_real.fallback || '')}</span></div>`
      : '';
    const fallback = session.fallback_analitico
      ? `<div class="al-real"><b>🧪 Respaldo local:</b> ${esc(session.fallback_analitico.motor)}<br><span class="al-muted">${esc(session.fallback_analitico.uso)}</span></div>`
      : '';

    return `<div class="al-panel" role="dialog" aria-modal="true" aria-label="Ruta de aprendizaje de la sesión ${n}">
      <div class="al-head"><div><h2>Sesión ${n} · ${esc(session.titulo)}</h2><small>${esc(session.objetivo)}</small></div><button class="al-close" aria-label="Cerrar">×</button></div>
      <div class="al-body">
        ${autonomous}
        <div class="al-grid">
          <div class="al-card core">
            <span class="al-pill">🟢 NÚCLEO · todos</span>
            <h3>${esc(session.nucleo?.titulo)}</h3>
            <p>${esc(session.nucleo?.instrucciones)}</p>
            ${session.nucleo?.criterios?.length ? `<ul>${session.nucleo.criterios.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
            <button class="al-btn ${ss.core ? 'ok' : ''}" id="al-core">${ss.core ? '✓ Núcleo completado' : 'Marcar núcleo completado'}</button>
          </div>

          <div class="al-card challenge">
            <span class="al-pill">🔵 RETO · si terminas antes</span>
            <h3>${esc(session.reto?.titulo)}</h3>
            <p>${esc(session.reto?.instrucciones)}</p>
            <button class="al-btn blue ${ss.challenge ? 'done' : ''}" id="al-challenge">${ss.challenge ? '✓ Reto completado' : 'Marcar reto completado'}</button>
          </div>

          <div class="al-card meta" style="grid-column:1/-1">
            <span class="al-pill">🧠 ANTES DE CERRAR</span>
            <h3>¿Podría explicar la decisión que tomé sin mirar el código?</h3>
            <p>El objetivo no es copiar una sintaxis, sino poder justificar una solución.</p>
            <div class="al-actions" id="al-confidence">
              ${[1,2,3].map(v => `<button class="al-btn alt ${ss.confidence === v ? 'ok' : ''}" data-v="${v}">${v===1?'Necesito repaso':v===2?'Puedo explicarlo':'Podría enseñarlo'}</button>`).join('')}
            </div>
          </div>

          ${renderQuiz(session, ss, n)}

          ${(real || fallback) ? `<div class="al-card info" style="grid-column:1/-1"><span class="al-pill">🧰 ENTORNO DE PRÁCTICA</span>${real}${fallback}</div>` : ''}
        </div>

        <div class="al-utility">
          <span class="al-muted">${offlineReady ? '✓ Recursos esenciales preparados para una conexión inestable.' : 'El navegador está preparando los recursos esenciales.'}</span>
          <a class="al-btn alt al-link" target="_blank" rel="noopener" href="https://github.com/jazaineam1/ANDESDB/issues/new?template=problema-clase.yml&title=${encodeURIComponent('[S'+n+'] ')}">🐛 Reportar problema</a>
          <button class="al-btn alt" id="al-install" style="display:none">Instalar ANDESDB</button>
        </div>
      </div>
    </div>`;
  }

  function updateRouteButton(n) {
    const state = readState();
    const s = ensureSession(state, n);
    const btn = document.getElementById('andes-learning-route');
    if (!btn) return;
    btn.classList.toggle('done', !!s.core);
    const label = btn.querySelector('.label');
    if (label) label.textContent = s.core ? 'Ruta ✓' : 'Ruta';
  }

  function bindPanel(overlay, session, n) {
    const close = () => overlay.classList.remove('open');
    overlay.querySelector('.al-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

    overlay.querySelector('#al-core')?.addEventListener('click', e => {
      mark(n, 'core', true);
      e.currentTarget.textContent = '✓ Núcleo completado';
      e.currentTarget.classList.add('ok');
      updateRouteButton(n);
    });

    overlay.querySelector('#al-challenge')?.addEventListener('click', e => {
      mark(n, 'challenge', true);
      e.currentTarget.textContent = '✓ Reto completado';
      e.currentTarget.classList.add('done');
    });

    overlay.querySelectorAll('#al-confidence [data-v]').forEach(b => b.addEventListener('click', () => {
      const state = readState();
      const s = ensureSession(state, n);
      s.confidence = Number(b.dataset.v);
      s.updatedAt = new Date().toISOString();
      writeState(state);
      overlay.querySelectorAll('#al-confidence [data-v]').forEach(x => x.classList.toggle('ok', x === b));
    }));

    const qs = session.dp900 || [];
    overlay.querySelectorAll('.al-check').forEach(btn => btn.addEventListener('click', () => {
      const qi = Number(btn.dataset.q);
      const chosen = overlay.querySelector(`input[name="al-q-${n}-${qi}"]:checked`);
      const fb = overlay.querySelector(`#al-fb-${qi}`);
      if (!chosen) {
        fb.className = 'al-feedback show bad';
        fb.textContent = 'Selecciona una opción antes de verificar.';
        return;
      }
      const value = Number(chosen.value);
      const state = readState();
      const ss = ensureSession(state, n);
      ss.quiz ||= {};
      ss.quiz[qi] = value;
      const good = value === qs[qi].correcta;
      fb.className = 'al-feedback show ' + (good ? 'good' : 'bad');
      fb.innerHTML = `<b>${good ? '✓ Correcto.' : 'Todavía no.'}</b> ${esc(qs[qi].explicacion)}`;
      let answered = 0, score = 0;
      qs.forEach((q, i) => {
        if (ss.quiz[i] != null) {
          answered++;
          if (Number(ss.quiz[i]) === q.correcta) score++;
        }
      });
      ss.quizScore = answered === qs.length ? score : null;
      ss.updatedAt = new Date().toISOString();
      writeState(state);
      const scoreEl = overlay.querySelector('#al-score');
      if (scoreEl) scoreEl.textContent = answered === qs.length ? `${score}/${qs.length}` : `${answered}/${qs.length} respondidas`;
    }));

    const installBtn = overlay.querySelector('#al-install');
    if (installPrompt && installBtn) installBtn.style.display = '';
    installBtn?.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  function personalStatus(n, state, nextNumber) {
    const ss = state.sessions?.[String(n)];
    if (ss?.core) return { cls: 'complete', label: '✓ Completada' };
    if (ss?.visited) return { cls: 'inprogress', label: 'En curso' };
    if (Number(n) === Number(nextNumber)) return { cls: 'next', label: 'Siguiente' };
    return { cls: 'pending', label: 'Pendiente' };
  }

  function renderHomeProgress(plan) {
    const card = document.querySelector('.progress-card');
    if (!card) return;

    const heading = card.querySelector('.progress-head b');
    if (heading) heading.textContent = 'Ruta del curso';

    const state = readState();
    const sessions = Object.entries(plan.sesiones || {})
      .map(([n, s]) => ({ n: Number(n), ...s }))
      .filter(s => s.n >= 6 && s.n <= 16)
      .sort((a, b) => a.n - b.n);

    const completed = sessions.filter(s => state.sessions?.[String(s.n)]?.core).length;
    const next = sessions.find(s => !state.sessions?.[String(s.n)]?.core) || sessions[sessions.length - 1];
    const nextNumber = next?.n;

    const visible = [];
    const firstIdx = Math.max(0, sessions.findIndex(s => s.n === nextNumber) - 1);
    for (let i = firstIdx; i < Math.min(firstIdx + 4, sessions.length); i++) visible.push(sessions[i]);

    function row(s) {
      const st = personalStatus(s.n, state, nextNumber);
      const ss = state.sessions?.[String(s.n)];
      const extras = [];
      if (ss?.challenge) extras.push('Reto ✓');
      if (ss?.quizScore != null) extras.push(`DP-900 ${ss.quizScore}/${(s.dp900 || []).length}`);
      return `<div class="ahp-row ${st.cls}">
        <span class="ahp-num">S${s.n}</span>
        <div><div class="ahp-title">${esc(s.titulo)}</div>${extras.length ? `<div class="ahp-meta">${extras.join(' · ')}</div>` : ''}</div>
        <span class="ahp-state ${st.cls}">${st.label}</span>
      </div>`;
    }

    const old = card.querySelector('.ahp-wrap');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.className = 'ahp-wrap';
    wrap.innerHTML = `
      <div class="ahp-head">
        <div><b>Mi avance</b><small>Qué sesiones ya completaste desde S6.</small></div>
        <span class="ahp-summary">${completed}/${sessions.length} completas</span>
      </div>
      <div class="ahp-list">${visible.map(row).join('')}</div>
      <details class="ahp-more"><summary>Ver S6–S16</summary><div class="ahp-list">${sessions.map(row).join('')}</div></details>
      <div class="ahp-note">Se guarda en este dispositivo. El reto y el quiz complementan tu aprendizaje, pero completar el Núcleo es lo que marca una sesión como completada.</div>`;
    card.appendChild(wrap);
  }

  async function loadPlan() {
    return fetch(PLAN_URL, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  async function initHome() {
    injectStyle();
    try {
      const plan = await loadPlan();
      renderHomeProgress(plan);
    } catch (err) {
      console.warn('[ANDESDB] No se pudo cargar el avance personal:', err);
    }
  }

  async function initSession(n) {
    injectStyle();
    addManifest();

    let plan;
    try {
      plan = await loadPlan();
    } catch (err) {
      console.warn('[ANDESDB] No se pudo cargar learning-plan.json', err);
      return;
    }

    const session = plan.sesiones?.[n];
    if (!session) return;

    const state = readState();
    const ss = ensureSession(state, n);
    ss.visited = true;
    ss.updatedAt = new Date().toISOString();
    writeState(state);

    const offlineReady = await registerSW();

    const route = document.createElement('button');
    route.id = 'andes-learning-route';
    route.type = 'button';
    route.innerHTML = '<span class="dot"></span><span class="label">Ruta</span>';
    route.title = 'Núcleo, reto y chequeo DP-900';
    document.body.appendChild(route);

    const overlay = document.createElement('div');
    overlay.id = 'andes-learning-overlay';
    overlay.innerHTML = renderPanel(session, n, offlineReady);
    document.body.appendChild(overlay);

    bindPanel(overlay, session, n);
    updateRouteButton(n);
    route.addEventListener('click', () => overlay.classList.add('open'));
  }

  async function init() {
    const n = sessionNumber();
    if (!n) {
      await initHome();
      return;
    }
    if (Number(n) < 6) return;
    await initSession(n);
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    const b = document.getElementById('al-install');
    if (b) b.style.display = '';
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();