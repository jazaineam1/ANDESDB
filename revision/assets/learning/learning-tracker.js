(() => {
  'use strict';
  const current = document.currentScript || [...document.scripts].find(s => /learning-tracker\.js(?:\?|$)/.test(s.src));
  if (!current) return;
  const dir = new URL('./', current.src);
  const files = [
    ['analytics-config.js?v=20260912a','ANDES_ANALYTICS_CONFIG'],
    ['analytics.js?v=20260912a','ANDES_ANALYTICS'],
    ['heartbeat-policy.js?v=20260912a','__ANDES_HEARTBEAT_POLICY__'],
    ['learning-tracker-v3.js?v=20260912f','ANDES_LMS'],
    ['access-gate.js?v=20260912a','__ANDES_ACCESS_GATE__']
  ];
  const need = files.filter(([file,global]) => {
    if (global==='ANDES_LMS' && window.ANDES_LMS?.version?.startsWith('3.')) return false;
    if (global==='ANDES_ANALYTICS_CONFIG' && window.ANDES_ANALYTICS_CONFIG) return false;
    if (global==='ANDES_ANALYTICS' && window.ANDES_ANALYTICS) return false;
    if (global==='__ANDES_HEARTBEAT_POLICY__' && window.__ANDES_HEARTBEAT_POLICY__) return false;
    return ![...document.scripts].some(s => s.src && s.src.includes(file.split('?')[0]));
  });
  if (document.readyState === 'loading') {
    for (const [file] of need) {
      const src = new URL(file, dir).href.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      document.write('<script src="'+src+'"><'+'/script>');
    }
    return;
  }
  for (const [file] of need) {
    const el=document.createElement('script');el.src=new URL(file,dir).href;el.async=false;document.head.appendChild(el);
  }
})();
