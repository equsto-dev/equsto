$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/shop/pisirme/agi-890-n")
# Find the Product+BreadcrumbList block (3rd one)
$matches = [regex]::Matches($html, '<script type="application/ld\+json">(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($matches.Count -ge 3) {
    $content = $matches[2].Groups[1].Value
    Write-Host $content
}