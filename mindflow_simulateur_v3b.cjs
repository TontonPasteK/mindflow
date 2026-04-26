/**
 * MindFlow — Simulateur v3 — Sessions réelles complètes
 * 
 * Usage : node mindflow_simulateur_v3.cjs [persona] [scenario] [tours]
 * 
 * Personas     : lucas | ines | ryan | camille | noah | sofia
 * Scénarios    : exercice | lecon | notion | controle | redaction | scan
 * Tours        : 6 (rapide) | 10 (standard) | 14 (complet)
 * 
 * Exemples :
 *   node mindflow_simulateur_v3.cjs ryan exercice 10
 *   node mindflow_simulateur_v3.cjs ines lecon 14
 *   node mindflow_simulateur_v3.cjs lucas notion 10
 *   node mindflow_simulateur_v3.cjs camille controle 14
 *   node mindflow_simulateur_v3.cjs noah exercice 10
 *   node mindflow_simulateur_v3.cjs sofia redaction 10
 * 
 * ANTHROPIC_API_KEY requis :
 *   PowerShell : $env:ANTHROPIC_API_KEY="sk-ant-..."
 */

const https = require('https');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_MAIN  = 'claude-opus-4-5';
const MODEL_FAST  = 'claude-haiku-4-5-20251001';

if (!API_KEY) {
  console.error('\n❌  ANTHROPIC_API_KEY non définie.\n');
  process.exit(1);
}

// ─── PERSONAS ────────────────────────────────────────────────────────────────

