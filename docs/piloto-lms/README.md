# Piloto LMS · ANDESDB

> Rama: `piloto-lms-sdd-secure`
>
> `main` permanece fuera del experimento. No usar datos reales hasta superar los gates de `specs/001-lms-pilot/checklists/requirements.md`.

## Objetivo

Probar un único recorrido vertical:

`login -> S7 -> autosave -> cerrar -> otro dispositivo -> continuar -> entregar -> docente ve`

El piloto no intenta construir un LMS genérico. Valida identidad, persistencia, aislamiento, entrega y trazabilidad sobre una actividad real de ANDESDB.

## Método SDD

La fuente de verdad funcional está en:

1. `.specify/memory/constitution.md`
2. `specs/001-lms-pilot/spec.md`
3. `specs/001-lms-pilot/clarifications.md`
4. `specs/001-lms-pilot/plan.md`
5. `specs/001-lms-pilot/checklists/requirements.md`
6. `specs/001-lms-pilot/tasks.md`
7. `specs/001-lms-pilot/analysis.md`

El código implementa esa especificación; no al revés.

## Arquitectura del piloto

```text
/pilot/ (frontend estático)
       |
       | publishable key + JWT de usuario
       v
Supabase Auth + PostgREST/RPC + PostgreSQL/RLS
       |
       +-- progress
       +-- activity_state
       +-- submissions
       `-- teacher view limitada por cohorte
```

No se añade servidor Node/Python ni runtime npm/CDN al primer vertical.

## Páginas

- `/pilot/index.html`: OTP y progreso del estudiante.
- `/pilot/s7.html`: S7 original dentro de un host con autosave/restauración.
- `/pilot/teacher.html`: progreso y última entrega de cohortes asignadas.

La configuración pública está en `assets/lms/config.js` y nace con `enabled: false`.

## Backend versionado

Aplicar en orden:

1. `202608300001_lms_pilot.sql` — esquema y RLS base.
2. `202608300002_lms_pilot_hardening.sql` — columnas/roles endurecidos.
3. `202608300003_lms_pilot_rpc.sql` — autosave concurrente, dashboard y entrega server-side.
4. `202608300004_lms_pilot_catalog.sql` — catálogo S7 y lecturas seguras.

## Seguridad

Controles principales:

- deny-by-default;
- `anon` sin acceso académico;
- autenticación distinta de matrícula;
- rol no editable por estudiante;
- RLS en tablas académicas;
- escrituras sensibles mediante RPC que deriva identidad de `auth.uid()`;
- `revision` para conflictos multi-dispositivo;
- submission copiada desde estado confirmado en servidor;
- CSP en las páginas del piloto;
- contenido docente renderizado con `textContent`;
- ninguna secret/service key en navegador;
- CodeQL y guards de secretos en CI.

Detalles: `ARQUITECTURA-Y-SEGURIDAD.md`, `THREAT-MODEL.md` y `PRUEBAS-ADVERSARIALES.md`.

## Auth elegido para el piloto

Email OTP con cuentas precreadas y `create_user: false`.

Autenticarse no matricula. La matrícula y asignación docente se realizan administrativamente con `supabase/pilot-admin.sql`.

## Tamaño y retención

- laboratorio: 5 identidades ficticias/adversariales;
- primera prueba real: máximo 10 participantes;
- retención inicial: 90 días después del cierre, seguida de decisión explícita de exportar, anonimizar o eliminar.

## Qué falta antes de usarlo

El código está preparado, pero un piloto **no existe todavía** hasta tener un proyecto Supabase de prueba y ejecutar allí las migraciones/pruebas.

Runbook: `OPERACION.md`.

Prueba SQL: `../../supabase/tests/rls-adversarial.sql`.

## Gate de salida

No hay GO si cualquiera es falso:

- 0 accesos cross-user;
- 0 escaladas de rol;
- 0 XSS almacenados ejecutados;
- 10/10 restauraciones multi-dispositivo;
- 100% submissions inmutables para student;
- backup/restauración probados;
- CI verde;
- privacidad revisada.

## Rollback

El kill-switch inmediato es volver `enabled: false` en `assets/lms/config.js`. La rama y el proyecto Supabase de piloto pueden retirarse sin afectar `main` ni el curso público.
