# Caso final · Atención de incidentes urbanos

## Archivos y grano observado

- `casos.csv`: **12 casos**; una fila = un caso reportado y su estado actual.
- `eventos.csv`: **24 eventos**; una fila = un registro/cambio asociado a un caso.
- `evidencias.json`: **4 documentos de caso** con arreglos de evidencias semiestructuradas.

Estos granos son observaciones de los archivos. Las reglas del negocio que no estén demostradas deben quedar marcadas como hipótesis.

## Controles de referencia

Estos valores sirven para validar sin revelar una arquitectura ni un SQL únicos:

- casos: **12**
- eventos: **24**
- casos cerrados: **4** (`1001`, `1004`, `1006`, `1009`)
- casos de prioridad Alta: **5**
- casos Alta y Cerrado: **2**
- eventos huérfanos esperados: **0**
- casos con documento de evidencias: **4**

## Cuatro puertas del reto

### 1 · Significado
- Declara el grano de cada fuente.
- Formula una pregunta de negocio prioritaria.
- Separa regla confirmada de hipótesis.

### 2 · Fuente de verdad y representación
- Explica cómo conviven `casos.estado` y el historial de `eventos`.
- Decide qué hacer con `evidencias.json`: relacional, documental o híbrido.
- Justifica por patrón de acceso, consistencia, evolución y complejidad; no por extensión de archivo o moda.

### 3 · Modelo que protege
- Propón un modelo relacional para la parte operacional.
- Justifica PK/FK/NOT NULL/CHECK/UNIQUE cuando correspondan.
- Incluye una prueba válida y al menos una prueba negativa.

### 4 · Preguntas comprobadas
- Una consulta con `JOIN` cuyo grano puedas explicar.
- Una consulta agregada.
- Una consulta de tiempo o secuencia de eventos.
- Contrasta los resultados con controles conocidos.

## Escalera de validación

1. estructura y conteos;
2. referencias y huérfanos;
3. reglas/controles de negocio;
4. prueba negativa y constraint responsable;
5. estabilidad del indicador frente a multiplicación de filas.

No uses `DISTINCT` para esconder una multiplicación que no puedes explicar.

## Extensión analítica

Cuando el núcleo esté sólido, propón el **grano** de una posible tabla de hechos, medidas y dimensiones para analizar atención histórica. No es obligatorio implementar un warehouse completo.

## Preguntas de negocio sugeridas

- ¿Qué tipos de incidente acumulan más casos abiertos o en proceso?
- ¿Qué barrios concentran incidentes de prioridad Alta?
- ¿Cuánto tiempo transcurre hasta el cierre en los casos cerrados?
- ¿Qué casos tienen evidencias múltiples y cómo las representarías?

No existe una única arquitectura correcta. Sí existen respuestas no defendibles: elegir tecnología solo por volumen o formato, presentar totales sin controlarlos o usar `DISTINCT` para ocultar un problema de grano.
