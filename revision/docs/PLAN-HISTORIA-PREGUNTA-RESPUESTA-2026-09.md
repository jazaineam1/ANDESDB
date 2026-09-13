# ANDESDB · plan pedagógico historia → pregunta → respuesta

## Regla no negociable

Toda intervención se evalúa en este orden:

1. **Diapositiva:** plantea una necesidad o pregunta, permite pensar y deja una respuesta explícita o verificable.
2. **Presentación:** cada bloque responde algo y abre la pregunta que justifica el bloque siguiente.
3. **Curso:** cada sesión responde la pregunta heredada y deja abierta la siguiente.

Una pregunta no puede quedar como decoración. Puede responderse en la misma diapositiva, mediante feedback después del intento o en el cierre explícito de la secuencia, pero el estudiante debe poder identificar **cuál fue la respuesta**.

## Clasificación y estado de las ediciones

| Propuesta | Estado | Estado actual |
|---|---|---|
| Problema antes que definición | **OBLIGATORIA** | Implementada transversalmente; reforzada en S3, S6, S7, S10 y S11. |
| Predicción antes de ejecución | **OBLIGATORIA** | Activa en SQL, JOIN, BigQuery y UNNEST. |
| Intento antes de solución | **OBLIGATORIA** | S8 bloquea referencia; S15 libera controles después del primer intento; S16 exige confianza antes de revelar. |
| Guiado → independiente → transferencia | **OBLIGATORIA** | Criterio de autoría y cierre de sesión. |
| Dominar / Reconocer / Mapa | **OBLIGATORIA en sesiones cargadas** | S10, S12, S13, S14 y S16. |
| Cada pregunta debe tener respuesta | **OBLIGATORIA** | `presentation-story-v2-patch.js` cierra la pregunta central S1–S16 y las preguntas narrativas añadidas. |
| Etiquetar cada slide siempre | **POSIBLE** | Se evita sobre-etiquetar: chips consecutivos repetidos se ocultan. |
| S1 · valor antes de teoría | **OBLIGATORIA** | Implementada; roles se leen como responsabilidades frente a un incidente. |
| S1 · más teoría/herramientas | **NO NECESARIA** | No añadida. |
| S2 · primer SQL temprano | **OBLIGATORIA** | Implementada: recap duplicado fuera, secundarios a apéndice y meta visible de SQL en 25–30 min. |
| S2 · borrar motores/SQLite | **NO NECESARIA** | Se conservan como reconocimiento/preflight. |
| S2 · aclaraciones/Excel/rankings en núcleo | **POSIBLE mover** | Implementado: salen del camino principal y quedan disponibles en apéndice. |
| S3 · operador como respuesta a una pregunta | **OBLIGATORIA** | Implementada para BETWEEN, IN, LIKE, GROUP BY y HAVING. |
| Número exacto de slides | **NO NECESARIA** | No se usa como objetivo pedagógico. |
| S4 · grano antes/después del JOIN | **OBLIGATORIA** | Implementada y respondida explícitamente. |
| RIGHT/FULL al mismo peso que INNER/LEFT | **NO NECESARIA** | Reconocimiento. |
| S5 · pensamiento tabular | **OBLIGATORIA** | Implementada; “algorítmica de tablas” queda como subtítulo propio. |
| S6 · evidencia antes de taxonomía | **OBLIGATORIA** | Implementada. |
| Rehacer S6 completa | **NO NECESARIA** | No se reconstruye. |
| S7 · regla → estructura trazable | **OBLIGATORIA** | Implementada; contraejemplo explícito a “sustantivo = entidad”. |
| S8 · referencia después del intento | **OBLIGATORIA** | Implementada. |
| S8 · anomalía → dependencia → descomposición → reconstrucción | **OBLIGATORIA** | Gramática central de normalización. |
| S9 · regla → violación → constraint → reintento | **OBLIGATORIA** | Implementada. |
| S9 · tutorial Supabase fuera del núcleo | **POSIBLE / recomendada** | Implementada como preclase/operación y con botón “ya tengo Supabase listo” para saltar al núcleo de reglas y DDL. |
| S10 · caso → requisitos → familia | **OBLIGATORIA** | Implementada. |
| Catálogo exhaustivo NoSQL | **NO NECESARIA** | No se amplía. |
| S11 · embed/reference por acceso y cambio | **OBLIGATORIA** | Implementada. |
| Tres cursos Firestore/Mongo/Cosmos | **NO NECESARIA** | No se duplica. |
| S12 · DOMINAR/RECONOCER/MAPA | **OBLIGATORIA** | Implementada. |
| S12 · 368k vs 184k como misterio temprano | **POSIBLE / muy recomendada** | Implementada: aparece antes de definiciones y se responde después del grano/JOIN. |
| Más cloud en S12 | **NO NECESARIA** | No se añade. |
| S13 · mismo resultado, bytes distintos | **OBLIGATORIA** | Implementada. |
| S13 · preflight/acceso fuera del núcleo | **POSIBLE / recomendada** | Implementada: acceso, preflight y precisión secundaria pasan a apéndice; bytes procesados queda inmediatamente después del primer laboratorio. |
| S14 · significado antes de ARRAY/STRUCT | **OBLIGATORIA** | Implementada. |
| S14 · Azure por necesidad, no catálogo | **POSIBLE / recomendada** | Implementada: el mapa queda oculto hasta que el estudiante decida primero por necesidad/familia. |
| Ampliar proyecto dentro de S14 | **NO NECESARIA** | S15 conserva protagonismo. |
| S15 · controles progresivos | **OBLIGATORIA** | Implementada de verdad: al inicio solo 12 casos y 24 eventos; los demás controles se liberan después de una primera versión. |
| S15 · arquitectura neutral | **OBLIGATORIA** | Implementada. |
| S15 · requisito sorpresa | **OBLIGATORIA** | Implementada: reapertura histórica del caso. |
| S15 · alternativa descartada | **POSIBLE / recomendada** | Implementada. |
| S16 · respuestas después del intento | **OBLIGATORIA** | Implementada; exige confianza 1–3 antes de revelar. |
| S16 · escenarios con distractores | **POSIBLE / recomendada** | Implementada como modo reto: carga → forma → requisito → familia → servicio; después clasifica error y señal ignorada. |
| Blueprint DP-900 como núcleo | **NO NECESARIA** | Permanece como MAPA. |
| Predice → Ejecuta → Observa → Explica → Corrige → Transfiere | **OBLIGATORIA como gramática** | Criterio transversal. |
| MCQ ≤ 50% | **OBLIGATORIA** | Cumplida. |
| MCQ 25–35% | **POSIBLE como guía, no cuota** | No se fuerza: una cuota no puede desplazar SQL/modelado/explicación de mayor valor. |

