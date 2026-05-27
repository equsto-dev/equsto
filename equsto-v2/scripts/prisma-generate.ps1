# Prisma client — sadece prisma/generated/client (node_modules\.prisma yazilmaz)
# Kullanım: powershell -ExecutionPolicy Bypass -File scripts/prisma-generate.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$env:PRISMA_SKIP_POSTINSTALL_GENERATE = "true"

Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
  $_.MainWindowTitle -eq "" -and $_.Path -notlike "*cursor*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Remove-Item -Recurse -Force "prisma\generated\client" -ErrorAction SilentlyContinue
if (Test-Path "node_modules\.prisma") {
  attrib -R "node_modules\.prisma\*" /S /D 2>$null
  Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
}

npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "[ok] prisma/generated/client — import: @/lib/prisma"
