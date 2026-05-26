# Avast Web Shield gecici kapat + Google Drive baslat (YONETICI)
$ErrorActionPreference = 'Stop'
$webKey = 'HKLM:\SOFTWARE\Avast Software\Avast\properties\WebShield\Common'
$log = Join-Path $env:TEMP 'equsto-drive-fix.log'

function Log($msg) {
    $line = "$(Get-Date -Format o) $msg"
    Add-Content -Path $log -Value $line
    Write-Host $line
}

Log '--- basladi ---'
$prev = Get-ItemProperty -Path $webKey -ErrorAction SilentlyContinue
$prevEnabled = $prev.ProviderEnabled
$prevTemp = $prev.TemporaryDisabled

try {
    Log "Onceki: ProviderEnabled=$prevEnabled TemporaryDisabled=$prevTemp"
    Set-ItemProperty -Path $webKey -Name 'TemporaryDisabled' -Value 1 -Type DWord
    Set-ItemProperty -Path $webKey -Name 'ProviderEnabled' -Value 0 -Type DWord
    Log 'WebShield devre disi yazildi; servis yenileniyor...'

    Restart-Service 'avast! Antivirus' -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5

    $curlOut = & curl.exe -sI 'https://www.googleapis.com/oauth2/v4/token' 2>&1
    $curlOut | Out-File (Join-Path $env:TEMP 'curl-after-webshield-off.txt')
    Log "curl exit=$LASTEXITCODE"
    if ($LASTEXITCODE -ne 0) {
        Log 'curl hala basarisiz.'
    }

    Get-Process GoogleDriveFS -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    $exe = Get-ChildItem 'C:\Program Files\Google\Drive File Stream\*\GoogleDriveFS.exe' |
        Sort-Object { [version]$_.Directory.Name } -Descending | Select-Object -First 1
    if ($exe) {
        Start-Process -FilePath $exe.FullName
        Log "Google Drive baslatildi: $($exe.FullName)"
    }
    Log 'TAMAM — sistem tepsisinden oturum acin. G: baglaninca hazir.'
}
catch {
    Log "HATA: $_"
    throw
}
