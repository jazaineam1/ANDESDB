# Hilo conductor del curso

**Pregunta madre:** ¿Cómo convertimos una necesidad de negocio en una solución de datos defendible, comprobable y transferible?

La regla narrativa es **hereda → pregunta → evidencia → limitación que obliga a la siguiente sesión**. No se añaden temas por catálogo: cada concepto aparece porque resuelve un problema que ya fue visible.

## Seis actos

### Acto 1 · S1 · Por qué importan los datos
¿Qué decisión queremos mejorar y qué papel cumplen los datos?

### Acto 2 · S2–3–4–5 · Responder preguntas con confianza
¿Cómo obtenemos una respuesta correcta, explicable y validada con SQL?

### Acto 3 · S6–7–8–9 · Diseñar y hacer cumplir el modelo
¿Cómo pasamos de reglas del negocio a una base que proteja esas reglas?

### Acto 4 · S10–11 · Elegir la representación adecuada
¿Cuándo convienen tablas, documentos o una arquitectura híbrida?

### Acto 5 · S12–13–14 · Separar operación y analítica y llevarla a cloud
¿Cómo diseñamos para análisis y transferimos el razonamiento entre nubes?

### Acto 6 · S15–16 · Integrar, demostrar y transferir
¿Podemos resolver el problema completo y explicar lo aprendido en un marco externo?

## Cadena sesión a sesión

### S01
- **Hereda:** Partimos de decisiones reales y del diagnóstico del grupo; todavía no asumimos que una herramienta produzca valor por sí sola.
- **Pregunta:** ¿Cómo pasa un dato de existir a generar una decisión?
- **Evidencia:** Cadena evento → dato → almacenamiento → transformación → consumidor → decisión, más un diagnóstico inicial.
- **Puente:** Una decisión necesita respuestas verificables. En S2 aprendemos a preguntarle a una base de datos sin modificarla.

### S02
- **Hereda:** S1 dejó una decisión que necesita evidencia y una cadena para convertir datos en respuestas.
- **Pregunta:** ¿Cómo obtenemos una primera respuesta de una base sin alterar los datos?
- **Evidencia:** SELECT, WHERE, ORDER BY y LIMIT usados para responder una pregunta concreta y validar el resultado.
- **Puente:** Listar filas ya no basta cuando el negocio pide comparar y resumir. S3 convierte filas en información agregada.

### S03
- **Hereda:** S2 ya permite recuperar filas correctas de una tabla.
- **Pregunta:** ¿Cómo filtramos con precisión y convertimos muchas filas en un resumen útil?
- **Evidencia:** Filtros, GROUP BY, agregaciones y HAVING con una salida cuyo significado se puede explicar.
- **Puente:** Una sola tabla no contiene todas las respuestas. S4 obliga a relacionar fuentes sin perder la semántica de la pregunta.

### S04
- **Hereda:** S3 sabe resumir correctamente una tabla, pero muchas preguntas viven repartidas entre varias.
- **Pregunta:** ¿Cómo combinamos tablas preservando las filas que la pregunta exige?
- **Evidencia:** JOIN elegido por semántica, cardinalidad explicada y resultado validado.
- **Puente:** Un JOIN puede ser correcto y aun así inflar totales si mezcla granos distintos. S5 diseña primero la tabla resultado.

### S05
- **Hereda:** S4 permite unir tablas; ahora debemos evitar construir consultas correctas sintácticamente pero equivocadas en su nivel de detalle.
- **Pregunta:** ¿Cómo diseño la tabla resultado y su grano antes de escribir SQL?
- **Evidencia:** Método ANDESDB: pregunta → grano → fuentes → filtros → agregación → validación.
- **Puente:** Hasta ahora consultamos un esquema que ya existía. En S6 cambiamos de lado: debemos descubrir qué reglas del negocio debería representar una base.

### S06
- **Hereda:** S2–S5 enseñaron a leer un esquema y obtener respuestas; ahora usamos esa lectura como evidencia, no como verdad automática del negocio.
- **Pregunta:** ¿Qué puedo afirmar del negocio y con qué grado de certeza?
- **Evidencia:** Observación → certeza → evidencia → regla comprobable → pregunta pendiente.
- **Puente:** Las reglas siguen escritas en lenguaje natural. S7 las transforma en entidades, relaciones y cardinalidades.

### S07
- **Hereda:** S6 dejó reglas defendibles y dudas explícitas del Restaurante ABC.
- **Pregunta:** ¿Qué entidades y relaciones necesita el modelo para representar esas reglas?
- **Evidencia:** Primer modelo conceptual con cardinalidades y decisiones justificadas.
- **Puente:** Un primer modelo puede repetir hechos o esconder dependencias. S8 lo somete a normalización sin perder el negocio.

