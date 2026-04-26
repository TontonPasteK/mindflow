# MindFlow

App web d'accompagnement cognitif basée sur la méthode Pastek (gestion mentale).
Public : collégiens, étudiants, adultes en formation/reconversion.
Production : https://mindflow-lime.vercel.app

## Stack

- **Frontend** : React + Vite (JavaScript, pas TypeScript)
- **Backend** : Vercel serverless functions (`/api/*`)
- **Database + Auth** : Supabase (`yrjgxafuiclmhjkebjqu`)
- **IA Premium** : Claude Sonnet (Anthropic API)
- **IA Free** : Groq + Llama 3 (temporaire)
- **Voix TTS** : OpenAI (onyx/nova)
- **Voix input** : Web Speech API
- **Paiements** : Stripe / Lemon Squeezy
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

## Règles absolues de développement

### 1. Un seul bug à la fois
Ne pas toucher d'autres fichiers que ceux concernés par le bug en cours. Pas de refactoring massif.

### 2. Toujours montrer AVANT/APRÈS
Pour chaque modification, montrer le code avant et le code après. Pas de diff implicite.

### 3. Tester avant de déployer
Utiliser Glance MCP pour validation visuelle dans le navigateur. Jamais valider "ça marche" sans preuve visuelle.

### 4. Utiliser `vercel dev` en local
`npm run dev` seul laisse `/api/chat` en 404 (pas de serverless functions).
`vercel dev` sert Vite + les fonctions `/api/` correctement.

### 5. Ne jamais déployer si erreur console
Si Glance détecte une erreur dans la console navigateur, corriger avant déploiement.

### 6. Lire le fichier avant de modifier
Toujours lire le fichier existant via `view` avant de proposer une modification. Ne jamais supposer son contenu.

### 7. Vérifier quel compte utilisateur est actif
Avant d'écrire du SQL qui dépend d'un user_id ou email, demander explicitement à l'utilisateur quel compte est connecté. Ne jamais supposer.

## Fichiers sensibles — modifier avec précaution

- **`api/chat.js`** : logique premium/free — ne pas modifier sans validation
- **`src/context/AuthContext.jsx`** : gestion auth + chargement profil
- **`src/pages/Session.jsx`** : logique TTS + voix
- **`src/services/prompts.js`** : prompts Dr Mind + 7 avatars

## Bugs connus à ne pas reproduire

### Logout incomplet
Le logout DOIT utiliser :
```js
localStorage.clear()
sessionStorage.clear()
await supabase.auth.signOut()
window.location.replace('https://mindflow-lime.vercel.app')
```
Plus appel à `/api/logout` côté serveur pour clear le cookie httpOnly Supabase.

### isPremium mal lu
Lire `is_premium` depuis Supabase `profiles` avec `Promise.allSettled` pour gérer les échecs gracieusement.

### Profil en cache après modif SQL
Après toute modification directe en base, déconnexion/reconnexion nécessaire pour que le profil soit rechargé.

### Rate limit Supabase emails
Max 3 emails reset / 15 min — sécurité côté Supabase, non configurable.

### Voix TTS silencieuse
Nécessite crédits OpenAI actifs + `OPENAI_API_KEY` dans Vercel Environment Variables.

## Schéma Supabase — colonnes importantes

Table `profiles` :
- `onboarding_complete` (bool)
- `seance_drMind` (int, 0-2)
- `avatar` (text) : Max, Victor, Léo, Maya, Noa, Sam, Alex
- `visuel`, `auditif`, `kinesthesique` (int, pourcentages)
- `projet_de_sens`, `intelligence_dominante`, `passions` (text)

Toute nouvelle colonne nécessite migration SQL :
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom type DEFAULT valeur;
```

## Reset profil pour test Dr Mind

```sql
UPDATE profiles 
SET onboarding_complete = false, seance_drMind = 0, avatar = 'Maya'
WHERE user_id = '<uuid>';
```
Puis déconnexion/reconnexion.

## Commandes essentielles

```bash
# Dev local avec API (recommandé)
cd C:\Users\scolr\mindflow
vercel dev

# Dev local sans API
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
- Freemium toggle
- Dr Mind architecture + prompts complets (déployé mais SQL de reset profil à lancer pour tester)

### À faire prioritairement
1. Finaliser test Dr Mind (SQL reset profil → test flow complet)
2. Stripe configuration complète
3. Conformité RGPD mineurs
4. Recrutement 10 premiers testeurs
5. Mini-quiz UI gamifié (3 niveaux Bloom)
6. Notifications Ebbinghaus (J+1, J+3)
7. Dashboard parent avec email résumé profil

## Règle d'évolution

Quand Claude fait une erreur sur ce projet, mettre à jour ce CLAUDE.md avec la correction pour ne pas la reproduire.

## Mise à jour état production (26/04/2026)
Nouveau déployé : Mem0 branché (MEM0_API_KEY dans Vercel).
Sauvegarde uniquement sur [[SEANCE_COMPLETE]] — résumé structuré.
Query Mem0 = prénom + matière de l'élève.
En attente : patch format 2 phrases max dans prompts.js,
test visuel blocs 2-12, [[SEANCE_COMPLETE]] → transition avatar,
renommage URL Vercel → evokia.

## Récap automatique en début de session
3 blocs : Ce qui est fait / En cours ou bloqué / Priorité suivante.
Maximum 10 lignes. Puis : "On attaque quoi ?"