@echo off
title MarketingFlow SaaS Application
color 0A
echo ========================================================
echo        Starting MarketingFlow Full-Stack Services
echo ========================================================
echo.
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%

echo Opening http://localhost:5000 in your browser...
start "" http://localhost:5000

node launcher.js
pause
