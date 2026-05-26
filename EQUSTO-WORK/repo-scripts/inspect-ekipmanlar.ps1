$ErrorActionPreference = 'Stop'
$json = Get-Content 'c:\D Disk\EQUSTO-CURSOR\public\data\ekipmanlar.json' -Raw | ConvertFrom-Json
Write-Host ('Total products: ' + $json.Count)
Write-Host ''
Write-Host 'Brands (count - name):'
$json | Group-Object brand | Sort-Object Count -Descending | ForEach-Object { Write-Host ($_.Count.ToString().PadLeft(5) + '  ' + $_.Name) }
Write-Host ''
Write-Host 'Categories (count - name):'
$json | Group-Object category | Sort-Object Count -Descending | ForEach-Object { Write-Host ($_.Count.ToString().PadLeft(5) + '  ' + $_.Name) }
