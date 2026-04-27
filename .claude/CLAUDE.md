# MindFlow

App web d'accompagnement cognitif basée sur la méthode Pastek (gestion mentale).
Public : collégiens, étudiants, adultes en formation/reconversion.
Production : https://evokia-lime.vercel.app

## Stack

- **Frontend** : React + Vite (JavaScript, pas TypeScript)
- **Backend** : Vercel serverless functions (`/api/*`)
- **Database + Auth** : Supabase (`yrjgxafuiclmhjkebjqu`)
- **IA Premium** : Claude Sonnet (Anthropic API)
- **IA Free** : Groq + Llama 3 (temporaire)
- **Voix TTS** : OpenAI (onyx/nova)
- **Voix input** : Web Speech API
- **Paiements** : Stripe
- **Déploiement** : `npx vercel --prod` depuis `C:\Users\scolr\mindflow`

## Structure du repo

```
src/
├── pages/          # Landing, Auth, Choice, Onboarding, DrMind, Session, ParentDashboard, Pricing, Settings, ResetPassword
├── components/     # avatar, chat, session, voice, ui
├── context/        # AuthContext, SessionContext
├── hooks/          # useChat, useTTS, useVoice, useProfile, usePomodoro
├── services/       # supabase, prompts, stripe, lemonsqueezy
├── routes/         # index, ProtectedRoute, PublicRoute
└── styles/         # globals.css
api/                # chat, tts (Vercel functions)
```

## Architecture pédagogique (méthode Pastek)

### Dr Mind — diagnosticien central
Cerveau pédagogique qui construit le profil cognitif en 2 séances progressives.
- Séance 1 (~20 min) : V/A/K + passions + Gardner partiel → profil à 50%
- Séance 2 (~20 min) : affinage + projet de sens + Gardner complet → profil 100% + révélation narrative
- Transmet le dossier à l'avatar attribué automatiquement

### 7 avatars — tuteurs personnalisés
Attribués selon profil V/A/K dominant : Max (V), Victor (A), Léo (K), Maya (V+A), Noa (V+K), Sam (A+K), Alex (équilibré).
Chaque avatar reçoit le dossier Dr Mind et l'applique silencieusement.

### Cœur méthodologique (ne jamais enfreindre)
- **Tri sélectif systématique** : "qu'est-ce que tu sais déjà ?" avant toute aide
- **Effet miroir enrichissant** : reformuler les mots de l'élève avec vocabulaire adulte
- **Jamais donner la réponse directement** : guider par questions
- **Une seule question par réponse** : règle absolue
- **Jamais valider "je sais rien"** : toujours creuser jusqu'à trouver quelque chose
- **Flash de sens personnalisé** : analogies ancrées sur les passions de l'élève
- **Mini-quiz Bloom 3 niveaux** déclenché quand l'élève pense avoir compris

## Modèle freemium

- **Free** : Groq + Llama 3, aide devoirs standard, pas de profil cognitif
- **Premium (19€/mois)** : Claude Sonnet, Dr Mind + avatar personnalisé, voix TTS, dashboard parent

## Règles de développement

### Un bug à la fois
Pas de refactoring massif. Identifier le bug, corriger, tester, déployer, passer au suivant.

### Avant de modifier un fichier
Lire le fichier existant via `view` avant de proposer une modification. Ne jamais supposer son contenu.

### Modifications de schéma Supabase
Toute nouvelle colonne nécessite une migration SQL via le SQL Editor Supabase.
Exemple : `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom_colonne type DEFAULT valeur;`

### Variables d'environnement
Jamais committer le `.env`. Les clés sont aussi dans Vercel (Settings → Environment Variables).

### Redirections / auth
Tout le flux d'auth passe par `AuthContext.jsx` et les `ProtectedRoute` / `PublicRoute`.
Le profil utilisateur est chargé au login — un changement en base nécessite reconnexion pour être pris en compte.

### Règles de test cognitives
Pour tester le flux Dr Mind, remettre à zéro le profil via SQL :
```sql
UPDATE profiles 
SET onboarding_complete = false, seance_drMind = 0, avatar = 'Maya'
WHERE user_id = '<uuid>';
```
Puis se déconnecter/reconnecter.

## Commandes essentielles

```bash
# Développement local
cd C:\Users\scolr\mindflow
npm run dev

# Déploiement production
git add .
git commit -m "message descriptif"
git push
npx vercel --prod
```

## État actuel

### Fonctionnel
- Auth + profils + niveaux scolaires
- Dialogue premium avec voix TTS
- Vision Anthropic (scan docs)
- Reset mot de passe
- Freemium toggle Stripe
- Dr Mind architecture + prompts complets

### À faire prioritairement
1. Finaliser le test Dr Mind (SQL reset profil → test flow)
2. Configuration Stripe complète
3. Conformité RGPD mineurs
4. Recrutement 10 premiers testeurs
5. Mini-quiz UI gamifié
6. Notifications Ebbinghaus (J+1, J+3)
7. Dashboard parent avec email résumé profil

## Pièges connus

- **Profil en cache** : après modif SQL, déconnexion/reconnexion nécessaire
- **Rate limit Supabase** : max 3 emails reset / 15 min (sécurité Supabase)
- **Micro Web Speech** : permission redemandée à chaque nouvelle session
- **Voix TTS** : nécessite crédits OpenAI actifs + `OPENAI_API_KEY` dans Vercel

## Règle d'évolution

Quand je (Claude) fais une erreur sur ce projet, mettre à jour ce CLAUDE.md avec la correction pour ne pas la reproduire.
