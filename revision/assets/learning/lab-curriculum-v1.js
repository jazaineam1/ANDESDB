(()=>{
'use strict';
if(window.__ANDES_LAB_CURRICULUM_V1__)return;window.__ANDES_LAB_CURRICULUM_V1__=true;
const S=window.ANDES_LAB_CONTENT?.sessions;if(!S)return;
const SQL=(title,prompt,reference,hints=[])=>({type:'sql',title,prompt,reference,starter:'-- Escribe tu consulta aquí\n',hints});
const C=(title,prompt,categories,items,answers,explain)=>({type:'classify',title,prompt,categories,items,answers,explain});
const O=(title,prompt,items,answer,explain)=>({type:'order',title,prompt,items,answer,explain});

/* Regla curricular:
   una práctica solo puede evaluar conceptos enseñados en la presentación de esa sesión
   o recuperados explícitamente de sesiones anteriores. Los avances de la diapositiva
   "próxima sesión" NO cuentan como enseñanza. */

/* S1 · solo lo efectivamente trabajado: valor, archivo/base, forma del dato,
   roles, ciclo de vida, diagnóstico y preparación. Sin OLTP/OLAP, grano ni SQL. */
if(S[1]){
 S[1].strategy='Diagnosticar, clasificar y conectar lo visto en la sesión';
 S[1].intro='Estas prácticas recuperan únicamente las ideas trabajadas en la presentación 1. No necesitas SQL ni conceptos de sesiones posteriores.';
 S[1].tasks=[
  C('Dato, archivo o base de datos','Clasifica cada ejemplo por lo que es.',['Dato','Archivo','Base de datos'],['42','ventas.csv','catálogo persistente de clientes que varios usuarios consultan','foto_averia.jpg'],['Dato','Archivo','Base de datos','Archivo'],'Un dato es un valor; un archivo es un soporte; una base gestiona datos persistentes y compartidos.'),
  C('Forma del dato','Clasifica según la forma explicada en clase.',['Estructurado','Semiestructurado','No estructurado'],['factura en CSV con columnas','respuesta JSON de una API','fotografía de una avería','audio de una llamada'],['Estructurado','Semiestructurado','No estructurado','No estructurado'],'La forma condiciona cómo almacenamos y consultamos, sin decidir por sí sola una tecnología.'),
  O('Del evento a la decisión','Ordena la cadena de valor mostrada en la presentación.',['Decisión','Transformación','Evento','Consumidor','Dato','Almacenamiento'],['Evento','Dato','Almacenamiento','Transformación','Consumidor','Decisión'],'Guardar datos no crea valor por sí solo: el valor aparece cuando ayudan a una decisión.'),
  C('Archivo o base: depende del problema','Elige la opción más natural para cada necesidad.',['Archivo','Base de datos'],['intercambio personal de una lista pequeña','30 personas actualizan información compartida','archivo temporal que se envía una vez','datos persistentes con reglas y consultas concurrentes'],['Archivo','Base de datos','Archivo','Base de datos'],'La sesión no plantea “archivo malo / base buena”; la elección depende de la necesidad.'),
  C('Responsabilidad principal','Asocia cada responsabilidad con el rol trabajado.',['DBA','Data engineer','Data analyst'],['disponibilidad, seguridad y respaldo de la base','ingesta, transformación y pipelines','consulta, análisis y comunicación para decidir'],['DBA','Data engineer','Data analyst'],'Una persona puede cubrir varios roles, pero las responsabilidades son distintas.'),
  O('Ciclo de vida del dato','Ordena el recorrido mostrado en la diapositiva.',['Consume','Protege','Fuente','Transforma','Captura','Consulta','Almacena'],['Fuente','Captura','Almacena','Protege','Consulta','Transforma','Consume'],'Una arquitectura empieza antes del almacenamiento y termina en un uso concreto.'),
  C('¿Qué tipo de problema estás viendo?','Clasifica el problema principal del ejemplo.',['Proceso','Gestión compartida','Definición'],['cada viernes alguien une tres archivos a mano','varias copias del mismo archivo terminan con valores diferentes','nadie ha acordado qué significa “cliente duplicado”','el mismo dashboard se reconstruye manualmente cada semana'],['Proceso','Gestión compartida','Definición','Proceso'],'Antes de rediseñar hay que distinguir problemas de proceso, gestión y significado.'),
  C('Herramienta por propósito','Asocia la herramienta con el uso explicado.',['Beekeeper Studio','Navegador','Repositorio ANDESDB'],['explorar una base relacional','abrir laboratorios locales y servicios cloud','consultar presentaciones, datos, scripts y contingencias'],['Beekeeper Studio','Navegador','Repositorio ANDESDB'],'La sesión 1 prepara el entorno; todavía no pide memorizar interfaces.'),
  C('Evidencia o hipótesis al mirar tablas','Distingue lo que realmente observas de lo que solo infieres por el nombre.',['Evidencia observable','Hipótesis'],['existe una tabla llamada film','film e inventory deben relacionarse de cierta manera porque sus nombres lo sugieren','existe una tabla llamada customer','todo payment pertenece obligatoriamente a un rental porque parece lógico'],['Evidencia observable','Hipótesis','Evidencia observable','Hipótesis'],'Un nombre sugiere significado, pero no demuestra una regla del negocio.'),
  C('Cuándo una base aporta valor','Clasifica las señales descritas en la sesión.',['Favorece una base de datos','Puede bastar un archivo'],['muchos usuarios consultan y actualizan información común','se necesitan reglas compartidas y persistencia','lista personal de pocas filas sin concurrencia','archivo de intercambio que se descarta después'],['Favorece una base de datos','Favorece una base de datos','Puede bastar un archivo','Puede bastar un archivo'],'Concurrencia, persistencia, reglas y consultas compartidas son razones para usar una base.')
 ];
}

/* S2 · SELECT/FROM/WHERE, AND/OR/NOT, DISTINCT, COUNT, ORDER BY y LIMIT.
   BETWEEN, IN y LIKE aparecen únicamente como anticipo de S3 y se retiran del laboratorio S2. */
if(S[2]){
 S[2].tasks[5]=SQL('Filtro numérico con WHERE','Devuelve title y length de las primeras 8 películas de más de 120 minutos, ordenadas por length y title.','SELECT title, length FROM film WHERE length > 120 ORDER BY length ASC, title ASC LIMIT 8;',['WHERE también puede comparar números; no llevan comillas.']);
 S[2].tasks[6]=SQL('Combinar condiciones con OR','Devuelve title y rating de 8 películas cuya clasificación sea G o PG, ordenadas por rating y title.','SELECT title, rating FROM film WHERE rating = \'G\' OR rating = \'PG\' ORDER BY rating ASC, title ASC LIMIT 8;',['OR basta con que cumpla una de las dos condiciones.']);
 S[2].tasks[7]=SQL('COUNT con filtro','Cuenta cuántas películas tienen rating PG. Devuelve una sola columna llamada pg_films.','SELECT COUNT(*) AS pg_films FROM film WHERE rating = \'PG\';',['Primero WHERE decide qué filas entran; COUNT(*) cuenta las que quedaron.']);
}

/* S3 · BETWEEN, IN, LIKE, NULL, agregaciones, GROUP BY y HAVING.
   COUNT(DISTINCT ...) se enseña de forma explícita en S5, así que no se evalúa aquí. */
if(S[3]){
 S[3].tasks[7]=SQL('NULL también es información','Cuenta cuántos alquileres todavía no tienen return_date. Usa el alias open_rentals.','SELECT COUNT(*) AS open_rentals FROM rental WHERE return_date IS NULL;',['Para NULL usa IS NULL, no = NULL.']);
}

/* S4 · la presentación dedica el núcleo a UNION/UNION ALL y a INNER/LEFT/RIGHT/FULL.
   El laboratorio anterior casi no practicaba UNION; se equilibra el recorrido. */
if(S[4]){
 S[4].strategy='UNION y JOIN ejecutables · conservar filas conscientemente';
 S[4].tasks=[
  SQL('UNION elimina repetidos','Combina first_name de actor y customer en una sola columna name; elimina repetidos, ordena y muestra 10.','SELECT first_name AS name FROM actor UNION SELECT first_name AS name FROM customer ORDER BY name ASC LIMIT 10;',['UNION exige el mismo número de columnas compatibles en ambos SELECT.']),
  SQL('UNION ALL conserva repeticiones','Repite el ejercicio anterior conservando todos los registros con UNION ALL.','SELECT first_name AS name FROM actor UNION ALL SELECT first_name AS name FROM customer ORDER BY name ASC LIMIT 10;',['UNION ALL no elimina duplicados.']),
  SQL('INNER JOIN película–idioma','Devuelve 8 películas con title y language.','SELECT f.title, l.name AS language FROM film f INNER JOIN language l ON l.language_id = f.language_id ORDER BY f.title ASC LIMIT 8;',['ON declara cómo coinciden las filas.']),
  SQL('JOIN N:M película–categoría','Devuelve 8 películas con title y category usando film_category como tabla puente.','SELECT f.title, c.name AS category FROM film f JOIN film_category fc ON fc.film_id=f.film_id JOIN category c ON c.category_id=fc.category_id ORDER BY f.title ASC LIMIT 8;',['Una relación N:M necesita atravesar la tabla puente.']),
  SQL('LEFT JOIN conserva películas','Devuelve film_id y title de películas que no tienen inventario.','SELECT f.film_id, f.title FROM film f LEFT JOIN inventory i ON i.film_id=f.film_id WHERE i.inventory_id IS NULL ORDER BY f.film_id ASC;',['LEFT JOIN conserva todas las filas de film; NULL del lado derecho revela faltantes.']),
  C('RIGHT JOIN: ¿qué lado se conserva?','Clasifica qué afirmaciones describen RIGHT JOIN.',['Correcta','Incorrecta'],['conserva todas las filas de la tabla escrita a la derecha','es equivalente a intercambiar tablas y usar LEFT JOIN','conserva siempre únicamente las coincidencias','el lado derecho puede aparecer aunque no encuentre pareja'],['Correcta','Correcta','Incorrecta','Correcta'],'RIGHT JOIN conserva el lado derecho y completa con NULL cuando falta pareja.'),
  C('FULL OUTER JOIN: qué devuelve','Clasifica las afirmaciones.',['Correcta','Incorrecta'],['incluye coincidencias','incluye filas sin pareja del lado izquierdo','incluye filas sin pareja del lado derecho','descarta toda fila no coincidente'],['Correcta','Correcta','Correcta','Incorrecta'],'FULL OUTER JOIN conserva ambos lados; las ausencias se representan con NULL.'),
  SQL('LEFT JOIN y conteo','Cuenta copias de inventario por película. Devuelve film_id, title y copies para las primeras 10 películas.','SELECT f.film_id, f.title, COUNT(i.inventory_id) AS copies FROM film f LEFT JOIN inventory i ON i.film_id=f.film_id GROUP BY f.film_id, f.title ORDER BY f.film_id ASC LIMIT 10;',['COUNT(columna_del_lado_derecho) produce 0 cuando no existe coincidencia.']),
  SQL('JOIN y agregación por categoría','Devuelve category y films contando películas por categoría, de mayor a menor.','SELECT c.name AS category, COUNT(*) AS films FROM category c JOIN film_category fc ON fc.category_id=c.category_id GROUP BY c.category_id,c.name ORDER BY films DESC, category ASC;',['GROUP BY viene de S3 y aquí se combina con JOIN.']),
  SQL('Integración N:M actor–película','Devuelve 10 filas con first_name, last_name y title uniendo actor, film_actor y film.','SELECT a.first_name, a.last_name, f.title FROM actor a JOIN film_actor fa ON fa.actor_id=a.actor_id JOIN film f ON f.film_id=fa.film_id ORDER BY a.actor_id ASC, f.title ASC LIMIT 10;',['Declara una condición ON por cada salto entre tablas.'])
 ];
}

/* S5 · CTE, grano, COALESCE, COUNT DISTINCT y CASE. Una subconsulta derivada
   no aparece en la presentación; el mismo objetivo se practica con una CTE nombrada. */
if(S[5]){
 S[5].tasks[7]=SQL('CTE para resumir antes de filtrar','Crea una CTE totals con total_paid por customer_id y cuenta cuántos clientes superan 100. Alias customers_over_100.','WITH totals AS (SELECT customer_id, SUM(amount) AS total_paid FROM payment GROUP BY customer_id) SELECT COUNT(*) AS customers_over_100 FROM totals WHERE total_paid > 100;',['Primero construye una fila por cliente; luego consulta ese resultado con nombre.']);
}

/* S11 · la presentación explica “precio congelado” y “referencia viva”, no introduce
   la palabra snapshot como requisito. Se usa el vocabulario que vio el estudiante. */
if(S[11]){
 S[11].tasks[4]=C('Copia histórica o referencia viva','Decide cómo conviene conservar cada dato.',['Copia histórica','Referencia viva'],['precio_unitario de una venta ya confirmada','nombre actual de una categoría del catálogo'],['Copia histórica','Referencia viva'],'Lo acordado en una venta no debe cambiar si mañana cambia el catálogo; los datos maestros actuales sí pueden consultarse por referencia.');
}

/* S12 · surrogate key/SCD no se enseña en esta presentación. Se reemplaza por
   batch/streaming/OLTP en vivo, contraste que sí se trabaja explícitamente. */
if(S[12]){
 S[12].tasks[6]=C('Batch, streaming u OLTP en vivo','Elige el mecanismo que corresponde mejor a cada necesidad.',['Batch','Streaming','OLTP en vivo'],['cargar las ventas cerradas al warehouse cada madrugada','enviar cada pedido cerrado al pipeline casi en tiempo real','mostrar cuántas mesas están ocupadas ahora mismo'],['Batch','Streaming','OLTP en vivo'],'Batch tolera espera; streaming alimenta continuamente; una pregunta operacional de “ahora mismo” se responde en el OLTP.');
}

window.ANDES_LAB_CONTENT.version='4.4.0-curriculum';
})();
