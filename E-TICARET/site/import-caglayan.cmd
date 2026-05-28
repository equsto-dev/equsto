@echo off
setlocal
cd /d "%~dp0"

set "NODE="
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "NODE=%LOCALAPPDATA%\Programs\node\node.exe"
if not defined NODE if exist "%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe" (
  set "NODE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
)

if not defined NODE (
  echo Node.js bulunamadi. https://nodejs.org/ adresinden LTS kurun veya Cursor terminalini kullanin.
  exit /b 1
)

echo Node: %NODE%
"%NODE%" scripts\import-caglayan-market-reyon.mjs
if errorlevel 1 exit /b 1
"%NODE%" scripts\rebuild-ekipmanlar-from-dept.mjs
exit /b %ERRORLEVEL%
