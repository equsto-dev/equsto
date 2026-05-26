# EQUSTO16052026 yedek → public/ + equsto-v2/public/ + deploy-live-pfos-besos/
# PFOS/BESOS HTML+JS: yedekte yoksa mevcut public/ (equsto.com'dan indirilmiş) kullanılır.
#
#   powershell -ExecutionPolicy Bypass -File scripts\merge-backup-pfos-besos.ps1

$ErrorActionPreference = "Continue"
$Root = Split-Path $PSScriptRoot -Parent
$Backup = Join-Path $Root "EQUSTO16052026\EQUSTO-CURSOR"
$Targets = @(
    (Join-Path $Root "public"),
    (Join-Path $Root "equsto-v2\public")
)
$DeployLive = Join-Path $Root "deploy-live-pfos-besos"

if (-not (Test-Path $Backup)) {
    Write-Error "Yedek bulunamadi: $Backup"
    exit 1
}

function Copy-IfNewer($src, $dest) {
    if (-not (Test-Path $src)) { return $false }
    $dir = Split-Path $dest -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Copy-Item -Path $src -Destination $dest -Force
    return $true
}

function Mirror-Tree($srcDir, $rel, $targetBase) {
    $from = Join-Path $srcDir $rel
    if (-not (Test-Path $from)) { return 0 }
    $n = 0
    Get-ChildItem $from -Recurse -File | ForEach-Object {
        $r = $_.FullName.Substring($from.Length).TrimStart("\")
        foreach ($t in $Targets) {
            $dest = Join-Path (Join-Path $t $rel) $r
            Copy-IfNewer $_.FullName $dest | Out-Null
        }
        $ddest = Join-Path (Join-Path $DeployLive $rel) $r
        Copy-IfNewer $_.FullName $ddest | Out-Null
        $n++
    }
    return $n
}

# --- Yedekten: veri + gorseller ---
$backupTrees = @(
    @{ Base = Join-Path $Backup "public"; Rels = @(
        "data\pfos-key-to-kategori.json",
        "data\advanced-cuisine-clear-ice",
        "data\vitrum-drawings",
        "images\besos"
    )},
    @{ Base = Join-Path $Backup "bar-design\EQUSTO-BAR-DESIGN-PAKET"; Rels = @("images\besos") },
    @{ Base = Join-Path $Backup "EQUSTO-SITE-PAKET"; Rels = @("images\besos") }
)

Write-Host "[merge] Yedek: $Backup"
$total = 0
foreach ($bt in $backupTrees) {
    foreach ($rel in $bt.Rels) {
        $c = Mirror-Tree $bt.Base $rel.Replace("\", "/") (Join-Path $Targets[0] "")
        if ($c -gt 0) { Write-Host "  yedek $rel → $c dosya" }
        $total += $c
    }
}

# pfos-key → public/data (duz yol)
$pk = Join-Path $Backup "public\data\pfos-key-to-kategori.json"
if (Test-Path $pk) {
    foreach ($t in $Targets) {
        Copy-IfNewer $pk (Join-Path $t "data\pfos-key-to-kategori.json") | Out-Null
    }
    Copy-IfNewer $pk (Join-Path $DeployLive "data\pfos-key-to-kategori.json") | Out-Null
}

# --- Canli/yerel PFOS+BESOS cekirdek (HTML, JS, vitrum json) ---
$coreFiles = @(
    "pfos.html", "bar-design.html", "bar-module.html", "besos\index.html",
    "equsto-engine.js", "pfos-rule-engine.js", "equsto-pricing-core.js", "pfos-pricing.js",
    "pfos-calc-engine.js", "pfos-location.js", "pfos-teklif-ui.js", "pfos-teklif-excel.js",
    "eq-pfos-programmatic-seo.js", "equsto-adres-national.js",
    "eq-bar-design-vitrum.js", "eq-bar-module-url.js", "eq-bar-module.js",
    "eq-besos-head-seo.js", "eq-besos-head-seo-config.js",
    "eq-youtube-embed.js", "eq-youtube-embed.css", "eq-auth-api.js",
    "theme.css", "theme.js", "nav.js", "equsto-logo.js", "eq-site-urls.js", "eq-i18n.js",
    "eq-analytics.js", "ecom-data.js", "ecom-cart.js", "equsto-member.js", "equsto-auth-client.js",
    "contact.css", "contact.js",
    "data\pfos-zone-catalog.json", "data\pfos-catalog.json", "data\pfos-projects.json",
    "data\vitrum-bars-landing.json", "data\vitrum-bar-projects.json",
    "assets\manifest-CtzHFPu3.json",
    "assets\besos-ice-mint-DUtHKFgd.png",
    "assets\besos-ice-bar-uGGlF5Nj.png",
    "assets\besos-ice-tong-DsigH4FN.png",
    "assets\besos-ice-diamond-DMNdO_4O.png",
    "assets\besos-ice-molds-6zkZE2su.png",
    "assets\besos-ice-sphere-NLq_ILu6.png",
    "images\home\hero-bar-cocktailstation.png",
    "og-cover-besos.jpg"
)

$srcPublic = Join-Path $Root "public"
if (-not (Test-Path $DeployLive)) { New-Item -ItemType Directory -Force -Path $DeployLive | Out-Null }

$coreOk = 0
foreach ($f in $coreFiles) {
    $src = Join-Path $srcPublic $f
    if (-not (Test-Path $src)) {
        Write-Host "  EKSIK (canlidan indirin): $f"
        continue
    }
    $dest = Join-Path $DeployLive $f
    if (Copy-IfNewer $src $dest) { $coreOk++ }
}

# Manifest
$manifest = Join-Path $Root "deploy-live-pfos-besos-MANIFEST.txt"
$coreFiles | Set-Content $manifest -Encoding UTF8

Write-Host ""
Write-Host "[merge] Yedekten kopyalanan dosya: ~$total"
Write-Host "[merge] Canliya paket: $DeployLive ($coreOk cekirdek dosya)"
Write-Host "[merge] Sonraki adim: deploy-live-pfos-besos/ icerigini cPanel public_html'e yukleyin"
Write-Host "        veya: powershell -File scripts\restore-pfos-besos-from-live.ps1 (eksik cekirdek icin)"
