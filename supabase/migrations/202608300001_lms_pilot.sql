-- ANDESDB · Piloto LMS seguro
-- Baseline: deny-by-default, mínimo privilegio y RLS en toda tabla expuesta.
-- Ejecutar SOLO en un proyecto Supabase de piloto.

begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Tipos
-- ------------------------------------------------------------------

do $$ begin
  create type public.app_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.enrollment_status as enum ('invited', 'active', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_len check (
    display_name is null or char_length(display_name) between 1 and 120
  )
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint courses_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  constraint courses_title_len check (char_length(title) between 1 and 160)
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  slug text not null,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, slug),
  constraint cohorts_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  constraint cohorts_name_len check (char_length(name) between 1 and 160),
  constraint cohorts_dates check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.teacher_cohorts (
  teacher_id uuid not null references auth.users(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, cohort_id)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.enrollment_status not null default 'invited',
  enrolled_at timestamptz not null default now(),
  unique (cohort_id, user_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  slug text not null,
  version integer not null default 1,
  title text not null,
  max_step integer not null default 1,
  published boolean not null default false,
  release_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (course_id, slug, version),
  constraint activities_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,95}$'),
  constraint activities_version_positive check (version > 0),
  constraint activities_max_step check (max_step between 1 and 200),
  constraint activities_title_len check (char_length(title) between 1 and 200),
  constraint activities_dates check (due_at is null or release_at is null or due_at > release_at)
);

create table if not exists public.activity_progress (
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  status public.progress_status not null default 'not_started',
  current_step integer not null default 0,
  percent smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, activity_id),
  constraint progress_current_step check (current_step between 0 and 200),
  constraint progress_percent check (percent between 0 and 100)
);

create table if not exists public.activity_state (
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  activity_version integer not null,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, activity_id),
  constraint state_is_object check (jsonb_typeof(state) = 'object'),
  constraint state_payload_limit check (octet_length(state::text) <= 524288),
  constraint state_version_positive check (activity_version > 0),
  constraint state_revision_positive check (revision > 0)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete restrict,
  activity_id uuid not null references public.activities(id) on delete restrict,
  activity_version integer not null,
  attempt_no integer not null default 1,
  state_snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  unique (enrollment_id, activity_id, attempt_no),
  constraint submissions_snapshot_object check (jsonb_typeof(state_snapshot) = 'object'),
  constraint submissions_payload_limit check (octet_length(state_snapshot::text) <= 524288),
  constraint submissions_version_positive check (activity_version > 0),
  constraint submissions_attempt check (attempt_no between 1 and 20)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_body_len check (char_length(body) between 1 and 5000),
  constraint feedback_score check (score is null or score between 0 and 100)
);

-- ------------------------------------------------------------------
-- Índices usados por RLS y dashboards
-- ------------------------------------------------------------------

create index if not exists enrollments_user_idx on public.enrollments(user_id);
create index if not exists enrollments_cohort_idx on public.enrollments(cohort_id);
create index if not exists activities_course_idx on public.activities(course_id, published);
create index if not exists progress_activity_idx on public.activity_progress(activity_id);
create index if not exists state_activity_idx on public.activity_state(activity_id);
create index if not exists submissions_activity_idx on public.submissions(activity_id, submitted_at desc);
create index if not exists teacher_cohorts_teacher_idx on public.teacher_cohorts(teacher_id);
create index if not exists feedback_submission_idx on public.feedback(submission_id);

-- ------------------------------------------------------------------
-- Triggers de servidor
-- ------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.bump_activity_state_revision()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.bootstrap_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, null)
  on conflict (user_id) do nothing;

  insert into public.user_roles(user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.bootstrap_new_user() from public;

-- Trigger en auth.users: solo crea perfil y rol student; NO matricula.
drop trigger if exists on_auth_user_created_andesdb on auth.users;
create trigger on_auth_user_created_andesdb
after insert on auth.users
for each row execute function public.bootstrap_new_user();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists progress_touch_updated_at on public.activity_progress;
create trigger progress_touch_updated_at
before update on public.activity_progress
for each row execute function public.touch_updated_at();

drop trigger if exists state_bump_revision on public.activity_state;
create trigger state_bump_revision
before update on public.activity_state
for each row execute function public.bump_activity_state_revision();

drop trigger if exists feedback_touch_updated_at on public.feedback;
create trigger feedback_touch_updated_at
before update on public.feedback
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------
-- Helpers de autorización. Devuelven booleanos; nunca datos.
-- SECURITY DEFINER con search_path fijo para evitar escalada por objetos sombra.
-- ------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = auth.uid()
      and r.role in ('teacher', 'admin')
  );