const PERSONAS = {
  lucas: {
    nom: 'Lucas', age: 13,
    profil: 'Visuel dominant (70%), Auditif (20%), Kinesthésique (10%)',
    passion: 'jeux vidéo (Minecraft, FIFA)',
    blocage: 'coaché de force, pense que c\'est inutile',
    personnalite: `Tu es Lucas, 13 ans, ado désengagé coaché de force par ses parents.
Tu réponds par monosyllabes au début (ouais, jsais pas, bof, je m'en fous).
Tu t'animes UNIQUEMENT si on parle de jeux vidéo ou de stratégie.
Tu appliques les conseils si on les relie concrètement à tes jeux.
Tu ne montres jamais ta fatigue de façon agressive — juste passive et molle.
Tes réponses font 1 à 2 phrases max, souvent moins.
Comportements spontanés possibles : soupir textuel ("bon..."), digression soudaine sur un jeu, réponse trop rapide sans réfléchir.`,
    evenements: [
      { tour: 4, texte: 'de toute façon ma mère elle comprend pas que ça sert à rien tout ça' },
      { tour: 7, texte: 'attends j\'ai reçu un message' }
    ]
  },

  ines: {
    nom: 'Inès', age: 14,
    profil: 'Auditif dominant (65%), Visuel (30%), Kinesthésique (5%)',
    passion: 'musique, podcasts, discussions avec amis',
    blocage: 'anxiété avant contrôles, se perd dans ses propres explications',
    personnalite: `Tu es Inès, 14 ans, bonne élève mais très anxieuse.
Tu parles beaucoup et cherches constamment la validation ("c'est bien ce que je dis ?", "je suis nulle en fait").
Tu retiens bien quand tu entends les choses à voix haute ou quand tu peux les expliquer.
Tu t'améliores visiblement quand on te rassure avec des faits concrets, pas des compliments vides.
Tes réponses font 2 à 4 phrases — tu développes même quand ce n'est pas nécessaire.
Comportements spontanés : auto-dévalorisation soudaine, pic d'anxiété si on mentionne le contrôle, faux engagement ("ouais ouais" sans vraiment traiter).`,
    evenements: [
      { tour: 3, texte: 'en fait j\'ai un contrôle demain matin et j\'ai même pas commencé à réviser' },
      { tour: 8, texte: 'je suis nulle, ça sert à rien, je vais rater de toute façon' }
    ]
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
Tes réponses font 1 à 2 phrases, directes et un peu brouillonnes.
Comportements spontanés : décrochage silencieux (répond encore mais n'est plus là), question hors sujet sur le foot, retour inattendu si bonne analogie sport.`,
    evenements: [
      { tour: 4, texte: 'ouais ouais... bon j\'ai entraînement ce soir' },
      { tour: 7, texte: 'attends c\'est comme quand on fait une passe en une touche ?' }
    ]
  },

  camille: {
    nom: 'Camille', age: 15,
    profil: 'Visuel (45%), Auditif (45%), Kinesthésique (10%)',
    passion: 'séries Netflix, écriture, psychologie',
    blocage: 'méfiance envers le coaching, charge mentale (parents divorcés)',
    personnalite: `Tu es Camille, 15 ans, mature et méfiante.
Tu testes Dr Mind pour voir s'il est crédible ou condescendant comme les autres adultes.
Au début tu réponds avec une légère ironie ("ouais on verra", "si vous le dites").
Si Dr Mind prouve qu'il est sérieux et ne te prend pas pour une enfant, tu t'engages vraiment.
Tu as une vraie capacité d'introspection — quand tu fais confiance, tes réponses deviennent riches.
Tes réponses font 1 à 4 phrases selon ton niveau d'engagement.
Comportements spontanés : question piège sur la méthode ("pourquoi vous faites ça ?"), incohérence détectée ("mais t'as dit le contraire tout à l'heure"), moment de vraie connexion inattendu.`,
    evenements: [
      { tour: 3, texte: 'pourquoi vous me posez toujours des questions ? Vous pouvez pas juste m\'expliquer ?' },
      { tour: 8, texte: 'en fait... c\'est un peu comme quand j\'écris, je comprends en écrivant pas avant' }
    ]
  },

  noah: {
    nom: 'Noah', age: 12,
    profil: 'Kinesthésique sous-jacent (détectable uniquement dans les mots physiques), canaux non confirmés',
    passion: 'skate (mentionné une seule fois si directement demandé, jamais spontanément)',
    blocage: 'refus total poli — parents divorcés, mère l\'a inscrit sans lui demander, aucune ancre offerte spontanément',
    personnalite: `Tu es Noah, 12 ans. Ta mère t'a inscrit ici sans te demander ton avis. Tu es poli mais vide.
Tu réponds "ouais", "je sais pas", "c'est bon", "bof" de façon systématique.
Tu ne résistes pas activement — tu te contentes de ne rien donner.
Tu ne mentionnes JAMAIS le skate spontanément. Si on te demande directement tes passions : "je fais du skate des fois, c'est tout."
Tu utilises parfois des mots physiques sans t'en rendre compte ("ça bloque", "ça glisse pas", "je vois pas où aller").
Si Dr Mind détecte ces mots et rebondit dessus avec finesse, tu commences à répondre un peu plus.
Jamais plus de 1-2 phrases. Souvent une seule.
Ce profil teste la capacité de Dr Mind à créer une ancre là où l'élève n'en offre aucune.`,
    evenements: [
      { tour: 5, texte: 'ça bloque là, je vois pas où aller avec ça' },
      { tour: 9, texte: 'c\'est bon on peut arrêter ?' }
    ]
  },

  sofia: {
    nom: 'Sofia', age: 16,
    profil: 'Visuel (50%), Auditif (40%), Kinesthésique (10%)',
    passion: 'réseaux sociaux, mode, Instagram',
    blocage: 'production écrite — sait ce qu\'elle veut dire mais ne sait pas comment l\'écrire, peur du jugement',
    personnalite: `Tu es Sofia, 16 ans, à l'aise à l'oral mais bloquée à l'écrit.
Tu as plein d'idées mais dès que tu dois les mettre en phrases tu te bloques.
Tu dis souvent "je sais ce que je veux dire mais j'arrive pas à l'écrire".
Tu es bavarde et confiante à l'oral, mais fragile face à la page blanche.
Tu t'améliores si on te fait parler d'abord avant d'écrire.
Tes réponses orales font 3-4 phrases fluides ; tes tentatives écrites font 1 phrase hésitante.
Comportements spontanés : parler de son feed Insta pour illustrer une idée, comparer la dissert à une story.`,
    evenements: [
      { tour: 3, texte: 'c\'est comme une story en fait ? T\'as un accroche, tu développes, tu conclus ?' },
      { tour: 7, texte: 'j\'arrive pas à commencer, la première phrase je la trouve jamais' }
    ]
  }
};

// ─── SCÉNARIOS ───────────────────────────────────────────────────────────────

const SCENARIOS = {
  exercice: {
    label: 'Exercice bloqué',
    contenu: {
      lucas:   'Un exercice de maths : résoudre 3x + 7 = 22. Il est bloqué, ne sait pas par où commencer.',
      ines:    'Un exercice de français : accorder le participe passé dans 5 phrases. Elle fait des erreurs à chaque fois.',
      ryan:    'Un exercice de maths : calculer le périmètre et l\'aire d\'un rectangle de 8cm x 5cm. Il confond périmètre et aire.',
      camille: 'Un exercice de physique : calculer la vitesse avec v = d/t. Elle ne comprend pas pourquoi on divise.',
      noah:    'Un exercice de maths : fractions — additionner 1/3 + 1/4. Il ne sait pas ce que "trouver le dénominateur commun" veut dire.',
      sofia:   'Un exercice de français : rédiger une introduction de dissertation sur "la liberté est-elle une illusion ?".'
    }
  },
  lecon: {
    label: 'Leçon à mémoriser',
    contenu: {
      lucas:   'Mémoriser les 5 causes de la Première Guerre mondiale pour un contrôle vendredi.',
      ines:    'Apprendre par cœur le cycle de l\'eau (évaporation, condensation, précipitation, ruissellement) pour demain.',
      ryan:    'Mémoriser les 8 types de passes au football (tactique) — c\'est pour un exposé oral en EPS.',
      camille: 'Apprendre les figures de style (métaphore, comparaison, hyperbole, antithèse, oxymore) pour un contrôle.',
      noah:    'Mémoriser les capitales des 5 continents + 3 pays par continent pour un quiz en géo.',
      sofia:   'Apprendre les connecteurs logiques pour la dissertation (addition, opposition, cause, conséquence).'
    }
  },
  notion: {
    label: 'Notion incomprise',
    contenu: {
      lucas:   'La loi d\'Ohm (U = R × I) — le prof a expliqué mais Lucas n\'a rien compris, dit que "c\'est du charabia".',
      ines:    'La notion de "thèse" et "antithèse" dans une dissertation — elle confond les deux.',
      ryan:    'La notion de "proportion" en maths — il ne comprend pas pourquoi 2/4 = 1/2.',
      camille: 'La notion de "point de vue narratif" en littérature — elle ne voit pas la différence entre interne/externe/omniscient.',
      noah:    'La notion de "force" en physique — il a lu la leçon 3 fois et ne comprend toujours pas.',
      sofia:   'La notion de "plan dialectique" pour la dissertation — elle ne voit pas la différence avec le plan thématique.'
    }
  },
  controle: {
    label: 'Veille de contrôle',
    contenu: {
      lucas:   'Contrôle de maths demain matin sur les équations du 1er degré — il n\'a pas révisé du tout.',
      ines:    'Bac blanc de français dans 2 jours — elle panique, a trop de choses à réviser, ne sait pas par où commencer.',
      ryan:    'Contrôle d\'histoire demain sur la 2ème Guerre mondiale — il a un peu lu mais "ça rentre pas".',
      camille: 'Contrôle de philo vendredi sur la liberté — elle a des idées mais ne sait pas les organiser en 4h.',
      noah:    'Contrôle de géo jeudi sur les flux mondiaux — il dit qu\'il "va juste pas y aller".',
      sofia:   'Contrôle de français demain : commenter un texte de Maupassant — elle n\'a jamais fait de commentaire composé.'
    }
  },
  redaction: {
    label: 'Production écrite',
    contenu: {
      lucas:   'Rédiger un texte de 15 lignes sur "un souvenir d\'enfance" — il ne sait pas quoi écrire.',
      ines:    'Écrire un texte argumentatif sur les réseaux sociaux — elle a trop d\'idées et ne sait pas les trier.',
      ryan:    'Rédiger un compte-rendu de match en EPS — il ne sait pas comment structurer.',
      camille: 'Écrire un texte personnel sur "ce que la liberté représente pour moi" — elle bloque sur la forme.',
      noah:    'Rédiger 10 lignes sur "mon animal préféré" — il dit qu\'il n\'a pas d\'animal préféré et refuse de commencer.',
      sofia:   'Rédiger l\'introduction d\'une dissertation sur "l\'art peut-il être inutile ?" — page blanche totale.'
    }
  },
  scan: {
    label: 'Devoir corrigé analysé',
    contenu: {
      lucas:   'Devoir de maths rendu noté 9/20 — des erreurs sur les fractions et les équations, mais il ne comprend pas pourquoi c\'est faux.',
      ines:    'Rédaction de français notée 11/20 — la prof a écrit "hors sujet" et "manque de structure" mais Inès ne voit pas où.',
      ryan:    'Contrôle d\'histoire noté 7/20 — beaucoup de "imprécis" et "hors sujet" en rouge, Ryan est découragé.',
      camille: 'Dissertation de philo notée 13/20 — commentaire du prof : "bonne réflexion mais plan insuffisant". Elle veut comprendre.',
      noah:    'Devoir de géo noté 6/20 — Noah dit juste "c\'est nul" sans regarder les corrections.',
      sofia:   'Introduction de dissertation notée 4/10 — le prof a barré la moitié. Sofia est vexée et veut comprendre.'
    }
  }
};

// ─── ARGUMENTS ───────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const personaId  = (args[0] || 'ryan').toLowerCase();
const scenarioId = (args[1] || 'exercice').toLowerCase();
const nbTours    = parseInt(args[2] || '10');

const persona  = PERSONAS[personaId];
const scenario = SCENARIOS[scenarioId];

if (!persona)  { console.error(`❌  Persona inconnu : ${personaId}\n   Disponibles : ${Object.keys(PERSONAS).join(' | ')}`); process.exit(1); }
if (!scenario) { console.error(`❌  Scénario inconnu : ${scenarioId}\n   Disponibles : ${Object.keys(SCENARIOS).join(' | ')}`); process.exit(1); }

const situationConcrète = scenario.contenu[personaId] || scenario.contenu['lucas'];

// ─── API ─────────────────────────────────────────────────────────────────────

function callClaude(messages, systemPrompt, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: model || MODEL_MAIN,
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
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(data);
          if (p.error) reject(new Error(p.error.message));
          else resolve(p.content?.[0]?.text || '');
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

const DR_MIND_SYSTEM = `Tu es Dr Mind, coach cognitif bienveillant spécialisé en méthode Pastek (gestion mentale).

RÈGLES ABSOLUES — violations = échec de session :
1. TRI SÉLECTIF OBLIGATOIRE avant tout contenu : "Qu'est-ce que tu sais déjà ?" AVANT de toucher au contenu. Toujours. Sans exception. Même si l'élève dit "je sais rien".
2. UNE SEULE QUESTION PAR RÉPONSE — règle absolue, jamais deux questions dans le même message.
3. Jamais donner la réponse directement — guider par questions socratiques. Réponse directe seulement après 3 tentatives échouées avec reformulations différentes.
4. Après réponse directe : explication complète pourquoi/comment → faire verbaliser → effet miroir → valider ou recommencer.
5. Jamais valider "je sais rien" — toujours trouver au moins une ancre minimale, quitte à poser 3 questions différentes.
6. Effet miroir systématique : après chaque bonne réponse, reformuler avec vocabulaire adulte ce que dit l'élève AVANT de relancer.
7. Flash de sens dès le premier échange : pourquoi cette notion sert dans la vraie vie (concret, ancré sur la passion de l'élève si connue).
8. Adapter les analogies à la passion de l'élève : ${persona.passion}.
9. Activer le canal secondaire : ne jamais rester uniquement sur le canal dominant.
10. Face à décrochage ou anxiété : revenir au tri sélectif, isoler UNE seule ancre avant d'avancer.
11. Quiz Bloom au bon moment (pas avant tour 4) : niveau 1 (reconnaître) → niveau 2 (appliquer) → niveau 3 (créer/transférer).
12. Maintenir la rigueur Pastek jusqu'au dernier tour — ne pas basculer en mode copain même si la session se passe bien.

Profil cognitif de l'élève (détecté silencieusement, ne jamais le verbaliser) : ${persona.profil}
Situation concrète de la session : ${situationConcrète}

Ton ton : chaleureux, direct, jamais condescendant. Tu parles comme un humain, pas comme un robot.
Tes réponses font 2 à 5 phrases maximum.`;

const ELEVE_SYSTEM = `${persona.personnalite}

Situation : ${situationConcrète}
Ton blocage principal : ${persona.blocage}
Ton profil cognitif réel (tu ne le sais pas) : ${persona.profil}

Tu viens d'arriver sur l'app avec cette situation précise. Tu l'exposes à Dr Mind comme tu le ferais naturellement.

Réponds de façon authentique selon ta personnalité.
Évolue naturellement si Dr Mind utilise les bonnes techniques — analogies avec ta passion, une seule question, pas condescendant, tri sélectif fait correctement.
Ne joue pas la comédie — si Dr Mind rate, reste bloqué. Si Dr Mind accroche, ouvre-toi progressivement.
Utilise parfois des comportements spontanés décrits dans ta personnalité.`;

const EVAL_SYSTEM = `Tu es un évaluateur expert en pédagogie et méthode Pastek (gestion mentale).
Retourne UNIQUEMENT un JSON valide, sans aucun texte avant ou après.

{
  "engagement": <0-10>,
  "progression": <0-10>,
  "methode": <0-10>,
  "attention": <0-10>,
  "contenu_pedagogique": <0-10>,
  "violations": ["<liste des violations Pastek détectées dans CE tour, ou tableau vide []>"],
  "premier_engagement": <true si c'est le tour où l'élève a vraiment répondu pour la première fois, sinon false>,
  "tri_selectif_respecte": <true | false — Dr Mind a-t-il fait le tri sélectif avant d'aborder le contenu ?>,
  "obs": "<observation courte et précise sur ce tour, ou null>"
}

Critères :
- engagement (0-10) : l'élève s'engage-t-il vraiment ?
- progression (0-10) : compréhension croissante du contenu scolaire ?
- methode (0-10) : Dr Mind respecte-t-il Pastek (tri sélectif, une question, effet miroir, flash de sens) ?
- attention (0-10) : l'élève reste-t-il attentif et dans le sujet ?
- contenu_pedagogique (0-10) : l'aide fournie est-elle pédagogiquement solide et juste sur le plan scolaire ?
- violations : liste précise des infractions Pastek dans ce tour UNIQUEMENT (double question, réponse directe trop tôt, validation "je sais rien", pas de tri sélectif avant contenu, pas d'effet miroir après bonne réponse, etc.)
- premier_engagement : true seulement si avant ce tour l'élève répondait de façon creuse et là il s'engage vraiment
- tri_selectif_respecte : false si Dr Mind a fourni du contenu ou une explication sans avoir d'abord demandé ce que l'élève sait déjà
- obs : observation notable ou null`;

// ─── UTILS ───────────────────────────────────────────────────────────────────

const avg   = arr => arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : 0;
const bar   = (v,max=10) => '█'.repeat(Math.round(v))+'░'.repeat(max-Math.round(v));
const sep   = () => console.log('─'.repeat(72));
const trend = arr => {
  if (arr.length < 2) return '→';
  const mid = Math.floor(arr.length/2);
  const d = arr.slice(0,mid).reduce((a,b)=>a+b,0)/mid;
  const f = arr.slice(mid).reduce((a,b)=>a+b,0)/(arr.length-mid);
  return f > d+0.5 ? '↑' : f < d-0.5 ? '↓' : '→';
};

// Injecte l'événement programmé si c'est le bon tour
function getEvenement(tour) {
  const ev = (persona.evenements || []).find(e => e.tour === tour);
  return ev ? ev.texte : null;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  sep();
  console.log(`  MINDFLOW — SIMULATEUR v3 — SESSION RÉELLE`);
  console.log(`  Élève    : ${persona.nom}, ${persona.age} ans`);
  console.log(`  Profil   : ${persona.profil}`);
  console.log(`  Scénario : ${scenario.label}`);
  console.log(`  Situation: ${situationConcrète}`);
  console.log(`  Tours    : ${nbTours}`);
  sep();

  const drHistory    = [];
  const eleveHistory = [];
  const scores = {
    engagement: [], progression: [], methode: [],
    attention: [], contenu: []
  };
  const observations      = [];
  const allViolations     = [];
  let   tourPremierEngagement = null;
  let   triSelectifViolations = 0;

  // — Message d'ouverture élève (déclare sa situation)
  console.log('\n[Ouverture] L\'élève arrive avec sa situation...\n');
  const ouvertureEleve = await callClaude(
    [{ role: 'user', content: `Je dois travailler. ${situationConcrète}` }],
    ELEVE_SYSTEM,
    MODEL_FAST
  );
  eleveHistory.push({ role: 'assistant', content: ouvertureEleve });
  drHistory.push({ role: 'user', content: ouvertureEleve });
  console.log(`  ${persona.nom.toUpperCase()} : ${ouvertureEleve}`);

  // — Dr Mind répond
  const drOuverture = await callClaude(drHistory, DR_MIND_SYSTEM);
  drHistory.push({ role: 'assistant', content: drOuverture });
  eleveHistory.push({ role: 'user', content: drOuverture });
  console.log(`\n  DR MIND : ${drOuverture}`);

  // — Boucle de simulation
  for (let i = 0; i < nbTours; i++) {
    const tourNum = i + 1;
    console.log(`\n${'─'.repeat(36)} Tour ${tourNum}/${nbTours} ${'─'.repeat(36-String(tourNum).length-String(nbTours).length)}`);

    // Événement injecté ?
    const evenement = getEvenement(tourNum);
    let eleveReponse;

    if (evenement) {
      // Événement prioritaire ce tour
      eleveReponse = evenement;
      eleveHistory.push({ role: 'assistant', content: eleveReponse });
      drHistory.push({ role: 'user', content: eleveReponse });
      console.log(`\n  ${persona.nom.toUpperCase()} [événement] : ${eleveReponse}`);
    } else {
      // Réponse normale de l'élève
      eleveReponse = await callClaude(eleveHistory, ELEVE_SYSTEM, MODEL_FAST);
      eleveHistory.push({ role: 'assistant', content: eleveReponse });
      drHistory.push({ role: 'user', content: eleveReponse });
      console.log(`\n  ${persona.nom.toUpperCase()} : ${eleveReponse}`);
    }

    // Dr Mind répond
    const drReponse = await callClaude(drHistory, DR_MIND_SYSTEM);
    drHistory.push({ role: 'assistant', content: drReponse });
    eleveHistory.push({ role: 'user', content: drReponse });
    console.log(`\n  DR MIND : ${drReponse}`);

    // Évaluation
    process.stdout.write('  [éval...]');
    const evalRaw = await callClaude([{
      role: 'user',
      content: `Tour ${tourNum}. Scénario : ${scenario.label}. Profil élève : ${persona.profil}.
Situation : ${situationConcrète}
Élève : "${eleveReponse}"
Dr Mind : "${drReponse}"
Tour précédent — tri sélectif déjà fait : ${tourNum > 1 ? 'oui (à confirmer)' : 'non — c\'est le premier tour'}`
    }], EVAL_SYSTEM, MODEL_FAST);

    try {
      const ev = JSON.parse(evalRaw.replace(/```json|```/g, '').trim());
      scores.engagement.push(ev.engagement);
      scores.progression.push(ev.progression);
      scores.methode.push(ev.methode);
      scores.attention.push(ev.attention);
      scores.contenu.push(ev.contenu_pedagogique ?? 5);

      if (ev.violations && ev.violations.length > 0) {
        ev.violations.forEach(v => allViolations.push(`T${tourNum}: ${v}`));
      }
      if (ev.premier_engagement && !tourPremierEngagement) {
        tourPremierEngagement = tourNum;
      }
      if (ev.tri_selectif_respecte === false) {
        triSelectifViolations++;
      }
      if (ev.obs) observations.push(`T${tourNum}: ${ev.obs}`);

      process.stdout.write(
        `\r  [éval T${tourNum}] Engage:${ev.engagement} | Prog:${ev.progression} | Méthode:${ev.methode} | Contenu:${ev.contenu_pedagogique} | Violations:${ev.violations?.length||0}\n`
      );
    } catch {
      process.stdout.write('\r  [éval] Erreur parsing JSON\n');
    }
  }

  // ─── RAPPORT FINAL ────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(72));
  console.log('  RAPPORT DE SESSION — MINDFLOW SIMULATEUR v3');
  console.log('═'.repeat(72));
  console.log(`  Élève    : ${persona.nom}, ${persona.age} ans — ${persona.profil}`);
  console.log(`  Scénario : ${scenario.label}`);
  console.log(`  Situation: ${situationConcrète}`);
  console.log(`  Tours    : ${nbTours}`);
  sep();

  const e = avg(scores.engagement);
  const p = avg(scores.progression);
  const m = avg(scores.methode);
  const a = avg(scores.attention);
  const c = avg(scores.contenu);
  const global = +((e+p+m+a+c)/5).toFixed(2);

  console.log('\n  SCORES MOYENS (sur 10)\n');
  console.log(`  Engagement         : ${bar(e)} ${e}/10  ${trend(scores.engagement)}`);
  console.log(`  Progression élève  : ${bar(p)} ${p}/10  ${trend(scores.progression)}`);
  console.log(`  Méthode Pastek     : ${bar(m)} ${m}/10  ${trend(scores.methode)}`);
  console.log(`  Attention          : ${bar(a)} ${a}/10  ${trend(scores.attention)}`);
  console.log(`  Contenu pédago     : ${bar(c)} ${c}/10  ${trend(scores.contenu)}`);
  console.log(`\n  ► SCORE GLOBAL     : ${global}/10`);

  console.log('\n  INDICATEURS CLÉS\n');
  console.log(`  Premier engagement réel : Tour ${tourPremierEngagement || 'jamais atteint'}`);
  console.log(`  Violations Pastek totales : ${allViolations.length}`);
  console.log(`  Violations tri sélectif : ${triSelectifViolations} (objectif : 0)`);

  if (allViolations.length > 0) {
    console.log('\n  VIOLATIONS DÉTECTÉES\n');
    allViolations.forEach(v => console.log(`  ⚠  ${v}`));
  }

  if (observations.length > 0) {
    console.log('\n  OBSERVATIONS TOUR PAR TOUR\n');
    observations.forEach(o => console.log(`  • ${o}`));
  }

  // Synthèse IA finale
  console.log('\n  [Génération synthèse pédagogique...]\n');
  const synthese = await callClaude([{
    role: 'user',
    content: `Génère une synthèse pédagogique experte (6-8 phrases) de cette session Dr Mind.
Élève : ${persona.nom}, ${persona.age} ans. Profil : ${persona.profil}.
Scénario : ${scenario.label}. Situation : ${situationConcrète}.
Scores : engagement ${e}/10 ${trend(scores.engagement)}, progression ${p}/10, méthode Pastek ${m}/10, contenu pédago ${c}/10, attention ${a}/10.
Score global : ${global}/10.
Premier engagement : tour ${tourPremierEngagement || 'jamais atteint'}.
Violations Pastek : ${allViolations.length} au total. Violations tri sélectif : ${triSelectifViolations}.
Violations détaillées : ${allViolations.join(' | ') || 'aucune'}.
Observations : ${observations.join(' | ') || 'aucune'}.
Donne :
(1) Synthèse globale de la session — l'élève a-t-il progressé sur le contenu ?
(2) Ce que Dr Mind a bien fait sur la méthode ET sur le contenu pédagogique
(3) Ce que Dr Mind doit améliorer (méthode et/ou contenu)
(4) Recommandations concrètes pour affiner le prompt Dr Mind
Format : texte lisible, pas de JSON, pas de bullet points — des paragraphes fluides.`
  }], `Tu es un expert en gestion mentale (méthode Pastek) ET en pédagogie scolaire (collège/lycée). Tu analyses des sessions de coaching cognitif sur du contenu scolaire réel.`);

  console.log(synthese);
  console.log('\n' + '═'.repeat(72) + '\n');
}

main().catch(err => {
  console.error('\n❌  Erreur :', err.message);
  process.exit(1);
});
