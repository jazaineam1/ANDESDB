# Contrato de validación para IA antes de hacer push · ANDESDB

Este documento define las comprobaciones **obligatorias** que debe realizar cualquier IA, agente o automatización que modifique ANDESDB antes de publicar cambios en GitHub.

La regla principal es simple:

> **Una IA no debe hacer push si no puede explicar qué cambió, qué fuente de verdad modificó, qué validaciones ejecutó y qué riesgo residual queda.**

Este repositorio es público y además alimenta GitHub Pages. Un push puede afectar directamente lo que ven los estudiantes, activar Actions que vuelven a escribir `main` y desplegar una nueva versión pública. Por eso la validación se divide en tres fases: **antes del push, durante la publicación y después del push**.

---

## 1. Fuentes de verdad que la IA debe respetar

### Recorrido y estado del curso

`tools/curso.json`

Es la fuente principal para:

- 16 sesiones;
- sesión actual;
- títulos, descripciones y estados;
- enlaces visibles en la portada;
- herramientas y recursos públicos;
- metodología global.

`index.html` es un archivo generado. No se debe utilizar como fuente principal para cambiar el recorrido.

### Diseño pedagógico S6–S16

`assets/learning/learning-plan.json`

Define:

- objetivos;
- micro-preguntas DP-900;
- sesiones autónomas;
- publicación de soluciones;
- servicios cloud reales;
- diferenciación técnica.

### Metodología

`docs/METODOLOGIA-S6-S16.md`

La IA debe conservar las decisiones pedagógicas documentadas allí.

### Portada

- `tools/construir-index.py`
- `tools/estilo-portada.css`

La portada se regenera. Si se cambia el contenido estructural, se cambia primero la fuente correspondiente y después se regenera.

### Integración de experiencia

`tools/integrar-experiencia.py`

Inyecta la infraestructura común en las páginas publicadas. La diferenciación técnica solo se usa donde aporta.

---

## 2. Validaciones obligatorias antes de hacer push

### A. Revisar el alcance real del cambio

Antes de publicar, la IA debe inspeccionar el diff completo y responder internamente:

1. ¿Qué archivos cambiaron?
2. ¿Todos esos archivos debían cambiar?
3. ¿Apareció algún archivo generado o temporal no esperado?
4. ¿Se modificó accidentalmente material heredado?
5. ¿Se cambió una fuente de verdad o únicamente un archivo derivado?
6. ¿Hay cambios producidos por otro Action o por otro agente desde que comenzó la tarea?

Si `main` cambió mientras la IA trabajaba, debe actualizar su referencia antes de continuar. Los workflows que escriben en el repositorio usan el grupo de concurrencia `andesdb-writes`; aun así, la IA debe evitar publicar sobre una revisión obsoleta.

### B. Privacidad y seguridad

ANDESDB es público. Antes del push se debe comprobar que no se incluya:

- nombres, correos u otros datos personales de estudiantes;
- archivos de encuestas o respuestas;
- claves API;
- tokens GitHub;
- credenciales cloud;
- contraseñas;
- cadenas de conexión con secretos;
- claves privadas;
- el valor de `SOLUTIONS_PASSPHRASE`;
- soluciones de S7, S10 o S13 en texto plano antes de la hora de publicación.

La IA debe respetar `.gitignore`, especialmente las reglas para encuestas, material docente, respuestas de concursos y `soluciones_privadas/`.

**Si un secreto ya llegó a un diff, no basta con borrarlo del último archivo: se considera potencialmente expuesto y se debe avisar.**

### C. Material de estudiantes vs. material heredado/docente

El material heredado puede permanecer en GitHub, pero no debe aparecer como material vigente en la página hasta haber sido reconstruido.

Antes del push:

- revisar `tools/curso.json`;
- verificar que no se hayan añadido enlaces visibles a presentaciones heredadas por accidente;
- no publicar libretos, respuestas, evaluaciones internas ni planes docentes;
- no convertir un PPTX/DOCX heredado en recurso público solo porque ya existe en el repositorio.

### D. Reglas pedagógicas vigentes

La IA debe conservar estas decisiones:

