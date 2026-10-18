@echo off
set VPS_USER=root
set VPS_IP=207.148.65.185

echo.
echo [1/2] Dang day file len VPS (%VPS_USER%@%VPS_IP%)...
scp aesthetic-haven-studio.tar.gz %VPS_USER%@%VPS_IP%:~/

echo.
echo [2/2] Dang giai nen va khoi dong PM2 tren VPS qua SSH...
ssh %VPS_USER%@%VPS_IP% "mkdir -p ~/aesthetic-haven-studio && tar -xzf ~/aesthetic-haven-studio.tar.gz -C ~/aesthetic-haven-studio && cd ~/aesthetic-haven-studio && pm2 start ecosystem.config.js --name openclaw-pinterest"

echo.
echo ====================================================
echo Da dong bo va kich hoat thanh cong tren VPS!
echo ====================================================
pause
