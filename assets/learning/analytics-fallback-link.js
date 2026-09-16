(() => {
  'use strict';

  const m = (document.title + ' ' + location.pathname).match(/(?:sesi[oó]n|sesion)[-_\s]*(1[2-4])/i);
  if (!m) return;
  const n = Number(m[1]);
  if (n < 12 || n > 14) return;

  const thisScript = document.currentScript || [...document.scripts].find(s => /analytics-fallback-link\.js(?:\?|$)/.test(s.src));
  if (!thisScript) return;
  const labUrl = new URL('../../labs/analitica-local.html', new URL('./', thisScript.src)).href;

  function patchS13Labs() {
    if (n !== 13) return;

    const partitionSlide = document.querySelector('.slide[data-title="Laboratorio partición"]');
    if (partitionSlide && !partitionSlide.dataset.verifiedLab) {
      const links = partitionSlide.querySelector('.links');
      if (links) {
        links.innerHTML = '<a href="https://www.skills.google/focuses/3694?locale=es&parent=catalog" target="_blank" rel="noopener">▶ Abrir Lab 1 verificado · Crea tablas particionadas por fecha en BigQuery (GSP414)</a>';
      }
      const h2 = partitionSlide.querySelector('h2');
      if (h2) h2.textContent = 'Lab 1 · partición: práctica introductoria y guiada';
      const checkpoint = partitionSlide.querySelector('.checkpoint');
      if (checkpoint) checkpoint.innerHTML = '<b>Por qué este lab:</b> está centrado en partición, compara datos procesados y muestra que <code>LIMIT</code> no reduce por sí solo los bytes leídos. Es el laboratorio recomendado para todo el grupo.';
      partitionSlide.dataset.verifiedLab = '1';
    }

    const clusteringSlide = document.querySelector('.slide[data-title="Laboratorio clustering"]');
    if (clusteringSlide && !clusteringSlide.dataset.verifiedLab) {
      const links = clusteringSlide.querySelector('.links');
      if (links) {
        links.innerHTML = '<a href="https://www.skills.google/focuses/78061?locale=es&parent=catalog" target="_blank" rel="noopener">▶ Abrir Lab 2 verificado · Performance and Cost Optimization with BigQuery (GSP266)</a>';
      }
      const h2 = clusteringSlide.querySelector('h2');
      if (h2) h2.textContent = 'Lab 2 · clustering: usa la Task 5 con acompañamiento docente';
      const list = clusteringSlide.querySelector('ol');
      if (list) {
        list.innerHTML = `
          <li>Inicia el lab con las <b>credenciales temporales</b> que entrega Google Skills.</li>
          <li>Si el entorno aún no está preparado, sigue las tareas iniciales necesarias; <b>no es obligatorio convertir toda la sesión en el lab completo</b>.</li>
          <li>Cuando llegues a <b>Task 5 · Improve row filtering and join performance by using clustering</b>, concentra allí el aprendizaje.</li>
          <li>Compara la consulta original con las tablas clusterizadas por <code>order_id</code> y <code>product_id</code>, y explica qué bloques deja de ser necesario leer.</li>`;
      }
      const checkpoint = clusteringSlide.querySelector('.checkpoint');
      if (checkpoint) checkpoint.innerHTML = '<b>Foco de S13:</b> Task 5. El lab completo incluye otros temas; no son requisito para demostrar clustering en esta clase.';
      const mini = clusteringSlide.querySelector('.mini');
      if (mini) mini.innerHTML = '<b>Nivel:</b> para este grupo lo usamos como práctica guiada. El objetivo es entender <code>CLUSTER BY</code>, block pruning y la evidencia de bytes, no terminar todas las tareas.';
      clusteringSlide.dataset.verifiedLab = '1';
    }

    const routeSlide = document.querySelector('.slide[data-title="Cómo encontrar los laboratorios"]');
    if (routeSlide && !routeSlide.dataset.verifiedLabs) {
      const routes = routeSlide.querySelectorAll('.route');
      if (routes[0]) {
        routes[0].innerHTML = `
          <strong>Lab 1 · Partición · GSP414</strong>
          <span><b>Crea tablas particionadas por fecha en BigQuery</b> · introductorio y centrado en el concepto de S13.</span>
          <div class="links"><a href="https://www.skills.google/focuses/3694?locale=es&parent=catalog" target="_blank" rel="noopener">▶ Abrir laboratorio verificado de partición</a></div>
          <span class="mini">Ruta recomendada para todo el grupo.</span>`;
      }
      if (routes[1]) {
        routes[1].innerHTML = `
          <strong>Lab 2 · Clustering · GSP266</strong>
          <span><b>Performance and Cost Optimization with BigQuery</b> · usa específicamente la <b>Task 5</b> para clustering.</span>
          <div class="links"><a href="https://www.skills.google/focuses/78061?locale=es&parent=catalog" target="_blank" rel="noopener">▶ Abrir laboratorio verificado de clustering</a></div>
          <span class="mini">Práctica guiada: el lab completo contiene más temas que los necesarios para esta sesión.</span>`;
      }
      routeSlide.dataset.verifiedLabs = '1';
    }
  }

  function installPresentationFixes() {
    if (document.getElementById('analytics-presentation-fixes')) return;
    const style = document.createElement('style');
    style.id = 'analytics-presentation-fixes';
    style.textContent = `
      html.analytics-pause-viewport-active,
      html.analytics-pause-viewport-active body{background:#ffd600!important}
      body>.apt-pause-stage[data-analytics-viewport-pause="1"]{
        position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
        min-height:100dvh!important;max-width:none!important;z-index:35!important;display:none;
        place-items:center!important;overflow:auto!important;
        padding:clamp(2.2rem,6vh,4.5rem) 1.1rem calc(6.2rem + env(safe-area-inset-bottom))!important;
        background:linear-gradient(160deg,#ffe14d 0%,#ffd600 100%)!important;color:#111!important;
      }
      body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-center{width:min(760px,92vw)!important;max-width:92vw!important;margin:auto!important}
      body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-time{font-size:clamp(6rem,14vw,10.5rem)!important}
      .slide[data-title="Pausa"].apt-pause-enhanced>.brand{display:none!important}
      @media(max-width:700px),(max-aspect-ratio:1/1){
        .slide .lab-focus{grid-template-columns:1fr!important}
        .slide .lab-focus .card{min-height:auto!important}
        .slide .links a{overflow-wrap:anywhere;word-break:normal}
        body>.apt-pause-stage[data-analytics-viewport-pause="1"]{padding:max(1.25rem,env(safe-area-inset-top)) .85rem calc(6.8rem + env(safe-area-inset-bottom))!important;align-items:center!important}
        body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-center{width:min(94vw,560px)!important;max-width:94vw!important;gap:.42rem!important}
        body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-time{font-size:clamp(5rem,24vw,8.2rem)!important;line-height:.9!important}
        body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-return{font-size:clamp(1.45rem,6vw,2.05rem)!important;line-height:1.05!important}
        body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-copy{font-size:clamp(.95rem,3.7vw,1.12rem)!important;line-height:1.28!important;margin-bottom:.35rem!important}
        body>.apt-pause-stage[data-analytics-viewport-pause="1"] .apt-pause-controls{width:min(94vw,520px)!important}
      }`;
    document.head.appendChild(style);
  }

  function patchPauseViewport() {
    if (![13, 14].includes(n)) return;
    installPresentationFixes();
    const pauseSlide = document.querySelector('.slide[data-title="Pausa"]');
    if (!pauseSlide) return;
    const active = pauseSlide.classList.contains('active');
    let stage = document.querySelector('body > .apt-pause-stage[data-analytics-viewport-pause="1"]');
    const nestedStage = pauseSlide.querySelector('.apt-pause-stage');
    if (nestedStage) {
      nestedStage.dataset.analyticsViewportPause = '1';
      document.body.appendChild(nestedStage);
      stage = nestedStage;
    }
    if (stage) {
      const sourceCopy = pauseSlide.querySelector('p.lead')?.textContent?.trim();
      const copy = stage.querySelector('.apt-pause-copy');
      if (sourceCopy && copy) copy.textContent = sourceCopy;
      stage.style.setProperty('display', active ? 'grid' : 'none', 'important');
    }
    document.documentElement.classList.toggle('analytics-pause-viewport-active', active);
  }

  function injectFallback() {
    const overlay = document.getElementById('andes-learning-overlay') || document.getElementById('andes-practice-overlay');
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
  }

  function observeSlideChanges() {
    const slides = [...document.querySelectorAll('.slide')];
    if (!slides.length) return;
    const observer = new MutationObserver(mutations => {
      if (mutations.some(x => x.attributeName === 'class')) patchPauseViewport();
    });
    slides.forEach(slide => observer.observe(slide, { attributes: true, attributeFilter: ['class'] }));
  }

  function observeOverlayBriefly() {
    if (injectFallback()) return;
    const observer = new MutationObserver(() => {
      if (injectFallback()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }

  function init() {
    patchS13Labs();
    installPresentationFixes();
    patchPauseViewport();
    observeSlideChanges();
    observeOverlayBriefly();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
