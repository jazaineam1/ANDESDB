(()=>{
'use strict';
if(window.__ANDES_UNIANDES_SKIN_V1__)return;window.__ANDES_UNIANDES_SKIN_V1__=true;
if(/\/Presentaciones\//i.test(location.pathname))return;
const css=`
:root{
 --andes-gold:#f2c300;--andes-gold-soft:#fff6cc;--andes-ink:#171717;--andes-muted:#626b77;
 --andes-line:#d7dadd;--andes-bg:#f4f1e8;--andes-paper:#ffffff;--andes-nav:#111820;
 --andes-blue:#234a73;--andes-green:#18724d;--andes-red:#a92b21;--andes-soft:#f8f7f2;
 --andes-radius:8px;--andes-shadow:0 8px 24px rgba(17,24,32,.07)
}
html[data-andes-theme="dark"]{
 --andes-gold:#ffd43b;--andes-gold-soft:#332c09;--andes-ink:#f6f3ea;--andes-muted:#aab3bf;
 --andes-line:#344051;--andes-bg:#08111d;--andes-paper:#111b29;--andes-nav:#050a10;
 --andes-blue:#8fb8e0;--andes-green:#54c493;--andes-red:#ff9c94;--andes-soft:#0d1724;
 --andes-shadow:0 10px 28px rgba(0,0,0,.28)
}
body{background:var(--andes-bg)!important;color:var(--andes-ink)!important}
.appbar,.topbar{background:var(--andes-nav)!important;border-bottom:3px solid var(--andes-gold)!important;box-shadow:none!important}
.appbar .inner,.topbar .inner{min-height:62px}
.brand{color:#fff!important;letter-spacing:-.02em}
.brand .mark,.mark{border-radius:4px!important;background:var(--andes-gold)!important;color:#302700!important;box-shadow:none!important}
.wrap,.page{padding-top:24px!important}
h1,h2,h3{color:var(--andes-ink);letter-spacing:-.025em}
.head h1,.hero h1{font-size:clamp(2rem,5vw,3.15rem)!important;line-height:1.02!important;font-weight:900!important;max-width:18ch}
.card h2,.article h2{font-size:clamp(1.32rem,2.5vw,1.8rem)!important;line-height:1.08!important;margin-top:.14rem!important}
.ey,.eyebrow,.kicker{color:#8b6d00!important;font-weight:950!important;letter-spacing:.13em!important;text-transform:uppercase!important}
html[data-andes-theme="dark"] .ey,html[data-andes-theme="dark"] .eyebrow,html[data-andes-theme="dark"] .kicker{color:var(--andes-gold)!important}
.card,.metric,.article,.source,.item,.criterion,.detailmetric,.class-topic,.def,.bridge-item,.resultbox,.task{
 background:var(--andes-paper)!important;border-color:var(--andes-line)!important;box-shadow:var(--andes-shadow)!important;border-radius:var(--andes-radius)!important
}
.card{padding:clamp(16px,2.4vw,24px)!important}
.item{box-shadow:none!important}
.muted,.lead,.card p,.topic span,.field small{color:var(--andes-muted)!important}
.tabs{gap:18px!important;border-bottom:1px solid var(--andes-line);padding:0!important;margin-bottom:18px;scrollbar-width:none}
.tab{background:transparent!important;border:0!important;border-radius:0!important;color:var(--andes-muted)!important;padding:13px 2px 11px!important;position:relative;font-weight:850!important}
.tab.active{color:var(--andes-ink)!important;background:transparent!important}
.tab.active::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:4px;background:var(--andes-gold)}
.btn,.act,button.btn,a.btn{border-radius:5px!important;min-height:42px!important;padding:10px 14px!important;box-shadow:none!important;transition:transform .12s ease,background .12s ease,border-color .12s ease!important}
.btn:not(.alt):not(.good):not(.red):not(.yellow):not(.blue),.act:not(.alt):not(.good):not(.red):not(.yellow):not(.blue){background:var(--andes-nav)!important;color:#fff!important}
.btn.alt,.act.alt{background:var(--andes-paper)!important;color:var(--andes-ink)!important;border:1px solid var(--andes-line)!important}
.btn.good,.act.good{background:var(--andes-green)!important;color:#fff!important}
.btn.red,.act.red{background:transparent!important;color:var(--andes-red)!important;border:1px solid color-mix(in srgb,var(--andes-red) 45%,transparent)!important}
.btn.blue,.act.blue{background:var(--andes-blue)!important;color:#fff!important}
.btn.yellow{background:var(--andes-gold)!important;color:#312700!important}
.btn:hover,.act:hover{transform:translateY(-1px)}
.btn:focus-visible,.act:focus-visible,.tab:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid color-mix(in srgb,var(--andes-gold) 68%,white)!important;outline-offset:2px!important}
.input,input,select,textarea{background:var(--andes-paper)!important;color:var(--andes-ink)!important;border:1px solid var(--andes-line)!important;border-radius:5px!important;min-height:44px}
textarea{min-height:auto}
.input:focus,input:focus,select:focus,textarea:focus{border-color:var(--andes-gold)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--andes-gold) 18%,transparent)!important;outline:0!important}
.field label{color:var(--andes-ink)!important;font-weight:850!important}
.tablewrap{border-color:var(--andes-line)!important;border-radius:6px!important;background:var(--andes-paper)!important}
table{color:var(--andes-ink)!important}th{background:var(--andes-soft)!important;color:var(--andes-muted)!important;border-color:var(--andes-line)!important}td{border-color:var(--andes-line)!important}
.pill{border-radius:3px!important;background:var(--andes-soft)!important;color:var(--andes-ink)!important}
.status,.notice,.riskbox,.credentials{border-radius:5px!important;border-left:1px solid var(--andes-line)!important;border-right:1px solid var(--andes-line)!important;border-top:1px solid var(--andes-line)!important;border-bottom:1px solid var(--andes-line)!important}
.mobile-nav{background:var(--andes-paper)!important;border-color:var(--andes-line)!important;box-shadow:0 -4px 16px rgba(0,0,0,.08)!important}
.mobile-nav a{color:var(--andes-muted)!important}.mobile-nav a.active{color:var(--andes-ink)!important;position:relative}.mobile-nav a.active::before{content:"";position:absolute;top:0;left:24%;right:24%;height:3px;background:var(--andes-gold)}
@media(max-width:680px){.wrap,.page{width:min(100% - 28px,1260px)!important}.head h1,.hero h1{font-size:2.15rem!important}.card{padding:16px!important}.tabs{gap:14px!important}.tab{padding-top:11px!important}}
`;
if(!document.getElementById('andes-uniandes-skin')){const s=document.createElement('style');s.id='andes-uniandes-skin';s.textContent=css;document.head.appendChild(s)}
if(!document.querySelector('script[data-andes-session-controls]')){const x=document.createElement('script');x.src=new URL('session-controls-v1.js?v=20260913-session1',document.currentScript?.src||location.href).href;x.dataset.andesSessionControls='1';x.defer=true;document.head.appendChild(x)}
})();