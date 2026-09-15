(() => {
  if (document.getElementById('andes-presentation-timer')) return;

  const style = document.createElement('style');
  style.textContent = `
    #andes-presentation-timer{position:fixed;right:.8rem;bottom:4.2rem;z-index:120;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff}
    #andes-presentation-timer *{box-sizing:border-box}
    #andes-presentation-timer .apt-shell{width:min(360px,calc(100vw - 1.6rem));background:rgba(12,20,28,.96);border:1px solid rgba(255,255,255,.18);border-radius:18px;box-shadow:0 14px 38px rgba(0,0,0,.28);overflow:hidden;backdrop-filter:blur(12px)}
    #andes-presentation-timer .apt-head{display:flex;align-items:center;gap:.55rem;padding:.55rem .65rem;background:rgba(255,255,255,.05)}
    #andes-presentation-timer .apt-title{font-size:.76rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#ffd600;margin-right:auto}
    #andes-presentation-timer .apt-display{font-variant-numeric:tabular-nums;font-size:1.12rem;font-weight:900;letter-spacing:.04em;min-width:4.8rem;text-align:center}
    #andes-presentation-timer button{border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:850}
    #andes-presentation-timer .apt-icon{width:2rem;height:2rem;background:#fff;color:#151515;display:grid;place-items:center;padding:0}
    #andes-presentation-timer .apt-body{padding:.7rem;display:grid;gap:.62rem}
    #andes-presentation-timer .apt-presets,#andes-presentation-timer .apt-actions,#andes-presentation-timer .apt-adjust{display:flex;gap:.4rem;flex-wrap:wrap}
    #andes-presentation-timer .apt-presets button{flex:1 1 3rem;background:#263746;color:#fff;padding:.48rem .55rem;border:1px solid rgba(255,255,255,.11)}
    #andes-presentation-timer .apt-presets button:hover,#andes-presentation-timer .apt-presets button.is-selected{background:#36536a;outline:1px solid rgba(255,214,0,.65)}
    #andes-presentation-timer .apt-actions button{flex:1 1 5rem;padding:.55rem .65rem}
    #andes-presentation-timer .apt-primary{background:#ffd600;color:#352c00}
    #andes-presentation-timer .apt-secondary{background:#fff;color:#171717}
    #andes-presentation-timer .apt-soft{background:#263746;color:#fff}
    #andes-presentation-timer .apt-adjust{align-items:center;justify-content:center}
    #andes-presentation-timer .apt-adjust button{background:transparent;color:#dfe8ef;border:1px solid rgba(255,255,255,.18);padding:.38rem .72rem}
    #andes-presentation-timer .apt-adjust .apt-more{background:#e9f8ef;color:#155d3d;border-color:#bfe7ce}
    #andes-presentation-timer .apt-status{font-size:.74rem;line-height:1.35;color:#cbd8e2;text-align:center;min-height:2em;padding:0 .25rem}
    #andes-presentation-timer .apt-note{font-size:.66rem;color:#8fa6b7;text-align:center}
    #andes-presentation-timer.is-collapsed .apt-body{display:none}
    #andes-presentation-timer.is-done .apt-shell{outline:2px solid #8fd6aa;box-shadow:0 0 0 5px rgba(93,190,130,.12),0 14px 38px rgba(0,0,0,.28)}
    #andes-presentation-timer.is-done .apt-display{color:#a9e6bf}
    #andes-presentation-timer.is-free .apt-display{color:#ffd600;font-size:.95rem}
    @media(max-width:700px){#andes-presentation-timer{right:.45rem;bottom:4.35rem}#andes-presentation-timer .apt-shell{width:min(330px,calc(100vw - .9rem))}}
    @media print{#andes-presentation-timer{display:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'andes-presentation-timer';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Guía flexible de ritmo de clase');
  root.innerHTML = `
    <div class="apt-shell">
      <div class="apt-head">
        <span class="apt-title">⏱ Ritmo de clase</span>
        <span class="apt-display" aria-live="polite">10:00</span>
        <button class="apt-icon apt-sound" type="button" title="Activar aviso sonoro" aria-label="Activar aviso sonoro">🔕</button>
        <button class="apt-icon apt-toggle" type="button" title="Minimizar" aria-label="Minimizar">−</button>
      </div>
      <div class="apt-body">
        <div class="apt-presets" aria-label="Tiempos orientativos">
          <button type="button" data-min="5">5 min</button>
          <button type="button" data-min="10" class="is-selected">10 min</button>
          <button type="button" data-min="15">15 min</button>
          <button type="button" data-min="20">20 min</button>
          <button type="button" data-free="1">Libre</button>
        </div>
        <div class="apt-adjust">
          <button type="button" data-adjust="-300">−5 min</button>
          <button class="apt-more" type="button" data-adjust="300">+5 min</button>
        </div>
        <div class="apt-actions">
          <button class="apt-primary apt-start" type="button">▶ Iniciar</button>
          <button class="apt-secondary apt-reset" type="button">↺ Reiniciar</button>
        </div>
        <div class="apt-status">Tiempo orientativo: ajústalo al ritmo real del grupo.</div>
        <div class="apt-note">Llegar a 00:00 no bloquea nada: puedes ampliar, pausar o seguir sin tiempo.</div>
      </div>
    </div>`;
  document.body.appendChild(root);

  const display = root.querySelector('.apt-display');
  const startBtn = root.querySelector('.apt-start');
  const resetBtn = root.querySelector('.apt-reset');
  const toggleBtn = root.querySelector('.apt-toggle');
  const soundBtn = root.querySelector('.apt-sound');
  const status = root.querySelector('.apt-status');
  const presetButtons = [...root.querySelectorAll('[data-min], [data-free]')];

  let selectedSeconds = 10 * 60;
  let remainingSeconds = selectedSeconds;
  let running = false;
  let freeMode = false;
  let endAt = 0;
  let tickId = 0;
  let alarmed = false;
  let soundEnabled = false;

  const format = (seconds) => {
    const safe = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const selectButton = (predicate) => {
    presetButtons.forEach((button) => button.classList.toggle('is-selected', predicate(button)));
  };

  const render = () => {
    display.textContent = freeMode ? 'SIN LÍMITE' : format(remainingSeconds);
    startBtn.disabled = freeMode;
    startBtn.style.opacity = freeMode ? '.55' : '1';
    startBtn.textContent = running ? '❚❚ Pausar' : (remainingSeconds < selectedSeconds && remainingSeconds > 0 ? '▶ Continuar' : '▶ Iniciar');
    root.classList.toggle('is-done', !freeMode && remainingSeconds <= 0);
    root.classList.toggle('is-free', freeMode);
  };

  const beep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 740;
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.08, ctx.currentTime + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + .24);
      setTimeout(() => ctx.close(), 500);
    } catch (_) {}
  };

  const finish = () => {
    running = false;
    remainingSeconds = 0;
    cancelAnimationFrame(tickId);
    if (!alarmed) {
      alarmed = true;
      beep();
      status.textContent = 'Tiempo sugerido cumplido. Si el grupo lo necesita, añade 5 min o continúa sin límite.';
    }
    render();
  };

  const tick = () => {
    if (!running || freeMode) return;
    remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
    if (remainingSeconds <= 0) return finish();
    render();
    tickId = requestAnimationFrame(tick);
  };

  const stopTick = () => {
    running = false;
    cancelAnimationFrame(tickId);
  };

  const setMinutes = (minutes) => {
    stopTick();
    freeMode = false;
    selectedSeconds = Math.max(60, Math.round(minutes * 60));
    remainingSeconds = selectedSeconds;
    alarmed = false;
    status.textContent = `${minutes} min como referencia. Puedes ampliarlos cuando quieras.`;
    selectButton((button) => Number(button.dataset.min) === minutes);
    render();
  };

  const setFree = () => {
    stopTick();
    freeMode = true;
    alarmed = false;
    status.textContent = 'Modo libre: la actividad termina cuando el grupo esté listo.';
    selectButton((button) => button.hasAttribute('data-free'));
    render();
  };

  root.querySelectorAll('[data-min]').forEach((button) => {
    button.addEventListener('click', () => setMinutes(Number(button.dataset.min)));
  });
  root.querySelector('[data-free]').addEventListener('click', setFree);

  root.querySelectorAll('[data-adjust]').forEach((button) => {
    button.addEventListener('click', () => {
      if (freeMode) {
        setMinutes(10);
        return;
      }
      const delta = Number(button.dataset.adjust || 0);
      if (running) {
        endAt += delta * 1000;
        remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
      } else {
        selectedSeconds = Math.max(60, selectedSeconds + delta);
        remainingSeconds = Math.max(60, remainingSeconds + delta);
      }
      alarmed = false;
      status.textContent = delta > 0 ? 'Añadimos 5 min: el ritmo del grupo manda.' : 'Reducimos 5 min como referencia.';
      selectButton(() => false);
      render();
    });
  });

  startBtn.addEventListener('click', () => {
    if (freeMode) return;
    if (remainingSeconds <= 0) remainingSeconds = selectedSeconds;
    alarmed = false;
    if (running) {
      running = false;
      cancelAnimationFrame(tickId);
      remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
      status.textContent = 'Pausado. Reanuda cuando el grupo esté listo.';
    } else {
      running = true;
      endAt = Date.now() + remainingSeconds * 1000;
      status.textContent = 'En marcha como referencia, no como límite.';
      tickId = requestAnimationFrame(tick);
    }
    render();
  });

  resetBtn.addEventListener('click', () => {
    stopTick();
    if (freeMode) {
      status.textContent = 'Modo libre: sin cuenta regresiva.';
    } else {
      remainingSeconds = selectedSeconds;
      alarmed = false;
      status.textContent = 'Reiniciado. Ajusta el tiempo si el grupo lo necesita.';
    }
    render();
  });

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔔' : '🔕';
    soundBtn.title = soundEnabled ? 'Desactivar aviso sonoro' : 'Activar aviso sonoro';
    soundBtn.setAttribute('aria-label', soundBtn.title);
    status.textContent = soundEnabled ? 'Aviso sonoro suave activado.' : 'Aviso sonoro desactivado.';
  });

  const toggle = () => {
    root.classList.toggle('is-collapsed');
    const collapsed = root.classList.contains('is-collapsed');
    toggleBtn.textContent = collapsed ? '+' : '−';
    toggleBtn.title = collapsed ? 'Mostrar controles' : 'Minimizar';
    toggleBtn.setAttribute('aria-label', toggleBtn.title);
  };
  toggleBtn.addEventListener('click', toggle);

  document.addEventListener('keydown', (event) => {
    const tag = (event.target && event.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (event.key.toLowerCase() === 't') toggle();
  });

  render();
})();
