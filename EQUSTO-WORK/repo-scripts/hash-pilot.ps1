Get-ChildItem 'c:\D Disk\EQUSTO-CURSOR\public\data\images-oztiryakiler-pilot\*.jpg' | ForEach-Object {
    $h = (Get-FileHash $_.FullName -Algorithm MD5).Hash
    '{0,-32} {1,10:N0}  {2}' -f $_.Name, $_.Length, $h.Substring(0,12).ToLower()
}
