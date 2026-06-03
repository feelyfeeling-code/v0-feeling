-- =====================================================================
-- Feeling — Migration 002 : nouveaux champs onboarding v2
-- À copier-coller dans l'éditeur SQL de Supabase (Project > SQL Editor)
-- Script idempotent : peut être rejoué sans risque.
-- =====================================================================

-- ---------------------------------------------------------------------
-- values_profiles — nouveaux champs étape 3 "Ce qui te fait vibrer"
-- ---------------------------------------------------------------------
alter table public.values_profiles
  add column if not exists ideal_environment      text[]    default '{}',
  add column if not exists work_solo_team_slider  smallint  default 3,
  add column if not exists work_structure_slider  smallint  default 3,
  add column if not exists multi_project_comfort  text,
  add column if not exists motivation_text        text;

-- ---------------------------------------------------------------------
-- personality_profiles — nouveaux champs étape 4 "Qui tu es"
-- (process_com remplace enneagram dans test_type)
-- ---------------------------------------------------------------------
alter table public.personality_profiles
  add column if not exists when_in_element          text,
  add column if not exists reaction_to_failure      text,
  add column if not exists approach_complex_problem text;

-- ---------------------------------------------------------------------
-- dream_jobs — nouveaux champs étape 5 "Où tu veux aller"
-- ---------------------------------------------------------------------
alter table public.dream_jobs
  add column if not exists vision_2_years                 text,
  add column if not exists specialization_vs_broadening   smallint default 3,
  add column if not exists fast_growth_importance         text;

-- Note : les valeurs de salary_range et remote_preference sont gérées
-- côté frontend uniquement (champ text libre). Aucune contrainte enum
-- à modifier côté base.

-- ---------------------------------------------------------------------
-- profiles — playback IA généré à la fin de l'onboarding
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists playback_result jsonb;

-- ---------------------------------------------------------------------
-- job_analyses — scores radar ikigai (4 axes générés par l'IA)
-- ---------------------------------------------------------------------
alter table public.job_analyses
  add column if not exists radar_scores jsonb;
