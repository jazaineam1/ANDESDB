# Metodología de aprendizaje · Sesiones 6–16

## Propósito

Desde la sesión 6 el curso deja de ser una secuencia de temas y se convierte explícitamente en una **ruta de decisiones profesionales**:

> entender el negocio → distinguir evidencia de suposición → modelar → implementar → elegir SQL/NoSQL → separar operación de analítica → trabajar en cloud → integrar y validar.

GitHub es infraestructura invisible. El estudiante no tiene que aprender Git para aprender bases de datos.

## Ocho principios no negociables

### 1. Núcleo + Reto

Cada actividad tiene dos velocidades:

- **🟢 Núcleo:** resultado que todos deberían intentar producir.
- **🔵 Reto:** extensión para quien termina antes o necesita mayor dificultad.

No se separa al grupo por “buenos” y “malos”; se ofrece profundidad adicional sin aumentar la ansiedad del principiante.

### 2. Ejemplo trabajado → completar → resolver

La ayuda se retira gradualmente:

1. el docente muestra una decisión completa;
2. el estudiante completa una parte;
3. el estudiante resuelve un caso con menos pistas;
4. al final debe defender el porqué, no solo mostrar código.

Esto evita que el curso se convierta en copiar consultas de una diapositiva.

### 3. Recuperación espaciada DP-900

Desde S6 cada sesión termina con 2–3 micro-preguntas de recuperación. No son un bloque separado de certificación: recuperan conceptos que acaban de usarse.

El objetivo es llegar a S16 habiendo practicado repetidamente los cuatro dominios de DP-900, en vez de intentar memorizarlos al final.

### 4. Progreso privado y visible

El navegador guarda con `localStorage`:

- Núcleo completado;
- Reto completado;
- respuestas DP-900;
- nivel de confianza.

No se requiere login y el progreso no sale del dispositivo. La intención es que el estudiante vea continuidad entre sesiones, no crear vigilancia.

### 5. Autenticidad tecnológica

Cuando el aprendizaje depende de un servicio cloud, se usa el **servicio real**:

- S9: Microsoft Azure SQL;
- S11: Firebase Firestore + Azure Cosmos DB;
- S13: Google BigQuery;
- S14: Google BigQuery.

Los laboratorios WebAssembly son **fallback de continuidad**, nunca sustituto. Si una cuenta individual se bloquea, esa persona puede seguir razonando mientras el docente mantiene visible el servicio real.

### 6. Productive failure

Antes de revelar la solución se permite que aparezca el error que enseña el concepto:

- un JOIN multiplica filas;
- un cero observado no constituye una regla;
- una tabla redundante produce anomalías;
- una mala elección de grano limita preguntas;
- una tecnología elegida por moda no resuelve requisitos.

La corrección viene después de que exista una hipótesis del estudiante.

### 7. Validación como hábito profesional

No basta con que una consulta ejecute. Toda actividad importante debe pedir alguna forma de comprobación:

- conteo contra la fuente;
- resultado obtenido por un segundo camino;
- spot check de filas concretas;
- criterio de negocio;
- comparación entre alternativas.

### 8. Explicación antes que memoria

El cierre metacognitivo es siempre:

> “¿podría explicar la decisión que tomé sin mirar el código?”

El curso busca transferencia: que el estudiante pueda resolver un problema distinto del visto en clase.

---

## Estructura de una sesión regular · 165 minutos útiles

La distribución es flexible, pero debe preservar actividad frecuente:

| Bloque | Min | Función |
|---|---:|---|
| Recuperación inicial | 10 | 2–3 preguntas de sesiones anteriores, sin notas |
| Problema / demostración | 15 | crear necesidad antes de formalizar el concepto |
| Práctica breve | 15 | primer intento del estudiante |
| Formalización + contraste | 20 | poner nombre al patrón observado |
| Práctica Núcleo | 25 | ejecución con ayuda decreciente |
| Pausa | 15 | fuera de los 165 útiles según planificación del curso |
| Workshop / caso | 45 | producción sostenida y decisiones |
| Debrief | 20 | comparar estrategias y errores productivos |
| DP-900 + salida | 15 | recuperación + “qué puedo explicar ahora” |

Ningún tramo expositivo debería superar aproximadamente 15 minutos sin una predicción, decisión, ejecución, clasificación o explicación del estudiante.

---

## Estructura de S7, S10 y S13 · martes cortos

Horario: 18:00–20:40. Con 15 minutos de pausa quedan aproximadamente 145 minutos útiles.

