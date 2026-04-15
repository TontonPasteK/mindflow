-- MindFlow — Migration 003: Security Hardening
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS — empêcher l'escalade de privilèges (plan / role)
--
-- Problème: la policy "users_own" FOR ALL permet à un client authentifié de
-- faire UPDATE public.users SET plan = 'premium' sur sa propre ligne.
-- Fix: séparer SELECT / UPDATE / DELETE + trigger qui verrouille les colonnes
-- sensibles pour les utilisateurs normaux (service_role passe toujours).
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "users_own" on public.users;

create policy "users_select" on public.users
  for select using (id = auth.uid());

create policy "users_update" on public.users
  for update using (id = auth.uid());

create policy "users_delete" on public.users
  for delete using (id = auth.uid());

-- Trigger: si l'appelant n'est pas service_role, on écrase plan/role/stripe
-- avec leurs valeurs actuelles → un utilisateur ne peut pas se promouvoir.
-- Le webhook Stripe utilise service_role et passe sans restriction.
create or replace function public.prevent_privileged_update()
returns trigger language plpgsql as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    'anon'
  );
  if jwt_role <> 'service_role' then
    new.plan               := old.plan;
    new.role               := old.role;
    new.stripe_customer_id := old.stripe_customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_privileged_user_fields on public.users;
create trigger protect_privileged_user_fields
  before update on public.users
  for each row execute function public.prevent_privileged_update();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PARENT_LINKS — restreindre INSERT au parent uniquement
--
-- Problème: "parent_links_own" FOR ALL avec using (parent_id = auth.uid() OR
-- child_id = auth.uid()) autorise un enfant à insérer un lien avec un
-- parent_id arbitraire (usurpation).
-- Fix: séparer SELECT / INSERT / DELETE avec des vérifications ciblées.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "parent_links_own" on public.parent_links;

-- Les deux parties peuvent lire le lien
create policy "parent_links_select" on public.parent_links
  for select using (parent_id = auth.uid() or child_id = auth.uid());

-- Seul le parent peut créer un lien (son uid doit être parent_id)
create policy "parent_links_insert" on public.parent_links
  for insert with check (parent_id = auth.uid());

-- Seul le parent peut supprimer un lien
create policy "parent_links_delete" on public.parent_links
  for delete using (parent_id = auth.uid());
