# ANDESDB · capa `revision/`

Repositorio del curso **Diseño y Gestión de Bases de Datos con SQL**, desarrollado para **Universidad de los Andes · Colsubsidio**.

`revision/` combina dos superficies distintas:

1. un **sitio de curso reproducible** con 16 sesiones, presentaciones, recursos y laboratorios;
2. un **LMS autenticado** con matrícula, progreso server-side, analítica académica, agenda, anuncios, entregas, competencias y control docente.

La tecnología sigue al objetivo de aprendizaje: los servicios cloud reales se usan cuando operar el servicio es parte del resultado esperado; los motores locales/WASM funcionan como continuidad o fallback, no como reemplazo artificial.

## Curso

- **48 horas · 16 sesiones**.
- Clases virtuales sincrónicas.
- Actividad práctica aproximadamente cada 10–15 minutos.
- 10 evidencias verificables por sesión en el LMS: **160 prácticas**.
- SQL y modelado con `dvdrental` y **Restaurante ABC**.
- Preparación transversal de conceptos relacionados con **DP-900** desde la sesión 6.
- Servicios cloud reales primero; fallback local cuando evita que un problema de acceso detenga la clase.

## Recorrido académico

| Sesiones | Bloque | Qué se trabaja |
|---|---|---|
| 1 | Valor y ecosistema de datos | Problema, actores, decisiones y valor de los datos. |
| 2–5 | SQL | `SELECT`, filtros, agregaciones, `JOIN`, CTE y control del grano. |
| 6 | Reglas de negocio | Evidencia, restricciones, permisos, patrones e hipótesis. |
| 7 | De las reglas al modelo | Entidades, atributos, relaciones y cardinalidades. |
| 8 | Normalización | Dependencias, anomalías, 1FN, 2FN y 3FN. |
| 9 | DDL e integridad | `CREATE TABLE`, PK, FK, `NOT NULL`, `UNIQUE`, `CHECK` y PostgreSQL/Supabase. |
| 10–11 | SQL / NoSQL | Decisión de arquitectura, documentos y servicios NoSQL. |
| 12 | Data warehouse | Grano, hechos, dimensiones, estrella, batch y streaming. |
| 13–14 | Analítica cloud | BigQuery, partición, clustering, ARRAY/STRUCT/UNNEST y transferencia Azure. |
| 15 | Reto integrador | Diagnóstico, modelo, implementación, pruebas y defensa. |
| 16 | Cierre | Integración y recuperación acumulativa DP-900. |

La fuente de verdad del recorrido es [`tools/curso.json`](tools/curso.json). La experiencia pedagógica detallada de S6–S16 vive en [`assets/learning/learning-plan.json`](assets/learning/learning-plan.json).

## LMS autenticado

Entrada principal:

- [`portal.html`](portal.html) — login, progreso, continuar, avisos, competencias, agenda, cuenta y dispositivos;
- [`learning-hub.html`](learning-hub.html) — índice compacto y buscable de las 16 sesiones;
- [`lab.html`](lab.html) — laboratorio de 10 prácticas por sesión;
- [`calendar.html`](calendar.html) — agenda académica + exportación `.ics`;
- [`assignment.html`](assignment.html) — envío de evidencias;
- [`teacher-dashboard.html`](teacher-dashboard.html) — control docente integral;
- [`verify.html`](verify.html) — verificación pública de certificados.

### Principio de persistencia

El expediente académico vive en **Supabase/PostgreSQL**, no en el navegador.

`localStorage` y `sessionStorage` se reservan para sesión técnica o caché temporal de interfaz. Los logros que cuentan se registran mediante Edge Functions y el backend valida la sesión/rol antes de consultar o cambiar datos.

### Cohortes

El modelo distingue:

```text
Curso
  └── Cohorte / course run
        ├── matrículas
        ├── eventos
        ├── progreso por sesión
        ├── progreso por actividad
        ├── anuncios
        ├── entregas
        ├── competencias
        └── certificados
```

Esto permite agregar futuras ediciones/cursos sin reutilizar una S1 global como identidad académica.

## Experiencia del estudiante

El recorrido de navegación es intencionalmente corto:

```text
Portal → Curso → Sesión → Presentación / Lectura / Laboratorio
```

El LMS añade:

- reanudación de actividad;
- progreso por práctica y sesión;
- tiempo activo;
- anuncios con leído/no leído;
- agenda y calendario interoperable `.ics`;
- entregas de texto, URL o archivo privado;
- mapa de competencias;
- marcadores/notas en presentaciones;
- gestión de contraseña y sesiones/dispositivos.

