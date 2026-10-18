# OpenClaw 24/7 Pinterest Telegram Worker

Hệ thống worker tự động hóa đăng bài Pinterest vận hành ngầm 24/7 điều khiển trực tiếp qua nút bấm Telegram dành cho thương hiệu **Aesthetic Haven Studio**.

---

## 🎮 Giao diện điều khiển Telegram Bot (@dell_worker_notify_bot)

Hệ thống được thiết kế với giao diện nút bấm hoàn chỉnh (ReplyKeyboard & InlineKeyboard):

1. **🟢 Trạng thái hệ thống**:
   - Thống kê RAM hệ thống (Used / Total / %) và RAM của Worker Process (RSS).
   - Uptime của VPS và Uptime của Worker.
   - Tình trạng kết nối Chrome CDP port 9222 và kiểm tra phiên Pinterest.
   - Trạng thái lịch tự động 24/7 và thông tin bài đăng gần nhất.

2. **🚀 Đăng bài ngay**:
   - Hiển thị menu inline gồm 4 ngách:
     * `✨ Room Decor & Lighting` (Ảnh pin1.jpg, Bảng Aesthetic Room Decor & Lighting)
     * `🍳 Smart Kitchen Finds` (Ảnh pin2.jpg, Bảng Smart Kitchen Gadgets & Hacks)
     * `📱 Digital Planners & iPad` (Ảnh pin3.jpg, Bảng Digital Planners & iPad Aesthetics)
     * `🖼️ Printable Wall Art` (Ảnh pin4.jpg, Bảng Printable Wall Art & Decor)
     * `⚡ Đăng toàn bộ 4 ngách (Batch Run)`: Đăng tuần tự toàn bộ 4 ngách.
   - Khi bấm nút, worker tự động chạy headless browser, thực hiện đăng Pin, chụp ảnh màn hình xác nhận và gửi trực tiếp ảnh về Telegram kèm thông tin chi tiết.

3. **⏰ Bật tự động 24/7**:
   - Kích hoạt lịch đăng bài định kỳ (mặc định 180 phút / bài xoay vòng giữa 4 ngách).
   - Thông báo bài đăng kế tiếp và tự động đăng ngầm liên tục.

4. **⏸️ Tạm dừng**:
   - Ngắt lịch đăng tự động để bảo dưỡng hoặc khi muốn tạm dừng.

5. **📋 Xem hàng đợi**:
   - Xem danh sách 4 bài viết trong hàng đợi kèm tiêu đề, bảng và liên kết đích.

---

## ⚙️ Cấu hình (.env)

File `.env` nằm tại thư mục gốc:
```env
TELEGRAM_BOT_TOKEN=8897196611:AAEADLqGGjz2V0SRXdX9PmaC2Za9AFiA9ps
TELEGRAM_CHAT_ID=7970044894
CDP_PORT=9222
CDP_HOST=127.0.0.1
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
CHROME_USER_DATA_DIR=C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio\chrome_user_data
AUTO_POST_INTERVAL_MINUTES=180
AUTO_POST_ENABLED=true
```

---

## 🚀 Hướng dẫn vận hành 24/7

### Cách 1: Chạy nền bằng PM2 (Khuyến nghị cho VPS Linux / Windows Server)
```bash
# Khởi động worker với PM2
npx pm2 start ecosystem.config.js

# Xem trạng thái
npx pm2 status

# Xem log trực tiếp
npx pm2 logs openclaw-worker

# Lưu trạng thái để tự khởi động cùng VPS khi reboot
npx pm2 save
```

### Cách 2: Chạy nền ẩn trên Windows (Silent Background Mode)
- Nhấp đúp vào file [**`run_worker_silent.vbs`**](file:///C:/Users/DELL/.gemini/antigravity/scratch/aesthetic-haven-studio/run_worker_silent.vbs): Worker sẽ chạy ngầm hoàn toàn không hiện cửa sổ console, có chế độ tự phục hồi (auto-restart) khi gặp sự cố.

### Cách 3: Chạy có giao diện Console kiểm tra
- Nhấp đúp vào file [**`start_openclaw_247.bat`**](file:///C:/Users/DELL/.gemini/antigravity/scratch/aesthetic-haven-studio/start_openclaw_247.bat).
