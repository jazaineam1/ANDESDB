(()=>{
'use strict';
if(window.__ANDES_LAB_RESUME__)return;window.__ANDES_LAB_RESUME__=true;
function setPractice(n){const u=new URL(location.href);u.searchParams.set('practice',String(n));history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString()+u.hash)}
function boot(){const wanted=Number(new URLSearchParams(location.search).get('practice'));let tries=0;const timer=setInterval(()=>{const steps=[...document.querySelectorAll('#steps [data-step]')];if(steps.length){clearInterval(timer);if(Number.isInteger(wanted)&&wanted>=1&&wanted<=10){steps.find(b=>Number(b.dataset.step)===wanted)?.click();setPractice(wanted)}document.addEventListener('click',e=>{const s=e.target.closest?.('[data-step]');if(s){setTimeout(()=>setPractice(Number(s.dataset.step)),0);return}if(e.target.closest?.('#prev-btn,#next-btn'))setTimeout(()=>{const c=document.querySelector('#steps [data-step].current');if(c)setPractice(Number(c.dataset.step))},30)},true)}else if(++tries>100)clearInterval(timer)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();