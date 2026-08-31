# ANDESDB Learning OS · arquitectura $0, escalable y LTI-ready

Estado: **EXPERIMENTAL** · rama `experiment/learning-os-s9-zero-cost`

## Objetivo

Convertir ANDESDB en una plataforma de aprendizaje especializada que pueda operar en dos modos sin duplicar contenido ni laboratorios:

1. **Standalone**: curso autocontenido para pilotos, educación continua o venta directa.
2. **Institucional / LTI 1.3**: herramienta externa lanzada desde Bloque Neón/Brightspace, conservando el LMS institucional como sistema de matrícula, comunicación y gradebook.

El principio rector es **costo marginal de práctica ≈ $0**. Ejecutar SQL, inspeccionar esquemas, recibir feedback determinístico, visualizar JOIN/GROUP BY, usar pistas y practicar no debe consumir cómputo del backend.

---

## Arquitectura local-first

```text
                         BLOQUE NEÓN / STANDALONE
                                   │
                                   ▼
                         ANDESDB Learning Shell
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
       CONTENIDO                SUPERLAB                 JUEGO
          │                        │                        │
 presentaciones             SQL engine local          XP/mastery
 actividades                autograder local          badges/racha
 diagramas                   schema explorer          boss battles
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                         Learning Event Bus
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                    sin backend         backend opcional
                    localStorage        solo evidencia
                                            │
                        ┌───────────────────┼──────────────────┐
                        │                   │                  │
                    identidad           progreso            notas
                    licencia            entregas            LTI
```

### Regla de escalabilidad

El backend **NO ejecuta las consultas de práctica de cada estudiante**. El navegador usa WebAssembly. El backend recibe únicamente eventos académicos de baja frecuencia: completar misión, entregar, publicar nota, asistencia/señal de clase, sincronizar progreso y auditoría.

---

## Motores de laboratorio

### SQL básico S2–S5

Motor local actual: **SQL.js** ya versionado en `assets/vendor/sqljs/`.

Ventajas:
- carga estática;
- cero instalación;
- cero requests de cómputo por consulta;
- funciona offline una vez cacheado;
- ideal para SELECT, filtros, agregaciones, JOIN y CTE.

### PostgreSQL S9+

El contrato del SuperLab será `EngineAdapter`, de modo que el motor pueda cambiar sin cambiar ejercicios ni UI.

Objetivo:
- práctica local PostgreSQL con PGlite cuando se vendorice y pruebe;
- PostgreSQL real (Supabase/servicio institucional) cuando **operar el servicio real** sea el objetivo pedagógico.

La sesión 9 mantiene la decisión actual del curso: PostgreSQL real primero; el motor local es práctica/fallback y no reemplazo del objetivo.

### Analítica

`DuckDB-Wasm` se mantiene como Analytics Lab para CSV/Parquet/JSON y futuras sesiones analíticas.

---

## Qué corre siempre gratis en el dispositivo

- editor SQL;
- ejecución de práctica;
- reset de base;
- esquema y columnas;
- resultados tabulares;
- comparación de resultados para ejercicios formativos;
- traducción de errores frecuentes;
- pistas progresivas;
- explicación determinística de cláusulas;
- visualizador de orden lógico SQL;
- XP local;
- mapa de habilidades local;
- racha local;
- SQL del día;
- historial local de consultas;
- actividades no calificadas.

## Qué debe vivir fuera del navegador

Por protección intelectual, integridad académica y seguridad:

- soluciones calificadas definitivas;
- tests secretos de evaluación;
- reglas de autograding calificable;
- banco privado de preguntas;
- claves LTI/OAuth/JWK privadas;
- licencias institucionales;
- rúbricas privadas si se desea;
- notas oficiales;
- snapshots de entregas;
- auditoría;
- analítica individual identificable;
- lógica de autorización.

**Todo JavaScript entregado al navegador es copiable.** La protección comercial no se basa en ofuscación sino en separar runtime público de propiedad intelectual y evidencia privada.

---

## Capas de producto replicables

```text
packages/
  learning-core/       # eventos, progreso, mastery, contratos
  superlab/            # editor + engine adapters + resultados
  autograder/          # interfaz; evaluador secreto puede ser remoto
  visualizers/         # JOIN, GROUP BY, execution order, ERD
  lti-adapter/         # contrato institucional

courses/
  andesdb-sql/         # manifest del curso, sesiones, actividades
  otro-curso/          # mismo runtime, otro manifest
```

El contenido de un curso debe ser declarativo. El runtime no debe contener nombres como `S7` o `Restaurante ABC` salvo en adaptadores legados.

---

## Contrato de actividad

Cada actividad se describe con un manifiesto similar a:

```json
{
  "id": "sql-s4-left-join-01",
  "course": "andesdb-sql",
  "session": 4,
  "type": "sql",
  "engine": "sqljs",
  "skills": ["LEFT JOIN", "NULL"],
  "xp": 40,
  "prompt": "Encuentra clientes sin alquileres",
  "hints": [
    "Conserva todos los clientes.",
    "Piensa en LEFT JOIN.",
    "Busca la ausencia en la tabla derecha."
  ],
  "assessment": "practice"
}
```

