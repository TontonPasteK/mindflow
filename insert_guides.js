import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://yrjgxafuiclmhjkebjqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyamd4YWZ1aWNsbWhqa2VianF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ1MzksImV4cCI6MjA5MTU0MDUzOX0.jXzaxpzwkRLpLWNRzyjrqrhsVYV1wwLvUthi827QxT0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertGuides() {
  try {
    // Lire les données préparées
    const dataPath = path.join(__dirname, 'guides_data_prepared.json');
    const guidesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`Tentative d'insertion de ${guidesData.length} guides...`);

    let successCount = 0;
    let errorCount = 0;

    for (const guide of guidesData) {
      try {
        const { data, error } = await supabase
          .from('guides')
          .insert([{
            title: guide.title,
            category: guide.category,
            subcategory: guide.subcategory,
            subject: guide.subject,
            target_audience: guide.target_audience,
            version: guide.version,
            description: guide.description,
            content: guide.content
          }])
          .select();

        if (error) {
          console.log(`✗ Erreur pour "${guide.title}":`, error.message);
          errorCount++;
        } else {
          console.log(`✓ "${guide.title}" - inséré avec succès`);
          successCount++;
        }
      } catch (err) {
        console.log(`✗ Exception pour "${guide.title}":`, err.message);
        errorCount++;
      }
    }

    console.log(`\nInsertion terminée: ${successCount} succès, ${errorCount} erreurs`);

    if (errorCount > 0) {
      console.log('\nNote: Si la table "guides" n\'existe pas encore, veuillez exécuter le fichier create_guides_table.sql dans le SQL Editor de Supabase.');
    }

  } catch (err) {
    console.log('Exception:', err.message);
  }
}

insertGuides();
