$allUrls = @()
Get-ChildItem "C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\sitemap-shop-products*.xml" | ForEach-Object {
    $xml = [xml](Get-Content $_.FullName)
    $xml.urlset.url | ForEach-Object { $allUrls += $_.loc }
}
$duplicates = $allUrls | Group-Object | Where-Object { $_.Count -gt 1 }
if ($duplicates) {
    Write-Host "DUPLICATES FOUND:"
    $duplicates | ForEach-Object { Write-Host "$($_.Name) - $($_.Count) times" }
} else {
    Write-Host "No duplicates found. Total unique URLs: $($allUrls.Count)"
}