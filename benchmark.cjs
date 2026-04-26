/**
 * MindFlow — Benchmark automatique v1.0
 * Lance les 6 personas en sequence, compile les scores,
 * genere un rapport comparatif global avec evolution par patch.
 *
 * Usage :
 *   node mindflow_benchmark.cjs [--tours 6] [--export]
 *
 * Options :
 *   --tours N   : nombre de tours par session (defaut 6 pour rapidite)
 *   --export    : exporte le rapport en .txt
 *   --personas  : liste filtree ex: lucas,ines,ryan
 *
 * Clé API :
 *   $env:ANTHROPIC_API_KEY=(Get-Content .env | Select-String "ANTHROPIC_API_KEY" | %{ $_.ToString().Split("=",2)[1].Trim() })
 */

const https = require('https');
const fs    = require('fs');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const API_KEY     = process.env.ANTHROPIC_API_KEY;
const MODEL_FORT  = 'claude-opus-4-5';
const MODEL_LEGER = 'claude-haiku-4-5-20251001';

if (!API_KEY) {
  console.error('\n  ERREUR : ANTHROPIC_API_KEY non definie.');
  console.error('  $env:ANTHROPIC_API_KEY=(Get-Content .env | Select-String "ANTHROPIC_API_KEY" | %{ $_.ToString().Split("=",2)[1].Trim() })\n');
  process.exit(1);
}

// ─── ARGUMENTS ────────────────────────────────────────────────────────────────

const args         = process.argv.slice(2);
const toursIdx     = args.indexOf('--tours');
const personasIdx  = args.indexOf('--personas');
const doExport     = args.includes('--export');
const nbTours      = toursIdx !== -1 ? parseInt(args[toursIdx + 1]) : 6;
const personaFilter = personasIdx !== -1 ? args[personasIdx + 1].split(',') : null;

// ─── PERSONAS ─────────────────────────────────────────────────────────────────

const PERSONAS = {
  lucas: {
    nom: 'Lucas', age: 13, niveau: '4e',
    profil: { V: 70, A: 20, K: 10 },
    passion: 'jeux video (League of Legends, Valorant, Minecraft)',
    blocage: 'coache de force par ses parents, conviction que cest inutile',
    matiere: 'mathematiques',
    personnalite: [
      'Tu es Lucas, 13 ans, 4e. Desengage, coache de force.',
      'Tu reponds par monosyllabes au debut : ouais, jsais pas, bof.',
      'Tu tanimes UNIQUEMENT si on parle de jeux video.',
      'Tu appliques un conseil seulement si on le relie a un jeu.',
      'Si Dr Mind pose deux questions, tu reponds a aucune.',
      'Tes reponses font 1 a 2 phrases max.'
    ].join('\n')
  },
  ines: {
    nom: 'Ines', age: 14, niveau: '3e',
    profil: { V: 30, A: 65, K: 5 },
    passion: 'musique (pop, K-pop), podcasts, discussions avec amies',
    blocage: 'anxiete intense, se noie dans les details, cherche validation constante',
    matiere: 'histoire-geographie',
    personnalite: [
      'Tu es Ines, 14 ans, 3e. Anxieuse, bonne eleve sous pression.',
      'Tu parles beaucoup et tu te perds dans tes explications.',
      'Tu poses constamment des questions de validation : cest bien ?',
      'Tu retiens bien ce que tu entends a voix haute.',
      'Si Dr Mind pose une question trop large, tu paniques.',
      'Tes reponses font 3 a 5 phrases.'
    ].join('\n')
  },
  ryan: {
    nom: 'Ryan', age: 12, niveau: '5e',
    profil: { V: 30, A: 10, K: 60 },
    passion: 'football (PSG, Mbappe), FIFA, sport',
    blocage: 'attention fragile, repond vite et souvent a cote',
    matiere: 'francais',
    personnalite: [
      'Tu es Ryan, 12 ans, 5e. Kinesthesique, sportif.',
      'Tu reponds vite, souvent avant davoir fini de reflechir.',
      'Ton attention decroche apres 3-4 echanges abstraits.',
      'Tu raccroches si on parle de foot ou de gestes physiques.',
      'Tes reponses font 1 a 2 phrases, directes, parfois brouillonnes.'
    ].join('\n')
  },
  camille: {
    nom: 'Camille', age: 15, niveau: '2nde',
    profil: { V: 45, A: 45, K: 10 },
    passion: 'series Netflix, ecriture, psychologie',
    blocage: 'mefiance envers le coaching, charge mentale (divorce parental)',
    matiere: 'physique-chimie',
    personnalite: [
      'Tu es Camille, 15 ans, 2nde. Mature, mefiante.',
      'Tu testes Dr Mind des les premiers echanges.',
      'Tu reponds avec ironie legere au debut.',
      'Quand tu fais confiance, tes reponses deviennent riches.',
      'Tes reponses font 1 a 4 phrases selon engagement.'
    ].join('\n')
  },
  marie: {
    nom: 'Marie', age: 38, niveau: 'Adulte',
    profil: { V: 40, A: 40, K: 20 },
    passion: 'jardinage, cuisine, podcasts developpement personnel',
    blocage: 'reconversion apres 15 ans en comptabilite, se sent trop vieille pour apprendre',
    matiere: 'sciences de la vie et de la terre (SVT)',
    personnalite: [
      'Tu es Marie, 38 ans, en reconversion professionnelle.',
      'Tu doutes de ta capacite a apprendre quelque chose de technique.',
      'Tu dis souvent : a mon age cest plus pareil.',
      'Tu es serieuse et motivee mais tu as peur.',
      'Tu apprecies quon te parle en egal.',
      'Tes reponses font 2 a 4 phrases.'
    ].join('\n')
  },
  sofiane: {
    nom: 'Sofiane', age: 16, niveau: '1ere',
    profil: { V: 20, A: 30, K: 50 },
    passion: 'rap (Jul, Ninho), basketball, reseaux sociaux',
    blocage: 'dyslexie legere non diagnostiquee, humiliation passee par un prof, mefiance scolaire',
    matiere: 'anglais',
    personnalite: [
      'Tu es Sofiane, 16 ans, 1ere. Kinesthesique dominant.',
      'Tu reponds par des blagues ou de levitement au debut.',
      'Si Dr Mind prouve quil juge pas, tu testes davantage.',
      'Tu raccroches sur les exemples concrets, le rap, le basket.',
      'Le moindre signe de jugement et tu te fermes.',
      'Tes reponses font 1 a 3 phrases. Argot naturel.'
    ].join('\n')
  }
};

