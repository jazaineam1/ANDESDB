# Revisión pedagógica ANDESDB · historia primero

## Premisa no negociable

La unidad de diseño no es la diapositiva aislada. Es la **historia completa** en tres escalas:

1. **Dentro de la diapositiva:** problema/pregunta → evidencia → idea → acción.
2. **Dentro de la sesión:** recuperar → problematizar → predecir/intentar → explicar → practicar → validar → transferir → cerrar.
3. **Dentro del curso:** dato → consulta → resumen → unión → grano → regla → modelo → normalización → restricción → decisión tecnológica → documentos → analítica → eficiencia → jerarquía → transferencia → cierre.

Una mejora que agregue exactitud pero rompa esa cadena no se implementa automáticamente. La secuencia narrativa tiene prioridad sobre la cantidad de contenido.

## Clasificación de las propuestas

| Área | Estado | Decisión |
|---|---|---|
| Problema antes que definición | **OBLIGATORIA** | La definición debe responder a una necesidad ya visible. |
| Predicción antes de ejecutar | **OBLIGATORIA** | Especialmente SQL, JOIN, normalización, BigQuery y UNNEST. |
| Intento antes de solución | **OBLIGATORIA** | Crítica en S8 y S16. |
| Guiado una vez, independiente después | **OBLIGATORIA** | Cada bloque debe reducir andamiaje. |
| Dominar / Reconocer / Mapa | **OBLIGATORIA en sesiones sobrecargadas** | S10, S12, S13, S14 y S16. En sesiones simples puede omitirse. |
| Caso de transferencia al cierre | **OBLIGATORIA** | Debe comprobar el principio en un contexto ligeramente distinto. |
| Aplicar exactamente la misma plantilla a todas las slides | **NO NECESARIA** | La gramática narrativa es común; no todas las slides necesitan todos los pasos. |
| S1: problema de valor antes de teoría | **OBLIGATORIA** | Mantener diagnóstico auténtico y convertir roles en responsabilidades frente a un incidente. |
| S1: más teoría de tipos/herramientas | **NO NECESARIA** | No mejora la historia; operación va a preflight. |
| S2: llegar antes a la primera consulta | **OBLIGATORIA** | El momento “escribí SQL y respondió el motor” debe ocurrir pronto. |
| S2: borrar totalmente motores/SQLite/arquitectura | **NO NECESARIA** | Son útiles como reconocimiento si no retrasan la acción principal. |
| S3: operador desde una pregunta, no desde sintaxis | **OBLIGATORIA** | BETWEEN/IN/LIKE/GROUP BY/HAVING deben aparecer porque resuelven una necesidad. |
| S3: exactamente 16 slides propuestas | **POSIBLE** | El número exacto no es objetivo pedagógico. |
| S4: preguntar el grano antes/después del JOIN | **OBLIGATORIA** | Es el puente hacia S5, S8 y S12. |
| S4: RIGHT/FULL al mismo nivel que INNER/LEFT | **NO NECESARIA** | Reconocimiento salvo necesidad del caso. |
| S5: convertir “más SQL” en pensamiento tabular | **OBLIGATORIA** | Construir la tabla objetivo y controlar el grano. |
| S5: renombrar visible a “Pensamiento tabular” | **POSIBLE / recomendada** | Facilita transferencia; “algorítmica de tablas” puede quedar como subtítulo. |
| S6: evidencia antes que taxonomía | **OBLIGATORIA como secuencia** | La versión actual ya está cerca; no necesita reconstrucción total. |
| S6: rehacer completa la sesión | **NO NECESARIA** | El hilo central ya es sólido. |
| S7: trazabilidad regla → relación/cardinalidad | **OBLIGATORIA** | Una relación sin regla explícita no es defendible. |
| S7: sustantivo = entidad como regla | **NO NECESARIA / evitar** | Solo heurística inicial; necesita contraejemplo. |
| S8: ocultar referencia hasta después del intento | **OBLIGATORIA** | Mayor retorno pedagógico del curso. |
| S8: anomalía → dependencia → descomposición → reconstrucción | **OBLIGATORIA** | Importa más que memorizar 1FN→2FN→3FN. |
| S9: regla → intento inválido → constraint → reintento | **OBLIGATORIA** | La restricción debe responder a un problema observable. |
| S9: tutorial largo de Supabase dentro del núcleo | **POSIBLE mover a preflight** | Debe existir, pero no competir con constraints. |
| S10: caso → requisitos → familia | **OBLIGATORIA** | Refuerzo, no reconstrucción total. |
| S10: catálogo exhaustivo de NoSQL | **NO NECESARIA** | Reconocer familias sí; memorizar catálogo no. |
| S11: embed/reference desde patrón de acceso y cambio | **OBLIGATORIA** | Culmina en fuente de verdad y fallo parcial. |
| S11: enseñar Mongo/Firestore/Cosmos como tres clases | **NO NECESARIA** | Una implementación profunda + transferencia es suficiente. |
| S12: jerarquía Dominar/Reconocer/Mapa | **OBLIGATORIA** | Reduce sobrecarga sin quitar contenido. |
| S12: 368k vs 184k como misterio conductor | **POSIBLE / muy recomendada** | Conviene aparecer temprano si el orden lo permite. |
| S12: añadir más cloud | **NO NECESARIA** | El valor central es grano + suma correcta. |
| S13: misma respuesta, bytes distintos | **OBLIGATORIA como pregunta de entrada** | Conecta S12 correctitud → S13 eficiencia. |
| S13: preflight BigQuery en el centro conceptual | **POSIBLE mover** | Mejor como preparación/apéndice si el grupo ya accede. |
| S14: significado JSON antes de ARRAY/STRUCT | **OBLIGATORIA** | Sintaxis después de comprender forma y acceso. |
| S14: ampliar todavía más el proyecto integrador | **NO NECESARIA** | S15 debe conservar protagonismo. |
| S15: liberar controles progresivamente | **OBLIGATORIA** | Evita construir para copiar números. |
| S15: cambio inesperado de requisito | **OBLIGATORIA** | Mide adaptación real. |
| S15: arquitectura neutral antes del intento | **POSIBLE / recomendada** | Ya implementada: no se sugiere una arquitectura “bonita”. |
| S15: rúbrica visible antes del trabajo autónomo | **POSIBLE / recomendada** | Ya implementada como anticipo de criterios, sin revelar solución. |
| S16: respuestas no disponibles inmediatamente | **OBLIGATORIA** | Intento + confianza antes de feedback. |
| S16: subir dificultad de algunos escenarios | **POSIBLE** | Útil después de corregir el mecanismo de feedback. |
| S16: blueprint porcentual como núcleo | **NO NECESARIA** | Mapa/referencia, no historia central. |
| Predice→Ejecuta→Observa→Explica→Corrige→Transfiere | **OBLIGATORIA como gramática** | Puede ocurrir dentro de un bloque; no exige seis slides. |
| Selección múltiple máximo 50% | **OBLIGATORIA como límite** | No superar. |
| Apuntar exactamente a 25–35% MCQ | **POSIBLE** | Guía, no cuota. La modalidad responde al objetivo cognitivo. |
| Badges de función narrativa y prioridad | **POSIBLE / útil** | Útiles si son discretos y no compiten visualmente con la slide. |
| Rankings, troubleshooting y catálogos a apéndice | **POSIBLE** | Aplicar cuando interrumpen la pregunta de la sesión. |