- no existe progreso personal persistente entre dispositivos;
- no se usa `localStorage` como expediente de avance del estudiante;
- S6 no lleva capa artificial de Ruta/Núcleo/Reto;
- la diferenciación técnica se reserva principalmente para S9, S11, S12, S13, S14 y S15;
- S7, S10 y S13 incluyen al menos 60 minutos de trabajo autónomo guiado;
- las soluciones de S7, S10 y S13 se publican a las 20:00 `America/Bogota`;
- desde S6 existen al menos dos micro-preguntas DP-900 por sesión;
- S9, S11, S13 y S14 deben mostrar servicios cloud reales;
- un fallback local nunca sustituye la experiencia con el servicio real;
- la PWA puede instalarse mediante el navegador, pero ANDESDB no debe mostrar banners, modales ni llamados de instalación que parezcan publicidad.

### E. JavaScript y PWA

Si se modifica JavaScript, como mínimo debe pasar `node --check`.

Archivos prioritarios:

```bash
node --check assets/learning/learning-core.js
node --check assets/pwa-install.js
node --check service-worker.js
node --check Presentaciones/M3/sql-lab-s6.js
node --check assets/learning/analytics-fallback-link.js
```

Si un archivo no existe todavía, se omite únicamente ese archivo.

Si se modifica `service-worker.js` de forma que cambie recursos, estrategias de caché o experiencia visible, la IA debe revisar si es necesario incrementar `VERSION`. No hacerlo puede dejar a Android/Chrome usando recursos antiguos.

Si se cambia el icono SVG, no se deben fabricar manualmente PNG inconsistentes. El workflow `Generar iconos PWA` regenera 192, 512 y maskable.

### F. SQL ejecutable y laboratorios

Si se modifica SQL, un laboratorio o una base de datos:

- ejecutar las consultas contra el motor real utilizado por la práctica cuando sea posible;
- verificar que la consulta devuelve el número/tipo de filas esperado;
- comprobar al menos un caso de borde relevante;
- evitar operaciones destructivas en los laboratorios de estudiante salvo que la sesión las requiera explícitamente;
- comprobar que una respuesta correcta no quede expuesta en JavaScript o HTML si debe permanecer oculta;
- validar rutas relativas a `.db`, `.wasm`, CSV, JSON o Parquet;
- comprobar la experiencia tanto con resultado correcto como con consulta incorrecta cuando exista feedback automático.

Para S6, además, se debe preservar la distinción conceptual:

> restricción implementada ≠ permiso del esquema ≠ patrón observado ≠ hipótesis.

### G. Regeneración y sincronización

Antes de hacer push se debe ejecutar:

```bash
python tools/validar_curso.py
python tools/construir-index.py
python tools/integrar-experiencia.py
```

Después de los generadores, la IA debe verificar que no hayan aparecido cambios inesperados.

El Action `Course QA` hace esta misma comprobación y falla si `index.html` o las presentaciones quedan desincronizados con sus fuentes.

### H. JSON, enlaces y archivos requeridos

`tools/validar_curso.py` comprueba, entre otras cosas:

- que existan 16 sesiones;
- que no haya sesiones duplicadas;
- que los recursos locales enlazados existan;
- que S6–S16 estén descritas en el plan;
- que la diferenciación técnica solo se exija donde corresponde;
- que S7/S10/S13 tengan trabajo autónomo y publicación a las 20:00;
- que los servicios cloud reales estén declarados;
- que S6 no vuelva a cargar la antigua capa Ruta/Núcleo-Reto;
- que las sesiones técnicas publicadas carguen su capa de práctica;
- que existan PWA, iconos, Issue Form y motores necesarios.

La IA no debe replicar manualmente estas reglas: debe ejecutar el verificador.

### I. Higiene Git

Antes del push:

```bash
git diff --check
git status --short
git diff --stat
git diff
```

Comprobar especialmente:

- marcadores de conflicto `<<<<<<<`, `=======`, `>>>>>>>`;
- espacios/errores detectados por `git diff --check`;
- archivos enormes inesperados;
- binarios modificados sin razón;
- archivos temporales de Office;
- cambios accidentales en soluciones o material privado.

---

## 3. Comando único recomendado para una IA

El repositorio incluye `tools/pre_push_check.py`.

