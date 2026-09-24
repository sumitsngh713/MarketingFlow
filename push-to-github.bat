@echo off
title Push MarketingFlow to GitHub
color 0B
echo ========================================================
echo        Pushing MarketingFlow to GitHub Repository
echo ========================================================
echo.
cd /d "%~dp0"
set PATH=%LOCALAPPDATA%\MinGit\cmd;C:\Program Files\nodejs;%PATH%

echo Pushing complete source code (client + server + render.yaml) to GitHub...
echo (If prompted, please authorize in your browser window)
echo.
git push -u origin main --force

echo.
echo ========================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo Now go back to Render and click 'Manual sync'!
) else (
    echo [FAILED] Push failed. Please check your GitHub permissions.
)
echo ========================================================
pause
