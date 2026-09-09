$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/shop/pisirme/agi-890-n")
# Check canonical
if ($html -match '<link rel="canonical" href="([^"]+)"') { Write-Host "Canonical: $($matches[1])" }
# Check hreflang
$matches = [regex]::Matches($html, '<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"')
foreach ($m in $matches) { Write-Host "Hreflang: $($m.Groups[1].Value) -> $($m.Groups[2].Value)" }