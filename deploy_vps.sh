#!/bin/bash
# ==============================================================================
# OpenClaw 24/7 VPS Linux Automated Deployment Script
# Target OS: Ubuntu 20.04 / 22.04 / 24.04 LTS or Debian 11 / 12
# ==============================================================================

set -e

echo "======================================================================"
echo "    BẮT ĐẦU CÀI ĐẶT OPENCLAW WORKER 24/7 TRÊN VPS LINUX"
echo "======================================================================"

WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WORK_DIR"

echo "📍 Thư mục làm việc: $WORK_DIR"

# 1. CẬP NHẬT HỆ THỐNG & CÀI GÓI CƠ BẢN
echo "📦 [1/6] Cập nhật hệ điều hành và các gói bổ trợ..."
sudo apt-get update -y
sudo apt-get install -y curl wget git unzip gnupg ca-certificates build-essential libgbm-dev

# 2. CÀI ĐẶT NODE.JS (v20 LTS) & PM2
if ! command -v node &> /dev/null; then
    echo "🟢 [2/6] Đang cài đặt Node.js v20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js đã được cài đặt: $(node -v)"
fi

if ! command -v pm2 &> /dev/null; then
    echo "🟢 Cài đặt PM2 Process Manager toàn cục..."
    sudo npm install -g pm2
else
    echo "✅ PM2 đã có sẵn: $(pm2 -v)"
fi

# 3. CÀI ĐẶT GOOGLE CHROME VÀ DEPENDENCIES LINUX CHO CHROMIUM
echo "🌐 [3/6] Cài đặt Google Chrome Stable & thư viện đồ họa headless..."
if ! command -v google-chrome &> /dev/null; then
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    sudo apt-get update -y
    sudo apt-get install -y google-chrome-stable
fi

# Cài đặt Playwright dependencies hệ thống
echo "📦 Cài đặt thư viện Playwright dependencies..."
sudo npx playwright install-deps chromium || true

# 4. CÀI ĐẶT THƯ VIỆN NPM CHO DỰ ÁN
echo "📚 [4/6] Cài đặt các thư viện npm cho OpenClaw..."
npm install

# 5. CẤU HÌNH DỊCH VỤ CHROMIUM HEADLESS 24/7 (SYSTEMD SERVICE)
echo "⚙️ [5/6] Thiết lập dịch vụ Chromium Headless chạy nền với CDP port 9222..."

PROFILE_DIR="$WORK_DIR/chrome_profile"
mkdir -p "$PROFILE_DIR"
mkdir -p "$WORK_DIR/logs"

# Tạo systemd service cho Chromium headless
SERVICE_FILE="/etc/systemd/system/chromium-headless.service"
sudo bash -c "cat <<EOF > $SERVICE_FILE
[Unit]
Description=Chromium Headless Remote Debugging Service for OpenClaw
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$WORK_DIR
ExecStart=/usr/bin/google-chrome-stable --headless=new --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=$PROFILE_DIR --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer https://www.pinterest.com
Restart=always
RestartSec=5
StandardOutput=append:$WORK_DIR/logs/chromium-out.log
StandardError=append:$WORK_DIR/logs/chromium-err.log

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable chromium-headless
sudo systemctl restart chromium-headless

sleep 3

# Kiểm tra cổng 9222
if curl -s http://127.0.0.1:9222/json/version > /dev/null; then
    echo "✅ Chromium Headless đã kích hoạt thành công trên cổng 9222!"
else
    echo "⚠️ Đang đợi cổng 9222 mở..."
    sleep 3
fi

# 6. KHỞI CHẠY OPENCLAW WORKER BẰNG PM2 VÀ BẬT AUTO-BOOT KHI REBOOT VPS
echo "🚀 [6/6] Khởi động OpenClaw Worker với PM2..."
pm2 delete openclaw-worker 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Kích hoạt tự khởi động khi VPS reboot
STARTUP_CMD=$(pm2 startup systemd -u $(whoami) --hp $HOME | grep "sudo env")
if [ -n "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD"
fi

echo ""
echo "======================================================================"
echo "🎉 CHÚC MỪNG! HỆ THỐNG OPENCLAW ĐÃ TRIỂN KHAI THÀNH CÔNG TRÊN VPS!"
echo "======================================================================"
echo "• PM2 Process Status:"
pm2 status
echo ""
echo "• Các lệnh quản lý hữu ích:"
echo "   pm2 logs openclaw-worker      (Xem log thời gian thực)"
echo "   pm2 restart openclaw-worker   (Khởi động lại worker)"
echo "   sudo systemctl status chromium-headless (Kiểm tra browser)"
echo "======================================================================"
