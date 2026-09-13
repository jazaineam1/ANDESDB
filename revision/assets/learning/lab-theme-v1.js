(()=>{
'use strict';
if(window.__ANDES_LAB_THEME_V1__)return;
window.__ANDES_LAB_THEME_V1__=true;
if(!/\/revision\/lab\.html$/i.test(location.pathname))return;

const css=`
:root{
  --lab-surface:#ffffff;
  --lab-surface-soft:#f7f8fb;
  --lab-surface-raised:#eef2f6;
  --lab-text:#182230;
  --lab-text-soft:#344054;
  --lab-muted:#667085;
  --lab-line:#d0d5dd;
  --lab-focus:#f2c300;
  --lab-success:#18724d;
  --lab-success-bg:#ecfdf3;
  --lab-danger:#a92b21;
  --lab-danger-bg:#fff1f0;
  --lab-warning:#8a6500;
  --lab-warning-bg:#fff7d6;
  --lab-info:#175cd3;
  --lab-info-bg:#eff8ff;
  --lab-code-bg:#0b1422;
  --lab-code-text:#f8fafc;
  --lab-code-muted:#a8b5c7;
  --lab-code-line:#344054;
}
html[data-andes-theme="dark"]{
  --lab-surface:#111b29;
  --lab-surface-soft:#162235;
  --lab-surface-raised:#1c2a3d;
  --lab-text:#f7f9fc;
  --lab-text-soft:#d8e0ea;
  --lab-muted:#b4c0cf;
  --lab-line:#3a4b61;
  --lab-focus:#ffd43b;
  --lab-success:#67d7a3;
  --lab-success-bg:#10291f;
  --lab-danger:#ff9c94;
  --lab-danger-bg:#341a1b;
  --lab-warning:#f4cf70;
  --lab-warning-bg:#332a0b;
  --lab-info:#9fc5ff;
  --lab-info-bg:#10243f;
  --lab-code-bg:#08111d;
  --lab-code-text:#f8fafc;
  --lab-code-muted:#aebbd0;
  --lab-code-line:#50627a;
}

/* Superficies del laboratorio: ninguna caja depende de blanco fijo. */
body .compact-head,
body .context,
body .workspace,
body .task,
body .deep,
body .review-card,
body .resultbox,
body .tablewrap,
body .classify-row,
body .order-row{
  background:var(--lab-surface)!important;
  color:var(--lab-text)!important;
  border-color:var(--lab-line)!important;
}
body .workhead,
body .navrow{
  background:var(--lab-surface-soft)!important;
  color:var(--lab-text)!important;
  border-color:var(--lab-line)!important;
}
body .compact-head h1,
body .context h2,
body .task-instruction h2,
body .field-label,
body .deep b,
body .review-card h2{
  color:var(--lab-text)!important;
}
body .compact-head p,
body .context p,
body .deep p,
body .review-card p,
body .task-instruction p,
body .sql-status,
body .muted,
body .workhead b,
body .sync-legend,
body .pnote{
  color:var(--lab-muted)!important;
}
body .task-instruction p,
body .context p,
body .deep p,
body .review-card p{
  line-height:1.55;
}
body .crumb,
body .crumb a{color:var(--lab-muted)!important}

/* Navegación de prácticas legible en ambos temas. */
body .steps button{
  background:var(--lab-surface)!important;
  color:var(--lab-text-soft)!important;
  border-color:var(--lab-line)!important;
}
body .steps button.current{
  background:var(--lab-warning-bg)!important;
  color:var(--lab-text)!important;
  border-color:var(--lab-focus)!important;
  outline-color:color-mix(in srgb,var(--lab-focus) 28%,transparent)!important;
}
body .steps button.done{
  background:var(--lab-success)!important;
  color:#07150f!important;
  border-color:var(--lab-success)!important;
}
html[data-andes-theme="light"] body .steps button.done{color:#fff!important}
body .steps button.pending-sync{
  background:var(--lab-warning-bg)!important;
  color:var(--lab-warning)!important;
  border-color:color-mix(in srgb,var(--lab-warning) 55%,var(--lab-line))!important;
}

/* Editor SQL: superficie de código estable y cursor explícito.
   La piel institucional aplicaba fondo claro a todos los textarea y dejaba el caret blanco. */
body textarea.sql-editor,
body .sql-editor{
  background:var(--lab-code-bg)!important;
  color:var(--lab-code-text)!important;
  -webkit-text-fill-color:var(--lab-code-text)!important;
  caret-color:var(--lab-focus)!important;
  border-color:var(--lab-code-line)!important;
  opacity:1!important;
  text-shadow:none!important;
  color-scheme:dark;
}
body textarea.sql-editor::placeholder,
body .sql-editor::placeholder{
  color:var(--lab-code-muted)!important;
  opacity:1!important;
  -webkit-text-fill-color:var(--lab-code-muted)!important;
}
body textarea.sql-editor::selection,
body .sql-editor::selection{
  background:#315fa8!important;
  color:#fff!important;
}
body textarea.sql-editor:focus,
body .sql-editor:focus{
  border-color:var(--lab-focus)!important;
  outline:2px solid var(--lab-focus)!important;
  outline-offset:2px!important;
  box-shadow:0 0 0 4px color-mix(in srgb,var(--lab-focus) 20%,transparent)!important;
}

/* Respuestas de texto y selects sí siguen el tema de la plataforma. */
body .text-answer,
body .classify-row select,
body .order-row button{
  background:var(--lab-surface)!important;
  color:var(--lab-text)!important;
  border-color:var(--lab-line)!important;
  caret-color:var(--lab-text)!important;
}

/* Contexto SQL: sin franja lateral tipo tarjeta generada y con contraste real. */
body .sql-context-card{
  background:var(--lab-surface-soft)!important;
  color:var(--lab-text)!important;
  border:1px solid var(--lab-line)!important;
  border-left:1px solid var(--lab-line)!important;
  box-shadow:none!important;
}
body .sql-context-card h3,
body .sql-context-card strong{color:var(--lab-text)!important}
body .sql-context-card p{color:var(--lab-text-soft)!important}
body .sql-context-item{
  background:var(--lab-surface)!important;
  color:var(--lab-text-soft)!important;
  border-color:var(--lab-line)!important;
}
body .sql-context-item b{color:var(--lab-info)!important}
body .sql-context-item code,
body .sql-context-card code{
  color:var(--lab-text)!important;
  background:transparent!important;
}

/* Contexto/salida genérico del laboratorio. */
body .andes-task-context>div{
  background:var(--lab-surface-soft)!important;
  color:var(--lab-text)!important;
  border-color:var(--lab-line)!important;
}
body .andes-task-context b{color:var(--lab-muted)!important}
body .andes-task-context p{color:var(--lab-text-soft)!important}
body .andes-task-context .expected{
  background:var(--lab-success-bg)!important;
  border-color:color-mix(in srgb,var(--lab-success) 45%,var(--lab-line))!important;
}
body .andes-task-context .expected b{color:var(--lab-success)!important}

/* Estados de sintaxis y feedback con borde completo, no franja lateral. */
body .sql-syntax-state{
  background:var(--lab-surface-raised)!important;
  color:var(--lab-text-soft)!important;
  border:1px solid var(--lab-line)!important;
}
body .sql-syntax-state.ok{
  background:var(--lab-success-bg)!important;
  color:var(--lab-success)!important;
  border-color:color-mix(in srgb,var(--lab-success) 45%,var(--lab-line))!important;
}
body .sql-syntax-state.bad{
  background:var(--lab-danger-bg)!important;
  color:var(--lab-danger)!important;
  border-color:color-mix(in srgb,var(--lab-danger) 45%,var(--lab-line))!important;
}
body .sql-syntax-state.checking{
  background:var(--lab-info-bg)!important;
  color:var(--lab-info)!important;
  border-color:color-mix(in srgb,var(--lab-info) 45%,var(--lab-line))!important;
}
body .feedback{
  border:1px solid var(--lab-line)!important;
  border-left-width:1px!important;
}
body .feedback.ok{
  background:var(--lab-success-bg)!important;
  color:var(--lab-success)!important;
  border-color:color-mix(in srgb,var(--lab-success) 45%,var(--lab-line))!important;
}
body .feedback.bad{
  background:var(--lab-danger-bg)!important;
  color:var(--lab-danger)!important;
  border-color:color-mix(in srgb,var(--lab-danger) 45%,var(--lab-line))!important;
}

/* Resultados y tablas. */
body .tablewrap{background:var(--lab-surface)!important}
body table{color:var(--lab-text)!important}
body th{
  background:var(--lab-surface-raised)!important;
  color:var(--lab-text-soft)!important;
  border-color:var(--lab-line)!important;
}
body td{color:var(--lab-text)!important;border-color:var(--lab-line)!important}

/* Evita el patrón de barra lateral también en tarjetas auxiliares del laboratorio. */
body .review-card{
  border:1px solid var(--lab-line)!important;
  border-left:1px solid var(--lab-line)!important;
}

/* Barra móvil coherente con el tema. */
body .mobile-nav{
  background:var(--lab-surface)!important;
  border-color:var(--lab-line)!important;
}
body .mobile-nav a{color:var(--lab-muted)!important}
body .mobile-nav a.active{color:var(--lab-text)!important}

@media(max-width:820px){
  body .sql-editor{min-height:250px}
  body .task-instruction p{font-size:.98rem}
  body .sql-context-card p,
  body .sql-context-item,
  body .andes-task-context p{font-size:.9rem}
}
`;

if(!document.getElementById('andes-lab-theme-v1')){
  const style=document.createElement('style');
  style.id='andes-lab-theme-v1';
  style.textContent=css;
  document.head.appendChild(style);
}
})();
