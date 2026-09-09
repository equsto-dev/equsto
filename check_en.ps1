$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/en/shop/pisirme/agi-890-n")
if ($html -match '<link rel="canonical" href="([^"]+)"') { Write-Host "Canonical: $($matches[1])" }
$matches = [regex]::Matches($html, '<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"')
foreach ($m in $matches) { Write-Host "Hreflang: $($m.Groups[1].Value) -> $($m.Groups[2].Value)" }