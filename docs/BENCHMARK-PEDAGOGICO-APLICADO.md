# Benchmark pedagógico aplicado a ANDESDB

Este documento registra **referentes y decisiones de diseño vigentes**. No certifica que una sesión sea correcta ni describe un transformador automático. La aceptación del contenido requiere lectura humana de las presentaciones y CI solo cubre regresiones objetivas.

## Referentes consultados

| Referente | Fuente | Qué tomamos | Qué NO copiamos |
|---|---|---|---|
| SQLBolt | https://sqlbolt.com/ | Conceptos cortos seguidos de ejercicio interactivo; progresión SELECT → filtros → JOIN → agregación → DDL. | No convertimos el curso en ejercicios sintácticos aislados. |
| Data Carpentry · SQL for Ecologists | https://datacarpentry.github.io/sql-ecology-lesson/instructor/instructor-notes.html | Asumir conocimiento inicial bajo, preparar el entorno, anticipar errores y sostener un dataset/contexto durante la práctica. | No heredamos su dominio de ecología ni su herramienta exacta. |
| CS50 SQL | https://cs50.harvard.edu/sql/ | Secuencia consultar → relacionar → diseñar → escribir → optimizar → escalar y uso de artefactos/proyecto final. | ANDESDB no exige el mismo nivel de programación ni replica sus problem sets. |
| CMU 15-445/645 | https://db.cs.cmu.edu/courses/ | Razonamiento sobre trade-offs, explicar decisiones y defender una solución. | No enseñamos internals de DBMS, C++ ni arquitectura de sistemas a ese nivel. |
| Microsoft Learn DP-900 | https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-900 | Mapeo concepto → evidencia del curso → reconocimiento del servicio Azure. | No reorganizamos el diplomado como curso de memorización de productos. |
| Google Cloud · BigQuery | https://docs.cloud.google.com/bigquery/docs/partitioned-tables y https://docs.cloud.google.com/bigquery/docs/clustered-tables | Partición, clustering, pruning, bytes procesados y costo como evidencia observable en S13. | No tratamos BigQuery como simple reemplazo de DuckDB/S12. |

## Prácticas que sobrevivieron a la curación humana

1. **S1** tiene diagnóstico de entrada, cadena dato → decisión, roles y preflight del entorno.
2. **S7** conserva un criterio de salida explícito: no basta con dibujar entidades; el estudiante debe defender de qué regla nació cada decisión.
3. **S13** se centra en partición, clusterización, pruning y evidencia de bytes/costo en BigQuery real.
4. **S14** trabaja ARRAY, STRUCT y UNNEST, declara el cambio de grano y termina con transferencia por requisitos hacia familias Azure.
5. **S15** usa un caso nuevo (incidentes urbanos), datos reproducibles, controles conocidos, pruebas negativas y defensa de code ownership.
6. **S16** repite el pretest de S1, usa escenarios por dominio DP-900 y clasifica errores en concepto, transferencia o lectura.
7. `assets/learning/dp900-map.json` hace explícita la correspondencia objetivo → sesiones → evidencia → nivel (`aprendido`, `transferido`, `reconocido`).
8. `docs/instructor/` existe como vista del docente; su utilidad se revisa por contenido específico de cada sesión, no por cantidad de archivos.

## Decisiones descartadas

Las primeras pasadas automáticas eliminaron o sustituyeron contenido de S6 y S9 y llegaron a corromper texto/SQL mediante reemplazos globales. Esa estrategia quedó descartada. Las sesiones maduras S2–S6, S8–S12 se mantienen byte por byte iguales a `main` en esta rama y el CI comprueba esa condición.

Los scripts de autoedición pedagógica fueron retirados. El workflow de la rama tiene `contents: read`: valida, pero no reescribe ni hace `git push`.

## Criterio de aceptación

Una mejora se conserva solo si cumple las cuatro condiciones:

- **anclaje**: responde a un problema observable de la sesión;
- **transferencia**: obliga a explicar o decidir, no solo repetir sintaxis;
- **evidencia**: deja un resultado verificable;
- **continuidad**: prepara una necesidad real de la sesión siguiente sin introducir contenido por adelantado.

El benchmark es una fuente de ideas. **No es una autoridad que justifique un cambio por sí sola.**
