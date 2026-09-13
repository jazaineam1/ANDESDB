# ANDESDB · plan pedagógico historia → pregunta → respuesta

## Regla no negociable

Toda intervención se evalúa en este orden:

1. **Diapositiva:** plantea una necesidad o pregunta, permite pensar y deja una respuesta explícita o verificable.
2. **Presentación:** cada bloque responde algo y abre la pregunta que justifica el bloque siguiente.
3. **Curso:** cada sesión responde la pregunta heredada y deja abierta la siguiente.

Una pregunta no puede quedar como decoración. Puede responderse en la misma diapositiva, mediante feedback después del intento o en el cierre explícito de la secuencia, pero el estudiante debe poder identificar **cuál fue la respuesta**.

## Clasificación de las ediciones propuestas

| Propuesta | Estado | Decisión | Implementación |
|---|---|---|---|
| Problema antes que definición | **OBLIGATORIA** | El concepto debe resolver una necesidad ya visible. | Reforzada en la capa narrativa; S3/S6/S7/S10/S11 reciben problema o decisión antes de la receta. |
| Predicción antes de ejecución | **OBLIGATORIA** | SQL, JOIN, BigQuery y UNNEST deben pedir expectativa antes de observar. | Contrato narrativo activo; S3 incorpora pregunta antes de operador. |
| Intento antes de solución | **OBLIGATORIA** | La referencia sirve para comparar, no para copiar. | S8 bloquea la referencia hasta declarar intento; S16 mantiene revelado posterior. |
| Guiado una vez, independiente después | **OBLIGATORIA** | El andamiaje debe disminuir dentro de cada sesión. | Se conserva como criterio de QA; los cierres exigen transferencia. |
| Dominar / Reconocer / Mapa | **OBLIGATORIA en sesiones cargadas** | No todo lo nombrado tiene el mismo peso. | Activa en S10, S12, S13, S14 y S16. |
| Caso distinto al cierre | **OBLIGATORIA** | Debe existir evidencia de transferencia. | Se mantiene como criterio de cierre y el runtime explicita la respuesta de la sesión y la siguiente pregunta. |
| Cada pregunta debe tener respuesta | **OBLIGATORIA** | Pregunta sin cierre = deuda narrativa. | Nueva capa `presentation-story-v2-patch.js`: respuesta de sesión en S1–S16 y respuestas explícitas a preguntas narrativas añadidas. |
| Etiquetar todas las slides con función | **POSIBLE** | Útil, pero puede convertirse en ruido. | Los chips repetidos consecutivos se ocultan; el cambio de función sí queda visible. |
| S1 · abrir con valor antes de teoría | **OBLIGATORIA** | S1 debe dejar la necesidad de almacenar y preguntar. | Se conserva pregunta central y se responde el incidente de roles por responsabilidades. |
| S1 · añadir más teoría/herramientas | **NO NECESARIA** | Compite con la historia. | No se añade. |
| S2 · llegar pronto a la primera consulta | **OBLIGATORIA** | La promesa de S1 debe pagarse pronto. | Prioridad narrativa ya marcada; queda como edición física prioritaria del deck para llevar el primer SQL a 25–30 min. |
| S2 · eliminar completamente motores/SQLite | **NO NECESARIA** | Son reconocimiento útil. | Se mantienen como secundarios/preflight. |
| S2 · eliminar slide “diremos base para todo” | **POSIBLE / recomendada** | Es una aclaración oral, no un hito narrativo. | Pendiente de edición física; no se refuerza en runtime. |
| S2 · fusionar Excel vs BD | **POSIBLE / recomendada** | Reduce tiempo pasivo. | Pendiente de edición física. |
| S3 · operador desde una pregunta | **OBLIGATORIA** | BETWEEN/IN/LIKE/GROUP BY/HAVING deben aparecer como respuesta. | Implementado: preguntas problema + respuesta explícita para los bloques detectados. |
| S3 · exactamente 16 slides | **NO NECESARIA** | El número no es objetivo pedagógico. | No se impone. |
| S4 · grano antes/después del JOIN | **OBLIGATORIA** | Prepara S5, S8 y S12. | Implementado y ahora la pregunta tiene respuesta explícita. |
| S4 · RIGHT/FULL al mismo peso que INNER/LEFT | **NO NECESARIA** | Reconocimiento basta. | No se amplía. |
| S5 · Pensamiento tabular, no “más SQL” | **OBLIGATORIA** | La sesión trata de construir la tabla objetivo. | Implementado en título/capa narrativa. |
| S5 · conservar “algorítmica de tablas” | **POSIBLE** | Puede quedar como lenguaje propio, subordinado al término transferible. | Conservado como subtítulo. |
| S6 · evidencia antes de taxonomía | **OBLIGATORIA** | El estudiante debe comprometerse antes de conocer etiquetas. | Implementado: “nunca vimos X” se pregunta y se responde antes de clasificar. |
| S6 · rehacer toda la sesión | **NO NECESARIA** | Su hilo ya es fuerte. | No se reconstruye. |
| S7 · regla → estructura trazable | **OBLIGATORIA** | Cada decisión de modelo necesita evidencia. | Se conserva; se añade contraejemplo explícito a “sustantivo = entidad”. |
| S7 · sustantivo = entidad como regla | **NO NECESARIA / evitar** | Solo sirve como heurística inicial. | Implementado el contraejemplo con respuesta. |
| S8 · ocultar referencia antes del intento | **OBLIGATORIA** | Es el mayor riesgo de copia. | Implementado. |
| S8 · anomalía → dependencia → descomposición → reconstrucción | **OBLIGATORIA** | Es la historia correcta de normalización. | Criterio narrativo activo; no se promueve memorización aislada de 1FN/2FN/3FN. |
| S9 · regla → violación → constraint → reintento | **OBLIGATORIA** | Constraint debe ser respuesta observable. | Implementado en la capa narrativa. |
| S9 · tutorial largo de Supabase en núcleo | **POSIBLE mover a preflight** | PostgreSQL y reglas son el aprendizaje; botones son operación. | Se conserva como objetivo de edición física, no se elimina el tutorial. |
| S10 · caso → requisitos → familia | **OBLIGATORIA** | Evita catálogo y “NoSQL porque escala”. | Implementado; la pregunta añadida tiene respuesta explícita. |
| S10 · catálogo exhaustivo NoSQL | **NO NECESARIA** | Reconocer familias sí, memorizar catálogo no. | No se amplía. |
| S11 · embed/reference por acceso y cambio | **OBLIGATORIA** | Es la decisión central de documentos. | Implementado: pregunta de decisión + respuesta explícita. |
| S11 · Mongo/Firestore/Cosmos como tres cursos | **NO NECESARIA** | Una experiencia profunda + transferencia es suficiente. | No se duplica contenido. |
| S12 · DOMINAR/RECONOCER/MAPA | **OBLIGATORIA** | Reduce sobrecarga. | Implementado. |
| S12 · 368k vs 184k temprano | **POSIBLE / muy recomendada** | Puede ser el misterio conductor. | Sigue como prioridad de edición física; la respuesta global de sesión ya cierra en grano/suma correcta. |
| S12 · añadir más cloud | **NO NECESARIA** | Compite con grano, hechos y dimensiones. | No se añade. |
| S13 · mismo resultado, bytes distintos | **OBLIGATORIA** | Conecta S12 correctitud → S13 eficiencia. | Implementado y ahora la pregunta tiene respuesta explícita. |
| S13 · acceso/preflight en núcleo | **POSIBLE mover** | Debe apoyar, no conducir. | Pendiente de edición física. |
| S14 · significado antes de ARRAY/STRUCT | **OBLIGATORIA** | Primero modelo mental; después sintaxis. | Implementado y con respuesta explícita a la pregunta del pedido. |
| S14 · ampliar proyecto integrador | **NO NECESARIA** | S15 debe conservar protagonismo. | No se amplía. |
| S15 · controles progresivos | **OBLIGATORIA** | Los números deben validar, no dar la respuesta. | Implementado. |
| S15 · arquitectura neutral | **OBLIGATORIA** | No sembrar la “respuesta bonita”. | Implementado. |
| S15 · requisito sorpresa | **OBLIGATORIA** | Mide adaptación real. | Implementado. |
| S15 · justificar alternativa descartada | **POSIBLE / recomendada** | Mejora defensa arquitectónica. | Integrado en la orientación narrativa/capstone. |
| S16 · respuestas después del intento | **OBLIGATORIA** | Evita autoengaño. | Implementado con revelado posterior y confianza. |
| S16 · escenarios más difíciles | **POSIBLE** | Mejora transferencia, pero después del mecanismo de feedback. | Queda como mejora de contenido, no requisito inmediato. |
| Blueprint DP-900 como núcleo | **NO NECESARIA** | Es mapa, no historia central. | Se mantiene como MAPA/referencia. |
| Predice → Ejecuta → Observa → Explica → Corrige → Transfiere | **OBLIGATORIA como gramática** | No obliga a seis slides distintas. | Se usa como criterio transversal. |
| MCQ ≤ 50% | **OBLIGATORIA** | Evita convertir el laboratorio en quiz. | Se mantiene. |
| Objetivo MCQ 25–35% | **POSIBLE** | Guía, no cuota. | No se impone automáticamente. |
| Rankings, troubleshooting y catálogos a apéndice | **POSIBLE** | Solo cuando interrumpen la pregunta de la sesión. | Se prioriza para S2/S13; no se elimina información útil. |

