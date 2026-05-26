# equsto.com -> public/ geri yukleme
$Base = "https://equsto.com"
$Public = Join-Path $PSScriptRoot "..\public"
$files = Get-Content (Join-Path $PSScriptRoot "restore-file-list.txt") -ErrorAction SilentlyContinue
if (-not $files) {
  $files = @(
    "index.html","admin.html","pfos.html","product.html","theme.js","theme.css","nav.js",
    "data/ekipmanlar.json","data/dept/tezgah.json"
  )
}
$ok = 0; $fail = 0
foreach ($rel in $files) {
  $rel = $rel.Trim()
  if (-not $rel) { continue }
  $dest = Join-Path $Public $rel
  $dir = Split-Path $dest -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  try {
    Invoke-WebRequest -Uri "$Base/$rel" -OutFile $dest -UseBasicParsing -TimeoutSec 120
    $n = (Get-Item $dest).Length
    Write-Host "OK $rel ($([math]::Round($n/1KB,1)) KB)"
    $ok++
  } catch {
    Write-Host "SKIP $rel"
    $fail++
  }
}
Write-Host "Bitti: $ok OK, $fail skip"
