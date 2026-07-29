# Raj — Sandbox Walki

Przeglądarkowa, turowa gra taktyczna (heksy, K6 + K20). Czysty JavaScript bez
bundlera i frameworka — pliki w repo są serwowane wprost. Jedyna zależność to
three.js (widok 3D), kopiowana skryptem do `js/vendor/` (folder generowany,
poza gitem).

## Uruchomienie lokalne (raz po sklonowaniu)

Wymagany Node.js (https://nodejs.org).

- **Windows:** kliknij dwukrotnie `setup.cmd`
- **Mac/Linux:** uruchom `./setup.sh`

Skrypt robi dwie rzeczy: `npm install` (pobiera three.js do `node_modules/`)
i `npm run vendor:three` (kopiuje dwa pliki three.js do `js/vendor/`).

Potem wystartuj lokalny serwer (strona nie działa z pliku otwartego
podwójnym kliknięciem, bo moduły JS wymagają serwera HTTP):

- **Windows:** prawy przycisk na `serve.ps1` → „Uruchom w programie PowerShell"
- **Mac/Linux:** `python3 -m http.server 8090`

i otwórz http://localhost:8090/

## Deploy (GitHub Pages)

Push do `master` uruchamia `.github/workflows/deploy-pages.yml`, który sam
pobiera three.js, składa stronę (index.html, style.css, js/) i publikuje ją
na Pages. W ustawieniach repo Pages musi mieć źródło „GitHub Actions".

## Struktura

- `js/main.js` — stan gry i sterowanie (fazy, tury, zapis)
- `js/ui.js` — cały rendering 2D (SVG) i efekty
- `js/board3d.js` — opcjonalny widok 3D planszy (three.js, przełącznik w walce)
- `js/grid.js`, `js/combat.js` — czysta logika heksów i walki
- pozostałe `js/*.js` — dane (klasy, przeciwnicy, lokacje, ekwipunek, teksty)
- `scripts/vendor-three.mjs` — kopiuje three.js z `node_modules/` do `js/vendor/`