## Plan de mejora

### P0 · coherencia narrativa y respuesta

- Cerrar la pregunta central de las 16 sesiones con una **Respuesta de la sesión** explícita.
- Cerrar todas las preguntas añadidas por la capa narrativa: S1 roles, S4 grano, S10 decisión, S13 costo, S14 jerarquía.
- Reforzar problema → respuesta en S3, S6, S7 y S11.
- Mantener S8, S15 y S16 con intento antes de solución.
- Evitar que los chips pedagógicos se conviertan en decorado: si el rol no cambia, no se repite visualmente.

### P1 · edición física de decks

- **S2:** reducir 20–25% de la primera mitad y llevar el primer SQL a 25–30 minutos.
- **S2:** fusionar recap/clic, Excel/BD; mover ranking, troubleshooting y apertura de base a preflight/apéndice cuando sea posible.
- **S9:** separar tutorial Supabase del núcleo conceptual.
- **S12:** mover 368k vs 184k antes para que conduzca la explicación.
- **S13:** sacar acceso/preflight del centro y acercar bytes procesados al primer laboratorio.
- **S16:** elevar dificultad de algunos escenarios solo después de conservar la secuencia intento → feedback → clasificación del error.

### P2 · QA de autoría

Antes de aceptar una slide nueva, responder tres preguntas:

