# PFOS kod aynalarini site'den gunceller (tek yon: site -> PFOS/kod)
$site = "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
$pfos = "C:\D Disk\EQUSTO-WORK\PFOS"

robocopy "$site\lib\pfos" "$pfos\kod\lib\pfos" /MIR /NFL /NDL /NP
robocopy "$site\components\pfos" "$pfos\kod\components\pfos" /MIR /NFL /NDL /NP
robocopy "$site\app\yonetim\(panel)\pfos" "$pfos\kod\app\yonetim\pfos" /E /NFL /NDL /NP
robocopy "$site\app\api\pfos" "$pfos\kod\app\api\pfos" /E /NFL /NDL /NP
robocopy "$site\public\data" "$pfos\listeler" pfos-*.json /NFL /NDL /NP
robocopy "$site\scripts" "$pfos\kod\scripts" *pfos* build-*-referanslar.py extract-pfos*.py test-pfos*.mjs /NFL /NDL /NP
Write-Host "OK: PFOS mirrors synced from site"
