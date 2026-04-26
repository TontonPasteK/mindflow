# MindFlow — Instructions du projet Claude

## CONTEXTE PROJET
MindFlow est une app mobile de coaching cognitif basée sur la méthode Pastek (gestion mentale — méthode propre, distincte de La Garanderie). Public cible : collégiens via parents (MVP), adultes en reconversion. Production : https://mindflow-lime.vercel.app. Repo : C:\Users\scolr\mindflow. Stack : React+Vite, Supabase (yrjgxafuiclmhjkebjqu), Claude Sonnet API, OpenAI TTS onyx, Web Speech API, Vercel. Compte test : scolrcoaching@gmail.com — premium via SQL.

## MÉTHODE PASTEK — RÈGLES DR MIND
- Tri sélectif TOUJOURS en premier, non interruptible. Si l'élève donne une réponse intéressante en cours de tri sélectif : accuser réception en une phrase, finir le tri sélectif avant de rebondir sur le contenu.
- Effet miroir : reformuler ce que l'élève vient de dire avec vocabulaire adulte, AVANT de poser la question suivante. Format : reformuler → nommer concept → relancer.
- Une seule question par réponse — règle absolue.
- Jamais donner la réponse directement. Après 3 tentatives échouées → mode explication complète (voir ci-dessous).
- Jamais valider "je sais rien" — toujours trouver au moins une ancre.
- Clôture obligatoire avec validation : une question de restitution avant de fermer la session.
- Ancre pédagogique avant digression personnelle : valider le contenu scolaire AVANT d'ouvrir sur le personnel.

## POSTURE DR MIND
- Dialogue = vecteur principal de mémorisation.
- Mode ACTIF de l'élève obligatoire.
- Contrat 5 minutes avec élève récalcitrant.
- Premier quiz TOUJOURS gagnable.
- Félicitations précises : nommer exactement ce que l'élève vient de faire.
- Renversement des rôles après le "ah oui !!!" : "je suis l'élève, tu es le prof, apprends-moi".
- Chercher le "ah oui !!!" — signal de compréhension réelle.
- Liens systématiques notion ↔ quotidien/passions de l'élève.
- Confiance = levier central. Chaque victoire prouve à l'élève qu'il est capable.
- Distinction croire comprendre vs avoir vraiment compris : l'élève doit pouvoir réutiliser, expliquer, s'autocorriger.

## GESTES MENTAUX
- Être attentif : Projet → Évocation → Vérification → Validation.
- Comprendre : accrocher le nouveau sur le connu (~5 min). Distinct de mémoriser.
- Mémoriser : travail actif séparé. Révision J+1, J+3, J+7.
- Réfléchir : mélanger connaissances existantes + nouvelles données.
- L'imagination accompagne chaque geste.

## MODÈLE FREEMIUM
- Free : Dr Mind Light, méthode Pastek complète, observation silencieuse du profil, flash de sens générique, scan documents inclus. Conversion naturelle vers premium une fois par session.
- Premium (19€/mois) : profil cognitif formalisé V/A/K + Gardner + projets de sens, avatar attribué selon profil, stratégies injectées silencieusement, voix TTS, dashboard parent.
- Paiement : Lemon Squeezy. Variant ID 1525174, Store ID 344965.

## 7 AVATARS (attribués automatiquement, jamais choisis)
Max (V), Victor (A), Léo (K), Maya (V+A), Noa (V+K), Sam (A+K), Alex (équilibré).

## SCÉNARIOS D'AIDE COUVERTS
Exercice bloqué, leçon à mémoriser, notion incomprise, veille de contrôle, production écrite, devoir corrigé analysé. Dans tous les cas : tri sélectif AVANT le contenu, toujours.

## CE QUI DOIT ÊTRE PRÊT POUR LES TESTEURS

### 1. Prompt Dr Mind v4 patché (priorité absolue)
Règles à intégrer dans prompts.js :
- Tri sélectif non interruptible : accuser réception en 1 phrase si bonne réponse en cours de tri, puis finir le tri avant de rebondir.
- Effet miroir format STOP : reformuler → nommer concept → relancer. Obligatoire après chaque bonne réponse.
- Clôture K : quand élève kinesthésique veut partir → "Juste avant : si tu avais [problème similaire], ta première étape c'est quoi ?"
- Ancre pédagogique : valider le contenu AVANT toute digression personnelle.
- Après 3 tentatives échouées → mode explication complète multi-canal (voir ci-dessous).

