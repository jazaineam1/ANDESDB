# Sesión 15 · Contrato del Workbench integrador

La evaluación se realiza en [`/ANDESDB/evaluador-s15.html`](/ANDESDB/evaluador-s15.html). No es un cuestionario ni una entrega de seis archivos para corrección manual. El estudiante construye una solución dentro de **siete herramientas encadenadas**; cada herramienta produce evidencia verificable y el intento final registra el resultado en el LMS.

La ruta está diseñada para unas **2 horas de trabajo activo orientativo**. El ritmo no es punitivo: se puede volver a una estación, reparar lo que falló y ejecutar de nuevo.

## Rúbrica · 100 puntos · 37 checkpoints

| Estación | Puntos | Qué produce el estudiante | Cómo se valida |
|---|---:|---|---|
| 1. Inspector de datos | 10 | mapa de función de fuentes + claves observadas | 5 checkpoints sobre grano, rol y claves |
| 2. Modelador ER | 15 | entidades CASO/EVENTO, PK, FK y cardinalidad | 6 checkpoints sobre campos y relación |
| 3. Flow Builder | 15 | flujo desde fuentes hasta BI | 5 checkpoints sobre capas y conexiones |
| 4. DDL Lab | 15 | esquema SQL ejecutable | 6 pruebas reales de integridad |
| 5. SQL Debug Arena | 25 | cinco consultas reparadas | cada consulta corre sobre datos base y variaciones |
| 6. Star Builder | 10 | grano de hecho, medidas y dimensiones | 5 checkpoints de diseño analítico |
| 7. Chaos / Change Lab | 10 | la solución completa frente a cambios | 5 pruebas integradas que reutilizan DDL, queries y flujo |

## 1 · Inspector de datos

El estudiante inspecciona `casos.csv`, `eventos.csv` y `evidencias.json`. La herramienta muestra perfiles de filas, columnas, IDs, vacíos, documentos y tipos de evidencia. Después debe arrastrar cada fuente al rol correcto y ubicar las claves observadas.

Se valida:

- `casos.csv` como snapshot operacional;
- `eventos.csv` como historia de cambios;
- `evidencias.json` como evidencia flexible/anidada;
- `caso_id` como clave de caso;
- `evento_id` como clave de evento.

## 2 · Modelador ER drag-and-drop

Los campos se arrastran a las entidades `CASO` y `EVENTO`. El estudiante marca PK mediante interacción directa, define la FK y establece la cardinalidad.

El modelo correcto debe contener:

- `caso(caso_id, fecha_creacion, tipo, prioridad, estado, barrio)`;
- `evento(evento_id, caso_id, fecha_evento, estado, minutos_desde_anterior)`;
- PK en `caso.caso_id` y `evento.evento_id`;
- FK `evento.caso_id → caso.caso_id`;
- relación `CASO 1:N EVENTO`.

El Workbench puede generar un **DDL inicial** desde el modelo construido. Ese DDL todavía debe ser endurecido por el estudiante.

## 3 · Flow Builder

El estudiante arrastra nodos a tres capas —fuentes, persistencia operacional y analítica— y crea conexiones nodo a nodo.

El validador busca un flujo funcional:

- `casos` y `eventos` alimentan un store relacional operacional;
- `evidencias` alimenta una representación flexible/documental;
- ambos caminos llegan a transformación;
- transformación alimenta un warehouse;
- warehouse alimenta BI;
- las fuentes crudas no saltan directamente a BI.

## 4 · DDL Lab

El SQL se ejecuta localmente con SQL.js. Se realizan seis pruebas de comportamiento:

1. la PK de caso rechaza duplicados;
2. la PK de evento rechaza duplicados;
3. la FK rechaza eventos huérfanos;
4. los campos requeridos son `NOT NULL`;
5. `minutos_desde_anterior < 0` es rechazado;
6. un estado nuevo llamado `Escalado` puede entrar porque el negocio no declaró un dominio cerrado.

La sexta prueba evita convertir accidentalmente los valores observados hoy en una regla eterna.

## 5 · SQL Debug Arena

El estudiante no empieza desde una hoja en blanco: recibe **cinco consultas defectuosas** y debe repararlas.

1. prioridad Alta por barrio;
2. estado actual frente al último evento real;
3. minutos acumulados para casos cuyo último evento es Cerrado;
4. conteos después de un JOIN 1:N sin inflar el grano de caso;
5. promedio de minutos por caso antes de agregar por tipo.

Cada consulta se ejecuta sobre los datos visibles y sobre variaciones automáticas. Una consulta que funciona solo porque los datos actuales tienen determinada forma no aprueba.

## 6 · Star Builder

La misma realidad cambia de propósito: ahora se necesita análisis histórico por fecha, barrio, tipo, prioridad y estado. El estudiante arrastra piezas para construir:

- grano del hecho = un evento;
- medidas = conteo de eventos y minutos;
- dimensiones = fecha, barrio, tipo, prioridad y estado.

## 7 · Chaos / Change Lab

No hay preguntas nuevas. La herramienta reutiliza la solución ya construida y cambia el escenario:

- intenta insertar un duplicado;
- intenta insertar un evento huérfano;
- introduce el estado `Escalado`;
- introduce una evidencia nueva tipo `sensor` con atributos adicionales y comprueba que el flujo documental tiene salida hacia analítica;
- vuelve a ejecutar las cinco consultas sobre un escenario con nuevos casos y eventos.

Esta estación es la prueba integradora: no puede aprobarse memorizando una opción correcta.

## Retroalimentación e intentos

El Workbench mantiene un puntaje provisional por estación y un conteo de checkpoints. Al ejecutar el intento final:

1. recalcula las siete estaciones;
2. devuelve puntaje y lista de checkpoints pendientes;
3. guarda el estado del modelo, flujo, diseño estrella, pruebas y código;
4. registra el intento en el LMS si el estudiante está autenticado;
5. permite corregir y volver a enviar.

La evidencia relevante no es solo la nota final: también es la evolución entre intentos.

## Alcance técnico

El SQL se ejecuta en el navegador con SQL.js, por lo que la clase no depende de 40–50 conexiones concurrentes a un servidor de base de datos. La evaluación es adecuada como actividad formativa y de curso; no debe interpretarse como un sistema antifraude de examen de alta seguridad.