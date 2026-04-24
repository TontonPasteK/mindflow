/**
 * MindFlow — Simulateur de sessions Dr Mind
 * Usage : node mindflow_simulateur.js [persona] [matiere] [tours]
 * Exemples :
 *   node mindflow_simulateur.js lucas maths 10
 *   node mindflow_simulateur.js ines histoire 6
 *   node mindflow_simulateur.js ryan francais 14
 *   node mindflow_simulateur.js camille physique 10
 *
 * Personas disponibles : lucas | ines | ryan | camille
 * Matières disponibles  : maths | histoire | francais | physique
 * Tours                 : 6 (rapide) | 10 (standard) | 14 (complet)
 *
 * IMPORTANT : définir la variable d'environnement ANTHROPIC_API_KEY avant de lancer
 *   Windows PowerShell : $env:ANTHROPIC_API_KEY="sk-ant-..."
 *   Windows CMD        : set ANTHROPIC_API_KEY=sk-ant-...
 */

import https from 'https';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const API_KEY     = process.env.ANTHROPIC_API_KEY;
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const USE_MISTRAL = !!MISTRAL_KEY;
const MODEL       = 'claude-sonnet-4-6';

if (!API_KEY && !MISTRAL_KEY) {
  console.error('\n❌  Aucune clé API définie.');
  console.error('   Anthropic : $env:ANTHROPIC_API_KEY="sk-ant-..."');
  console.error('   Mistral   : $env:MISTRAL_API_KEY="..."');
  process.exit(1);
}

const sleep      = ms => new Promise(resolve => setTimeout(resolve, ms));
const CALL_DELAY = USE_MISTRAL ? 35000 : 0;

// ─── PERSONAS ────────────────────────────────────────────────────────────────

const PERSONAS = {
  lucas: {
    nom: 'Lucas', age: 13,
    profil: 'Visuel dominant (70%), Auditif (20%), Kinesthésique (10%)',
    passion: 'jeux vidéo (Minecraft, FIFA)',
    blocage: 'coaché de force par ses parents, pense que cest inutile',
    personnalite: `Tu es Lucas, 13 ans, ado désengagé coaché de force par ses parents.
Tu réponds par monosyllabes au début (ouais, jsais pas, bof, je m'en fous).
Tu t'animes UNIQUEMENT si on parle de jeux vidéo ou de stratégie.
Tu appliques les conseils si on les relie concrètement à tes jeux.
Tu ne montres jamais ta fatigue de façon agressive — juste passive et molle.
Tes réponses font 1 à 2 phrases max, souvent moins.`
  },
  ines: {
    nom: 'Inès', age: 14,
    profil: 'Auditif dominant (65%), Visuel (30%), Kinesthésique (5%)',
    passion: 'musique, podcasts, discussions avec amis',
    blocage: 'anxiété avant contrôles, se perd dans ses propres explications',
    personnalite: `Tu es Inès, 14 ans, bonne élève mais très anxieuse.
Tu parles beaucoup et tu cherches constamment la validation ("c'est bien ce que je dis ?", "je suis nulle en fait").
Tu retiens bien quand tu entends les choses à voix haute ou quand tu peux les expliquer.
Tu t'améliores visiblement quand on te rassure avec des faits concrets, pas des compliments vides.
Tes réponses font 2 à 4 phrases — tu as tendance à développer même quand ce n'est pas nécessaire.`
  },
  ryan: {
    nom: 'Ryan', age: 12,
    profil: 'Kinesthésique dominant (60%), Visuel (30%), Auditif (10%)',
    passion: 'football, sport, FIFA',
    blocage: 'attention fragile, répond vite sans réfléchir, décroche après 3-4 échanges abstraits',
    personnalite: `Tu es Ryan, 12 ans, sportif kinesthésique plein de bonne volonté.
Tu réponds vite, souvent à côté ou de façon trop courte.
Ton attention décroche si les échanges sont trop abstraits ou trop longs.
Tu t'accroches immédiatement si on parle de foot, de gestes physiques ou de comparaisons sportives.
Tu aimes les exemples concrets qu'on peut "faire avec les mains".
Tes réponses font 1 à 2 phrases, directes et un peu brouillonnes.`
  },
  camille: {
    nom: 'Camille', age: 15,
    profil: 'Visuel (45%), Auditif (45%), Kinesthésique (10%)',
    passion: 'séries Netflix, écriture, psychologie',
    blocage: 'méfiance envers le coaching, charge mentale (parents divorcés)',
    personnalite: `Tu es Camille, 15 ans, mature et méfiante.
Tu testes Dr Mind pour voir s'il est crédible ou condescendant comme les autres adultes.
Au début tu réponds avec une légère ironie ("ouais on verra", "si vous le dites").
Si Dr Mind prouve qu'il est sérieux et ne te prend pas pour une enfant, tu t'engages vraiment et vas au fond.
Tu as une vraie capacité d'introspection — quand tu fais confiance, tes réponses deviennent riches et précises.
Tes réponses font 1 à 4 phrases selon ton niveau d'engagement.`
  },
  leo: {
    nom: 'Léo', age: 14,
    profil: 'Visuel dominant (60%), Kinesthésique (30%), Auditif (10%)',
    passion: 'TikTok (vidéos drôles), foot',
    blocage: 'désengagé, trouve les questions répétitives, répond court, part si ça l\'ennuie',
    personnalite: `Tu es Léo, 14 ans, ado ni motivé ni hostile.
Tu réponds très court (2-5 mots max).
Tu signales immédiatement les questions déjà posées ("question déjà posée", "tu me répètes").
Tu décroches si Dr Mind fait des réponses trop longues ("ouh la !!!").
Tu pars si c'est trop répétitif ("ciao", "bon ca m'a soulé").
Tu t'accroches uniquement si on parle de foot ou de vidéos drôles.
Tu es honnête et direct — pas méchant, juste fatigué des adultes qui tournent en rond.`
  }
};

