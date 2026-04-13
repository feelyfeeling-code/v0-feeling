-- =====================================================================
-- Feeling — Schéma Supabase complet
-- À copier-coller dans l'éditeur SQL de Supabase (Project > SQL Editor)
-- Ce schéma reflète EXACTEMENT les colonnes utilisées par le code.
-- Script idempotent : peut être rejoué à tout moment.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Reset complet (supprime tables, triggers et fonctions existants)
-- ATTENTION : efface toutes les données applicatives.
-- Les comptes auth.users sont conservés.
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.job_analyses          cascade;
drop table if exists public.work_experiences      cascade;
drop table if exists public.technical_skills      cascade;
drop table if exists public.dream_jobs            cascade;
drop table if exists public.values_profiles       cascade;
drop table if exists public.personality_profiles  cascade;
drop table if exists public.current_situations    cascade;
drop table if exists public.academic_profiles     cascade;
drop table if exists public.profiles              cascade;

drop function if exists public.handle_new_user()  cascade;
drop function if exists public.set_updated_at()   cascade;

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Fonction utilitaire : trigger updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. profiles  (1 ligne par user, PK = auth.users.id)
-- =====================================================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  first_name            text,
  last_name             text,
  email                 text,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création automatique d'un profile à chaque nouvel utilisateur Supabase
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 2. academic_profiles  (1 ligne par user — parcours académique)
-- =====================================================================
create table if not exists public.academic_profiles (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  education_level  text not null,
  graduation_date  date not null,
  diploma_name     text not null,
  school_name      text not null,
  field_of_study   text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.academic_profiles enable row level security;

drop policy if exists "academic_profiles_all_own" on public.academic_profiles;
create policy "academic_profiles_all_own" on public.academic_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_academic on public.academic_profiles;
create trigger set_updated_at_academic
  before update on public.academic_profiles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. current_situations  (1 ligne par user — situation actuelle)
-- =====================================================================
create table if not exists public.current_situations (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  -- Cartes principales cochées (multi-select).
  -- Valeurs possibles : 'job_seeking', 'employed', 'student'
  situations        text[] not null default '{}',
  -- Types de contrat recherchés (uniquement pertinent si 'job_seeking' ∈ situations).
  -- Valeurs possibles : 'cdd', 'cdi', 'alternance'
  job_search_types  text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.current_situations enable row level security;

drop policy if exists "current_situations_all_own" on public.current_situations;
create policy "current_situations_all_own" on public.current_situations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_current_situations on public.current_situations;
create trigger set_updated_at_current_situations
  before update on public.current_situations
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. personality_profiles  (1 ligne par user — 3 traits classés + test existant)
-- =====================================================================
create table if not exists public.personality_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  -- 3 traits dominants classés par ordre d'importance.
  -- index 0 = rang 1 (50% du scoring personnalité), 1 = rang 2 (30%), 2 = rang 3 (20%)
  traits          text[] not null default '{}',
  -- Test de personnalité existant (MBTI, DISC, etc.) saisi par l'utilisateur.
  has_taken_test  boolean not null default false,
  test_type       text,    -- 'mbti', 'disc', 'big_five', 'enneagram', 'other'
  test_result     text,    -- résultat libre (ex: 'INTJ', 'D', '5w4'...)
  -- Réponses au test de personnalité intégré (10 questions Likert 1-5).
  -- Clé : id de la question (q1..q10) ; valeur : note (1-5).
  test_answers    jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.personality_profiles enable row level security;

drop policy if exists "personality_profiles_all_own" on public.personality_profiles;
create policy "personality_profiles_all_own" on public.personality_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_personality on public.personality_profiles;
create trigger set_updated_at_personality
  before update on public.personality_profiles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. values_profiles  (Valeurs et culture — 1 ligne par user)
-- =====================================================================
create table if not exists public.values_profiles (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  -- Jusqu'à 3 valeurs professionnelles sélectionnées parmi la liste prédéfinie
  -- (impact_concret, ambiance_equipe, horaires_flexibles, apprendre_continu,
  --  sens_travail, evoluer_rapidement, temps_pour_soi, autonomie,
  --  travail_equipe, initiatives).
  selected_values   text[] not null default '{}',
  -- Jusqu'à 3 critères rédhibitoires parmi la liste prédéfinie
  -- (management_autoritaire, pas_evolution, mauvaise_ambiance, travail_repetitif,
  --  aucune_reconnaissance, manque_sens, forte_pression, pas_feedback,
  --  pas_flexibilite, heures_sup).
  dealbreakers      text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.values_profiles enable row level security;

drop policy if exists "values_profiles_all_own" on public.values_profiles;
create policy "values_profiles_all_own" on public.values_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_values on public.values_profiles;
create trigger set_updated_at_values
  before update on public.values_profiles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. dream_jobs  (Job de rêve — 1 ligne par user)
-- =====================================================================
create table if not exists public.dream_jobs (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null unique references auth.users(id) on delete cascade,
  -- Intitulé(s) de poste visé(s) — multi-chips.
  job_titles         text[] not null default '{}',
  -- Villes/régions où le candidat souhaite travailler (chips).
  locations          text[] not null default '{}',
  -- Rayon de recherche en km autour des localisations (10, 20, 40, 50, 100, 0=indifférent).
  location_radius    integer not null default 40,
  -- Secteurs d'activité (chips libres).
  industries         text[] not null default '{}',
  -- Tranche de salaire (clé parmi less_30k, 30_40k, 40_50k, 50_60k, 60_80k, 80_100k, more_100k, no_preference).
  salary_range       text,
  -- Préférence télétravail (clé : full_remote, hybrid, onsite, flexible).
  remote_preference  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.dream_jobs enable row level security;

drop policy if exists "dream_jobs_all_own" on public.dream_jobs;
create policy "dream_jobs_all_own" on public.dream_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_dream_jobs on public.dream_jobs;
create trigger set_updated_at_dream_jobs
  before update on public.dream_jobs
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 7. technical_skills  (1 ligne par user — skills stockés en text[])
-- =====================================================================
create table if not exists public.technical_skills (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  skills      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.technical_skills enable row level security;

drop policy if exists "technical_skills_all_own" on public.technical_skills;
create policy "technical_skills_all_own" on public.technical_skills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_technical_skills on public.technical_skills;
create trigger set_updated_at_technical_skills
  before update on public.technical_skills
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 8. work_experiences  (N lignes par user)
-- =====================================================================
create table if not exists public.work_experiences (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  job_title     text not null,
  company_name  text not null,
  location      text,
  start_date    date not null,
  end_date      date,
  is_current    boolean not null default false,
  main_tasks    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists work_experiences_user_id_idx
  on public.work_experiences (user_id, start_date desc);

alter table public.work_experiences enable row level security;

drop policy if exists "work_experiences_all_own" on public.work_experiences;
create policy "work_experiences_all_own" on public.work_experiences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_work_experiences on public.work_experiences;
create trigger set_updated_at_work_experiences
  before update on public.work_experiences
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 9. job_analyses  (N lignes par user — résultats d'analyse d'offres)
-- =====================================================================
create table if not exists public.job_analyses (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,

  -- Offre scrappée
  job_url               text not null,
  job_title             text,
  company_name          text,
  job_description       text,
  job_location          text,
  job_type              text,
  job_remote            text,

  -- Scores (0–100 ; plafonné à 30 si dealbreaker)
  overall_score         integer check (overall_score between 0 and 100),
  personality_score     integer check (personality_score between 0 and 100),
  values_score          integer check (values_score between 0 and 100),
  skills_score          integer check (skills_score between 0 and 100),

  -- Analyses détaillées (jsonb : { strengths: [], attentionPoints: [] })
  personality_analysis  jsonb,
  values_analysis       jsonb,
  skills_analysis       jsonb,

  -- Récap global
  strengths             text[] not null default '{}',
  attention_points      text[] not null default '{}',

  -- Dealbreakers
  has_dealbreakers      boolean not null default false,
  dealbreaker_details   text[],

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists job_analyses_user_id_idx
  on public.job_analyses (user_id, created_at desc);

alter table public.job_analyses enable row level security;

drop policy if exists "job_analyses_all_own" on public.job_analyses;
create policy "job_analyses_all_own" on public.job_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_job_analyses on public.job_analyses;
create trigger set_updated_at_job_analyses
  before update on public.job_analyses
  for each row execute function public.set_updated_at();

-- =====================================================================
-- FIN DU SCHÉMA
-- =====================================================================