1. ¿Qué pregunta/need abre?
2. ¿Dónde obtiene el estudiante la respuesta?
3. ¿Qué pregunta deja abierta para justificar lo siguiente?

Si no hay respuesta a las tres, la slide debe fusionarse, moverse o eliminarse.

## Implementación realizada en esta revisión

Se agregó `assets/learning/presentation-story-v2-patch.js` y se carga después de la capa narrativa existente.

La nueva capa:

- añade una **respuesta de cierre** a la pregunta central de S1–S16;
- explicita la siguiente pregunta para conservar el hilo entre sesiones;
- responde las preguntas narrativas añadidas en S1, S4, S10, S13 y S14;
- convierte bloques de S3 en problema → respuesta en vez de sintaxis aislada;
- añade evidencia antes de taxonomía en S6;
- añade el contraejemplo “sustantivo ≠ entidad” en S7;
- centra S11 en la decisión embed/reference;
- oculta chips pedagógicos consecutivos redundantes;
- marca en el DOM el contrato de respuesta de las preguntas (`feedback`, `same-slide`, `session-close` o `sequence`) para facilitar QA posterior.

El service worker sube a `v41` para que la nueva capa no quede atrapada por caché anterior.

## Reevaluación

| Dimensión | Antes de esta revisión | Después |
|---|---:|---:|
| Hilo del curso | 9.7 | **9.8** |
| Hilo dentro de las presentaciones | 9.5 | **9.7** |
| Pregunta → respuesta explícita | 8.5 | **9.6** |
| Problema antes de definición | 9.0 | **9.4** |
| Esfuerzo antes de solución | 9.3 | **9.6** |
| Jerarquía cognitiva | 9.3 | **9.6** |
| Transferencia entre sesiones | 9.4 | **9.7** |
| Riesgo de sobre-etiquetado | 8.7 | **9.4** |

### Nota final

No se declara 10/10 porque todavía quedan cambios que requieren **editar físicamente** el orden y densidad de algunos decks, especialmente S2, S12 y S13. La capa narrativa corrige el contrato pedagógico, pero no debe usarse para esconder una secuencia física mejorable.
