@echo off
setlocal
cd /d "%~dp0"

if exist "%ProgramFiles%\nodejs\" set "PATH=%ProgramFiles%\nodejs;%PATH%"

where npm >nul 2>&1
if errorlevel 1 (
  echo npm bulunamadi — yalnizca statik sunucu.
  goto :static
)

where node >nul 2>&1
if errorlevel 1 (
  echo node bulunamadi.
  exit /b 1
)

if not exist "node_modules\next\dist\bin\next" (
  echo Bagimliliklar kuruluyor ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install basarisiz ^(Windows kilit / OneDrive^).
    echo Bozuk klasor yeniden adlandiriliyor...
    if exist node_modules (
      set "BAK=node_modules.bak.%RANDOM%"
      ren node_modules "%BAK%" 2>nul
    )
    call npm install
    if errorlevel 1 (
      echo.
      echo Next kurulamadi — statik vitrin sunucusu kullaniliyor.
      goto :static
    )
  )
)

if exist "node_modules\next\dist\bin\next" (
  echo [dev] Next.js
  call node scripts\generate-admin-config.mjs
  if errorlevel 1 exit /b 1
  call npx next dev
  exit /b %ERRORLEVEL%
)

:static
echo [dev] Statik onizleme ^(Next yok^)
call node scripts\generate-admin-config.mjs
if errorlevel 1 exit /b 1
call node scripts\dev-static.mjs
exit /b %ERRORLEVEL%
