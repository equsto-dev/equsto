# equsto.com canlı deploy — Windows PowerShell
# Kullanım: .\scripts\deploy-canli.ps1
#           .\scripts\deploy-canli.ps1 -Ssh

param(
    [switch]$Ssh,
    [switch]$NoWatch
)

$ErrorActionPreference = "Stop"
$siteRoot = Split-Path -Parent $PSScriptRoot
Set-Location $siteRoot

$nodeArgs = @("scripts/deploy-canli.mjs")
if ($Ssh) { $nodeArgs += "--ssh" }
if ($NoWatch) { $nodeArgs += "--no-watch" }

& node @nodeArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