$$;

create or replace function public.owns_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.id = p_enrollment_id
      and e.user_id = auth.uid()
      and e.status = 'active'
  );
$$;

create or replace function public.teaches_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.teacher_cohorts tc on tc.cohort_id = e.cohort_id
    where e.id = p_enrollment_id
      and tc.teacher_id = auth.uid()
  ) or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  );
$$;

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
      and a.id = p_activity_id
      and a.published = true
      and (a.release_at is null or a.release_at <= now())
  );
$$;

revoke all on function public.is_staff() from public;
revoke all on function public.owns_enrollment(uuid) from public;
revoke all on function public.teaches_enrollment(uuid) from public;
revoke all on function public.activity_allowed_for_enrollment(uuid, uuid) from public;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.owns_enrollment(uuid) to authenticated;
grant execute on function public.teaches_enrollment(uuid) to authenticated;
grant execute on function public.activity_allowed_for_enrollment(uuid, uuid) to authenticated;

-- ------------------------------------------------------------------
-- RLS: ON en toda tabla expuesta.
-- ------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.cohorts enable row level security;
alter table public.teacher_cohorts enable row level security;
alter table public.enrollments enable row level security;
alter table public.activities enable row level security;
alter table public.activity_progress enable row level security;
alter table public.activity_state enable row level security;
alter table public.submissions enable row level security;
alter table public.feedback enable row level security;

-- Evita acceso accidental anónimo incluso si una policy futura se escribe mal.
revoke all on table public.profiles from anon;
revoke all on table public.user_roles from anon;
revoke all on table public.courses from anon;
revoke all on table public.cohorts from anon;
revoke all on table public.teacher_cohorts from anon;
revoke all on table public.enrollments from anon;
revoke all on table public.activities from anon;
revoke all on table public.activity_progress from anon;
revoke all on table public.activity_state from anon;
revoke all on table public.submissions from anon;
revoke all on table public.feedback from anon;

-- Mínimos privilegios del rol authenticated.
revoke all on table public.profiles from authenticated;
revoke all on table public.user_roles from authenticated;
revoke all on table public.courses from authenticated;
revoke all on table public.cohorts from authenticated;
revoke all on table public.teacher_cohorts from authenticated;
revoke all on table public.enrollments from authenticated;
revoke all on table public.activities from authenticated;
revoke all on table public.activity_progress from authenticated;
revoke all on table public.activity_state from authenticated;
revoke all on table public.submissions from authenticated;
revoke all on table public.feedback from authenticated;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.courses, public.cohorts, public.teacher_cohorts,
                public.enrollments, public.activities to authenticated;
grant select, insert, update on public.activity_progress to authenticated;
grant select, insert, update on public.activity_state to authenticated;
grant select, insert on public.submissions to authenticated;
grant select, insert, update, delete on public.feedback to authenticated;

-- ------------------------------------------------------------------
-- Policies
-- ------------------------------------------------------------------

-- Profiles
create policy profiles_select_self_or_staff
on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_staff());

create policy profiles_update_self
on public.profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Roles: visibles solo para sí mismo y staff; nadie authenticated los modifica.
create policy roles_select_self_or_staff
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.is_staff());

-- Cursos/cohortes/actividades: solo si existe matrícula activa o acceso docente.
create policy courses_select_authorized
on public.courses for select to authenticated
using (
  exists (
    select 1
    from public.cohorts c
    join public.enrollments e on e.cohort_id = c.id
    where c.course_id = courses.id
      and e.user_id = auth.uid()
      and e.status = 'active'
  )
  or exists (
    select 1 from public.cohorts c
    join public.teacher_cohorts tc on tc.cohort_id = c.id
    where c.course_id = courses.id and tc.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
);

create policy cohorts_select_authorized
on public.cohorts for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.cohort_id = cohorts.id
      and e.user_id = auth.uid()
      and e.status = 'active'
  )
  or exists (
    select 1 from public.teacher_cohorts tc
    where tc.cohort_id = cohorts.id and tc.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
);

