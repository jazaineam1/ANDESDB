# Sesión 15 · Atención de incidentes urbanos · Workbench v5

La herramienta principal es [`/ANDESDB/evaluador-s15-v5.html`](/ANDESDB/evaluador-s15-v5.html).

La sesión ya no funciona como una entrega para revisión manual. El estudiante construye y repara una solución en seis estaciones de **mastery corregible** y después enfrenta un **Boss Transfer** con datos y requisitos distintos.

## Las fuentes

- [`Datos/casos.csv`](Datos/casos.csv): snapshot operacional.
- [`Datos/eventos.csv`](Datos/eventos.csv): historia de eventos 1:N.
- [`Datos/evidencias.json`](Datos/evidencias.json): evidencia flexible/anidada.
- [`criterios.md`](criterios.md): contrato completo de evaluación.

## Mastery · 80 puntos

El estudiante puede probar, pedir ayudas, corregir y volver a intentar. Pedir ayuda no resta puntos.

1. **Inspector · 8.** Explora fuentes, identifica grano, función y claves.
2. **ER Builder · 12.** Construye CASO/EVENTO, PK, FK y cardinalidad.
3. **Flow Builder · 10.** Diseña un flujo que cumpla propiedades; no se exige un único diagrama.
4. **DDL + Mutation Hunter · 15.** Implementa integridad y diseña pruebas capaces de detectar esquemas defectuosos.
5. **SQL Debug Arena · 25.** Repara cinco consultas con partial credit y feedback progresivo.
6. **Star Builder · 10.** Define grano, medidas y dimensiones con follow-through.

## Boss Transfer · 20 puntos

La prueba final cambia el contexto sin cambiar las competencias:

- aparece `sensor_events.json` y debe incorporarse al flujo sin conectarse directamente a BI;
- aparece un requerimiento de SLA por caso y estado final;
- el servidor vuelve a ejecutar el DDL con una evolución legítima distinta de la practicada;
- las cinco consultas se prueban sobre un dataset secreto nuevo.

## Cómo funciona el SQL

El navegador usa SQL.js para feedback inmediato. Cada consulta obtiene partial credit por ejecución segura, estructura de salida y comportamiento en variaciones de entrenamiento.

Al registrar el intento, la Edge Function `learning-autograde-s15` **no confía en booleanos calculados por el navegador**. Envía el DDL y las consultas al grader server-side de Supabase/Postgres, que crea tablas temporales, ejecuta pruebas ocultas y recalcula la nota.

Las consultas de referencia finales y los datasets secretos no están publicados en el JavaScript del Workbench.

## Feedback progresivo

En SQL, la ayuda se abre en tres capas:

1. concepto que probablemente está fallando;
2. contraejemplo mínimo;
3. bloques tipo Parsons para reconstruir la estrategia.

El uso de ayudas se conserva como telemetría pedagógica, no como penalización.

## Analítica docente

El panel [`/ANDESDB/s15-analytics.html`](/ANDESDB/s15-analytics.html) permite al docente revisar tasas de éxito de primer intento y mejor intento, mejora por checkpoint, número de intentos, uso de ayudas y misconceptions frecuentes.

## Qué cuenta como buen resultado

No se busca reproducir exactamente la sintaxis del profesor. Se busca que la solución conserve el significado del dato, proteja integridad, responda bien cuando cambia el dataset y pueda adaptarse a nuevos requisitos sin depender de valores memorizados.
