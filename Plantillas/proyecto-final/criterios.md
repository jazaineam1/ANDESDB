# Sesión 15 · Contrato del Workbench integral v6

La evaluación se realiza en [`/ANDESDB/evaluador-s15.html`](/ANDESDB/evaluador-s15.html). Integra las competencias trabajadas desde S2 hasta S14 y separa **dominio corregible (80 puntos)** de **transferencia inédita (20 puntos)**.

El navegador sirve para practicar y recibir feedback. La nota registrada se recalcula en Supabase: el servidor ejecuta nuevamente el DDL y las consultas SQL sobre escenarios distintos y vuelve a validar las decisiones estructuradas. No confía en booleanos enviados por el cliente.

## Rúbrica · 100 puntos

| Estación | Sesiones integradas | Puntos | Evidencia |
|---|---|---:|---|
| SQL Arena | S2–S5 | 15 | 5 consultas sobre varios escenarios, JOIN/CTE/agregación/grano |
| Modelo ER + 3FN | S6–S8 | 12 | entidades, PK/FK, 1:N y descomposición CASO/EVENTO/AGENTE |
| DDL Mutation Lab | S9 | 10 | constraints ejecutables + Mutation Hunter |
| Document Lab | S10–S11 | 10 | embeber/referenciar por acceso, crecimiento y ciclo de vida |
| Warehouse Builder | S6 + S12 | 13 | OLTP/OLAP, grano del hecho, medidas, dimensiones, batch/streaming/ELT |
| BigQuery Physical | S13 | 10 | partition, orden de clustering, pruning y lectura conceptual |
| Nested BigQuery | S14 | 10 | ARRAY<STRUCT>, UNNEST, JSON y Parquet |
| Boss Transfer | integración | 20 | pedidos omnicanal + pruebas ocultas |

## Qué significa “mastery”

Las primeras siete estaciones pueden corregirse. El feedback SQL progresa por capas: concepto → contraejemplo → bloques tipo Parsons. El objetivo es que el estudiante llegue a una solución correcta **después de razonar y reparar**, no penalizar para siempre el primer error.

## SQL y partial credit

Las cinco consultas trabajan filtros/agregación, último evento temporal, acumulación hasta cierre, control de grano después de JOIN 1:N y promedios a grano caso. Cada consulta se prueba sobre varias variaciones visibles. El servidor conserva un escenario adicional no publicado para medir transferencia.

El conjunto visible incluye un contraejemplo específico para evitar que `MAX(estado)` pase accidentalmente como equivalente de “último estado”.

## Modelo, normalización y DDL

El modelo esperado conserva `CASO 1:N EVENTO`. La normalización separa `AGENTE` para evitar repetir `agente_nombre` en cada evento. El DDL debe rechazar duplicados, huérfanos, `NULL` requeridos y minutos negativos sin convertir los valores observados hoy en un dominio eterno.

Mutation Hunter evalúa una competencia adicional: saber qué prueba mínima revela un esquema defectuoso.

## SQL/NoSQL y documentos

El estudiante decide qué vive dentro del documento de caso y qué debe mantenerse referenciado. Se evalúan propiedades de la decisión: acceso conjunto, crecimiento potencial y ciclo de vida independiente. No se acepta la regla simplista “JSON = NoSQL”.

## Data Warehouse

La estación obliga a separar OLTP de OLAP, declarar el grano del hecho antes de las medidas y construir dimensiones útiles. También evalúa cómo llegan datos nuevos: streaming para eventos, procesos batch para actualizaciones periódicas y ELT para cargar y transformar dentro de la plataforma analítica.

## BigQuery físico

El patrón de consulta acota fechas y filtra frecuentemente barrio y tipo. La evaluación espera una partición alineada con el tiempo y clustering cuyo orden refleje el patrón de filtros. Un simulador conceptual traduce las decisiones a territorio/bloques que podrían evitarse; no pretende reproducir el optimizador real de BigQuery.

## ARRAY, STRUCT, UNNEST y formatos

`evidencias` debe reconocerse como un arreglo de estructuras. La consulta debe cambiar el grano a una fila por evidencia mediante `UNNEST`, conservando la clave raíz. También se evalúa JSON como formato flexible de aterrizaje y Parquet como formato columnar para analítica.

## Boss Transfer · 20 puntos

El dominio cambia a pedidos omnicanal. Debe reconocerse línea de pedido como grano analítico, cantidad e importe como medidas, fecha de pedido como partición y categoría/cliente como patrón de clustering. Además se requiere `UNNEST(p.items)` sin perder `pedido_id`.

El servidor añade dos controles que el navegador no revela: vuelve a probar el DDL y las cinco consultas SQL con datos diferentes. Por eso memorizar el dataset del caso urbano no basta.

## Principios del autograder

- grader server-side como fuente de verdad de la nota;
- tests visibles para entrenamiento y tests ocultos para transferencia;
- partial credit en SQL;
- feedback progresivo y reintentos;
- mutation testing del propio autograder;
- evaluación de propiedades y coherencia, no de una captura idéntica al profesor;
- analítica docente de primer intento, mejor intento y errores recurrentes;
- interacción táctil y drag-and-drop equivalentes.
