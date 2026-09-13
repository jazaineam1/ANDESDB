(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_TEXT_FIXES__)return;window.__ANDES_PRESENTATION_TEXT_FIXES__=true;
const fixes=[
  [/sanalíticaes/gi,'solapamientos'],
  [/sanalíticaen/gi,'solapen']
];
function apply(){
  const root=document.querySelector('.stage')||document.body;if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,textarea,pre,code')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let n,count=0;
  while((n=walker.nextNode())){
    let v=n.nodeValue,next=v;
    for(const [re,to] of fixes)next=next.replace(re,to);
    if(next!==v){n.nodeValue=next;count++}
  }
  if(count)console.info(`ANDESDB QA: ${count} corrección(es) de texto aplicada(s) en presentación.`);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();