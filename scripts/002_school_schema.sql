-- =====================================================================
-- Feeling — Module École (schools, membres, conseillers, candidatures,
-- demandes de coaching) + vue dashboard + RLS.
-- À copier-coller dans l'éditeur SQL de Supabase (Project > SQL Editor).
-- Script idempotent : peut être rejoué à tout moment.
-- Dépend de 001_schema.sql (tables profiles, job_analyses, etc.).
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. schools
-- ---------------------------------------------------------------------
create table if not exists public.schools (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  domain        text,
  contact_name  text,
  contact_email text,
  logo_url      text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. school_members  (rattachement diplômé <> école, 1 par user)
-- ---------------------------------------------------------------------
create table if not exists public.school_members (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  school_id        uuid not null references public.schools(id) on delete cascade,
  graduation_year  integer,
  program          text,
  -- 'searching' | 'employed' | 'inactive' | 'studies' | 'break'
  status           text not null default 'searching',
  last_active_at   timestamptz default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint school_members_user_id_unique unique (user_id)
);

create index if not exists school_members_school_id_idx
  on public.school_members (school_id);

-- ---------------------------------------------------------------------
-- 3. school_advisors  (conseillers/admins d'une école)
-- ---------------------------------------------------------------------
create table if not exists public.school_advisors (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  school_id  uuid not null references public.schools(id) on delete cascade,
  full_name  text not null,
  -- 'advisor' | 'admin'
  role       text not null default 'advisor',
  created_at timestamptz not null default now()
);

create index if not exists school_advisors_user_id_idx
  on public.school_advisors (user_id);
create index if not exists school_advisors_school_id_idx
  on public.school_advisors (school_id);

-- ---------------------------------------------------------------------
-- 4. applications  (suivi des candidatures d'un diplômé)
-- ---------------------------------------------------------------------
create table if not exists public.applications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  analysis_id  uuid references public.job_analyses(id) on delete set null,
  company_name text not null,
  job_title    text not null,
  applied_at   date,
  -- 'pending' | 'interview' | 'rejected' | 'offer' | 'accepted'
  status       text not null default 'pending',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists applications_user_id_idx
  on public.applications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 5. coaching_requests
-- ---------------------------------------------------------------------
create table if not exists public.coaching_requests (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  school_id     uuid not null references public.schools(id) on delete cascade,
  advisor_id    uuid references public.school_advisors(id) on delete set null,
  -- 'interview_prep' | 'cv_review' | 'orientation' |
  -- 'reassurance' | 'first_exchange' | 'other'
  type          text not null,
  message       text not null,
  -- 'pending' | 'assigned' | 'scheduled' | 'completed' | 'cancelled'
  status        text not null default 'pending',
  feely_context jsonb,
  scheduled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists coaching_requests_user_id_idx
  on public.coaching_requests (user_id, created_at desc);
create index if not exists coaching_requests_school_id_idx
  on public.coaching_requests (school_id, status);

-- ---------------------------------------------------------------------
-- Triggers updated_at (réutilise public.set_updated_at de 001_schema.sql)
-- ---------------------------------------------------------------------
drop trigger if exists set_updated_at_school_members on public.school_members;
create trigger set_updated_at_school_members
  before update on public.school_members
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_applications on public.applications;
create trigger set_updated_at_applications
  before update on public.applications
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_coaching_requests on public.coaching_requests;
create trigger set_updated_at_coaching_requests
  before update on public.coaching_requests
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Helper SECURITY DEFINER : un conseiller peut-il voir ce diplômé ?
-- Utilisé par les policies pour éviter la récursion RLS.
-- =====================================================================
create or replace function public.advisor_can_view(target_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.school_advisors sa
    join public.school_members sm on sm.school_id = sa.school_id
    where sa.user_id = auth.uid()
      and sm.user_id = target_user
  );
$$;

-- École(s) dont l'utilisateur courant est conseiller.
create or replace function public.advisor_school_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select school_id from public.school_advisors where user_id = auth.uid();
$$;

-- =====================================================================
-- Vue dashboard école
-- =====================================================================
create or replace view public.school_dashboard_stats as
select
  sm.school_id,
  count(distinct sm.user_id) as total_graduates,
  count(distinct case when sm.status = 'employed'  then sm.user_id end) as employed,
  count(distinct case when sm.status = 'searching' then sm.user_id end) as searching,
  count(distinct case when sm.status = 'studies'   then sm.user_id end) as in_studies,
  count(distinct case when sm.status = 'break'     then sm.user_id end) as on_break,
  count(distinct case
    when sm.last_active_at < now() - interval '21 days'
     and sm.status = 'searching'
    then sm.user_id end) as inactive_alert,
  count(distinct case when cr.status = 'pending' then cr.id end) as pending_requests
from public.school_members sm
left join public.coaching_requests cr
  on cr.user_id = sm.user_id
 and cr.school_id = sm.school_id
group by sm.school_id;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.schools           enable row level security;
alter table public.school_members    enable row level security;
alter table public.school_advisors   enable row level security;
alter table public.applications      enable row level security;
alter table public.coaching_requests enable row level security;

-- ---- schools : membres et conseillers voient leur école ----
drop policy if exists "schools_select_related" on public.schools;
create policy "schools_select_related" on public.schools
  for select using (
    id in (select school_id from public.school_members  where user_id = auth.uid())
    or id in (select public.advisor_school_ids())
  );

-- ---- school_advisors : lecture de sa propre fiche + des conseillers de son école ----
drop policy if exists "school_advisors_select_self" on public.school_advisors;
create policy "school_advisors_select_self" on public.school_advisors
  for select using (
    user_id = auth.uid()
    or school_id in (select public.advisor_school_ids())
  );

-- ---- school_members ----
drop policy if exists "school_members_select_own"       on public.school_members;
drop policy if exists "school_members_modify_own"       on public.school_members;
drop policy if exists "school_members_advisor_select"   on public.school_members;

create policy "school_members_select_own" on public.school_members
  for select using (auth.uid() = user_id);
create policy "school_members_modify_own" on public.school_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "school_members_advisor_select" on public.school_members
  for select using (school_id in (select public.advisor_school_ids()));

-- ---- applications ----
drop policy if exists "applications_all_own"          on public.applications;
drop policy if exists "applications_advisor_select"   on public.applications;

create policy "applications_all_own" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "applications_advisor_select" on public.applications
  for select using (public.advisor_can_view(user_id));

-- ---- coaching_requests ----
drop policy if exists "coaching_requests_all_own"      on public.coaching_requests;
drop policy if exists "coaching_requests_advisor_all"  on public.coaching_requests;

create policy "coaching_requests_all_own" on public.coaching_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "coaching_requests_advisor_all" on public.coaching_requests
  for all using (school_id in (select public.advisor_school_ids()))
  with check (school_id in (select public.advisor_school_ids()));

-- ---------------------------------------------------------------------
-- Accès conseiller en LECTURE aux données de profil des diplômés de son école.
-- (Les policies "*_all_own" de 001_schema.sql restent en place et sont OR-ées.)
-- ---------------------------------------------------------------------
drop policy if exists "profiles_advisor_select" on public.profiles;
create policy "profiles_advisor_select" on public.profiles
  for select using (public.advisor_can_view(id));

drop policy if exists "academic_profiles_advisor_select" on public.academic_profiles;
create policy "academic_profiles_advisor_select" on public.academic_profiles
  for select using (public.advisor_can_view(user_id));

drop policy if exists "work_experiences_advisor_select" on public.work_experiences;
create policy "work_experiences_advisor_select" on public.work_experiences
  for select using (public.advisor_can_view(user_id));

drop policy if exists "technical_skills_advisor_select" on public.technical_skills;
create policy "technical_skills_advisor_select" on public.technical_skills
  for select using (public.advisor_can_view(user_id));

drop policy if exists "personality_profiles_advisor_select" on public.personality_profiles;
create policy "personality_profiles_advisor_select" on public.personality_profiles
  for select using (public.advisor_can_view(user_id));

drop policy if exists "values_profiles_advisor_select" on public.values_profiles;
create policy "values_profiles_advisor_select" on public.values_profiles
  for select using (public.advisor_can_view(user_id));

drop policy if exists "dream_jobs_advisor_select" on public.dream_jobs;
create policy "dream_jobs_advisor_select" on public.dream_jobs
  for select using (public.advisor_can_view(user_id));

drop policy if exists "current_situations_advisor_select" on public.current_situations;
create policy "current_situations_advisor_select" on public.current_situations
  for select using (public.advisor_can_view(user_id));

drop policy if exists "job_analyses_advisor_select" on public.job_analyses;
create policy "job_analyses_advisor_select" on public.job_analyses
  for select using (public.advisor_can_view(user_id));

-- =====================================================================
-- FIN — Module École
-- =====================================================================
