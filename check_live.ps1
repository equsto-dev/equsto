$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/shop/pisirme/agi-890-n")
Write-Host "Length: " $html.Length
Write-Host "JSON-LD count: " (($html -split "application/ld\+json").Count - 1)
# Check for Product schema
if ($html -match '"@type"\s*:\s*"Product"') { Write-Host "Product schema: FOUND" } else { Write-Host "Product schema: NOT FOUND" }
# Check for BreadcrumbList
if ($html -match '"@type"\s*:\s*"BreadcrumbList"') { Write-Host "BreadcrumbList schema: FOUND" } else { Write-Host "BreadcrumbList schema: NOT FOUND" }
# Check for Organization
if ($html -match '"@type"\s*:\s*"Organization"') { Write-Host "Organization schema: FOUND" } else { Write-Host "Organization schema: NOT FOUND" }
# Check for offers
if ($html -match '"offers"') { Write-Host "offers: FOUND" } else { Write-Host "offers: NOT FOUND" }
# Check for price
if ($html -match '"price"') { Write-Host "price: FOUND" } else { Write-Host "price: NOT FOUND" }