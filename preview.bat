@echo off
chcp 65001 >nul
cd /d "%~dp0"

title Vorschau - Praxis Dr. Ehrlichmann

echo ============================================================
echo   Starte den Vorschau-Server der neuen Website...
echo.
echo   Der Browser wird automatisch geoeffnet: http://localhost:4321
echo.
echo   Bitte dieses Fenster geoeffnet lassen.
echo   Zum Beenden: Fenster schliessen oder Strg+C druecken.
echo ============================================================
echo.

if not exist "package.json" (
  echo FEHLER: package.json wurde nicht gefunden.
  echo Diese Datei muss im Hauptordner des Website-Projekts liegen.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo FEHLER: npm wurde nicht gefunden.
  echo Bitte Node.js installieren.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Erster Start: Abhaengigkeiten werden installiert, bitte warten...
  call npm install

  if errorlevel 1 (
    echo.
    echo FEHLER: npm install ist fehlgeschlagen.
    echo.
    pause
    exit /b 1
  )

  echo.
)

call npm run dev -- --open

echo.
echo Server wurde beendet.
pause