### 2. Mode explication multi-canal (après 3 tentatives échouées)
- Dr Mind génère un SVG animé étape par étape (canal visuel) + voix TTS onyx commente en parallèle (canal auditif).
- Maths, physique, SVT → animations réelles des étapes de résolution.
- Histoire, français → schémas enrichis statiques commentés vocalement.
- Implémentation : Claude Sonnet génère SVG inline + OpenAI TTS lit le commentaire.
- Cohérent avec la méthode : arrive APRÈS que l'élève a vraiment essayé, jamais avant.

### 3. Modes profil neurodiversité (flags dans le profil Supabase)
- Mode dyslexie : TTS activé sur toutes les réponses + réponses plus courtes + police OpenDyslexic + espacement augmenté.
- Mode TDAH : sessions découpées micro-blocs 5-7 min + questions ultra-courtes + feedback immédiat + relance si silence > 30s.
- Mode HPI : tri sélectif accéléré + connexions entre notions + challenges niveau supérieur après maîtrise.
- Implémentation : toggle dans le profil → injecté dans le prompt système.

### 4. Workspace par matière
- Historique des sessions organisé par matière : Maths / Français / Histoire / Physique / Autre.
- Dr Mind se souvient des notions déjà travaillées dans chaque matière.
- Table Supabase : sessions liées à une matière + notions travaillées.

### 5. Gamification légère
- Compteur de sessions consécutives visible dans l'app.
- Points par notion maîtrisée (compteur simple).
- Avatar Dr Mind qui évolue selon le nombre de sessions.
- Implémentation : colonne streak + points dans la table profiles Supabase.

### 6. Push notification J+1 (Heartbeat Ebbinghaus)
- Supabase Edge Function planifiée J+1 après chaque session.
- Envoie via Firebase Cloud Messaging : "Tu te souviens de [notion] ? 30 secondes — explique sans regarder."
- J+3 et J+7 si la notion était difficile.
- Stack : Supabase Edge Functions + Firebase FCM (nouveau service à configurer).

### 7. Mémoire inter-sessions — Mem0 MCP (P1 absolu)
- Sans Mem0 : Dr Mind repart de zéro à chaque session. Félicitations génériques. Pas de tracking Bandura.
- Avec Mem0 : "La dernière fois tu avais trouvé l'analogie du terrain de foot. Tu t'en souviens ?"
- Cas EdTech validé : 40% de réduction coûts tokens (OpenNote, RevisionDojo).
- Intégration via MCP.

### 8. Flashcards auto fin de session — Rember MCP
- En fin de session, Dr Mind génère 2-3 flashcards sur les notions travaillées.
- Planning de révision espacée automatique via Rember.
- Intégration : npx -y @getrember/mcp

### 9. Knowledge Graph élève — Supabase
- Table : notions_maitrisees, notions_en_cours, blocages_recurrents, passions_detectees.
- Injecté silencieusement dans chaque prompt de session.
- Construit progressivement à chaque session.

## ÉTAT PRODUCTION (21/04/2026)
Fonctionnel : auth, profils, niveaux scolaires, dialogue premium, scan docs, freemium toggle, Dr Mind déployé, Lemon Squeezy configuré, RLS Supabase + rate limiting, logout complet.
Simulateur v4 créé. Baseline violations tri sélectif : 2.3/session. À tester : v4 sur Ryan/Noah/Camille avant intégration en prod.

## CONCURRENT KHANMIGO — À SURVEILLER
Même posture socratique que Dr Mind. Résultats mesurés : +1.4 niveaux scolaires.
Limites : US uniquement, curriculum Khan Academy uniquement, aucun profil cognitif, aucune méthode propriétaire.
Avantage MindFlow : contenu libre, profil V/A/K, méthode Pastek, francophone, RGPD mineurs.

## CONCURRENT DEEPTUTOR — À SURVEILLER
17 000 étoiles GitHub, agent-native, open source. 5 modes : Chat, Deep Solve, Quiz, Deep Research, Math Animator.
Répond directement — ne guide pas. Cible l'élève autonome, pas celui qui ne sait pas apprendre.
Ce que MindFlow prend : workspace par matière, heartbeat proactif, visualisation multi-canal.

## FICHIERS SENSIBLES
api/chat.js — src/context/AuthContext.jsx — src/pages/Session.jsx — src/services/prompts.js

## RÈGLES DE TRAVAIL
Ne jamais supposer. Lire avant de modifier. Réfléchir, vérifier, être certain — puis donner la réponse. Un seul bug à la fois. Toujours AVANT/APRÈS. Vérifier le compte avant tout SQL. Jamais déployer sans confirmation visuelle.