## Cierre del laboratorio

La experiencia de laboratorio ahora tiene un cierre explícito:

- en la práctica 10 aparece **Finalizar laboratorio ✓**;
- permanece deshabilitado hasta tener 10/10;
- al completar la décima práctica la barra y el botón dan feedback visual;
- se muestra una animación accesible de finalización con check y confeti CSS;
- el mensaje distingue **todo sincronizado** de **avance guardado con sincronización pendiente**;
- quedan disponibles **Volver al curso** y **Seguir revisando**;
- la celebración automática ocurre una vez por usuario/sesión, pero el botón permite volver a abrir el cierre;
- `prefers-reduced-motion` elimina las animaciones para quien lo necesite.

La finalización no depende de que la red termine primero: 10/10 puede reconocerse con progreso local y luego actualizar el estado de sincronización.

## QA de autoría

Antes de aceptar una slide nueva:

1. ¿Qué pregunta o necesidad abre?
2. ¿Dónde obtiene el estudiante la respuesta?
3. ¿Qué pregunta deja abierta para justificar lo siguiente?

`tools/auditar_preguntas.py` revisa el contrato narrativo. El workflow principal valida además sintaxis de las capas de historia, S15, S9, runtime y cierre del laboratorio.

## Reevaluación tras aplicar las mejoras posibles

| Dimensión | Antes del rediseño | Estado actual |
|---|---:|---:|
| Hilo del curso | 9.1 | **9.8** |
| Hilo dentro de las presentaciones | 8.9 | **9.8** |
| Pregunta → respuesta explícita | 8.5 | **9.7** |
| Problema antes de definición | 9.0 | **9.6** |
| Esfuerzo antes de solución | 9.3 | **9.7** |
| Jerarquía cognitiva | 8.6 | **9.6** |
| Transferencia entre sesiones | 9.2 | **9.8** |
| S2 · tiempo hasta acción real | 8.2 | **9.4** |
| S12 · misterio → grano → respuesta | 8.8 | **9.7** |
| S13 · correctitud → eficiencia observable | 9.0 | **9.7** |
| S15 · evaluación auténtica | 8.9 | **9.8** |
| S16 · transferencia y metacognición | 8.9 | **9.7** |
| Cierre perceptible del laboratorio | 7.5 | **9.8** |

No se declara 10/10: el siguiente nivel ya no consiste en agregar otra capa, sino en observar clases reales, medir tiempo efectivo por bloque, probar móvil y accesibilidad en dispositivos y ajustar únicamente aquello que la evidencia de uso muestre como fricción.