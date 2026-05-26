# AutoCAD 4000 fix: Public Documents klasoru (Yonetici PowerShell)
# Kullanim: sag tik -> Yonetici olarak calistir
$ErrorActionPreference = "Stop"
$docs = "C:\Users\Public\Documents"
if (-not (Test-Path $docs)) {
  New-Item -ItemType Directory -Path $docs -Force | Out-Null
  Write-Host "Olusturuldu: $docs"
} else {
  Write-Host "Zaten var: $docs"
}
# ACL: Users okuma/yazma
icacls $docs /grant "Users:(OI)(CI)M" /T 2>$null | Out-Null
Write-Host "CommonDocuments:" ([Environment]::GetFolderPath('CommonDocuments'))
Write-Host "Tamam. Autodesk kurulumunu Yonetici olarak tekrar deneyin."