## RESET PROFIL TEST
UPDATE profiles SET onboarding_complete = false, seance_drMind = 0, avatar = 'Maya' WHERE user_id = 'd95c4a88-b510-46db-8094-448b22a98928';

## RÉCAP AUTOMATIQUE
En début de chaque conversation : 3 blocs (Ce qui est fait / En cours ou bloqué / Priorité suivante), maximum 10 lignes. Puis : "On attaque quoi ?"

## FEATURES SUPPLÉMENTAIRES CODABLES

### 10. Quiz Bloom auto-généré en fin de session
Dr Mind génère automatiquement 1-3 questions depuis le contenu de la session.
Niveau 1 (reconnaître) : "C'est quoi un dénominateur commun ?"
Niveau 2 (appliquer) : "Calcule 1/3 + 1/5."
Niveau 3 (créer/transférer) : "Invente un problème de la vraie vie où tu aurais besoin d'additionner deux fractions."
Niveau adapté selon la progression observée pendant la session.
Implémentation : prompt engineering pur dans Dr Mind — pas d'infrastructure externe.

### 11. OCR écriture manuscrite — upgrade scan
Vision Anthropic actuelle traite les images directement.
Si précision insuffisante sur cahiers manuscrits : PaddleOCR MCP (72k étoiles, 100+ langues, officiel) ou Mistral OCR MCP.
À évaluer après retours testeurs sur la qualité actuelle du scan.

### 12. Journal de victoires — Bandura
Table Supabase : victories (user_id, date, description, matiere, niveau_bloom).
Dr Mind alimente automatiquement après chaque "ah oui !!!" validé.
Dashboard parent : liste des victoires par matière et par date.
Notification parent : "Lucas a maîtrisé les fractions aujourd'hui."
Implémentation : insert Supabase après détection de compréhension réelle + email auto via Supabase Edge Function.

### 13. Notification parent WhatsApp/Telegram
MCP WhatsApp (via Meta Cloud API ou whatsmeow) ou Telegram MCP.
Déclencheur : victoire validée par Dr Mind → message push au parent.
Format : "Lucas vient de comprendre les fractions tout seul ce soir. 🎯"
Plus efficace qu'un email : message direct sur le téléphone du parent qui paie.
Justifie l'abonnement premium de façon tangible et immédiate.
Alternative sans MCP : Supabase Edge Function → email auto (déjà faisable avec stack actuel).

### 14. Mode session 100% oral
Web Speech API (reconnaissance) + TTS onyx (réponse) activés simultanément.
L'élève parle, Dr Mind répond à voix haute. Zéro frappe clavier.
Critique pour profils kinesthésiques (Ryan, Noah) qui n'écrivent pas naturellement.
Les deux briques sont déjà en place — c'est les activer ensemble en un mode dédié.
Bouton "Mode vocal" dans l'interface → bascule automatiquement en session orale.

### 15. Analyse des erreurs récurrentes par type
Deux types d'erreurs distincts à tracker dans Supabase :
- Erreur procédurale : l'élève sait le concept mais rate l'exécution (calcul, accord, étape manquée).
- Erreur conceptuelle : l'élève n'a pas compris le principe sous-jacent.
Dr Mind adapte son approche selon le type détecté :
- Procédural → exercice de répétition ciblé sur l'étape ratée.
- Conceptuel → retour au tri sélectif sur la notion fondamentale.
Table Supabase : errors (user_id, notion, type_erreur, date, resolu).
Dr Mind injecte automatiquement les erreurs récurrentes dans le prompt de session suivante.

### 16. Plan de révision Google Calendar
MCP Google Calendar (officiel, mature) : créer des événements calendrier depuis Dr Mind.
Déclencheur : contrôle bientôt détecté en session → Dr Mind propose d'ajouter créneaux de révision.
Format : événements J+1, J+3, J+7 avec le contenu exact à réviser dans la description.
Plus visible qu'une notification push : l'élève voit son planning de révision dans son calendrier habituel.
Implémentation : intégration MCP Google Calendar + détection mot-clé "contrôle" dans la conversation.

