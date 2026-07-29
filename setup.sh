#!/bin/sh
# Przygotowuje projekt do uruchomienia lokalnie: pobiera three.js
# i kopiuje go do js/vendor/. Uruchom raz po sklonowaniu repozytorium.
set -e
cd "$(dirname "$0")"
npm install
npm run vendor:three
echo ""
echo "Gotowe! Teraz uruchom serwer, np.: python3 -m http.server 8090"
echo "i otwórz http://localhost:8090/"
