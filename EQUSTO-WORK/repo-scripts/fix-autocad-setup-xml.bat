@echo off
:: Sag tik -> Yonetici olarak calistir (zorunlu)
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Yonetici izni isteniyor...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs -Wait"
  exit /b
)

taskkill /F /IM Installer.exe 2>nul
taskkill /F /IM AdskInstaller.exe 2>nul
timeout /t 2 /nobreak >nul

set "SRC=C:\Autodesk\WI\{29421846-DF68-3880-9427-4F539040F31B}\setup.xml"
set "DST=C:\Program Files\Autodesk\AdODIS\V1\setup.xml"

if not exist "%SRC%" (
  echo KAYNAK YOK: %SRC%
  echo manage.autodesk.com dan AutoCAD 2027 yeniden indirin.
  pause
  exit /b 1
)

copy /Y "%SRC%" "%DST%"
if errorlevel 1 (
  echo Kopya basarisiz. Antivirus / Autodesk kapatip tekrar deneyin.
  pause
  exit /b 1
)

echo OK: ODIS setup.xml yuklendi.
echo.
echo Simdi AutoCAD 2027 kurulumu baslatiliyor...
timeout /t 2 /nobreak >nul
call "%~dp0install-autocad-2027.bat"
exit /b
