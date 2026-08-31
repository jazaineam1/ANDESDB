-- ANDESDB · Piloto LMS · pruebas adversariales RLS/RPC
-- Ejecutar en un proyecto DE PRUEBA después de migrations 001..004.
--
-- Este archivo no contiene IDs reales. Sustituir marcadores y ejecutar cada
-- escenario por separado desde SQL Editor. Nunca versionar la versión rellenada.
--
-- Marcadores:
--   <STUDENT_A_UUID>       auth.users.id
--   <STUDENT_B_UUID>
--   <NO_ENROLL_UUID>
--   <TEACHER_A_UUID>
--   <TEACHER_B_UUID>
--   <ENROLLMENT_A_UUID>
--   <ENROLLMENT_B_UUID>
--   <COHORT_A_UUID>
--   <COHORT_B_UUID>
--   <ACTIVITY_UUID>

-- ===========================================================================
-- Helper de contexto
-- Para simular una petición PostgREST desde SQL Editor:
--
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- ... prueba ...
-- ROLLBACK;
-- ===========================================================================

-- T01 · STUDENT A ve su matrícula. ESPERADO: 1 fila.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT count(*) FROM public.enrollments WHERE id = '<ENROLLMENT_A_UUID>'::uuid;
-- ROLLBACK;

-- T02 · STUDENT A intenta leer matrícula B. ESPERADO: 0 filas.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT count(*) FROM public.enrollments WHERE id = '<ENROLLMENT_B_UUID>'::uuid;
-- ROLLBACK;

-- T03 · STUDENT A intenta leer estado B. ESPERADO: 0 filas.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT count(*) FROM public.activity_state WHERE enrollment_id = '<ENROLLMENT_B_UUID>'::uuid;
-- ROLLBACK;

-- T04 · Sin matrícula consulta dashboard. ESPERADO: 0 filas.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<NO_ENROLL_UUID>', true);
-- SELECT * FROM public.get_my_dashboard();
-- ROLLBACK;

-- T05 · ANON intenta leer tablas. ESPERADO: permission denied.
-- BEGIN;
-- SET LOCAL ROLE anon;
-- SELECT * FROM public.activity_state LIMIT 1;
-- ROLLBACK;

-- T06 · STUDENT A intenta elevar rol. ESPERADO: permission denied.
-- Ejecutar como bloque independiente porque el error aborta la transacción.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- UPDATE public.user_roles SET role = 'teacher' WHERE user_id = '<STUDENT_A_UUID>'::uuid;
-- ROLLBACK;

-- T07 · STUDENT A intenta autoinscribirse. ESPERADO: permission denied.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- INSERT INTO public.enrollments(cohort_id,user_id,status)
-- VALUES ('<COHORT_B_UUID>'::uuid,'<STUDENT_A_UUID>'::uuid,'active');
-- ROLLBACK;

-- T08 · Primer autosave propio. ESPERADO: revision=1.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT * FROM public.save_activity_state(
--   '<ACTIVITY_UUID>'::uuid,
--   '{"schema":1,"activity":"s7-restaurante-abc","case":"abc","modelCode":"ABC1:test","step":2}'::jsonb,
--   0,
--   2
-- );
-- COMMIT; -- esta prueba sí persiste; limpiar luego si se necesita repetir.

-- T09 · Concurrencia: repetir un save con expected_revision vieja.
-- ESPERADO: error SQLSTATE 40001 / revision conflict; NO sobrescribe.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT * FROM public.save_activity_state(
--   '<ACTIVITY_UUID>'::uuid,
--   '{"schema":1,"activity":"s7-restaurante-abc","case":"abc","modelCode":"ABC1:stale","step":3}'::jsonb,
--   1,
--   3
-- );
-- ROLLBACK;

-- T10 · Payload >512 KiB. ESPERADO: error controlado.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT * FROM public.save_activity_state(
--   '<ACTIVITY_UUID>'::uuid,
--   jsonb_build_object('schema',1,'blob',repeat('x',530000)),
--   1,
--   3
-- );
-- ROLLBACK;

-- T11 · Entrega toma estado del servidor.
-- ESPERADO: crea intento; snapshot coincide con activity_state confirmado.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- SELECT * FROM public.submit_activity('<ACTIVITY_UUID>'::uuid, <REVISION_ACTUAL>);
-- COMMIT;

-- T12 · STUDENT intenta UPDATE de submission. ESPERADO: permission denied.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- UPDATE public.submissions SET attempt_no = 9 WHERE enrollment_id = '<ENROLLMENT_A_UUID>'::uuid;
-- ROLLBACK;

-- T13 · STUDENT intenta DELETE de submission. ESPERADO: permission denied.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<STUDENT_A_UUID>', true);
-- DELETE FROM public.submissions WHERE enrollment_id = '<ENROLLMENT_A_UUID>'::uuid;
-- ROLLBACK;

-- T14 · TEACHER A consulta su cohorte. ESPERADO: filas solo de COHORT_A.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<TEACHER_A_UUID>', true);
-- SELECT * FROM public.get_teacher_cohort_progress('<COHORT_A_UUID>'::uuid);
-- ROLLBACK;

-- T15 · TEACHER A consulta cohorte B no asignada. ESPERADO: 42501.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<TEACHER_A_UUID>', true);
-- SELECT * FROM public.get_teacher_cohort_progress('<COHORT_B_UUID>'::uuid);
-- ROLLBACK;

-- T16 · TEACHER A consulta entrega de enrollment B no asignado. ESPERADO: 42501.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', '<TEACHER_A_UUID>', true);
-- SELECT * FROM public.get_teacher_submission(
--   '<ENROLLMENT_B_UUID>'::uuid,
--   '<ACTIVITY_UUID>'::uuid,
--   null
-- );
-- ROLLBACK;

-- T17 · Verificar privilegios peligrosos. ESPERADO: 0 filas para anon y
-- ausencia de INSERT/UPDATE directos sobre state/progress/submissions para
-- authenticated después de migration 003.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and grantee in ('anon','authenticated')
  and table_name in ('activity_state','activity_progress','submissions','user_roles','enrollments')
order by grantee, table_name, privilege_type;
