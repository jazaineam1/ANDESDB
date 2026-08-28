(() => {
  'use strict';
  const m = (document.title + ' ' + location.pathname).match(/(?:sesi[oó]n|sesion)[-_\s]*(1[2-4])/i);
  if (!m) return;
  const n = Number(m[1]);
  if (n < 12 || n > 14) return;

  const thisScript = document.currentScript || [...document.scripts].find(s => /analytics-fallback-link\.js(?:\?|$)/.test(s.src));
  if (!thisScript) return;
  const labUrl = new URL('../../labs/analitica-local.html', new URL('./', thisScript.src)).href;

  const inject = () => {
    const overlay = document.getElementById('andes-learning-overlay');
    if (!overlay || overlay.querySelector('[data-analytics-fallback-link]')) return false;
    const targets = [...overlay.querySelectorAll('.al-real')];
    const target = targets.find(x => /DuckDB|fallback|respaldo|laboratorio analítico/i.test(x.textContent)) || targets[targets.length - 1];
    if (!target) return false;
    const a = document.createElement('a');
    a.href = labUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.analyticsFallbackLink = '1';
    a.className = 'al-btn alt al-link';
    a.style.marginTop = '10px';
    a.textContent = '🧪 Abrir laboratorio local';
    target.appendChild(document.createElement('br'));
    target.appendChild(a);
    return true;
  };

  if (inject()) return;
  const observer = new MutationObserver(() => { if (inject()) observer.disconnect(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
})();
