(()=>{
'use strict';
const S=window.ANDES_LAB_CONTENT?.sessions;
if(!S?.[15])return;
const s=S[15];
s.strategy='Caso integrador + entrega auténtica con rúbrica';
s.intro='Estas 10 prácticas comprueban decisiones y mínimos técnicos del caso. La evidencia final —modelo, DDL, consultas, pruebas y defensa— no se aprueba por palabras clave: se entrega aparte y recibe revisión docente con rúbrica.';
s.reviewUrl='capstone.html';
s.reviewTitle='Proyecto final · entrega con rúbrica';
s.reviewCopy='Cierra S15 con una evidencia reproducible: dataset → pregunta y grano → modelo → DDL → 3 consultas → 2 pruebas negativas → decisión SQL/NoSQL → modelo analítico → defensa breve.';
window.ANDES_LAB_CONTENT.version='4.2.0';
})();