@echo off
title Home Dashboard — Dev
cd /d "%~dp0"

echo [Dev] Backend starten op http://localhost:5000 ...
start "HomeDashboard Backend" cmd /k "dotnet run --project HomeDashboard.Api"

echo [Dev] Frontend dev-server starten op http://localhost:5173 ...
start "HomeDashboard Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 4 /nobreak > nul
start http://localhost:5173
