-- Migration pour FEATURE 6: Mode compétition saine anonyme
-- Table leaderboard_profiles pour stocker les profils anonymes de classement

-- Création de la table leaderboard_profiles
CREATE TABLE IF NOT EXISTS leaderboard_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_pseudo TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_quiz_victories INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0, -- en minutes
  consistency_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_last_activity ON leaderboard_profiles(last_activity_at DESC);

-- RLS (Row Level Security)
ALTER TABLE leaderboard_profiles ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : seul l'utilisateur peut voir son propre profil
CREATE POLICY "Users can view own leaderboard profile"
  ON leaderboard_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique d'insertion : seul l'utilisateur peut créer son propre profil
CREATE POLICY "Users can insert own leaderboard profile"
  ON leaderboard_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour : seul l'utilisateur peut mettre à jour son propre profil
CREATE POLICY "Users can update own leaderboard profile"
  ON leaderboard_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_leaderboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboard_updated_at
  BEFORE UPDATE ON leaderboard_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_updated_at();