Para `assessment=practice`, la referencia puede existir en el cliente. Para `assessment=graded`, el cliente recibe únicamente un `challenge_id`; la evaluación final ocurre fuera del navegador.

---

## Modos de despliegue

### A. GitHub Pages · desarrollo/portafolio

- código y CI en GitHub;
- contenido público y demos;
- sin secretos;
- sin evaluaciones protegidas.

### B. Cloudflare Pages/Workers/D1 · producto $0 inicial

Uso propuesto cuando se active el despliegue comercial:

- Pages: shell y assets estáticos;
- Worker: gateway LTI/licencia/evidencia;
- D1: tenant/deployment/progreso mínimo si se decide no usar Supabase;
- secretos: bindings del Worker, nunca repo/frontend.

El diseño debe poder cambiar D1 por PostgreSQL/Supabase sin cambiar el SuperLab.

### C. Supabase · piloto académico

La rama `piloto-lms-sdd-secure` aporta:

- Auth;
- RLS;
- cursos/cohortes/matrículas;
- progreso;
- estado;
- entregas;
- feedback;
- vista docente.

Se conserva como backend compatible durante el piloto. No se considera verificado para estudiantes reales hasta ejecutar su `verify` en un proyecto aislado.

---

## Bloque Neón / Brightspace

El modo institucional se diseña para **LTI 1.3 + LTI Advantage**.

Capacidades objetivo:

- **OIDC/LTI launch**: entrada desde Bloque Neón sin segundo login;
- **Deep Linking**: el profesor inserta una misión, laboratorio o sesión desde ANDESDB;
- **NRPS**: sincroniza roster/roles si la Universidad habilita el scope;
- **AGS**: devuelve una calificación a la columna correspondiente del gradebook;
- contexto de curso institucional → tenant/course/cohort interno.

El runtime del laboratorio no conoce secretos LTI. El Worker/backend valida el launch y emite una sesión ANDESDB de alcance mínimo.

---

## Multi-tenant para vender a universidades

Entidades mínimas:

```text
organizations
lti_platforms
lti_deployments
courses
course_versions
cohorts
users
memberships
activities
activity_versions
progress
submissions
grades
learning_events
licenses
```

Toda evidencia académica queda particionada por `organization_id` y `course_id`.

Una licencia puede habilitar:

```text
organization
course_pack
max_active_learners
starts_at
ends_at
features
```

El estudiante nunca recibe reglas de licencia firmables ni secretos.

---

## Protección contra copia

### Público/copiable

- shell visual;
- editor;
- motores WASM de terceros;
- componentes visuales genéricos;
- ejercicios de demostración;
- documentación comercial limitada.

### Privado

- repositorio de contenido premium;
- generadores de paquetes;
- banco de retos;
- tests secretos;
- soluciones;
- rúbricas de producción;
- reglas de scoring;
- telemetría y dashboards comerciales;
- claves y adaptadores institucionales desplegados.

### Entrega a cliente

No entregar el repositorio fuente privado salvo que el contrato lo requiera. Desplegar el producto y licenciar su uso. Si Uniandes requiere escrow/on-premise, generar un paquete de release versionado distinto del repositorio de autoría.

---

## Presupuesto $0 para piloto

El piloto debe poder funcionar con:

- GitHub: source/CI;
- GitHub Pages o Cloudflare Pages: estáticos;
- SQL.js/PGlite/DuckDB-Wasm: cómputo del estudiante;
- Supabase Free **o** Workers/D1 Free: evidencia mínima;
- almacenamiento de archivos evitado inicialmente: entregas estructuradas JSON/SQL;
- sin LLM de pago;
- tutor determinístico basado en AST/error/objetivo/pistas.

No se promete costo cero ilimitado. Se diseña para que el uso normal de una o varias cohortes permanezca dentro de cuotas gratuitas y para que un crecimiento posterior requiera cambiar solo el backend, no reescribir el curso.

---

## Roadmap de implementación

### Vertical 0 · hecho

- rama experimental desde `main`;
- contenido actualizado hasta S9;
- núcleo LMS seguro portado desde el piloto.

### Vertical 1 · SuperLab formativo

- SQL.js local;
- schema explorer;
- ejecución;
- autograding por resultado;
- pistas;
- traductor de errores;
- explicación de query;
- orden lógico;
- XP/mastery/racha;
- telemetría local-first.

### Vertical 2 · Generalización

- manifest de actividades;
- EngineAdapter;
- migrar S2–S5 al SuperLab;
- conectar S7/S8/S9 sin reescribir sus contenidos.

### Vertical 3 · Evaluación protegida

- endpoint de entrega;
- tests secretos server-side;
- gradebook;
- rúbricas;
- snapshots inmutables;
- audit log.

### Vertical 4 · LTI

- registro de plataforma/deployment;
- OIDC login;
- launch validation;
- Deep Linking;
- AGS;
- NRPS opcional;
- paquete de instalación para DSIT/Conecta-TE.

### Vertical 5 · Producto multi-curso

- separar runtime y course packs;
- generador de curso;
- branding por institución;
- licenciamiento por tenant;
- documentación de adopción.

---

## Criterio de éxito

ANDESDB es replicable cuando un nuevo curso puede crearse sin modificar el código del runtime: solo se registra un `course-manifest`, datasets, actividades, reglas de evaluación y branding.