Antes de cualquier push, la IA debe ejecutar:

```bash
python tools/pre_push_check.py
```

**Resultado esperado:**

```text
PRE-PUSH ANDESDB: OK
```

Si el comando devuelve error, la IA no debe hacer push hasta resolverlo o explicar explícitamente por qué la comprobación no puede ejecutarse y solicitar intervención.

---

## 4. Qué Actions existen y qué significa cada uno

| Workflow | Función | ¿Escribe en `main`? | Qué debe hacer la IA |
|---|---|---:|---|
| `Validar curso` | Ejecuta `Course QA` | No | Debe quedar verde |
| `Sincronizar sitio desde manifiestos` | Regenera portada e integración | Sí | Esperar a que termine y volver a leer el HEAD |
| `Generar iconos PWA` | Rasteriza SVG → PNG Android | Sí | Esperar si se cambió un icono |
| `Preparar motores WebAssembly locales` | Descarga/versiona sql.js y DuckDB-Wasm | Sí | Solo relevante si se cambia ese workflow/versiones |
| `Publicar soluciones programadas` | Descifra/publica S7/S10/S13 a las 20:00 | Sí | Nunca sustituirlo publicando antes en texto plano |
| `Integrar laboratorio SQL S6` | Workflow de integración puntual de S6 | Sí | No usar como mecanismo normal de edición |
| `Ajustar etiqueta de avance` | Workflow de mantenimiento puntual | Sí | No usar como mecanismo normal de edición |
| GitHub Pages | Publica el sitio | Despliegue | Debe terminar correctamente antes de afirmar que el cambio está publicado |

Los workflows que escriben utilizan o deben respetar la serialización `andesdb-writes`. Una IA no debe lanzar varios cambios sucesivos sin comprobar si un Action anterior hizo un commit automático.

---

## 5. Validación obligatoria después del push

Hacer push **no significa que la tarea esté terminada**.

La IA debe:

1. identificar el SHA publicado;
2. revisar los workflows activados por ese cambio;
3. esperar a que `Course QA` termine;
4. si `Sincronizar sitio`, `Generar iconos PWA`, `vendor-wasm` o `Publicar soluciones` escribieron otro commit, actualizar el SHA final;
5. verificar el último `main`, no solamente el commit inicial de la IA;
6. esperar que GitHub Pages termine con `success` cuando el cambio afecte el sitio;
7. comprobar el archivo final publicado o la página relevante cuando la tarea afecte experiencia visible;
8. solo entonces informar que quedó implementado.

Si un Action falla, la IA debe leer el job/step que falló y corregir la causa. No debe declarar éxito porque “el archivo ya está en GitHub”.

---

## 6. Condiciones que bloquean un push

La IA **NO debe hacer push** si ocurre cualquiera de estas situaciones:

- hay un error de `tools/pre_push_check.py`;
- hay un error de `tools/validar_curso.py`;
- JavaScript modificado no pasa sintaxis;
- el diff incluye información personal o secretos;
- existe una solución programada en texto plano antes de las 20:00;
- se vuelve a introducir progreso personal persistente;
- se añade una sugerencia visible para instalar la PWA;
- S6 vuelve a mostrar Ruta/Núcleo/Reto;
- una sesión técnica pierde la experiencia base/extensión sin una decisión pedagógica explícita;
- un servicio cloud real es reemplazado por una simulación/local fallback;
- el material heredado vuelve a aparecer en la página como material vigente sin reconstrucción;
- hay archivos generados desincronizados;
- hay conflictos de merge;
- `main` avanzó y la IA todavía está intentando publicar sobre una revisión vieja;
- la IA no entiende por qué cambió un archivo incluido en el diff.

---

## 7. Regla de cierre para cualquier agente

Antes de decir **“hecho”, “listo” o “ya está publicado”**, la IA debe poder reportar:

```text
Pre-push: OK
Course QA: success
Actions que escriben: finalizados
HEAD final verificado: <sha>
GitHub Pages: success / no aplica
Verificación visible: OK / no aplica
```

La finalidad no es añadir burocracia: es impedir que una mejora pedagógica rompa la experiencia del estudiante por un error de sincronización, caché, seguridad o despliegue.
