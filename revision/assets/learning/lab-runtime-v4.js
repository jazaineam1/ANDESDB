(()=>{
'use strict';
const load=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
(async()=>{try{
  await load('assets/learning/lab-capstone-patch.js?v=20260912-cap1');
  await load('assets/learning/lab-content-s13-s16-alignment-v1.js?v=20260913-align1');
  await load('assets/learning/lab-mcq-v1.js?v=20260912-mcq1');
  await load('assets/learning/lab-ux-v6-patch.js?v=20260912-ux6');
  try{await window.__ANDES_LAB_PATCH_READY__}catch(_){ }
  await load('assets/learning/lab-runtime-v5.js?v=20260912-assessment3');
  await load('assets/learning/lab-context-output-v1.js?v=20260913-context1');
  await load('assets/learning/lab-sql-scaffold-v1.js?v=20260913-sql1');
  await load('assets/learning/lab-finish-v1.js?v=20260912-finish1');
}catch(_){const e=document.getElementById('task');if(e)e.innerHTML='<div style="padding:12px;color:#991b1b">No se pudo cargar el laboratorio. Recarga la página.</div>'}})();
})();