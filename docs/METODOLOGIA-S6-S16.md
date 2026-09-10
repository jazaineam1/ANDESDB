# Metodología de aprendizaje · Sesiones 6–16

## Propósito

Desde la sesión 6 el curso avanza como una ruta de decisiones profesionales:

> entender el negocio → distinguir evidencia de suposición → modelar → implementar → elegir SQL/NoSQL → separar operación de analítica → trabajar en cloud → integrar y validar.

GitHub es infraestructura invisible. El estudiante no tiene que aprender Git para aprender bases de datos.

## Principios

### 1. Diferenciación solo cuando aporta

La heterogeneidad del grupo se atiende con dos velocidades **principalmente en prácticas de codificación o ejecución técnica**:

- **Práctica base:** lo que todos deberían intentar completar.
- **Extensión:** dificultad adicional para quien termina antes.

No se fuerza este patrón en actividades conceptuales o de interpretación. Por ejemplo, S6 (reglas de negocio) no necesita una capa artificial de Núcleo/Reto; allí el valor está en discutir evidencia, hipótesis y decisiones.

Sesiones previstas para diferenciación técnica: **S11, S12, S13, S14 y S15**. Puede ajustarse al construir cada sesión.

### 2. Ejemplo trabajado → completar → resolver

La ayuda se retira gradualmente:

1. el docente muestra una decisión completa;
2. el estudiante completa una parte;
3. el estudiante resuelve con menos pistas;
4. debe defender el porqué, no solo mostrar código.

### 3. Recuperación espaciada DP-900

Desde S6 se incorporan 2–3 micro-preguntas relacionadas con los conceptos realmente trabajados. Son de baja presión y no dependen de una cuenta ni de un progreso guardado en un dispositivo.

### 4. Sin progreso local como eje pedagógico

No se usa `localStorage` para construir una narrativa de “avance del estudiante”, porque una misma persona puede alternar entre computador, teléfono u otro equipo. Las actividades pueden funcionar localmente, pero no se presentan como un expediente de progreso persistente.

### 5. Autenticidad tecnológica

Cuando el aprendizaje depende de un servicio cloud, se usa el **servicio real**:

- S9: Supabase + PostgreSQL;
- S11: Firebase Firestore + MongoDB Atlas (Azure Cosmos DB entra solo como puente conceptual para el DP-900, sin práctica de laboratorio: la vía sin backend que Atlas ofrecía se retiró en 2025);
- S13: Google BigQuery;
- S14: Google BigQuery.

**Por qué Cosmos DB no es laboratorio obligatorio en S11.** La cohorte viene de
Colsubsidio/Tec Alianza, sin cuenta institucional universitaria garantizada:
Azure for Students no es una base confiable para 40 estudiantes. La
alternativa —que el docente comparta su propia suscripción y agregue a cada
estudiante como invitado— traslada la responsabilidad de facturación a esa
cuenta personal, incluso si el consumo esperado cabe en el nivel gratuito. Se
descarta no por debilidad técnica sino porque es financieramente innecesaria
para el objetivo académico: Firestore en el plan Spark cumple la misma
necesidad —cuenta personal, sin tarjeta, servicio real— sin ese riesgo. Por
eso Cosmos DB entra solo como puente conceptual para el DP-900, nunca como
práctica de laboratorio.

Esta misma restricción gobierna cualquier elección de plataforma en S11–S15:

| Requisito | Consecuencia |
|---|---|
| 40 estudiantes | cada uno trabaja con cuenta propia, nunca dependiendo de una cuenta docente compartida |
| Sin tarjeta | ningún laboratorio obligatorio puede exigirla |
| Sin riesgo de factura | agotar la cuota debe bloquear o limitar, nunca empezar a cobrar |
| Servicio real | cuando el concepto lo amerita, se toca una plataforma real, no solo se describe |

