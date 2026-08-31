-- ANDESDB · Piloto LMS · hardening 002
-- Reduce privilegios de columna y elimina dos oráculos/autorizaciones demasiado amplios.

begin;

-- ------------------------------------------------------------------
-- 1) Un docente solo puede ver perfiles/roles de cohortes asignadas.
-- ------------------------------------------------------------------

create or replace function public.can_view_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p_user_id = auth.uid()
    or exists (
      select 1
      from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
    or exists (
      select 1
      from public.enrollments e
      join public.teacher_cohorts tc on tc.cohort_id = e.cohort_id
      where e.user_id = p_user_id
        and tc.teacher_id = auth.uid()
    );
$$;

revoke all on function public.can_view_user(uuid) from public;
grant execute on function public.can_view_user(uuid) to authenticated;

drop policy if exists profiles_select_self_or_staff on public.profiles;
create policy profiles_select_authorized
on public.profiles for select to authenticated
using (public.can_view_user(user_id));

drop policy if exists roles_select_self_or_staff on public.user_roles;
create policy roles_select_authorized
on public.user_roles for select to authenticated
using (public.can_view_user(user_id));

-- ------------------------------------------------------------------
-- 2) El helper de actividad solo responde TRUE para la matrícula propia.
-- Evita usarlo como oráculo de relaciones ajenas.
-- ------------------------------------------------------------------

create or replace function public.activity_allowed_for_enrollment(
  p_enrollment_id uuid,
  p_activity_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.cohorts c on c.id = e.cohort_id
    join public.activities a on a.course_id = c.course_id
    where e.id = p_enrollment_id
      and e.user_id = auth.uid()
      and e.status = 'active'
      and a.id = p_activity_id
      and a.published = true
      and (a.release_at is null or a.release_at <= now())
  );
$$;

revoke all on function public.activity_allowed_for_enrollment(uuid, uuid) from public;
grant execute on function public.activity_allowed_for_enrollment(uuid, uuid) to authenticated;

-- ------------------------------------------------------------------
-- 3) Campos que el cliente NO controla.
-- ------------------------------------------------------------------

create or replace function public.prepare_activity_state()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_version integer;
begin
  select a.version into v_version
  from public.activities a
  where a.id = new.activity_id;

  if v_version is null then
    raise exception 'activity not found';
  end if;

  if tg_op = 'INSERT' then
    new.activity_version := v_version;
    new.revision := 1;
  else
    if new.enrollment_id is distinct from old.enrollment_id
       or new.activity_id is distinct from old.activity_id then
      raise exception 'identity columns are immutable';
    end if;
    new.activity_version := old.activity_version;
    new.revision := old.revision + 1;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_activity_state() from public;

drop trigger if exists state_bump_revision on public.activity_state;
drop trigger if exists state_prepare_server_fields on public.activity_state;
create trigger state_prepare_server_fields
before insert or update on public.activity_state
for each row execute function public.prepare_activity_state();

create or replace function public.prepare_submission()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_version integer;
begin
  select a.version into v_version
  from public.activities a
  where a.id = new.activity_id;

  if v_version is null then
    raise exception 'activity not found';
  end if;

  new.activity_version := v_version;
  new.submitted_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_submission() from public;

drop trigger if exists submission_prepare_server_fields on public.submissions;
create trigger submission_prepare_server_fields
before insert on public.submissions
for each row execute function public.prepare_submission();

create or replace function public.prepare_feedback()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    new.teacher_id := auth.uid();
    new.created_at := now();
  else
    if new.submission_id is distinct from old.submission_id
       or new.teacher_id is distinct from old.teacher_id then
      raise exception 'identity columns are immutable';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.prepare_feedback() from public;

drop trigger if exists feedback_touch_updated_at on public.feedback;
drop trigger if exists feedback_prepare_server_fields on public.feedback;
create trigger feedback_prepare_server_fields
before insert or update on public.feedback
for each row execute function public.prepare_feedback();

-- ------------------------------------------------------------------
-- 4) Privilegios por columna: la RLS decide QUÉ fila; GRANT decide QUÉ campo.
-- ------------------------------------------------------------------

revoke insert, update on public.activity_progress from authenticated;
grant insert (enrollment_id, activity_id, status, current_step, percent)
  on public.activity_progress to authenticated;
grant update (status, current_step, percent)
  on public.activity_progress to authenticated;

revoke insert, update on public.activity_state from authenticated;
grant insert (enrollment_id, activity_id, state)
  on public.activity_state to authenticated;
grant update (state)
  on public.activity_state to authenticated;

revoke insert on public.submissions from authenticated;
grant insert (enrollment_id, activity_id, attempt_no, state_snapshot)
  on public.submissions to authenticated;

revoke insert, update on public.feedback from authenticated;
grant insert (submission_id, body, score)
  on public.feedback to authenticated;
grant update (body, score)
  on public.feedback to authenticated;

-- DELETE de feedback sigue sometido a la policy del docente; no se concede
-- DELETE sobre submissions ni activity_state a estudiantes.

commit;
