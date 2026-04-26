# Script de lancement automatique — MindFlow Simulateur v2
# Lance Ryan + Ines a la suite sans intervention

Write-Host "============================================================"
Write-Host "  MINDFLOW — LANCEMENT AUTOMATIQUE"
Write-Host "  Ryan (francais) + Ines (histoire) — 10 tours chacun"
Write-Host "============================================================"

# Charger la cle API depuis .env
$env:ANTHROPIC_API_KEY = (Get-Content .env | Select-String "ANTHROPIC_API_KEY" | ForEach-Object { $_.ToString().Split("=",2)[1].Trim() })

if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "ERREUR : cle API non trouvee dans .env"
    exit 1
}

Write-Host ""
Write-Host ">>> SIMULATION 1/2 : Ryan — francais — 10 tours"
Write-Host "------------------------------------------------------------"
node mindflow_sim_v2.cjs ryan francais 10 --export

Write-Host ""
Write-Host ">>> SIMULATION 2/2 : Ines — histoire — 10 tours"
Write-Host "------------------------------------------------------------"
node mindflow_sim_v2.cjs ines histoire 10 --export

Write-Host ""
Write-Host "============================================================"
Write-Host "  TERMINE — 2 rapports exportes dans le dossier"
Write-Host "============================================================"
