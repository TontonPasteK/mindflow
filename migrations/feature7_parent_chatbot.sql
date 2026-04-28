-- Migration pour FEATURE 7: Chatbot parent 24h/24
-- Table parent_chat_history pour stocker l'historique des conversations parent

-- Création de la table parent_chat_history
CREATE TABLE IF NOT EXISTS parent_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_parent_chat_parent_child ON parent_chat_history(parent_id, child_id);
CREATE INDEX IF NOT EXISTS idx_parent_chat_created_at ON parent_chat_history(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE parent_chat_history ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : seul le parent peut voir ses propres conversations
CREATE POLICY "Parents can view own chat history"
  ON parent_chat_history
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Politique d'insertion : seul le parent peut créer ses propres conversations
CREATE POLICY "Parents can insert own chat history"
  ON parent_chat_history
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Politique de suppression : seul le parent peut supprimer ses propres conversations
CREATE POLICY "Parents can delete own chat history"
  ON parent_chat_history
  FOR DELETE
  USING (auth.uid() = parent_id);
