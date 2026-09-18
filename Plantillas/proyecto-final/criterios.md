# Sesión 15 · Contrato público del Workbench integral v7

S15 integra S2–S14 y separa **dominio (80 puntos)** de **transferencia (20 puntos)**. La fuente de verdad de la nota es el grader del servidor; el navegador sirve para ejecutar, practicar y reunir evidencia, pero el servidor vuelve a comprobar las respuestas.

## Modos

- **Práctica:** feedback y ayudas sin límite de nota; úsalo para aprender antes de evaluar.
- **Evaluación:** el puntaje local solo se revela al pulsar **Comprobar**, con un máximo de tres comprobaciones por estación y tres pruebas por consulta. Las pistas no restan puntos, pero se registran. El envío final está limitado por el servidor.
- El estudiante debe incluir una **justificación breve** por estación. La nota automática mide el producto ejecutable; la justificación queda como evidencia para revisión docente y defensa.

## Rúbrica

| Estación | Puntos | Evidencia |
|---|---:|---|
| SQL Arena | 15 | cinco consultas ejecutables que respetan el contrato visible y sobreviven a variaciones |
| Modelo ER + 3FN | 12 | entidades, claves, relación y descomposición normalizada |
| DDL Mutation Lab | 10 | restricciones observables mediante pruebas negativas + razonamiento de evolución |
| Document Lab | 10 | embeber/referenciar, SQL/NoSQL y partición documental según requisitos |
| Warehouse Builder | 13 | grano único, medidas, dimensiones, OLTP/OLAP y decisión de latencia |
| BigQuery físico | 10 | partición y clustering derivados de un workload explícito |
| Nested BigQuery | 10 | esquema anidado coherente con los datos, formatos y UNNEST ejecutado localmente |
| Boss Transfer | 20 | caso nuevo con workload asignado por estudiante y decisiones recalculadas en servidor |

## Reglas de justicia de la evaluación

1. Una respuesta correcta no debe fallar por un requisito de formato no declarado. Por eso cada consulta SQL publica columnas, redondeo y población esperada.
2. Los escenarios ocultos cambian datos, no las reglas de negocio. No introducen desempates temporales o contratos que no aparezcan en el enunciado.
3. El resultado que se muestra al estudiante corresponde siempre a los **datos base**. Las variaciones sirven para comprobar robustez y se reportan por nombre, no sustituyen silenciosamente la tabla visible.
4. El DDL inicial contiene columnas y tipos, **no** PK/FK/NOT NULL/CHECK resueltos.
5. El modelo ER usa selectores explícitos para FK y cardinalidad y rotula el origen de campos homónimos.
6. El diseño de BigQuery parte de frecuencias de consulta visibles. El simulador separa la estimación previa por partición del ahorro conceptual posterior por clustering.
7. La consulta de datos anidados elimina comentarios antes de validar, acepta alias equivalentes y se ejecuta con DuckDB-Wasm; escribir UNNEST en un comentario no genera crédito.
8. El Boss no publica una clave fija. El servidor asigna un workload estable por estudiante y vuelve a calcular la transferencia sin confiar en localStorage ni en puntajes del cliente.

## Contenido evaluado

El diagnóstico inicial usa datos imperfectos para distinguir hallazgos confirmados de hipótesis. S15 también comprueba decisiones SQL/NoSQL, una partition key documental, batch frente a streaming según latencia y evolución controlada de dominios.

El Boss plantea un problema de pedidos donde existen métricas en niveles distintos y un patrón de consulta variable. La evaluación pide **derivar** el diseño y explicar el razonamiento; este contrato describe las competencias, no las respuestas.

## Política de IA y colaboración

Se permite consultar documentación y herramientas de apoyo según las reglas del curso. La evidencia final no es una frase copiada: el estudiante debe poder explicar una decisión, modificarla ante un requisito nuevo y volver a ejecutar la validación correspondiente.

## Cierre

La evaluación se considera completa cuando el estudiante puede:
- reproducir un resultado;
- mostrar una entrada inválida rechazada por su diseño;
- explicar una decisión de representación o arquitectura;
- indicar qué control volvería a ejecutar después de un cambio.