// ─── API ──────────────────────────────────────────────────────────────────────

function callClaude(messages, system, model) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: model || MODEL_FORT, max_tokens: 700, system, messages });
    const req = https.request({
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body)
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
    req.on('error', reject); req.write(body); req.end();
  });
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

function buildDrMindSystem(p) {
  const dom = p.profil.V >= p.profil.A && p.profil.V >= p.profil.K ? 'visuel'
            : p.profil.A >= p.profil.K ? 'auditif' : 'kinesthesique';
  const sec = Object.entries(p.profil).sort((a,b)=>b[1]-a[1])[1][0] === 'V' ? 'visuel'
            : Object.entries(p.profil).sort((a,b)=>b[1]-a[1])[1][0] === 'A' ? 'auditif' : 'kinesthesique';
  const kpct = p.profil.K;
  return `Tu es Dr Mind, coach cognitif specialise en methode Pastek.
Profil eleve : Visuel ${p.profil.V}% / Auditif ${p.profil.A}% / Kinesthesique ${p.profil.K}%
Canal dominant : ${dom} | Canal secondaire : ${sec}
Passion : ${p.passion} | Matiere : ${p.matiere} | Blocage : ${p.blocage}

REGLES ABSOLUES :
1. Tri selectif SYSTEMATIQUE avant toute aide
2. UNE SEULE QUESTION PAR REPONSE
3. Jamais donner la reponse directement
4. Effet miroir : reformuler avec mots de l'eleve enrichis AVANT de relancer
5. Jamais valider "je sais rien"
6. Flash de sens concret dans le premier echange
7. Canal secondaire active dans chaque reponse
8. Temps de silence apres chaque insight majeur
9. Rigueur Pastek jusqu'au dernier tour
10. Analogies filtrees par passion : ${p.passion}
${kpct >= 30 ? '11. REGLE A - Kinesthesique prioritaire : ancrage corporel (geste, mouvement, mime) dans les 2 premiers tours.' : ''}
12. REGLE B - Passion toutes les 3 reponses : reinjecter la passion si 3 tours sans reference.
13. REGLE C - Tours finaux = consolidation : maintenir tri selectif + effet miroir jusqu'au bout.

TON : chaleureux, direct, jamais condescendant. 2 a 4 phrases max.`;
}

