#Requires -RunAsAdministrator
# DWG/DWT/DWS -> AutoCAD 2027 (acad.exe)
$acad2027 = 'C:\Program Files\Autodesk\AutoCAD 2027\acad.exe'
$progId = 'AutoCAD.Drawing.26'

if (-not (Test-Path -LiteralPath $acad2027)) {
  Write-Error "AutoCAD 2027 bulunamadi: $acad2027"
  exit 1
}

$cmd = "`"$acad2027`" `"%1`""

New-Item -Path "HKCU:\Software\Classes\$progId\shell\open\command" -Force | Out-Null
Set-ItemProperty -LiteralPath "HKCU:\Software\Classes\$progId\shell\open\command" -Name '(default)' -Value $cmd

New-Item -Path "HKLM:\SOFTWARE\Classes\$progId\shell\open\command" -Force | Out-Null
Set-ItemProperty -LiteralPath "HKLM:\SOFTWARE\Classes\$progId\shell\open\command" -Name '(default)' -Value $cmd

foreach ($ext in @('.dwg', '.dwt', '.dws')) {
  New-Item -Path "HKCU:\Software\Classes\$ext" -Force | Out-Null
  Set-ItemProperty -LiteralPath "HKCU:\Software\Classes\$ext" -Name '(default)' -Value $progId
  New-Item -Path "HKLM:\SOFTWARE\Classes\$ext" -Force | Out-Null
  Set-ItemProperty -LiteralPath "HKLM:\SOFTWARE\Classes\$ext" -Name '(default)' -Value $progId
  cmd /c "assoc $ext=$progId" | Out-Null
}

cmd /c "ftype $progId=$cmd"

Write-Host "Tamam. Varsayilan:"
cmd /c "assoc .dwg"
cmd /c "ftype $progId"
