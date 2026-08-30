# Backlog del piloto LMS seguro

## Resumen

Objetivo de primera release: demostrar de extremo a extremo que un estudiante puede autenticarse, empezar S7, cerrar, continuar en otro dispositivo y entregar; y que otro estudiante no puede leer ni modificar ese trabajo.

Estimación total del piloto técnico: **80-120 horas**. No incluye procesos institucionales de aprobación ni integración con sistemas universitarios.

## Fase 0 · Preparación segura · 8-12 h

- [ ] crear proyecto Supabase exclusivo de piloto;
- [ ] crear deployment de preview separado de producción;
- [ ] decidir Google o Microsoft como proveedor inicial;
- [ ] bloquear autoinscripción pública o exigir invitación/matrícula;
- [ ] configurar redirects exactos;
- [ ] definir dominio piloto;
- [ ] activar controles de seguridad disponibles en GitHub;
- [ ] documentar tratamiento mínimo de datos.

**Salida:** G0 y G1 aprobados.

## Fase 1 · Esquema + RLS · 14-20 h

- [ ] ejecutar migración inicial en proyecto de prueba;
- [ ] revisar todos los GRANT;
- [ ] confirmar `anon` sin acceso académico;
- [ ] crear dos students, un teacher y una cohorte;
- [ ] probar ownership de `activity_state`;
- [ ] probar aislamiento de submissions;
- [ ] implementar asignación docente a cohorte antes de abrir dashboard real;
- [ ] automatizar tests RLS en CI/local.

**Salida:** 100% de cross-user tests denegados.

## Fase 2 · Login y shell LMS · 10-15 h

- [ ] integrar SDK de Supabase como dependencia fijada, no CDN;
- [ ] sesión y logout;
- [ ] pantalla de acceso;
- [ ] estado `no matriculado`;
- [ ] header de usuario sin exponer identificadores innecesarios;
- [ ] dashboard estudiante mínimo;
- [ ] manejo de sesión expirada.

**Salida:** usuario autenticado != usuario autorizado queda claramente separado.

## Fase 3 · Adaptador genérico de persistencia · 12-18 h

Crear una API interna pequeña para que los talleres no conozcan detalles de Supabase:

```js
LmsState.load(activity)
LmsState.save(activity, state, revision)
LmsState.submit(activity, state)
LmsState.status()
```

- [ ] debounce;
- [ ] límite de payload en cliente;
- [ ] revision/optimistic concurrency;
- [ ] indicador `Guardando / Guardado / Sin conexión / Conflicto`;
- [ ] timeout y retry limitado con backoff;
- [ ] nunca loggear payload ni token;
- [ ] fallback local como caché, no fuente de verdad.

**Salida:** integración reutilizable por cualquier lab.

## Fase 4 · Vertical S7 · 12-18 h

- [ ] serializar estado actual del constructor;
- [ ] restaurarlo sin cambiar semántica del taller;
- [ ] mapear `paso_actual`;
- [ ] mapear progreso real a criterios;
- [ ] guardar versión de actividad;
- [ ] comprobar restauración en dispositivo B;
- [ ] entrega inmutable;
- [ ] no usar `innerHTML` con datos del estudiante;
- [ ] test XSS almacenado.

**Salida:** flujo completo de estudiante.

## Fase 5 · Dashboard docente mínimo · 10-15 h

- [ ] lista solo de cohorte asignada;
- [ ] estado por actividad;
- [ ] último guardado;
- [ ] ver snapshot de entrega;
- [ ] feedback simple;
- [ ] encoding seguro de contenido;
- [ ] test teacher A vs cohorte B.

**Salida:** flujo completo del docente.

## Fase 6 · Hardening y prueba de carga · 12-18 h

- [ ] threat model review;
- [ ] CodeQL;
- [ ] Snyk si se habilita token del repositorio;
- [ ] secret scanning;
- [ ] revisión de dependencias;
- [ ] CSP/cabeceras;
- [ ] test IDOR/BOLA;
- [ ] test role escalation;
- [ ] payload >= 512 KiB rechazado;
- [ ] simulación 40 estudiantes con autosave razonable;
- [ ] restore/backup drill;
- [ ] kill-switch drill.

**Salida:** G2-G4 aprobados.

## Fase 7 · Piloto humano · 2 semanas

- 10-40 usuarios;
- S7 y, si es estable, una segunda actividad;
- recopilar solo métricas operativas agregadas;
- registrar incidentes/errores;
- no usar como sistema oficial de calificación.

## Métricas

| Métrica | Objetivo |
|---|---:|
| Autosaves correctos | >= 95% |
| Restauración cross-device | >= 99% en pruebas controladas |
| Cross-user reads/writes | 0 exitosos |
| Critical/High abiertos | 0 |
| Secretos privilegiados en cliente | 0 |
| Pérdida de entregas | 0 |
| XSS almacenado reproducible | 0 |

## Costos operativos esperados

El piloto puede iniciarse con tiers gratuitos si la política institucional lo permite. Para una prueba más estable, presupuestar principalmente Supabase Pro y dominio/hosting si aplica.

Rango de operación razonable para 10-40 estudiantes: **USD 0-30/mes** durante el piloto, excluyendo trabajo de desarrollo y servicios institucionales.

## No hacer todavía

- no migrar las 16 sesiones;
- no implementar notas oficiales;
- no almacenar adjuntos;
- no añadir chat;
- no construir un backend monolítico;
- no habilitar offline multi-device complejo;
- no conectar service role desde JavaScript;
- no permitir autoasignación de roles;
- no mergear esta rama a `main` porque “ya funciona”.

## Orden de promoción

```text
local/test Supabase
   -> preview branch
   -> pruebas automatizadas
   -> pruebas manuales adversariales
   -> cohorte interna 2-5 cuentas
   -> piloto 10-40
   -> decisión: descartar / iterar / promover
```

Una promoción a producción requiere un ADR nuevo; no es consecuencia automática de que el piloto haya terminado.