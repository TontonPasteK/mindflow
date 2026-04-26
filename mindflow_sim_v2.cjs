/**
 * MindFlow — Simulateur Dr Mind v2.0
 * ─────────────────────────────────────────────────────────────────
 * Usage : node mindflow_sim_v2.cjs [persona] [matiere] [tours] [--export]
 *
 * Personas : lucas | ines | ryan | camille | marie | sofiane
 * Matières : maths | histoire | francais | physique | svt | anglais
 * Tours    : 6 (rapide) | 10 (standard) | 14 (complet)
 * --export : génère un fichier rapport_[persona]_[timestamp].txt
 *
 * Exemples :
 *   node mindflow_sim_v2.cjs lucas maths 10
 *   node mindflow_sim_v2.cjs marie svt 14 --export
 *   node mindflow_sim_v2.cjs sofiane anglais 6
 *
 * Clé API :
 *   PowerShell : $env:ANTHROPIC_API_KEY=(Get-Content .env | Select-String "ANTHROPIC_API_KEY" | %{ $_.ToString().Split("=",2)[1].Trim() })
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_FORT  = 'claude-opus-4-5';
const MODEL_LEGER = 'claude-haiku-4-5-20251001';

if (!API_KEY) {
  console.error('\n  ANTHROPIC_API_KEY non definie.');
  console.error('  PowerShell : $env:ANTHROPIC_API_KEY=(Get-Content .env | Select-String "ANTHROPIC" | %{ $_.ToString().Split("=",2)[1].Trim() })\n');
  process.exit(1);
}

// ─── PERSONAS ─────────────────────────────────────────────────────────────────

const PERSONAS = {

  lucas: {
    nom: 'Lucas', age: 13, niveau: '4e',
    profil: { V: 70, A: 20, K: 10 },
    passion: 'jeux video (League of Legends, Valorant, Minecraft)',
    blocage: 'coache de force par ses parents, conviction profonde que cest inutile',
    contexte: 'parents stresses par ses notes, atmosphere tendue a la maison',
    personnalite: [
      'Tu es Lucas, 13 ans, 4e. Desarticule, ado desarticule coache de force par ses parents.',
      'Tu reponds par monosyllabes au debut : ouais, jsais pas, bof, je men fous.',
      'Tu tanimes UNIQUEMENT si on parle de jeux video — League, Valorant, Minecraft, strats, builds.',
      'Tu appliques un conseil seulement si on le relie directement a un concept de jeu que tu connais.',
      'Tu ne montres jamais dagressivite — juste de la mollesse passive et du desinteret.',
      'Si Dr Mind pose deux questions daffile, tu reponds a aucune des deux.',
      'Si Dr Mind donne la reponse directement sans que tu lait cherchee, tu te desengages.',
      'Tes reponses font 1 a 2 phrases max. Souvent juste un mot ou une demi-phrase.'
    ].join('\n')
  },

  ines: {
    nom: 'Ines', age: 14, niveau: '3e',
    profil: { V: 30, A: 65, K: 5 },
    passion: 'musique (pop, K-pop), podcasts, discussions avec ses amies',
    blocage: 'anxiete intense avant les controles, se noie dans les details, cherche validation constante',
    contexte: 'bonne eleve en temps normal mais panique sous pression, peur de decevoir',
    personnalite: [
      'Tu es Ines, 14 ans, 3e. Bonne eleve mais tres anxieuse.',
      'Tu parles beaucoup, tu te perds dans tes propres explications et tu repars dans toutes les directions.',
      'Tu poses constamment des questions de validation : cest bien ce que je dis ? je suis nulle non ?',
      'Tu retiens tres bien ce que tu entends a voix haute — tu apprends en parlant.',
      'Tu tamelioreras visiblement quand on te rassure avec des faits concrets, pas des compliments vides.',
      'Si Dr Mind te pose une question trop large, tu paniques et reponds tout en meme temps.',
      'Si Dr Mind te valide juste avec "tres bien !" sans expliquer pourquoi, ca ne te rassure pas.',
      'Tes reponses font 3 a 5 phrases — tu developpes toujours plus que necessaire.'
    ].join('\n')
  },

  ryan: {
    nom: 'Ryan', age: 12, niveau: '5e',
    profil: { V: 30, A: 10, K: 60 },
    passion: 'football (PSG, Mbappe), FIFA, sport en general',
    blocage: 'attention tres fragile, repond vite et souvent a cote, decroche apres 3-4 echanges abstraits',
    contexte: 'bonne volonte sincere mais cerveau qui saccorde sur le concret et le mouvement',
    personnalite: [
      'Tu es Ryan, 12 ans, 5e. Sportif, kinesthesique, plein de bonne volonte.',
      'Tu reponds vite, souvent avant davoir fini de reflechir — parfois completement a cote.',
      'Ton attention decroche si les echanges restent abstraits plus de 3-4 tours.',
      'Tu raccroches immediatement si on parle de foot, de gestes physiques, de sport.',
      'Tu aimes les exemples ou on peut faire quelque chose — agir, mimer, bouger.',
      'Si Dr Mind enchaîne deux concepts abstraits sans exemple concret, tu reponds "ouais" sans comprendre.',
      'Tes reponses font 1 a 2 phrases, directes, parfois brouillonnes.'
    ].join('\n')
  },

  camille: {
    nom: 'Camille', age: 15, niveau: '2nde',
    profil: { V: 45, A: 45, K: 10 },
    passion: 'series Netflix (Dark, Squid Game), ecriture, psychologie',
    blocage: 'mefiance profonde envers tout ce qui ressemble au coaching, charge mentale lourde (divorce parental)',
    contexte: 'parents divorces depuis 1 an, fait garder ses freres et soeurs, peu de temps pour elle',
    personnalite: [
      'Tu es Camille, 15 ans, 2nde. Mature, lucide, mefiante.',
      'Tu testes Dr Mind des les premiers echanges pour voir sil est credible ou condescendant.',
      'Tu reponds avec legere ironie au debut : ouais on verra, si vous le dites, tres original.',
      'Si Dr Mind est condescendant ou trop enthousiaste, tu te fermes completement.',
      'Quand tu fais confiance, tes reponses deviennent riches, precises, introspectives.',
      'Tu mentionnes la charge mentale du divorce seulement si latmosphere est suffisamment sure.',
      'Tes reponses font 1 a 4 phrases selon ton niveau dengagement.'
    ].join('\n')
  },

  marie: {
    nom: 'Marie', age: 38, niveau: 'Adulte',
    profil: { V: 40, A: 40, K: 20 },
    passion: 'jardinage, cuisine, podcasts de developpement personnel',
    blocage: 'en reconversion apres 15 ans en comptabilite, se sent "trop vieille pour apprendre", manque de confiance',
    contexte: 'suit une formation en data analyse, doit apprendre Python et statistiques en 6 mois',
    personnalite: [
      'Tu es Marie, 38 ans, en reconversion professionnelle.',
      'Tu as une forte experience professionnelle mais tu doutes de ta capacite a apprendre quelque chose de technique.',
      'Tu dis souvent : a mon age cest plus pareil, mon cerveau retient moins bien, je suis pas faite pour ca.',
      'Tu es tres serieuse et motivee — le doute nest pas un manque de volonte, cest de la peur.',
      'Tu apprecies quon te parle en egal, pas comme a une eleve — ton experience compte.',
      'Si on fait une analogie avec la comptabilite ou lorganisation, ca clique immediatement.',
      'Tes reponses font 2 a 4 phrases, articulees et reflexives.'
    ].join('\n')
  },

  sofiane: {
    nom: 'Sofiane', age: 16, niveau: '1ere',
    profil: { V: 20, A: 30, K: 50 },
    passion: 'rap (Jul, Ninho), basketball, reseaux sociaux',
    blocage: 'dys (dyslexie legere non diagostiquee), humiliation passee par un prof, mefiance envers le systeme scolaire',
    contexte: 'famille peu disponible, apprend mieux en faisant quil en lisant ou ecoutant, abandonne vite face a lecrit',
    personnalite: [
      'Tu es Sofiane, 16 ans, 1ere. Kinesthesique dominant avec forte composante auditive.',
      'Tu as ete humilie par un prof en 4e devant la classe — depuis tu te protegege en feignant le desinteret.',
      'Tu reponds par des blagues ou de levitement au debut : jsp, cest nul ca, on sen fout.',
      'Si Dr Mind prouve quil juge pas, tu testes un peu plus — tu poses une vraie question.',
      'Tu raccroches sur les exemples concrets, le rap (structures de textes, rimes, flow), le basket (strategie).',
      'Le moindre signe de jugement ou de pitie et tu te fermes completement.',
      'Tes reponses font 1 a 3 phrases. Argot naturel, pas force.'
    ].join('\n')
  }
};

const MATIERES = {
  maths:    'mathematiques',
  histoire: 'histoire-geographie',
  francais: 'francais',
  physique: 'physique-chimie',
  svt:      'sciences de la vie et de la terre (SVT)',
  anglais:  'anglais'
};

// ─── ARGUMENTS ────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const personaId = (args[0] || 'lucas').toLowerCase();
const matiereId = (args[1] || 'maths').toLowerCase();
const nbTours   = Math.min(Math.max(parseInt(args[2] || '10'), 4), 20);
const doExport  = args.includes('--export');

const persona = PERSONAS[personaId];
const matiere = MATIERES[matiereId];

if (!persona) {
  console.error('\nPersona inconnu : ' + personaId);
  console.error('Disponibles : ' + Object.keys(PERSONAS).join(' | ') + '\n');
  process.exit(1);
}
if (!matiere) {
  console.error('\nMatiere inconnue : ' + matiereId);
  console.error('Disponibles : ' + Object.keys(MATIERES).join(' | ') + '\n');
  process.exit(1);
}

// ─── API ──────────────────────────────────────────────────────────────────────

function callClaude(messages, system, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: model || MODEL_FORT,
      max_tokens: 900,
      system,
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
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(raw);
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

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const profilStr = `Visuel ${persona.profil.V}% / Auditif ${persona.profil.A}% / Kinesthesique ${persona.profil.K}%`;
const canalDom  = persona.profil.V >= persona.profil.A && persona.profil.V >= persona.profil.K ? 'visuel'
                : persona.profil.A >= persona.profil.K ? 'auditif' : 'kinesthesique';
const canalSec  = [['V', persona.profil.V], ['A', persona.profil.A], ['K', persona.profil.K]]
                  .sort((a,b) => b[1]-a[1])[1][0] === 'V' ? 'visuel'
                : [['V', persona.profil.V], ['A', persona.profil.A], ['K', persona.profil.K]]
                  .sort((a,b) => b[1]-a[1])[1][0] === 'A' ? 'auditif' : 'kinesthesique';

const DR_MIND_SYSTEM = `Tu es Dr Mind, coach cognitif specialise en methode Pastek (gestion mentale).

CONTEXTE ELEVE :
- Profil cognitif (silencieux) : ${profilStr}
- Canal dominant : ${canalDom}
- Canal secondaire : ${canalSec}
- Passion principale : ${persona.passion}
- Blocage principal : ${persona.blocage}
- Matiere travaillee : ${matiere}

REGLES ABSOLUES — chaque reponse doit respecter toutes ces regles :
1. TRI SELECTIF SYSTEMATIQUE : avant toute aide, "qu'est-ce que tu sais deja ?" — toujours en premier
2. UNE SEULE QUESTION PAR REPONSE — jamais deux. Si tu veux poser deux questions, garde la plus importante.
3. JAMAIS DONNER LA REPONSE DIRECTEMENT — guider par questions socratiques. Reponse directe seulement apres 3 tentatives echouees.
4. EFFET MIROIR SYSTEMATIQUE : apres chaque bonne reponse, reformuler avec les mots de l'eleve enrichis d'un vocabulaire adulte, AVANT de relancer.
5. JAMAIS VALIDER "je sais rien" — toujours creuser jusqu'a trouver au moins une ancre minimale.
6. FLASH DE SENS concret dans le premier echange : lier la matiere a la vraie vie ou a la passion de l'eleve.
7. CANAL SECONDAIRE active : eleve ${canalDom} → inclure une evocation ${canalSec} dans tes analogies.
8. TEMPS DE SILENCE : apres un insight majeur de l'eleve, valider en UNE phrase, marquer une pause, PUIS relancer.
9. RIGUEUR PASTEK JUSQU'AU BOUT : ne pas basculer en mode copain ou counseling quand ca se passe bien. La methode tient.
10. ANALOGIES filtrees par passion : ${persona.passion} — toutes tes analogies doivent passer par la.

TON : chaleureux, direct, jamais condescendant. 2 a 4 phrases max par reponse.`;

const ELEVE_SYSTEM = `${persona.personnalite}

CONTEXTE : tu travailles sur tes ${matiere} avec Dr Mind.
Ton blocage : ${persona.blocage}
Ton profil reel (tu ne le sais pas) : ${profilStr}
Ta passion : ${persona.passion}

COMPORTEMENT AUTHENTIQUE :
- Si Dr Mind pose DEUX questions : tu reponds a aucune ou tu reponds a cote.
- Si Dr Mind donne la reponse directement sans te laisser chercher : tu te desengages (monosyllabes).
- Si Dr Mind utilise une mauvaise analogie (pas ta passion) : tu hoches la tete mais ca ne clique pas vraiment.
- Si Dr Mind respecte la methode et utilise ta passion : tu tevoles progressivement.
- Ne joue pas la comedie — evolue naturellement selon la qualite des interventions de Dr Mind.`;

const EVAL_SYSTEM = `Tu es un evaluateur expert en pedagodie et methode Pastek (gestion mentale).
Evalue cet echange entre Dr Mind et l'eleve. Retourne UNIQUEMENT un JSON valide sans aucun texte autour.

Format exact :
{
  "engagement": <0-10>,
  "progression": <0-10>,
  "methode_globale": <0-10>,
  "attention": <0-10>,
  "tri_selectif": <0-10>,
  "effet_miroir": <0-10>,
  "canal_secondaire": <0-10>,
  "coherence_passion": <0-10>,
  "erreurs_pastek": ["liste des erreurs specifiques ou tableau vide"],
  "moment_cle": "<string court ou null>",
  "obs": "<observation courte ou null>"
}

Criteres :
- engagement (0-10) : l'eleve s'engage-t-il vraiment ? posture, qualite des reponses, initiative
- progression (0-10) : comprehension qui augmente, liens nouveaux formes, formulations plus riches
- methode_globale (0-10) : respect global de Pastek (tri selectif, une question, effet miroir, flash de sens)
- attention (0-10) : l'eleve reste-t-il dans le sujet ? decrochage repere ?
- tri_selectif (0-10) : Dr Mind a-t-il bien fait evaluer ce que l'eleve sait avant d'avancer ?
- effet_miroir (0-10) : Dr Mind a-t-il reformule avec les mots enrichis de l'eleve AVANT de relancer ?
- canal_secondaire (0-10) : Dr Mind a-t-il active un second canal sensoriel (pas juste le dominant) ?
- coherence_passion (0-10) : les analogies utilisees correspondent-elles vraiment a la passion de l'eleve ?
- erreurs_pastek : liste exacte des violations (ex: "double question T3", "reponse directe sans 3 tentatives", "validation je sais rien acceptee", "derive counseling")
- moment_cle : le tournant le plus important de cet echange (insight, decrochage, percee)
- obs : observation methodologique notable`;

// ─── UTILS ────────────────────────────────────────────────────────────────────

const avg    = arr => +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2);
const avgInt = arr => Math.round(avg(arr));
const trend  = arr => {
  if (arr.length < 3) return '→';
  const t = arr.length, m = Math.floor(t/2);
  const debut = arr.slice(0,m).reduce((a,b)=>a+b,0)/m;
  const fin   = arr.slice(m).reduce((a,b)=>a+b,0)/(t-m);
  return fin > debut + 0.8 ? '↑↑' : fin > debut + 0.3 ? '↑' : fin < debut - 0.8 ? '↓↓' : fin < debut - 0.3 ? '↓' : '→';
};
const bar = (v, max=10) => {
  const f = Math.max(0, Math.min(10, Math.round(v)));
  const color = f >= 8 ? '█' : f >= 6 ? '▓' : f >= 4 ? '▒' : '░';
  return color.repeat(f) + '░'.repeat(max-f);
};
const sep  = (c='─', n=72) => console.log(c.repeat(n));
const hdr  = (txt, c='═')  => { sep(c); console.log('  ' + txt); sep(c); };

function printScore(label, vals) {
  const a = avg(vals), t = trend(vals);
  const pad = label.padEnd(22);
  const color = a >= 8 ? '  EXCELLENT' : a >= 6.5 ? '  BON' : a >= 5 ? '  MOYEN' : '  FAIBLE';
  console.log(`  ${pad}: ${bar(a)} ${String(a.toFixed(1)).padStart(4)}/10  ${t}${color}`);
}

// ─── LOG BUFFER ───────────────────────────────────────────────────────────────

const logLines = [];
function log(txt) { console.log(txt); logLines.push(txt); }
function logSep(c='─', n=72) { const l = c.repeat(n); console.log(l); logLines.push(l); }

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.clear();

  hdr('MINDFLOW — SIMULATEUR DR MIND v2.0');
  console.log(`  Eleve   : ${persona.nom}, ${persona.age} ans — ${persona.niveau}`);
  console.log(`  Profil  : ${profilStr}`);
  console.log(`  Passion : ${persona.passion}`);
  console.log(`  Blocage : ${persona.blocage}`);
  console.log(`  Matiere : ${matiere}  |  Tours : ${nbTours}`);
  sep();

  const drH   = [];
  const elH   = [];
  const allErrors = [];
  const momentsCles = [];

  const scores = {
    engagement:        [],
    progression:       [],
    methode_globale:   [],
    attention:         [],
    tri_selectif:      [],
    effet_miroir:      [],
    canal_secondaire:  [],
    coherence_passion: []
  };

  // ─── Tour 0 : ouverture Dr Mind ───────────────────────────────────────────
  console.log('\n[Tour 0]  Dr Mind ouvre la session...\n');
  const ouverture = await callClaude(
    [{ role: 'user', content: `Bonjour, je dois travailler mes ${matiere}.` }],
    DR_MIND_SYSTEM
  );
  drH.push({ role: 'user',      content: `Bonjour, je dois travailler mes ${matiere}.` });
  drH.push({ role: 'assistant', content: ouverture });
  elH.push({ role: 'user',      content: ouverture });
  console.log(`  DR MIND : ${ouverture}\n`);

  // ─── Boucle ───────────────────────────────────────────────────────────────
  for (let i = 0; i < nbTours; i++) {
    const tourLabel = `Tour ${String(i+1).padStart(2,'0')}/${nbTours}`;
    console.log('─'.repeat(36) + ' ' + tourLabel + ' ' + '─'.repeat(36 - tourLabel.length));

    // Eleve
    process.stdout.write(`\n  [${persona.nom.toUpperCase()}...] `);
    const elR = await callClaude(elH, ELEVE_SYSTEM, MODEL_LEGER);
    elH.push({ role: 'assistant', content: elR });
    drH.push({ role: 'user',      content: elR });
    console.log(`\n  ${persona.nom.toUpperCase().padEnd(10)}: ${elR}`);

    // Dr Mind
    process.stdout.write(`\n  [DR MIND...] `);
    const drR = await callClaude(drH, DR_MIND_SYSTEM);
    drH.push({ role: 'assistant', content: drR });
    elH.push({ role: 'user',      content: drR });
    console.log(`\n  DR MIND     : ${drR}`);

    // Evaluation
    process.stdout.write('\n  [Evaluation..] ');
    const evalPrompt = `Tour ${i+1}. Matiere: ${matiere}. Profil eleve: ${profilStr}. Passion: ${persona.passion}.
Eleve: "${elR}"
Dr Mind: "${drR}"`;

    const evalRaw = await callClaude(
      [{ role: 'user', content: evalPrompt }],
      EVAL_SYSTEM,
      MODEL_LEGER
    );

    try {
      const ev = JSON.parse(evalRaw.replace(/```json|```/g,'').trim());

      scores.engagement.push(ev.engagement ?? 5);
      scores.progression.push(ev.progression ?? 5);
      scores.methode_globale.push(ev.methode_globale ?? 5);
      scores.attention.push(ev.attention ?? 5);
      scores.tri_selectif.push(ev.tri_selectif ?? 5);
      scores.effet_miroir.push(ev.effet_miroir ?? 5);
      scores.canal_secondaire.push(ev.canal_secondaire ?? 5);
      scores.coherence_passion.push(ev.coherence_passion ?? 5);

      if (ev.erreurs_pastek && ev.erreurs_pastek.length > 0) {
        ev.erreurs_pastek.forEach(e => allErrors.push(`T${i+1}: ${e}`));
      }
      if (ev.moment_cle) momentsCles.push(`T${i+1}: ${ev.moment_cle}`);

      const e = ev.engagement, m = ev.methode_globale, p = ev.progression;
      process.stdout.write(
        `\r  [T${String(i+1).padStart(2,'0')}] Engagement:${e}/10  Progression:${p}/10  Methode:${m}/10  ` +
        `Miroir:${ev.effet_miroir}/10  Canal2:${ev.canal_secondaire}/10` +
        (ev.erreurs_pastek?.length ? `  ⚠ ${ev.erreurs_pastek.length} erreur(s)` : '  ✓ OK') + '\n'
      );

      if (ev.obs) console.log(`         Obs: ${ev.obs}`);

    } catch(err) {
      process.stdout.write('\r  [Evaluation] Erreur de parsing JSON\n');
      Object.keys(scores).forEach(k => scores[k].push(5));
    }

    console.log();
  }

  // ─── RAPPORT ──────────────────────────────────────────────────────────────
  const duration = Math.round((Date.now() - startTime) / 1000);
  const ts = new Date().toLocaleString('fr-FR');

  console.log('\n\n');
  logSep('═');
  log(`  RAPPORT DE SESSION — MindFlow Dr Mind v2.0`);
  log(`  ${ts}  |  Duree : ${duration}s`);
  logSep('═');
  log(`  Eleve   : ${persona.nom}, ${persona.age} ans — ${persona.niveau}`);
  log(`  Profil  : ${profilStr}`);
  log(`  Matiere : ${matiere}  |  ${nbTours} tours`);
  log(`  Blocage : ${persona.blocage}`);
  logSep();

  log('\n  SCORES MOYENS\n');
  log('  ─── ELEVE ──────────────────────────────────────────');
  printScore('Engagement',        scores.engagement);       logLines.push('');
  printScore('Progression',       scores.progression);      logLines.push('');
  printScore('Attention',         scores.attention);        logLines.push('');
  log('');
  log('  ─── DR MIND (Methode Pastek) ───────────────────────');
  printScore('Methode globale',   scores.methode_globale);  logLines.push('');
  printScore('Tri selectif',      scores.tri_selectif);     logLines.push('');
  printScore('Effet miroir',      scores.effet_miroir);     logLines.push('');
  printScore('Canal secondaire',  scores.canal_secondaire); logLines.push('');
  printScore('Coherence passion', scores.coherence_passion);logLines.push('');

  // Score Pastek synthetique
  const pastek = avg([
    avg(scores.methode_globale),
    avg(scores.tri_selectif),
    avg(scores.effet_miroir),
    avg(scores.canal_secondaire),
    avg(scores.coherence_passion)
  ]);
  log('');
  log(`  SCORE FIDELITE PASTEK GLOBAL : ${bar(pastek)} ${pastek.toFixed(2)}/10`);
  logSep();

  // Courbe de progression tour par tour
  log('\n  COURBE DE PROGRESSION (engagement par tour)\n');
  const sparkline = scores.engagement.map(v => {
    if (v >= 9) return '9';
    if (v >= 8) return '8';
    if (v >= 7) return '7';
    if (v >= 6) return '6';
    if (v >= 5) return '5';
    return String(Math.round(v));
  });
  log('  ' + sparkline.join(' → '));
  log('  Tours : ' + scores.engagement.map((_,i) => String(i+1).padStart(2)).join('   '));

  // Erreurs Pastek
  logSep();
  if (allErrors.length > 0) {
    log(`\n  VIOLATIONS PASTEK DETECTEES (${allErrors.length})\n`);
    allErrors.forEach(e => log(`  ⚠  ${e}`));
  } else {
    log('\n  VIOLATIONS PASTEK : aucune detectee ✓');
  }

  // Moments cles
  if (momentsCles.length > 0) {
    log(`\n  MOMENTS CLES DE LA SESSION\n`);
    momentsCles.forEach(m => log(`  ★  ${m}`));
  }

  logSep();

  // Synthese IA
  log('\n  [Generation synthese experte...]\n');
  const synthInput = `Session Dr Mind avec ${persona.nom}, ${persona.age} ans (${persona.niveau}).
Profil : ${profilStr}. Matiere : ${matiere}. Passion : ${persona.passion}. Blocage : ${persona.blocage}.
Tours : ${nbTours}. Duree : ${duration}s.

SCORES MOYENS :
- Engagement : ${avg(scores.engagement).toFixed(1)}/10 ${trend(scores.engagement)}
- Progression : ${avg(scores.progression).toFixed(1)}/10 ${trend(scores.progression)}
- Attention : ${avg(scores.attention).toFixed(1)}/10 ${trend(scores.attention)}
- Methode globale : ${avg(scores.methode_globale).toFixed(1)}/10 ${trend(scores.methode_globale)}
- Tri selectif : ${avg(scores.tri_selectif).toFixed(1)}/10 ${trend(scores.tri_selectif)}
- Effet miroir : ${avg(scores.effet_miroir).toFixed(1)}/10 ${trend(scores.effet_miroir)}
- Canal secondaire : ${avg(scores.canal_secondaire).toFixed(1)}/10 ${trend(scores.canal_secondaire)}
- Coherence passion : ${avg(scores.coherence_passion).toFixed(1)}/10 ${trend(scores.coherence_passion)}
- Score fidelite Pastek global : ${pastek.toFixed(2)}/10

VIOLATIONS DETECTEES : ${allErrors.length > 0 ? allErrors.join(' | ') : 'aucune'}
MOMENTS CLES : ${momentsCles.join(' | ')}

Fournis une synthese pedagogique experte en 4 blocs :
1. SYNTHESE GLOBALE (3-4 phrases) : ce qui sest passe dans cette session
2. POINTS FORTS (3 points precis avec exemples de tours)
3. POINTS A CORRIGER (3 points precis avec tour concerne et correction attendue)
4. PATCH PROMPT (2-3 regles a ajouter ou modifier dans le prompt de Dr Mind, formulees directement comme des regles)

Format : texte structure, pas de JSON, pas de markdown.`;

  const synthese = await callClaude(
    [{ role: 'user', content: synthInput }],
    'Tu es un expert senior en gestion mentale et methode Pastek. Tu analyses des sessions de coaching cognitif pour ameliorer les prompts IA.'
  );

  log(synthese);
  logSep('═');
  log(`  Fin de session. ${nbTours} tours  |  Duree : ${duration}s  |  Erreurs Pastek : ${allErrors.length}`);
  logSep('═');

  // Export fichier
  if (doExport) {
    const fname = `rapport_${personaId}_${matiereId}_${Date.now()}.txt`;
    fs.writeFileSync(fname, logLines.join('\n'), 'utf8');
    console.log(`\n  Export : ${path.resolve(fname)}\n`);
  }
}

main().catch(err => {
  console.error('\n  Erreur : ' + err.message);
  process.exit(1);
});
