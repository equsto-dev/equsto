$ErrorActionPreference = 'Stop'
$json = Get-Content 'c:\D Disk\EQUSTO-CURSOR\public\data\ekipmanlar.json' -Raw | ConvertFrom-Json
$oz = $json | Where-Object { $_.brand -match 'ztiryakiler' }
Write-Host ('Oztiryakiler total: ' + $oz.Count)
Write-Host ''
Write-Host 'First 8 products with model code highlights:'
$oz | Select-Object -First 8 | ForEach-Object {
    Write-Host ('- ' + $_.name)
    Write-Host ('    images: ' + ($_.images -join ' | '))
}