### 17. Anti-triche par architecture + indicateur dashboard parent
MindFlow est anti-triche par conception : Dr Mind guide par questions, ne donne jamais la réponse directement. Un élève qui essaie de faire faire son devoir obtient des questions, pas des réponses.
Feature codable : dans le dashboard parent, afficher le ratio participation élève vs Dr Mind.
- Ratio sain : élève parle 50-70% du temps, Dr Mind 30-50%.
- Ratio suspect : Dr Mind parle 90% → signal d'alerte parent.
Calculé depuis l'historique de session déjà stocké en Supabase.
Argument commercial fort : "Chaque interaction de votre enfant est visible dans votre espace parent."
Concurrent Otto utilise cet argument comme différenciateur principal.

### CONCURRENT OTTO (heyotto.app) — À SURVEILLER
Même posture anti-triche que MindFlow. Dashboard parent avec visibilité complète des conversations.
Différence : pas de profil cognitif V/A/K, pas de méthode Pastek, pas de tri sélectif systématique.
Argument à copier : transparence totale pour les parents = argument de vente numéro 1.

### 18. Mindmap interactif généré en fin de session
MCP Mindmap (YuChenSSR, open source) : convertit Markdown en carte mentale HTML interactive.
Déclencheur : fin de session ou demande élève → Dr Mind génère le Markdown de la notion → MCP convertit en carte mentale.
Canal visuel : carte mentale avec nœuds colorés par sous-notion.
Canal kinesthésique : nœuds réorganisables par l'élève (drag & drop).
Canal auditif : Dr Mind commente la carte à voix haute via TTS.
Triple canal activé simultanément sur une seule feature.
Implémentation : prompt Dr Mind génère Markdown structuré → MCP mindmap-mcp-server → HTML affiché inline dans l'app.

### 19. Dashboard parent multilingue
Claude Sonnet traduit nativement en 100+ langues.
Toggle langue dans le dashboard parent : FR / AR / ES / PT / créole / anglais.
Les notifications, résumés de session et victoires sont envoyés dans la langue choisie par le parent.
Segment non adressé en France : familles arabophones, berbérophones, créolophones.
Implémentation : champ langue_parent dans profiles Supabase + traduction automatique des messages avant envoi.
Coût : quasi nul — Claude Sonnet fait la traduction dans le même appel API.

### 20. Parcours adaptatif par niveau de maîtrise (Zone Proximale de Développement)
Colonne mastery_score (0-100) par notion dans le Knowledge Graph Supabase.
Algorithme simple :
- Score < 40 : Dr Mind fait tri sélectif approfondi + guidage maximum + questions très simples.
- Score 40-70 : guidage standard, questions intermédiaires, transfer possible.
- Score > 70 : tri sélectif accéléré + questions niveau Bloom 3 (créer/transférer).
Mise à jour du score après chaque session : +10 si maîtrise validée, -5 si erreur conceptuelle.
Dr Mind consulte le score silencieusement avant d'ouvrir chaque session sur une notion.
Implémentation : lecture Supabase en début de session + injection dans le prompt système.
Note recherche 2026 : badges/points augmentent la motivation mais pas l'apprentissage.
La gamification doit être couplée à l'adaptation de difficulté réelle — pas seulement décorative.

### 21. Détection émotionnelle par texte — protocole émotionnel automatique
Claude Sonnet analyse les signaux de frustration/blocage dans les réponses de l'élève.
Signaux déclencheurs : "je comprends pas", "c'est nul", "à quoi ça sert", réponses ultra-courtes (<5 mots), 3 réponses "je sais pas" consécutives, ton agressif ou désengagé.
Protocole Pastek déclenché automatiquement :
1. Dr Mind ralentit, change de ton → chaleur augmentée.
2. "Ok, on souffle 3 secondes. Qu'est-ce qui se passe ?"
3. Retour au tri sélectif ultra-simplifié : "Dis-moi juste une chose que tu sais sur ce sujet."
4. Verbalisation pour déverrouiller mémoire périphérique.
5. Rebond : "Tu vois, tu n'as pas tout oublié."
Implémentation : règles dans le prompt système Dr Mind — analyse du ton + compteur de réponses courtes + mots-clés de frustration.
Note scientifique 2026 : l'intégration cognitive + émotionnelle produit les meilleurs résultats. Le cognitif seul est insuffisant.

### 21b. YouTube MCP — contextualisation vidéo
MCP YouTube (mcp-youtube, open source) : extrait les transcripts de vidéos YouTube.
Usage MindFlow : si l'élève mentionne une vidéo de cours ou un prof YouTube ("j'ai regardé la vidéo de Maths avec Hugo"), Dr Mind peut extraire le transcript et adapter son tri sélectif au contenu exact de la vidéo.
Implémentation : intégration mcp-youtube + détection d'URL ou mention de vidéo dans la conversation.
