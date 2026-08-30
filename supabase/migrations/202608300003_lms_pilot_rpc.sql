-- ANDESDB · Piloto LMS · RPC 003
-- Operaciones atómicas para autosave, dashboard y entrega.
-- El cliente nunca elige enrollment_id ni controla revision/timestamps.

begin;

alter table public.activities
  add column if not exists max_attempts smallint not null default 3;

alter table public.activities
  drop constraint if exists activities_max_attempts;
alter table public.activities
  add constraint activities_max_attempts check (max_attempts between 1 and 10);

-- El cliente deja de escribir directamente estas tablas. Las escrituras pasan
-- por funciones que derivan identidad desde auth.uid() y aplican concurrencia.
revoke insert, update on public.activity_state from authenticated;
revoke insert, update on public.activity_progress from authenticated;
revoke insert on public.submissions from authenticated;

-- ---------------------------------------------------------------------------
-- Resolver la matrícula activa del usuario para una actividad.
-- No se expone al cliente: es un helper de funciones SECURITY DEFINER.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_own_enrollment_for_activity(p_activity_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_enrollment_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  select e.id
    into v_enrollment_id
  from public.activities a
  join public.cohorts c
    on c.course_id = a.course_id
   and c.active = true
  join public.enrollments e
    on e.cohort_id = c.id
   and e.user_id = auth.uid()
   and e.status = 'active'
  where a.id = p_activity_id
    and a.active is distinct from false
    and a.published = true
    and (a.release_at is null or a.release_at <= now())
  order by e.enrolled_at desc
  limit 1;

  if v_enrollment_id is null then
    raise exception using errcode = '42501', message = 'activity not available for current user';
  end if;

  return v_enrollment_id;
end;
$$;

-- La columna active no existía en la primera versión de activities. Añadirla
-- antes de recompilar el helper anterior en instalaciones desde cero.
-- PostgreSQL valida nombres al crear la función, por eso hacemos el ajuste y
-- recreamos el helper de forma idempotente inmediatamente después.
alter table public.activities
  add column if not exists active boolean not null default true;

create or replace function public.resolve_own_enrollment_for_activity(p_activity_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_enrollment_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  select e.id
    into v_enrollment_id
  from public.activities a
  join public.cohorts c
    on c.course_id = a.course_id
   and c.active = true
  join public.enrollments e
    on e.cohort_id = c.id
   and e.user_id = auth.uid()
   and e.status = 'active'
  where a.id = p_activity_id
    and a.active = true
    and a.published = true
    and (a.release_at is null or a.release_at <= now())
  order by e.enrolled_at desc
  limit 1;

  if v_enrollment_id is null then
    raise exception using errcode = '42501', message = 'activity not available for current user';
  end if;

  return v_enrollment_id;
end;
$$;

revoke all on function public.resolve_own_enrollment_for_activity(uuid) from public;
revoke all on function public.resolve_own_enrollment_for_activity(uuid) from anon;
revoke all on function public.resolve_own_enrollment_for_activity(uuid) from authenticated;

-- ---------------------------------------------------------------------------
-- Autosave con control optimista de concurrencia.
-- expected_revision = null/0 únicamente para el primer guardado.
-- ---------------------------------------------------------------------------
create or replace function public.save_activity_state(
  p_activity_id uuid,
  p_state jsonb,
  p_expected_revision bigint default null,
  p_current_step integer default 0
)
returns table (
  revision bigint,
  updated_at timestamptz,
  activity_version integer,
  current_step integer,
  percent smallint,
  status public.progress_status
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_enrollment_id uuid;
  v_activity_version integer;
  v_max_step integer;
  v_revision bigint;
  v_updated_at timestamptz;
  v_percent smallint;
  v_status public.progress_status;
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception using errcode = '22023', message = 'state must be a JSON object';
  end if;

  if octet_length(p_state::text) > 524288 then
    raise exception using errcode = '22001', message = 'state exceeds 512 KiB';
  end if;

  v_enrollment_id := public.resolve_own_enrollment_for_activity(p_activity_id);

  select a.version, a.max_step
    into v_activity_version, v_max_step
  from public.activities a
  where a.id = p_activity_id;

  if p_current_step < 0 or p_current_step > v_max_step then
    raise exception using errcode = '22023', message = 'current_step out of range';
  end if;

  select s.revision
    into v_revision
  from public.activity_state s
  where s.enrollment_id = v_enrollment_id
    and s.activity_id = p_activity_id
  for update;

  if found then
    if p_expected_revision is null or p_expected_revision <> v_revision then
      raise exception using
        errcode = '40001',
        message = 'revision conflict',
        detail = format('expected=%s actual=%s', coalesce(p_expected_revision::text, 'null'), v_revision);
    end if;

    update public.activity_state s
       set state = p_state
     where s.enrollment_id = v_enrollment_id
       and s.activity_id = p_activity_id
    returning s.revision, s.updated_at
      into v_revision, v_updated_at;
  else
    if coalesce(p_expected_revision, 0) <> 0 then
      raise exception using errcode = '40001', message = 'revision conflict on initial save';
    end if;

    insert into public.activity_state(enrollment_id, activity_id, activity_version, state)
    values (v_enrollment_id, p_activity_id, v_activity_version, p_state)
    returning public.activity_state.revision, public.activity_state.updated_at
      into v_revision, v_updated_at;
  end if;

  v_percent := case
    when v_max_step <= 0 then 0
    else least(100, greatest(0, round((p_current_step::numeric * 100) / v_max_step)::integer))::smallint
  end;

  v_status := case
    when p_current_step <= 0 then 'not_started'::public.progress_status
    when p_current_step >= v_max_step then 'completed'::public.progress_status
    else 'in_progress'::public.progress_status
  end;

  insert into public.activity_progress(enrollment_id, activity_id, status, current_step, percent)
  values (v_enrollment_id, p_activity_id, v_status, p_current_step, v_percent)
  on conflict (enrollment_id, activity_id)
  do update set
    status = excluded.status,
    current_step = excluded.current_step,
    percent = excluded.percent;

  return query
  select v_revision, v_updated_at, v_activity_version, p_current_step, v_percent, v_status;
end;
$$;

revoke all on function public.save_activity_state(uuid, jsonb, bigint, integer) from public;
revoke all on function public.save_activity_state(uuid, jsonb, bigint, integer) from anon;
grant execute on function public.save_activity_state(uuid, jsonb, bigint, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Entrega: snapshot tomado exclusivamente del estado confirmado en servidor.
-- ---------------------------------------------------------------------------
create or replace function public.submit_activity(
  p_activity_id uuid,
  p_expected_revision bigint
)
returns table (
  submission_id uuid,
  attempt_no integer,
  submitted_at timestamptz,
  activity_version integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_enrollment_id uuid;
  v_state jsonb;
  v_revision bigint;
  v_version integer;
  v_attempt integer;
  v_max_attempts integer;
  v_submission_id uuid;
  v_submitted_at timestamptz;
begin
  v_enrollment_id := public.resolve_own_enrollment_for_activity(p_activity_id);

  select s.state, s.revision, s.activity_version
    into v_state, v_revision, v_version
  from public.activity_state s
  where s.enrollment_id = v_enrollment_id
    and s.activity_id = p_activity_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'nothing saved to submit';
  end if;

  if p_expected_revision is null or p_expected_revision <> v_revision then
    raise exception using errcode = '40001', message = 'revision conflict before submit';
  end if;

  select a.max_attempts into v_max_attempts
  from public.activities a
  where a.id = p_activity_id;

  select coalesce(max(s.attempt_no), 0) + 1
    into v_attempt
  from public.submissions s
  where s.enrollment_id = v_enrollment_id
    and s.activity_id = p_activity_id;

  if v_attempt > v_max_attempts then
    raise exception using errcode = '22023', message = 'maximum submissions reached';
  end if;

  insert into public.submissions(
    enrollment_id, activity_id, activity_version, attempt_no, state_snapshot
  ) values (
    v_enrollment_id, p_activity_id, v_version, v_attempt, v_state
  )
  returning id, public.submissions.submitted_at
    into v_submission_id, v_submitted_at;

  return query
  select v_submission_id, v_attempt, v_submitted_at, v_version;
end;
$$;

revoke all on function public.submit_activity(uuid, bigint) from public;
revoke all on function public.submit_activity(uuid, bigint) from anon;
grant execute on function public.submit_activity(uuid, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard del estudiante. Solo devuelve datos propios.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_dashboard()
returns table (
  enrollment_id uuid,
  cohort_id uuid,
  cohort_name text,
  activity_id uuid,
  activity_slug text,
  activity_version integer,
  activity_title text,
  max_step integer,
  current_step integer,
  percent smallint,
  status public.progress_status,
  updated_at timestamptz,
  submitted_attempts bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    e.id,
    c.id,
    c.name,
    a.id,
    a.slug,
    a.version,
    a.title,
    a.max_step,
    coalesce(p.current_step, 0),
    coalesce(p.percent, 0)::smallint,
    coalesce(p.status, 'not_started'::public.progress_status),
    p.updated_at,
    (select count(*) from public.submissions s
      where s.enrollment_id = e.id and s.activity_id = a.id)
  from public.enrollments e
  join public.cohorts c on c.id = e.cohort_id and c.active = true
  join public.activities a on a.course_id = c.course_id
    and a.active = true
    and a.published = true
    and (a.release_at is null or a.release_at <= now())
  left join public.activity_progress p
    on p.enrollment_id = e.id and p.activity_id = a.id
  where e.user_id = auth.uid()
    and e.status = 'active'
  order by a.slug, a.version desc;
$$;

revoke all on function public.get_my_dashboard() from public;
revoke all on function public.get_my_dashboard() from anon;
grant execute on function public.get_my_dashboard() to authenticated;

-- ---------------------------------------------------------------------------
-- Vista docente mínima. El docente debe estar asignado a la cohorte.
-- ---------------------------------------------------------------------------
create or replace function public.get_teacher_cohort_progress(p_cohort_id uuid)
returns table (
  student_id uuid,
  display_name text,
  activity_id uuid,
  activity_slug text,
  activity_title text,
  current_step integer,
  percent smallint,
  status public.progress_status,
  updated_at timestamptz,
  submitted_attempts bigint
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

  if not exists (
    select 1 from public.teacher_cohorts tc
    where tc.teacher_id = auth.uid() and tc.cohort_id = p_cohort_id
  ) and not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'cohort not assigned';
  end if;

  return query
  select
    e.user_id,
    p0.display_name,
    a.id,
    a.slug,
    a.title,
    coalesce(ap.current_step, 0),
    coalesce(ap.percent, 0)::smallint,
    coalesce(ap.status, 'not_started'::public.progress_status),
    ap.updated_at,
    (select count(*) from public.submissions s
      where s.enrollment_id = e.id and s.activity_id = a.id)
  from public.enrollments e
  join public.cohorts c on c.id = e.cohort_id
  join public.activities a on a.course_id = c.course_id and a.active = true
  left join public.profiles p0 on p0.user_id = e.user_id
  left join public.activity_progress ap
    on ap.enrollment_id = e.id and ap.activity_id = a.id
  where e.cohort_id = p_cohort_id
    and e.status = 'active'
  order by coalesce(p0.display_name, e.user_id::text), a.slug;
end;
$$;

revoke all on function public.get_teacher_cohort_progress(uuid) from public;
revoke all on function public.get_teacher_cohort_progress(uuid) from anon;
grant execute on function public.get_teacher_cohort_progress(uuid) to authenticated;

commit;
