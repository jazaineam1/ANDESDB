# ANDESDB

Repositorio del curso **Diseño y Gestión de Bases de Datos con SQL**, desarrollado para **Universidad de los Andes · Colsubsidio**.

ANDESDB no es únicamente una colección de presentaciones. El repositorio funciona como un **sitio de curso reproducible**: organiza el recorrido de 16 sesiones, genera la portada, publica materiales, integra laboratorios SQL en el navegador, mantiene actividades interactivas, usa servicios cloud reales en las sesiones técnicas y valida automáticamente que el sitio y sus recursos permanezcan coherentes.

## Curso

- **48 horas · 16 sesiones**.
- Clases virtuales sincrónicas.
- Actividad práctica aproximadamente cada 10–15 minutos.
- SQL y modelado con casos persistentes, especialmente `dvdrental` y **Restaurante ABC**.
- Preparación transversal de conceptos relacionados con **DP-900** desde la sesión 6.
- Servicios cloud reales primero; los laboratorios locales funcionan como continuidad/fallback y no sustituyen la experiencia real cuando esta es parte del objetivo.
- El sitio público **no mantiene progreso personal persistente por dispositivo**.

## Recorrido académico

| Sesiones | Bloque | Qué se trabaja |
|---|---|---|
| 1 | Valor y ecosistema de datos | Problema, actores, decisiones y valor de los datos. |
| 2–5 | SQL | `SELECT`, filtros, agregaciones, `JOIN`, CTE, control del nivel de agregación y construcción de tablas. |
| 6 | Reglas de negocio | Evidencia, restricciones, permisos, patrones e hipótesis; introducción a OLTP/OLAP, lake, warehouse y ETL/ELT. |
| 7 | De las reglas al modelo | Entidades, atributos, relaciones, cardinalidades y primer modelo del Restaurante ABC. |
| 8 | Normalización | Dependencias, anomalías, 1FN, 2FN y 3FN. |
| 9 | DDL + Azure SQL | `CREATE TABLE`, PK, FK, `NOT NULL`, `UNIQUE`, `CHECK` y comparación de opciones Azure SQL. |
| 10 | SQL o NoSQL | Decisión de arquitectura según relaciones, consistencia y patrones de acceso. |
| 11 | Firestore + Cosmos DB | Documentos, partición y servicios NoSQL reales. |
| 12 | Data warehouse | Grano, hechos, dimensiones, modelo estrella, batch y streaming. |
| 13 | BigQuery | Laboratorio real de warehouse/SQL en cloud. |
| 14 | Datos anidados y analítica | BigQuery semiestructurado y transferencia conceptual hacia el ecosistema analítico de Azure. |
| 15 | Reto integrador | Trabajo técnico con datos imperfectos y decisiones de arquitectura/modelado. |
| 16 | Cierre | Integración de conceptos y repaso acumulado del curso. |

La fuente de verdad del recorrido está en [`tools/curso.json`](tools/curso.json). La experiencia pedagógica detallada de S6–S16 vive en [`assets/learning/learning-plan.json`](assets/learning/learning-plan.json).

## Arquitectura del curso público

```text
GitHub repository
│
├── tools/curso.json                 ← manifiesto del curso
├── assets/learning/learning-plan.json
│                                      ← actividades y decisiones pedagógicas
│
├── tools/construir-index.py
├── tools/integrar-experiencia.py
│          │
│          └──────────────► index.html + páginas integradas
│
├── Presentaciones/
│   ├── M1/
│   ├── M2/
│   └── M3/
│
├── Scripts/                         ← SQL utilizado en clase
├── assets/vendor/
│   ├── sqljs/                       ← SQL en el navegador
│   └── duckdb/                      ← analítica local/fallback
│
└── GitHub Pages                     ← publicación del curso
```

El navegador puede ejecutar prácticas SQL localmente con motores WebAssembly. Esto permite que varios ejercicios funcionen sin instalar un servidor de base de datos para cada estudiante. Cuando una sesión tiene como objetivo operar un servicio cloud real, el laboratorio local solo sirve para evitar que un problema de acceso detenga por completo la clase.

