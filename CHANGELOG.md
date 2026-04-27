# CHANGELOG MindFlow

Historique complet des modifications — du prototype à la production.
Format : `[DATE] — Ce qui a changé — Pourquoi`

---

## PHASE 1 — Prototype HTML (avril 2026, semaine 1)

**[07/04/2026] — Création du prototype HTML unique (mindflow.html)**
Pourquoi : valider le concept avant de coder une vraie app. Un seul fichier HTML avec Max, le dialogue IA, et la voix. Premier test de la méthode Pastek dans une interface.

**[07/04/2026] — Intégration API Anthropic Claude Sonnet**
Pourquoi : Claude Sonnet est le modèle le plus adapté pour reproduire la méthode pédagogique — reformulation, effet miroir, tri sélectif.

**[07/04/2026] — Intégration Web Speech API (micro)**
Pourquoi : permettre à l'élève de parler au lieu de taper — plus naturel, plus proche d'une vraie session.

**[07/04/2026] — Intégration OpenAI TTS voix onyx**
Pourquoi : donner une voix à Max. La voix onyx a été choisie pour son ton chaleureux et naturel.

---

## PHASE 2 — Migration vers React + Vite (avril 2026, semaine 2)

**[12/04/2026] — Réécriture complète en React + Vite**
Pourquoi : le prototype HTML était trop limité pour évoluer. React permet de structurer le code, gérer les états, et ajouter des features sans tout casser.

**[12/04/2026] — Intégration Supabase (base de données + auth)**
Pourquoi : stocker les profils cognitifs, l'historique des sessions, et gérer l'authentification des utilisateurs de façon sécurisée.

**[12/04/2026] — Création du système freemium**
Pourquoi : modèle économique défini — Free (Groq + Llama 3, texte uniquement) vs Premium (Claude Sonnet, voix, profil cognitif). Séparation claire dans le code via buildFreePrompt / buildPremiumPrompt.

**[12/04/2026] — Création des personnages (7 avatars)**
Pourquoi : chaque profil cognitif V/A/K correspond à un personnage distinct. Max (visuel), Victor (auditif), Léo (kinesthésique), Maya (visuel+auditif), Noa (visuel+kinesthésique), Sam (auditif+kinesthésique), Alex (équilibré). L'avatar est attribué automatiquement selon le profil — l'élève ne choisit pas.

**[12/04/2026] — Déploiement initial sur Vercel**
Pourquoi : rendre l'app accessible en ligne pour tester en conditions réelles. URL : https://evokia-lime.vercel.app

**[12/04/2026] — Migration de Max vers Maya (avatar actuel)**
Pourquoi : Maya correspond mieux au profil visuel+auditif dominant testé en premier. Max reste dans la roadmap pour les profils visuels purs.

---

## PHASE 3 — Stabilisation et features (avril 2026, semaine 2-3)

**[13/04/2026] — Ajout du champ niveau scolaire à l'inscription**
Pourquoi : adapter le vocabulaire et les exemples de Maya au niveau réel de l'élève (CM2 à Adulte). Migration SQL : ajout colonne `niveau` dans la table users.

**[13/04/2026] — Sécurisation Supabase RLS**
Pourquoi : chaque utilisateur ne doit voir que ses propres données. Les Row Level Security policies empêchent tout accès croisé entre comptes.

**[13/04/2026] — Rate limiting 20 req/h**
Pourquoi : éviter les abus et contrôler les coûts API. Implémenté côté serveur dans api/chat.js.

**[13/04/2026] — Intégration scan document (vision Anthropic)**
Pourquoi : permettre à l'élève de photographier ou uploader son exercice. Maya voit le document et l'aide dessus directement.

**[13/04/2026] — Retry automatique si API surchargée**
Pourquoi : Claude Sonnet peut être en surcharge (erreur Overloaded). Le retry automatique jusqu'à 3 fois évite les erreurs visibles pour l'utilisateur.

**[14/04/2026] — Migration voix onyx → nova**
Pourquoi : nova a un ton plus chaleureux et féminin, cohérent avec le personnage Maya.

**[14/04/2026] — Ajout bouton pause (orange quand Maya parle)**
Pourquoi : permettre à l'élève de couper la voix de Maya sans déconnecter le micro.

**[14/04/2026] — Redirection directe /session?mode=premium si profil complet**
Pourquoi : éviter l'étape de choix inutile pour les utilisateurs premium dont le profil est déjà établi.

**[14/04/2026] — Restauration bouton micro disparu**
Pourquoi : régression introduite lors d'une correction précédente. Le bouton était conditionné à isSupported qui revenait false trop tôt.

---

## PHASE 4 — Corrections bugs (16/04/2026)

**[16/04/2026] — Maya posait plusieurs questions par réponse → corrigé**
Pourquoi : la règle "3 phrases max" ne suffisait pas. Ajout de la règle explicite "UNE SEULE QUESTION PAR RÉPONSE" dans buildPremiumPrompt et buildFreePrompt (src/services/prompts.js).

**[16/04/2026] — Bouton pause redémarrait le micro au lieu de couper → corrigé**
Pourquoi : quand stopTTS() était appelé, isSpeaking passait à false et l'effet auto-listen redémarrait le micro 400ms après. Ajout de l'état userPaused dans Session.jsx pour bloquer l'auto-listen quand l'utilisateur met en pause volontairement.

**[16/04/2026] — Déconnexion bloquée quand micro actif → corrigé**
Pourquoi : le bouton Se déconnecter ne répondait pas pendant l'enregistrement. Ajout d'un event listener mindflow:logout dans useVoice.js pour stopper le micro immédiatement à la déconnexion.

**[16/04/2026] — Mise en place GitHub**
Pourquoi : le code n'existait que sur l'ordi local — risque de tout perdre. Push complet sur https://github.com/TontonPasteK/mindflow (branche master, 114 fichiers).

**[16/04/2026] — Préparation migration Groq (temporaire)**
Pourquoi : solde Anthropic API épuisé (-0,54$). Basculement temporaire vers Groq (gratuit) pour continuer les tests sans coût. Fichier api/chat.js réécrit pour pointer vers api.groq.com avec modèle llama-3.3-70b-versatile. À inverser dès rechargement Anthropic.

---

## ROADMAP — À faire

- [ ] Activer Groq en prod (clé GROQ_API_KEY dans Vercel)
- [ ] Recharger Anthropic API et revenir sur Claude Sonnet
- [ ] Connecter GitHub à Vercel pour déploiements automatiques
- [ ] Configurer Stripe pour les paiements
- [ ] RGPD — consentement parental pour les mineurs
- [ ] Sécuriser les webhooks Stripe (vérification signature)
- [ ] Trouver 10 premiers testeurs réels
- [ ] Gamification : mini-quiz après chaque notion, 3 niveaux (débutant/intermédiaire/expert), système de points/étoiles
- [ ] Landing page redesign avec visuels personnages
- [ ] Clip vidéo 30-60s avec les personnages
- [ ] Dashboard praticien (version Pro)
- [ ] B2B établissements

---

## RÈGLES DE TRAVAIL

- Un bug à la fois
- Toujours lire le code avant de modifier
- Modifications directes dans VS Code — pas de Claude Code sauf si indispensable
- Tester en local avant de déployer
- `npx vercel --prod` pour déployer
- Chaque modification = un commit Git avec message clair
- Format commit : `fix: description` / `feat: description` / `chore: description`
