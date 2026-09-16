(() => {
  'use strict';
  if (document.getElementById('andes-presentation-timer')) return;

  const POS_KEY = 'andesdb-presentation-timer-position-v3';
  const style = document.createElement('style');
  style.textContent = `
    #andes-presentation-timer{position:fixed;right:1rem;bottom:4.5rem;z-index:160;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;touch-action:none;user-select:none}
    #andes-presentation-timer *{box-sizing:border-box}
    #andes-presentation-timer .apt-shell{width:min(350px,calc(100vw - 1.2rem));background:rgba(12,20,28,.97);border:1px solid rgba(255,255,255,.16);border-radius:22px;box-shadow:0 18px 44px rgba(0,0,0,.34);overflow:hidden;backdrop-filter:blur(14px)}
    #andes-presentation-timer .apt-head{display:flex;align-items:center;gap:.5rem;padding:.55rem .6rem;background:rgba(255,255,255,.045);cursor:grab}
    #andes-presentation-timer.is-dragging .apt-head,#andes-presentation-timer.is-collapsed .apt-mini{cursor:grabbing}
    #andes-presentation-timer .apt-grip{font-size:1rem;line-height:1;opacity:.62;padding:0 .15rem;letter-spacing:-.12em}
    #andes-presentation-timer .apt-display{font-variant-numeric:tabular-nums;font-size:2.25rem;line-height:1;font-weight:950;letter-spacing:.035em;margin-right:auto;min-width:6.7rem;text-align:center}
    #andes-presentation-timer button{border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:850}
    #andes-presentation-timer .apt-icon{width:2.35rem;height:2.35rem;background:#fff;color:#151515;display:grid;place-items:center;padding:0;font-size:1rem}
    #andes-presentation-timer .apt-body{padding:.72rem;display:grid;gap:.58rem}
    #andes-presentation-timer .apt-presets,#andes-presentation-timer .apt-actions,#andes-presentation-timer .apt-adjust{display:flex;gap:.42rem;flex-wrap:wrap}
    #andes-presentation-timer .apt-presets button{flex:1 1 3.2rem;background:#263746;color:#fff;padding:.5rem .55rem;border:1px solid rgba(255,255,255,.11)}
    #andes-presentation-timer .apt-presets button:hover,#andes-presentation-timer .apt-presets button.is-selected{background:#36536a;outline:1px solid rgba(255,214,0,.75)}
    #andes-presentation-timer .apt-custom{display:grid;grid-template-columns:1fr auto;gap:.45rem;align-items:center}
    #andes-presentation-timer .apt-custom input{min-width:0;width:100%;border:1px solid rgba(255,255,255,.22);background:#0b151d;color:#fff;border-radius:12px;padding:.58rem .72rem;font:inherit;font-weight:800;font-variant-numeric:tabular-nums;outline:none}
    #andes-presentation-timer .apt-custom input:focus{border-color:#ffd600;box-shadow:0 0 0 2px rgba(255,214,0,.16)}
    #andes-presentation-timer .apt-custom input::placeholder{color:#91a4b2;font-weight:650}
    #andes-presentation-timer .apt-custom button{background:#ffd600;color:#352c00;padding:.58rem .85rem}
    #andes-presentation-timer .apt-actions button{flex:1 1 5rem;padding:.56rem .65rem}
    #andes-presentation-timer .apt-primary{background:#ffd600;color:#352c00}
    #andes-presentation-timer .apt-secondary{background:#fff;color:#171717}
    #andes-presentation-timer .apt-adjust{align-items:center;justify-content:center}
    #andes-presentation-timer .apt-adjust button{background:transparent;color:#dfe8ef;border:1px solid rgba(255,255,255,.18);padding:.39rem .75rem}
    #andes-presentation-timer .apt-adjust .apt-more{background:#e9f8ef;color:#155d3d;border-color:#bfe7ce}
    #andes-presentation-timer .apt-status{font-size:.72rem;line-height:1.3;color:#cbd8e2;text-align:center;min-height:1.2em;padding:0 .2rem}
    #andes-presentation-timer .apt-mini{display:none;width:3.15rem;height:3.15rem;border-radius:50%;background:rgba(12,20,28,.97);border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 28px rgba(0,0,0,.3);place-items:center;font-size:1.4rem;cursor:grab}
    #andes-presentation-timer.is-collapsed .apt-shell{display:none}
    #andes-presentation-timer.is-collapsed .apt-mini{display:grid}
    #andes-presentation-timer.is-done .apt-shell{outline:2px solid #8fd6aa;box-shadow:0 0 0 5px rgba(93,190,130,.12),0 18px 44px rgba(0,0,0,.34)}
    #andes-presentation-timer.is-done .apt-display{color:#a9e6bf}
    #andes-presentation-timer.is-free .apt-display{color:#ffd600;font-size:1.6rem}
    #andes-presentation-timer.is-pause .apt-shell{width:min(430px,calc(100vw - 1.2rem))}
    #andes-presentation-timer.is-pause .apt-display{font-size:3.55rem;min-width:9rem}
    #andes-presentation-timer.is-pause .apt-head{padding:.8rem .8rem .62rem}
    @media(max-width:700px){#andes-presentation-timer{right:.45rem;bottom:4.35rem}#andes-presentation-timer .apt-shell{width:min(330px,calc(100vw - .9rem))}#andes-presentation-timer .apt-display{font-size:1.95rem}#andes-presentation-timer.is-pause .apt-shell{width:min(380px,calc(100vw - .9rem))}#andes-presentation-timer.is-pause .apt-display{font-size:3rem}}
    @media print{#andes-presentation-timer{display:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'andes-presentation-timer';
  root.setAttribute('role','region');
  root.setAttribute('aria-label','Temporizador de presentación');
  root.innerHTML = `
    <div class="apt-shell">
      <div class="apt-head" title="Arrastra para mover">
        <span class="apt-grip" aria-hidden="true">⠿</span>
        <span class="apt-display" aria-live="polite">10:00</span>
        <button class="apt-icon apt-sound" type="button" title="Sonido" aria-label="Sonido">🔔</button>
        <button class="apt-icon apt-toggle" type="button" title="Minimizar" aria-label="Minimizar">−</button>
      </div>
      <div class="apt-body">
        <div class="apt-presets">
          <button type="button" data-min="5">5 min</button>
          <button type="button" data-min="10" class="is-selected">10 min</button>
          <button type="button" data-min="15">15 min</button>
          <button type="button" data-min="20">20 min</button>
          <button type="button" data-free="1">Libre</button>
        </div>
        <div class="apt-custom">
          <input class="apt-custom-input" type="text" inputmode="numeric" autocomplete="off" placeholder="Personalizado · 7:30 o 25" aria-label="Tiempo personalizado">
          <button class="apt-custom-apply" type="button">Aplicar</button>
        </div>
        <div class="apt-adjust"><button type="button" data-adjust="-300">−5 min</button><button class="apt-more" type="button" data-adjust="300">+5 min</button></div>
        <div class="apt-actions"><button class="apt-primary apt-start" type="button">▶ Iniciar</button><button class="apt-secondary apt-reset" type="button">↺ Reiniciar</button></div>
        <div class="apt-status">Puedes mover, minimizar o ajustar el tiempo en cualquier momento.</div>
      </div>
    </div>
    <div class="apt-mini" title="Abrir temporizador" aria-label="Abrir temporizador">⏱</div>`;
  document.body.appendChild(root);

  const display=root.querySelector('.apt-display'), startBtn=root.querySelector('.apt-start'), resetBtn=root.querySelector('.apt-reset'), toggleBtn=root.querySelector('.apt-toggle'), soundBtn=root.querySelector('.apt-sound'), status=root.querySelector('.apt-status'), customInput=root.querySelector('.apt-custom-input'), customApply=root.querySelector('.apt-custom-apply'), mini=root.querySelector('.apt-mini'), head=root.querySelector('.apt-head'), presetButtons=[...root.querySelectorAll('[data-min],[data-free]')];
  let selectedSeconds=600, remainingSeconds=600, running=false, freeMode=false, endAt=0, tickId=0, alarmed=false, soundEnabled=true, audioCtx=null, drag=null, ignoreMiniClick=false;

  const format=(seconds)=>{const safe=Math.max(0,Math.ceil(seconds)),h=Math.floor(safe/3600),m=Math.floor((safe%3600)/60),s=safe%60;return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};
  const parseCustom=(raw)=>{const v=String(raw||'').trim();if(/^\d+$/.test(v))return Number(v)>0?Number(v)*60:null;const p=v.split(':');if((p.length===2||p.length===3)&&p.every(x=>/^\d+$/.test(x))){const a=p.map(Number);if(p.length===2){if(a[1]>=60)return null;return a[0]*60+a[1]||null}if(a[1]>=60||a[2]>=60)return null;return a[0]*3600+a[1]*60+a[2]||null}return null};
  const selectButton=(fn)=>presetButtons.forEach(b=>b.classList.toggle('is-selected',fn(b)));
  const render=()=>{display.textContent=freeMode?'LIBRE':format(remainingSeconds);startBtn.disabled=freeMode;startBtn.style.opacity=freeMode?'.55':'1';startBtn.textContent=running?'❚❚ Pausar':(remainingSeconds<selectedSeconds&&remainingSeconds>0?'▶ Continuar':'▶ Iniciar');root.classList.toggle('is-done',!freeMode&&remainingSeconds<=0);root.classList.toggle('is-free',freeMode);soundBtn.textContent=soundEnabled?'🔔':'🔕'};
  const primeAudio=()=>{if(!soundEnabled)return;try{const C=window.AudioContext||window.webkitAudioContext;if(C&&!audioCtx)audioCtx=new C();if(audioCtx?.state==='suspended')audioCtx.resume()}catch(_){}};
  const alarm=()=>{if(!soundEnabled)return;try{primeAudio();if(!audioCtx)return;const now=audioCtx.currentTime;[[0,740,.34],[.48,740,.34],[.96,880,.4],[1.52,880,.4],[2.12,1047,.46],[2.82,1047,.46],[3.55,1318,.68]].forEach(([t,f,d])=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,now+t);g.gain.exponentialRampToValueAtTime(.13,now+t+.035);g.gain.exponentialRampToValueAtTime(.0001,now+t+d);o.connect(g);g.connect(audioCtx.destination);o.start(now+t);o.stop(now+t+d+.06)})}catch(_){}};
  const stop=()=>{running=false;cancelAnimationFrame(tickId)};
  const finish=()=>{stop();remainingSeconds=0;if(!alarmed){alarmed=true;alarm();status.textContent='Tiempo cumplido. Puedes añadir tiempo o continuar.'}render()};
  const tick=()=>{if(!running||freeMode)return;remainingSeconds=Math.max(0,(endAt-Date.now())/1000);if(remainingSeconds<=0)return finish();render();tickId=requestAnimationFrame(tick)};
  const setSeconds=(s)=>{stop();freeMode=false;selectedSeconds=Math.max(1,Math.round(s));remainingSeconds=selectedSeconds;alarmed=false;selectButton(()=>false);status.textContent=`${format(selectedSeconds)} listo.`;render()};
  const setMinutes=(m)=>{setSeconds(m*60);selectButton(b=>Number(b.dataset.min)===m)};
  const setFree=()=>{stop();freeMode=true;alarmed=false;selectButton(b=>b.hasAttribute('data-free'));status.textContent='Modo libre.';render()};

  root.querySelectorAll('[data-min]').forEach(b=>b.addEventListener('click',()=>setMinutes(Number(b.dataset.min))));
  root.querySelector('[data-free]').addEventListener('click',setFree);
  root.querySelectorAll('[data-adjust]').forEach(b=>b.addEventListener('click',()=>{const d=Number(b.dataset.adjust||0);if(freeMode){setMinutes(10);return}if(running){endAt+=d*1000;remainingSeconds=Math.max(0,(endAt-Date.now())/1000);selectedSeconds=Math.max(1,selectedSeconds+d)}else{selectedSeconds=Math.max(1,selectedSeconds+d);remainingSeconds=Math.max(1,remainingSeconds+d)}alarmed=false;selectButton(()=>false);render()}));
  customApply.addEventListener('click',()=>{const s=parseCustom(customInput.value);if(!s){status.textContent='Usa 12, 7:30 o 1:05:00.';customInput.focus();return}setSeconds(s);customInput.value=format(s)});
  customInput.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();customApply.click()}});
  startBtn.addEventListener('click',()=>{if(freeMode)return;primeAudio();if(running){remainingSeconds=Math.max(0,(endAt-Date.now())/1000);stop();status.textContent='Pausado.';render();return}if(remainingSeconds<=0)remainingSeconds=selectedSeconds;endAt=Date.now()+remainingSeconds*1000;running=true;alarmed=false;status.textContent='En marcha.';render();tick()});
  resetBtn.addEventListener('click',()=>{stop();freeMode=false;remainingSeconds=selectedSeconds;alarmed=false;status.textContent='Reiniciado.';render()});
  soundBtn.addEventListener('click',()=>{soundEnabled=!soundEnabled;if(soundEnabled)primeAudio();render()});
  toggleBtn.addEventListener('click',()=>root.classList.add('is-collapsed'));
  mini.addEventListener('click',()=>{if(ignoreMiniClick){ignoreMiniClick=false;return}root.classList.remove('is-collapsed')});
  addEventListener('keydown',e=>{if(e.target===customInput)return;if(e.key.toLowerCase()==='t')root.classList.toggle('is-collapsed')});

  const restorePosition=()=>{try{const p=JSON.parse(localStorage.getItem(POS_KEY)||'null');if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){root.style.right='auto';root.style.bottom='auto';root.style.left=`${Math.max(6,Math.min(innerWidth-60,p.x))}px`;root.style.top=`${Math.max(6,Math.min(innerHeight-60,p.y))}px`}}catch(_){}};
  const startDrag=(e)=>{if(e.target.closest('button,input'))return;const r=root.getBoundingClientRect();drag={sx:e.clientX,sy:e.clientY,left:r.left,top:r.top,moved:false};root.classList.add('is-dragging');root.style.right='auto';root.style.bottom='auto';root.style.left=`${r.left}px`;root.style.top=`${r.top}px`;e.currentTarget.setPointerCapture?.(e.pointerId)};
  const moveDrag=(e)=>{if(!drag)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(Math.abs(dx)>3||Math.abs(dy)>3)drag.moved=true;const w=root.offsetWidth||52,h=root.offsetHeight||52,x=Math.max(6,Math.min(innerWidth-w-6,drag.left+dx)),y=Math.max(6,Math.min(innerHeight-h-6,drag.top+dy));root.style.left=`${x}px`;root.style.top=`${y}px`};
  const endDrag=()=>{if(!drag)return;ignoreMiniClick=drag.moved;root.classList.remove('is-dragging');try{localStorage.setItem(POS_KEY,JSON.stringify({x:root.offsetLeft,y:root.offsetTop}))}catch(_){}drag=null};
  [head,mini].forEach(el=>el.addEventListener('pointerdown',startDrag));addEventListener('pointermove',moveDrag);addEventListener('pointerup',endDrag);

  const syncPause=()=>{const active=document.querySelector('.slide.active'),isPause=!!active&&(/pausa/i.test(active.dataset.title||'')||/^\s*pausa/i.test(active.textContent||''));root.classList.toggle('is-pause',isPause);if(isPause){root.classList.remove('is-collapsed');if(!running&&!freeMode&&remainingSeconds===selectedSeconds)setMinutes(15)}};
  const stage=document.querySelector('.stage');
  if(stage){new MutationObserver(syncPause).observe(stage,{subtree:true,attributes:true,attributeFilter:['class']});}
  restorePosition();syncPause();render();
})();