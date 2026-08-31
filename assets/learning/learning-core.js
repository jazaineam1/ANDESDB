(() => {
  'use strict';

  const script = document.currentScript || [...document.scripts].find(s => /learning-core\.js(?:\?|$)/.test(s.src));
  if (!script) return;

  const BASE = new URL('./', script.src);
  const PLAN_URL = new URL('learning-plan.json', BASE).href;
  const ROOT = new URL('../../', BASE);
  const SESSION_RE = /(?:sesi[oó]n|sesion)[-_\s]*(\d{1,2})/i;

  // Diferenciación por velocidad técnica. No es una mecánica transversal.
  const CODE_PRACTICE_SESSIONS = new Set(['11', '12', '13', '14', '15']);

  function sessionNumber() {
    const candidates = [document.title, location.pathname, document.body?.innerText?.slice(0, 500) || ''];
    for (const text of candidates) {
      const m = text.match(SESSION_RE);
      if (m) return String(Number(m[1]));
    }
    return null;
  }

  function esc(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  function addManifest() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = new URL('manifest.webmanifest', ROOT).href;
      document.head.appendChild(link);
    }
  }

  async function registerSW() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      await navigator.serviceWorker.register(new URL('service-worker.js', ROOT).href);
      await navigator.serviceWorker.ready;
      return true;
    } catch (err) {
      console.warn('[ANDESDB] Service Worker no disponible:', err);
      return false;
    }
  }

  function styles() {
    if (document.getElementById('andes-practice-style')) return;
    const st = document.createElement('style');
    st.id = 'andes-practice-style';
    st.textContent = `
      #andes-practice-btn{position:fixed;left:12px;bottom:16px;z-index:2147481800;border:1px solid #ffffff66;border-radius:999px;padding:9px 12px;background:#171717ef;color:#fff;font:800 12px/1 system-ui,sans-serif;box-shadow:0 5px 20px #0004;cursor:pointer;display:flex;align-items:center;gap:7px;backdrop-filter:blur(8px)}
      #andes-practice-btn .dot{width:8px;height:8px;border-radius:50%;background:#ffd600}
      #andes-practice-overlay{position:fixed;inset:0;z-index:2147483000;background:#000b;display:none;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#171717}
      #andes-practice-overlay.open{display:flex}
      .ap-panel{width:min(920px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 30px 90px #0008}
      .ap-head{position:sticky;top:0;z-index:3;background:#171717;color:#fff;padding:18px 22px;display:flex;gap:15px;align-items:center;border-radius:22px 22px 0 0}
      .ap-head h2{font-size:20px;margin:0;flex:1}.ap-head small{display:block;color:#bbb;margin-top:3px;font-weight:500}.ap-close{border:0;background:#ffffff18;color:#fff;border-radius:10px;width:38px;height:38px;font-size:23px;cursor:pointer}
      .ap-body{padding:22px;display:grid;gap:18px}.ap-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ap-card{border:1px solid #ddd;border-radius:16px;padding:17px;background:#fff}.ap-card.core{border-top:6px solid #22c55e}.ap-card.challenge{border-top:6px solid #3b82f6}.ap-card.dp{border-top:6px solid #8b5cf6}.ap-card.info{border-top:6px solid #94a3b8}.ap-card h3{margin:0 0 8px;font-size:17px}.ap-card p{margin:7px 0;line-height:1.45}.ap-card ul{margin:8px 0 0;padding-left:20px}.ap-card li{margin:5px 0}.ap-pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#f2f2f2;font-size:12px;font-weight:800;margin-bottom:8px}.ap-muted{color:#666;font-size:13px}.ap-autonomous{background:#fff8cc;border:1px solid #e5c900;border-radius:14px;padding:14px 16px;font-weight:650;line-height:1.45}.ap-real{background:#eef6ff;border:1px solid #9cc7ff;border-radius:12px;padding:12px 14px;margin-top:10px}.ap-q{padding:14px 0;border-top:1px solid #e7e7e7}.ap-q:first-child{border-top:0}.ap-q b{display:block;margin-bottom:9px}.ap-opt{display:block;border:1px solid #ddd;border-radius:10px;padding:9px 11px;margin:7px 0;cursor:pointer}.ap-opt:has(input:checked){border-color:#171717;background:#f7f7f7}.ap-check{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;background:#ececec;color:#171717}.ap-feedback{margin-top:9px;padding:10px 12px;border-radius:10px;display:none}.ap-feedback.show{display:block}.ap-feedback.good{background:#dcfce7;color:#14532d}.ap-feedback.bad{background:#fee2e2;color:#7f1d1d}.ap-score{font-weight:900;font-size:20px}
      @media(max-width:700px){#andes-practice-btn{left:10px;bottom:12px;padding:8px 10px;font-size:11px}.ap-grid{grid-template-columns:1fr}#andes-practice-overlay{padding:0}.ap-panel{width:100vw;max-height:100vh;height:100vh;border-radius:0}.ap-head{border-radius:0}.ap-body{padding:16px}}
    `;
    document.head.appendChild(st);
  }

  function renderQuiz(session, n) {
    const qs = session.dp900 || [];
    if (!qs.length) return '';
    return `<div class="ap-card dp" style="grid-column:1/-1">
      <span class="ap-pill">🎓 DP-900 · práctica breve</span>
      <h3>Comprueba el concepto</h3>
      <p class="ap-muted">El resultado solo dura en esta página. No hay cuenta ni progreso asociado al dispositivo.</p>
      ${qs.map((q, qi) => `<div class="ap-q" data-q="${qi}" data-answered="0" data-correct="0">
        <b>${qi + 1}. ${esc(q.pregunta)}</b>
        ${q.opciones.map((o, oi) => `<label class="ap-opt"><input type="radio" name="ap-q-${n}-${qi}" value="${oi}"> ${esc(o)}</label>`).join('')}
        <button class="ap-check" data-q="${qi}">Verificar</button>
        <div class="ap-feedback" id="ap-fb-${qi}"></div>
      </div>`).join('')}
      <div>Resultado de este intento: <strong class="ap-score" id="ap-score">—</strong></div>
    </div>`;
  }

  function render(session, n, offlineReady) {
    const autonomous = session.trabajo_autonomo_min
      ? `<div class="ap-autonomous">🧭 <b>Trabajo autónomo guiado:</b> ${session.trabajo_autonomo_min} minutos. Resuelve primero la práctica base; si terminas antes, pasa al reto técnico.</div>`
      : '';
    const real = session.servicio_real?.requerido
      ? `<div class="ap-real"><b>☁️ Servicio real:</b> ${esc(session.servicio_real.nombre)}<br><span class="ap-muted">${esc(session.servicio_real.fallback || '')}</span></div>`
      : '';
    const fallback = session.fallback_analitico
      ? `<div class="ap-real"><b>🧪 Respaldo local:</b> ${esc(session.fallback_analitico.motor)}<br><span class="ap-muted">${esc(session.fallback_analitico.uso)}</span></div>`
      : '';

    return `<div class="ap-panel" role="dialog" aria-modal="true" aria-label="Práctica técnica de la sesión ${n}">
      <div class="ap-head"><div><h2>Práctica técnica · Sesión ${n}</h2><small>${esc(session.objetivo)}</small></div><button class="ap-close" aria-label="Cerrar">×</button></div>
      <div class="ap-body">
        ${autonomous}
        <div class="ap-grid">
          <div class="ap-card core">
            <span class="ap-pill">🟢 PRÁCTICA BASE · todos</span>
            <h3>${esc(session.nucleo?.titulo)}</h3>
            <p>${esc(session.nucleo?.instrucciones)}</p>
            ${session.nucleo?.criterios?.length ? `<ul>${session.nucleo.criterios.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          </div>
          <div class="ap-card challenge">
            <span class="ap-pill">🔵 EXTENSIÓN · si terminas antes</span>
            <h3>${esc(session.reto?.titulo)}</h3>
            <p>${esc(session.reto?.instrucciones)}</p>
          </div>
          ${renderQuiz(session, n)}
          ${(real || fallback) ? `<div class="ap-card info" style="grid-column:1/-1"><span class="ap-pill">🧰 ENTORNO DE PRÁCTICA</span>${real}${fallback}</div>` : ''}
        </div>
        <p class="ap-muted">${offlineReady ? '✓ Recursos esenciales disponibles con mayor tolerancia a una conexión inestable.' : 'Preparando recursos esenciales…'}</p>
      </div>
    </div>`;
  }

  function bind(overlay, session, n) {
    const close = () => overlay.classList.remove('open');
    overlay.querySelector('.ap-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

    const qs = session.dp900 || [];
    overlay.querySelectorAll('.ap-check').forEach(btn => btn.addEventListener('click', () => {
      const qi = Number(btn.dataset.q);
      const block = overlay.querySelector(`.ap-q[data-q="${qi}"]`);
      const chosen = overlay.querySelector(`input[name="ap-q-${n}-${qi}"]:checked`);
      const fb = overlay.querySelector(`#ap-fb-${qi}`);
      if (!chosen) {
        fb.className = 'ap-feedback show bad';
        fb.textContent = 'Selecciona una opción antes de verificar.';
        return;
      }
      const good = Number(chosen.value) === qs[qi].correcta;
      block.dataset.answered = '1';
      block.dataset.correct = good ? '1' : '0';
      fb.className = 'ap-feedback show ' + (good ? 'good' : 'bad');
      fb.innerHTML = `<b>${good ? '✓ Correcto.' : 'Todavía no.'}</b> ${esc(qs[qi].explicacion)}`;
      const blocks = [...overlay.querySelectorAll('.ap-q')];
      const answered = blocks.filter(x => x.dataset.answered === '1').length;
      const score = blocks.filter(x => x.dataset.correct === '1').length;
      const scoreEl = overlay.querySelector('#ap-score');
      if (scoreEl) scoreEl.textContent = answered === blocks.length ? `${score}/${blocks.length}` : `${answered}/${blocks.length} respondidas`;
    }));
  }

  async function loadPlan() {
    const r = await fetch(PLAN_URL, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }

  async function init() {
    addManifest();
    const n = sessionNumber();
    if (!n) {
      await registerSW();
      return;
    }

    // S6, S7, S8, S9, S10 y S16 no reciben una capa artificial Núcleo/Reto.
    if (!CODE_PRACTICE_SESSIONS.has(n)) {
      await registerSW();
      return;
    }

    let plan;
    try { plan = await loadPlan(); }
    catch (err) { console.warn('[ANDESDB] No se pudo cargar el plan de práctica:', err); return; }
    const session = plan.sesiones?.[n];
    if (!session) return;

    styles();
    const offlineReady = await registerSW();
    const btn = document.createElement('button');
    btn.id = 'andes-practice-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="dot"></span><span>Práctica</span>';
    btn.title = 'Práctica base y extensión técnica';
    document.body.appendChild(btn);

    const overlay = document.createElement('div');
    overlay.id = 'andes-practice-overlay';
    overlay.innerHTML = render(session, n, offlineReady);
    document.body.appendChild(overlay);
    bind(overlay, session, n);
    btn.addEventListener('click', () => overlay.classList.add('open'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
