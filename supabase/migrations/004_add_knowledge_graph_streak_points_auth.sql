-- MindFlow — Migration 004: Knowledge Graph + Streak/Points + Auth Parent
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. KNOWLEDGE GRAPH (BLOC 3)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.knowledge_graph (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.users(id) on delete cascade,
  notions_maitrisees     text[] default '{}',
  notions_en_cours       text[] default '{}',
  blocages_recurrents    text[] default '{}',
  passions_detectees     text[] default '{}',
  updated_at             timestamptz not null default now(),
  unique(user_id)
);

-- RLS pour knowledge_graph
alter table public.knowledge_graph enable row level security;

create policy "knowledge_graph_own" on public.knowledge_graph
  for all using (user_id = auth.uid());

create policy "knowledge_graph_parent_read" on public.knowledge_graph
  for select using (
    user_id in (
      select child_id from public.parent_links where parent_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. STREAK + POINTS (BLOC 6) - Ajout colonnes dans profiles
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists streak int default 0 check (streak >= 0),
  add column if not exists points int default 0 check (points >= 0),
  add column if not exists last_session_date date;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUTH PARENT + CODE ÉLÈVE (BLOC 10) - Ajout colonnes dans profiles
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists code_acces text unique,
  add column if not exists parent_id uuid references public.users(id) on delete cascade,
  add column if not exists role text check (role in ('student', 'parent', 'eleve'));

-- Index pour recherche rapide par code
create index if not exists idx_profiles_code_acces on public.profiles(code_acces);
create index if not exists idx_profiles_parent_id on public.profiles(parent_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MISE À JOUR RLS PARENTS POUR NOUVELLES COLONNES
-- ─────────────────────────────────────────────────────────────────────────────

-- Parents peuvent lire les codes d'accès de leurs enfants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'profiles_parent_read_code'
  ) THEN
    CREATE POLICY "profiles_parent_read_code" ON public.profiles
      FOR SELECT USING (
        user_id IN (
          SELECT child_id FROM public.parent_links WHERE parent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. COLONNE AVATAR (déjà dans character_assigned, mais ajoutons avatar pour clarté)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists avatar text default 'Maya';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SEANCE_DRMIND (déjà dans le code, ajoutons si manquant)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists seance_drMind int default 0 check (seance_drMind between 0 and 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- VALIDATION
-- ─────────────────────────────────────────────────────────────────────────────

-- Vérifier que toutes les tables existent
select 'knowledge_graph' as table_name, count(*) as row_count from public.knowledge_graph
union all
select 'profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'parent_links' as table_name, count(*) as row_count from public.parent_links;

-- Vérifier que toutes les colonnes existent dans profiles
select column_name, data_type
from information_schema.columns
where table_name = 'profiles'
  and column_name in ('streak', 'points', 'last_session_date', 'code_acces', 'parent_id', 'role', 'avatar', 'seance_drMind')
order by column_name;
