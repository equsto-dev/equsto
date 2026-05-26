@echo off
:: 1) Avast arayuzunu acar  2) Google Drive baslatir
:: SSL taramasini Avast icinden KAPATMANIZ gerekir (asagidaki adimlar)
start "" "C:\Program Files\Avast Software\Avast\AvastUI.exe"
for /f "delims=" %%I in ('dir /b /ad "C:\Program Files\Google\Drive File Stream" ^| sort /r') do (
  start "" "C:\Program Files\Google\Drive File Stream\%%I\GoogleDriveFS.exe"
  goto :drive
)
:drive
echo.
echo Avast: Koruma ^> Cekirdek Kalkanlar ^> Web Kalkani ^> HTTPS/SSL taramasi KAPAT
echo Sonra Google Drive tepsisinden Oturum ac.
pause
