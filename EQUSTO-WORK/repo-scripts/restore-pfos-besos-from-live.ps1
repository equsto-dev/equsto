# equsto.com → public/ + equsto-v2/public/ (PFOS + BESOS tam paket)
#   powershell -ExecutionPolicy Bypass -File scripts/restore-pfos-besos-from-live.ps1

$ErrorActionPreference = "Continue"
$Base = "https://equsto.com"
$Root = Split-Path $PSScriptRoot -Parent
$Targets = @(
    (Join-Path $Root "public"),
    (Join-Path $Root "equsto-v2\public")
)

$Files = @(
    ".htaccess",
    "pfos.html", "bar-design.html", "bar-module.html", "besos/index.html",
    "theme.css", "theme.js", "nav.js", "equsto-logo.js", "eq-site-urls.js", "eq-i18n.js",
    "eq-analytics.js", "ecom-data.js", "ecom-cart.js", "equsto-member.js", "equsto-auth-client.js",
    "contact.css", "contact.js",
    "equsto-engine.js", "pfos-rule-engine.js", "equsto-pricing-core.js", "pfos-pricing.js",
    "pfos-calc-engine.js", "pfos-location.js", "pfos-teklif-ui.js", "pfos-teklif-excel.js",
    "eq-pfos-programmatic-seo.js", "equsto-adres-national.js",
    "eq-bar-design-vitrum.js", "eq-bar-module-url.js", "eq-bar-module.js",
    "eq-besos-head-seo.js", "eq-besos-head-seo-config.js",
    "eq-youtube-embed.js", "eq-youtube-embed.css", "eq-auth-api.js",
    "data/pfos-zone-catalog.json", "data/pfos-catalog.json", "data/pfos-projects.json",
    "data/vitrum-bars-landing.json", "data/vitrum-bar-projects.json", "data/fiyatlar.json",
    "assets/manifest-CtzHFPu3.json",
    "assets/besos-ice-mint-DUtHKFgd.png",
    "assets/besos-ice-bar-uGGlF5Nj.png",
    "assets/besos-ice-tong-DsigH4FN.png",
    "assets/besos-ice-diamond-DMNdO_4O.png",
    "assets/besos-ice-molds-6zkZE2su.png",
    "assets/besos-ice-sphere-NLq_ILu6.png",
    "images/home/hero-bar-cocktailstation.png",
    "images/home/hero-yer-sofrasi-bufe.png"
)

function Download-ToTarget($rel, $targetDir) {
    $url = "$Base/$($rel -replace '\\','/')"
    $dest = Join-Path $targetDir $rel
    $dir = Split-Path $dest -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 120
        return $true
    } catch {
        return $false
    }
}

Write-Host "[restore] Kaynak: $Base"
foreach ($target in $Targets) {
    if (-not (Test-Path $target)) { New-Item -ItemType Directory -Force -Path $target | Out-Null }
    Write-Host "[restore] Hedef: $target"
    $ok = 0; $fail = 0
    foreach ($f in $Files) {
        if (Download-ToTarget $f $target) {
            Write-Host "  OK $f"
            $ok++
        } else {
            Write-Host "  SKIP $f"
            $fail++
        }
    }
    $og = Join-Path $target "og-cover-besos.jpg"
    $hero = Join-Path $target "images/home/hero-bar-cocktailstation.png"
    if ((Test-Path $hero) -and -not (Test-Path $og)) {
        Copy-Item $hero $og -Force
        Write-Host "  OK og-cover-besos.jpg (kopya)"
    }
    Write-Host "[restore] $target → $ok OK, $fail SKIP`n"
}

Write-Host "[restore] Bitti. cPanel: public/ dosyalarini public_html'e yukleyin."
