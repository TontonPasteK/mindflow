# MindFlow — Règles Claude Code

## Stack
- React + Vite, Supabase, Claude Sonnet API, OpenAI TTS (onyx), Vercel

## Règles absolues
1. Ne jamais déployer sans avoir testé dans le navigateur avec Glance MCP
2. Un seul bug à la fois — ne pas toucher d'autres fichiers que ceux concernés
3. Toujours montrer le code AVANT et APRÈS chaque modification
4. Après chaque correction, tester avec Glance sur mindflow-lime.vercel.app ou localhost
5. Ne jamais valider "ça marche" sans preuve visuelle (screenshot Glance)

## Bugs connus à ne pas reproduire
- logout : doit utiliser localStorage.clear() + sessionStorage.clear() + supabase.auth.signOut() + window.location.replace('https://mindflow-lime.vercel.app')
- isPremium : lire is_premium depuis Supabase profiles avec Promise.allSettled
- utiliser vercel dev en local (sert Vite + fonctions api/) — npm run dev seul laisse /api/chat en 404

## Fichiers sensibles
- api/chat.js : logique premium/free — ne pas modifier sans validation
- AuthContext.jsx : gestion auth — modifier avec précaution
- Session.jsx : logique TTS — modifier avec précaution

## Déploiement
- Toujours : vercel --prod
- Jamais déployer si Glance détecte une erreur console
