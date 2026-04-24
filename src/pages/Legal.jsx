import { useNavigate } from 'react-router-dom'

export default function Legal() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '32px 24px',
      maxWidth: '760px',
      margin: '0 auto',
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none',
          color: 'var(--text-3)', cursor: 'pointer',
          fontSize: '14px', marginBottom: '24px',
          padding: 0,
        }}
      >← Retour</button>

      <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '26px', marginBottom: '8px' }}>
        Mentions légales &amp; Confidentialité
      </h1>
      <p style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '40px' }}>
        Dernière mise à jour : avril 2026
      </p>

      <Section title="1. Conditions générales d'utilisation">
        <P><strong>Inscription :</strong> Le compte Evokia est créé par un parent ou un adulte majeur (+18 ans). Les mineurs accèdent via un code fourni par leur parent.</P>
        <P><strong>Utilisation :</strong> Evokia est un outil de coaching cognitif et d'aide aux devoirs destiné aux collégiens, lycéens et adultes en formation. Ce n'est pas un diagnostic médical, un substitut professionnel de santé ou un service éducatif agréé.</P>
        <P><strong>Ce que l'app fait :</strong> accompagnement cognitif basé sur la méthode Pastek, aide aux devoirs guidée par questions, profil d'apprentissage personnalisé.</P>
        <P><strong>Ce qu'elle ne fait pas :</strong> aucun diagnostic médical ou psychologique, aucun remplacement d'un professionnel de santé ou d'enseignement, aucune garantie de résultats scolaires.</P>
        <P><strong>Résiliation :</strong> à tout moment depuis les paramètres du compte. Les données sont supprimées sous 30 jours après demande de suppression à scolrcoaching@gmail.com.</P>
      </Section>

      <Section title="2. Politique de confidentialité (RGPD — mineurs)">
        <P><strong>Responsable du traitement :</strong> Evokia — scolrcoaching@gmail.com</P>

        <P><strong>Données collectées :</strong></P>
        <ul style={{ paddingLeft: '20px', lineHeight: '2', color: 'var(--text-2)', fontSize: '14px' }}>
          <li>Prénom de l'élève</li>
          <li>Niveau scolaire</li>
          <li>Profil cognitif V/A/K (calculé lors des séances)</li>
          <li>Historique des sessions (résumés, matières, victoires)</li>
          <li>Email du parent (pour le compte)</li>
        </ul>

        <P><strong>Données NON collectées :</strong></P>
        <ul style={{ paddingLeft: '20px', lineHeight: '2', color: 'var(--text-2)', fontSize: '14px' }}>
          <li>Photo de l'élève</li>
          <li>Localisation géographique</li>
          <li>Données de santé</li>
          <li>Numéro de téléphone de l'élève</li>
        </ul>

        <P><strong>Photos de cahier :</strong> analysées par intelligence artificielle pour en extraire le texte, puis supprimées immédiatement. Elles ne sont jamais stockées en base de données.</P>
        <P><strong>Audio vocal :</strong> transcrit localement dans le navigateur via Web Speech API. L'audio brut n'est jamais transmis à nos serveurs.</P>

        <P><strong>Sous-traitants :</strong></P>
        <ul style={{ paddingLeft: '20px', lineHeight: '2', color: 'var(--text-2)', fontSize: '14px' }}>
          <li><strong>Anthropic</strong> — intelligence artificielle (traitement des messages)</li>
          <li><strong>Supabase</strong> — base de données (hébergée en UE)</li>
          <li><strong>Vercel</strong> — hébergement (GDPR compliant)</li>
          <li><strong>OpenAI</strong> — synthèse vocale TTS (premium)</li>
        </ul>

        <P><strong>Conservation :</strong> 2 ans après la dernière session, puis suppression automatique.</P>
        <P><strong>Droits :</strong> accès, rectification, suppression, portabilité — par email à scolrcoaching@gmail.com. Réponse sous 30 jours.</P>
        <P><strong>Droits des mineurs :</strong> le parent peut à tout moment demander la suppression totale du compte de son enfant.</P>
      </Section>

      <Section title="3. Cookies et traceurs">
        <P>Evokia utilise uniquement des cookies techniques nécessaires au fonctionnement (authentification Supabase). Aucun cookie publicitaire ou de tracking tiers.</P>
      </Section>

      <div style={{ marginTop: '48px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--r-md)', fontSize: '13px', color: 'var(--text-3)' }}>
        Contact RGPD : scolrcoaching@gmail.com
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <h2 style={{ fontFamily: 'var(--f-title)', fontSize: '18px', marginBottom: '16px', color: 'var(--accent)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function P({ children }) {
  return (
    <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.7', marginBottom: '12px' }}>
      {children}
    </p>
  )
}
