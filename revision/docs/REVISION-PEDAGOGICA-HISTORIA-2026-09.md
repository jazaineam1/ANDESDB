# Revisión pedagógica ANDESDB · historia primero

## Premisa no negociable

La unidad de diseño no es la diapositiva aislada. Es la **historia completa** en tres escalas:

1. **Dentro de la diapositiva:** problema/pregunta → evidencia → idea → acción.
2. **Dentro de la sesión:** recuperar → problematizar → predecir/intentar → explicar → practicar → validar → transferir → cerrar.
3. **Dentro del curso:** dato → consulta → resumen → unión → grano → regla → modelo → normalización → restricción → decisión tecnológica → documentos → analítica → eficiencia → jerarquía → transferencia → cierre.

Una mejora que agregue exactitud pero rompa esa cadena no se implementa automáticamente.

## Clasificación de las propuestas

| Área | Estado | Decisión |
|---|---|---|
| Problema antes que definición | **OBLIGATORIA** | Debe dominar la apertura conceptual. No significa prohibir toda definición temprana, sino que la definición debe responder a una necesidad ya visible. |
| Predicción antes de ejecutar | **OBLIGATORIA** | Especialmente SQL, JOIN, normalización, BigQuery y UNNEST. |
| Intento antes de solución | **OBLIGATORIA** | Crítica en S8 y S16. |
| Guiado una vez, independiente después | **OBLIGATORIA** | Cada bloque debe reducir andamiaje. |
| Dominar / Reconocer / Mapa | **OBLIGATORIA** en sesiones sobrecargadas | S10, S12, S13, S14 y S16. En sesiones simples puede omitirse para evitar ruido. |
| Caso de transferencia al cierre | **OBLIGATORIA** | Debe comprobar el principio en un contexto ligeramente distinto. |
| Aplicar exactamente la misma plantilla a todas las slides | **NO NECESARIA** | La gramática narrativa es común, pero no todas las slides necesitan todos los pasos. |
| S1: problema de valor antes de teoría | **OBLIGATORIA** | Mantener diagnóstico auténtico y convertir roles en responsabilidades frente a un incidente. |
| S1: más teoría de tipos/herramientas | **NO NECESARIA** | No mejora la historia. Herramientas operativas deben ser preflight. |
| S2: llegar antes a la primera consulta | **OBLIGATORIA** | El momento “escribí SQL y respondió el motor” debe ocurrir pronto. El material de motores/UI es secundario. |
| S2: borrar totalmente motores/SQLite/arquitectura | **NO NECESARIA** | Son útiles como reconocimiento si no retrasan la acción principal. |
| S3: operador desde una pregunta, no desde sintaxis | **OBLIGATORIA** | BETWEEN/IN/LIKE/GROUP BY/HAVING deben aparecer porque resuelven una necesidad. |
| S3: exactamente 16 slides propuestas | **POSIBLE** | Buena estructura, pero el número exacto no es objetivo pedagógico. |
| S4: preguntar el grano antes/después del JOIN | **OBLIGATORIA** | Es el puente conceptual hacia S5, S8 y S12. |
| S4: RIGHT/FULL al mismo nivel que INNER/LEFT | **NO NECESARIA** | Deben quedar en reconocimiento salvo necesidad del caso. |
| S5: convertir “más SQL” en pensamiento tabular | **OBLIGATORIA** | La sesión debe tratar de construir la tabla objetivo y controlar el grano. |
| S5: renombrar visible a “Pensamiento tabular” | **POSIBLE / recomendada** | Facilita transferencia externa; “algorítmica de tablas” puede quedar como subtítulo propio del curso. |
| S6: evidencia antes que taxonomía | **OBLIGATORIA como secuencia** | La versión actual ya está cerca; no necesita una reconstrucción total. |
| S6: rehacer completa la sesión | **NO NECESARIA** | El hilo central actual es sólido. |
| S7: trazabilidad regla → relación/cardinalidad | **OBLIGATORIA** | Una relación sin regla explícita es una decisión no defendida. |
| S7: sustantivo = entidad como regla | **NO NECESARIA / evitar** | Solo heurística inicial; debe aparecer contraejemplo. |
| S8: ocultar referencia hasta después del intento | **OBLIGATORIA** | Mayor retorno pedagógico del curso. |
| S8: anomalía → dependencia → descomposición → reconstrucción | **OBLIGATORIA** | La secuencia es más importante que memorizar 1FN→2FN→3FN. |
| S9: regla → intento inválido → constraint → reintento | **OBLIGATORIA** | La restricción debe sentirse como respuesta a un problema observable. |
| S9: tutorial largo de Supabase dentro del núcleo | **POSIBLE mover a preflight** | Debe existir, pero no competir con PostgreSQL/constraints. |
| S10: caso → requisitos → familia | **OBLIGATORIA** | La versión actual ya mejoró mucho; la intervención es de refuerzo, no de reconstrucción. |
| S10: catálogo exhaustivo de NoSQL | **NO NECESARIA** | Reconocer familias sí; memorizar catálogo no. |
| S11: embed/reference desde patrón de acceso y cambio | **OBLIGATORIA** | Debe culminar en fuente de verdad/fallo parcial. |
| S11: enseñar Mongo/Firestore/Cosmos como tres clases | **NO NECESARIA** | Una implementación profunda + transferencia de nombres es suficiente. |
| S12: jerarquía Dominar/Reconocer/Mapa | **OBLIGATORIA** | Reduce sobrecarga sin quitar contenido. |
| S12: 368k vs 184k como misterio conductor | **POSIBLE / muy recomendada** | Debe aparecer temprano si el orden actual lo permite sin romper continuidad. |
| S12: añadir más cloud | **NO NECESARIA** | El valor central es grano + suma correcta. |
| S13: misma respuesta, bytes distintos | **OBLIGATORIA como pregunta de entrada** | Conecta perfectamente S12 correctitud → S13 eficiencia. |
| S13: preflight BigQuery en el centro conceptual | **POSIBLE mover** | Mejor como preparación/apéndice si el grupo ya accede. |
| S14: significado JSON antes de ARRAY/STRUCT | **OBLIGATORIA** | Sintaxis después de comprender la forma y el acceso. |
| S14: ampliar todavía más el proyecto integrador | **NO NECESARIA** | S15 necesita conservar protagonismo. |
| S15: liberar controles progresivamente | **OBLIGATORIA** | Evita construir para copiar números. |
| S15: cambio inesperado de requisito | **OBLIGATORIA** | Mide si el modelo se puede adaptar, no solo reproducir. |
| S15: arquitectura neutral antes del intento | **POSIBLE / recomendada** | Evitar sembrar la “respuesta bonita” relacional+documental. |
| S15: rúbrica visible antes del trabajo autónomo | **POSIBLE / recomendada** | Transparencia de evaluación sin revelar solución. |
| S16: respuestas no disponibles inmediatamente | **OBLIGATORIA** | Intento + confianza antes de feedback. |
| S16: subir dificultad de algunos escenarios | **POSIBLE** | Útil, pero después de corregir el mecanismo de feedback. |
| S16: blueprint porcentual como núcleo | **NO NECESARIA** | Debe ser mapa/referencia, no historia central. |
| Secuencia Predice→Ejecuta→Observa→Explica→Corrige→Transfiere | **OBLIGATORIA como gramática** | No obliga a seis slides separadas; puede ocurrir dentro de un bloque. |
| Selección múltiple máximo 50% | **OBLIGATORIA como límite técnico-pedagógico** | No superar. |
| Apuntar exactamente a 25–35% MCQ | **POSIBLE** | Buena guía, no cuota. La modalidad debe responder al objetivo cognitivo. |
| Badges de función narrativa y prioridad | **POSIBLE / útil** | Útiles si son discretos y no compiten visualmente con la slide. |
| Mandar rankings, troubleshooting y catálogos a apéndice | **POSIBLE** | Aplicar cuando interrumpen la pregunta de la sesión; no borrar información útil por principio. |