### S08
- **Hereda:** S7 produjo el modelo conceptual; ahora hay que comprobar que su estructura relacional no introduzca anomalías.
- **Pregunta:** ¿Cómo reducimos redundancia problemática conservando las reglas y la reconstrucción de la información?
- **Evidencia:** Modelo-base normalizado con dependencias, 1FN, 2FN, 3FN y reconstrucción comprobada.
- **Puente:** Un modelo correcto en papel todavía no impide datos inválidos. S9 convierte decisiones del modelo en restricciones ejecutables.

### S09
- **Hereda:** S8 dejó un modelo relacional normalizado y reglas que deben protegerse.
- **Pregunta:** ¿Cómo hacemos que PostgreSQL haga cumplir las reglas y cómo demostramos que realmente las cumple?
- **Evidencia:** schema.sql + tests.sql con PK, FK, NOT NULL, CHECK, DEFAULT y pruebas negativas.
- **Puente:** Ya sabemos construir bien una solución relacional. S10 formula la pregunta más importante: ¿cuándo una tabla relacional no es la mejor representación?

### S10
- **Hereda:** S9 demostró la fortaleza del modelo relacional cuando necesitamos integridad y reglas explícitas.
- **Pregunta:** ¿Qué evidencia necesito antes de decidir entre relacional, documentos u otra familia?
- **Evidencia:** Decisión defendida por patrón de acceso, consistencia, forma/evolución del dato y costo o riesgo.
- **Puente:** Decidir “documentos” en papel no demuestra el trade-off. S11 lo vive en un servicio real y lo combina con la fuente relacional de verdad.

### S11
- **Hereda:** S10 dejó criterios para elegir representación; ahora probamos una arquitectura híbrida con estado mutable y hechos auditables.
- **Pregunta:** ¿Qué debe vivir embebido o referenciado y cuál sistema es fuente de verdad en cada momento?
- **Evidencia:** Documentos consultados + decisión embed/reference + checkout confirmado y localizado en PostgreSQL.
- **Puente:** Cada checkout confirmado produce un hecho operacional. Cuando esos hechos crecen y queremos historia, tendencias y tableros, consultar la operación directamente deja de ser suficiente: S12.

### S12
- **Hereda:** S11 terminó con ventas confirmadas como hechos operacionales; ahora acumulamos esos hechos para responder preguntas históricas sin castigar la operación.
- **Pregunta:** ¿Cómo transformamos datos operacionales en una estructura diseñada para analizar?
- **Evidencia:** Grano declarado + tabla de hechos + dimensiones + medidas + validación del total correcto.
- **Puente:** El modelo estrella funciona localmente. S13 comprueba que el mismo razonamiento se sostiene en un warehouse cloud real.

### S13
- **Hereda:** S12 dejó un miniwarehouse con grano, hechos, dimensiones y medidas ya validados.
- **Pregunta:** ¿Qué cambia cuando ese mismo modelo llega a BigQuery y el costo de lectura se vuelve visible?
- **Evidencia:** Carga validada de 44 filas / 1.455.000 + consultas de negocio + lectura de bytes procesados.
- **Puente:** Un warehouse real no recibe únicamente tablas planas. S14 trabaja JSON/Parquet y estructuras anidadas y luego transfiere esas decisiones al mapa Azure.

### S14
- **Hereda:** S13 probó el modelo analítico en cloud; ahora cambiamos la forma del dato y preguntamos cuándo conviene mantener estructura anidada.
- **Pregunta:** ¿Cuándo conviene una representación plana, relacional o anidada y cómo se traduce la necesidad a servicios Azure?
- **Evidencia:** STRUCT/ARRAY/UNNEST ejecutados + decisión de representación + mapa necesidad → familia/servicio.
- **Puente:** Ya practicamos las piezas por separado. S15 quita la receta y obliga a elegir modelo, transformación, consultas y arquitectura a partir del problema.

### S15
- **Hereda:** S1–S14 construyeron el repertorio: preguntar, modelar, implementar, elegir representación, analizar y transferir a cloud.
- **Pregunta:** ¿Puedo resolver un problema completo sin que la herramienta ni el modelo estén decididos de antemano?
- **Evidencia:** Diagnóstico + modelo + transformación + consultas + validaciones + arquitectura + defensa oral.
- **Puente:** La defensa final revela qué dominios ya dominamos y dónde todavía dudamos. S16 convierte esa evidencia en diagnóstico y plan DP-900.

### S16
- **Hereda:** S15 produjo evidencia auténtica de desempeño, no solo respuestas de opción múltiple.
- **Pregunta:** ¿Qué aprendí, qué puedo transferir y qué me falta para demostrarlo en DP-900?
- **Evidencia:** Pre/post + diagnóstico por dominio + transferencia por escenarios + plan personal de estudio.
- **Puente:** Se cierra el ciclo: problema → evidencia → consulta → modelo → implementación → elección tecnológica → analítica → validación → decisión.

