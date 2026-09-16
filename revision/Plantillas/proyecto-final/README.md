# Sesión 15 · Workbench integral de datos v6

La herramienta principal es [`/ANDESDB/evaluador-s15.html`](/ANDESDB/evaluador-s15.html).

S15 integra lo trabajado desde S2 hasta S14. No es un cuestionario ni una entrega para corrección manual: cada estudiante construye, prueba, repara y finalmente transfiere la solución a un caso nuevo.

## Ruta

1. **SQL Arena** — filtros, agregación, JOIN, CTE y control de grano.
2. **Modelo ER + 3FN** — entidades, PK/FK, cardinalidad y normalización.
3. **DDL Mutation Lab** — constraints y diseño de pruebas negativas.
4. **Document Lab** — embeber/referenciar según acceso, crecimiento y ciclo de vida.
5. **Warehouse Builder** — OLTP/OLAP, hecho, dimensiones, batch, streaming y ELT.
6. **BigQuery Physical** — partition, clustering, pruning y lectura conceptual.
7. **Nested BigQuery** — ARRAY, STRUCT, UNNEST, JSON y Parquet.
8. **Boss Transfer** — pedidos omnicanal con un dominio nuevo y pruebas ocultas.

## Nota

- dominio corregible: **80 puntos**;
- transferencia inédita: **20 puntos**;
- total: **100 puntos**.

La calificación registrada se recalcula en servidor. El navegador sirve como entorno de entrenamiento y feedback; el backend vuelve a ejecutar DDL/SQL y valida el resto de decisiones con reglas independientes.

## Datos de entrenamiento

- [`Datos/casos.csv`](Datos/casos.csv): snapshot operacional.
- [`Datos/eventos.csv`](Datos/eventos.csv): historia 1:N.
- [`Datos/evidencias.json`](Datos/evidencias.json): documentos con evidencias anidadas.
- [`criterios.md`](criterios.md): contrato completo de evaluación.

El Boss usa otro dominio y el servidor mantiene escenarios adicionales no publicados.