function buildEleveSystem(p) {
  return `${p.personnalite}
Matiere : ${p.matiere}. Blocage : ${p.blocage}.
Profil reel : Visuel ${p.profil.V}% / Auditif ${p.profil.A}% / Kinesthesique ${p.profil.K}%.
Passion : ${p.passion}.
Si Dr Mind pose 2 questions : reponds a aucune.
Si Dr Mind donne la reponse directement : desengage-toi.
Evolue naturellement selon la qualite des interventions.`;
}

const EVAL_SYSTEM = `Evaluateur expert methode Pastek. Retourne UNIQUEMENT un JSON valide :
{"engagement":0,"progression":0,"methode_globale":0,"attention":0,"tri_selectif":0,"effet_miroir":0,"canal_secondaire":0,"coherence_passion":0,"violations":[],"obs":null}
- engagement (0-10) : l'eleve s'engage-t-il vraiment ?
- progression (0-10) : comprehension qui augmente ?
- methode_globale (0-10) : respect global Pastek
- attention (0-10) : reste dans le sujet ?
- tri_selectif (0-10) : bien evalue ce que l'eleve sait avant d'avancer ?
- effet_miroir (0-10) : reformule avec mots de l'eleve AVANT de relancer ?
- canal_secondaire (0-10) : active un second canal sensoriel ?
- coherence_passion (0-10) : analogies correspondent a la passion ?
- violations : liste exacte des violations Pastek detectees (tableau vide si aucune)
- obs : observation courte ou null`;

// ─── SESSION ──────────────────────────────────────────────────────────────────

async function runSession(personaId, nbTours) {
  const p = PERSONAS[personaId];
  const drSystem  = buildDrMindSystem(p);
  const elSystem  = buildEleveSystem(p);
  const drH = [], elH = [];
  const scores = { engagement:[], progression:[], methode_globale:[], attention:[], tri_selectif:[], effet_miroir:[], canal_secondaire:[], coherence_passion:[] };
  const allViolations = [];

  process.stdout.write(`  ${p.nom.padEnd(10)}: `);

  // Ouverture
  const ouv = await callClaude([{ role:'user', content:`Bonjour, je dois travailler mes ${p.matiere}.` }], drSystem);
  drH.push({ role:'user', content:`Bonjour, je dois travailler mes ${p.matiere}.` });
  drH.push({ role:'assistant', content:ouv });
  elH.push({ role:'user', content:ouv });

  for (let i = 0; i < nbTours; i++) {
    const elR = await callClaude(elH, elSystem, MODEL_LEGER);
    elH.push({ role:'assistant', content:elR });
    drH.push({ role:'user', content:elR });

    const drR = await callClaude(drH, drSystem);
    drH.push({ role:'assistant', content:drR });
    elH.push({ role:'user', content:drR });

    const evalRaw = await callClaude([{
      role:'user',
      content:`Tour ${i+1}. Profil: Visuel ${p.profil.V}% / Auditif ${p.profil.A}% / Kinesthesique ${p.profil.K}%. Passion: ${p.passion}.\nEleve: "${elR}"\nDr Mind: "${drR}"`
    }], EVAL_SYSTEM, MODEL_LEGER);

    try {
      const ev = JSON.parse(evalRaw.replace(/```json|```/g,'').trim());
      Object.keys(scores).forEach(k => { if (ev[k] !== undefined) scores[k].push(ev[k]); else scores[k].push(5); });
      if (ev.violations && ev.violations.length > 0) ev.violations.forEach(v => allViolations.push(`T${i+1}: ${v}`));
    } catch {
      Object.keys(scores).forEach(k => scores[k].push(5));
    }

    process.stdout.write('.');
  }

  const avg = arr => +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2);
  const pastek = avg([avg(scores.methode_globale), avg(scores.tri_selectif), avg(scores.effet_miroir), avg(scores.canal_secondaire), avg(scores.coherence_passion)]);

  const result = {
    persona: p.nom, age: p.age, niveau: p.niveau,
    profil: `V${p.profil.V}/A${p.profil.A}/K${p.profil.K}`,
    matiere: p.matiere,
    scores: Object.fromEntries(Object.entries(scores).map(([k,v]) => [k, avg(v)])),
    pastek: +pastek.toFixed(2),
    violations: allViolations.length,
    violationsList: allViolations
  };

  const e = result.scores.engagement, pr = result.scores.progression, m = result.scores.methode_globale;
  const status = pastek >= 8 ? 'EXCELLENT' : pastek >= 7 ? 'BON' : pastek >= 6 ? 'MOYEN' : 'FAIBLE';
  console.log(` ${nbTours} tours | Pastek: ${pastek.toFixed(2)}/10 ${status} | Violations: ${allViolations.length} | E:${e} P:${pr} M:${m}`);

  return result;
}

