@echo off
chcp 65001 >nul
set NPM=C:\Program Files\nodejs\npm.cmd
set SITE=%~dp0..\EQUSTO-WORK\E-TICARET\site
if not exist "%SITE%\package.json" set SITE=%~dp0..\E-TICARET\site

echo.
echo  Vercel Production deploy
echo  Site: %SITE%
echo.
echo  1) Tarayicida Vercel giris acilacak - onaylayin
echo  2) Root Directory panelde: EQUSTO-WORK/E-TICARET/site olmali
echo.

cd /d "%SITE%"
"%NPM%" exec vercel login
if errorlevel 1 exit /b 1
"%NPM%" exec vercel link --yes
"%NPM%" exec vercel deploy --prod
pause
