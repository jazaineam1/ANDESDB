# Sesión 15 · Atención de incidentes urbanos

La herramienta principal es el **S15 Workbench**: [`/ANDESDB/evaluador-s15.html`](/ANDESDB/evaluador-s15.html).

No necesitas preparar un paquete de archivos para revisión manual. La sesión funciona como un laboratorio integrador de aproximadamente dos horas de trabajo activo, con siete estaciones conectadas y retroalimentación inmediata.

## Qué vas a hacer

1. **Inspector de datos.** Explora `casos.csv`, `eventos.csv` y `evidencias.json`; identifica su función, grano y claves.
2. **Modelador ER.** Arrastra campos a `CASO` y `EVENTO`, marca PK, crea la FK y define la relación 1:N.
3. **Flow Builder.** Construye el camino desde las fuentes hasta persistencia operacional, transformación, warehouse y BI.
4. **DDL Lab.** Convierte el modelo en SQL y haz que pase seis pruebas de integridad.
5. **SQL Debug Arena.** Repara cinco consultas defectuosas; cada una se prueba sobre los datos visibles y sobre variaciones automáticas.
6. **Star Builder.** Transfiere el caso a una salida analítica definiendo grano, medidas y dimensiones.
7. **Chaos / Change Lab.** La herramienta introduce duplicados, huérfanos, un estado nuevo, una evidencia de tipo nuevo y datos adicionales para comprobar si toda la solución resiste.

## Fuentes

- [`Datos/casos.csv`](Datos/casos.csv): snapshot operacional.
- [`Datos/eventos.csv`](Datos/eventos.csv): historia de eventos 1:N.
- [`Datos/evidencias.json`](Datos/evidencias.json): documentos con arreglos de evidencias.
- [`criterios.md`](criterios.md): contrato completo de los 37 checkpoints.

## Cómo funciona la evaluación

La escala final es de 100 puntos:

- Inspector: 10
- Modelador ER: 15
- Flow Builder: 15
- DDL Lab: 15
- SQL Debug Arena: 25
- Star Builder: 10
- Chaos / Change Lab: 10

El Workbench guarda el borrador en tu navegador. Puedes comprobar una estación, leer la retroalimentación, corregir y volver a probar. Al final, **Evaluar todo y registrar intento** vuelve a ejecutar la solución completa y, si tienes sesión iniciada en ANDESDB, registra el puntaje y el detalle en el LMS.

## Qué se espera

No se busca que copies la sintaxis exacta del profesor. Se evalúa comportamiento:

- que el modelo tenga el grano y relaciones correctas;
- que la base rechace datos inválidos sin bloquear cambios legítimos;
- que las consultas respondan correctamente aunque cambien los datos;
- que la arquitectura tenga caminos coherentes para operación, evidencia flexible y analítica;
- que puedas trasladar el caso a un modelo analítico;
- que la solución resista el Chaos Lab.

La corrección forma parte del reto: un segundo intento mejor que el primero es evidencia de aprendizaje.