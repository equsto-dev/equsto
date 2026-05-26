@echo off
:: Yonetici CMD olarak calistirin. Kurulum penceresi KAPALI olmali.
echo Autodesk servisleri durduruluyor...
taskkill /F /IM AdskInstaller.exe 2>nul
taskkill /F /IM AdODIS-installer.exe 2>nul
taskkill /F /IM AutodeskDesktopApp.exe 2>nul
taskkill /F /IM AdAppMgr.exe 2>nul
taskkill /F /IM AdskUpdateService.exe 2>nul
taskkill /F /IM Setup.exe 2>nul
timeout /t 3 /nobreak >nul

echo ODIS onbellek siliniyor...
rd /s /q "%LOCALAPPDATA%\Autodesk\ODIS" 2>nul
rd /s /q "%ProgramData%\Autodesk\ODIS" 2>nul
rd /s /q "%TEMP%\Autodesk" 2>nul
rd /s /q "%LOCALAPPDATA%\Temp\Autodesk*" 2>nul

if exist "C:\Users\Public\Documents" (
  echo OK: Public Documents var
) else (
  mkdir "C:\Users\Public\Documents" 2>nul
  echo Olusturuldu: Public Documents
)

:: ODIS bootstrap setup.xml (Installer.exe bunu arar)
set "ODIS_SETUP_SRC=C:\Autodesk\WI\{29421846-DF68-3880-9427-4F539040F31B}\setup.xml"
set "ODIS_SETUP_DST=C:\Program Files\Autodesk\AdODIS\V1\setup.xml"
if exist "%ODIS_SETUP_SRC%" (
  copy /Y "%ODIS_SETUP_SRC%" "%ODIS_SETUP_DST%" >nul 2>&1
  if exist "%ODIS_SETUP_DST%" (echo OK: setup.xml geri yuklendi) else (echo UYARI: setup.xml kopyalanamadi)
) else (
  echo UYARI: %ODIS_SETUP_SRC% yok - manage.autodesk.com dan yeniden indirin
)

echo.
echo Simdi: "C:\Program Files\Autodesk\AdODIS\V1\Installer.exe" - Yonetici olarak calistir
pause
