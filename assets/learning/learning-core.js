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
    const candidates = [document.title, location.pathname, document.body?.innerText?.slice(0, 400) || ''];
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
    state.sessions[n] ||= { visited: false, core: false, challenge: false, quiz: {}, quizScore: null, updatedAt: null };
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
    return String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function injectStyle() {
    if (document.getElementById('andes-learning-style')) return;
    const st = document.createElement('style');
    st.id = 'andes-learning-style';
    st.textContent = `
      #andes-learning-fab{position:fixed;right:18px;top:18px;z-index:2147482000;border:0;border-radius:999px;padding:10px 14px;background:#171717;color:#fff;font:700 13px/1.1 system-ui,sans-serif;box-shadow:0 6px 24px #0004;cursor:pointer;display:flex;align-items:center;gap:7px}
      #andes-learning-fab .dot{width:8px;height:8px;border-radius:50%;background:#ffd600}
      #andes-learning-fab.done .dot{background:#4ade80}
      #andes-learning-overlay{position:fixed;inset:0;z-index:2147483000;background:#000b;display:none;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#171717}
      #andes-learning-overlay.open{display:flex}
      .al-panel{width:min(920px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 30px 90px #0008}
      .al-head{position:sticky;top:0;z-index:3;background:#171717;color:#fff;padding:18px 22px;display:flex;gap:15px;align-items:center;border-radius:22px 22px 0 0}
      .al-head h2{font-size:20px;margin:0;flex:1}.al-head small{display:block;color:#bbb;margin-top:3px;font-weight:500}.al-close{border:0;background:#ffffff18;color:#fff;border-radius:10px;width:38px;height:38px;font-size:23px;cursor:pointer}
      .al-body{padding:22px;display:grid;gap:18px}.al-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.al-card{border:1px solid #ddd;border-radius:16px;padding:17px;background:#fff}.al-card.core{border-top:6px solid #22c55e}.al-card.challenge{border-top:6px solid #3b82f6}.al-card.dp{border-top:6px solid #8b5cf6}.al-card.meta{border-top:6px solid #ffd600}.al-card h3{margin:0 0 8px;font-size:17px}.al-card p{margin:7px 0;line-height:1.45}.al-card ul{margin:8px 0 0;padding-left:20px}.al-card li{margin:5px 0}.al-pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#f2f2f2;font-size:12px;font-weight:800;margin-bottom:8px}.al-btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;background:#171717;color:#fff;margin-top:10px}.al-btn.alt{background:#ececec;color:#171717}.al-btn.ok{background:#15803d}.al-btn.blue{background:#1d4ed8}.al-autonomous{background:#fff8cc;border:1px solid #e5c900;border-radius:14px;padding:14px 16px;font-weight:650;line-height:1.45}.al-q{padding:14px 0;border-top:1px solid #e7e7e7}.al-q:first-child{border-top:0;padding-top:3px}.al-q b{display:block;margin-bottom:9px}.al-opt{display:block;border:1px solid #ddd;border-radius:10px;padding:9px 11px;margin:7px 0;cursor:pointer}.al-opt:has(input:checked){border-color:#171717;background:#f7f7f7}.al-feedback{margin-top:9px;padding:10px 12px;border-radius:10px;display:none}.al-feedback.show{display:block}.al-feedback.good{background:#dcfce7;color:#14532d}.al-feedback.bad{background:#fee2e2;color:#7f1d1d}.al-progress{display:flex;gap:8px;align-items:center;margin-top:10px}.al-track{height:9px;background:#eee;border-radius:99px;overflow:hidden;flex:1}.al-fill{height:100%;background:#22c55e}.al-muted{color:#666;font-size:13px}.al-actions{display:flex;flex-wrap:wrap;gap:9px}.al-link{display:inline-flex;align-items:center;text-decoration:none}.al-real{background:#eef6ff;border:1px solid #9cc7ff;border-radius:12px;padding:12px 14px;margin-top:10px}.al-offline{font-size:12px;font-weight:750;color:#555}.al-score{font-weight:900;font-size:20px}
      @media(max-width:700px){#andes-learning-fab{top:10px;right:10px;padding:9px 11px}.al-grid{grid-template-columns:1fr}#andes-learning-overlay{padding:0}.al-panel{width:100vw;max-height:100vh;height:100vh;border-radius:0}.al-head{border-radius:0}.al-body{padding:16px}}
    `;
    document.head.appendChild(st);
  }

  function addManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = new URL('manifest.webmanifest', ROOT).href;
    document.head.appendChild(link);
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#171717';
    document.head.appendChild(theme);
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

  function completedCount(state) {
    let completed = 0, total = 0;
    for (let n = 6; n <= 16; n++) {
      total += 2;
      const s = state.sessions?.[String(n)];
      if (s?.core) completed++;
      if (s?.quizScore != null) completed++;
    }
    return { completed, total };
  }

  function renderQuiz(session, stateSession, n) {
    const qs = session.dp900 || [];
    if (!qs.length) return '';
    const stored = stateSession.quiz || {};
    return `<div class="al-card dp" style="grid-column:1/-1">
      <span class="al-pill">🎓 DP-900 · recuperación acumulativa</span>
      <h3>Chequeo de 2–3 minutos</h3>
      <p class="al-muted">No es una clase aparte: son preguntas cortas sobre lo que acabas de aprender.</p>
      ${qs.map((q, qi) => `<div class="al-q" data-q="${qi}">
        <b>${qi+1}. ${esc(q.pregunta)}</b>
        ${q.opciones.map((o, oi) => `<label class="al-opt"><input type="radio" name="al-q-${n}-${qi}" value="${oi}" ${stored[qi] == oi ? 'checked' : ''}> ${esc(o)}</label>`).join('')}
        <button class="al-btn alt al-check" data-q="${qi}">Verificar</button>
        <div class="al-feedback" id="al-fb-${qi}"></div>
      </div>`).join('')}
      <div class="al-progress"><span>Resultado:</span><strong id="al-score" class="al-score">${stateSession.quizScore == null ? '—' : stateSession.quizScore + '/' + qs.length}</strong></div>
    </div>`;
  }

  function renderPanel(session, n, offlineReady) {
    const state = readState();
    const ss = ensureSession(state, n);
    const cc = completedCount(state);
    const pct = Math.round(cc.completed / cc.total * 100);
    const autonomous = session.trabajo_autonomo_min ? `<div class="al-autonomous">🧭 <b>Sesión de trabajo autónomo guiado.</b> Después del briefing tendrás <b>${session.trabajo_autonomo_min} minutos</b> de trabajo sostenido. La intención es que tomes decisiones y produzcas un entregable, no que sigas una demostración paso a paso.</div>` : '';
    const real = session.servicio_real?.requerido ? `<div class="al-real"><b>☁️ Servicio real obligatorio:</b> ${esc(session.servicio_real.nombre)}<br><span class="al-muted">${esc(session.servicio_real.fallback || '')}</span></div>` : '';
    const fallback = session.fallback_analitico ? `<div class="al-real"><b>🧪 Laboratorio analítico local:</b> ${esc(session.fallback_analitico.motor)}<br><span class="al-muted">${esc(session.fallback_analitico.uso)}</span></div>` : '';

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
            <button class="al-btn blue" id="al-challenge">${ss.challenge ? '✓ Reto completado' : 'Marcar reto completado'}</button>
          </div>
          <div class="al-card meta">
            <span class="al-pill">📈 TU PROGRESO · solo en este navegador</span>
            <h3>${cc.completed}/${cc.total} hitos desde S6</h3>
            <div class="al-progress"><div class="al-track"><div class="al-fill" style="width:${pct}%"></div></div><b>${pct}%</b></div>
            <p class="al-muted">No necesitas cuenta. El progreso se guarda con localStorage y nunca sale de tu dispositivo.</p>
            <div class="al-actions">
              <button class="al-btn alt" id="al-reset">Restablecer esta sesión</button>
              <a class="al-btn alt al-link" target="_blank" rel="noopener" href="https://github.com/jazaineam1/ANDESDB/issues/new?template=problema-clase.yml&title=${encodeURIComponent('[S'+n+'] ')}">🐛 Reportar problema</a>
            </div>
            <p class="al-offline">${offlineReady ? '✓ Recursos esenciales preparados para funcionar con conexión inestable.' : 'El modo offline se activará cuando el navegador termine de preparar los recursos.'}</p>
            <button class="al-btn alt" id="al-install" style="display:none">Instalar ANDESDB</button>
            ${real}${fallback}
          </div>
          <div class="al-card meta">
            <span class="al-pill">🧠 METACOGNICIÓN</span>
            <h3>Antes de cerrar</h3>
            <p>Pregúntate: <b>¿podría explicar la decisión que tomé sin mirar el código?</b> El objetivo del curso no es copiar una sintaxis, sino justificar una solución.</p>
            <label class="al-muted">Confianza al terminar esta sesión:</label>
            <div class="al-actions" id="al-confidence">
              ${[1,2,3].map(v => `<button class="al-btn alt" data-v="${v}">${v===1?'Necesito repaso':v===2?'Puedo explicarlo':'Podría enseñarlo'}</button>`).join('')}
            </div>
          </div>
          ${renderQuiz(session, ss, n)}
        </div>
      </div>
    </div>`;
  }

  function updateFab(n) {
    const state = readState();
    const s = ensureSession(state, n);
    const fab = document.getElementById('andes-learning-fab');
    if (!fab) return;
    fab.classList.toggle('done', !!(s.core && s.quizScore != null));
    const txt = fab.querySelector('.label');
    if (txt) txt.textContent = s.core ? 'Progreso' : 'Ruta';
  }

  function bindPanel(overlay, session, n) {
    const close = () => overlay.classList.remove('open');
    overlay.querySelector('.al-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

    overlay.querySelector('#al-core')?.addEventListener('click', e => {
      const s = mark(n, 'core', true); e.currentTarget.textContent = '✓ Núcleo completado'; e.currentTarget.classList.add('ok'); updateFab(n);
    });
    overlay.querySelector('#al-challenge')?.addEventListener('click', e => {
      mark(n, 'challenge', true); e.currentTarget.textContent = '✓ Reto completado';
    });
    overlay.querySelector('#al-reset')?.addEventListener('click', () => {
      const state = readState(); state.sessions[n] = { visited:true, core:false, challenge:false, quiz:{}, quizScore:null, updatedAt:new Date().toISOString() }; writeState(state); location.reload();
    });
    overlay.querySelectorAll('#al-confidence [data-v]').forEach(b => b.addEventListener('click', () => {
      const state = readState(); const s = ensureSession(state, n); s.confidence = Number(b.dataset.v); s.updatedAt = new Date().toISOString(); writeState(state);
      overlay.querySelectorAll('#al-confidence [data-v]').forEach(x => x.classList.toggle('ok', x === b));
    }));

    const qs = session.dp900 || [];
    overlay.querySelectorAll('.al-check').forEach(btn => btn.addEventListener('click', () => {
      const qi = Number(btn.dataset.q);
      const chosen = overlay.querySelector(`input[name="al-q-${n}-${qi}"]:checked`);
      const fb = overlay.querySelector(`#al-fb-${qi}`);
      if (!chosen) { fb.className = 'al-feedback show bad'; fb.textContent = 'Selecciona una opción antes de verificar.'; return; }
      const value = Number(chosen.value);
      const state = readState(); const ss = ensureSession(state, n); ss.quiz ||= {}; ss.quiz[qi] = value;
      const good = value === qs[qi].correcta;
      fb.className = 'al-feedback show ' + (good ? 'good' : 'bad');
      fb.innerHTML = `<b>${good ? '✓ Correcto.' : 'Todavía no.'}</b> ${esc(qs[qi].explicacion)}`;
      let answered = 0, score = 0;
      qs.forEach((q, i) => { if (ss.quiz[i] != null) { answered++; if (Number(ss.quiz[i]) === q.correcta) score++; } });
      ss.quizScore = answered === qs.length ? score : null; ss.updatedAt = new Date().toISOString(); writeState(state);
      overlay.querySelector('#al-score').textContent = answered === qs.length ? `${score}/${qs.length}` : `${answered}/${qs.length} respondidas`;
      updateFab(n);
    }));

    const installBtn = overlay.querySelector('#al-install');
    if (installPrompt && installBtn) installBtn.style.display = '';
    installBtn?.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; installBtn.style.display = 'none';
    });
  }

  async function init() {
    const n = sessionNumber();
    if (!n || Number(n) < 6) return;
    injectStyle(); addManifest();

    let plan;
    try { plan = await fetch(PLAN_URL, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }); }
    catch (err) { console.warn('[ANDESDB] No se pudo cargar learning-plan.json', err); return; }
    const session = plan.sesiones?.[n];
    if (!session) return;

    const state = readState(); const ss = ensureSession(state, n); ss.visited = true; ss.updatedAt = new Date().toISOString(); writeState(state);
    const offlineReady = await registerSW();

    const fab = document.createElement('button');
    fab.id = 'andes-learning-fab'; fab.type = 'button'; fab.innerHTML = '<span class="dot"></span><span class="label">Ruta</span>';
    fab.title = 'Núcleo, reto, progreso y chequeo DP-900'; document.body.appendChild(fab);

    const overlay = document.createElement('div'); overlay.id = 'andes-learning-overlay'; overlay.innerHTML = renderPanel(session, n, offlineReady); document.body.appendChild(overlay);
    bindPanel(overlay, session, n); updateFab(n);
    fab.addEventListener('click', () => overlay.classList.add('open'));

    if (session.trabajo_autonomo_min) {
      const badge = document.createElement('div'); badge.style.cssText='position:fixed;right:18px;top:64px;z-index:2147481900;background:#fff8cc;border:1px solid #e5c900;border-radius:999px;padding:6px 10px;font:750 11px system-ui;color:#171717;box-shadow:0 4px 18px #0002';
      badge.textContent = `🧭 trabajo autónomo · ${session.trabajo_autonomo_min} min`; document.body.appendChild(badge);
    }
  }

  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; const b = document.getElementById('al-install'); if (b) b.style.display = ''; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
