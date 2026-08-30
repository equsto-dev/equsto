$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString("https://equsto.com/")
$html.Substring(0, [Math]::Min(500, $html.Length))