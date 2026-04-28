-- Migration pour RGPD Mineurs
-- Ajout des colonnes date_naissance et parental_consent à la table profiles

-- Ajout de la colonne date_naissance
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- Ajout de la colonne parental_consent
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parental_consent BOOLEAN DEFAULT FALSE;

-- Ajout d'un index pour optimiser les requêtes sur date_naissance
CREATE INDEX IF NOT EXISTS idx_profiles_date_naissance ON profiles(date_naissance);

-- Ajout d'un index pour optimiser les requêtes sur parental_consent
CREATE INDEX IF NOT EXISTS idx_profiles_parental_consent ON profiles(parental_consent);

-- Commentaire sur les colonnes
COMMENT ON COLUMN profiles.date_naissance IS 'Date de naissance de l''utilisateur (RGPD mineurs)';
COMMENT ON COLUMN profiles.parental_consent IS 'Consentement parental pour les mineurs de moins de 15 ans (RGPD)';
