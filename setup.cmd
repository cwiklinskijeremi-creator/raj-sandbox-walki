@echo off
rem Przygotowuje projekt do uruchomienia lokalnie: pobiera three.js
rem i kopiuje go do js/vendor/. Uruchom raz po sklonowaniu repozytorium.
cd /d "%~dp0"
call npm install || goto :error
call npm run vendor:three || goto :error
echo.
echo Gotowe! Teraz uruchom serwer: kliknij prawym przyciskiem na serve.ps1
echo i wybierz "Uruchom w programie PowerShell", potem otworz http://localhost:8090/
pause
exit /b 0
:error
echo.
echo Blad. Upewnij sie, ze masz zainstalowany Node.js: https://nodejs.org
pause
exit /b 1
