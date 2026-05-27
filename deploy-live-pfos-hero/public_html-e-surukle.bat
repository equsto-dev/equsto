@echo off
chcp 65001 >nul
echo.
echo  Proje Fabrikasi vitrin - canli yukleme paketi
echo  =============================================
echo.
echo  1) cPanel Dosya Yoneticisi - public_html acin
echo  2) Bu klasordeki dosyalari public_html icine surukleyin (ustune yaz)
echo  3) equsto.com ana sayfada Ctrl+F5
echo.
echo  Paket klasoru aciliyor...
start "" "%~dp0"
notepad "%~dp0CANLI-YUKLE-OKU.txt"
pause
