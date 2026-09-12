# Caso final · Atención de incidentes urbanos

## Archivos
- `casos.csv`: 12 casos; una fila = un caso reportado.
- `eventos.csv`: 24 eventos; una fila = un cambio/registro de estado asociado a un caso.
- `evidencias.json`: evidencias semiestructuradas de 4 casos.

## Controles de referencia
Estos valores permiten validar sin revelar una única solución:
- casos: **12**
- eventos: **24**
- casos cerrados: **4** (`1001`, `1004`, `1006`, `1009`)
- casos de prioridad Alta: **5**
- casos Alta y Cerrado: **2**
- eventos huérfanos esperados: **0**
- casos con documento de evidencias: **4**

## Requisitos mínimos
1. Declarar el grano de cada tabla/documento que propongas.
2. Separar hechos observados de reglas supuestas.
3. Proponer un modelo relacional para la parte transaccional y justificar PK/FK/NOT NULL/CHECK relevantes.
4. Decidir qué hacer con `evidencias.json`: relacional, documento o híbrido, justificando patrón de acceso y consistencia.
5. Escribir al menos tres consultas de negocio, una de ellas con JOIN y otra agregada.
6. Incluir pruebas negativas en `validaciones.sql`.
7. Proponer una salida analítica: grano de una posible tabla de hechos, medidas y dimensiones.
8. Explicar una limitación y qué cambiarías para producción.

## Preguntas de negocio sugeridas
- ¿Qué tipos de incidente acumulan más casos abiertos/en proceso?
- ¿Qué barrios concentran incidentes de prioridad Alta?
- ¿Cuánto tiempo transcurre hasta el cierre en los casos cerrados?
- ¿Qué casos tienen evidencias múltiples y cómo las representarías?

No existe una única arquitectura correcta. Sí existen respuestas no defendibles: elegir tecnología solo por volumen, usar `DISTINCT` para ocultar multiplicación de filas o presentar un total sin validarlo contra los controles anteriores.
