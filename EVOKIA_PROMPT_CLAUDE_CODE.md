# EVOKIA — PROMPT AGENT CLAUDE CODE

## CONTEXTE PROJET

Repo       : C:\Users\scolr\mindflow
Production : https://mindflow-lime.vercel.app
Stack      : React + Vite, Supabase, Claude Sonnet API, OpenAI TTS onyx, Vercel
Compte     : scolrcoaching@gmail.com (premium via SQL)

Fichiers critiques — toujours lire avant de toucher :
- src/services/prompts.js (598 lignes — buildDrMindPrompt, buildPremiumPrompt, buildFreePrompt, QUIZ_PROTOCOL, BLOCAGES_PROTOCOL, EFFET_MIROIR, getAvatarStyle)
- api/chat.js — endpoint API
- src/pages/Session.jsx — interface session
- src/hooks/useChat.js — historique (MAX_HISTORY = 60)
- src/context/AuthContext.jsx — auth + profil

Balises spéciales dans les prompts : [[PROFILE:{...}]], [[VICTORY:...]], [[STRATEGIES:[...]]]
Avatars : Maya (V+A), Max (V), Victor (A), Leo (K), Noa (V+K), Sam (A+K), Alex (equilibre)

## REGLES ABSOLUES

1. Lire les fichiers AVANT toute modification
2. Montrer AVANT/APRES pour chaque changement
3. Un bloc a la fois — finir et deployer avant de passer au suivant
4. Deploiement : git add . && git commit -m "..." && git push && vercel --prod
5. Jamais modifier AuthContext.jsx ou api/chat.js sans confirmation explicite

## ORDRE D'EXECUTION

BLOC 0 → Renommage Evokia (obligatoire en premier)
BLOC 1 → Landing page (obligatoire avant testeurs)
BLOC 2 → Workspace matieres
BLOC 3 → Knowledge Graph Supabase
BLOC 4 → Mem0 MCP memoire inter-sessions (P1 absolu)
BLOC 5 → Journal victoires Bandura
BLOC 6 → Gamification legere (streak + points)
BLOC 7 → Quiz Bloom auto en cloture
BLOC 8 → Dashboard parent
BLOC 9 → Mode session 100% oral

## BLOC 0 — RENOMMAGE EVOKIA

Remplacer "MindFlow" par "Evokia" dans :
- index.html (title, meta, og:title)
- package.json (name field)
- src/services/prompts.js (commentaire ligne 1, "Maya, assistante de MindFlow" ligne 580)
- public/manifest.json si existant

NE PAS toucher : URLs Supabase, variables Vercel, noms tables, URLs Lemon Squeezy.
Verifier apres : grep -r "MindFlow" src/

## BLOC 1 — LANDING PAGE

Creer src/pages/Landing.jsx.
Lire App.jsx pour comprendre le routing existant.
"/" + non connecte → Landing. "/" + connecte → redirect "/session".

Sections dans l'ordre :
1. Hero : "Evokia — Ton assistant qui apprend comme toi" + CTA "Essayer gratuitement" → /auth
2. Probleme : "75% oublie en 24h sans methode"
3. Solution : 3 colonnes Visuel/Auditif/Kinesth esique
4. Avatars : Max, Victor, Leo (3 exemples avec description courte)
5. Pricing : Gratuit vs Premium 19€/mois (bouton Lemon Squeezy existant)
6. CTA final → /auth

Design : lire CSS existant avant de coder, mobile-first, coherent avec Session.jsx.

## BLOC 2 — WORKSPACE PAR MATIERE

Migration Supabase :
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS matiere TEXT DEFAULT 'general';
CREATE TABLE IF NOT EXISTS notions_travaillees (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, matiere TEXT NOT NULL, notion TEXT NOT NULL, maitrisee BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());

UI dans Session.jsx : selecteur matiere (Maths/Francais/Histoire/Physique/SVT/Autre).
Injection dans buildPremiumPrompt : matiere + notions precedentes dans cette matiere.

## BLOC 3 — KNOWLEDGE GRAPH

Migration Supabase :
CREATE TABLE IF NOT EXISTS knowledge_graph (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, notions_maitrisees JSONB DEFAULT '[]', notions_en_cours JSONB DEFAULT '[]', blocages_recurrents JSONB DEFAULT '[]', passions_detectees JSONB DEFAULT '[]', updated_at TIMESTAMPTZ DEFAULT NOW());

Dans api/chat.js : lire knowledge_graph au debut de session, injecter dans prompt.
En fin de session : detecter [[VICTORY:...]] → upsert notions_maitrisees.
Detecter 3 "je sais pas" consecutifs → ajouter dans blocages_recurrents.

## BLOC 4 — MEM0 MCP

npm install mem0ai
Ajouter MEM0_API_KEY dans .env et Vercel.
Dans api/chat.js : recuperer memoires (mem0.search) en debut, sauvegarder victoires (mem0.add) en fin.
Format injecte : "La derniere fois : [resume]. Analogies qui ont fonctionne : [liste]. Blocages persistants : [liste]."

## BLOC 5 — JOURNAL VICTOIRES

Migration Supabase :
CREATE TABLE IF NOT EXISTS victories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, date TIMESTAMPTZ DEFAULT NOW(), description TEXT NOT NULL, matiere TEXT DEFAULT 'general', niveau_bloom INTEGER DEFAULT 1);

