# Yerel Vite / node dinleyicilerini kapatir (5173-5199).
$ErrorActionPreference = 'SilentlyContinue'

function Get-ListenPidsForPortRange {
  param([int]$From, [int]$To)
  $pids = @{}
  foreach ($port in $From..$To) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object {
        $id = [int]$_.OwningProcess
        if ($id -gt 0) { $pids[$id] = $true }
      }
  }
    # netstat yedek (Get-NetTCPConnection bos donerse)
  $netstat = netstat -ano -p tcp 2>$null
  if ($netstat) {
    foreach ($line in $netstat) {
      if ($line -notmatch '^\s*TCP\s+[\d.:]+\:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') { continue }
      $port = [int]$Matches[1]
      $id = [int]$Matches[2]
      if ($port -ge $From -and $port -le $To -and $id -gt 0) { $pids[$id] = $true }
    }
  }
  return $pids.Keys
}

$rangeFrom = 5173
$rangeTo = 5199
$attempted = @{}
$netstatLines = @(netstat -ano -p tcp 2>$null)

foreach ($procId in (Get-ListenPidsForPortRange -From $rangeFrom -To $rangeTo)) {
  if ($attempted[$procId]) { continue }
  $attempted[$procId] = $true
  $name = ''
  try { $name = (Get-Process -Id $procId -ErrorAction Stop).ProcessName } catch {}
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  cmd /c "taskkill /F /T /PID $procId" 2>$null | Out-Null
  if ($name -eq 'node' -or $name -eq 'esbuild') {
    Write-Host "Durduruldu: PID $procId ($name)"
  } else {
    Write-Host "Durduruldu: PID $procId"
  }
}

Start-Sleep -Seconds 2

$still = @()
foreach ($port in $rangeFrom..$rangeTo) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { $still += [pscustomobject]@{ Port = $port; PID = $_.OwningProcess } }
}
if (-not $still.Count -and $netstatLines.Count) {
  foreach ($line in $netstatLines) {
    if ($line -notmatch '^\s*TCP\s+[\d.:]+\:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$') { continue }
    $port = [int]$Matches[1]
    $id = [int]$Matches[2]
    if ($port -ge $rangeFrom -and $port -le $rangeTo) {
      $still += [pscustomobject]@{ Port = $port; PID = $id }
    }
  }
}

Write-Host "Denenen process: $($attempted.Count)"
if ($still.Count) {
  $still | Sort-Object Port -Unique | ForEach-Object {
    Write-Host "Hala dinliyor: port $($_.Port) PID $($_.PID)"
  }
  Write-Host ""
  Write-Host "Bu PID'leri Task Manager'dan kapatin veya yonetici PowerShell:"
  Write-Host "  taskkill /F /T /PID <pid>"
} else {
  Write-Host "Portlar $rangeFrom-$rangeTo bos."
}