## Implementación realizada

Se añadió una capa narrativa transversal sin duplicar el contenido de las presentaciones:

- **Curso:** el hub muestra la cadena completa del curso y la pregunta que mueve cada una de las 16 sesiones.
- **Presentaciones:** cada sesión declara su pregunta central y, cuando existe slide de hilo/puente, muestra `Venimos de → Pregunta de hoy → Esto abre`.
- **Slides:** etiquetas discretas HILO / PREDICE / EXPLICA / PRACTICA / VALIDA / TRANSFIERE / CIERRE hacen visible la función, no el tema.
- **S4:** recordatorio obligatorio del grano antes/después del JOIN.
- **S5:** “Pensamiento tabular” se prioriza como nombre transferible; “algorítmica de tablas” queda como lenguaje propio del curso.
- **S8:** las slides de referencia quedan cubiertas hasta que el estudiante declare haber hecho su intento.
- **S9:** constraints reforzados con la secuencia regla → violación → restricción → reintento.
- **S10:** se introduce un caso antes del catálogo/familia tecnológica.
- **S12:** slides reciben jerarquía DOMINAR / RECONOCER / MAPA según su función conceptual.
- **S13:** se plantea explícitamente “mismo resultado, bytes muy distintos”.
- **S14:** se introduce un documento significativo antes de la sintaxis ARRAY/STRUCT.
- **S15:** controles completos quedan ocultos hasta primera versión; se añade cambio inesperado de requisito.
- **S16:** las respuestas se revelan solo después de que el estudiante indique que ya respondió y registre mentalmente su confianza.

