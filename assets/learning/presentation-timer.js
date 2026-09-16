(() => {
  'use strict';
  if (document.getElementById('andes-presentation-timer')) return;

  const POS_KEY = 'andesdb-presentation-timer-position-v8';
  const root = document.createElement('div');
  root.id = 'andes-presentation-timer';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Temporizador de presentación');

  const style = document.createElement('style');
  style.textContent = `
    #andes-presentation-timer{position:fixed;right:1rem;bottom:4.6rem;z-index:180;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;touch-action:none;user-select:none}
    #andes-presentation-timer *{box-sizing:border-box}
    #andes-presentation-timer button{border:0;cursor:pointer;font:inherit}
    #andes-presentation-timer .apt-shell{width:min(390px,calc(100vw - 1.2rem));background:rgba(11,18,25,.97);border:1px solid rgba(255,255,255,.16);border-radius:26px;box-shadow:0 20px 52px rgba(0,0,0,.38);overflow:hidden;backdrop-filter:blur(12px)}
    #andes-presentation-timer .apt-head{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.65rem;padding:.82rem .9rem .7rem;background:rgba(255,255,255,.045);cursor:grab}
    #andes-presentation-timer.is-dragging .apt-head,#andes-presentation-timer.is-dragging .apt-icon-only{cursor:grabbing}
    #andes-presentation-timer .apt-grip{font-size:1rem;line-height:1;opacity:.55;padding:.1rem .15rem;letter-spacing:-.12em}
    #andes-presentation-timer .apt-display{font-variant-numeric:tabular-nums;font-size:3.65rem;line-height:1;font-weight:950;letter-spacing:.025em;text-align:center;color:#fff}
    #andes-presentation-timer .apt-head-actions{display:flex;gap:.38rem}
    #andes-presentation-timer .apt-icon{width:2.6rem;height:2.6rem;border-radius:999px;background:#fff;color:#151515;display:grid;place-items:center;padding:0;font-size:1.05rem;font-weight:900}
    #andes-presentation-timer .apt-body{padding:.8rem;display:grid;gap:.62rem}
    #andes-presentation-timer .apt-presets,#andes-presentation-timer .apt-actions,#andes-presentation-timer .apt-adjust{display:flex;gap:.46rem;flex-wrap:wrap}
    #andes-presentation-timer .apt-presets button{flex:1 1 3.4rem;border-radius:999px;background:#263746;color:#fff;padding:.54rem .58rem;border:1px solid rgba(255,255,255,.11);font-weight:850}
    #andes-presentation-timer .apt-presets button.is-selected{background:#36536a;outline:1px solid rgba(255,214,0,.8)}
    #andes-presentation-timer .apt-custom{display:grid;grid-template-columns:1fr auto;gap:.45rem;align-items:center}
    #andes-presentation-timer .apt-custom input{min-width:0;width:100%;border:1px solid rgba(255,255,255,.22);background:#0b151d;color:#fff;border-radius:13px;padding:.62rem .74rem;font:inherit;font-weight:800;font-variant-numeric:tabular-nums;outline:none}
    #andes-presentation-timer .apt-custom input:focus{border-color:#ffd600;box-shadow:0 0 0 2px rgba(255,214,0,.16)}
    #andes-presentation-timer .apt-custom input::placeholder{color:#91a4b2;font-weight:650}
    #andes-presentation-timer .apt-custom button{border-radius:999px;background:#ffd600;color:#352c00;padding:.62rem .92rem;font-weight:900}
    #andes-presentation-timer .apt-actions button{flex:1 1 5rem;border-radius:999px;padding:.64rem .7rem;font-weight:900}
    #andes-presentation-timer .apt-primary{background:#ffd600;color:#352c00}
    #andes-presentation-timer .apt-secondary{background:#fff;color:#171717}
    #andes-presentation-timer .apt-adjust{align-items:center;justify-content:center}
    #andes-presentation-timer .apt-adjust button{border-radius:999px;background:transparent;color:#dfe8ef;border:1px solid rgba(255,255,255,.18);padding:.43rem .82rem;font-weight:850}
    #andes-presentation-timer .apt-adjust .apt-more{background:#e9f8ef;color:#155d3d;border-color:#bfe7ce}
    #andes-presentation-timer .apt-status{font-size:.76rem;line-height:1.35;color:#cbd8e2;text-align:center;min-height:1.3em;padding:0 .2rem}
    #andes-presentation-timer .apt-icon-only{display:none;width:3rem;height:3rem;border-radius:999px;background:rgba(11,18,25,.97);border:1px solid rgba(255,255,255,.2);box-shadow:0 14px 34px rgba(0,0,0,.34);cursor:grab;place-items:center;color:#fff;font-size:1.28rem}
    #andes-presentation-timer.is-icon .apt-shell{display:none}
    #andes-presentation-timer.is-icon .apt-icon-only{display:grid}
    #andes-presentation-timer.is-done .apt-shell{outline:2px solid #8fd6aa}
    #andes-presentation-timer.is-done .apt-display{color:#a9e6bf}
    #andes-presentation-timer.is-free .apt-display{color:#ffd600;font-size:2.35rem}
    body.apt-pause-active #andes-presentation-timer,body.apt-pause-active #andes-practice-btn{display:none!important}

    body>.apt-pause-stage{
      position:fixed;inset:0;width:100vw;height:100dvh;min-height:100dvh;z-index:35;
      display:none;place-items:center;overflow:auto;
      padding:clamp(2.2rem,6vh,4.5rem) 1.1rem calc(6.2rem + env(safe-area-inset-bottom));
      background:linear-gradient(160deg,#ffe14d 0%,#ffd600 100%);color:#111;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    body>.apt-pause-stage.is-visible{display:grid}
    .apt-pause-center{width:min(760px,92vw);max-width:92vw;margin:auto;text-align:center;display:grid;justify-items:center;gap:.65rem}
    .apt-pause-kicker{font-size:.88rem;line-height:1;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
    .apt-pause-time{font-variant-numeric:tabular-nums;font-size:clamp(6rem,14vw,10.5rem);line-height:.88;font-weight:1000;letter-spacing:-.045em;margin:.15rem 0 .1rem}
    .apt-pause-return{font-size:clamp(1.75rem,3.2vw,2.65rem);line-height:1.05;font-weight:950;margin:.15rem 0 .3rem}
    .apt-pause-copy{font-size:clamp(1.05rem,2vw,1.45rem);line-height:1.35;max-width:720px;margin:0 0 .55rem}
    .apt-pause-controls{width:min(650px,92%);display:grid;grid-template-columns:1fr auto;gap:.6rem;align-items:center;margin-top:.3rem}
    .apt-pause-start{min-height:3.25rem;border:0;border-radius:999px;background:#171717;color:#fff;font:inherit;font-weight:950;font-size:1rem;padding:.75rem 1.25rem;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.16)}
    .apt-pause-sound{width:3.25rem;height:3.25rem;border:0;border-radius:999px;background:#171717;color:#fff;font-size:1.18rem;display:grid;place-items:center;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.16)}
    .apt-pause-note{font-size:.82rem;font-weight:750;opacity:.72;min-height:1.2em;margin-top:.15rem}
    .apt-pause-stage.is-done .apt-pause-time{color:#146c43}

    @media(max-width:700px),(max-aspect-ratio:1/1){
      #andes-presentation-timer{right:.48rem;bottom:4.4rem}
      #andes-presentation-timer .apt-shell{width:min(350px,calc(100vw - .95rem))}
      #andes-presentation-timer .apt-display{font-size:3rem}
      #andes-presentation-timer .apt-icon-only{width:2.8rem;height:2.8rem;font-size:1.2rem}
      body>.apt-pause-stage{padding:max(1.25rem,env(safe-area-inset-top)) .85rem calc(6.8rem + env(safe-area-inset-bottom))}
      .apt-pause-center{width:min(94vw,560px);max-width:94vw;gap:.42rem}
      .apt-pause-time{font-size:clamp(5rem,24vw,8.2rem);line-height:.9}
      .apt-pause-return{font-size:clamp(1.45rem,6vw,2.05rem);line-height:1.05}
      .apt-pause-copy{font-size:clamp(.95rem,3.7vw,1.12rem);line-height:1.28;margin-bottom:.35rem}
      .apt-pause-controls{width:min(94vw,520px)}
    }
    @media print{#andes-presentation-timer,.apt-pause-stage{display:none!important}}
  `;
  document.head.appendChild(style);

  root.innerHTML = `
    <div class="apt-shell">
      <div class="apt-head" title="Arrastra para mover">
        <span class="apt-grip" aria-hidden="true">⠿</span>
        <span class="apt-display" aria-live="polite">10:00</span>
        <span class="apt-head-actions">
          <button class="apt-icon apt-sound" type="button" title="Sonido" aria-label="Sonido">🔔</button>
          <button class="apt-icon apt-toggle" type="button" title="Minimizar" aria-label="Minimizar">−</button>
        </span>
      </div>
      <div class="apt-body">
        <div class="apt-presets">
          <button type="button" data-min="5">5 min</button>
          <button type="button" data-min="10" class="is-selected">10 min</button>
          <button type="button" data-min="15">15 min</button>
          <button type="button" data-min="20">20 min</button>
          <button type="button" data-free="1">Libre</button>
        </div>
        <div class="apt-custom">
          <input class="apt-custom-input" type="text" inputmode="numeric" autocomplete="off" placeholder="Personalizado · 7:30 o 25" aria-label="Tiempo personalizado">
          <button class="apt-custom-apply" type="button">Aplicar</button>
        </div>
        <div class="apt-adjust"><button type="button" data-adjust="-300">−5 min</button><button class="apt-more" type="button" data-adjust="300">+5 min</button></div>
        <div class="apt-actions"><button class="apt-primary apt-start" type="button">▶ Iniciar</button><button class="apt-secondary apt-reset" type="button">↺ Reiniciar</button></div>
        <div class="apt-status">El reloj es opcional. Arrástralo para moverlo o minimízalo.</div>
      </div>
    </div>
    <button class="apt-icon-only" type="button" title="Abrir temporizador" aria-label="Abrir temporizador">⏱</button>`;
  document.body.appendChild(root);

  const display = root.querySelector('.apt-display');
  const startBtn = root.querySelector('.apt-start');
  const resetBtn = root.querySelector('.apt-reset');
  const toggleBtn = root.querySelector('.apt-toggle');
  const soundBtn = root.querySelector('.apt-sound');
  const status = root.querySelector('.apt-status');
  const customInput = root.querySelector('.apt-custom-input');
  const customApply = root.querySelector('.apt-custom-apply');
  const head = root.querySelector('.apt-head');
  const iconOnly = root.querySelector('.apt-icon-only');
  const presetButtons = [...root.querySelectorAll('[data-min],[data-free]')];

  let selectedSeconds = 600;
  let remainingSeconds = 600;
  let running = false;
  let freeMode = false;
  let endAt = 0;
  let timerId = 0;
  let alarmed = false;
  let soundEnabled = true;
  let audioCtx = null;
  let drag = null;
  let suppressIconClick = false;
  let viewMode = 'icon';
  let wasPause = false;

  const pauseStage = document.createElement('div');
  pauseStage.className = 'apt-pause-stage';
  pauseStage.dataset.analyticsViewportPause = '1';
  pauseStage.innerHTML = `
    <div class="apt-pause-center">
      <div class="apt-pause-kicker">Pausa</div>
      <div class="apt-pause-time" aria-live="polite">15:00</div>
      <div class="apt-pause-return">Volvemos en 15 minutos</div>
      <div class="apt-pause-copy">Al volver continuamos con la siguiente parte de la sesión.</div>
      <div class="apt-pause-controls">
        <button class="apt-pause-start" type="button">▶ Iniciar los 15 minutos</button>
        <button class="apt-pause-sound" type="button" title="Sonido" aria-label="Sonido">🔔</button>
      </div>
      <div class="apt-pause-note">El contador es una guía; puedes pausarlo o ampliar el tiempo si lo necesitas.</div>
    </div>`;
  document.body.appendChild(pauseStage);
  const pauseTime = pauseStage.querySelector('.apt-pause-time');
  const pauseStart = pauseStage.querySelector('.apt-pause-start');
  const pauseSound = pauseStage.querySelector('.apt-pause-sound');
  const pauseCopy = pauseStage.querySelector('.apt-pause-copy');
  const pauseNote = pauseStage.querySelector('.apt-pause-note');

  const format = seconds => {
    const safe = Math.max(0, Math.ceil(seconds));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    return h > 0 ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const parseCustom = raw => {
    const v = String(raw || '').trim();
    if (/^\d+$/.test(v)) return Number(v) > 0 ? Number(v) * 60 : null;
    const p = v.split(':');
    if ((p.length === 2 || p.length === 3) && p.every(x => /^\d+$/.test(x))) {
      const a = p.map(Number);
      if (p.length === 2) return a[1] < 60 ? (a[0] * 60 + a[1] || null) : null;
      return a[1] < 60 && a[2] < 60 ? (a[0] * 3600 + a[1] * 60 + a[2] || null) : null;
    }
    return null;
  };

  const selectButton = fn => presetButtons.forEach(b => b.classList.toggle('is-selected', fn(b)));
  const setView = mode => {
    viewMode = mode;
    root.classList.toggle('is-icon', mode === 'icon');
  };

  const primeAudio = () => {
    if (!soundEnabled) return;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C && !audioCtx) audioCtx = new C();
      if (audioCtx?.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  };

  const alarm = () => {
    if (!soundEnabled) return;
    try {
      primeAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      [[0,659,.42],[.55,784,.42],[1.1,988,.5],[1.8,784,.42],[2.35,988,.5],[3.05,1175,.58],[3.85,988,.5],[4.55,1175,.58],[5.35,1318,.65],[6.25,1175,.58],[7.05,1318,.68],[8.0,1568,.82],[9.1,1318,.72]].forEach(([t,f,d]) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(.0001, now + t);
        g.gain.exponentialRampToValueAtTime(.18, now + t + .04);
        g.gain.exponentialRampToValueAtTime(.0001, now + t + d);
        o.connect(g); g.connect(audioCtx.destination); o.start(now + t); o.stop(now + t + d + .08);
      });
      if (navigator.vibrate) navigator.vibrate([350,120,350,120,650,180,650]);
    } catch (_) {}
  };

  const renderPause = () => {
    pauseTime.textContent = freeMode ? 'LIBRE' : format(remainingSeconds);
    pauseStage.classList.toggle('is-done', !freeMode && remainingSeconds <= 0);
    pauseSound.textContent = soundEnabled ? '🔔' : '🔕';
    if (freeMode) {
      pauseStart.textContent = 'Modo libre';
      pauseStart.disabled = true;
      pauseNote.textContent = 'El descanso termina cuando el grupo esté listo.';
    } else {
      pauseStart.disabled = false;
      if (running) pauseStart.textContent = '❚❚ Pausar descanso';
      else if (remainingSeconds <= 0) pauseStart.textContent = '↺ Reiniciar 15 minutos';
      else if (remainingSeconds < selectedSeconds) pauseStart.textContent = '▶ Continuar descanso';
      else pauseStart.textContent = '▶ Iniciar los 15 minutos';
      pauseNote.textContent = remainingSeconds <= 0 ? 'Descanso cumplido. Puedes volver cuando el grupo esté listo.' : 'El contador es una guía; puedes pausarlo o ampliar el tiempo si lo necesitas.';
    }
  };

  const render = () => {
    display.textContent = freeMode ? 'LIBRE' : format(remainingSeconds);
    startBtn.disabled = freeMode;
    startBtn.style.opacity = freeMode ? '.55' : '1';
    startBtn.textContent = running ? '❚❚ Pausar' : (remainingSeconds < selectedSeconds && remainingSeconds > 0 ? '▶ Continuar' : '▶ Iniciar');
    root.classList.toggle('is-done', !freeMode && remainingSeconds <= 0);
    root.classList.toggle('is-free', freeMode);
    soundBtn.textContent = soundEnabled ? '🔔' : '🔕';
    renderPause();
  };

  const stop = () => {
    running = false;
    if (timerId) clearInterval(timerId);
    timerId = 0;
  };
  const finish = () => {
    stop();
    remainingSeconds = 0;
    if (!alarmed) {
      alarmed = true;
      alarm();
      status.textContent = 'Tiempo sugerido cumplido. Puedes añadir tiempo o continuar.';
    }
    render();
  };
  const updateRemaining = () => {
    if (!running || freeMode) return;
    remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
    if (remainingSeconds <= 0) return finish();
    render();
  };
  const startLoop = () => {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(updateRemaining, 500);
  };

  const setSeconds = s => {
    stop();
    freeMode = false;
    selectedSeconds = Math.max(1, Math.round(s));
    remainingSeconds = selectedSeconds;
    alarmed = false;
    selectButton(() => false);
    render();
  };
  const setMinutes = m => {
    setSeconds(m * 60);
    selectButton(b => Number(b.dataset.min) === m);
  };
  const setFree = () => {
    stop();
    freeMode = true;
    alarmed = false;
    selectButton(b => b.hasAttribute('data-free'));
    render();
  };

  const toggleRun = () => {
    if (freeMode) return;
    primeAudio();
    if (remainingSeconds <= 0) setMinutes(15);
    if (running) {
      updateRemaining();
      stop();
      status.textContent = 'Pausado.';
    } else {
      endAt = Date.now() + remainingSeconds * 1000;
      running = true;
      alarmed = false;
      startLoop();
      status.textContent = 'En marcha.';
    }
    render();
  };

  root.querySelectorAll('[data-min]').forEach(b => b.addEventListener('click', () => setMinutes(Number(b.dataset.min))));
  root.querySelector('[data-free]').addEventListener('click', setFree);
  root.querySelectorAll('[data-adjust]').forEach(b => b.addEventListener('click', () => {
    const delta = Number(b.dataset.adjust || 0);
    if (freeMode) freeMode = false;
    stop();
    remainingSeconds = Math.max(0, remainingSeconds + delta);
    selectedSeconds = Math.max(1, selectedSeconds + delta);
    alarmed = false;
    selectButton(() => false);
    render();
  }));
  customApply.addEventListener('click', () => {
    const parsed = parseCustom(customInput.value);
    if (!parsed) {
      status.textContent = 'Usa minutos (12), MM:SS (7:30) o HH:MM:SS (1:05:00).';
      return;
    }
    setSeconds(parsed);
    customInput.value = '';
  });
  customInput.addEventListener('keydown', e => { if (e.key === 'Enter') customApply.click(); });
  startBtn.addEventListener('click', toggleRun);
  resetBtn.addEventListener('click', () => { stop(); freeMode = false; remainingSeconds = selectedSeconds; alarmed = false; render(); });
  soundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; if (soundEnabled) primeAudio(); render(); });
  toggleBtn.addEventListener('click', () => setView('icon'));
  iconOnly.addEventListener('click', () => { if (suppressIconClick) { suppressIconClick = false; return; } setView('full'); });
  pauseStart.addEventListener('click', toggleRun);
  pauseSound.addEventListener('click', () => { soundEnabled = !soundEnabled; if (soundEnabled) primeAudio(); render(); });

  const savePosition = () => { try { localStorage.setItem(POS_KEY, JSON.stringify({left:root.style.left || '', top:root.style.top || ''})); } catch (_) {} };
  const restorePosition = () => { try { const saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); if (saved?.left && saved?.top) { root.style.left = saved.left; root.style.top = saved.top; root.style.right = 'auto'; root.style.bottom = 'auto'; } } catch (_) {} };
  const beginDrag = (e, source) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (source === 'full' && e.target.closest('button,input')) return;
    const r = root.getBoundingClientRect();
    drag = {x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false,source};
    root.style.left = `${r.left}px`;
    root.style.top = `${r.top}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';
    root.classList.add('is-dragging');
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (_) {}
    e.preventDefault();
  };
  const moveDrag = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    const w = root.offsetWidth, h = root.offsetHeight;
    root.style.left = `${Math.max(6, Math.min(innerWidth - w - 6, drag.left + dx))}px`;
    root.style.top = `${Math.max(6, Math.min(innerHeight - h - 6, drag.top + dy))}px`;
  };
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved && drag.source === 'icon') suppressIconClick = true;
    drag = null;
    root.classList.remove('is-dragging');
    savePosition();
  };
  head.addEventListener('pointerdown', e => beginDrag(e, 'full'));
  iconOnly.addEventListener('pointerdown', e => beginDrag(e, 'icon'));
  addEventListener('pointermove', moveDrag, {passive:true});
  addEventListener('pointerup', endDrag, {passive:true});
  addEventListener('pointercancel', endDrag, {passive:true});

  const syncPauseSlide = () => {
    const active = document.querySelector('.slide.active');
    const isPause = !!active && /pausa/i.test(active.getAttribute('data-title') || '');
    if (isPause && !wasPause) {
      const sourceCopy = active.querySelector('p.lead')?.textContent?.trim();
      if (sourceCopy) pauseCopy.textContent = sourceCopy;
      setMinutes(15);
    }
    document.body.classList.toggle('apt-pause-active', isPause);
    pauseStage.classList.toggle('is-visible', isPause);
    wasPause = isPause;
    render();
  };

  const slideObserver = new MutationObserver(syncPauseSlide);
  document.querySelectorAll('.slide').forEach(slide => slideObserver.observe(slide, {attributes:true, attributeFilter:['class']}));

  addEventListener('keydown', e => {
    if (e.key?.toLowerCase() === 't' && !e.target.matches('input,textarea')) setView(viewMode === 'full' ? 'icon' : 'full');
  });
  addEventListener('resize', () => {
    const r = root.getBoundingClientRect();
    if (r.right > innerWidth || r.bottom > innerHeight) {
      root.style.left = `${Math.max(6, Math.min(innerWidth - root.offsetWidth - 6, r.left))}px`;
      root.style.top = `${Math.max(6, Math.min(innerHeight - root.offsetHeight - 6, r.top))}px`;
      savePosition();
    }
  });

  restorePosition();
  setView('icon');
  syncPauseSlide();
  render();
})();
