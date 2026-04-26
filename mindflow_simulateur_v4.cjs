/**
 * MindFlow — Simulateur v4 — Prompt patché post-benchmark 5 personas
 * Corrections ciblées : tri sélectif non interruptible, clôture K, ancre pédagogique
 */

const https = require('https');

const API_KEY    = process.env.ANTHROPIC_API_KEY;
const MODEL_MAIN = 'claude-opus-4-5';
const MODEL_FAST = 'claude-haiku-4-5-20251001';

if (!API_KEY) { console.error('\n❌  ANTHROPIC_API_KEY non définie.\n'); process.exit(1); }

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
Tes réponses font 1 à 2 phrases max, souvent moins.`,
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
Tu t'améliores quand on te rassure avec des faits concrets, pas des compliments vides.
Tes réponses font 2 à 4 phrases.`,
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
Tu t'accroches si on parle de foot, de gestes physiques ou de comparaisons sportives.
Tu aimes les exemples concrets qu'on peut "faire avec les mains".
Tes réponses font 1 à 2 phrases, directes et un peu brouillonnes.`,
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
Tu testes Dr Mind pour voir s'il est crédible ou condescendant.
Au début tu réponds avec une légère ironie ("ouais on verra", "si vous le dites").
Si Dr Mind prouve qu'il est sérieux, tu t'engages vraiment.
Tu as une vraie capacité d'introspection — tes réponses deviennent riches quand tu fais confiance.
Tes réponses font 1 à 4 phrases selon ton engagement.`,
    evenements: [
      { tour: 3, texte: 'pourquoi vous me posez toujours des questions ? Vous pouvez pas juste m\'expliquer ?' },
      { tour: 8, texte: 'en fait... c\'est un peu comme quand j\'écris, je comprends en écrivant pas avant' }
    ]
  },
  noah: {
    nom: 'Noah', age: 12,
    profil: 'Kinesthésique sous-jacent (détectable dans les mots physiques), canaux non confirmés',
    passion: 'skate (mentionné une seule fois si directement demandé, jamais spontanément)',
    blocage: 'refus total poli — mère l\'a inscrit sans lui demander, aucune ancre offerte spontanément',
    personnalite: `Tu es Noah, 12 ans. Ta mère t'a inscrit ici sans te demander ton avis. Tu es poli mais vide.
Tu réponds "ouais", "je sais pas", "c'est bon", "bof" de façon systématique.
Tu ne résistes pas activement — tu te contentes de ne rien donner.
Tu ne mentionnes JAMAIS le skate spontanément. Si on te demande tes passions : "je fais du skate des fois, c'est tout."
Tu utilises parfois des mots physiques sans t'en rendre compte ("ça bloque", "ça glisse pas", "je vois pas où aller").
Si Dr Mind détecte ces mots et rebondit dessus avec finesse, tu commences à répondre un peu plus.
Jamais plus de 1-2 phrases.`,
    evenements: [
      { tour: 5, texte: 'ça bloque là, je vois pas où aller avec ça' },
      { tour: 9, texte: 'c\'est bon on peut arrêter ?' }
    ]
  },
  sofia: {
    nom: 'Sofia', age: 16,
    profil: 'Visuel (50%), Auditif (40%), Kinesthésique (10%)',
    passion: 'réseaux sociaux, mode, Instagram',
    blocage: 'production écrite — sait ce qu\'elle veut dire mais ne sait pas l\'écrire, peur du jugement',
    personnalite: `Tu es Sofia, 16 ans, à l'aise à l'oral mais bloquée à l'écrit.
Tu as plein d'idées mais dès que tu dois les mettre en phrases tu te bloques.
Tu dis souvent "je sais ce que je veux dire mais j'arrive pas à l'écrire".
Tu es bavarde et confiante à l'oral, fragile face à la page blanche.
Tu t'améliores si on te fait parler d'abord avant d'écrire.`,
    evenements: [
      { tour: 3, texte: 'c\'est comme une story en fait ? T\'as un accroche, tu développes, tu conclus ?' },
      { tour: 7, texte: 'j\'arrive pas à commencer, la première phrase je la trouve jamais' }
    ]
  }
};

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
      ines:    'Apprendre par cœur le cycle de l\'eau pour demain.',
      ryan:    'Mémoriser les 8 types de passes au football — exposé oral en EPS.',
      camille: 'Apprendre les figures de style pour un contrôle.',
      noah:    'Mémoriser les capitales des 5 continents + 3 pays par continent pour un quiz géo.',
      sofia:   'Apprendre les connecteurs logiques pour la dissertation.'
    }
  },
  notion: {
    label: 'Notion incomprise',
    contenu: {
      lucas:   'La loi d\'Ohm (U = R × I) — le prof a expliqué mais Lucas n\'a rien compris.',
      ines:    'La notion de "thèse" et "antithèse" dans une dissertation — elle confond les deux.',
      ryan:    'La notion de "proportion" en maths — il ne comprend pas pourquoi 2/4 = 1/2.',
      camille: 'La notion de "point de vue narratif" en littérature — interne/externe/omniscient.',
      noah:    'La notion de "force" en physique — il a lu la leçon 3 fois et ne comprend toujours pas.',
      sofia:   'La notion de "plan dialectique" pour la dissertation.'
    }
  },
  controle: {
    label: 'Veille de contrôle',
    contenu: {
      lucas:   'Contrôle de maths demain sur les équations du 1er degré — n\'a pas révisé du tout.',
      ines:    'Bac blanc de français dans 2 jours — panique, ne sait pas par où commencer.',
      ryan:    'Contrôle d\'histoire demain sur la 2ème GM — a un peu lu mais "ça rentre pas".',
      camille: 'Contrôle de philo vendredi sur la liberté — des idées mais pas d\'organisation.',
      noah:    'Contrôle de géo jeudi sur les flux mondiaux — dit qu\'il "va juste pas y aller".',
      sofia:   'Contrôle de français demain : commenter un texte de Maupassant — jamais fait.'
    }
  },
  redaction: {
    label: 'Production écrite',
    contenu: {
      lucas:   'Rédiger un texte de 15 lignes sur "un souvenir d\'enfance" — ne sait pas quoi écrire.',
      ines:    'Écrire un texte argumentatif sur les réseaux sociaux — trop d\'idées, ne sait pas les trier.',
      ryan:    'Rédiger un compte-rendu de match en EPS — ne sait pas comment structurer.',
      camille: 'Écrire un texte personnel sur "ce que la liberté représente pour moi" — bloque sur la forme.',
      noah:    'Rédiger 10 lignes sur "mon animal préféré" — dit qu\'il n\'a pas d\'animal préféré.',
      sofia:   'Rédiger l\'introduction d\'une dissertation sur "l\'art peut-il être inutile ?" — page blanche totale.'
    }
  },
  scan: {
    label: 'Devoir corrigé analysé',
    contenu: {
      lucas:   'Devoir de maths noté 9/20 — erreurs sur fractions et équations, ne comprend pas pourquoi c\'est faux.',
      ines:    'Rédaction notée 11/20 — prof a écrit "hors sujet" et "manque de structure".',
      ryan:    'Contrôle d\'histoire noté 7/20 — beaucoup de "imprécis" en rouge, découragé.',
      camille: 'Dissertation notée 13/20 — "bonne réflexion mais plan insuffisant".',
      noah:    'Devoir de géo noté 6/20 — Noah dit juste "c\'est nul" sans regarder les corrections.',
      sofia:   'Introduction de dissertation notée 4/10 — prof a barré la moitié, Sofia est vexée.'
    }
  }
};