## Cómo se genera el sitio

El flujo esperado es:

```text
curso.json + learning-plan.json
             │
             ▼
generadores del repositorio
             │
             ▼
index.html + presentaciones integradas
             │
             ▼
validadores / CI
             │
             ▼
GitHub Pages
```

No conviene editar manualmente archivos generados cuando existe una fuente declarativa equivalente. Los workflows del repositorio comprueban sincronización, estructura y sintaxis antes de considerar válido un cambio.

## Laboratorios

El curso combina varios tipos de práctica:

- consultas SQL sobre `dvdrental`;
- laboratorios SQL ejecutados directamente en el navegador;
- constructor interactivo del caso **Restaurante ABC** para pasar de reglas a entidades, relaciones, restricciones y normalización;
- DuckDB-Wasm para actividades analíticas locales;
- laboratorios reales de Azure SQL, Firestore, Azure Cosmos DB y BigQuery según la sesión.

La diferenciación técnica más profunda se concentra en las sesiones **9, 11, 12, 13, 14 y 15**. Las sesiones conceptuales no agregan una capa artificial de “nivel básico/reto” cuando esa diferencia no aporta al objetivo de aprendizaje.

## Soluciones y material docente

Parte del material docente y de las soluciones no se publica inmediatamente. El repositorio distingue entre:

- material del estudiante;
- guiones/notas privadas del docente;
- soluciones programadas para actividades autónomas;
- recursos públicos que pueden permanecer en GitHub aunque no aparezcan enlazados desde la portada.

Los libretos docentes y otros archivos internos están excluidos del sitio público mediante `.gitignore` y las soluciones que requieren publicación posterior tienen un flujo separado.

## Seguridad

El curso público y el futuro componente de persistencia se tratan como superficies diferentes.

La rama experimental [`piloto-lms-sdd-secure`](../../tree/piloto-lms-sdd-secure) desarrolla el hardening integral y un piloto de persistencia por estudiante bajo **Specification-Driven Development (SDD)**. Ese trabajo **no debe interpretarse todavía como producción ni como certificación de seguridad**.

La arquitectura objetivo del piloto separa explícitamente:

```text
ORIGEN A · LMS autenticado
Supabase Auth + JWT + RLS/RPC
        │
        │ postMessage con origen validado
        ▼
ORIGEN B · laboratorio aislado
constructor / actividad interactiva
```

El laboratorio no debe recibir tokens de sesión del LMS. Las credenciales privilegiadas, connection strings y secretos no pertenecen al frontend ni al repositorio.

Antes de usar persistencia con estudiantes reales, el piloto debe superar sus gates de autorización, aislamiento cross-user, XSS, backup/restore, manejo de secretos, CI y privacidad.

## Estructura principal

```text
ANDESDB/
├── index.html
├── Presentaciones/       sesiones y recursos interactivos
├── Scripts/              consultas SQL de clase
├── assets/
│   ├── learning/         experiencia pedagógica S6–S16
│   └── vendor/           motores WebAssembly locales
├── tools/                manifiestos, generadores y validadores
├── docs/                 documentación operativa/técnica
├── soluciones_cifradas/  soluciones con publicación controlada
└── .github/workflows/    automatización y validación
```

## Validación local

Antes de publicar cambios importantes del curso se recomienda ejecutar:

```bash
python tools/pre_push_check.py
python tools/validar_curso.py
```

En la rama de hardening de seguridad se añaden gates adicionales específicos para esa arquitectura.

## Principio de diseño

El repositorio intenta mantener una regla sencilla:

> **La tecnología sigue al objetivo de aprendizaje.**

Una actividad local se usa cuando reduce fricción. Un servicio real se usa cuando operar ese servicio es parte del aprendizaje. La automatización existe para hacer el curso más consistente y reproducible, no para agregar complejidad visible al estudiante.