@echo off
setlocal
cd /d "%~dp0"

set "NPM="
if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM=%ProgramFiles%\nodejs\npm.cmd"
if not defined NPM if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "NPM=%ProgramFiles(x86)%\nodejs\npm.cmd"

if not defined NPM (
  echo npm.cmd bulunamadi. Node.js LTS kurun: https://nodejs.org/
  echo Alternatif: cmd /c "npm run build"
  exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%PATH%"
echo Build: %CD%
call "%NPM%" run build
exit /b %ERRORLEVEL%