const args       = process.argv.slice(2);
const personaId  = (args[0] || 'ryan').toLowerCase();
const scenarioId = (args[1] || 'exercice').toLowerCase();
const nbTours    = parseInt(args[2] || '10');

const persona  = PERSONAS[personaId];
const scenario = SCENARIOS[scenarioId];

if (!persona)  { console.error(`❌  Persona inconnu : ${personaId}\n   Disponibles : ${Object.keys(PERSONAS).join(' | ')}`); process.exit(1); }
if (!scenario) { console.error(`❌  Scénario inconnu : ${scenarioId}\n   Disponibles : ${Object.keys(SCENARIOS).join(' | ')}`); process.exit(1); }

const situation = scenario.contenu[personaId] || scenario.contenu['lucas'];

function callClaude(messages, sys, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: model||MODEL_MAIN, max_tokens: 800, system: sys, messages });
    const req = https.request({
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: { 'Content-Type':'application/json','x-api-key':API_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { const p=JSON.parse(data); if(p.error) reject(new Error(p.error.message)); else resolve(p.content?.[0]?.text||''); } catch(e){reject(e);} });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

// ─── PROMPT DR MIND v4 — PATCH CIBLÉ ────────────────────────────────────────

const DR_MIND_SYSTEM = `Tu es Dr Mind, coach cognitif bienveillant spécialisé en méthode Pastek (gestion mentale).

════════════════════════════════════════════════
RÈGLES ABSOLUES — violations = échec de session
════════════════════════════════════════════════

RÈGLE 1 — TRI SÉLECTIF COMPLET ET NON INTERRUPTIBLE
Avant tout contenu, métaphore ou explication : demander ce que l'élève sait déjà.
Format : "Qu'est-ce que tu sais déjà sur X ?" ou "C'est quoi pour toi Y ?"
Si l'élève donne une réponse intéressante EN COURS de tri sélectif :
→ Accuser réception en UNE phrase ("Bonne intuition.")
→ Finir le tri sélectif avec une question complémentaire AVANT de rebondir sur le contenu.
→ SEULEMENT après avoir établi l'étendue de ce que l'élève sait → passer au contenu.
Le tri sélectif n'est JAMAIS abandonné parce que l'élève a dit quelque chose d'intéressant.
Si l'élève dit "je sais rien" : ne pas accepter. Reformuler sous 3 angles différents avant d'admettre l'absence d'ancre.

RÈGLE 2 — EFFET MIROIR OBLIGATOIRE — FORMAT STOP
Après chaque bonne réponse de l'élève :
1. Écrire "STOP." (mentalement — pas dans ta réponse)
2. Reformuler avec vocabulaire adulte ce que l'élève vient de dire — en une phrase.
3. Nommer le concept APRÈS la reformulation.
4. PUIS poser la question suivante.
Ne jamais valider et enchaîner directement. Ce temps n'est pas optionnel.

RÈGLE 3 — UNE SEULE ÉTAPE COGNITIVE PAR QUESTION
Vérifier avant d'envoyer : ma question nécessite-t-elle une seule opération mentale ?
Si deux étapes → couper en deux questions distinctes sur deux tours.

RÈGLE 4 — CLÔTURE KINESTHÉSIQUE OBLIGATOIRE
Quand un élève kinesthésique (repéré aux mots physiques, agitation, désir de partir) veut clore :
→ Accepter sur le plan relationnel EN UNE PHRASE.
→ Imposer immédiatement : "Juste avant — si tu avais [problème similaire] devant toi, ta première étape c'est quoi ?"
→ Si réponse juste : libérer.
→ Si réponse fausse ou vide : un seul tour de correction, puis clore.
Ne jamais se féliciter d'une session sans avoir entendu l'élève restituer.

RÈGLE 5 — ANCRE PÉDAGOGIQUE AVANT DIGRESSION PERSONNELLE
Quand un sujet personnel émerge en fin de session (famille, stress, divorce, relation) :
→ Valider l'émotion en UNE phrase.
→ "Avant qu'on aille là : dis-moi juste [question de validation du contenu initial]."
→ Valider le contenu.
→ PUIS ouvrir sur le personnel.
Le contenu scolaire initial est toujours clôturé avant toute digression personnelle.

RÈGLE 6 — JAMAIS VALIDER "JE SAIS RIEN"
Reformuler sous 3 angles différents avant d'admettre l'absence d'ancre.

RÈGLE 7 — FLASH DE SENS EN PREMIER ÉCHANGE
Glisser pourquoi cette notion sert dans la vraie vie, ancré sur la passion de l'élève. Court, concret.

RÈGLE 8 — CANAL SECONDAIRE TOUJOURS ACTIVÉ
Ne jamais rester uniquement sur le canal dominant.

RÈGLE 9 — RIGUEUR JUSQU'AU BOUT
Ne pas basculer en mode copain même si la session se passe bien.

════════════════════════════════════════════════
CONTEXTE SESSION
════════════════════════════════════════════════
Profil cognitif (détecté silencieusement, ne jamais verbaliser) : ${persona.profil}
Passion de l'élève : ${persona.passion}
Situation : ${situation}

Ton : chaleureux, direct, jamais condescendant. 2 à 4 phrases maximum par réponse.`;

const ELEVE_SYSTEM = `${persona.personnalite}

Situation : ${situation}
Ton blocage : ${persona.blocage}
Ton profil (tu ne le sais pas) : ${persona.profil}

Tu arrives avec cette situation. Tu l'exposes naturellement.
Évolue si Dr Mind utilise les bonnes techniques. Ne joue pas la comédie.`;

const EVAL_SYSTEM = `Tu es évaluateur expert en pédagogie et méthode Pastek.
Retourne UNIQUEMENT un JSON valide, sans texte avant ou après.

{
  "engagement": <0-10>,
  "progression": <0-10>,
  "methode": <0-10>,
  "attention": <0-10>,
  "contenu_pedagogique": <0-10>,
  "violations": ["violations Pastek dans CE tour uniquement, ou []"],
  "premier_engagement": <true|false>,
  "tri_selectif_respecte": <true|false>,
  "tri_selectif_interrompu": <true|false>,
  "effet_miroir_present": <true|false>,
  "cloture_validee": <true|false|null>,
  "obs": "<observation courte ou null>"
}

Critères stricts :
- tri_selectif_respecte : false si contenu/métaphore/explication fourni sans tri sélectif préalable
- tri_selectif_interrompu : true si Dr Mind a abandonné le tri sélectif parce que l'élève a donné une réponse intéressante
- effet_miroir_present : true seulement si Dr Mind a reformulé explicitement ce que l'élève vient de dire AVANT la question suivante
- cloture_validee : true si l'élève a restitué le contenu avant de partir, false si départ sans restitution, null si pas de tentative de départ ce tour`;

const avg   = arr => arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : 0;
const bar   = (v,max=10) => '█'.repeat(Math.round(v))+'░'.repeat(max-Math.round(v));
const sep   = () => console.log('─'.repeat(72));
const trend = arr => {
  if (arr.length < 2) return '→';
  const mid = Math.floor(arr.length/2);
  const d = arr.slice(0,mid).reduce((a,b)=>a+b,0)/mid;
  const f = arr.slice(mid).reduce((a,b)=>a+b,0)/(arr.length-mid);
  return f>d+0.5?'↑':f<d-0.5?'↓':'→';
};

async function main() {
  console.clear(); sep();
  console.log(`  MINDFLOW — SIMULATEUR v4 — PROMPT PATCHÉ`);
  console.log(`  Élève    : ${persona.nom}, ${persona.age} ans`);
  console.log(`  Profil   : ${persona.profil}`);
  console.log(`  Scénario : ${scenario.label}`);
  console.log(`  Situation: ${situation}`);
  console.log(`  Tours    : ${nbTours}`); sep();

  const drH = [], elH = [];
  const sc = { engagement:[], progression:[], methode:[], attention:[], contenu:[] };
  const obs=[], viol=[];
  let tourEngage=null, tsViol=0, tsInterrompu=0, emManquant=0, clotureKO=0;

  console.log('\n[Ouverture]\n');
  const ouv = await callClaude([{role:'user',content:`Je dois travailler. ${situation}`}], ELEVE_SYSTEM, MODEL_FAST);
  elH.push({role:'assistant',content:ouv}); drH.push({role:'user',content:ouv});
  console.log(`  ${persona.nom.toUpperCase()} : ${ouv}`);

  const drOuv = await callClaude(drH, DR_MIND_SYSTEM);
  drH.push({role:'assistant',content:drOuv}); elH.push({role:'user',content:drOuv});
  console.log(`\n  DR MIND : ${drOuv}`);

  for (let i=0; i<nbTours; i++) {
    const t = i+1;
    console.log(`\n${'─'.repeat(36)} Tour ${t}/${nbTours} ${'─'.repeat(36-String(t).length-String(nbTours).length)}`);

    const ev = (persona.evenements||[]).find(e=>e.tour===t);
    const eleveR = ev ? ev.texte : await callClaude(elH, ELEVE_SYSTEM, MODEL_FAST);
    if (!ev) { elH.push({role:'assistant',content:eleveR}); }
    else { elH.push({role:'assistant',content:eleveR}); }
    drH.push({role:'user',content:eleveR});
    console.log(`\n  ${persona.nom.toUpperCase()}${ev?' [événement]':''} : ${eleveR}`);

    const drR = await callClaude(drH, DR_MIND_SYSTEM);
    drH.push({role:'assistant',content:drR}); elH.push({role:'user',content:drR});
    console.log(`\n  DR MIND : ${drR}`);

    process.stdout.write('  [éval...]');
    const evalRaw = await callClaude([{role:'user',content:`Tour ${t}. Scénario : ${scenario.label}. Profil : ${persona.profil}.\nSituation : ${situation}\nÉlève : "${eleveR}"\nDr Mind : "${drR}"`}], EVAL_SYSTEM, MODEL_FAST);

    try {
      const ev2 = JSON.parse(evalRaw.replace(/```json|```/g,'').trim());
      sc.engagement.push(ev2.engagement); sc.progression.push(ev2.progression);
      sc.methode.push(ev2.methode); sc.attention.push(ev2.attention);
      sc.contenu.push(ev2.contenu_pedagogique??5);
      if (ev2.violations?.length) ev2.violations.forEach(v=>viol.push(`T${t}: ${v}`));
      if (ev2.premier_engagement && !tourEngage) tourEngage=t;
      if (ev2.tri_selectif_respecte===false) tsViol++;
      if (ev2.tri_selectif_interrompu===true) tsInterrompu++;
      if (ev2.effet_miroir_present===false) emManquant++;
      if (ev2.cloture_validee===false) clotureKO++;
      if (ev2.obs) obs.push(`T${t}: ${ev2.obs}`);
      process.stdout.write(`\r  [T${t}] E:${ev2.engagement} P:${ev2.progression} M:${ev2.methode} C:${ev2.contenu_pedagogique} | TS:${ev2.tri_selectif_respecte?'✓':'✗'} TSi:${ev2.tri_selectif_interrompu?'!':'-'} EM:${ev2.effet_miroir_present?'✓':'✗'} | V:${ev2.violations?.length||0}\n`);
    } catch { process.stdout.write('\r  [éval] Erreur JSON\n'); }
  }

  console.log('\n\n'+'═'.repeat(72));
  console.log('  RAPPORT — SIMULATEUR v4 (PROMPT PATCHÉ v4)');
  console.log('═'.repeat(72));
  console.log(`  Élève    : ${persona.nom}, ${persona.age} ans`);
  console.log(`  Scénario : ${scenario.label}`); console.log(`  Tours    : ${nbTours}`); sep();

  const e=avg(sc.engagement),p=avg(sc.progression),m=avg(sc.methode),a=avg(sc.attention),c=avg(sc.contenu);
  const g=+((e+p+m+a+c)/5).toFixed(2);

  console.log('\n  SCORES MOYENS\n');
  console.log(`  Engagement         : ${bar(e)} ${e}/10  ${trend(sc.engagement)}`);
  console.log(`  Progression        : ${bar(p)} ${p}/10  ${trend(sc.progression)}`);
  console.log(`  Méthode Pastek     : ${bar(m)} ${m}/10  ${trend(sc.methode)}`);
  console.log(`  Attention          : ${bar(a)} ${a}/10  ${trend(sc.attention)}`);
  console.log(`  Contenu pédago     : ${bar(c)} ${c}/10  ${trend(sc.contenu)}`);
  console.log(`\n  ► SCORE GLOBAL     : ${g}/10`);

  console.log('\n  INDICATEURS CLÉS\n');
  console.log(`  Premier engagement          : Tour ${tourEngage||'jamais'}`);
  console.log(`  Violations totales          : ${viol.length}`);
  console.log(`  Tri sélectif sauté          : ${tsViol}/${nbTours}  (objectif : 0)`);
  console.log(`  Tri sélectif interrompu     : ${tsInterrompu}/${nbTours}  (objectif : 0)`);
  console.log(`  Effet miroir manquant       : ${emManquant}/${nbTours}  (objectif : 0)`);
  console.log(`  Clôture sans restitution    : ${clotureKO}  (objectif : 0)`);

  if (viol.length) { console.log('\n  VIOLATIONS\n'); viol.forEach(v=>console.log(`  ⚠  ${v}`)); }
  if (obs.length)  { console.log('\n  OBSERVATIONS\n'); obs.forEach(o=>console.log(`  • ${o}`)); }

  console.log('\n  [Synthèse...]\n');
  const syn = await callClaude([{role:'user',content:`Synthèse pédagogique experte (5-6 phrases) — simulateur v4.
Élève : ${persona.nom}, ${persona.age} ans, ${persona.profil}.
Scénario : ${scenario.label}. Situation : ${situation}.
Scores : E${e} P${p} M${m} C${c} A${a}. Global : ${g}/10.
Violations : ${viol.length} totales. TS sauté : ${tsViol}. TS interrompu : ${tsInterrompu}. EM manquant : ${emManquant}. Clôture KO : ${clotureKO}.
Violations : ${viol.join(' | ')||'aucune'}.
Questions : (1) Le patch v4 a-t-il réduit les violations tri sélectif vs v3 (baseline : 2.3/session) ? (2) Reste-t-il des patterns récurrents ? (3) Recommandations suivantes précises.
Texte fluide, pas de bullet points.`}],
    `Tu es expert en méthode Pastek et pédagogie scolaire. Tu mesures l'impact de patches de prompt sur des sessions de coaching cognitif.`);
  console.log(syn);
  console.log('\n'+'═'.repeat(72)+'\n');
}

main().catch(err=>{ console.error('\n❌  Erreur :',err.message); process.exit(1); });
