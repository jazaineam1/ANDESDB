# Auditoría presentación ↔ laboratorio · ANDESDB

Fecha: 13 de septiembre de 2026

## Regla curricular

Una práctica de la sesión `N` puede evaluar:

1. conceptos enseñados de forma efectiva en la presentación de `N`;
2. conceptos de sesiones anteriores recuperados explícitamente;
3. transferencia del mismo razonamiento a un caso nuevo, siempre que no introduzca sintaxis o vocabulario técnico no explicado.

Una mención en «próxima sesión» no cuenta como enseñanza. Un laboratorio tampoco debe exigir un término técnico nuevo cuando la presentación explicó la idea con otro vocabulario.

## Resultado de las 16 sesiones

| Sesión | Núcleo contrastado con la presentación | Resultado / corrección |
|---|---|---|
| S1 | valor del dato, archivo vs base, forma estructurada/semiestructurada/no estructurada, roles, ciclo de vida, diagnóstico, herramientas | **Corregida completa.** Se retiraron OLTP/OLAP, grano y SQL, que aún no se habían enseñado. Las 10 prácticas quedaron dentro del alcance real de S1. |
| S2 | SELECT/FROM, WHERE, AND/OR/NOT, DISTINCT, COUNT, ORDER BY, LIMIT | **Corregida.** `BETWEEN`, `IN` y `LIKE` aparecían solo como anticipo de S3 y estaban siendo evaluados antes de tiempo. Se reemplazaron por WHERE numérico, OR y COUNT + WHERE. |
| S3 | tipos, BETWEEN, IN, LIKE, NULL/IS NULL, agregaciones, GROUP BY, HAVING | **Corregida.** Se retiró `COUNT(DISTINCT ...)`, que se trabaja explícitamente después. Se añadió una práctica de `IS NULL`, contenido sí enseñado en S3. |
| S4 | UNION, UNION ALL, INNER/LEFT/RIGHT/FULL OUTER JOIN, tablas puente, combinación con agregaciones previas | **Rebalanceada.** El laboratorio anterior practicaba joins pero casi no ejercitaba UNION/UNION ALL. Se reconstruyeron las 10 prácticas para cubrir el núcleo completo de la sesión. |
| S5 | grano, servilleta, WITH/CTE, resumir antes de unir, COALESCE, COUNT(DISTINCT), CASE | **Corregida.** Se retiró una subconsulta derivada no enseñada y se resolvió el mismo objetivo con una CTE nombrada, coherente con la clase. |
| S6 | evidencia, restricción, permiso, patrón, hipótesis; restricciones del esquema | **Alineada.** No se detectó requisito nuevo fuera del alcance. |
| S7 | entidades, relaciones, cardinalidad, N:M y entidad asociativa | **Alineada.** Las prácticas corresponden al modelado trabajado. |
| S8 | 1FN, 2FN, 3FN, dependencias, descomposición y reconstrucción | **Alineada.** Se conserva transferencia de conceptos previos, sin adelantar DDL. |
| S9 | CREATE TABLE PostgreSQL, SERIAL/IDENTITY, NOT NULL, CHECK, DEFAULT, FK, UNIQUE y PK compuesta | **Alineada.** La sintaxis corresponde a PostgreSQL/Supabase y evita `AUTO_INCREMENT`. |
| S10 | decisión SQL/NoSQL por patrón de acceso y consistencia; relacional, documentos, grafo, series de tiempo, CAP conceptual | **Alineada.** No se evalúa un motor por moda sino la decisión arquitectónica enseñada. |
| S11 | documentos JSON, arreglos, embeber/referenciar, carrito→venta, precio congelado, frontera del agregado | **Corregida en vocabulario.** Se retiró `snapshot` como requisito pedagógico y se usa «copia histórica / precio congelado», que es el lenguaje de la presentación. |
| S12 | OLTP vs analítica, grano, hechos, dimensiones, medidas, ETL/ELT, batch/streaming, estrella | **Corregida.** Se retiró `surrogate key/SCD`, que no se enseña en S12. Se reemplazó por batch/streaming/OLTP en vivo, contraste sí explicado. |
| S13 | BigQuery real: partición, clustering, bytes procesados, filtros y costo | **Alineada con capa específica.** Las prácticas usan el dataset y los controles reales definidos para la sesión. |
| S14 | ARRAY, STRUCT, UNNEST, cambio de grano, JSON/Parquet y transferencia de arquitectura | **Alineada con capa específica.** Se conserva práctica ejecutable y razonamiento sobre estructuras anidadas. |
| S15 | reto integrador con `casos.csv`, `eventos.csv`, `evidencias.json`, modelado, restricciones y consultas | **Alineada con los materiales reales.** No se introduce una receta externa al reto. |
| S16 | recuperación DP-900 y transferencia a Azure: Azure SQL, Cosmos DB, Fabric/Synapse y decisiones de carga | **Alineada.** Las prácticas evalúan reconocimiento y transferencia, no operación de servicios no usados. |

## Protección automática

`revision/tools/auditar_laboratorios_curriculo.mjs` construye el estado efectivo de los 16 laboratorios después de aplicar sus capas y valida las 160 prácticas. Protege tanto la ausencia de adelantos conocidos como una cobertura mínima del núcleo de cada sesión.

La capa `revision/assets/learning/lab-curriculum-v1.js` contiene las correcciones curriculares. Se carga antes del render final del laboratorio y forma parte del caché PWA.

## Decisión de diseño

El objetivo del laboratorio no es «cubrir más contenido» que la clase. Es convertir en evidencia lo que ya se enseñó: ejecutar, clasificar, ordenar, explicar o transferir. Cuando una práctica necesita un concepto posterior, se mueve o se reemplaza; no se arregla añadiendo una pista que enseñe el concepto por primera vez dentro de la evaluación.
