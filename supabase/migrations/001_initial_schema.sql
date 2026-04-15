-- MindFlow — Initial Schema
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS (extends auth.users)
-- ─────────────────────────────────────────
create table public.users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  prenom             text not null,
  email              text not null,
  plan               text not null default 'free' check (plan in ('free', 'premium')),
  role               text not null default 'student' check (role in ('student', 'parent')),
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, prenom, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'prenom', 'Élève'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- PROFILES COGNITIFS
-- ─────────────────────────────────────────
create table public.profiles (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.users(id) on delete cascade,
  visuel                 int  default 0 check (visuel between 0 and 100),
  auditif                int  default 0 check (auditif between 0 and 100),
  kinesthesique          int  default 0 check (kinesthesique between 0 and 100),
  projet_de_sens         text check (projet_de_sens in (
                           'Expliquer','Découvrir','Appliquer','Convaincre',
                           'Partager','Maîtriser','Créer','Aider')),
  intelligence_dominante text,
  passions               text,
  onboarding_complete    boolean not null default false,
  character_assigned     text default 'max',
  updated_at             timestamptz not null default now(),
  unique(user_id)
);

-- ─────────────────────────────────────────
-- SESSIONS DE TRAVAIL
-- ─────────────────────────────────────────
create table public.sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  duree_minutes int,
  matieres      text[],
  resume        text,
  plan_used     text not null default 'free' check (plan_used in ('free', 'premium'))
);

-- ─────────────────────────────────────────
-- MESSAGES (contexte IA + historique)
-- ─────────────────────────────────────────
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- VICTORIES (journal positif)
-- ─────────────────────────────────────────
create table public.victories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  texte      text not null,
  date       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- REMINDERS (rappels espacés)
-- ─────────────────────────────────────────
create table public.reminders (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  matiere        text not null,
  contenu_rappel text not null,
  date_envoi     timestamptz not null,
  statut         text not null default 'pending' check (statut in ('pending','sent','cancelled'))
);

-- ─────────────────────────────────────────
-- PARENT LINKS
-- ─────────────────────────────────────────
create table public.parent_links (
  id         uuid primary key default uuid_generate_v4(),
  parent_id  uuid not null references public.users(id) on delete cascade,
  child_id   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(parent_id, child_id)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.users        enable row level security;
alter table public.profiles     enable row level security;
alter table public.sessions     enable row level security;
alter table public.messages     enable row level security;
alter table public.victories    enable row level security;
alter table public.reminders    enable row level security;
alter table public.parent_links enable row level security;

-- Users: own data + parents can read their children's data
create policy "users_own" on public.users
  for all using (id = auth.uid());

-- Profiles: own + parents read
create policy "profiles_own" on public.profiles
  for all using (user_id = auth.uid());

create policy "profiles_parent_read" on public.profiles
  for select using (
    user_id in (
      select child_id from public.parent_links where parent_id = auth.uid()
    )
  );

-- Sessions: own + parents read
create policy "sessions_own" on public.sessions
  for all using (user_id = auth.uid());

create policy "sessions_parent_read" on public.sessions
  for select using (
    user_id in (
      select child_id from public.parent_links where parent_id = auth.uid()
    )
  );

-- Messages: own sessions only (parents cannot read)
create policy "messages_own" on public.messages
  for all using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );

-- Victories: own + parents read
create policy "victories_own" on public.victories
  for all using (user_id = auth.uid());

create policy "victories_parent_read" on public.victories
  for select using (
    user_id in (
      select child_id from public.parent_links where parent_id = auth.uid()
    )
  );

-- Reminders: own
create policy "reminders_own" on public.reminders
  for all using (user_id = auth.uid());

-- Parent links: own
create policy "parent_links_own" on public.parent_links
  for all using (parent_id = auth.uid() or child_id = auth.uid());
