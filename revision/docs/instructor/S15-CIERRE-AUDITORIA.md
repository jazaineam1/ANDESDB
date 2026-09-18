# S15 v7 · Cierre técnico de la auditoría

Estado verificado: 18-sep-2026.

Este documento compara la auditoría original con la implementación vigente de S15 v7. No reemplaza el piloto con personas reales ni el análisis de ítems posterior a la cohorte.

## Resultado técnico

- Suite determinística: **22/22 criterios de aceptación**.
- E2E de interfaz: ejecuta el camino experto sobre la UI real con jsdom + SQL.js y forma parte de CI.
- Sitio público y copia de revisión usan el mismo HTML/JS de S15 v7.
- El grader de servidor recalcula SQL, DDL, modelo, documentos, warehouse, BigQuery, nested y Boss.
- SQL/DDL del servidor usa una variante oculta determinística por estudiante: cambian valores, no reglas ni contratos.
- Boss usa workload estable por estudiante y la clave no está en el contrato público.
- Analítica docente registra primer/mejor intento, checkpoints, discriminación, tiempos, misconceptions y distribución de variantes.

## Matriz de hallazgos

| Hallazgos de la auditoría | Estado v7 | Evidencia de cierre |
|---|---|---|
| F1–F3 · Banco ER, FK y homónimos | Resuelto | zonas `model:*`, PK/FK/cardinalidad explícitas y etiquetas con entidad |
| F4–F6 · DDL regalado, errores invisibles y contrato rígido | Resuelto | starter sin restricciones, errores visibles, INSERT con columnas y soporte de columnas extra |
| F7–F8 · BigQuery con crédito inicial y resultado oculto engañoso | Resuelto | selección exacta; tabla visible siempre corresponde al escenario base |
| F9–F10 · UNNEST por regex y comentarios iniciales | Resuelto | comentarios se eliminan y UNNEST se ejecuta con DuckDB-Wasm |
| F11 · respuestas/estado manipulables | Resuelto para la nota | el servidor recalcula; localStorage no es fuente de verdad; Boss no tiene clave fija pública |
| M1–M5 · oráculo, contratos ocultos, crédito sin mérito y sobreinclusión | Resuelto | modo evaluación, límites de comprobación, contratos visibles, contraejemplos y selección exacta |
| M6 · Boss no mide transferencia | Resuelto | caso de pedidos nuevo, dos hechos, workload variable, nested y mapeo Azure |
| M7 · tiempo empuja a adivinar | Resuelto en la herramienta | S15 no impone cronómetro rígido; tiempos se registran para análisis, no para cortar la resolución |
| M8 · riesgo de subjetividad en razonamiento abierto | Resuelto por diseño determinístico | S15 no asigna puntos a texto libre; las competencias se comprueban con ejecución y opciones cerradas |
| M9 · misma respuesta para todos | Resuelto en evaluación | Boss variable + escenarios SQL ocultos sembrados por estudiante; práctica conserva datos comunes |
| M10–M11 · demanda/cobertura incompleta | Resuelto | diagnóstico dirty, SQL/NoSQL, Cosmos partition key, batch/streaming, Mutation Hunter y migración |
| M12 · política de pistas | Resuelto | política pública; evaluación limita pistas y registra uso |
| C1–C2 · referencia documental y nested desalineado | Resuelto | tres zonas documentales y campos reales de `evidencias.json` |
| C3 · evolución de dominio | Resuelto | migración explícita antes/después |
| C4–C5 · simulador/orden BigQuery | Resuelto | separa estimado previo y procesado posterior; workload visible define prefijo |
| C6 · batch vs streaming | Resuelto | requisitos de latencia explícitos |
| C7 · Mutation Hunter por palabras | Resuelto | prueba diferencial ejecutada contra esquema correcto y mutante |
| C8 · Q1 ambiguo | Resuelto | contrato visible declara población y columnas |

## Qué todavía no puede cerrarse por código

1. **Piloto think-aloud con 3–5 personas reales**, incluyendo al menos una persona en teléfono y una sin experiencia previa. Si aparece un falso positivo, falso negativo o bloqueo esencial, S15 no debe usarse todavía como nota.
2. **Análisis posterior a la primera aplicación.** Hasta que existan intentos v7 no es posible estimar empíricamente dificultad, discriminación, correlación dominio–Boss ni tiempos reales.
3. **Ponderación.** Queda fijada en 80 puntos de dominio + 20 de transferencia. No existe componente subjetivo de justificación o defensa.
4. **Uso de S16.** Solo deben reutilizarse como diagnóstico los checkpoints que, después de la cohorte, no muestren problemas de discriminación, contrato o interfaz.

## Regla de publicación

S15 v7 está técnicamente listo para **piloto**. La condición para declararlo listo para **evaluación oficial** es completar el piloto humano y revisar sus resultados; después de la primera cohorte, la analítica debe revisarse antes de reutilizar S15 como evidencia diagnóstica de S16.