create policy teacher_cohorts_select_self_or_admin
on public.teacher_cohorts for select to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
);

create policy enrollments_select_self_or_teacher
on public.enrollments for select to authenticated
using (
  user_id = auth.uid()
  or public.teaches_enrollment(id)
);

create policy activities_select_authorized
on public.activities for select to authenticated
using (
  (
    published = true
    and (release_at is null or release_at <= now())
    and exists (
      select 1
      from public.cohorts c
      join public.enrollments e on e.cohort_id = c.id
      where c.course_id = activities.course_id
        and e.user_id = auth.uid()
        and e.status = 'active'
    )
  )
  or exists (
    select 1 from public.cohorts c
    join public.teacher_cohorts tc on tc.cohort_id = c.id
    where c.course_id = activities.course_id and tc.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
);

-- Progress
create policy progress_select_owner_or_teacher
on public.activity_progress for select to authenticated
using (
  public.owns_enrollment(enrollment_id)
  or public.teaches_enrollment(enrollment_id)
);

create policy progress_insert_owner
on public.activity_progress for insert to authenticated
with check (
  public.owns_enrollment(enrollment_id)
  and public.activity_allowed_for_enrollment(enrollment_id, activity_id)
);

create policy progress_update_owner
on public.activity_progress for update to authenticated
using (public.owns_enrollment(enrollment_id))
with check (
  public.owns_enrollment(enrollment_id)
  and public.activity_allowed_for_enrollment(enrollment_id, activity_id)
);

-- Draft state
create policy state_select_owner_or_teacher
on public.activity_state for select to authenticated
using (
  public.owns_enrollment(enrollment_id)
  or public.teaches_enrollment(enrollment_id)
);

create policy state_insert_owner
on public.activity_state for insert to authenticated
with check (
  public.owns_enrollment(enrollment_id)
  and public.activity_allowed_for_enrollment(enrollment_id, activity_id)
);

create policy state_update_owner
on public.activity_state for update to authenticated
using (public.owns_enrollment(enrollment_id))
with check (
  public.owns_enrollment(enrollment_id)
  and public.activity_allowed_for_enrollment(enrollment_id, activity_id)
);

-- Submissions: snapshot inmutable para student.
create policy submissions_select_owner_or_teacher
on public.submissions for select to authenticated
using (
  public.owns_enrollment(enrollment_id)
  or public.teaches_enrollment(enrollment_id)
);

create policy submissions_insert_owner
on public.submissions for insert to authenticated
with check (
  public.owns_enrollment(enrollment_id)
  and public.activity_allowed_for_enrollment(enrollment_id, activity_id)
);

-- Feedback
create policy feedback_select_owner_or_teacher
on public.feedback for select to authenticated
using (
  exists (
    select 1
    from public.submissions s
    where s.id = feedback.submission_id
      and (
        public.owns_enrollment(s.enrollment_id)
        or public.teaches_enrollment(s.enrollment_id)
      )
  )
);

create policy feedback_insert_teacher
on public.feedback for insert to authenticated
with check (
  teacher_id = auth.uid()
  and exists (
    select 1 from public.submissions s
    where s.id = feedback.submission_id
      and public.teaches_enrollment(s.enrollment_id)
  )
);

create policy feedback_update_teacher
on public.feedback for update to authenticated
using (
  teacher_id = auth.uid()
  and exists (
    select 1 from public.submissions s
    where s.id = feedback.submission_id
      and public.teaches_enrollment(s.enrollment_id)
  )
)
with check (
  teacher_id = auth.uid()
  and exists (
    select 1 from public.submissions s
    where s.id = feedback.submission_id
      and public.teaches_enrollment(s.enrollment_id)
  )
);

create policy feedback_delete_teacher
on public.feedback for delete to authenticated
using (
  teacher_id = auth.uid()
  and exists (
    select 1 from public.submissions s
    where s.id = feedback.submission_id
      and public.teaches_enrollment(s.enrollment_id)
  )
);

commit;

-- IMPORTANTE:
-- 1) Validar con Supabase Security Advisor después de aplicar.
-- 2) Crear tests con student A, student B, teacher A y teacher B.
-- 3) No habilitar estudiantes reales hasta que B no pueda leer/escribir A.
-- 4) El service role nunca se usa desde el navegador.