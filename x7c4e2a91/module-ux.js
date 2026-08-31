(function(){
'use strict';
if(!window.STEPS&&typeof STEPS==='undefined')return;
document.body.classList.add('ux-v4');

var top=document.querySelector('.top');
var topStats=document.querySelector('.top-stats');
var topPractice=document.createElement('button');
topPractice.id='topPractice';topPractice.className='top-practice';topPractice.type='button';topPractice.textContent='⌨ Practicar';
top.insertBefore(topPractice,topStats);

var content=$('lessonContent');
var actions=document.createElement('section');
actions.id='stepPrimaryActions';actions.className='step-primary-actions';
actions.innerHTML='<div class="action-copy"><b id="stepActionTitle">Comprueba la idea con datos</b><span id="stepActionText">Abre SQL solo cuando quieras experimentar.</span></div><button id="stepPracticeBtn" type="button">Probar en SQL</button>';
content.parentNode.insertBefore(actions,document.querySelector('.navrow'));

var studio=$('studio');
var close=document.createElement('button');close.id='studioClose';close.className='studio-close';close.type='button';close.setAttribute('aria-label','Cerrar laboratorio');close.textContent='×';studio.insertBefore(close,studio.firstChild);
var backdrop=document.createElement('div');backdrop.id='studioBackdrop';backdrop.className='studio-backdrop';backdrop.hidden=true;document.body.appendChild(backdrop);

var baseRenderStudio=renderStudio;
renderStudio=function(s){
  baseRenderStudio(s);
  var isLab=!!s.lab;
  $('hintBtn').hidden=!isLab;
  $('checks').hidden=!isLab;
  $('dockHint').style.display=isLab?'':'none';
  document.querySelector('.mobile-dock').classList.toggle('has-hint',isLab);
  $('explainBtn').textContent='🧠 Explicar mi SQL';
  $('dataBtn').textContent='▦ Ver muestra';
  if(isLab){
    $('labTitle').textContent=s.title;
    $('labExpected').textContent='La plataforma verificará columnas, filas, valores y el concepto usado.';
    $('feedback').textContent='Escribe o modifica la consulta. Puedes intentar tantas veces como necesites.';
  }else{
    $('labTitle').textContent='Prueba rápida · '+s.title;
    $('labPrompt').textContent='Ejecuta el ejemplo preparado y cambia una parte para observar qué ocurre.';
    $('labExpected').textContent='Exploración libre · aquí no hay respuesta única ni necesitas una pista.';
    $('feedback').textContent='Ejecuta el ejemplo y compara el resultado con lo que acabas de estudiar.';
  }
  configureAction(s);
};

var baseRun=run;
run=function(){
  var s=STEPS[currentIndex];
  baseRun();
  if(!s.lab&&lastResult&&$('feedback').classList.contains('good')){
    setFeedback('✓ Se ejecutó sobre dvdrental. Ahora cambia un filtro, una columna o una cláusula y observa qué cambia.','good');
  }
};

var baseShowHint=showHint;
showHint=function(){
  var s=STEPS[currentIndex];
  if(!s.lab)return;
  baseShowHint();
};

var baseRenderStep=renderStep;
renderStep=function(index,fromDb){
  closeStudio();
  baseRenderStep(index,fromDb);
  configureAction(STEPS[index]);
};

function configureAction(s){
  var title=$('stepActionTitle'),text=$('stepActionText'),btn=$('stepPracticeBtn');
  actions.classList.toggle('secondary',!s.lab);
  if(s.lab){
    title.textContent='Ahora hazlo tú';
    text.textContent='La explicación termina aquí. Resuelve la misión y recibe feedback con la base real.';
    btn.textContent='Abrir laboratorio →';
  }else if(s.kind==='quiz'){
    title.textContent='¿Quieres comprobarlo con SQL?';
    text.textContent='La pregunta se responde aquí; el SQL queda disponible solo para explorar.';
    btn.textContent='Explorar con datos';
  }else{
    title.textContent='¿Quieres verlo sobre datos reales?';
    text.textContent='No es obligatorio. Abre un ejemplo listo y experimenta sin afectar tu progreso.';
    btn.textContent='Probar este concepto';
  }
}

function openStudio(){
  if(innerWidth<=760){showMobile('practice');return;}
  studio.classList.add('ux-open');backdrop.hidden=false;document.body.style.overflow='hidden';
  setTimeout(function(){$('sqlEditor').focus();},100);
}
function closeStudio(){
  if(innerWidth<=760){
    studio.classList.remove('ux-open');
    if(typeof showMobile==='function')showMobile('learn');
    return;
  }
  studio.classList.remove('ux-open');backdrop.hidden=true;document.body.style.overflow='';
}

$('stepPracticeBtn').onclick=openStudio;
topPractice.onclick=openStudio;
close.onclick=closeStudio;
backdrop.onclick=closeStudio;
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeStudio();});

$('runBtn').onclick=run;
$('dockRun').onclick=function(){openStudio();run();};
$('hintBtn').onclick=showHint;
$('dockHint').onclick=function(){openStudio();showHint();};
$('mobilePractice').onclick=function(){showMobile('practice');};
$('mobileLearn').onclick=function(){showMobile('learn');};

configureAction(STEPS[currentIndex]);
renderStudio(STEPS[currentIndex]);
})();
