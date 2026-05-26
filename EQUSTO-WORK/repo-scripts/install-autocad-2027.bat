@echo off
:: AutoCAD 2027 — ODIS Installer + dogru manifest (-m)
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Yonetici izni isteniyor...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs -Wait"
  exit /b
)

taskkill /F /IM Installer.exe 2>nul
taskkill /F /IM AdskInstaller.exe 2>nul
timeout /t 2 /nobreak >nul

set "ODIS=C:\Program Files\Autodesk\AdODIS\V1\Installer.exe"
set "ACAD_WI=C:\Autodesk\WI\{8658A469-1448-38DD-8981-8BED78BCCF9D}\ACD_2027_en-US"
set "ACAD_IMG=C:\Autodesk\{C37F3429-A573-4904-91CE-F701DEC895CF}\image\ACD_2027_en-US"

if not exist "%ODIS%" (
  echo ODIS yok: %ODIS%
  pause
  exit /b 1
)

if exist "%ACAD_IMG%\setup.xml" (
  set "ACAD_DIR=%ACAD_IMG%"
) else if exist "%ACAD_WI%\setup.xml" (
  set "ACAD_DIR=%ACAD_WI%"
) else (
  echo AutoCAD 2027 setup.xml bulunamadi.
  echo manage.autodesk.com -^> AutoCAD 2027 Setup.exe indirin.
  pause
  exit /b 1
)

echo Kaynak: %ACAD_DIR%
echo.
echo NOT: Sadece cd + Installer.exe ACAD acmaz; -m manifest zorunlu.
echo.

start "" "%ODIS%" -m "%ACAD_DIR%\setup.xml" -s "%ACAD_DIR%" --exclude_odis_install --install_mode install

echo Kurulum baslatildi.
echo Pencerede "Autodesk AutoCAD 2027" yazmali.
echo Hala "Autodesk Installer" ise: Autodesk Access kullanin.
pause
