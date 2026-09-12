(() => {
  'use strict';
  const m = (document.title + ' ' + location.pathname).match(/(?:sesi[oó]n|sesion)[-_\s]*(1[2-4])/i);
  if (!m) return;
  const n = Number(m[1]);
  if (n < 12 || n > 14) return;

  // Compatibilidad curricular: la S6 actual ya no introduce OLTP/OLAP,
  // lago/bodega ni ETL/ELT. S12 es ahora la apertura deliberada del hilo
  // analítico. Esta reparación evita que la versión monolítica histórica
  // de S12 muestre referencias obsoletas mientras conserva su laboratorio.
  function repairS12Narrative() {
    if (n !== 12) return;
    const bridge = document.querySelector('.slide[data-title="Dónde estamos"]');
    if (bridge) {
      const lead = bridge.querySelector('.lead');
      if (lead) lead.textContent = 'Hasta la sesión 11 construimos deliberadamente el camino operacional. Hoy abrimos el segundo hilo: usar esos datos para analizar el negocio.';
      const checkpoint = bridge.querySelector('.checkpoint');
      if (checkpoint) checkpoint.textContent = 'Ya tienes un modelo operacional que funciona. ¿Qué limitación aparece cuando intentas usarlo directamente para preguntas analíticas repetidas y agregadas?';
    }
    document.querySelectorAll('.slide .ey').forEach(ey => {
      if (/Recuperado de la sesión 6/i.test(ey.textContent || '')) {
        ey.textContent = 'Concepto analítico · aparece cuando el problema lo exige';
      }
    });
  }
  repairS12Narrative();

  const thisScript = document.currentScript || [...document.scripts].find(s => /analytics-fallback-link\.js(?:\?|$)/.test(s.src));
  if (!thisScript) return;
  const labUrl = new URL('../../labs/analitica-local.html', new URL('./', thisScript.src)).href;

  const inject = () => {
    const overlay = document.getElementById('andes-learning-overlay');
    if (!overlay || overlay.querySelector('[data-analytics-fallback-link]')) return false;
    const targets = [...overlay.querySelectorAll('.ap-real')];
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
