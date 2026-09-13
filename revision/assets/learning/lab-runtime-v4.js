(()=>{
'use strict';
const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
(async()=>{try{await load('assets/learning/lab-capstone-patch.js?v=20260912-cap1');await load('assets/learning/lab-runtime-v5.js?v=20260912-assessment2')}catch(_){const e=document.getElementById('task');if(e)e.innerHTML='<div style="padding:12px;color:#991b1b">No se pudo cargar el laboratorio. Recarga la página.</div>'}})();
})();