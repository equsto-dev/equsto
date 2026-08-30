$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/shop/pisirme/agi-890-n")
# Find all JSON-LD script blocks
$matches = [regex]::Matches($html, '<script type="application/ld\+json">(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Total script blocks: " $matches.Count
for ($i = 0; $i -lt $matches.Count; $i++) {
    $content = $matches[$i].Groups[1].Value
    Write-Host "--- Block $($i+1) ---"
    Write-Host $content.Substring(0, [Math]::Min(300, $content.Length))
}