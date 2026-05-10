-- Créer la table guides
CREATE TABLE IF NOT EXISTS public.guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  subject TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter des indexes pour les recherches courantes
CREATE INDEX IF NOT EXISTS idx_guides_category ON public.guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_subject ON public.guides(subject);
CREATE INDEX IF NOT EXISTS idx_guides_target_audience ON public.guides(target_audience);
CREATE INDEX IF NOT EXISTS idx_guides_version ON public.guides(version);

-- Activer Row Level Security
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre à tout le monde de lire les guides
CREATE POLICY "Guides are viewable by everyone"
  ON public.guides FOR SELECT
  USING (true);

-- Créer une politique pour permettre aux utilisateurs authentifiés d'insérer des guides
CREATE POLICY "Authenticated users can insert guides"
  ON public.guides FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Créer une politique pour permettre aux utilisateurs authentifiés de mettre à jour les guides
CREATE POLICY "Authenticated users can update guides"
  ON public.guides FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Créer une politique pour permettre aux utilisateurs authentifiés de supprimer les guides
CREATE POLICY "Authenticated users can delete guides"
  ON public.guides FOR DELETE
  USING (auth.role() = 'authenticated');
