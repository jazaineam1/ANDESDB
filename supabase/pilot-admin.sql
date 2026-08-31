-- ANDESDB · Piloto LMS · operaciones administrativas manuales
-- Ejecutar únicamente desde el SQL Editor de Supabase con una cuenta administradora.
-- NO copiar este flujo al navegador y NO introducir claves secretas en este archivo.
--
-- Cambia SOLO los valores marcados PON_... antes de ejecutar cada bloque.

-- ---------------------------------------------------------------------------
-- A) Activar matrícula de un estudiante ya creado en Supabase Auth.
-- ---------------------------------------------------------------------------
do $$
declare
  v_email text := 'PON_EMAIL_ESTUDIANTE';
  v_user_id uuid;
  v_cohort_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No existe usuario Auth para %', v_email;
  end if;

  select ch.id into v_cohort_id
  from public.cohorts ch
  join public.courses c on c.id = ch.course_id
  where c.slug = 'andesdb' and ch.slug = 'piloto-2026';

  if v_cohort_id is null then
    raise exception 'No existe la cohorte piloto';
  end if;

  insert into public.enrollments(cohort_id, user_id, status)
  values (v_cohort_id, v_user_id, 'active')
  on conflict (cohort_id, user_id)
  do update set status = 'active';
end $$;

-- ---------------------------------------------------------------------------
-- B) Convertir una cuenta existente en docente y asignarle SOLO la cohorte.
-- ---------------------------------------------------------------------------
do $$
declare
  v_email text := 'PON_EMAIL_DOCENTE';
  v_user_id uuid;
  v_cohort_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No existe usuario Auth para %', v_email;
  end if;

  select ch.id into v_cohort_id
  from public.cohorts ch
  join public.courses c on c.id = ch.course_id
  where c.slug = 'andesdb' and ch.slug = 'piloto-2026';

  update public.user_roles
  set role = 'teacher', assigned_at = now(), assigned_by = null
  where user_id = v_user_id;

  insert into public.teacher_cohorts(teacher_id, cohort_id)
  values (v_user_id, v_cohort_id)
  on conflict (teacher_id, cohort_id) do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- C) Deshabilitar acceso sin borrar evidencias académicas.
-- ---------------------------------------------------------------------------
-- update public.enrollments e
-- set status = 'disabled'
-- from auth.users u
-- where e.user_id = u.id
--   and lower(u.email) = lower('PON_EMAIL');

-- ---------------------------------------------------------------------------
-- D) Verificación administrativa rápida.
-- Nunca compartir esta salida si contiene correos reales.
-- ---------------------------------------------------------------------------
-- select u.email, r.role, e.status, c.slug as cohort
-- from auth.users u
-- join public.user_roles r on r.user_id = u.id
-- left join public.enrollments e on e.user_id = u.id
-- left join public.cohorts c on c.id = e.cohort_id
-- order by u.email;
