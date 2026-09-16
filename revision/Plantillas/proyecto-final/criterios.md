# Sesión 15 · Contrato de evaluación automática

La evaluación se realiza en `evaluador-s15.html`. No se califica un paquete de archivos manualmente. Cada estudiante trabaja sobre las mismas fuentes, recibe retroalimentación inmediata y puede corregir antes de registrar otro intento.

## Rúbrica · 100 puntos

- **20 · Grano y lectura de fuentes.** Cinco decisiones deterministas sobre qué representa cada fuente, cardinalidad y riesgo de multiplicar filas.
- **25 · DDL e integridad.** Cinco pruebas ejecutadas sobre el esquema: PK, FK, obligatoriedad, minutos no negativos y capacidad de aceptar un estado nuevo no prohibido por el negocio.
- **35 · SQL y validación.** Cuatro consultas se ejecutan sobre los datos visibles y sobre variaciones automáticas. Se comparan resultados, no una sintaxis específica.
- **20 · Arquitectura y adaptabilidad.** Cuatro escenarios cerrados obligan a decidir a partir de requisitos de acceso, consistencia, carga y evolución.

## Fuentes

- `casos.csv`: una fila = un caso reportado y su estado actual.
- `eventos.csv`: una fila = un evento/cambio asociado a un caso.
- `evidencias.json`: un documento = un caso con un arreglo de evidencias.

Los datos base contienen 12 casos, 24 eventos y 4 documentos de evidencias. Esos números sirven para explorar, pero **no bastan para aprobar las consultas**: el evaluador agrega datos en copias internas.

## Contrato del DDL

La herramienta solicita dos tablas con nombres y columnas mínimas conocidas:

- `caso(caso_id INTEGER, fecha_creacion TEXT, tipo TEXT, prioridad TEXT, estado TEXT, barrio TEXT)`
- `evento(evento_id TEXT, caso_id INTEGER, fecha_evento TEXT, estado TEXT, minutos_desde_anterior INTEGER)`

Reglas confirmadas: identificadores únicos, evento asociado a un caso existente, campos listados obligatorios y minutos no negativos. **No está confirmado** que `Abierto`, `En_proceso` y `Cerrado` sean la lista completa de estados; por eso el evaluador prueba el estado nuevo `Escalado`.

## Consultas evaluadas

El evaluador expone `casos_src` y `eventos_src` y pide:

1. prioridad Alta por barrio → `barrio, casos_alta`;
2. estado actual frente al último evento → `caso_id, estado_actual, ultimo_estado`;
3. minutos acumulados para casos cuyo último evento es Cerrado → `caso_id, minutos_hasta_cierre`;
4. control de grano tras unir casos y eventos → `total_casos, total_eventos, casos_alta`.

Cada consulta debe seguir siendo correcta cuando aparecen casos/eventos adicionales. No se debe usar un resultado fijo ni ocultar un problema de grano con un número hardcodeado.

## Retroalimentación e intentos

El botón final vuelve a ejecutar todas las pruebas, entrega puntaje por dimensión y explica cada criterio fallido. Si el estudiante está autenticado en ANDESDB, el intento se registra automáticamente en el LMS con código, desglose y feedback. Puede corregir y volver a intentar; cada intento queda en el historial.