// ─── RAPPORT ──────────────────────────────────────────────────────────────────

function printRapport(results, nbTours, duration) {
  const sep  = (c='─', n=72) => c.repeat(n);
  const avg  = arr => +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2);
  const bar  = v => { const f=Math.max(0,Math.min(10,Math.round(v))); return (f>=8?'█':f>=6?'▓':f>=4?'▒':'░').repeat(f)+'░'.repeat(10-f); };
  const lines = [];
  const log   = t => { console.log(t); lines.push(t); };

  log('');
  log(sep('═'));
  log('  MINDFLOW — BENCHMARK AUTOMATIQUE v1.0');
  log(`  ${new Date().toLocaleString('fr-FR')}  |  ${results.length} personas  |  ${nbTours} tours chacun  |  Duree: ${duration}s`);
  log(sep('═'));

  // Tableau comparatif
  log('\n  TABLEAU COMPARATIF — SCORE PASTEK GLOBAL\n');
  log('  Persona       Profil        Matiere              Pastek  Viol  Engagement  Progression  Methode');
  log('  ' + sep('-', 95));

  const sorted = [...results].sort((a,b) => b.pastek - a.pastek);
  sorted.forEach(r => {
    const status = r.pastek >= 8 ? '✓✓' : r.pastek >= 7 ? '✓ ' : r.pastek >= 6 ? '△ ' : '✗ ';
    const warn   = r.violations > 10 ? '⚠⚠' : r.violations > 5 ? '⚠ ' : '  ';
    log(`  ${status} ${r.persona.padEnd(10)} ${r.profil.padEnd(14)} ${r.matiere.substring(0,20).padEnd(20)}  ${r.pastek.toFixed(2).padStart(5)}  ${warn}${String(r.violations).padStart(3)}  ${r.scores.engagement.toFixed(1).padStart(10)}  ${r.scores.progression.toFixed(1).padStart(11)}  ${r.scores.methode_globale.toFixed(1).padStart(7)}`);
  });

  // Scores moyens globaux
  log('');
  log(sep());
  log('\n  SCORES MOYENS GLOBAUX\n');

  const criteres = ['engagement','progression','attention','methode_globale','tri_selectif','effet_miroir','canal_secondaire','coherence_passion'];
  const labels   = ['Engagement','Progression','Attention','Methode globale','Tri selectif','Effet miroir','Canal secondaire','Coherence passion'];

  criteres.forEach((k, i) => {
    const vals = results.map(r => r.scores[k]);
    const a = avg(vals);
    const min = Math.min(...vals).toFixed(1);
    const max = Math.max(...vals).toFixed(1);
    const status = a >= 8 ? 'EXCELLENT' : a >= 7 ? 'BON' : a >= 6 ? 'MOYEN' : 'FAIBLE';
    log(`  ${labels[i].padEnd(20)}: ${bar(a)} ${a.toFixed(2)}/10  [min:${min} max:${max}]  ${status}`);
  });

  const allPastek = avg(results.map(r => r.pastek));
  const allViol   = results.reduce((s,r) => s + r.violations, 0);
  log('');
  log(`  ${'PASTEK GLOBAL MOYEN'.padEnd(20)}: ${bar(allPastek)} ${allPastek.toFixed(2)}/10`);
  log(`  ${'VIOLATIONS TOTALES'.padEnd(20)}: ${allViol} sur ${results.length * nbTours} tours evalues`);

  // Analyse par profil
  log('');
  log(sep());
  log('\n  ANALYSE PAR CANAL DOMINANT\n');

  const byCanal = { visuel: [], auditif: [], kinesthesique: [] };
  results.forEach(r => {
    const prof = r.profil;
    const v = parseInt(prof.match(/V(\d+)/)[1]);
    const a = parseInt(prof.match(/A(\d+)/)[1]);
    const k = parseInt(prof.match(/K(\d+)/)[1]);
    if (v >= a && v >= k) byCanal.visuel.push(r);
    else if (a >= k) byCanal.auditif.push(r);
    else byCanal.kinesthesique.push(r);
  });

  Object.entries(byCanal).forEach(([canal, rs]) => {
    if (rs.length === 0) return;
    const mp = avg(rs.map(r => r.pastek));
    const mv = avg(rs.map(r => r.violations));
    log(`  ${canal.toUpperCase().padEnd(16)}: Pastek moy ${mp.toFixed(2)}/10 | Violations moy ${mv.toFixed(1)} | n=${rs.length}`);
  });

  // Points faibles identifies
  log('');
  log(sep());
  log('\n  POINTS FAIBLES IDENTIFIES (criteres < 7.0)\n');

  criteres.forEach((k, i) => {
    const vals = results.map(r => r.scores[k]);
    const a = avg(vals);
    if (a < 7.0) {
      const worst = sorted.find(r => r.scores[k] === Math.min(...results.map(x => x.scores[k])));
      log(`  ⚠  ${labels[i].padEnd(20)}: ${a.toFixed(2)}/10 — plus faible sur ${worst.persona} (${worst.scores[k].toFixed(1)})`);
    }
  });

  // Violations frequentes
  log('');
  log(sep());
  log('\n  TOP VIOLATIONS PASTEK\n');

  const allViolsList = results.flatMap(r => r.violationsList.map(v => ({ persona: r.persona, v })));
  const violCounts = {};
  allViolsList.forEach(({ persona, v }) => {
    const key = v.replace(/T\d+: /, '').substring(0, 60);
    if (!violCounts[key]) violCounts[key] = { count: 0, personas: new Set() };
    violCounts[key].count++;
    violCounts[key].personas.add(persona);
  });

  Object.entries(violCounts)
    .sort((a,b) => b[1].count - a[1].count)
    .slice(0, 8)
    .forEach(([v, data]) => {
      log(`  [${String(data.count).padStart(2)}x] ${v.substring(0,55).padEnd(55)} (${[...data.personas].join(', ')})`);
    });

  // Recommandations
  log('');
  log(sep());
  log('\n  RECOMMANDATIONS PROMPT\n');

  const kPersonas = results.filter(r => parseInt(r.profil.match(/K(\d+)/)[1]) >= 30);
  const kPastek   = avg(kPersonas.map(r => r.pastek));
  const aPastek   = avg(results.filter(r => parseInt(r.profil.match(/A(\d+)/)[1]) >= 50).map(r => r.pastek));

  if (kPastek < aPastek - 0.5) {
    log(`  1. PRIORITE KINESTHESIQUE : ecart de ${(aPastek - kPastek).toFixed(2)} pts vs profils auditifs.`);
    log(`     Renforcer les ancrages corporels dans les 2 premiers tours pour K >= 30%.`);
  }

  const csAvg = avg(results.map(r => r.scores.canal_secondaire));
  if (csAvg < 7.5) {
    log(`  2. CANAL SECONDAIRE : score moyen ${csAvg.toFixed(2)}/10 — insuffisant.`);
    log(`     Ajouter instruction : nommer explicitement le canal active a chaque evocation.`);
  }

  const cpAvg = avg(results.map(r => r.scores.coherence_passion));
  if (cpAvg < 7.5) {
    log(`  3. COHERENCE PASSION : score moyen ${cpAvg.toFixed(2)}/10 — la passion est abandonnee en fin de session.`);
    log(`     Appliquer REGLE B plus strictement : reinjecter toutes les 3 reponses.`);
  }

  const lateScores = results.map(r => r.scores.methode_globale);
  if (avg(lateScores) < 7.5) {
    log(`  4. RIGUEUR FINALE : methode globale ${avg(lateScores).toFixed(2)}/10.`);
    log(`     REGLE C : les tours finaux sont de la consolidation, pas de la cloture.`);
  }

  log('');
  log(sep('═'));
  log(`  Benchmark termine. ${results.length} sessions | ${nbTours} tours | Duree: ${duration}s | Violations: ${allViol}`);
  log(sep('═'));

  return lines;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  const startTime = Date.now();

  const toRun = personaFilter
    ? Object.keys(PERSONAS).filter(k => personaFilter.includes(k))
    : Object.keys(PERSONAS);

  console.log('═'.repeat(72));
  console.log('  MINDFLOW — BENCHMARK AUTOMATIQUE v1.0');
  console.log(`  ${toRun.length} personas | ${nbTours} tours chacun | debut...`);
  console.log('═'.repeat(72));
  console.log('');

  const results = [];

  for (const personaId of toRun) {
    try {
      const r = await runSession(personaId, nbTours);
      results.push(r);
    } catch(err) {
      console.error(`  ERREUR ${personaId}: ${err.message}`);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  const lines = printRapport(results, nbTours, duration);

  if (doExport) {
    const fname = `benchmark_${Date.now()}.txt`;
    fs.writeFileSync(fname, lines.join('\n'), 'utf8');
    console.log(`\n  Export : ${require('path').resolve(fname)}\n`);
  }
}

main().catch(err => {
  console.error('\n  Erreur fatale : ' + err.message);
  process.exit(1);
});
