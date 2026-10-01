# Canlı çeviri — cihazları otomatik seçip başlatır
# Kullanım:  .\baslat.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Host "Once kur:  python -m venv .venv ; .\.venv\Scripts\Activate.ps1 ; pip install -r requirements.txt"
    exit 1
}

$py = ".\.venv\Scripts\python.exe"

Write-Host "=== Ses cihazlari ===" -ForegroundColor Cyan
& $py canli_ceviri.py --list

Write-Host ""
Write-Host "Varsayilan hoparlor ile baslatiliyor (yayin + Turkce ayni cihaz)..." -ForegroundColor Green
Write-Host "Durdurmak: Ctrl+C" -ForegroundColor DarkGray
Write-Host ""

# --in/--out vermeden: sistem varsayilan hoparlor
& $py canli_ceviri.py
