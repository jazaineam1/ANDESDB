# Proyecto final ANDESDB · S15

## Objetivo
Resolver un caso nuevo de atención de incidentes urbanos sin recibir una arquitectura preseleccionada. El equipo debe demostrar que entiende el problema, el grano, las reglas, la implementación, la validación y la transferencia a una arquitectura de datos.

## Datos
En `Datos/` encontrarás:

- `casos.csv` · 12 casos; una fila = un caso.
- `eventos.csv` · 24 eventos; una fila = una acción/auditoría de un caso, con contexto técnico (OS, dispositivo, navegador, IP, ubicación, tamaño, latencia y resultado).
- `evidencias.json` · 4 documentos de caso con fotos, video, comentarios y metadatos opcionales.

Lee `criterios.md` **antes de crear tablas**. Allí están el significado de los campos, los controles conocidos y las trampas deliberadas.

## Entregables
Completa y entrega:

1. `decisiones.md` · problema, granos, reglas/hipótesis, tecnología, validación y limitaciones.
2. `modelo.png` · modelo propuesto y cardinalidades.
3. `schema.sql` · DDL reproducible.
4. `queries.sql` · consultas que respondan preguntas del caso.
5. `validaciones.sql` · controles y pruebas negativas.
6. `arquitectura.md` · fuentes, almacenamiento, flujo y salida analítica.

## Orden de trabajo recomendado

`diagnosticar → declarar grano → modelar → construir → consultar → validar → decidir arquitectura → defender`

No empieces por escoger Supabase, MongoDB, BigQuery o Azure. Primero explica qué necesita el caso.

## Reglas de trabajo
- No inventes datos para llenar NULL que tienen sentido por el canal.
- No uses `DISTINCT` para esconder una multiplicación de filas.
- Distingue el tamaño de una solicitud (`payload_bytes`) del tamaño de un archivo de evidencia (`tamano_bytes`).
- Si guardas metadatos y archivos en tecnologías distintas, declara cuál es la fuente de verdad y cómo se enlazan.
- Las IP y coordenadas del dataset son sintéticas/didácticas; no representan personas reales.
- Puedes usar herramientas de IA, pero debes poder explicar y modificar cualquier línea entregada.

## Cierre
El proyecto no está listo cuando “corre”. Está listo cuando puedes reproducir un resultado, mostrar una prueba inválida que tu diseño rechaza y defender por qué cada decisión existe.
