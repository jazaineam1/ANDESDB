(() => {
  'use strict';
  const cfg = window.ANDES_ANALYTICS_CONFIG || {};
  const id = String(cfg.ga4MeasurementId || '').trim();
  const safe = v => String(v ?? '').slice(0,120);
  const BLOCK = /email|mail|name|nombre|username|usuario|user_id|userid|phone|telefono|password|token|documento/i;
  function sanitize(params={}) {
    const out={};
    for (const [k,v] of Object.entries(params)) {
      if (BLOCK.test(k)) continue;
      if (['string','number','boolean'].includes(typeof v)) out[k]=typeof v==='string'?safe(v):v;
    }
    return out;
  }
  function event(name, params={}) {
    if (!cfg.enabled || !/^G-[A-Z0-9]+$/i.test(id) || typeof window.gtag!=='function') return false;
    window.gtag(safe(name), sanitize(params));
    return true;
  }
  window.ANDES_ANALYTICS={event,enabled:()=>!!(cfg.enabled&&/^G-[A-Z0-9]+$/i.test(id))};
  if (!cfg.enabled || !/^G-[A-Z0-9]+$/i.test(id)) return;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.appendChild(s);
  window.gtag('js',new Date());
  window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
  if(cfg.sendPageViews!==false)event('page_view',{page_path:location.pathname,page_title:document.title});
  addEventListener('andesdb:challenge-completed',e=>event('challenge_completed',{session_number:e.detail?.session||null,activity_code:e.detail?.activity||''}));
})();
