# Curación manual del benchmark · estado v3

Esta rama dejó de tratar las presentaciones como texto intercambiable.

## Decisión después de las auditorías v1 y v2

1. **Sesiones maduras protegidas.** S2–S6 y S8–S12 permanecen byte por byte iguales a `main`; CI falla si vuelven a modificarse en esta rama. S7 conserva únicamente su criterio de salida.
2. **CI solo valida.** Ningún workflow aplica transformaciones ni hace commits. `aplicar-benchmark-rama.yml` usa `contents: read` y ejecuta los validadores de curso, curación e hilo.
3. **S1 deja de ser un recurso suelto.** Tiene recorrido completo, pretest reutilizado en S16, preparación técnica y registro en `tools/curso.json`.
4. **S13 se rehízo contra M5C2.** El centro es partición, clusterización, pruning y bytes/costo en BigQuery. Usa la ruta Beginner y los laboratorios reales de partición (`562865`), clusterización (`562975`) y práctica adicional (`575654`). Además diferencia correctamente la recreación necesaria para cambiar una tabla no particionada a particionada de la posibilidad actual de modificar la especificación de clustering.
5. **S14 continúa S8/S11/S13.** ARRAY, STRUCT, UNNEST y formatos preceden a dos bloques prácticos y a la transferencia Azure.
6. **S15 ya tiene caso y datos.** El desafío usa incidentes urbanos, tres fuentes, controles de referencia, pruebas negativas y defensa de code ownership.
7. **S16 ya practica.** Incluye 13 escenarios distribuidos entre los cuatro dominios DP-900 y convierte los errores en un plan individual.
8. **Las guías docentes son específicas.** Cada sesión tiene pregunta central, atascos esperables, intervención, criterio de no-avance y regla de cierre propios.

## Regla de gobierno

Los scripts de autoedición pedagógica usados en las primeras pasadas fueron **eliminados de la rama**. No quedan como mecanismo activo ni como herramienta disponible para volver a ejecutar accidentalmente transformaciones globales. La aceptación de cambios pedagógicos requiere lectura humana del diff; CI solo detecta regresiones objetivas.

## Lo que CI comprueba ahora

- sesiones maduras sin diferencias frente a `origin/main`;
- S1 registrada y con descarga autorreferente;
- S13 alineada a M5C2, con partición, clustering, enlaces reales y evidencia de bytes;
- S14 con ARRAY/STRUCT/UNNEST y dos bloques prácticos;
- S15 con dataset real y controles reproducibles;
- S16 con banco de escenarios y sin mapa duplicado;
- guías docentes con secciones sustantivas y sin bloques críticos duplicados;
- recorrido S1–S16 completo en manifiesto/documentación;
- ningún cambio en CSS compartido;
- el propio job no modifica el árbol de trabajo.

La rama no se considera lista por el solo hecho de que CI esté verde: el último gate sigue siendo una revisión humana del diff contra `main`.
