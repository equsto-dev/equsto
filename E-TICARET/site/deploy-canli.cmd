@echo off
REM equsto.com canlı deploy — çift tık veya: deploy-canli.cmd
cd /d "%~dp0"
node scripts\deploy-canli.mjs %*
exit /b %ERRORLEVEL%
