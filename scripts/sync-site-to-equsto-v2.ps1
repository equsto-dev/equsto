# WORK site → eski equsto-v2 (Vercel geçişi öncesi deploy senkronu)
$src = "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
$dst = "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
robocopy $src $dst /MIR /XD node_modules .next .git /NFL /NDL /NP
if ($LASTEXITCODE -ge 8) { exit 1 }
Write-Host "OK: $src -> $dst"
