import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guidesDir = 'C:\\Users\\scolr\\EvokIA_prompt\\derivés_prompts_parents';

// Liste des guides à insérer
const guidesToInsert = [
  // Version Parent
  {
    title: "Aide aux devoirs - Français (Version Parent)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "français",
    target_audience: "parent",
    version: "parent",
    description: "Guide pour aider les parents à accompagner leur enfant dans les devoirs de français",
    filename: "PROMPT_FRANCAIS___Aide_devoirs_Parent.txt"
  },
  {
    title: "Aide aux devoirs - Mathématiques (Version Parent)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "mathématiques",
    target_audience: "parent",
    version: "parent",
    description: "Guide pour aider les parents à accompagner leur enfant dans les devoirs de mathématiques",
    filename: "PROMPT_MATHS___Aide_devoirs_Parent.txt"
  },
  {
    title: "Aide aux devoirs - Physique-Chimie (Version Parent)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "physique-chimie",
    target_audience: "parent",
    version: "parent",
    description: "Guide pour aider les parents à accompagner leur enfant dans les devoirs de physique-chimie",
    filename: "PROMPT_PHYSIQUE_CHIMIE___Aide_devoirs_Parent.txt"
  },
  {
    title: "Aide aux devoirs - Histoire-Géographie (Version Parent)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "histoire-géographie",
    target_audience: "parent",
    version: "parent",
    description: "Guide pour aider les parents à accompagner leur enfant dans les devoirs d'histoire-géographie",
    filename: "PROMPT_HISTOIRE_GEO___Aide_devoirs_Parent.txt"
  },
  {
    title: "Aide aux devoirs - SVT (Version Parent)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "svt",
    target_audience: "parent",
    version: "parent",
    description: "Guide pour aider les parents à accompagner leur enfant dans les devoirs de SVT",
    filename: "PROMPT_SVT___Aide_devoirs_Parent.txt"
  },
  {
    title: "Aide aux devoirs - Anglais (Version Parent)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "anglais",
    target_audience: "parent",
    version: "parent",
    description: "Guide pour aider les parents à accompagner leur enfant dans les devoirs d'anglais",
    filename: "PROMPT_ANGLAIS___Aide_devoirs_Parent.txt"
  },
  // Version Élève
  {
    title: "Aide aux devoirs - Français (Version Élève)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "français",
    target_audience: "élève",
    version: "élève",
    description: "Guide d'aide aux devoirs en français pour les collégiens et lycéens",
    filename: "PROMPT_FRANCAIS_ELEVE___Aide_devoirs.txt"
  },
  {
    title: "Aide aux devoirs - Mathématiques (Version Élève)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "mathématiques",
    target_audience: "élève",
    version: "élève",
    description: "Guide d'aide aux devoirs en mathématiques pour les collégiens et lycéens",
    filename: "PROMPT_MATHS_ELEVE___Aide_devoirs.txt"
  },
  {
    title: "Aide aux devoirs - Physique-Chimie (Version Élève)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "physique-chimie",
    target_audience: "élève",
    version: "élève",
    description: "Guide d'aide aux devoirs en physique-chimie pour les collégiens et lycéens",
    filename: "PROMPT_PHYSIQUE_CHIMIE_ELEVE___Aide_devoirs.txt"
  },
  {
    title: "Aide aux devoirs - Histoire-Géographie (Version Élève)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "histoire-géographie",
    target_audience: "élève",
    version: "élève",
    description: "Guide d'aide aux devoirs en histoire-géographie pour les collégiens et lycéens",
    filename: "PROMPT_HISTOIRE_GEO_ELEVE___Aide_devoirs.txt"
  },
  {
    title: "Aide aux devoirs - SVT (Version Élève)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "svt",
    target_audience: "élève",
    version: "élève",
    description: "Guide d'aide aux devoirs en SVT pour les collégiens et lycéens",
    filename: "PROMPT_SVT_ELEVE___Aide_devoirs.txt"
  },
  {
    title: "Aide aux devoirs - Anglais (Version Élève)",
    category: "scolaire",
    subcategory: "aide_devoirs",
    subject: "anglais",
    target_audience: "élève",
    version: "élève",
    description: "Guide d'aide aux devoirs en anglais pour les collégiens et lycéens",
    filename: "PROMPT_ANGLAIS_ELEVE___Aide_devoirs.txt"
  }
];

async function prepareGuidesData() {
  const guidesData = [];

  for (const guide of guidesToInsert) {
    try {
      const filePath = path.join(guidesDir, guide.filename);
      const content = fs.readFileSync(filePath, 'utf8');

      guidesData.push({
        title: guide.title,
        category: guide.category,
        subcategory: guide.subcategory,
        subject: guide.subject,
        target_audience: guide.target_audience,
        version: guide.version,
        description: guide.description,
        content: content
      });

      console.log(`✓ ${guide.title} - contenu chargé`);
    } catch (err) {
      console.log(`✗ Erreur pour ${guide.title}:`, err.message);
    }
  }

  // Sauvegarder les données préparées
  fs.writeFileSync(
    path.join(__dirname, 'guides_data_prepared.json'),
    JSON.stringify(guidesData, null, 2)
  );

  console.log(`\n${guidesData.length} guides préparés et sauvegardés dans guides_data_prepared.json`);
  return guidesData;
}

prepareGuidesData();
