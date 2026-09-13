(()=>{
'use strict';
if(window.ANDES_COURSE?.version==='2.2.1')return;
const script=document.currentScript||[...document.scripts].find(s=>/course-data\.js(?:\?|$)/.test(s.src));
const ROOT=script?new URL('../../',script.src):new URL('./',location.href);
const CACHE_KEY='andesdb.course.manifest.v4',CACHE_MAX_AGE=86400000;
let manifest=null,sessions=[],modules=[];
function bogotaDate(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}catch{return new Date().toISOString().slice(0,10)}}
function semanticStatus(s,m){const today=bogotaDate(),raw=String(s.estado||'pendiente');if(s.fecha===today)return'hoy';if(Number(s.n)===Number(m.sesionActual))return'actual';if(raw==='hoy'){if(s.fecha&&s.fecha<today)return'completado';if(s.fecha&&s.fecha>today)return'pendiente';return'actual'}return raw}
function enhanceSession(s,m){
  const resources=[...(s.recursos||[])];
  if(Number(s.n)===15&&!resources.some(r=>String(r.href||'').includes('capstone.html')))resources.unshift({txt:'🎯 Proyecto final · datos, rúbrica y entrega',href:'capstone.html'});
  return {...s,recursos:resources,estado_original:s.estado,estado:semanticStatus(s,m)};
}
const normalize=m=>{if(!m||typeof m!=='object')return null;modules=(m.modulos||[]).map(mod=>({...mod,sesiones:(mod.sesiones||[]).map(s=>enhanceSession(s,m))}));sessions=modules.flatMap(mod=>(mod.sesiones||[]).map(s=>({...s,module_number:mod.n,module_title:mod.titulo,module_desc:mod.desc||''})));sessions.sort((a,b)=>Number(a.n)-Number(b.n));manifest={...m,modulos:modules};return manifest};
function readCache(){try{const x=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(x?.data){normalize(x.data);return x}}catch{}return null}
function writeCache(data){try{localStorage.setItem(CACHE_KEY,JSON.stringify({saved_at:Date.now(),data}))}catch{}}
const cached=readCache();
async function refresh(){try{const r=await fetch(new URL('tools/curso.json',ROOT),{cache:'no-cache'});if(!r.ok)throw new Error('No se pudo cargar el manifiesto del curso');const raw=await r.json();const next=normalize(raw);writeCache(raw);dispatchEvent(new CustomEvent('andesdb:course-updated',{detail:{manifest:next,sessions:[...sessions]}}));return next}catch(e){console.warn('ANDESDB course manifest refresh',e);if(!manifest)throw e;return manifest}}
let readyPromise;if(manifest){readyPromise=Promise.resolve(manifest);queueMicrotask(()=>dispatchEvent(new CustomEvent('andesdb:course-ready',{detail:{manifest,sessions:[...sessions],cached:true}})));if(!cached?.saved_at||Date.now()-cached.saved_at>CACHE_MAX_AGE)setTimeout(refresh,0);else setTimeout(refresh,250)}else{readyPromise=refresh().then(x=>{dispatchEvent(new CustomEvent('andesdb:course-ready',{detail:{manifest:x,sessions:[...sessions],cached:false}}));return x}).catch(e=>{console.error('ANDESDB course manifest',e);return null})}
function fold(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function session(n){return sessions.find(x=>Number(x.n)===Number(n))||null}
function search(q){const x=fold(q).trim();if(!x)return [...sessions];return sessions.filter(s=>fold([s.n,s.titulo,s.desc,(s.tags||[]).join(' '),s.module_title,(s.recursos||[]).map(r=>r.txt).join(' ')].join(' ')).includes(x))}
function upcoming(now=new Date()){return sessions.filter(s=>s.fecha&&new Date(`${s.fecha}T23:59:59-05:00`)>=now).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)))}
function current(){return session(manifest?.sesionActual)||sessions.find(s=>s.estado==='actual')||null}
function today(){return sessions.find(s=>s.estado==='hoy')||null}
function icsText(){const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ANDESDB//LMS//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:ANDESDB','X-WR-TIMEZONE:America/Bogota'];for(const s of sessions.filter(x=>x.fecha)){const d=String(s.fecha).replaceAll('-','');const start=`${d}T180000`;const mins=Number(s.duracionUtil||165),endDate=new Date(`${s.fecha}T18:00:00-05:00`);endDate.setMinutes(endDate.getMinutes()+mins);const pad=n=>String(n).padStart(2,'0'),end=`${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;lines.push('BEGIN:VEVENT',`UID:andesdb-s${s.n}-${s.fecha}@jazaineam1.github.io`,`DTSTAMP:${stamp}`,`DTSTART;TZID=America/Bogota:${start}`,`DTEND;TZID=America/Bogota:${end}`,`SUMMARY:${esc(`ANDESDB · S${s.n} · ${s.titulo}`)}`,`DESCRIPTION:${esc(s.desc||'')}`,`URL:${new URL(s.href,ROOT).href}`,'END:VEVENT')}lines.push('END:VCALENDAR');return lines.join('\r\n')}
function downloadCalendar(){const blob=new Blob([icsText()],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ANDESDB-calendario.ics';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0)}
window.ANDES_COURSE={version:'2.2.1',ROOT,ready:()=>readyPromise,refresh,get manifest(){return manifest},get sessions(){return sessions},get modules(){return modules},session,search,upcoming,current,today,icsText,downloadCalendar};
})();