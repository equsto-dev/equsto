@echo off
:: DWG -> AutoCAD 2027 (yönetici gerekir)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0set-dwg-autocad-2027.ps1\"\"'"
pause