Estas sesiones no son clases magistrales abreviadas. Son **estudios/laboratorios supervisados**.

| Hora | Min útiles | Actividad |
|---|---:|---|
| 18:00–18:15 | 15 | briefing: objetivo, entregable, criterios y recursos |
| 18:15–19:30 | 75 | **trabajo autónomo guiado**; docente observa, pregunta y desbloquea, no resuelve |
| 19:30–19:45 | — | pausa |
| 19:45–20:00 | 15 | finalizar, validar y preparar comparación |
| **20:00** | — | **se publica la solución/referencia** |
| 20:00–20:30 | 30 | debrief: comparar estrategias contra referencia, no copiarla |
| 20:30–20:40 | 10 | DP-900 + exit ticket |

La solución a las 20:00 funciona como **feedback demorado**: llega después de un intento prolongado, cuando ya hay decisiones que comparar.

---

## Hilo conductor S6–S12: Restaurante ABC

Para reducir carga cognitiva, el negocio se mantiene mientras cambia el lente técnico:

| Sesión | El mismo negocio se mira como… |
|---|---|
| S6 | reglas, evidencia y preguntas pendientes |
| S7 | entidades, relaciones y cardinalidades |
| S8 | dependencias y normalización |
| S9 | tablas, claves y restricciones ejecutables |
| S10 | decisiones SQL vs NoSQL |
| S11 | documentos y partición |
| S12 | hechos, dimensiones, medidas y grano analítico |

El estudiante aprende una tecnología nueva sin tener que reaprender simultáneamente un dominio de negocio nuevo.

---

## Hilo conductor S13–S16: transferencia

A partir de S13 se cambia deliberadamente el contexto para comprobar transferencia:

- **S13:** warehouse cloud real en BigQuery;
- **S14:** datos anidados/semiestructurados + mapa Azure;
- **S15:** datos imperfectos sin herramienta prescrita;
- **S16:** escenarios acumulativos y plan DP-900.

La pregunta cambia de “¿qué comando uso?” a “¿qué arquitectura puedo defender?”.

---

## Evaluación formativa sin convertir el curso en una tarea permanente

La página comercial promete que el trabajo ocurre durante las sesiones. Se preserva esa promesa.

La evidencia de aprendizaje se recoge dentro de clase mediante:

1. predicciones antes de ejecutar;
2. entregables de Núcleo;
3. Retos opcionales;
4. quizzes DP-900 de baja presión;
5. explicación entre pares / chat;
6. debrief contra una referencia;
7. desafío final integrador.

La solución no se evalúa solo por sintaxis: se considera el **modelo mental**, la validación y la justificación.

---

## Diseño motivacional

El estudiante debería poder contestar al final de cada sesión dos preguntas:

1. **¿Qué puedo hacer hoy que no podía hacer al empezar?**
2. **¿Para qué me sirve profesionalmente?**

La portada y la capa `Ruta` hacen visible la progresión. Los productos de cada sesión deberían ser acumulables: una consulta validada, un modelo, una decisión arquitectónica o un resultado cloud real.

La sensación buscada no es “vi muchos temas”, sino:

> “cada clase agregó una capacidad concreta y entiendo por qué la siguiente existe”.

---

## Accesibilidad y resiliencia

- Las prácticas fundamentales deben tener versión que no dependa de un login cloud.
- Los servicios cloud reales siguen siendo obligatorios cuando son objetivo de aprendizaje.
- PWA/service worker reduce impacto de conexión intermitente.
- `sql.js` y DuckDB-Wasm se sirven desde el propio GitHub Pages para evitar dependencias externas durante la clase.
- Los resultados deben ser legibles en móvil, pero las actividades extensas se diseñan para computador.
- Ningún progreso personal se envía a un servidor por defecto.

---

## Señales de éxito del curso

Al cerrar S16 un estudiante debería poder:

- transformar una necesidad en preguntas y reglas;
- identificar qué representa una fila;
- consultar y unir datos sin inflar métricas inadvertidamente;
- diseñar y normalizar un modelo relacional;
- implementar restricciones básicas con DDL;
- justificar SQL vs NoSQL;
- distinguir OLTP de cargas analíticas;
- reconocer hechos, dimensiones y grano;
- ejecutar análisis en un servicio cloud real;
- reconocer los servicios y conceptos centrales de DP-900;
- validar un resultado antes de defenderlo.

Ese conjunto de capacidades es el contrato pedagógico que debe proteger `tools/validar_curso.py` y la revisión docente de cada nueva sesión.
