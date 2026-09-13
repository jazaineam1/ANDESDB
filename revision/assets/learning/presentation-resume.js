(()=>{
'use strict';
if(window.__ANDES_PRESENTATION_RESUME__)return;window.__ANDES_PRESENTATION_RESUME__=true;
const target=Number(new URLSearchParams(location.search).get('slide'));if(!Number.isInteger(target)||target<1)return;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function current(){const a=document.querySelector('.slide.active');if(a){const slides=[...document.querySelectorAll('.slide')];const i=slides.indexOf(a);if(i>=0)return i+1}const p=document.querySelector('.reveal .slides section.present');if(p){const slides=[...document.querySelectorAll('.reveal .slides section')];const i=slides.indexOf(p);if(i>=0)return i+1}const t=document.querySelector('#count,[data-slide-count],.slide-number')?.textContent||'',m=t.match(/(\d+)\s*(?:\/|of)/i);return m?Number(m[1]):null}
function cleanup(){const u=new URL(location.href);u.searchParams.delete('slide');history.replaceState(null,'',u.pathname+(u.searchParams.toString()?'?'+u.searchParams.toString():'')+u.hash)}
async function waitReady(){for(let i=0;i<40;i++){if(current()!=null||typeof window.go==='function'||window.Reveal?.slide)return true;await sleep(75)}return false}
async function resume(){if(!await waitReady())return;
  if(window.Reveal?.slide){window.Reveal.slide(target-1);await sleep(80);if(current()===target)cleanup();return}
  if(typeof window.go==='function'){try{window.go(target-1);await sleep(60);if(current()===target){cleanup();return}}catch(_){}}
  let c=current();if(c==null)return;if(c===target){cleanup();return}
  const forward=target>c,selector=forward?'#next,.next,button[aria-label*="Siguiente" i],button[title*="Siguiente" i]':'#prev,.prev,button[aria-label*="Anterior" i],button[title*="Anterior" i]';
  const max=Math.min(40,Math.abs(target-c));
  for(let i=0;i<max;i++){
    const b=document.querySelector(selector);if(!b)break;b.click();await sleep(70);
    c=current();if(c===target){cleanup();return}
    if((forward&&c>target)||(!forward&&c<target))break;
  }
}
resume().catch(()=>{});
})();