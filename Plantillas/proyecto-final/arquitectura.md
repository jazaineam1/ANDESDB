# Arquitectura · proyecto final

## 1. Pregunta que guía la arquitectura
¿Qué necesita hacer el sistema y qué evidencia debe conservar?

## 2. Componentes
Describe solo los componentes necesarios. Para cada uno indica responsabilidad y fuente de verdad.

| Componente | Responsabilidad | Tecnología/familia | Fuente de verdad | Justificación |
|---|---|---|---|---|
| | | | | |
| | | | | |

## 3. Flujo de datos
Dibuja o describe el recorrido:

`fuente → captura → validación → almacenamiento → consulta/transformación → consumo`

Señala dónde quedan:
- casos y cambios de estado;
- telemetría de eventos (OS, dispositivo, IP, ubicación, tamaño, latencia, resultado);
- metadatos de evidencias;
- bytes de fotos/videos;
- salida analítica.

## 4. Decisión SQL / documento / objetos / híbrida
No respondas por formato. Explica para cada decisión:
1. patrón de acceso;
2. consistencia requerida;
3. estructura/evolución;
4. volumen y latencia;
5. costo/riesgo operativo.

## 5. Salida analítica
- Pregunta analítica principal:
- Grano de la tabla de hechos propuesta:
- Medidas:
- Dimensiones:
- ¿Batch, streaming o ambos? ¿Por qué?

## 6. Privacidad, seguridad y retención
Explica cómo tratarías IP, coordenadas, evidencias y permisos. Distingue datos del ciudadano, metadatos técnicos y archivos binarios.

## 7. Riesgos y límites
Incluye al menos:
- un riesgo de calidad/integridad;
- un riesgo de privacidad/seguridad;
- un riesgo de costo/rendimiento;
- una decisión que cambiaría si el volumen creciera 100×.
