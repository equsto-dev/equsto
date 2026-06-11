# PFOS/codex/yonetim-pfos-bundle — /yonetim/pfos Codex paketi
$ErrorActionPreference = "Stop"
$Site = "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
$Out = "C:\D Disk\EQUSTO-WORK\PFOS\codex\yonetim-pfos-bundle"

if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
New-Item -ItemType Directory -Path $Out -Force | Out-Null

function Copy-Rel($rel) {
  $src = Join-Path $Site $rel
  if (-not (Test-Path $src)) {
    Write-Warning "SKIP (yok): $rel"
    return
  }
  $dst = Join-Path $Out $rel
  $parent = Split-Path $dst -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
  if ((Get-Item $src).PSIsContainer) {
    Copy-Item $src $dst -Recurse -Force
  } else {
    Copy-Item $src $dst -Force
  }
  Write-Host "OK $rel"
}

# Giriş + yönetim kabuk
@(
  "app/yonetim/layout.tsx",
  "app/yonetim/giris/page.tsx",
  "app/yonetim/(panel)/layout.tsx",
  "app/yonetim/(panel)/pfos/page.tsx"
) | ForEach-Object { Copy-Rel $_ }

# API
@(
  "app/api/pfos/route.ts",
  "app/api/pfos/concepts/route.ts",
  "app/api/pfos/quote/route.ts",
  "app/api/pfos/kategoriler/route.ts",
  "app/api/pfos/projects/route.ts",
  "app/api/cms/route.ts"
) | ForEach-Object { Copy-Rel $_ }
Get-ChildItem (Join-Path $Site "app/api/yonetim") -Recurse -File -ErrorAction SilentlyContinue |
  ForEach-Object {
    $rel = $_.FullName.Substring($Site.Length + 1) -replace '\\', '/'
    Copy-Rel $rel
  }

# UI
Copy-Rel "components/pro/pro-shell.tsx"
Copy-Rel "components/pfos/pro"
Copy-Rel "components/pfos/steps"
@(
  "components/pfos/TeklifV14Proforma.tsx",
  "components/pfos/TeklifV14Onizleme.tsx",
  "components/pfos/TeklifSonucu.tsx",
  "components/pfos/pfos-styles.ts",
  "components/pfos/PFOSWizard.tsx",
  "components/pfos/PFOSStepNav.tsx"
) | ForEach-Object { Copy-Rel $_ }

# Lib
Copy-Rel "lib/pro-admin-client.ts"
Copy-Rel "lib/pfos"
@(
  "lib/auth.ts",
  "lib/admin-response.ts",
  "lib/legacy-data.ts",
  "lib/site-origin.ts"
) | ForEach-Object { Copy-Rel $_ }

# Veri (manifest + örnek; tam pfos-referans hariç)
@(
  "public/data/pfos-kategoriler.json",
  "public/data/proje-akis.json"
) | ForEach-Object { Copy-Rel $_ }

# Doküman
Copy-Rel "PFOS"
Copy-Rel "docs/PFOS-TEKLIF-SABLONU.md"
Copy-Rel "docs/PFOS-SEKTOR-TAKSONOMISI.md"
Copy-Rel "docs/PFOS-REFERANS-PROJELER.md"
Copy-Rel "docs/YONETIM-PRO.md"
Copy-Rel "docs/PFOS-DB-ENTEGRASYON-PLANI.md"

# next.config rewrite satırı için
Copy-Rel "next.config.ts"
Copy-Rel "package.json"

Copy-Item (Join-Path (Split-Path $PSScriptRoot -Parent) "CODEX-YONETIM-PFOS-HANDOFF.md") (Join-Path $Out "README-CODEX.md") -Force

$count = (Get-ChildItem $Out -Recurse -File).Count
Write-Host "`nBitti: $Out ($count dosya)"