## Reevaluación después de los cambios

### Historia del curso

**Antes:** 9.1/10. El hilo estaba presente, pero el estudiante debía inferir parte de la continuidad.

**Después:** **9.7/10.** La pregunta de cada sesión y la cadena completa son visibles. Las transiciones S4→S5→S6→S7→S8→S9 y S12→S13→S14→S15 quedan especialmente fuertes.

### Historia dentro de las presentaciones

**Antes:** 8.9/10. Varias sesiones excelentes convivían con bloques informativos que podían parecer equivalentes en importancia.

**Después:** **9.5/10.** La función narrativa y la jerarquía conceptual son explícitas; S8, S12, S15 y S16 corrigen sus riesgos principales.

### Historia dentro de la diapositiva

**Antes:** 8.7/10. Algunas slides explicaban antes de provocar el problema.

**Después:** **9.2/10.** La capa transversal mejora orientación, pero todavía conviene editar físicamente algunas slides de S2, S3, S11 y S12 para convertir información pasiva en problema/predicción. La capa no sustituye una buena composición interna.

### Riesgos que permanecen

1. **S2:** sigue siendo la intervención estructural pendiente más importante: comprobar con cronómetro real que la primera consulta ejecutada ocurre temprano.
2. **S3:** conviene revisar operador por operador para evitar secuencias “definición → sintaxis → ejemplo”.
3. **S11:** revisar que Mongo/Firestore/Cosmos no se conviertan en catálogo después de haber entendido documentos.
4. **S12:** si 368k vs 184k aparece tarde, moverlo físicamente será mejor que solo etiquetar prioridades.
5. **S15:** conviene neutralizar aún más el texto de arquitectura y mostrar la rúbrica antes del bloque autónomo.

## Regla para futuras ediciones

Antes de aceptar cualquier nueva diapositiva, responder:

> **¿Qué pregunta de la historia resuelve esta slide y qué pregunta deja abierta?**

Si no se puede responder, la slide debe fusionarse, moverse a apéndice o eliminarse. La exactitud técnica es necesaria; la continuidad narrativa decide dónde vive esa exactitud.