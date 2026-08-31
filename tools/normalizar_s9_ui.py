from pathlib import Path
import re

S9 = Path('Presentaciones/M3/sesion-9-ddl-supabase.html')
INTEGRADOR = Path('tools/integrar-experiencia.py')
LEARNING = Path('assets/learning/learning-core.js')

CONTROL_CSS = r'''

/* ======================================================================
   CONTROLES ESTÁNDAR ANDESDB · mismo contrato funcional que sesión 5
   ====================================================================== */
.progress{position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:6px!important;background:rgba(0,0,0,.10)!important;z-index:20!important}
.progress .bar{height:100%!important;background:linear-gradient(90deg,var(--y),var(--o))!important;transition:.25s!important;border-radius:0 var(--pill) var(--pill) 0!important}
.toolbar{position:fixed!important;right:1rem!important;top:1rem!important;left:auto!important;bottom:auto!important;transform:none!important;z-index:80!important;display:flex!important;align-items:center!important;gap:.4rem!important;background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;color:#111!important;backdrop-filter:none!important}
.toolbar .ctl{width:42px!important;height:42px!important;border-radius:50%!important;border:1px solid rgba(0,0,0,.10)!important;background:rgba(255,255,255,.94)!important;color:#111!important;font-weight:800!important;cursor:pointer!important;box-shadow:0 4px 16px rgba(0,0,0,.25)!important;padding:0!important;text-decoration:none!important;display:grid!important;place-items:center!important}
.toolbar .ctl:hover{background:#fff!important}
.toolbar .count{background:rgba(10,16,22,.82);color:#fff;padding:.42em .7em;border-radius:999px;font-size:13px;font-weight:700;white-space:nowrap;margin-right:.3rem}
.overlay{position:fixed;inset:0;background:rgba(6,10,14,.72);z-index:100;display:none;place-items:center;backdrop-filter:blur(3px)}
.overlay.open{display:grid}
.panel{width:min(92vw,880px);max-height:88vh;overflow:auto;background:#fff;color:#111;padding:2rem;border-radius:18px;border-top:10px solid var(--y);box-shadow:0 26px 70px rgba(0,0,0,.5)}
.panel h2{font-size:28px;margin-bottom:1rem}
.close{float:right;border:0;background:#111;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer}
.overlay .timer{position:static!important;right:auto!important;top:auto!important;display:block!important;background:transparent!important;color:#111!important;border-radius:0!important;padding:0!important;font:900 82px/1 Consolas,monospace!important;text-align:center!important;font-variant-numeric:tabular-nums!important;margin:1rem!important}
.presets,.actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.55rem;margin:.8rem}
.presets button,.actions button{border:2px solid #111;background:#fff;color:#111;padding:.6em 1em;border-radius:999px;font-weight:800;cursor:pointer}
.actions button:first-child{background:var(--y)}
.panel .libre{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.5rem;margin-top:.8rem}
.panel .libre label{font-size:.9rem;font-weight:700}
.panel .libre input{width:4.6rem;font:900 1.15rem/1 Consolas,monospace;text-align:center;padding:.5rem .4rem;border-radius:999px;border:2px solid #111;background:#fff;color:#111}
.panel .libre input:focus{outline:3px solid var(--y);outline-offset:1px}
.panel .libre span{font-size:.9rem;font-weight:700;margin-left:-.15rem}
.panel .libre button{border:2px solid #111;background:var(--y);color:#111;padding:.6em 1.1em;border-radius:999px;font-weight:800;cursor:pointer}
.panel .libre button:hover{background:#111;color:var(--y)}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.minitimer{position:fixed;left:1.1rem;bottom:1.1rem;z-index:90;display:none;align-items:center;gap:.55rem;padding:.5rem .6rem .5rem .9rem;background:rgba(17,17,17,.94);color:#fff;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.3);font-family:"Segoe UI",Arial,sans-serif;cursor:grab;touch-action:none;user-select:none;transition:background .2s}
.minitimer.on{display:flex}
.minitimer.arrastrando{cursor:grabbing;box-shadow:0 10px 30px rgba(0,0,0,.45)}
.minitimer .mt{font:900 2.1rem/1 Consolas,monospace;font-variant-numeric:tabular-nums;letter-spacing:-.02em;min-width:3.5em;text-align:center}
.minitimer button{border:0;width:2.4rem;height:2.4rem;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:.9rem;font-weight:800;cursor:pointer;display:grid;place-items:center}
.minitimer button:hover{background:rgba(255,255,255,.28)}
.minitimer .lbl{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:var(--y);font-weight:800;margin-right:.1rem}
.minitimer.avisa{background:rgba(193,18,63,.95)}
.minitimer.avisa .lbl{color:#fff}
.minitimer.fin{background:rgba(193,18,63,.97);animation:latido 1s ease-in-out infinite}
@keyframes latido{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.break{height:100%;display:grid;place-content:center;text-align:center}
.clock{font-size:8em;font-weight:900;line-height:.85;font-variant-numeric:tabular-nums;letter-spacing:-.04em}
.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:.85em 1.6em;background:var(--ink);color:#fff;text-decoration:none;font-size:.9em;font-weight:800;cursor:pointer;box-shadow:var(--sh)}
.btn:hover{background:#000}
[data-r]{opacity:0;visibility:hidden;transform:translateY(10px);transition:.24s ease}
[data-r].shown{opacity:1;visibility:visible;transform:none}
@media(max-aspect-ratio:1/1),(max-width:700px){.toolbar{top:.6rem!important;right:.6rem!important;gap:.3rem!important}.toolbar .ctl{width:38px!important;height:38px!important}.toolbar .count{font-size:11px}.overlay .timer{font-size:52px!important}.clock{font-size:4em}.minitimer{left:.75rem;bottom:.75rem;max-width:calc(100vw - 1.5rem);gap:.3rem;padding:.42rem .5rem}.minitimer .lbl{display:none}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{transition:none!important;animation:none!important}}
@media print{.minitimer{display:none!important}}
'''