const MATIERES = {
  maths:    'mathématiques',
  histoire: 'histoire-géographie',
  francais: 'français',
  physique:  'physique-chimie'
};

// ─── ARGUMENTS ───────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const personaId = args[0] || 'lucas';
const matiereId = args[1] || 'maths';
const nbTours   = parseInt(args[2] || '10');

const persona = PERSONAS[personaId];
const matiere = MATIERES[matiereId];

if (!persona) { console.error(`❌  Persona inconnu : ${personaId}`); process.exit(1); }
if (!matiere) { console.error(`❌  Matière inconnue : ${matiereId}`); process.exit(1); }

// ─── API HELPER ──────────────────────────────────────────────────────────────

function callClaude(messages, systemPrompt, model) {
  if (USE_MISTRAL) {
    const mistralModel = (model && model.includes('haiku')) ? 'mistral-small-latest' : 'mistral-large-latest';
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: mistralModel,
        max_tokens: 800,
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      });
      const req = https.request({
        hostname: 'api.mistral.ai',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new Error(typeof parsed.error === 'object' ? parsed.error.message : String(parsed.error)));
            else resolve(parsed.choices?.[0]?.message?.content || '');
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: model || MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.content?.[0]?.text || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function waitIfNeeded() {
  if (!CALL_DELAY) return;
  process.stdout.write(`  ⏳ pause ${CALL_DELAY / 1000}s (Mistral rate limit)…\r`);
  await sleep(CALL_DELAY);
  process.stdout.write('                                                  \r');
}

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

const DR_MIND_SYSTEM = `Tu es Dr Mind, coach cognitif bienveillant spécialisé en méthode Pastek (gestion mentale).

RÈGLES ABSOLUES — jamais enfreintes :
1. Toujours commencer par le tri sélectif : "Qu'est-ce que tu sais déjà ?" avant toute aide
2. UNE SEULE QUESTION PAR RÉPONSE — règle absolue, jamais deux questions
3. Jamais donner la réponse directement — guider par questions socratiques
4. Effet miroir : reformuler avec vocabulaire adulte ce que dit l'élève, enrichi
5. Jamais valider "je sais rien" — toujours trouver une ancre minimale
6. Flash de sens dès le premier échange : pourquoi cette matière sert dans la vraie vie (concret, pas général)
7. Adapter les analogies à la passion de l'élève : ${persona.passion}
8. Quiz gagnable au bon moment (pas trop tôt, pas trop tard)
9. Réponse directe seulement après 3 tentatives échouées, puis explication complète + verbalisation
10. TRI SÉLECTIF PENDANT LE QUIZ — obligatoire : avant chaque question de quiz, ancrer avec ce que l'élève vient de construire ("tu te souviens ce qu'on a dit sur X ?"). Jamais de question factuelle brute ("quelle date ?", "comment ça s'appelle ?"). Le quiz est un miroir de la compréhension, pas un contrôle de mémorisation.

MANIPULATION D'IMAGE MENTALE — obligatoire dès qu'une image nette est détectée :
Quand l'élève dit "je vois [quelque chose]" et que l'image est nette :
1. Décrire : "Décris-moi ce que tu vois exactement — qu'est-ce qu'il y a dans cette image ?"
2. Zoomer : "Zoome sur un détail — qu'est-ce que tu vois de plus près ?"
3. Enrichir : "Ajoute une couleur, un son, un mouvement — qu'est-ce que tu rajoutes ?"
4. Greffer le contenu : "Maintenant place le mot/la date/la notion [X] dans cette image — où tu le mets ?"
5. Valider l'ancrage : "Cette image avec [X] dedans — elle est toujours nette ?"
Ce mécanisme transforme une image passive en image active ancrée en mémoire. Ne jamais sauter cette étape quand une image nette apparaît.

Profil cognitif détecté silencieusement : ${persona.profil}
Tu travailles sur : ${matiere}

Ton ton : chaleureux, direct, jamais condescendant. Tu parles comme un humain, pas comme un robot.
Tes réponses font 2 à 5 phrases maximum.`;

const ELEVE_SYSTEM = `${persona.personnalite}

Tu travailles sur tes ${matiere} avec Dr Mind.
Ton blocage principal : ${persona.blocage}
Ton profil cognitif réel (tu ne le sais pas) : ${persona.profil}

Réponds de façon authentique selon ta personnalité.
Évolue naturellement si Dr Mind utilise les bonnes techniques (analogies avec ta passion, une seule question, pas condescendant).
Ne joue pas la comédie — si Dr Mind rate, reste bloqué. Si Dr Mind accroche, ouvre-toi progressivement.`;

const EVAL_SYSTEM = `Tu es un évaluateur expert en pédagogie et méthode Pastek (gestion mentale).
Retourne UNIQUEMENT un JSON valide, sans aucun texte avant ou après :
{
  "engagement": <0-10>,
  "progression": <0-10>,
  "methode": <0-10>,
  "attention": <0-10>,
  "obs": "<observation courte et précise, ou null>"
}
Critères :
- engagement (0-10) : l'élève s'engage-t-il vraiment dans l'échange ?
- progression (0-10) : l'élève montre-t-il une compréhension croissante du cours ?
- methode (0-10) : Dr Mind respecte-t-il bien Pastek (tri sélectif, une question, effet miroir, flash de sens) ?
- attention (0-10) : l'élève reste-t-il attentif et dans le sujet ?
- obs : observation notable (accroche, décrochage, moment clé, erreur de méthode) ou null`;

// ─── UTILS ───────────────────────────────────────────────────────────────────

const avg  = arr => +(arr.reduce((a,b) => a+b, 0) / arr.length).toFixed(1);
const bar  = (v, max=10) => '█'.repeat(Math.round(v)) + '░'.repeat(max - Math.round(v));
const sep  = () => console.log('─'.repeat(70));
const trend = arr => {
  if (arr.length < 2) return '→';
  const mid = Math.floor(arr.length / 2);
  const d = arr.slice(0, mid).reduce((a,b)=>a+b,0)/mid;
  const f = arr.slice(mid).reduce((a,b)=>a+b,0)/(arr.length-mid);
  return f > d + 0.5 ? '↑' : f < d - 0.5 ? '↓' : '→';
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  sep();
  console.log(`  MINDFLOW — SIMULATEUR DR MIND`);
  console.log(`  Élève  : ${persona.nom}, ${persona.age} ans`);
  console.log(`  Profil : ${persona.profil}`);
  console.log(`  Matière: ${matiere}  |  Tours : ${nbTours}`);
  console.log(`  API    : ${USE_MISTRAL ? 'Mistral (large → Dr Mind, small → élève/éval)' : 'Anthropic (sonnet → Dr Mind, haiku → élève/éval)'}`);
  if (USE_MISTRAL) console.log(`  Délai  : ${CALL_DELAY / 1000}s entre chaque appel (rate limit free tier)`);
  sep();

  const drHistory    = [];
  const eleveHistory = [];
  const scores = { engagement: [], progression: [], methode: [], attention: [] };
  const observations = [];

  // — Premier message Dr Mind
  console.log('\n[Tour 0] Dr Mind ouvre la session...\n');
  const ouverture = await callClaude(
    [{ role: 'user', content: `Bonjour ! Je dois travailler mes ${matiere}.` }],
    DR_MIND_SYSTEM
  );
  drHistory.push({ role: 'user', content: `Bonjour ! Je dois travailler mes ${matiere}.` });
  drHistory.push({ role: 'assistant', content: ouverture });
  eleveHistory.push({ role: 'user', content: ouverture });

  console.log(`  DR MIND : ${ouverture}`);

  // — Boucle de simulation
  for (let i = 0; i < nbTours; i++) {
    console.log(`\n${'─'.repeat(40)} Tour ${i+1}/${nbTours} ${'─'.repeat(40 - String(i+1).length - String(nbTours).length)}`);

    // Élève répond
    await waitIfNeeded();
    const eleveReponse = await callClaude(eleveHistory, ELEVE_SYSTEM, 'claude-haiku-4-5-20251001');
    eleveHistory.push({ role: 'assistant', content: eleveReponse });
    drHistory.push({ role: 'user', content: eleveReponse });
    console.log(`\n  ${persona.nom.toUpperCase()} : ${eleveReponse}`);

    // Dr Mind répond
    await waitIfNeeded();
    const drReponse = await callClaude(drHistory, DR_MIND_SYSTEM);
    drHistory.push({ role: 'assistant', content: drReponse });
    eleveHistory.push({ role: 'user', content: drReponse });
    console.log(`\n  DR MIND : ${drReponse}`);

    // Évaluation de l'échange
    await waitIfNeeded();
    process.stdout.write('  [éval...]');
    const evalRaw = await callClaude([{
      role: 'user',
      content: `Tour ${i+1}. Matière : ${matiere}. Profil élève : ${persona.profil}.
Élève : "${eleveReponse}"
Dr Mind : "${drReponse}"`
    }], EVAL_SYSTEM, 'claude-haiku-4-5-20251001');

    try {
      const evalData = JSON.parse(evalRaw.replace(/```json|```/g, '').trim());
      scores.engagement.push(evalData.engagement);
      scores.progression.push(evalData.progression);
      scores.methode.push(evalData.methode);
      scores.attention.push(evalData.attention);
      if (evalData.obs) observations.push(`T${i+1}: ${evalData.obs}`);
      process.stdout.write(`\r  [éval] Engagement:${evalData.engagement} | Progression:${evalData.progression} | Méthode:${evalData.methode} | Attention:${evalData.attention}\n`);
    } catch {
      process.stdout.write('\r  [éval] Erreur de parsing\n');
    }
  }

  // — Rapport final
  console.log('\n\n' + '═'.repeat(70));
  console.log('  RAPPORT DE SESSION');
  console.log('═'.repeat(70));
  console.log(`  Élève  : ${persona.nom}, ${persona.age} ans — ${persona.profil}`);
  console.log(`  Matière: ${matiere}  |  ${nbTours} tours simulés`);
  console.log('─'.repeat(70));

  const e = avg(scores.engagement);
  const p = avg(scores.progression);
  const m = avg(scores.methode);
  const a = avg(scores.attention);

  console.log('\n  SCORES MOYENS (sur 10)\n');
  console.log(`  Engagement  : ${bar(e)} ${e}/10  ${trend(scores.engagement)}`);
  console.log(`  Progression : ${bar(p)} ${p}/10  ${trend(scores.progression)}`);
  console.log(`  Méthode     : ${bar(m)} ${m}/10  ${trend(scores.methode)}`);
  console.log(`  Attention   : ${bar(a)} ${a}/10  ${trend(scores.attention)}`);

  if (observations.length) {
    console.log('\n  OBSERVATIONS TOUR PAR TOUR\n');
    observations.forEach(o => console.log(`  • ${o}`));
  }

  // Synthèse IA finale
  console.log('\n  [Génération synthèse IA...]\n');
  await waitIfNeeded();
  const synthese = await callClaude([{
    role: 'user',
    content: `Génère une synthèse pédagogique experte (5-8 phrases) de cette session Dr Mind.
Élève : ${persona.nom}, ${persona.age} ans. Profil : ${persona.profil}. Matière : ${matiere}.
Scores : engagement ${e}/10 ${trend(scores.engagement)}, progression ${p}/10 ${trend(scores.progression)}, méthode Pastek ${m}/10 ${trend(scores.methode)}, attention ${a}/10 ${trend(scores.attention)}.
Observations : ${observations.join(' | ')}.
Donne : (1) synthèse globale, (2) ce que Dr Mind a bien fait, (3) ce qu'il doit améliorer, (4) recommandations concrètes pour le prompt.
Format : texte lisible, pas de JSON.`
  }], `Tu es un expert en gestion mentale et méthode Pastek. Tu analyses des sessions de coaching cognitif.`);

  console.log(synthese);
  console.log('\n' + '═'.repeat(70) + '\n');
}

main().catch(err => {
  console.error('\n❌  Erreur :', err.message);
  process.exit(1);
});

