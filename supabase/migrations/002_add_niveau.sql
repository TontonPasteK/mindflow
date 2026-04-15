-- MindFlow — Migration 002
-- Ajoute la colonne niveau dans users
-- + met à jour le trigger d'inscription pour la stocker

alter table public.users
  add column if not exists niveau text;

-- Mise à jour du trigger pour inclure niveau
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, prenom, email, niveau)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'prenom', 'Élève'),
    new.email,
    new.raw_user_meta_data->>'niveau'
  );
  return new;
end;
$$;
