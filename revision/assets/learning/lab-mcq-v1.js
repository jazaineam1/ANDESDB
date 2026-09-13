(()=>{
'use strict';
const S=window.ANDES_LAB_CONTENT?.sessions;
if(!S)return;
const MCQ=(title,prompt,choices,answer,explain)=>({
  type:'classify',mcq:true,title,prompt,
  categories:choices,items:['Selecciona una opción'],answers:[answer],explain
});
const replace=(session,index,task)=>{if(S[session]?.tasks?.[index])S[session].tasks[index]=task};

/* Preguntas de selección múltiple explícitas.
   Política del curso: máximo 5 de 10 prácticas por sesión (50%).
   Aquí usamos 1 por sesión conceptual (10%); no reemplazamos prácticas SQL. */
replace(1,9,MCQ('¿Cuándo conviene un SGBD?','¿Cuál escenario justifica con mayor fuerza usar un sistema gestor de bases de datos?',[
  'Varios usuarios actualizan datos compartidos y se necesita integridad',
  'Una lista personal de 20 filas que solo usa una persona',
  'Un archivo temporal para intercambiar datos una sola vez',
  'Un documento de texto con notas estáticas'
],'Varios usuarios actualizan datos compartidos y se necesita integridad','La concurrencia, la integridad y las relaciones son señales fuertes para usar un SGBD.'));

replace(6,1,MCQ('Regla de negocio verificable','¿Cuál redacción se puede traducir con mayor claridad a cardinalidad e integridad?',[
  'Cada pedido pertenece exactamente a un cliente existente',
  'Los pedidos tienen clientes',
  'Normalmente un pedido tiene cliente',
  'Los pedidos se relacionan con cosas del sistema'
],'Cada pedido pertenece exactamente a un cliente existente','Una regla verificable explicita obligación, cardinalidad y referencia.'));

replace(7,2,MCQ('Resolver una relación N:M','Pedido y Plato tienen una relación muchos a muchos. ¿Qué diseño es el más adecuado?',[
  'Crear LINEA_PEDIDO con pedido_id y plato_id',
  'Agregar diez columnas plato_1…plato_10 en PEDIDO',
  'Guardar pedido_id repetido dentro de PLATO',
  'Eliminar la relación y dejar ambas tablas aisladas'
],'Crear LINEA_PEDIDO con pedido_id y plato_id','La entidad asociativa convierte N:M en dos relaciones 1:N y puede almacenar cantidad o precio.'));

replace(8,3,MCQ('Detectar una dependencia parcial','Con PK compuesta (pedido_id, producto_id), ¿cuál atributo muestra una dependencia parcial?',[
  'nombre_producto depende solo de producto_id',
  'cantidad depende de pedido_id y producto_id',
  'precio_unitario histórico depende de toda la línea',
  'total_linea se calcula con cantidad y precio de la línea'
],'nombre_producto depende solo de producto_id','En 2FN, una dependencia parcial aparece cuando un atributo depende solo de una parte de una clave compuesta.'));

replace(10,2,MCQ('SQL o NoSQL para pagos','¿Qué requisito inclina con más fuerza un sistema de pagos hacia una base relacional?',[
  'Transacciones e integridad fuertes',
  'Documentos con estructura muy cambiante',
  'Contadores de likes eventualmente consistentes',
  'Contenido que siempre se lee como un único documento'
],'Transacciones e integridad fuertes','Pagos y transferencias suelen exigir consistencia e integridad transaccional.'));

replace(11,5,MCQ('¿Embeber o referenciar?','¿Cuál patrón favorece embeber datos dentro de un documento?',[
  'Carrito e ítems pequeños que siempre se leen juntos',
  'Producto maestro compartido y actualizado por miles de documentos',
  'Usuario corporativo reutilizado por muchas colecciones',
  'Catálogo global que debe tener una única versión vigente'
],'Carrito e ítems pequeños que siempre se leen juntos','Embeber favorece agregados pequeños con ciclo de vida y lectura conjunta.'));

replace(12,1,MCQ('Grano de una tabla de hechos','En un modelo de ventas, ¿cuál frase declara correctamente el grano?',[
  'Una fila por línea de producto vendida',
  'Una tabla con cliente, fecha y producto',
  'Una tabla para analizar ventas',
  'Una fila con varias medidas y dimensiones'
],'Una fila por línea de producto vendida','El grano especifica exactamente qué representa cada fila de la tabla de hechos.'));

replace(13,3,MCQ('Costo en BigQuery','¿Qué práctica suele aumentar bytes procesados sin aportar valor a la pregunta?',[
  'Usar SELECT * sobre una tabla ancha',
  'Seleccionar solo las columnas necesarias',
  'Aplicar un filtro útil antes de explorar',
  'Revisar bytes estimados antes de ejecutar'
],'Usar SELECT * sobre una tabla ancha','En analítica por demanda, leer columnas innecesarias suele aumentar datos procesados.'));

const counts={};
for(const [k,s] of Object.entries(S)){
  const n=(s.tasks||[]).filter(t=>t?.mcq).length;
  counts[k]=n;
  if(n>5){
    console.error(`ANDESDB: S${k} tiene ${n} preguntas MCQ; el máximo permitido es 5/10.`);
    (s.tasks||[]).forEach((t,i)=>{if(t?.mcq&&i>=5)t.mcq=false});
  }
}
window.ANDES_LAB_MCQ_POLICY={version:'1.0.0',maxPerSession:5,maxShare:.5,counts};
})();