## Implementación realizada

Se añadió una capa narrativa transversal sin duplicar teoría:

- **Curso:** el hub muestra la cadena completa y la pregunta que mueve cada una de las 16 sesiones.
- **Presentaciones:** cada sesión declara su pregunta central y, cuando existe hilo/puente, muestra `Venimos de → Pregunta de hoy → Esto abre`.
- **Slides:** etiquetas discretas HILO / PREDICE / EXPLICA / PRACTICA / VALIDA / TRANSFIERE / CIERRE hacen visible la función narrativa.
- **Jerarquía:** S10, S12, S13, S14 y S16 distinguen DOMINAR / RECONOCER / MAPA cuando aplica.
- **S4:** pregunta obligatoria sobre el grano antes/después del JOIN.
- **S5:** “Pensamiento tabular” se prioriza como nombre transferible; “algorítmica de tablas” queda como lenguaje propio del curso.
- **S8:** las referencias quedan cubiertas hasta que el estudiante declare haber realizado su intento.
- **S9:** constraints reforzados con regla → violación → restricción → reintento.
- **S10:** caso antes del nombre de la familia tecnológica.
- **S13:** entrada explícita con “mismo resultado, bytes muy distintos”.
- **S14:** documento significativo antes de ARRAY/STRUCT/UNNEST.
- **S15:** controles completos se liberan después de la primera versión; arquitectura neutral; alternativa descartada obligatoria; criterios de rúbrica visibles antes del trabajo autónomo; cambio inesperado de requisito durante el reto.
- **S16:** respuestas ocultas hasta que el estudiante indique que respondió y registre confianza 1–3.

## Reevaluación después de los cambios

| Escala | Antes | Después | Lectura |
|---|---:|---:|---|
| Historia del curso | 9.1 | **9.7** | La cadena S1→S16 y la pregunta de cada sesión son visibles, no implícitas. |
| Historia dentro de cada presentación | 8.9 | **9.5** | Se fortalecen puentes y jerarquía; S8, S15 y S16 corrigen riesgos importantes. |
| Historia dentro de la diapositiva | 8.7 | **9.2** | Mejor orientación y función, pero algunas slides aún necesitan edición física para convertir información pasiva en problema/predicción. |
| Evaluación auténtica | 8.9 | **9.6** | Intento antes de referencia, controles progresivos, cambio de requisito y feedback diferido. |
| Gestión de carga cognitiva | 8.6 | **9.4** | DOMINAR/RECONOCER/MAPA evita que todo parezca tener igual peso. |

### Intervenciones estructurales que aún valen la pena

1. **S2 — obligatoria pendiente:** comprobar y, si hace falta, reordenar físicamente el deck para que la primera consulta ejecutada ocurra aproximadamente antes de los 25–30 minutos. La guía docente ya indica que motores debe reducirse si consume tiempo; la presentación aún conserva bastante contexto previo.
2. **S3 — posible/alta prioridad:** revisar operador por operador para eliminar secuencias “definición → sintaxis → ejemplo” donde todavía existan.
3. **S11 — posible:** verificar que la transferencia Mongo/Firestore/Cosmos no vuelva a convertirse en catálogo después de haber entendido documentos.
4. **S12 — posible/muy recomendable:** si el misterio 368k vs 184k sigue apareciendo tarde, moverlo físicamente cerca de la apertura; etiquetarlo no sustituye un buen orden.

## Regla para futuras ediciones

Antes de aceptar una nueva diapositiva, responder:

> **¿Qué pregunta de la historia resuelve esta slide y qué pregunta deja abierta?**

Si no se puede responder, la slide debe fusionarse, moverse a apéndice o eliminarse. La exactitud técnica es necesaria; la continuidad narrativa decide dónde vive esa exactitud.