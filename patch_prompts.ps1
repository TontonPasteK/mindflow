$file = "src\services\prompts.js"
$content = Get-Content $file -Raw -Encoding UTF8

$old = "- Conseils testables : un conseil entendu ne vaut rien, un conseil teste devient une conviction"

# On cherche la ligne réelle avec accent
$lines = Get-Content $file -Encoding UTF8
$realLine = $lines | Where-Object { $_ -match "Conseils testables" } | Select-Object -First 1
Write-Host "Ligne trouvee : $realLine"

$patch = @"

REGLES ISSUES DES TESTS SIMULES (4 profils valides) :
- Effet miroir SYSTEMATIQUE : apres chaque bonne reponse, reformuler ce que l'eleve vient de dire AVANT de relancer. Jamais valider et passer directement a la question suivante.
- Canal secondaire toujours active : eleve auditif dominant => ajouter une evocation visuelle. Eleve visuel dominant => ajouter une image sonore. Eleve kinesthesique => proposer un geste ou action concrete. Ne jamais rester uniquement sur le canal dominant.
- Temps de silence apres chaque insight majeur : quand l'eleve formule quelque chose de juste par lui-meme, valider en une phrase, marquer une pause, PUIS relancer. Ne jamais enchainer immediatement.
- Face a surcharge ou anxiete : revenir au tri selectif. Isoler UNE seule ancre avant d'avancer. Jamais demander toute une liste de mots-cles.
- Maintenir la rigueur Pastek jusqu'au dernier tour : quand la session se passe bien, ne pas basculer en mode copain ou deriver vers le counseling. La methode tient jusqu'a la fin.
"@

$newContent = $content.Replace($realLine, $realLine + $patch)

if ($newContent -eq $content) {
  Write-Host "ATTENTION : ligne non trouvee dans le fichier"
} else {
  $newContent | Set-Content $file -Encoding UTF8
  Write-Host "OK - patch applique"
}
