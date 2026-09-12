# Integración benchmark pedagógico en `revision/Presentaciones`

Fecha: 2026-09-12

## Alcance

La carpeta `revision/Presentaciones/` funciona como entorno de comparación frente a `Presentaciones/`. Se integran selectivamente las mejoras del snapshot pedagógico `760bfb24952ad153dc6bc4454290116ac7047b0a`, conservando las versiones posteriores de S9 y S13–S16 cuando son más completas para principiantes o técnicamente más actuales.

## Presentaciones actualizadas desde el benchmark

- S2: hilo conductor + checkpoint independiente `Predice → ejecuta → explica`.
- S3: hilo conductor + checkpoint filas vs grupos / WHERE vs HAVING.
- S4: hilo conductor + NULL tras LEFT JOIN + razonamiento de grano + selección de JOIN + mapa relacional.
- S5: hilo conductor + Método ANDESDB + corrección conceptual de CTE + VIEW como extensión.
- S6: se concentra en reglas/evidencia; se retira del núcleo el bloque OLTP/OLAP/lago/bodega/ETL-ELT y se añade `DEFAULT ≠ constraint`.
- S8: supuesto mesero–mesa explícito + transferencia + criterio de salida.
- S10: rúbrica de decisión SQL/NoSQL basada en acceso, consistencia, forma/evolución y costo/riesgo.
- S11: estado transitorio persistido, contingencia explícita y razonamiento de atomicidad.

## Presentaciones conservadas deliberadamente

- S1: se conserva la versión de 14 diapositivas ya existente en `revision`, más completa que el benchmark temprano.
- S7: ya coincide con la versión benchmark mejorada.
- S9: se conserva la versión visual y guiada de Supabase para principiantes; el benchmark puro acortaba demasiado el onboarding. Se mantiene `tutorial-supabase.html` como apoyo.
- S12: se conserva la versión actual por ahora para evitar reintroducir referencias históricas inconsistentes hacia S6; requiere una edición quirúrgica posterior si se quiere incorporar su Reasoning Check sin perder el hilo actualizado.
- S13: se conserva la versión posterior con BigQuery real, partición, clustering, pruning, bytes procesados y laboratorios Google Skills.
- S14: ya incorpora escalera de cuatro niveles, laboratorio oficial, proyecto integrador y transferencia Azure sin duplicación.
- S15: ya contiene caso final reproducible con `casos.csv`, `eventos.csv`, `evidencias.json`, controles conocidos, pruebas negativas y rúbrica.
- S16: ya contiene 13 escenarios DP-900 distribuidos por dominios, clasificación de errores y plan individual.

## Herramientas pedagógicas adicionales activas

- `revision/assets/learning/learning-core.js`
- `revision/assets/learning/learning-plan.json`
- `revision/assets/learning/dp900-map.json`
- `revision/assets/learning/analytics-fallback-link.js`
- tutorial visual de Supabase
- laboratorios SQL embebidos/contingencias locales según sesión
- Google Skills / BigQuery Sandbox / DuckDB-Wasm como rutas principal, alternativa y contingencia en M5

## Regla de diseño adoptada

`hereda → pregunta → evidencia → limitación → siguiente sesión`

Mecanismos de aprendizaje recurrentes:

1. `Predice → ejecuta → explica`.
2. Reasoning Check cuando el código puede ejecutar pero la lógica ser incorrecta.
3. Declaración explícita del grano antes de JOIN/agregación/UNNEST.
4. Validación independiente del resultado.
5. Evidencia concreta por sesión.
6. Transferencia a un caso nuevo antes de cerrar.
