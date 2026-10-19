/**
 * OpenClaw Pinterest Publisher Worker
 * Automatically publishes pins from pinterest_queue.json
 * Connects to persistent Chromium on CDP port 9222
 * Reports to Telegram Bot @dell_worker_notify_bot
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const CDP_HOST = process.env.CDP_HOST || '127.0.0.1';
const CDP_PORT = process.env.CDP_PORT || 9222;
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_USER_DATA = path.resolve(__dirname, 'chrome_user_data');
const QUEUE_FILE = path.join(__dirname, 'pinterest_queue.json');
const STATE_FILE = path.join(__dirname, 'pinterest_storage_state.json');
const LOGS_DIR = path.join(__dirname, 'logs');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function checkCdpAlive() {
  return new Promise((resolve) => {
    const req = http.get(`http://${CDP_HOST}:${CDP_PORT}/json/version`, { timeout: 1500 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ alive: true, browser: json.Browser || 'Chrome' });
        } catch {
          resolve({ alive: true, browser: 'Chrome' });
        }
      });
    });
    req.on('error', () => resolve({ alive: false }));
    req.on('timeout', () => { req.destroy(); resolve({ alive: false }); });
  });
}

async function ensureChromeRunning() {
  const cdp = await checkCdpAlive();
  if (cdp.alive) {
    return;
  }

  console.log('[OpenClaw] Chrome CDP not detected. Spawning Chrome daemon with persistent profile...');
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-allow-origins=*',
    `--user-data-dir=${CHROME_USER_DATA}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    'https://www.pinterest.com'
  ];

  const proc = spawn(CHROME_PATH, args, {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const check = await checkCdpAlive();
    if (check.alive) {
      console.log(`[OpenClaw] Chrome started successfully on port ${CDP_PORT}`);
      return;
    }
  }
}

// Telegram notifier helper using native fetch
async function sendTelegramNotification(text, photoPath = null) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    if (photoPath && fs.existsSync(photoPath)) {
      const { FormData, Blob } = await import('node-fetch-native').catch(() => ({}));
      // Use multipart via form-data or standard fetch if available
      const buffer = fs.readFileSync(photoPath);
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      
      const parts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${text}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${path.basename(photoPath)}"\r\nContent-Type: image/png\r\n\r\n`
      ];
      
      const preBuffer = Buffer.from(parts.join(''), 'utf8');
      const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
      const fullBuffer = Buffer.concat([preBuffer, buffer, postBuffer]);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: fullBuffer
      });
      return;
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.warn('[Telegram] Could not send notification:', err.message);
  }
}

// Load Queue
function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) {
    throw new Error(`Queue file not found: ${QUEUE_FILE}`);
  }
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

// Save Queue
function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

// Publish single pin function
async function publishPin(pinItem) {
  console.log(`\n======================================================`);
  console.log(`[*] BẮT ĐẦU ĐĂNG PIN: [${pinItem.id}] ${pinItem.title}`);
  console.log(`======================================================`);

  const imageFullPath = path.isAbsolute(pinItem.image_path)
    ? pinItem.image_path
    : path.resolve(__dirname, pinItem.image_path);

  if (!fs.existsSync(imageFullPath)) {
    throw new Error(`File ảnh không tồn tại: ${imageFullPath}`);
  }

  // 1. Kết nối qua CDP 9222 hoặc khởi chạy tự động
  let browser = null;
  let context = null;
  const cdp = await checkCdpAlive();

  if (cdp.alive) {
    console.log(`[1/6] Kết nối Chromium qua CDP: http://${CDP_HOST}:${CDP_PORT}...`);
    browser = await chromium.connectOverCDP(`http://${CDP_HOST}:${CDP_PORT}`);
    context = browser.contexts()[0] || await browser.newContext();
  } else {
    console.log(`[1/6] CDP không mở, khởi chạy Chromium với authenticated cookies...`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    });
  }

  // Nạp session Pinterest
  if (fs.existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (state.cookies && state.cookies.length > 0) {
        await context.addCookies(state.cookies);
        console.log(`      Đã nạp ${state.cookies.length} cookies Pinterest từ storage state.`);
      }
    } catch (e) {
      console.warn('      Lỗi nạp cookie:', e.message);
    }
  }

  const page = await context.newPage();
  page.setDefaultTimeout(40000);

  try {
    // 2. Mở công cụ tạo Pin
    console.log('[2/6] Đang mở trang tạo Pin: https://www.pinterest.com/pin-creation-tool/...');
    await page.goto('https://www.pinterest.com/pin-creation-tool/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(4000);

    // Kiểm tra đăng nhập
    const loginBtn = await page.$('[data-test-id="simple-login-button"], button:has-text("Đăng nhập")');
    if (loginBtn) {
      throw new Error('Phiên đăng nhập Pinterest không khả dụng. Vui lòng kiểm tra lại cookie xác thực.');
    }

    // 3. Upload ảnh Pin
    console.log(`[3/6] Upload ảnh: ${path.basename(imageFullPath)} (${(fs.statSync(imageFullPath).size / 1024).toFixed(1)} KB)...`);
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 15000 });
    await fileInput.setInputFiles(imageFullPath);
    await page.waitForTimeout(3000);

    // 4. Điền Title
    console.log('[4/6] Điền tiêu đề, mô tả và destination link...');
    const titleSelectors = [
      '[data-test-id="pin-draft-title"] input',
      'input[id*="title"]',
      'textarea[id*="title"]',
      'input[placeholder*="title" i]',
      'input[placeholder*="tiêu đề" i]',
      'textarea[placeholder*="title" i]',
      'textarea[placeholder*="tiêu đề" i]'
    ];
    for (const sel of titleSelectors) {
      const el = await page.$(sel);
      if (el && await el.isVisible()) {
        await el.click();
        await el.fill(pinItem.title);
        console.log('      -> Đã điền Tiêu đề.');
        break;
      }
    }

    // 5. Điền Description (kèm hashtag từ tags nếu chưa có)
    let fullDesc = pinItem.description;
    if (pinItem.tags && pinItem.tags.length > 0 && !fullDesc.includes('#')) {
      const hashtags = pinItem.tags.slice(0, 6).map(t => '#' + t.replace(/\s+/g, '')).join(' ');
      fullDesc += '\n\n' + hashtags;
    }

    const descSelectors = [
      '[data-test-id="pin-draft-description"]',
      'div[contenteditable="true"][aria-label*="description" i]',
      'div[contenteditable="true"][aria-label*="mô tả" i]',
      'div[contenteditable="true"]',
      'textarea[id*="description"]'
    ];
    for (const sel of descSelectors) {
      const el = await page.$(sel);
      if (el && await el.isVisible()) {
        await el.click();
        await el.fill(fullDesc);
        console.log('      -> Đã điền Mô tả + Hashtags.');
        break;
      }
    }

    // 6. Điền Link Đích
    const linkSelectors = [
      '[data-test-id="pin-draft-link"] input',
      'input[id*="link"]',
      'input[placeholder*="link" i]',
      'input[placeholder*="liên kết" i]',
      'input[placeholder*="URL" i]'
    ];
    for (const sel of linkSelectors) {
      const el = await page.$(sel);
      if (el && await el.isVisible()) {
        await el.click();
        await el.fill(pinItem.destination_link);
        console.log(`      -> Đã điền Destination Link: ${pinItem.destination_link}`);
        break;
      }
    }

    // 7. Chọn / Tạo Bảng (Board)
    console.log(`[5/6] Chọn bảng: "${pinItem.board}"...`);
    const boardBtn = await page.$(
      '[data-test-id="board-dropdown-select-button"], button[aria-haspopup="listbox"], button:has-text("Choose a board"), button:has-text("Chọn bảng"), button[aria-label*="bảng" i]'
    );
    if (boardBtn) {
      await boardBtn.click();
      await page.waitForTimeout(1500);

      const searchInput = await page.$(
        '[data-test-id="board-search-input"] input, input[placeholder*="Search" i], input[placeholder*="Tìm kiếm" i]'
      );
      if (searchInput && await searchInput.isVisible()) {
        await searchInput.fill(pinItem.board);
        await page.waitForTimeout(1200);
      }

      const boardItem = await page.$(
        `div[title="${pinItem.board}"], div:has-text("${pinItem.board}")`
      );
      if (boardItem && await boardItem.isVisible()) {
        await boardItem.click();
        console.log(`      -> Đã chọn bảng có sẵn: "${pinItem.board}"`);
      } else {
        console.log(`      -> Bảng chưa có, tự động tạo mới: "${pinItem.board}"`);
        const createBoardBtn = await page.$(
          '[data-test-id="create-board-button"], button:has-text("Create board"), button:has-text("Tạo bảng"), div:has-text("Create board"), div:has-text("Tạo bảng")'
        );
        if (createBoardBtn) {
          await createBoardBtn.click();
          await page.waitForTimeout(1500);
          const nameInput = await page.$(
            '[data-test-id="board-name-input"] input, input[id*="board-name"], input[placeholder*="Name" i], input[placeholder*="Tên" i]'
          );
          if (nameInput) await nameInput.fill(pinItem.board);
          const submitBoard = await page.$(
            '[data-test-id="create-board-submit-button"], button:has-text("Create"), button:has-text("Tạo")'
          );
          if (submitBoard) {
            await submitBoard.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    // 8. Xuất bản Pin
    console.log('[6/6] Bấm nút Xuất bản (Publish)...');
    await page.waitForTimeout(1500);

    const publishBtn = await page.$(
      '[data-test-id="board-dropdown-save-button"], button[data-test-id="publish-button"], button:has-text("Publish"), button:has-text("Xuất bản"), button:has-text("Save"), button:has-text("Lưu")'
    );
    if (!publishBtn) {
      throw new Error('Không tìm thấy nút Publish/Xuất bản trên giao diện Pinterest.');
    }

    await publishBtn.click();
    console.log('      Đang đợi Pinterest xử lý lưu bài đăng...');
    await page.waitForTimeout(7000);

    // Chụp ảnh bằng chứng
    const timestamp = Date.now();
    const screenshotPath = path.join(LOGS_DIR, `published_${pinItem.id}_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`      Ảnh chụp bằng chứng lưu tại: ${screenshotPath}`);

    // Cập nhật trạng thái Pin trong queue
    pinItem.status = 'published';
    pinItem.published_at = new Date().toISOString();
    pinItem.screenshot_path = screenshotPath;

    // Gửi thông báo Telegram
    const tgMsg = `🎉 <b>[OPENCLAW] ĐĂNG PIN THÀNH CÔNG!</b>\n\n` +
      `📌 <b>ID:</b> <code>${pinItem.id}</code>\n` +
      `✨ <b>Chủ đề:</b> ${pinItem.theme}\n` +
      `🏷️ <b>Tiêu đề:</b> ${pinItem.title}\n` +
      `📁 <b>Bảng:</b> ${pinItem.board}\n` +
      `🔗 <b>Link đích:</b> ${pinItem.destination_link}\n` +
      `🕒 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    await sendTelegramNotification(tgMsg, screenshotPath);
    console.log('      Đã gửi thông báo và ảnh bằng chứng về Telegram!');

    return { success: true, pinItem, screenshotPath };

  } finally {
    try {
      if (page) await page.close();
      if (browser && !cdp.alive) await browser.close();
    } catch {}
  }
}

// Main execution flow
async function main() {
  const args = process.argv.slice(2);
  const queue = loadQueue();

  const pinIdToPublish = args[0];
  let targetPin = pinIdToPublish
    ? queue.find(p => p.id === pinIdToPublish)
    : queue.find(p => p.status === 'ready');

  if (!targetPin) {
    console.log('Không có Pin nào ở trạng thái "ready" để đăng.');
    return;
  }

  try {
    const result = await publishPin(targetPin);
    saveQueue(queue);

    console.log('\n======================================================');
    console.log(`✅ HOÀN TẤT ĐĂNG PIN [${targetPin.id}] THÀNH CÔNG!`);
    console.log(`   Tiếp tục lên lịch các Pin tiếp theo vào khung 21:00 EST...`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ LỖI KHI ĐĂNG PIN:', err.message);
    await sendTelegramNotification(`⚠️ <b>[OPENCLAW] LỖI ĐĂNG PIN</b>\n\n<code>${err.message}</code>`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { publishPin, loadQueue, saveQueue };
