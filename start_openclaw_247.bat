@echo off
chcp 65001 >nul
title OpenClaw 24/7 Telegram Worker - Aesthetic Haven Studio
cd /d "%~dp0"

echo ========================================================
echo       OPENCLAW 24/7 WORKER - PINTEREST AUTOMATION
echo ========================================================
echo.
echo Worker is starting in high-availability auto-restart mode...
echo Press Ctrl+C to terminate.
echo.

:loop
node openclaw_worker.js
echo.
echo [WARNING] OpenClaw Worker exited unexpectedly. Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto loop
