# Google Drive SSL onarimi — Avast Web Shield eksik zincir (curl 60 / schannel)
# Yonetici PowerShell ile calistirin:  Set-ExecutionPolicy -Scope Process Bypass; .\scripts\fix-google-drive-ssl.ps1

$ErrorActionPreference = 'Stop'
$certPath = Join-Path $env:TEMP 'avast-web-shield-root.cer'

function Get-AvastShieldRootCert {
    $tcp = New-Object System.Net.Sockets.TcpClient('www.googleapis.com', 443)
    try {
        $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, ({ $true }))
        $ssl.AuthenticateAsClient('www.googleapis.com')
        $remote = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
        $chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
        $chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::NoCheck
        [void]$chain.Build($remote)
        foreach ($el in $chain.ChainElements) {
            if ($el.Certificate.Subject -match 'Avast Web/Mail Shield') {
                return $el.Certificate
            }
        }
        throw 'Avast Web/Mail Shield sertifikasi zincirde bulunamadi.'
    }
    finally {
        if ($ssl) { $ssl.Dispose() }
        $tcp.Close()
    }
}

Write-Host 'Avast SSL kok sertifikasi aliniyor...'
$avastCert = Get-AvastShieldRootCert
Export-Certificate -Cert $avastCert -FilePath $certPath -Force | Out-Null
Write-Host "Kaydedildi: $certPath"

Write-Host 'Ara sertifika deposuna ekleniyor (yönetici gerekir)...'
certutil -addstore -f CA $certPath | Out-Host
certutil -addstore -f Root $certPath | Out-Host

Write-Host 'curl ile dogrulama...'
$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curl) {
    & curl.exe -sI 'https://www.googleapis.com/oauth2/v4/token' 2>&1 | Select-Object -First 5
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "curl hala basarisiz (exit $LASTEXITCODE). Avast > Koruma > Cekirdek Kalkanlar > Web Kalkani > SSL taramasini KAPATIN."
    }
    else {
        Write-Host 'curl HTTPS OK.'
    }
}

Write-Host 'Google Drive yeniden baslatiliyor...'
Get-Process GoogleDriveFS -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
$exe = Get-ChildItem 'C:\Program Files\Google\Drive File Stream\*\GoogleDriveFS.exe' -ErrorAction SilentlyContinue |
    Sort-Object { [version]$_.Directory.Name } -Descending |
    Select-Object -First 1
if ($exe) {
    Start-Process -FilePath $exe.FullName
    Write-Host "Baslatildi: $($exe.FullName)"
    Write-Host 'Sistem tepsisinden Oturum acin; G: surucusu baglaninca Dosya Gezgini > Google Drive gorunur.'
}
else {
    Write-Warning 'GoogleDriveFS.exe bulunamadi.'
}
