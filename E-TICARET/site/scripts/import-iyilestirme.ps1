# iyileştirme.md → PFOS SKU öneri kuyruğu (Faz E)
# Kullanım:
#   .\scripts\import-iyilestirme.ps1 -DryRun
#   .\scripts\import-iyilestirme.ps1
#   .\scripts\import-iyilestirme.ps1 -ListeKey "s13-388-turk-220" -Teklif "EQS-2026-650"
#
# Not: DATABASE_URL gerekir (.env veya .env.local). Canlı DB için sunucuda çalıştırın.

param(
    [string]$ListeKey = "s13-388-turk-220",
    [string]$Teklif = "EQS-2026-650",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$siteRoot = Split-Path -Parent $PSScriptRoot
Set-Location $siteRoot

$nodeArgs = @(
    "--import", "./scripts/load-env.mjs",
    "./node_modules/tsx/dist/cli.mjs",
    "scripts/import-pfos-iyilestirme-oneri.mjs",
    "--liste-key", $ListeKey,
    "--teklif", $Teklif
)
if ($DryRun) { $nodeArgs += "--dry-run" }

& node @nodeArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
