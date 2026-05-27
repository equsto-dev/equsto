@echo off
title Equsto vitrin — localhost:3000
cd /d "%~dp0"
if exist "%ProgramFiles%\nodejs\" set "PATH=%ProgramFiles%\nodejs;%PATH%"

echo.
echo  Vitrin sunucusu baslatiliyor...
echo  Bu pencereyi KAPATMAYIN.
echo.
echo  http://127.0.0.1:3000/shop/market-reyonlari
echo.

node scripts\generate-admin-config.mjs
node scripts\dev-static.mjs
echo.
echo Sunucu durdu. Bir tusa basin...
pause >nul