Por eso BigQuery Sandbox (S13, S14) y Firebase Spark (S11) se eligieron sobre
las alternativas de pago o de cuenta institucional: la pregunta de diseño no
es «¿cómo hago todo en Azure?», sino «¿cómo se enseñan las capacidades que el
DP-900 espera con servicios reales y gratuitos, para transferir después esos
conceptos a Azure?».

Los laboratorios WebAssembly son fallback de continuidad, nunca sustituto del servicio real.

### 6. Productive failure

Antes de revelar la solución se permite que aparezca el error que enseña el concepto: JOIN que multiplica filas, cero observado que no es regla, redundancia que produce anomalías, grano mal elegido o tecnología seleccionada por moda.

### 7. Validación como hábito profesional

No basta con que una consulta ejecute. Toda actividad importante debe pedir alguna comprobación: conteo contra la fuente, segundo camino, spot check, criterio de negocio o comparación entre alternativas.

### 8. Explicación antes que memoria

El cierre conceptual recurrente es:

> “¿podría explicar la decisión que tomé sin mirar el código?”

No hace falta almacenar esa respuesta: sirve como pausa metacognitiva en la sesión.

---

## Sesión regular · 165 minutos útiles

La distribución es flexible, pero debe preservar actividad frecuente. Ningún tramo expositivo debería superar aproximadamente 15 minutos sin una predicción, decisión, ejecución, clasificación o explicación del estudiante.

## S7, S10 y S13 · sesiones cortas

Estas sesiones funcionan como estudios/laboratorios supervisados:

| Hora | Actividad |
|---|---|
| 18:00–18:15 | briefing: objetivo, entregable, criterios y recursos |
| 18:15–19:30 | 75 min de trabajo autónomo guiado |
| 19:30–19:45 | pausa |
| 19:45–20:00 | finalizar y validar |
| 20:00 | publicación de referencia/solución |
| 20:00–20:30 | debrief: comparar estrategias |
| 20:30–20:40 | DP-900 + cierre |

Es una plantilla, no un contrato: **la hora de publicación sale de
`solucion.publicar` en `assets/learning/learning-plan.json`**, y el suelo —nunca
antes de las 20:00— lo comprueba `tools/validar_curso.py`.

**S7 se desvía a propósito.** Termina a las **20:45**, no a las 20:40, así que el
reparto es 12 de briefing · 18 de ejemplo trabajado · 45 + 30 de taller · 20 de
debrief · 9 + 5 de cierre conceptual · 6 de DP-900 y cierre. El debrief acaba a
las 20:02 y **la referencia se publica a las 20:15**, detrás y no delante: a las
20:00 quedaría disponible mientras todavía se está discutiendo.

Además, el bloque de certificaciones que la S7 tenía previsto se traslada a la
**S16**, donde es accionable. Nunca llegó a anunciarse al grupo.

En S7 y S10 el trabajo autónomo no necesita “Reto” separado si la actividad ya ofrece suficiente apertura conceptual. En S13 sí puede usarse una extensión técnica para estudiantes que avanzan rápido en BigQuery.

---

## Hilo conductor S6–S12: Restaurante ABC

| Sesión | Lente |
|---|---|
| S6 | reglas, evidencia y preguntas pendientes |
| S7 | entidades, relaciones y cardinalidades |
| S8 | dependencias y normalización |
| S9 | tablas, claves y restricciones ejecutables |
| S10 | decisiones SQL vs NoSQL |
| S11 | documentos y partición |
| S12 | hechos, dimensiones, medidas y grano analítico |

## Dos caminos, no uno

El hilo de arriba es en realidad **dos**, y confundirlos fue el problema de la
sesión 6.

| | |
|---|---|
| **Camino de diseño** · S6 → S7 → S8 → S9 | cómo se construye la base que hace funcionar el negocio: reglas → modelo → normalización → tablas |
| **Camino analítico** · S12 en adelante | qué se hace después con los datos: OLTP, OLAP, lago, bodega, ETL/ELT |

