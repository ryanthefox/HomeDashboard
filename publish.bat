@echo off
title Home Dashboard — Publiceren
cd /d "%~dp0"

echo.
echo [1/4] Frontend bouwen...
cd frontend
call npm install
if errorlevel 1 (
    echo FOUT: npm install mislukt.
    pause & exit /b 1
)
call npm run build
if errorlevel 1 (
    echo FOUT: frontend build mislukt.
    pause & exit /b 1
)
cd ..

echo.
echo [2/4] Draaiende instantie stoppen (als actief)...
taskkill /f /im HomeDashboard.Api.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [3/4] Backend publiceren als zelfstandige app...
dotnet publish HomeDashboard.Api -c Release -r win-x64 --self-contained true -o release\app
if errorlevel 1 (
    echo FOUT: dotnet publish mislukt.
    pause & exit /b 1
)

echo.
echo [4/4] Frontend kopiëren naar release\frontend\dist ...
robocopy frontend\dist release\frontend\dist /E /NFL /NDL /NJH /NJS > nul

echo.
echo ============================================
echo  Klaar! Start de app via:
echo    release\start.bat
echo  Of maak een snelkoppeling naar dat bestand.
echo ============================================
pause
