@echo off
setlocal
cd /d "%~dp0"
if exist "%ProgramFiles%\nodejs\" set "PATH=%ProgramFiles%\nodejs;%PATH%"

where npm >nul 2>&1 || (echo npm yok: https://nodejs.org/ & exit /b 1)

if exist node_modules (
  echo Eski node_modules yedekleniyor...
  set "BAK=node_modules.bak.%RANDOM%"
  ren node_modules "%BAK%" 2>nul
  if exist node_modules (
    echo node_modules silinemiyor. Cursor/VS Code kapatip tekrar deneyin.
    echo veya klasoru OneDrive disina tasiyin.
    exit /b 1
  )
  echo Yedek: %BAK%
)

echo npm install...
call npm install
exit /b %ERRORLEVEL%