**La S6 los mezcló.** Después del Restaurante ABC todavía cubrió OLTP, OLAP, las
tres clases de dato, lago, bodega, ETL y ELT: once preguntas distintas en una
sesión, y las cinco últimas de otro viaje. El grupo salió sin saber cuál era el
hilo, y la S7 abría dando por hecho que habían salido con las reglas en la mano.

**Correcciones ya aplicadas:**

- La S7 abre con un mapa que **separa los dos caminos**, dice cuál se sigue hoy y
  aparca el otro hasta la S12 — sin fingir que la S6 fue lineal.
- El cierre analítico de la S7 baja a **dos minutos** y deja de enseñar OLAP:
  solo confirma el mapa.
- El bloque de certificaciones sale de la S7 y se va a la S16.

**Para lo que viene:** el material analítico de la S6 —OLTP/OLAP, tipos de dato,
lago, bodega, ETL/ELT— **se recoge en la S12**, donde el estudiante ya tiene
delante el problema que lo hace necesario: su propio modelo operacional
contestando caro una pregunta de negocio. No se repite antes.

**Regla para las sesiones que quedan:** una sesión responde **una** pregunta
grande. Si hacen falta dos, son dos sesiones.

---

## S13–S16: transferencia

El caso de negocio sigue siendo el Restaurante ABC: sus ventas alimentan el
warehouse de la S13 y sus pedidos en JSON alimentan la carga semiestructurada
de la S14. El estudiante no cambia de negocio a mitad de módulo — cambia de
pregunta sobre el mismo negocio.

- **S13 · warehouse cloud real en BigQuery.** No enseña sintaxis SQL nueva
  —eso ya se resolvió en S2–S5—: usa el SQL que el grupo ya conoce para
  descubrir una plataforma nueva. BigQuery muestra cuántos datos va a procesar
  una consulta antes de ejecutarla, así que el costo de leer columnas de más
  aparece como una consecuencia observable, no como una definición de
  almacenamiento columnar dicha de entrada. La transferencia a Microsoft es
  explícita y sin atajos: BigQuery no se presenta como «el Fabric de
  Google» —no son equivalentes—; el patrón de carga se reconoce después en
  Fabric Warehouse, Azure Databricks y Power BI.
- **S14 · datos anidados/semiestructurados, sobre la misma plataforma de
  S13.** No se abre una cuenta nueva ni se cambia de interfaz a mitad de
  transferencia. El hilo recupera el documento JSON ya visto en S11 —antes
  como modelo operacional, ahora como dato semiestructurado de una carga
  analítica—, usa `UNNEST` para reconectar con el grano (S12) y el nivel de
  agregación (S5) cuando un arreglo se expande en filas, e introduce Parquet
  solo después de que ya existan varios formatos de archivo distintos sobre
  la mesa, nunca como una palabra suelta del examen. **Databricks Free
  Edition queda como extensión, no como núcleo**: quien termine temprano
  resuelve en Databricks la misma pregunta ya resuelta en BigQuery, en vez de
  gastar tiempo de clase completa creando cuenta, workspace y notebook.
- **S15:** datos imperfectos sin herramienta prescrita.
- **S16:** escenarios acumulativos y preparación DP-900.

**Lo que esto descarta a propósito:** un producto nuevo por sesión solo por
variedad, repetir SQL básico bajo otro nombre, cambiar de caso de negocio a
mitad de módulo, enseñar Fabric solo con diapositivas sin haberlo operado,
convertir el DP-900 en memorizar nombres de servicios, o introducir
Spark/streaming antes de que exista un problema real de eventos que lo
justifique.

---

## Material heredado

Las presentaciones y ejercicios de versiones anteriores se conservan en GitHub como **archivo de trabajo del docente**, pero no se enlazan desde la página pública del curso mientras se reconstruyen. Solo se publica en la navegación el material que haya sido revisado y aprobado para la cohorte actual.

---

## Señal de éxito

La sensación buscada no es “vi muchos temas”, sino:

> “cada clase agregó una capacidad concreta y entiendo por qué la siguiente existe”.
