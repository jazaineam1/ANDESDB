(() => {
  if (document.getElementById('andes-presentation-timer')) return;

  const style = document.createElement('style');
  style.textContent = `
    #andes-presentation-timer{position:fixed;right:.8rem;bottom:4.2rem;z-index:120;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff}
    #andes-presentation-timer *{box-sizing:border-box}
    #andes-presentation-timer .apt-shell{width:min(340px,calc(100vw - 1.6rem));background:rgba(12,20,28,.96);border:1px solid rgba(255,255,255,.18);border-radius:18px;box-shadow:0 14px 38px rgba(0,0,0,.28);overflow:hidden;backdrop-filter:blur(12px)}
    #andes-presentation-timer .apt-head{display:flex;align-items:center;gap:.55rem;padding:.55rem .65rem;background:rgba(255,255,255,.05)}
    #andes-presentation-timer .apt-title{font-size:.78rem;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:#ffd600;margin-right:auto}
    #andes-presentation-timer .apt-display{font-variant-numeric:tabular-nums;font-size:1.12rem;font-weight:900;letter-spacing:.04em;min-width:4.4rem;text-align:center}
    #andes-presentation-timer button{border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:850}
    #andes-presentation-timer .apt-icon{width:2rem;height:2rem;background:#fff;color:#151515;display:grid;place-items:center;padding:0}
    #andes-presentation-timer .apt-body{padding:.7rem;display:grid;gap:.62rem}
    #andes-presentation-timer .apt-presets,#andes-presentation-timer .apt-actions{display:flex;gap:.4rem;flex-wrap:wrap}
    #andes-presentation-timer .apt-presets button{flex:1 1 3rem;background:#263746;color:#fff;padding:.48rem .55rem;border:1px solid rgba(255,255,255,.11)}
    #andes-presentation-timer .apt-presets button:hover{background:#31485b}
    #andes-presentation-timer .apt-actions button{flex:1 1 4.2rem;padding:.55rem .65rem}
    #andes-presentation-timer .apt-primary{background:#ffd600;color:#352c00}
    #andes-presentation-timer .apt-secondary{background:#fff;color:#171717}
    #andes-presentation-timer .apt-adjust{display:flex;gap:.4rem;align-items:center;justify-content:center}
    #andes-presentation-timer .apt-adjust button{background:transparent;color:#dfe8ef;border:1px solid rgba(255,255,255,.18);padding:.35rem .72rem}
    #andes-presentation-timer .apt-status{font-size:.72rem;color:#bfd0dc;text-align:center;min-height:1em}
    #andes-presentation-timer.is-collapsed .apt-body{display:none}
    #andes-presentation-timer.is-done .apt-shell{outline:3px solid #ffd600;box-shadow:0 0 0 6px rgba(255,214,0,.18),0 14px 38px rgba(0,0,0,.28)}
    #andes-presentation-timer.is-done .apt-display{color:#ffd600}
    @media(max-width:700px){#andes-presentation-timer{right:.45rem;bottom:4.35rem}#andes-presentation-timer .apt-shell{width:min(310px,calc(100vw - .9rem))}}
    @media print{#andes-presentation-timer{display:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'andes-presentation-timer';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Temporizador de clase');
  root.innerHTML = `
    <div class="apt-shell">
      <div class="apt-head">
        <span class="apt-title">⏱ Timer</span>
        <span class="apt-display" aria-live="polite">10:00</span>
        <button class="apt-icon apt-toggle" type="button" title="Minimizar temporizador" aria-label="Minimizar temporizador">−</button>
      </div>
      <div class="apt-body">
        <div class="apt-presets" aria-label="Duraciones rápidas">
          <button type="button" data-min="5">5 min</button>
          <button type="button" data-min="10">10 min</button>
          <button type="button" data-min="15">15 min</button>
          <button type="button" data-min="20">20 min</button>
        </div>
        <div class="apt-adjust">
          <button type="button" data-adjust="-60">−1 min</button>
          <button type="button" data-adjust="60">+1 min</button>
        </div>
        <div class="apt-actions">
          <button class="apt-primary apt-start" type="button">▶ Iniciar</button>
          <button class="apt-secondary apt-reset" type="button">↺ Reiniciar</button>
        </div>
        <div class="apt-status">Atajo: T muestra/minimiza el timer.</div>
      </div>
    </div>`;
  document.body.appendChild(root);

  const display = root.querySelector('.apt-display');
  const startBtn = root.querySelector('.apt-start');
  const resetBtn = root.querySelector('.apt-reset');
  const toggleBtn = root.querySelector('.apt-toggle');
  const status = root.querySelector('.apt-status');

  let selectedSeconds = 10 * 60;
  let remainingSeconds = selectedSeconds;
  let running = false;
  let endAt = 0;
  let tickId = 0;
  let alarmed = false;

  const format = (seconds) => {
    const safe = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const render = () => {
    display.textContent = format(remainingSeconds);
    startBtn.textContent = running ? '❚❚ Pausar' : (remainingSeconds < selectedSeconds && remainingSeconds > 0 ? '▶ Continuar' : '▶ Iniciar');
    root.classList.toggle('is-done', remainingSeconds <= 0);
  };

  const beep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [0, .22, .44].forEach((offset, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = index === 2 ? 1046 : 880;
        gain.gain.setValueAtTime(.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + offset + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + offset + .15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + .17);
      });
      setTimeout(() => ctx.close(), 900);
    } catch (_) {}
  };

  const finish = () => {
    running = false;
    remainingSeconds = 0;
    cancelAnimationFrame(tickId);
    if (!alarmed) {
      alarmed = true;
      beep();
      status.textContent = 'Tiempo terminado.';
    }
    render();
  };

  const tick = () => {
    if (!running) return;
    remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
    if (remainingSeconds <= 0) return finish();
    render();
    tickId = requestAnimationFrame(tick);
  };

  const setMinutes = (minutes) => {
    running = false;
    cancelAnimationFrame(tickId);
    selectedSeconds = Math.max(60, Math.round(minutes * 60));
    remainingSeconds = selectedSeconds;
    alarmed = false;
    status.textContent = `${minutes} min listos.`;
    render();
  };

  root.querySelectorAll('[data-min]').forEach((button) => {
    button.addEventListener('click', () => setMinutes(Number(button.dataset.min)));
  });

  root.querySelectorAll('[data-adjust]').forEach((button) => {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.adjust || 0);
      if (running) {
        endAt += delta * 1000;
        remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
      } else {
        selectedSeconds = Math.max(60, selectedSeconds + delta);
        remainingSeconds = Math.max(60, remainingSeconds + delta);
      }
      alarmed = false;
      status.textContent = delta > 0 ? 'Añadido 1 minuto.' : 'Restado 1 minuto.';
      render();
    });
  });

  startBtn.addEventListener('click', () => {
    if (remainingSeconds <= 0) remainingSeconds = selectedSeconds;
    alarmed = false;
    if (running) {
      running = false;
      cancelAnimationFrame(tickId);
      remainingSeconds = Math.max(0, (endAt - Date.now()) / 1000);
      status.textContent = 'Pausado.';
    } else {
      running = true;
      endAt = Date.now() + remainingSeconds * 1000;
      status.textContent = 'En marcha.';
      tickId = requestAnimationFrame(tick);
    }
    render();
  });

  resetBtn.addEventListener('click', () => {
    running = false;
    cancelAnimationFrame(tickId);
    remainingSeconds = selectedSeconds;
    alarmed = false;
    status.textContent = 'Reiniciado.';
    render();
  });

  const toggle = () => {
    root.classList.toggle('is-collapsed');
    const collapsed = root.classList.contains('is-collapsed');
    toggleBtn.textContent = collapsed ? '+' : '−';
    toggleBtn.title = collapsed ? 'Mostrar controles del temporizador' : 'Minimizar temporizador';
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
