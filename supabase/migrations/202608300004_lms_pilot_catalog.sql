-- ANDESDB · Piloto LMS · catálogo y lecturas 004
-- Datos no personales del piloto + RPC de lectura que no aceptan IDs de usuario.

begin;

-- ---------------------------------------------------------------------------
-- Catálogo idempotente del piloto.
-- ---------------------------------------------------------------------------
insert into public.courses(slug, title, active)
values ('andesdb', 'Diseño y Gestión de Bases de Datos con SQL', true)
on conflict (slug) do update
set title = excluded.title,
    active = true;

insert into public.cohorts(course_id, slug, name, active)
select c.id, 'piloto-2026', 'Piloto LMS 2026', true
from public.courses c
where c.slug = 'andesdb'
on conflict (course_id, slug) do update
set name = excluded.name,
    active = true;

insert into public.activities(
  course_id, slug, version, title, max_step, published,
  release_at, due_at, active, max_attempts
)
select
  c.id,
  's7-restaurante-abc',
  1,
  'Sesión 7 · De las reglas al modelo · Restaurante ABC',
  7,
  true,
  now(),
  null,
  true,
  3
from public.courses c
where c.slug = 'andesdb'
on conflict (course_id, slug, version) do update
set title = excluded.title,
    max_step = excluded.max_step,
    published = true,
    active = true,
    max_attempts = excluded.max_attempts;

-- ---------------------------------------------------------------------------
-- Cargar estado propio sin que el navegador tenga que conocer enrollment_id.
-- ---------------------------------------------------------------------------
create or replace function public.load_my_activity_state(p_activity_id uuid)
returns table (
  state jsonb,
  revision bigint,
  activity_version integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_enrollment_id uuid;
begin
  v_enrollment_id := public.resolve_own_enrollment_for_activity(p_activity_id);

  return query
  select s.state, s.revision, s.activity_version, s.updated_at
  from public.activity_state s
  where s.enrollment_id = v_enrollment_id
    and s.activity_id = p_activity_id;
end;
$$;

revoke all on function public.load_my_activity_state(uuid) from public;
revoke all on function public.load_my_activity_state(uuid) from anon;
grant execute on function public.load_my_activity_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Consultar una entrega desde el rol docente/admin.
-- Si attempt_no es NULL devuelve el último intento.
-- ---------------------------------------------------------------------------
create or replace function public.get_teacher_submission(
  p_enrollment_id uuid,
  p_activity_id uuid,
  p_attempt_no integer default null
)
returns table (
  submission_id uuid,
  attempt_no integer,
  submitted_at timestamptz,
  activity_version integer,
  state_snapshot jsonb
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not public.teaches_enrollment(p_enrollment_id) then
    raise exception using errcode = '42501', message = 'enrollment not assigned';
  end if;

  return query
  select s.id, s.attempt_no, s.submitted_at, s.activity_version, s.state_snapshot
  from public.submissions s
  where s.enrollment_id = p_enrollment_id
    and s.activity_id = p_activity_id
    and (p_attempt_no is null or s.attempt_no = p_attempt_no)
  order by s.attempt_no desc
  limit 1;
end;
$$;

revoke all on function public.get_teacher_submission(uuid, uuid, integer) from public;
revoke all on function public.get_teacher_submission(uuid, uuid, integer) from anon;
grant execute on function public.get_teacher_submission(uuid, uuid, integer) to authenticated;

commit;
