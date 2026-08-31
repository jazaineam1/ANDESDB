# ANDESDB Learning OS · SuperLab experimental

Este directorio prueba la capa reutilizable de experiencia de aprendizaje sin modificar el contenido vigente de las sesiones.

## Qué funciona en este vertical

- recorrido visible S2–S9;
- enlaces a las sesiones actuales de `main` hasta S9;
- SuperLab SQL local para S2–S5 usando el SQL.js ya versionado en el repositorio;
- base de práctica cargada en memoria sin instalar software;
- explorador de tablas y columnas;
- misiones declarativas;
- comparación por resultado y no por texto de la consulta;
- feedback de columnas/filas/orden;
- traducción básica de errores SQL;
- pistas progresivas;
- explicación determinística de cláusulas;
- visualizador del orden lógico SQL;
- XP, racha y mapa de habilidades en `localStorage`;
- SQL del día/repetición;
- modo principiante y modo profesional;
- señal de semáforo de clase con event bus local;
- telemetría local-first con endpoint remoto opcional.

## Qué deliberadamente NO se finge

- S6–S9 siguen usando sus experiencias reales actuales; el SuperLab no las reemplaza.
- S9 requiere PostgreSQL real según la decisión pedagógica del curso; SQL.js no se presenta como PostgreSQL.
- las pruebas de práctica viven en el cliente y por tanto son inspeccionables;
- evaluaciones calificables, tests secretos, licencias y notas deben ejecutarse/guardarse en backend;
- LTI requiere registro institucional, claves privadas y endpoints server-side: no se puede resolver con un HTML estático.

## Ejecución

Servir el repositorio por HTTP y abrir:

```text
/learning-os/
```

No abrir con `file://` porque WebAssembly y políticas del navegador pueden impedir cargar el motor.

## Atajos

- `Ctrl+Enter` / `Cmd+Enter`: ejecutar SQL.
- `Tab`: insertar dos espacios.
- `Modo profesional`: oculta chips y pistas para retirar andamiaje.

## Backend opcional

El runtime no depende de un proveedor. Si se define antes de `app.js`:

```js
window.ANDESDB_LEARNING_OS_CONFIG = {
  eventEndpoint: 'https://example.edu/events'
};
```

los eventos pueden enviarse con `sendBeacon`. Sin configuración, quedan solo en el dispositivo y el SuperLab continúa funcionando.

## Próximo vertical

1. vendorizar/probar PGlite bajo `EngineAdapter`;
2. extraer catálogo a JSON validable;
3. crear evaluador remoto para `assessment=graded`;
4. gradebook/rúbricas;
5. LTI 1.3/Advantage para Brightspace;
6. separar `course-pack` de `runtime` para crear nuevos cursos sin copiar código.

Ver `docs/ARQUITECTURA-LEARNING-OS-CERO-COSTO.md`.
