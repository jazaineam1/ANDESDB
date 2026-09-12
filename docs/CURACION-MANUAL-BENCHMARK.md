# Curación manual del benchmark · estado v3

Esta rama dejó de tratar las presentaciones como texto intercambiable.

## Decisión después de las auditorías v1 y v2

1. **Sesiones maduras protegidas.** S2–S6 y S8–S12 permanecen byte por byte iguales a `main`; CI falla si vuelven a modificarse en esta rama. S7 conserva únicamente su criterio de salida.
2. **CI solo valida.** Ningún workflow aplica transformaciones ni hace commits. `aplicar-benchmark-rama.yml` usa `contents: read` y ejecuta los validadores reales de curación e hilo.
3. **S1 deja de ser un recurso suelto.** Tiene 165 minutos de recorrido, pretest reutilizado en S16, preparación técnica y registro completo en `tools/curso.json`.
4. **S13 se rehízo contra el objetivo real del módulo.** El centro es partición, clusterización, pruning y bytes/costo en BigQuery; no repetir las agregaciones de S12 en otro motor.
5. **S14 se rehízo como continuidad de S8/S11/S13.** ARRAY, STRUCT, UNNEST y formatos preceden a dos bloques prácticos y a la transferencia Azure.
6. **S15 ya tiene caso y datos.** El desafío usa incidentes urbanos, tres fuentes, controles de referencia, pruebas negativas y una defensa de code ownership.
7. **S16 ya practica.** Incluye 13 escenarios distribuidos entre los cuatro dominios DP-900 y convierte los errores en un plan individual.

## Regla de gobierno

Los scripts `aplicar-mejoras-benchmark.py`, `cerrar-auditoria-benchmark.py`, `corregir-residuos-cierre.py` y similares quedan como registro histórico del experimento, **no como mecanismo de edición del curso**. La aceptación de cambios pedagógicos requiere lectura humana del diff y CI se limita a detectar regresiones objetivas.

## Lo que CI comprueba ahora

- sesiones maduras sin diferencias frente a `origin/main`;
- S1 registrada y con descarga autorreferente;
- S13 con partición, clustering, enlaces de laboratorio y evidencia de bytes;
- S14 con ARRAY/STRUCT/UNNEST y dos bloques prácticos;
- S15 con dataset real del caso final y controles reproducibles;
- S16 con banco de escenarios, sin mapa duplicado;
- recorrido S1–S16 completo en manifiesto/documentación;
- ningún cambio en CSS compartido;
- el propio job no modifica el árbol de trabajo.

La rama no se considera lista para fusionar por el hecho de que CI esté verde: el último gate es una revisión humana del diff contra `main`.
