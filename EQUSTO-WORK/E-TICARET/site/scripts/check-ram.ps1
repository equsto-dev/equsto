Write-Host "=== Bellek (Performance Counter) ==="
$avail = (Get-Counter '\Memory\Available MBytes' -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue
$commitLimit = (Get-Counter '\Memory\Commit Limit' -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue
$committed = (Get-Counter '\Memory\Committed Bytes' -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue
Write-Host ("Kullanilabilir RAM: {0:N0} MB" -f $avail)
Write-Host ("Commit limit: {0:N0} MB" -f ($commitLimit/1MB))
Write-Host ("Committed: {0:N0} MB" -f ($committed/1MB))

Write-Host "`n=== C: disk ==="
$disk = Get-PSDrive C -ErrorAction SilentlyContinue
if ($disk) {
  Write-Host ("Bos: {0:N1} GB" -f ($disk.Free/1GB))
  Write-Host ("Dolu: {0:N1} GB" -f ($disk.Used/1GB))
}

Write-Host "`n=== pagefile.sys ==="
$pf = Get-Item C:\pagefile.sys -Force -ErrorAction SilentlyContinue
if ($pf) { Write-Host ("Boyut: {0:N1} GB" -f ($pf.Length/1GB)) }

Write-Host "`n=== Node / Next processleri ==="
Get-Process node -ErrorAction SilentlyContinue |
  Sort-Object WorkingSet64 -Descending |
  Select-Object -First 8 Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB)}}

Write-Host "`n=== Registry PagingFiles ==="
$mm = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management"
Write-Host ($mm.PagingFiles -join "`n")