TAIL = r'''<div class="progress"><div class="bar" id="bar"></div></div></main>
<nav class="toolbar" aria-label="Controles"><span class="count" id="count">1 / 1</span><button class="ctl" id="prev" aria-label="Anterior" title="Diapositiva anterior">←</button><button class="ctl" id="next" aria-label="Siguiente" title="Diapositiva siguiente">→</button><button class="ctl" id="timeBtn" aria-label="Temporizador" title="Temporizador (T)">T</button><a class="ctl" id="dlBtn" href="sesion-9-ddl-supabase.html" download title="Descargar esta presentación" aria-label="Descargar esta presentación">↓</a><button class="ctl" id="fullBtn" aria-label="Pantalla completa" title="Pantalla completa (F)">F</button></nav>
<div class="overlay" id="timeOv" role="dialog" aria-modal="true" aria-label="Temporizador"><div class="panel"><button class="close" data-close>×</button><h2>Temporizador</h2><div class="timer" id="timer">15:00</div><div class="presets"><button data-min="1">1 min</button><button data-min="3">3 min</button><button data-min="5">5 min</button><button data-min="10">10 min</button><button data-min="12">12 min</button><button data-min="15">15 min</button></div><div class="libre"><label for="minLibre">O el que necesites:</label><input type="text" id="minLibre" maxlength="5" value="14" inputmode="decimal" aria-label="Minutos" placeholder="14"><span>min</span><button id="ponLibre">Poner en marcha</button></div><div class="actions"><button id="start">Iniciar</button><button id="pause">Pausar</button><button id="reset">Reiniciar</button></div></div></div>
<div class="minitimer" id="mini" role="group" aria-label="Temporizador flotante"><span class="lbl" id="miniLbl">Reto</span><span class="mt" id="miniT">00:00</span><button id="miniPP" title="Pausar o reanudar" aria-label="Pausar o reanudar">❚❚</button><button id="miniUp" title="Abrir el panel del temporizador" aria-label="Abrir el panel">⏳</button><button id="miniX" title="Ocultar" aria-label="Ocultar el temporizador">×</button></div>
<div class="sr" id="announce" aria-live="assertive"></div>
<script>
(()=>{'use strict';
const ss=[...document.querySelectorAll('.slide')],bar=document.getElementById('bar'),count=document.getElementById('count'),timeOv=document.getElementById('timeOv'),announce=document.getElementById('announce'),clock=document.querySelector('.clock');
let i=0;
function upd(){ss.forEach((s,n)=>s.classList.toggle('active',n===i));count.textContent=(i+1)+' / '+ss.length+(ss[i].dataset.opcional?' · opcional':'');bar.style.width=((i+1)/ss.length*100)+'%';document.title=(i+1)+'/'+ss.length+' · '+ss[i].dataset.title;announce.textContent='Diapositiva '+(i+1)+': '+ss[i].dataset.title;if(ss[i].dataset.break==='15'){setTimer(15,false);render()}}
function next(){const x=ss[i].querySelector('[data-r]:not(.shown)');if(x){x.classList.add('shown');return}if(i<ss.length-1){i++;upd()}}
function prev(){const a=[...ss[i].querySelectorAll('[data-r].shown')];if(a.length){a.at(-1).classList.remove('shown');return}if(i>0){i--;ss[i].querySelectorAll('[data-r]').forEach(x=>x.classList.add('shown'));upd()}}
function go(n){i=Math.max(0,Math.min(ss.length-1,n));upd()}
function closeAll(){timeOv.classList.remove('open')}
async function full(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch(e){announce.textContent='Pantalla completa no disponible'}}
document.getElementById('prev').onclick=prev;document.getElementById('next').onclick=next;document.getElementById('timeBtn').onclick=()=>timeOv.classList.add('open');document.getElementById('fullBtn').onclick=full;
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=closeAll);
document.addEventListener('keydown',e=>{if(['BUTTON','A','INPUT'].includes(e.target.tagName)&&[' ','Enter'].includes(e.key))return;if(e.key==='Escape'){closeAll();return}if(timeOv.classList.contains('open'))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();next()}else if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();prev()}else if(e.key==='Home'){e.preventDefault();go(0)}else if(e.key==='End'){e.preventDefault();go(ss.length-1)}else if(e.key.toLowerCase()==='f')full();else if(e.key.toLowerCase()==='t')timeOv.classList.add('open');else if(e.key.toLowerCase()==='m'&&mini)mini.classList.toggle('on')});
// Compatibilidad con las preguntas rápidas de S9 sin interferir con el temporizador.
document.querySelectorAll('.q').forEach(q=>{q.querySelectorAll('.opts button').forEach((b,idx)=>b.onclick=()=>{q.classList.add('ok');q.querySelectorAll('.opts button').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');const f=q.querySelector('.fb');if(f){const ans=q.dataset.answer;const letras=['a','b','c','d'];const good=ans===letras[idx];f.style.display='block';f.textContent=(good?'✓ Correcto. ':'Revisa: ')+f.dataset.explain||f.textContent}})});
let remain=900000,initial=remain,end=0,running=false,tick=null;
const mini=document.getElementById('mini'),miniT=document.getElementById('miniT'),miniPP=document.getElementById('miniPP'),miniLbl=document.getElementById('miniLbl');
function fmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function cur(){return running?Math.max(0,end-Date.now()):remain}
function render(){const q=cur(),v=fmt(q);document.getElementById('timer').textContent=v;if(miniT){miniT.textContent=v;mini.classList.toggle('avisa',running&&q>0&&q<=60000);mini.classList.toggle('fin',q<=0&&mini.classList.contains('on'));miniPP.innerHTML=running?'❚❚':'▶';miniPP.setAttribute('aria-label',running?'Pausar':'Reanudar')}if(clock&&ss[i].dataset.break==='15')clock.textContent=v;if(running&&q<=0){pause();announce.textContent='Se acabó el tiempo';if(mini)mini.classList.add('fin')}}
function verMini(si){if(mini)mini.classList.toggle('on',si!==false)}
function pause(){if(running){remain=Math.max(0,end-Date.now());running=false;clearInterval(tick);tick=null}render()}
function setTimer(m,open=true){pause();initial=remain=m*60000;if(mini)mini.classList.remove('fin');render();if(open)timeOv.classList.add('open')}
function start(){if(running||remain<=0)return;running=true;end=Date.now()+remain;tick=setInterval(render,200);if(mini)mini.classList.remove('fin');verMini(true);timeOv.classList.remove('open');render()}
function reset(){pause();remain=initial;if(mini)mini.classList.remove('fin');render()}
document.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{setTimer(Number(b.dataset.min),false);if(miniLbl)miniLbl.textContent=b.dataset.min+' min';start()});
const inpLibre=document.getElementById('minLibre'),btnLibre=document.getElementById('ponLibre');if(inpLibre&&btnLibre){const ponLibre=()=>{let m=parseFloat(String(inpLibre.value).replace(',','.'));if(!isFinite(m)||m<=0)return inpLibre.focus();m=Math.min(180,m);inpLibre.value=m;setTimer(m,false);if(miniLbl)miniLbl.textContent=m+' min';start()};btnLibre.onclick=ponLibre;inpLibre.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ponLibre()}})}
const brk=document.querySelector('[data-start-break]');if(brk)brk.onclick=()=>{setTimer(15,false);if(miniLbl)miniLbl.textContent='Pausa';start()};
document.getElementById('start').onclick=start;document.getElementById('pause').onclick=pause;document.getElementById('reset').onclick=reset;
if(mini){miniPP.onclick=e=>{e.stopPropagation();running?pause():start()};document.getElementById('miniUp').onclick=e=>{e.stopPropagation();timeOv.classList.add('open')};document.getElementById('miniX').onclick=e=>{e.stopPropagation();pause();verMini(false)};let ax=0,ay=0,px=0,py=0,mov=false;const guardar=()=>{try{localStorage.setItem('miniPos',JSON.stringify({l:mini.style.left,t:mini.style.top}))}catch(e){}};try{const p=JSON.parse(localStorage.getItem('miniPos')||'null');if(p&&p.l){mini.style.left=p.l;mini.style.top=p.t;mini.style.right='auto';mini.style.bottom='auto'}}catch(e){}mini.addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON')return;const r=mini.getBoundingClientRect();ax=e.clientX-r.left;ay=e.clientY-r.top;px=e.clientX;py=e.clientY;mov=false;mini.setPointerCapture(e.pointerId);mini.classList.add('arrastrando')});mini.addEventListener('pointermove',e=>{if(!mini.classList.contains('arrastrando'))return;if(Math.abs(e.clientX-px)+Math.abs(e.clientY-py)>3)mov=true;if(!mov)return;const r=mini.getBoundingClientRect();const x=Math.min(Math.max(0,e.clientX-ax),innerWidth-r.width);const y=Math.min(Math.max(0,e.clientY-ay),innerHeight-r.height);mini.style.left=x+'px';mini.style.top=y+'px';mini.style.right='auto';mini.style.bottom='auto'});mini.addEventListener('pointerup',e=>{mini.classList.remove('arrastrando');try{mini.releasePointerCapture(e.pointerId)}catch(_){}if(mov)guardar()});addEventListener('resize',()=>{const r=mini.getBoundingClientRect();if(r.right>innerWidth||r.bottom>innerHeight){mini.style.left='';mini.style.top='';mini.style.right='';mini.style.bottom=''}})}
let tx=null;document.addEventListener('touchstart',e=>tx=e.changedTouches[0].screenX,{passive:true});document.addEventListener('touchend',e=>{if(tx===null)return;const d=e.changedTouches[0].screenX-tx;if(Math.abs(d)>60)(d<0?next:prev)();tx=null},{passive:true});
// Copiar SQL como en S5: solo bloques que realmente contienen SQL.
document.querySelectorAll('.slide pre').forEach(pre=>{if(!/\b(SELECT|WITH|FROM|JOIN|WHERE|GROUP BY|ORDER BY|COUNT|SUM|AVG|CASE|CREATE|INSERT|UPDATE|DELETE|ALTER|DROP|SET)\b/i.test(pre.textContent))return;const b=document.createElement('button');b.type='button';b.className='copybtn';b.textContent='copiar';b.setAttribute('aria-label','Copiar este código al portapapeles');b.onclick=async e=>{e.stopPropagation();const t=pre.cloneNode(true);t.querySelectorAll('.copybtn').forEach(x=>x.remove());const txt=t.textContent.replace(/\s+$/,'');try{await navigator.clipboard.writeText(txt);b.textContent='copiado';b.classList.add('ok');setTimeout(()=>{b.textContent='copiar';b.classList.remove('ok')},1500)}catch(_){b.textContent='no se pudo'}};pre.appendChild(b)});
upd();render()})();
</script>
</body>'''