## Experiencia docente

El panel permite:

- aprobar matrículas y crear/restablecer credenciales;
- consultar cohorte, progreso, intentos, pistas y tiempo activo;
- detectar estudiantes que requieren atención;
- identificar prácticas con mayor fricción;
- abrir la ficha individual de un estudiante;
- desactivar/reactivar cuentas y revocar sesiones;
- publicar anuncios;
- crear y revisar entregas;
- exportar el progreso a CSV;
- emitir certificados verificables cuando se cumplen los criterios.

## Competencias

Las actividades se vinculan con competencias de:

- fundamentos SQL;
- SQL relacional y control del grano;
- reglas/modelado conceptual;
- normalización;
- DDL e integridad;
- arquitectura SQL/NoSQL;
- data warehouse;
- analítica cloud;
- integración profesional;
- DP-900.

El dominio se deriva de evidencia completada. Una actividad que requiere juicio humano pasa por revisión docente en vez de calificarse como correcta solo por haber sido abierta.

## Analítica

### Supabase

Fuente de verdad individual para identidad académica, matrícula, progreso, tiempo activo, intentos, pistas, evidencias, competencias y riesgo pedagógico.

### GA4

La propiedad `G-Z5YG0TNP8J` se usa para comportamiento web agregado: páginas/presentaciones, slides, engagement, dispositivo, navegador, sistema operativo y geografía aproximada. No se envía a GA4 nombre, correo, username, token, consulta SQL escrita ni respuesta académica individual.

La conexión directa mediante GA4 Data API requiere credenciales de lectura que **nunca deben publicarse en GitHub**.

## Arquitectura

```text
GitHub Pages · revision/
│
├── Portal / Curso / Agenda / Presentaciones / Laboratorios
├── runtime LMS + PWA + GA4
│       │
│       ├─────────────► GA4 (web agregado)
│       │
│       ▼
│   Supabase Edge Functions
│       │
│       ▼
│   PostgreSQL LMS + Storage privado
│
└── sql.js / DuckDB-Wasm para prácticas locales
```

Documentación completa: [`docs/LMS-INTEGRAL.md`](docs/LMS-INTEGRAL.md).

## Seguridad

La superficie LMS se endurece de forma independiente de las bases didácticas:

- contraseñas con `pgcrypto`/bcrypt;
- tokens almacenados en base únicamente como hash;
- roles verificados server-side;
- rate limit de login;
- RLS y revocación de acceso directo a tablas LMS internas;
- RPC académicos sensibles limitados a `service_role`;
- bucket de entregas privado y URLs firmadas temporales;
- revocación de sesiones y desactivación de cuentas;
- auditoría de acciones privilegiadas.

**GitHub Pages sigue siendo hospedaje estático público.** El gate protege la experiencia autenticada y los datos del LMS, pero no convierte un HTML publicado en un archivo confidencial. Material realmente privado debe servirse desde almacenamiento/backend autenticado.

Las tablas y RPC de los ejercicios didácticos (por ejemplo Restaurante ABC) no deben confundirse con la capa de autorización académica.

## Materiales y soluciones

Los guiones docentes, encuestas con PII, soluciones privadas y otros materiales protegidos se mantienen fuera de la superficie pública según `.gitignore` y los flujos de publicación controlada.

## Generación y validación

No conviene editar manualmente archivos generados cuando existe una fuente declarativa equivalente.

Antes de publicar cambios importantes desde `revision/`:

```bash
python tools/pre_push_check.py
```

Resultado esperado:

```text
PRE-PUSH ANDESDB: OK
```

Después se revisan los workflows de GitHub Actions, el `HEAD` final de `main` y la publicación en GitHub Pages.

## Interoperabilidad

El calendario usa `.ics`, compatible con Google Calendar, Outlook y Apple Calendar sin OAuth adicional. Para una futura integración institucional con Moodle/Canvas, el camino previsto es **LTI 1.3/LTI Advantage**; su activación depende de credenciales y registro de la institución, no de secretos embebidos en el repositorio.

## Costo

La arquitectura está diseñada para la escala del curso usando:

- GitHub Pages;
- Supabase Free dentro de sus límites;
- GA4 estándar;
- motores WASM en navegador;
- calendarios `.ics`.

No se habilitan automáticamente planes pagos, SMTP pago, VPS ni otros servicios con costo.
