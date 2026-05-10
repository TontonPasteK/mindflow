const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://yrjgxafuiclmhjkebjqu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyamd4YWZ1aWNsbWhqa2VianF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk2NDUzOSwiZXhwIjoyMDkxNTQwNTM5fQ.Ti-w7_rCnYXeCzmm3VWh7srMB2el5UfdYyHoCiNnbgY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQLFile() {
  try {
    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'create_guides_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Tentative de création de la table guides...');

    // Diviser le SQL en instructions individuelles
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Exécuter chaque instruction
    for (const statement of statements) {
      try {
        const { data, error } = await supabase
          .from('guides')
          .select('*')
          .limit(0);

        // Si on arrive ici, la table existe déjà
        if (statement.includes('CREATE TABLE')) {
          console.log('La table guides existe déjà ou a été créée');
          continue;
        }
      } catch (tableError) {
        // La table n'existe pas encore, on continue
        if (statement.includes('CREATE TABLE')) {
          console.log('Création de la table guides...');
          // On ne peut pas créer de table via l'API client standard
          console.log('Veuillez exécuter le fichier create_guides_table.sql manuellement dans le SQL Editor Supabase');
          return;
        }
      }
    }

    console.log('Opérations terminées');
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

executeSQLFile();