PAUSA = r'''<section class="slide yellow" data-title="Pausa" data-break="15"><div class="break"><div class="ey">Pausa</div><div class="clock">15:00</div>
<h2 style="margin-top:3%">Volvemos en 15 minutos</h2>
<p class="lead" style="margin:auto">Al volver, abrimos Supabase y ejecutamos el primer DDL real.</p>
<button class="btn" data-start-break style="margin-top:2.5%">Iniciar los 15 minutos</button></div>
<div class="brand"><span>Pausa</span><span>Segunda mitad: PostgreSQL real</span></div>
</section>'''


def fix_s9():
    text = S9.read_text(encoding='utf-8')
    # Quitar cualquier capa de práctica externa.
    text = re.sub(r'\s*<script\s+[^>]*src=["\'][^"\']*learning-core\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>\s*', '\n', text, flags=re.I)
    # Reemplazar pausa por el mismo patrón funcional de S5.
    text = re.sub(r'<section class="slide yellow mid" data-title="Pausa">.*?</section>', PAUSA, text, count=1, flags=re.S)
    # Inyectar CSS estándar una sola vez.
    marker = 'CONTROLES ESTÁNDAR ANDESDB'
    if marker not in text:
        text = text.replace('</style>', CONTROL_CSS + '\n</style>', 1)
    # Reemplazar toda la capa de controles / scripts al final.
    start = text.rfind('</main>')
    end = text.lower().rfind('</body>')
    if start < 0 or end < 0:
        raise SystemExit('No se encontró la cola de S9')
    text = text[:start] + TAIL + text[end + len('</body>'):]
    S9.write_text(text, encoding='utf-8')


def fix_integrator():
    text = INTEGRADOR.read_text(encoding='utf-8')
    text = text.replace('- S9, S11, S12, S13, S14 y S15: capa de práctica técnica no persistente.', '- S11, S12, S13, S14 y S15: capa de práctica técnica no persistente.')
    text = text.replace('TECHNICAL_DIFFERENTIATION = {9, 11, 12, 13, 14, 15}', 'TECHNICAL_DIFFERENTIATION = {11, 12, 13, 14, 15}')
    INTEGRADOR.write_text(text, encoding='utf-8')


def fix_learning():
    text = LEARNING.read_text(encoding='utf-8')
    text = text.replace("new Set(['9', '11', '12', '13', '14', '15'])", "new Set(['11', '12', '13', '14', '15'])")
    text = text.replace('// S6, S7, S8, S10 y S16 no reciben una capa artificial Núcleo/Reto.', '// S6, S7, S8, S9, S10 y S16 no reciben una capa artificial Núcleo/Reto.')
    LEARNING.write_text(text, encoding='utf-8')


fix_s9()
fix_integrator()
fix_learning()
print('S9 normalizada contra contrato funcional S5')
