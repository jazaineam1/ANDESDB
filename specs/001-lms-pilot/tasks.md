# Tasks · Spec 001

Convención: ninguna tarea de implementación se marca terminada sin evidencia de su criterio de aceptación.

## Fase 0 · Especificación

- [x] T001 Crear constitución SDD del piloto.
- [x] T002 Definir spec funcional y no funcional.
- [x] T003 Definir plan técnico.
- [ ] T004 Resolver proveedor inicial de identidad.
- [ ] T005 Resolver política de invitación/matrícula.
- [ ] T006 Resolver retención de entregas.

## Fase 1 · Data plane seguro

- [x] T010 Crear esquema base LMS en migración.
- [x] T011 Activar RLS y mínimo privilegio.
- [x] T012 Añadir hardening de columnas controladas por servidor.
- [ ] T013 Crear proyecto Supabase aislado del piloto.
- [ ] T014 Aplicar migraciones desde cero en entorno limpio.
- [ ] T015 Crear identidades ficticias A/B, docente A/B y admin.
- [ ] T016 Ejecutar matriz adversarial RLS.
- [ ] T017 Verificar que anon obtiene 0 acceso académico.
- [ ] T018 Verificar que usuario autenticado sin matrícula obtiene 0 acceso académico.

## Fase 2 · Cliente de identidad

- [ ] T020 Añadir SDK de Supabase con versión fija/lock.
- [ ] T021 Implementar configuración solo con URL + anon/publishable key pública.
- [ ] T022 Implementar login/logout.
- [ ] T023 Implementar estado de sesión expirado.
- [ ] T024 Probar manipulación de rol en cliente: debe ser irrelevante para autorización.

## Fase 3 · Persistencia genérica

- [ ] T030 Crear `assets/lms/lms-client.js`.
- [ ] T031 Implementar `loadActivityState`.
- [ ] T032 Implementar `saveActivityState` con control de revisión.
- [ ] T033 Implementar estados visuales de sincronización.
- [ ] T034 Implementar manejo explícito de conflicto.
- [ ] T035 Probar payload > 512 KiB: debe fallar de forma controlada.

## Fase 4 · S7

- [ ] T040 Definir schema JSON de S7 v1.
- [ ] T041 Implementar `serialize()`.
- [ ] T042 Implementar `hydrate()`.
- [ ] T043 Implementar `validate()`.
- [ ] T044 Implementar cálculo de progreso sin confiar en porcentaje enviado por cliente.
- [ ] T045 Integrar autosave 800 ms.
- [ ] T046 Restaurar S7 en segundo navegador.
- [ ] T047 Verificar 10 ciclos cerrar/reabrir sin pérdida.

## Fase 5 · Entrega

- [ ] T050 Diseñar operación server-side para crear snapshot desde estado autorizado.
- [ ] T051 Implementar entrega.
- [ ] T052 Probar que estudiante no puede `UPDATE` submission.
- [ ] T053 Probar que estudiante no puede `DELETE` submission.
- [ ] T054 Probar reenvío según política de intentos.

## Fase 6 · Docente

- [ ] T060 Vista mínima de estudiantes/progreso de cohorte asignada.
- [ ] T061 Vista de entrega.
- [ ] T062 Renderizar todo contenido del estudiante sin HTML ejecutable.
- [ ] T063 Probar XSS almacenado.
- [ ] T064 Probar que docente B no consulta cohorte A.

## Fase 7 · Supply chain y CI

- [x] T070 Workflow de seguridad.
- [x] T071 Actions críticas fijadas por SHA.
- [x] T072 Secret guard básico.
- [x] T073 CodeQL JavaScript/Python.
- [ ] T074 Activar Snyk cuando exista `SNYK_TOKEN` y definir gate de severidad.
- [ ] T075 Añadir dependency review/renovación controlada si el repositorio/plan lo permite.
- [ ] T076 Añadir test automatizado de migraciones y RLS a CI.

## Fase 8 · Piloto controlado

- [ ] T080 Ejecutar recorrido completo con 3–5 usuarios ficticios.
- [ ] T081 Revisar privacidad y consentimiento/aviso aplicable.
- [ ] T082 Configurar backup y probar restauración.
- [ ] T083 Ejecutar piloto con grupo pequeño real.
- [ ] T084 Recoger métricas y defectos.
- [ ] T085 Decisión explícita GO / ITERATE / STOP.

## Gate final del piloto

No hay GO si cualquiera es falso:

- [ ] 0 accesos cruzados exitosos.
- [ ] 0 escaladas de rol exitosas.
- [ ] 0 XSS almacenados ejecutados.
- [ ] 10/10 restauraciones multi-dispositivo correctas.
- [ ] 100 % submissions inmutables para estudiante.
- [ ] backups probados.
- [ ] CI verde.
