$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/")
Write-Host $html.Length
Write-Host (($html -split "application/ld\+json").Count - 1)