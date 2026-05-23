@echo off
cd /d "%~dp0"
echo Klasor: %CD%
copy /Y .env.local .env
call npm run admin:config
echo.
echo Sunucu basliyor — durdurmak icin Ctrl+C
call npm run dev
