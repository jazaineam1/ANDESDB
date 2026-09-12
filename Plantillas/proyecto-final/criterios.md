# Caso final · Atención de incidentes urbanos

## Propósito
El caso mezcla operación, auditoría técnica, evidencia semiestructurada y salida analítica. No existe una única arquitectura correcta: la evaluación exige declarar el grano, proteger reglas, consultar, validar y defender las decisiones.

## Archivos y grano
- `casos.csv`: **12 casos**; una fila = un caso reportado.
- `eventos.csv`: **24 eventos**; una fila = un evento de negocio/auditoría asociado a un caso. Los campos técnicos describen el contexto de ese mismo evento; no cambian su grano.
- `evidencias.json`: **4 documentos de caso** con fotos, video y comentarios; cada documento puede contener un número distinto de evidencias y metadatos opcionales.

## Qué contiene `eventos.csv`
### Negocio
`evento_id`, `caso_id`, `fecha_evento`, `tipo_evento`, `estado_anterior`, `estado_nuevo`, `agente_id`, `minutos_desde_anterior`.

### Canal y cliente
`canal_evento`, `os`, `dispositivo`, `navegador`, `ip_origen`.

### Contexto espacial
`localidad_evento`, `latitud`, `longitud`.

### Operación técnica
`payload_bytes`, `latencia_ms`, `resultado`, `http_status`.

Los valores vacíos son intencionales cuando el canal no genera ese dato. Una llamada telefónica, por ejemplo, no debe inventar navegador o IP de origen del ciudadano.

## Datos sintéticos y privacidad
- Las IP IPv4 usan exclusivamente los rangos de documentación `192.0.2.0/24`, `198.51.100.0/24` y `203.0.113.0/24`.
- Las IPv6 usan `2001:db8::/32`, reservado para documentación.
- Las coordenadas son aproximaciones didácticas a localidades de Bogotá y no corresponden a domicilios de personas.
- Los identificadores de ciudadanos y agentes son ficticios.

## Controles de referencia
Estos valores permiten validar sin revelar una única solución:
- casos: **12**
- eventos: **24**
- casos cerrados: **4** (`1001`, `1004`, `1006`, `1009`)
- casos de prioridad Alta: **5**
- casos Alta y Cerrado: **2**
- eventos huérfanos esperados: **0**
- casos con documento de evidencias: **4**
- eventos con `resultado = 'Error'`: **2**
- eventos sin `ip_origen`: **2**; ambos provienen del canal `Telefono`
- eventos de creación: **12**; uno por caso

## Requisitos mínimos
1. Declarar el grano de cada tabla/documento que propongas.
2. Separar hechos observados, reglas confirmadas e hipótesis.
3. Proponer un modelo relacional para la parte transaccional y justificar PK/FK/NOT NULL/CHECK relevantes.
4. Decidir si la telemetría de `eventos.csv` permanece en la misma tabla, se separa o se deriva a otra capa. Justificar por patrón de acceso y no solo por cantidad de columnas.
5. Decidir qué hacer con `evidencias.json`: relacional, documento, almacenamiento de objetos o arquitectura híbrida. Diferenciar **metadatos** de **bytes del archivo**.
6. Escribir al menos tres consultas de negocio: una con JOIN, una agregada y una temporal/secuencial.
7. Incluir pruebas positivas y negativas en `validaciones.sql`.
8. Proponer una salida analítica: grano de una posible tabla de hechos, medidas y dimensiones.
9. Explicar cómo tratarías datos opcionales, IP, coordenadas y tamaño de payload en producción.
10. Declarar una limitación y qué cambiarías para producción.

## Preguntas de negocio sugeridas
- ¿Qué tipos de incidente acumulan más casos abiertos/en proceso?
- ¿Qué localidades concentran incidentes de prioridad Alta?
- ¿Cuánto tiempo transcurre hasta el cierre en los casos cerrados?
- ¿Qué casos tienen evidencias múltiples y cómo las representarías?
- ¿Qué canales/OS muestran mayor latencia observada? ¿Por qué esa comparación no demuestra causalidad?
- ¿Qué ocurrió en los dos eventos con error y qué campos permiten investigarlo?
- ¿Cuánto volumen representan los payloads y las evidencias? ¿Conviene guardar los archivos binarios dentro de una tabla relacional?

## Trampas deliberadas
- `payload_bytes` no es lo mismo que `tamano_bytes` de una foto o video.
- `localidad_evento` puede repetirse en muchas filas porque describe el contexto del evento; eso no convierte el nombre de localidad en una entidad por sí solo.
- Un `resultado = 'Error'` puede quedar en la auditoría aunque el estado del caso no cambie.
- `latencia_ms = 0` en llamadas representa que no hubo una solicitud HTTP medible; no significa una aplicación instantánea.
- No uses `DISTINCT` para ocultar una multiplicación de filas.
- No elijas Cosmos DB solo porque existe JSON, ni Blob Storage solo porque un archivo es grande: empieza por el patrón de acceso y la fuente de verdad.

## Criterio de calidad
Una solución es defendible cuando otra persona puede ejecutar sus artefactos, reproducir los controles, comprender qué representa cada fila/documento y explicar por qué los datos técnicos opcionales no fueron rellenados artificialmente.
