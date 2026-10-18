@echo off
chcp 65001 >nul
echo ========================================================
echo    Aesthetic Haven Studio - Pinterest Auto Post Hub
echo ========================================================
echo.
cd /d "%~dp0"
python auto_post_pinterest.py
pause
