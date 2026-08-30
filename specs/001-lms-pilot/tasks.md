# Tasks · Spec 001

Convención: `[x]` significa **implementado en código/documentación**. Las tareas de Verify solo se marcan `[x]` con evidencia de un backend Supabase real de laboratorio.

## Fase 0 · Especificación

- [x] T001 Crear constitución SDD del piloto.
- [x] T002 Definir spec funcional y no funcional.
- [x] T003 Definir plan técnico.
- [x] T004 Resolver proveedor inicial de identidad: email OTP.
- [x] T005 Resolver política de invitación/matrícula: cerrado y administrativo.
- [x] T006 Resolver retención: 90 días tras cierre del piloto.
- [x] T007 Crear checklist de requisitos.
- [x] T008 Ejecutar Analyze y documentar riesgos residuales.

## Fase 1 · Data plane seguro

- [x] T010 Crear esquema base LMS en migración.
- [x] T011 Activar RLS y mínimo privilegio.
- [x] T012 Añadir hardening de columnas controladas por servidor.
- [x] T013 Añadir RPC atómico de autosave y entrega.
- [x] T014 Añadir catálogo idempotente de S7.
- [x] T015 Añadir plantilla administrativa de matrícula/rol.
- [x] T016 Añadir matriz SQL adversarial.
- [ ] T017 Crear proyecto Supabase aislado del piloto.
- [ ] T018 Aplicar migraciones 001–004 desde cero.
- [ ] T019 Crear identidades ficticias A/B, no-matriculado, docente A/B y admin.
- [ ] T019A Ejecutar matriz adversarial RLS/RPC.
- [ ] T019B Verificar que `anon` obtiene 0 acceso académico.
- [ ] T019C Verificar que autenticado sin matrícula obtiene 0 acceso académico.

## Fase 2 · Cliente de identidad

- [x] T020 Implementar Auth sin nueva dependencia runtime.
- [x] T021 Configuración solo con URL + `sb_publishable_...` pública.
- [x] T022 Implementar solicitud/verificación OTP y logout.
- [x] T023 Implementar refresco de sesión y expiración.
- [x] T024 Impedir registro desde frontend mediante `create_user:false`.
- [ ] T025 Probar manipulación de rol en backend real: debe ser irrelevante para autorización.
- [ ] T026 Configurar template OTP/SMTP del proyecto de prueba.

## Fase 3 · Persistencia genérica

- [x] T030 Crear `assets/lms/lms-client.js`.
- [x] T031 Implementar `load_my_activity_state`.
- [x] T032 Implementar `save_activity_state` con control de revisión.
- [x] T033 Implementar estados visuales Guardando/Guardado/Error/Conflicto.
- [x] T034 Implementar manejo explícito de conflicto sin last-write-wins.
- [x] T035 Calcular progreso del lado servidor.
- [ ] T036 Probar payload >512 KiB en backend real.
- [ ] T037 Probar dos sesiones con misma revisión.

## Fase 4 · S7

- [x] T040 Definir schema JSON de S7 v1.
- [x] T041 Reutilizar `exportar()` de S7 como `serialize`.
- [x] T042 Reutilizar `importar()` como `hydrate`.
- [x] T043 Crear host same-origin `pilot/s7.html`.
- [x] T044 Mapear paso actual 1–7.
- [x] T045 Integrar autosave 800 ms.
- [x] T046 Preparar restauración desde estado de servidor.
- [x] T047 Conservar código local ante conflicto antes de recargar remoto.
- [ ] T048 Verificar 10 ciclos dispositivo/navegador A→B sin pérdida.

## Fase 5 · Entrega

- [x] T050 Diseñar operación server-side para crear snapshot desde estado autorizado.
- [x] T051 Implementar `submit_activity` desde revisión confirmada.
- [x] T052 Quitar INSERT directo de submissions a authenticated.
- [x] T053 No conceder UPDATE/DELETE de submissions a estudiante.
- [x] T054 Implementar límite inicial de 3 intentos.
- [ ] T055 Probar inmutabilidad y límite de intentos en backend real.

## Fase 6 · Docente

- [x] T060 Vista mínima de estudiantes/progreso de cohorte asignada.
- [x] T061 Vista de última entrega.
- [x] T062 Renderizar contenido del estudiante con `textContent`.
- [x] T063 Restringir RPC docente por `teacher_cohorts`.
- [ ] T064 Probar XSS almacenado.
- [ ] T065 Probar que docente B no consulta cohorte A.

## Fase 7 · Portal estudiante

- [x] T066 Crear `/pilot/index.html`.
- [x] T067 Mostrar progreso por actividad.
- [x] T068 Mostrar “Continuar donde quedé” para S7.
- [x] T069 Diferenciar autenticado sin matrícula.

## Fase 8 · Supply chain y CI

- [x] T070 Workflow de seguridad sobre `piloto-lms-sdd-secure`.
- [x] T071 Actions críticas fijadas por SHA.
- [x] T072 Secret guard básico y Supabase secret guard.
- [x] T073 CodeQL JavaScript/Python.
- [x] T074 `node --check` para cliente LMS.
- [x] T075 Gate de CSP y `innerHTML` en vista docente.
- [x] T076 No introducir npm/CDN en el runtime inicial.
- [ ] T077 Activar Snyk cuando exista `SNYK_TOKEN` o se incorporen dependencias que lo justifiquen.
- [ ] T078 Automatizar pruebas de migración/RLS contra un Supabase efímero si el entorno CI lo permite.

## Fase 9 · Operación

- [x] T080 Crear runbook `OPERACION.md`.
- [x] T081 Crear kill-switch mediante `config.enabled=false`.
- [x] T082 Definir retención del piloto.
- [x] T083 Documentar operaciones administrativas fuera del navegador.
- [ ] T084 Configurar backup antes de usuarios reales.
- [ ] T085 Ejecutar restore drill.
- [ ] T086 Revisar aviso de privacidad/base institucional aplicable.

## Fase 10 · Piloto controlado

- [ ] T090 Ejecutar recorrido completo con identidades ficticias.
- [ ] T091 Corregir defectos encontrados y repetir matriz.
- [ ] T092 Activar configuración pública del proyecto de prueba.
- [ ] T093 Ejecutar piloto real con máximo 10 participantes.
- [ ] T094 Recoger métricas operativas y defectos.
- [ ] T095 Decisión explícita GO / ITERATE / STOP.

## Gate final del piloto

No hay GO si cualquiera es falso:

- [ ] 0 accesos cruzados exitosos.
- [ ] 0 escaladas de rol exitosas.
- [ ] 0 XSS almacenados ejecutados.
- [ ] 10/10 restauraciones multi-dispositivo correctas.
- [ ] 100 % submissions inmutables para estudiante.
- [ ] backups y restauración probados.
- [ ] privacidad revisada.
- [ ] CI verde.