Dans api/chat.js : parser [[VICTORY:...]] → INSERT victories.
Affichage discret dans Session.jsx : liste des victoires recentes.

## BLOC 6 — GAMIFICATION LEGERE

Migration Supabase :
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_session_date DATE;

Logique : streak +1 si session hier, reset sinon. Points : +10/+20/+30 selon niveau Bloom victoire.
Affichage discret : "Feu 3 jours" et "150 pts" en haut de Session.jsx.

## BLOC 7 — QUIZ CLOTURE

Modification uniquement dans src/services/prompts.js, dans QUIZ_PROTOCOL.
Ajouter avant "NIVEAU 1" :

QUIZ DE CLOTURE AUTOMATIQUE :
Declencheurs : "au revoir", "j'ai fini", "c'est bon", "j'y vais", "ciao", "merci".
1. "Juste avant qu'on s'arrete — question rapide pour fixer ca dans ta tete."
2. Toujours commencer par le niveau 1 (gagnable).
3. Si reussi niveau 1 → proposer niveau 2 en optionnel.
4. Maximum 2 questions. Jamais forcer le niveau 3 en cloture.
5. Toujours terminer par [[VICTORY:...]] meme partiel.
6. Si eleve dit non → valider et laisser partir sans bloquer.

## BLOC 8 — DASHBOARD PARENT

Creer src/pages/ParentDashboard.jsx sur "/parent". Reserve premium uniquement.
Lire AuthContext.jsx pour acceder au profil.

Sections :
1. Resume semaine : sessions, streak, points
2. Journal victoires : SELECT * FROM victories WHERE user_id = ? ORDER BY date DESC LIMIT 20
3. Ratio participation : messages eleve / messages Dr Mind (seuil sain 50-70% eleve)
4. Notions par matiere : depuis knowledge_graph (maitrisees/en cours/blocages)

## BLOC 9 — MODE ORAL

Lire useTTS.js et Session.jsx avant de modifier.
Ajouter bouton "Mode vocal" (premium uniquement).
Quand active : TTS lit chaque reponse Dr Mind automatiquement → puis demarre Web Speech API → envoie quand silence detecte.
Indicateur visuel : micro rouge clignotant pendant ecoute.
Masquer le champ texte en mode vocal.

## COMMANDE DEPLOIEMENT

git add . && git commit -m "feat: [description]" && git push && vercel --prod


## BLOC 10 — AUTH PARENT + CODE ACCES ELEVE

MODELE : le parent cree le compte et paie. L'eleve accede via un code sans email.

Migration Supabase :
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'eleve' CHECK (role IN ('parent', 'eleve'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS code_acces TEXT UNIQUE;

Logique :
- Inscription parent : email + mot de passe → role = 'parent'
- Creation eleve : parent genere un code_acces (6 caracteres alphanum) → role = 'eleve'
- Connexion eleve : saisir le code_acces uniquement — pas d'email requis
- Session eleve liee au parent_id → dashboard parent voit toutes les sessions
Dans AuthContext.jsx : detecter le role au login → router /session (eleve) ou /parent (parent).
Dans api/chat.js : verifier user_id correspond a un eleve actif avant chaque appel.
RLS Supabase : eleve voit ses donnees uniquement. Parent voit ses eleves uniquement.

## BLOC 11 — MISTRAL VISION (FALLBACK SCAN DOCUMENT)

L'app utilise Claude Vision pour analyser les photos de cahier.
Si couts trop eleves → fallback Mistral Vision (gratuit free tier).

Dans api/chat.js, fonction scanDocument(imageBase64) :
1. Essayer Claude Vision (claude-sonnet-4-6 avec image)
2. Si erreur 429 ou couts > seuil → fallback mistral-ocr-latest
3. Retourner le texte extrait dans les deux cas

Variable a ajouter : MISTRAL_API_KEY dans .env et Vercel.
Compte : console.mistral.ai → gratuit, juste numero telephone.
Ne modifier QUE api/chat.js. Session.jsx ne change pas.

## BLOC 12 — RGPD MINEURS (CGU + POLITIQUE CONFIDENTIALITE)

Creer src/pages/Legal.jsx sur "/legal".

CGU :
- Inscription : parents uniquement (18+)
- Utilisateurs : mineurs sous responsabilite parentale
- Ce que l'app fait : coaching cognitif, aide aux devoirs
- Ce qu'elle ne fait pas : diagnostic medical, substitut professionnel sante
- Resiliation : a tout moment, donnees supprimees sous 30 jours

POLITIQUE CONFIDENTIALITE (RGPD strict mineurs) :
- Donnees collectees : prenom, niveau scolaire, profil V/A/K, historique sessions
- Donnees NON collectees : photo eleve, localisation, donnees sante
- Photos cahier : analysees et supprimees immediatement, jamais stockees
- Audio vocal : transcrit localement dans le navigateur, jamais envoye au serveur
- Sous-traitants : Anthropic, Supabase, Vercel, Lemon Squeezy
- Droit acces/suppression : scolrcoaching@gmail.com
- Conservation : 2 ans apres derniere session puis suppression automatique

Ajouter lien "/legal" dans footer Landing.jsx et formulaire inscription parent.
Case obligatoire avant inscription : "J'accepte les CGU et la politique de confidentialite"
