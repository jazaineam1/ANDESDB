# Sesión 15 · Contrato del Workbench v5

La evaluación se realiza en [`/ANDESDB/evaluador-s15-v5.html`](/ANDESDB/evaluador-s15-v5.html). El objetivo ya no es entregar archivos para corrección manual ni responder un cuestionario. El estudiante construye, prueba, rompe y repara una solución; después enfrenta un cambio de requisitos y datos que el grader verifica en servidor.

## Estructura de la nota

La nota separa dos evidencias distintas:

| Capa | Puntos | Significado |
|---|---:|---|
| **Mastery corregible** | **80** | Qué logra después de inspeccionar, probar, recibir feedback y reparar |
| **Boss Transfer** | **20** | Si puede transferir la solución a datos y requisitos no practicados |
| **Total** | **100** | Resultado registrado por el grader server-side |

Pedir ayudas durante mastery **no descuenta puntos**. El uso de ayudas queda registrado para diagnóstico pedagógico.

## Mastery · 80 puntos

| Estación | Puntos | Evidencia |
|---|---:|---|
| Inspector de datos | 8 | rol de fuentes y claves inferidos desde los datos |
| ER Builder | 12 | entidades, atributos mínimos, PK, FK y cardinalidad |
| Flow Builder | 10 | propiedades del flujo, no coincidencia con un dibujo único |
| DDL + Mutation Hunter | 15 | constraints ejecutables y capacidad de diseñar pruebas contra mutantes |
| SQL Debug Arena | 25 | cinco consultas con partial credit y variaciones de entrenamiento |
| Star Builder | 10 | coherencia entre grano, medidas y dimensiones con follow-through |

### Inspector

Se inspeccionan `casos.csv`, `eventos.csv` y `evidencias.json`. El estudiante clasifica snapshot operacional, historia de cambios y evidencia flexible, e identifica las claves de caso y evento.

### ER Builder

El modelo debe poder representar `CASO 1:N EVENTO`, con PK, FK y los campos necesarios para responder las preguntas del reto. El Workbench puede generar un DDL base desde el modelo, pero la integridad final sigue siendo responsabilidad del estudiante.

### Flow Builder por propiedades

El grader no exige una única arquitectura canónica. Comprueba propiedades:

- las fuentes se ubican como fuentes;
- casos y eventos tienen camino hacia transformación;
- la evidencia flexible tiene un camino persistente hacia transformación;
- transformación llega a warehouse y BI;
- ninguna fuente cruda salta directamente a BI.

### DDL + Mutation Hunter

El DDL se prueba localmente y se vuelve a probar en servidor. Se verifican duplicados, FK, `NOT NULL`, negativos y evolución legítima del dominio.

Mutation Hunter evalúa una competencia distinta: detectar qué prueba mínima mata cinco esquemas defectuosos conocidos (sin PK, sin FK, sin `NOT NULL`, sin regla de no-negativos y con un dominio de estado rígido inventado).

### SQL Debug Arena · partial credit

Cada una de las cinco consultas vale 5 puntos de mastery. El puntaje se descompone en:

1. consulta segura y ejecutable;
2. columnas requeridas;
3. resultado correcto sobre datos visibles;
4. comportamiento correcto en una variación de entrenamiento;
5. comportamiento correcto en otra variación de entrenamiento.

El servidor vuelve a ejecutar las consultas sobre **cuatro escenarios ocultos** distintos de los visibles en el navegador. Las consultas de referencia finales no se publican en el JavaScript del estudiante.

Las consultas trabajan:

- prioridad Alta por barrio;
- último evento temporal;
- minutos acumulados hasta cierre;
- protección del grano después de un JOIN 1:N;
- promedio por caso antes de agregar por tipo.

### Feedback progresivo

Las ayudas SQL se abren por capas:

- primer pedido: concepto que probablemente está fallando;
- segundo pedido: contraejemplo mínimo;
- tercer pedido: bloques tipo Parsons para reconstruir la estrategia.

La ayuda sirve para aprender durante mastery, no para decidir la nota de transferencia.

### Star Builder · follow-through

El grader acepta más de una decisión inicial si la solución posterior es internamente coherente. Puede trabajarse a grano evento o grano caso, siempre que las medidas sean compatibles con ese grano y las dimensiones requeridas estén disponibles. Un error temprano no borra automáticamente toda la evidencia posterior correcta.

## Boss Transfer · 20 puntos

El Boss no repite las mismas pruebas del mastery.

| Criterio | Puntos |
|---|---:|
| El DDL acepta una evolución legítima nueva sin perder integridad | 5 |
| Las cinco consultas sobreviven a un dataset secreto nuevo | 5 |
| El flujo incorpora `sensor_events.json` sin atajo directo a BI | 5 |
| El modelo analítico se adapta a SLA por caso y estado final | 5 |

Los datos secretos y las soluciones SQL de referencia viven en el grader server-side, no en la página pública.

## Seguridad de la calificación

El navegador puede ejecutar pruebas formativas rápidas, pero **no decide la nota registrada**. Al enviar un intento, el servidor recibe DDL, consultas y estado de los builders, vuelve a ejecutar las pruebas y recalcula mastery y transferencia.

Un valor enviado desde DevTools como `q3=true` no es aceptado como evidencia suficiente.

## Analítica docente

El panel `s15-analytics.html` permite revisar de forma agregada:

- tasa de éxito por checkpoint en primer intento;
- tasa de éxito en el mejor intento;
- mejora entre primer y mejor intento;
- mediana de intentos;
- uso medio de ayudas;
- misconceptions frecuentes.

La intención es usar el autograder también para mejorar la enseñanza, no solo para producir notas.

## Mutation testing del propio autograder

El repositorio incluye mutantes SQL y DDL conocidos. El CI debe demostrar que el grader detecta errores típicos como `MAX(estado)` usado como “último evento”, conteos inflados por JOIN 1:N, promediar filas de eventos en vez de casos, ausencia de FK o dominios rígidos inventados.
