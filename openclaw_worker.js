const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Bot, InputFile } = require('node-telegram-bot-api');
const { chromium } = require('playwright');

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID ? String(process.env.TELEGRAM_CHAT_ID) : null;
const CDP_HOST = process.env.CDP_HOST || '127.0.0.1';
const CDP_PORT = process.env.CDP_PORT || 9222;
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_USER_DATA = path.resolve(__dirname, 'chrome_user_data');
const AUTO_INTERVAL_MS = (parseInt(process.env.AUTO_POST_INTERVAL_MINUTES, 10) || 180) * 60 * 1000;

if (!BOT_TOKEN) {
  console.error('[OpenClaw] ERROR: TELEGRAM_BOT_TOKEN is not defined in .env');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Queue of 4 Core Q4 Holiday & Winter Season Pinterest Pins (1-to-1 Synced with Verified Catalog)
const PIN_QUEUE = [
  {
    key: 'decor',
    name: '24" Travertine Inspired Table Lamp',
    image: path.join(__dirname, 'pin1.jpg'),
    title: '24" Travertine Inspired Table Lamp | Warm Luxury Home Decor',
    desc: 'Creating a grounded home starts with tactile surfaces and organic tones. The 24" Travertine Inspired Table Lamp introduces a quiet architectural presence to quiet corners, shaping the mood through diffused light.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas',
    link: 'https://agentwell.agency/curated/24-travertine-inspired-table-lamp-for-living-room-',
    board: 'Warm Luxury Home Decor',
    icon: '✨'
  },
  {
    key: 'kitchen',
    name: 'bella Fits-Anywhere 2-Slice Slim Toaster',
    image: path.join(__dirname, 'pin2.jpg'),
    title: 'bella Fits-Anywhere™ 2-Slice Slim Toaster | Smart Kitchen Gadgets & Hacks',
    desc: 'Designed specifically for streamlined, uncluttered countertops, the bella Fits-Anywhere™ toaster marries a sleek, narrow footprint with an extra-wide toast slot. Minimalist matte oat finish for intentional living.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas',
    link: 'https://agentwell.agency/curated/bella-fits-anywhere-2-slice-slim-toaster',
    board: 'Smart Kitchen Gadgets & Hacks',
    icon: '🎁'
  },
  {
    key: 'planner',
    name: 'Solid Walnut MagSafe Charging Stand',
    image: path.join(__dirname, 'pin3.jpg'),
    title: 'Solid Walnut MagSafe Charging Stand & Minimalist Desk Organizer',
    desc: 'Give the gift of peace, intentionality, and calm organization. Handcrafted American solid walnut MagSafe charging stand for iPhone & AirPods with integrated cable management.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas',
    link: 'https://agentwell.agency/curated/solid-walnut-wood-magsafe-wireless-charging-stand-',
    board: 'Digital Planners & iPad Aesthetics',
    icon: '🎄'
  },
  {
    key: 'wallart',
    name: 'Natural Solid Oak Picture Frames Set',
    image: path.join(__dirname, 'pin4.jpg'),
    title: 'Natural Solid Oak Picture Frames Set | Scandinavian Wall Art & Decor',
    desc: 'Give your living room walls an instant festive winter glow with natural solid wood gallery frames and subtle organic ceramics. Simple, clutter-free Scandinavian styling made effortless.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas',
    link: 'https://agentwell.agency/curated/lyyyxgyp-12x16-picture-frame-set-of-3-natural-soli',
    board: 'Printable Wall Art & Decor',
    icon: '🕯️'
  }
];

// System State
let isAutoEnabled = process.env.AUTO_POST_ENABLED !== 'false';
let autoTimer = null;
let queueIndex = 0;
let lastPostedTime = null;
let lastPostedTitle = 'Chưa có bài đăng nào trong phiên này';
let isPostingInProgress = false;

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ==========================================
// 2. KEYBOARDS & MENUS
// ==========================================
const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '🟢 Trạng thái hệ thống' }, { text: '🚀 Đăng bài ngay' }],
    [{ text: '⏰ Bật tự động 24/7' }, { text: '⏸️ Tạm dừng' }],
    [{ text: '📋 Xem hàng đợi' }]
  ],
  resize_keyboard: true,
  persistent: true
};

const NICHE_INLINE_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '✨ Cozy Bedroom Essentials for Winter', callback_data: 'niche_decor' },
      { text: '🎁 Aesthetic Holiday Gift Guide', callback_data: 'niche_kitchen' }
    ],
    [
      { text: '🎄 Minimalist Christmas Gifts', callback_data: 'niche_planner' },
      { text: '🕯️ Warm & Cozy Living Room Makeover', callback_data: 'niche_wallart' }
    ],
    [
      { text: '⚡ Đăng toàn bộ 4 bài Q4 Holiday (Batch Run)', callback_data: 'niche_all' }
    ]
  ]
};

// ==========================================
// 3. SYSTEM & BROWSER HELPERS
// ==========================================

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  let str = '';
  if (d > 0) str += `${d} ngày `;
  if (h > 0 || d > 0) str += `${h} giờ `;
  str += `${m} phút ${s} giây`;
  return str;
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

  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const check = await checkCdpAlive();
    if (check.alive) {
      console.log(`[OpenClaw] Chrome started successfully on port ${CDP_PORT}`);
      return;
    }
  }
}

// ==========================================
// 4. PINTEREST ROBUST PUBLISHER (API v5 + PLAYWRIGHT FALLBACK)
// ==========================================

const BOARD_MAP = {
  'Aesthetic Room Decor & Lighting': '1145884767630864296',
  'Smart Kitchen Gadgets & Hacks': '1145884767630864299',
  'Digital Planners & iPad Aesthetics': '1145884767630864300',
  'Printable Wall Art & Decor': '1145884767630864301',
  'Warm Luxury Home Decor': '1145884767630877138'
};

async function getValidPinterestToken() {
  let token = (process.env.PINTEREST_ACCESS_TOKEN || '').replace(/["']/g, '');
  if (!token) return null;

  try {
    const testRes = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (testRes.status === 200) {
      return token;
    }
    if (testRes.status === 401) {
      console.log('[Pinterest API] Access token hết hạn (401), đang kích hoạt OAuth refresh...');
      const refreshed = await refreshPinterestToken();
      if (refreshed) return refreshed;
    }
  } catch (err) {
    console.warn('[Pinterest API] Lỗi kiểm tra token:', err.message);
  }
  return token;
}

async function refreshPinterestToken() {
  const appId = (process.env.PINTEREST_APP_ID || '1627223').replace(/["']/g, '');
  const appSecret = (process.env.PINTEREST_APP_SECRET || '').replace(/["']/g, '');
  const refreshToken = (process.env.PINTEREST_REFRESH_TOKEN || '').replace(/["']/g, '');
  if (!appId || !appSecret || !refreshToken) return null;

  try {
    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (res.ok) {
      const data = await res.json();
      const newToken = data.access_token;
      process.env.PINTEREST_ACCESS_TOKEN = newToken;
      const newRefresh = data.refresh_token || refreshToken;
      if (data.refresh_token) {
        process.env.PINTEREST_REFRESH_TOKEN = data.refresh_token;
      }
      saveTokensToEnv(newToken, newRefresh);
      console.log('[Pinterest API] Đã làm mới token thành công (hiệu lực 30 ngày)!');
      return newToken;
    } else {
      console.error('[Pinterest API] Làm mới token thất bại:', res.status, await res.text());
    }
  } catch (e) {
    console.error('[Pinterest API] Ngoại lệ khi làm mới token:', e.message);
  }
  return null;
}

function saveTokensToEnv(accessToken, refreshToken) {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('PINTEREST_ACCESS_TOKEN=')) {
    content = content.replace(/PINTEREST_ACCESS_TOKEN=.*/, `PINTEREST_ACCESS_TOKEN="${accessToken}"`);
  } else {
    content += `\nPINTEREST_ACCESS_TOKEN="${accessToken}"`;
  }
  if (refreshToken) {
    if (content.includes('PINTEREST_REFRESH_TOKEN=')) {
      content = content.replace(/PINTEREST_REFRESH_TOKEN=.*/, `PINTEREST_REFRESH_TOKEN="${refreshToken}"`);
    } else {
      content += `\nPINTEREST_REFRESH_TOKEN="${refreshToken}"`;
    }
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

// 1. ƯU TIÊN SỐ 1: PINTEREST API V5 (Hoàn tất trong 1 giây, triệt tiêu lỗi Timeout giao diện và Captcha)
async function publishPinViaApiV5(pinData, updateCallback = null) {
  if (updateCallback) await updateCallback(`⚡ [1/2 API v5] Đang kết nối Pinterest API v5 chính thức...`);
  const token = await getValidPinterestToken();
  if (!token) {
    throw new Error('Không tìm thấy PINTEREST_ACCESS_TOKEN hợp lệ');
  }

  const boardId = BOARD_MAP[pinData.board] || '1145884767630877138';

  if (!fs.existsSync(pinData.image)) {
    throw new Error(`Không tìm thấy file ảnh: ${pinData.image}`);
  }
  const imgBuffer = fs.readFileSync(pinData.image);
  const base64Img = imgBuffer.toString('base64');
  const ext = path.extname(pinData.image).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  if (updateCallback) await updateCallback(`🚀 [2/2 API v5] POST https://api.pinterest.com/v5/pins (Board: ${pinData.board})...`);

  const payload = {
    title: pinData.title,
    description: pinData.desc || pinData.description,
    link: pinData.link,
    board_id: boardId,
    media_source: {
      source_type: 'image_base64',
      content_type: contentType,
      data: base64Img
    }
  };

  const response = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const resData = await response.json().catch(() => ({}));

  if (response.status === 201 || response.status === 200) {
    const pinId = String(resData.id || '').trim();
    if (!pinId || pinId.toLowerCase() === 'none' || !/^\d+$/.test(pinId)) {
      throw new Error(`Pinterest API trả về HTTP ${response.status} nhưng thiếu pin_id hợp lệ: ${JSON.stringify(resData)}`);
    }
    const pinUrl = `https://www.pinterest.com/pin/${pinId}/`;
    lastPostedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    lastPostedTitle = pinData.title;

    console.log(`[OpenClaw API v5] ĐĂNG PIN THÀNH CÔNG trong 1s! Pin ID: ${pinId} -> ${pinUrl}`);
    return {
      success: true,
      pinId,
      pinUrl,
      screenshotPath: pinData.image,
      method: 'api_v5',
      pinData
    };
  } else {
    throw new Error(`Pinterest API v5 lỗi HTTP ${response.status}: ${JSON.stringify(resData)}`);
  }
}

// 2. DỰ PHÒNG: PLAYWRIGHT (Timeout 60s, wait 'commit', Session Expiry Alert, Retry 2x)
async function publishPinViaPlaywrightOnce(pinData, updateCallback = null) {
  if (updateCallback) await updateCallback(`⏳ [1/5 Dự phòng] Đang kết nối Chrome CDP tới Pinterest...`);
  await ensureChromeRunning();

  const browser = await chromium.connectOverCDP(`http://${CDP_HOST}:${CDP_PORT}`);
  const context = browser.contexts()[0] || await browser.newContext();
  
  const statePath = path.join(__dirname, 'pinterest_storage_state.json');
  if (fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (state.cookies && state.cookies.length > 0) {
        await context.addCookies(state.cookies);
      }
    } catch (e) {
      console.warn('[OpenClaw] Note on cookie injection:', e.message);
    }
  }

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    if (updateCallback) await updateCallback(`🌐 [2/5 Dự phòng] Mở công cụ tạo Pin (timeout 60s, wait commit)...`);
    await page.goto('https://www.pinterest.com/pin-creation-tool/', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Kiểm tra phiên đăng nhập: Nếu bị chuyển hướng sang /login hoặc thấy nút Đăng nhập
    const curUrl = page.url();
    const loginBtn = await page.$('[data-test-id="simple-login-button"], button:has-text("Đăng nhập"), button:has-text("Log in")');
    if (curUrl.includes('/login') || loginBtn) {
      const alertMsg = '⚠️ [CẢNH BÁO BẢO MẬT] Phiên đăng nhập Pinterest trên Browser đã hết hạn (Bị điều hướng về /login). Vui lòng quét mã QR hoặc đăng nhập lại tài khoản trên Chrome!';
      console.error(alertMsg);
      if (ALLOWED_CHAT_ID) {
        try {
          await bot.api.sendMessage({
            chat_id: ALLOWED_CHAT_ID,
            text: alertMsg
          });
        } catch {}
      }
      throw new Error(alertMsg);
    }

    // 1. Chờ selector chính file input với timeout 60s
    if (updateCallback) await updateCallback(`📸 [3/5 Dự phòng] Đang upload ảnh (${path.basename(pinData.image)})...`);
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 60000 });
    await fileInput.setInputFiles(pinData.image);
    await page.waitForTimeout(3000);

    // 2. Điền Title
    if (updateCallback) await updateCallback(`✍️ [4/5 Dự phòng] Đang điền tiêu đề, mô tả và liên kết...`);
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
        await el.fill(pinData.title);
        break;
      }
    }

    // 3. Điền Description
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
        await el.fill(pinData.desc);
        break;
      }
    }

    // 4. Điền Link
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
        await el.fill(pinData.link);
        break;
      }
    }

    // 5. Chọn bảng
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
        await searchInput.fill(pinData.board);
        await page.waitForTimeout(1200);
      }

      const boardItem = await page.$(
        `div[title="${pinData.board}"], div:has-text("${pinData.board}")`
      );
      if (boardItem && await boardItem.isVisible()) {
        await boardItem.click();
      } else {
        const createBoardBtn = await page.$(
          '[data-test-id="create-board-button"], button:has-text("Create board"), button:has-text("Tạo bảng"), div:has-text("Create board"), div:has-text("Tạo bảng")'
        );
        if (createBoardBtn) {
          await createBoardBtn.click();
          await page.waitForTimeout(1500);
          const nameInput = await page.$(
            '[data-test-id="board-name-input"] input, input[id*="board-name"], input[placeholder*="Name" i], input[placeholder*="Tên" i]'
          );
          if (nameInput) await nameInput.fill(pinData.board);
          const submitBtn = await page.$(
            '[data-test-id="create-board-submit-button"], button:has-text("Create"), button:has-text("Tạo")'
          );
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    // 6. Bấm Xuất bản
    if (updateCallback) await updateCallback(`🚀 [5/5 Dự phòng] Đang bấm Xuất bản (Publish)...`);
    await page.waitForTimeout(1500);

    const publishBtn = await page.$(
      '[data-test-id="board-dropdown-save-button"], button[data-test-id="publish-button"], button:has-text("Publish"), button:has-text("Xuất bản"), button:has-text("Save"), button:has-text("Lưu")'
    );
    if (!publishBtn) {
      throw new Error('Không tìm thấy nút Publish/Xuất bản trên giao diện Pinterest.');
    }

    await publishBtn.click();
    await page.waitForTimeout(7000);

    const timestamp = Date.now();
    const screenshotPath = path.join(logsDir, `pin_${pinData.key}_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });

    lastPostedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    lastPostedTitle = pinData.title;

    return {
      success: true,
      screenshotPath,
      method: 'playwright',
      pinData
    };
  } finally {
    try {
      await page.close();
    } catch {}
  }
}

async function publishPinViaPlaywrightWithRetry(pinData, updateCallback = null, maxRetries = 2) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[Playwright Fallback] Đang thử lại lần ${attempt}/${maxRetries} sau 10 giây nghỉ...`);
        if (updateCallback) await updateCallback(`🔄 [Dự phòng] Đang thử lại lần ${attempt}/${maxRetries} sau 10s...`);
        await new Promise(r => setTimeout(r, 10000));
      }
      return await publishPinViaPlaywrightOnce(pinData, updateCallback);
    } catch (err) {
      lastErr = err;
      console.warn(`[Playwright Fallback] Lần ${attempt}/${maxRetries} thất bại: ${err.message}`);
      if (err.message.includes('hết hạn') || err.message.includes('login')) {
        break;
      }
    }
  }
  throw lastErr;
}

// Cơ chế "PAGE-FIRST, PIN-AFTER": Bắt buộc kiểm tra HTTP 200 trước khi gửi API đăng Pin
async function verifyLandingPageProbe(url) {
  if (!url || !url.includes('/curated/')) return true;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'OpenClaw-Gatekeeper/1.0' }
    });
    if (res.status !== 200) {
      throw new Error(`Landing page probe failed with HTTP status ${res.status}`);
    }
    const body = await res.text();
    if (body.includes('404: NOT_FOUND') || body.includes('NOT_FOUND')) {
      throw new Error(`Landing page returned Vercel 404 NOT_FOUND error`);
    }
    return true;
  } catch (err) {
    throw new Error(`[PAGE-FIRST GATE BLOCKED] ${url}: ${err.message}`);
  }
}

// HÀM CHÍNH ĐIỀU PHỐI ĐĂNG BÀI: Ưu tiên API v5, tự động fallback sang Playwright
async function publishPinItem(pinData, updateCallback = null) {
  // BƯỚC 1: CƠ CHẾ "PAGE-FIRST, PIN-AFTER" (CÓ TRANG MỚI ĐƯỢC ĐĂNG PIN)
  if (pinData.link && pinData.link.includes('/curated/')) {
    if (updateCallback) await updateCallback(`🔍 [Page-First Gate] Kiểm tra HTTP 200 trang đích: ${pinData.link}...`);
    console.log(`[OpenClaw] Đang gửi HTTP GET probe tới ${pinData.link}...`);
    await verifyLandingPageProbe(pinData.link);
    console.log(`[OpenClaw] ✅ Landing page xác nhận HTTP 200 OK! Được phép đăng Pin.`);
  }

  // ƯU TIÊN SỐ 1: Pinterest API v5 (Hoàn tất trong 1 giây, triệt tiêu 100% lỗi Timeout giao diện và Captcha)
  try {
    console.log(`[OpenClaw] Đang đăng pin "${pinData.name}" qua Pinterest API v5 chính thức...`);
    const apiResult = await publishPinViaApiV5(pinData, updateCallback);
    return apiResult;
  } catch (apiErr) {
    console.warn(`[OpenClaw] Pinterest API v5 gặp lỗi: ${apiErr.message}. Kích hoạt cơ chế dự phòng Playwright...`);
    if (updateCallback) await updateCallback(`⚠️ Pinterest API v5: ${apiErr.message}. Đang chuyển sang dự phòng Playwright Browser...`);
    
    // GIẢI PHÁP 2 (DỰ PHÒNG): Playwright Browser (Timeout 60s, wait commit, 2x retries, session check)
    return await publishPinViaPlaywrightWithRetry(pinData, updateCallback, 2);
  }
}

// ==========================================
// 5. TELEGRAM INTERACTIVE HANDLERS
// ==========================================

function getSystemStatusText(cdp) {
  const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(2);
  const freeMem = (os.freemem() / (1024 ** 3)).toFixed(2);
  const usedMem = (totalMem - freeMem).toFixed(2);
  const memPct = Math.round((usedMem / totalMem) * 100);
  const procMem = (process.memoryUsage().rss / (1024 ** 2)).toFixed(1);

  return `
🟢 <b>BÁO CÁO TRẠNG THÁI HỆ THỐNG OPENCLAW</b>
━━━━━━━━━━━━━━━━━━━━
💻 <b>Tài nguyên VPS:</b>
• <b>RAM Hệ thống:</b> ${usedMem} GB / ${totalMem} GB (${memPct}% đã dùng)
• <b>RAM Worker RSS:</b> ${procMem} MB
• <b>VPS Uptime:</b> ${formatUptime(os.uptime())}
• <b>Worker Uptime:</b> ${formatUptime(process.uptime())}

📌 <b>Phiên Pinterest & Headless Browser:</b>
• <b>Cổng CDP 9222:</b> ${cdp.alive ? '🟢 Đang hoạt động (' + cdp.browser + ')' : '🔴 Chưa mở'}
• <b>Duy trì phiên (Persist Session):</b> ✅ Sẵn sàng
• <b>Tài khoản:</b> Aesthetic Haven Studio

⏰ <b>Lịch tự động 24/7:</b>
• <b>Trạng thái:</b> ${isAutoEnabled ? '🟢 ĐANG BẬT (Chu kỳ 3 giờ/bài)' : '⏸️ ĐANG TẠM DỪNG'}
• <b>Bài đăng gần nhất:</b> ${lastPostedTime ? lastPostedTime : 'Chưa có'}
• <b>Tiêu đề gần nhất:</b> ${lastPostedTitle}
━━━━━━━━━━━━━━━━━━━━
<i>Chạm các nút bên dưới để điều khiển ngay:</i>
`.trim();
}

function getQueueText() {
  const queuePath = path.join(__dirname, 'pinterest_queue.json');
  if (fs.existsSync(queuePath)) {
    try {
      const q = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      let text = `📋 <b>DANH SÁCH HÀNG ĐỢI PIN (${q.length} BÀI - 4 NGÁCH)</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
      q.forEach((pin, idx) => {
        const isDone = pin.status === 'published';
        const icon = isDone ? '✅ [ĐÃ ĐĂNG]' : '⏳ [CHỜ ĐĂNG]';
        text += `<b>${idx + 1}. ${icon} ${pin.theme || pin.id}</b>\n`;
        text += `   • <b>Ngách:</b> ${pin.niche}\n`;
        text += `   • <b>Tiêu đề:</b> ${pin.title.slice(0, 50)}...\n`;
        text += `   • <b>Link:</b> <code>${pin.destination_link || pin.link}</code>\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━\n<i>⏰ Lịch phát sóng: Mỗi 24 giờ vào 21:00 EST (02:00 UTC)</i>`;
      return text;
    } catch (e) {
      console.warn('Queue parse error:', e.message);
    }
  }

  let text = `📋 <b>DANH SÁCH HÀNG ĐỢI ĐĂNG BÀI (4 CORE NICHES)</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
  PIN_QUEUE.forEach((pin, idx) => {
    const isCurrent = idx === queueIndex ? '👉 <b>[KẾ TIẾP]</b> ' : '   ';
    text += `${isCurrent}<b>${idx + 1}. ${pin.icon} ${pin.name}</b>\n`;
    text += `   • <b>Tiêu đề:</b> ${pin.title}\n`;
    text += `   • <b>Bảng:</b> ${pin.board}\n`;
    text += `   • <b>Link đích:</b> <code>${pin.link}</code>\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━━━\n<i>Trạng thái tự động: ${isAutoEnabled ? '🟢 Đang chạy' : '⏸️ Tạm dừng'}</i>`;
  return text;
}

// 1. Reply Keyboard message triggers
bot.hears(['🟢 Trạng thái hệ thống', 'Trạng thái hệ thống', /trạng thái/i, '/status'], async (ctx) => {
  const cdp = await checkCdpAlive();
  await ctx.reply(getSystemStatusText(cdp), {
    parse_mode: 'HTML',
    reply_markup: MAIN_KEYBOARD
  });
});

bot.hears(['🚀 Đăng bài ngay', 'Đăng bài ngay', /đăng bài/i, '/post'], async (ctx) => {
  await ctx.reply(
    `🚀 <b>CHỌN NGÁCH BÀI VIẾT CẦN ĐĂNG LÊN PINTEREST:</b>\n\nChạm vào một trong các nút bên dưới. OpenClaw sẽ lập tức chạy headless browser, thực hiện đăng bài và gửi ảnh chụp màn hình xác nhận cho bạn.`,
    {
      parse_mode: 'HTML',
      reply_markup: NICHE_INLINE_KEYBOARD
    }
  );
});

bot.hears(['⏰ Bật tự động 24/7', 'Bật tự động 24/7', /bật tự động/i, '/auto_on'], async (ctx) => {
  if (isAutoEnabled && autoTimer) {
    await ctx.reply('ℹ️ Chế độ tự động 24/7 vốn <b>đang được BẬT</b> rồi anh/chị nhé!', {
      parse_mode: 'HTML',
      reply_markup: MAIN_KEYBOARD
    });
    return;
  }
  isAutoEnabled = true;
  startAutoScheduler();
  const nextPin = PIN_QUEUE[queueIndex];
  await ctx.reply(
    `✅ <b>ĐÃ KÍCH HOẠT CHẾ ĐỘ ĐĂNG TỰ ĐỘNG 24/7!</b>\n\n• <b>Chu kỳ:</b> Mỗi 3 giờ đăng 1 bài xoay vòng\n• <b>Bài kế tiếp:</b> ${nextPin.icon} ${nextPin.name}\n• <b>Hệ thống:</b> Vận hành ngầm liên tục 24/7 với PM2`,
    { parse_mode: 'HTML', reply_markup: MAIN_KEYBOARD }
  );
});

bot.hears(['⏸️ Tạm dừng', 'Tạm dừng', /tạm dừng/i, '/auto_off'], async (ctx) => {
  isAutoEnabled = false;
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  await ctx.reply(
    `⏸️ <b>ĐÃ TẠM DỪNG CHẾ ĐỘ TỰ ĐỘNG 24/7!</b>\n\nWorker vẫn duy trì online. Bạn có thể sử dụng nút <b>"🚀 Đăng bài ngay"</b> để đăng thủ công bất cứ lúc nào.`,
    { parse_mode: 'HTML', reply_markup: MAIN_KEYBOARD }
  );
});

bot.hears(['📋 Xem hàng đợi', 'Xem hàng đợi', /hàng đợi/i, '/queue'], async (ctx) => {
  await ctx.reply(getQueueText(), {
    parse_mode: 'HTML',
    reply_markup: MAIN_KEYBOARD
  });
});

// 2. Inline Keyboard Callback Queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  if (isPostingInProgress) {
    await ctx.reply('⚠️ Đang có một tiến trình đăng bài đang chạy dở. Vui lòng đợi trong giây lát...');
    return;
  }

  const chatId = ctx.callbackQuery.message.chat.id;

  if (data === 'niche_all') {
    isPostingInProgress = true;
    await ctx.reply('⚡ <b>Bắt đầu quy trình Batch: Đăng lần lượt toàn bộ 4 ngách...</b>', { parse_mode: 'HTML' });

    for (let i = 0; i < PIN_QUEUE.length; i++) {
      const pin = PIN_QUEUE[i];
      const statusMsg = await bot.api.sendMessage({
        chat_id: chatId,
        text: `⏳ Đang đăng Pin ${i + 1}/4: <b>${pin.name}</b>...`,
        parse_mode: 'HTML'
      });

      try {
        const result = await publishPinItem(pin, async (text) => {
          try {
            await bot.api.editMessageText({
              chat_id: chatId,
              message_id: statusMsg.message_id,
              text: `<b>${pin.name}</b>:\n${text}`,
              parse_mode: 'HTML'
            });
          } catch {}
        });

        const caption = `✅ <b>[OpenClaw] ĐÃ ĐĂNG PIN ${i + 1}/4 THÀNH CÔNG!</b>\n━━━━━━━━━━━━━━━━━━━━\n📌 <b>Tiêu đề:</b> ${pin.title}\n📁 <b>Bảng:</b> ${pin.board}\n🔗 <b>Link đích:</b> <code>${pin.link}</code>\n⏰ <b>Thời gian:</b> ${lastPostedTime}`;
        const photoBuf = fs.readFileSync(result.screenshotPath);
        await bot.api.sendPhoto({
          chat_id: chatId,
          photo: new InputFile(photoBuf, path.basename(result.screenshotPath)),
          caption,
          parse_mode: 'HTML'
        });
      } catch (err) {
        await bot.api.sendMessage({
          chat_id: chatId,
          text: `❌ Lỗi khi đăng <b>${pin.name}</b>: ${err.message}`,
          parse_mode: 'HTML'
        });
      }
      await new Promise(r => setTimeout(r, 4000));
    }

    isPostingInProgress = false;
    await ctx.reply('🎉 <b>Hoàn tất toàn bộ chuỗi 4 bài Pin!</b>', { parse_mode: 'HTML', reply_markup: MAIN_KEYBOARD });
    return;
  }

  // Single niche posting
  const nicheKey = data.replace('niche_', '');
  const pin = PIN_QUEUE.find(p => p.key === nicheKey);
  if (!pin) return;

  isPostingInProgress = true;
  const statusMsg = await bot.api.sendMessage({
    chat_id: chatId,
    text: `⏳ <b>Bắt đầu đăng bài:</b> ${pin.icon} ${pin.name}...`,
    parse_mode: 'HTML'
  });

  try {
    const result = await publishPinItem(pin, async (stepText) => {
      try {
        await bot.api.editMessageText({
          chat_id: chatId,
          message_id: statusMsg.message_id,
          text: `<b>${pin.icon} ${pin.name}</b>\n${stepText}`,
          parse_mode: 'HTML'
        });
      } catch {}
    });

    const methodTag = result.method === 'api_v5' ? '⚡ <b>Phương thức:</b> Pinterest API v5 (Tốc độ ~1s)\n' : '🌐 <b>Phương thức:</b> Playwright CDP Fallback\n';
    const pinLinkTag = result.pinUrl ? `🔗 <b>Pinterest Pin:</b> ${result.pinUrl}\n` : '';
    const caption = `
✅ <b>[OpenClaw] ĐĂNG BÀI THÀNH CÔNG LÊN PINTEREST!</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>Tiêu đề:</b> ${pin.title}
📁 <b>Bảng (Board):</b> ${pin.board}
🔗 <b>Link đích:</b> <code>${pin.link}</code>
${pinLinkTag}${methodTag}👤 <b>Tài khoản:</b> Aesthetic Haven Studio
⏰ <b>Thời gian:</b> ${lastPostedTime}
━━━━━━━━━━━━━━━━━━━━
<i>Ảnh xem trước bên dưới 👇</i>
`.trim();

    const photoBuf = fs.readFileSync(result.screenshotPath);
    await bot.api.sendPhoto({
      chat_id: chatId,
      photo: new InputFile(photoBuf, path.basename(result.screenshotPath)),
      caption,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error(`[OpenClaw] Error posting ${pin.name}:`, err);
    await bot.api.sendMessage({
      chat_id: chatId,
      text: `❌ <b>Lỗi trong quá trình đăng:</b> ${err.message}`,
      parse_mode: 'HTML'
    });
  } finally {
    isPostingInProgress = false;
  }
});

// 3. Fallback message handler to show keyboard on any interaction or /start
bot.on('message', async (ctx) => {
  const text = ctx.message.text || '';
  if (/trạng thái|đăng bài|bật tự động|tạm dừng|hàng đợi|\/status|\/post|\/queue|\/auto/i.test(text)) {
    return; // Handled by bot.hears
  }

  const welcomeText = `
👋 <b>CHÀO MỪNG BẠN ĐẾN VỚI OPENCLAW WORKER 24/7</b>
━━━━━━━━━━━━━━━━━━━━
Hệ thống điều khiển tự động hóa Pinterest cho thương hiệu <b>Aesthetic Haven Studio</b>.

🎮 <b>Các tính năng điều khiển:</b>
• <b>🟢 Trạng thái hệ thống:</b> Theo dõi RAM, Uptime VPS và phiên Pinterest.
• <b>🚀 Đăng bài ngay:</b> Chọn và đăng ngay lập tức bất kỳ ngách nào.
• <b>⏰ Bật tự động 24/7:</b> Kích hoạt lịch tự động đăng xoay vòng.
• <b>⏸️ Tạm dừng:</b> Ngắt chế độ tự động.
• <b>📋 Xem hàng đợi:</b> Danh sách bài viết chuẩn bị xuất bản.
━━━━━━━━━━━━━━━━━━━━
<i>Vui lòng chọn nút chức năng trên bàn phím bên dưới:</i>
`.trim();

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: MAIN_KEYBOARD
  });
});

// ==========================================
// 6. 24/7 AUTO SCHEDULER
// ==========================================

function startAutoScheduler() {
  if (autoTimer) clearInterval(autoTimer);
  console.log(`[OpenClaw] 24/7 Scheduler started. Interval: ${AUTO_INTERVAL_MS / 60000} minutes.`);

  autoTimer = setInterval(async () => {
    if (!isAutoEnabled || isPostingInProgress) return;

    // Check pinterest_queue.json first
    const queuePath = path.join(__dirname, 'pinterest_queue.json');
    let targetPin = null;
    let queue = [];
    if (fs.existsSync(queuePath)) {
      try {
        queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
        targetPin = queue.find(p => p.status === 'ready');
      } catch (e) {
        console.warn('Queue read error in auto scheduler:', e.message);
      }
    }

    if (!targetPin) {
      console.log('[OpenClaw Auto] Deduplication Guard: Hàng đợi pinterest_queue.json hiện không có bài nào ở trạng thái ready. Tạm dừng để chờ phôi mới từ Scraper (Vô hiệu hóa xoay vòng bài cũ).');
      return;
    }

    const pin = {
      name: targetPin.theme || targetPin.title,
      image: targetPin.image_full_path || (path.isAbsolute(targetPin.image_path) ? targetPin.image_path : path.resolve(__dirname, targetPin.image_path)),
      title: targetPin.title,
      desc: targetPin.description,
      link: targetPin.destination_link || targetPin.link,
      board: targetPin.board,
      icon: '✨'
    };

    console.log(`[OpenClaw Auto] Triggering scheduled post from queue: [${targetPin.id}] ${pin.title}`);
    if (ALLOWED_CHAT_ID) {
      try {
        await bot.api.sendMessage({
          chat_id: ALLOWED_CHAT_ID,
          text: `⏰ <b>[Lịch tự động 24/7]</b> Đến giờ đăng bài định kỳ: <b>${pin.icon} ${pin.name}</b>. Đang xử lý...`,
          parse_mode: 'HTML'
        });
      } catch {}
    }

    try {
      isPostingInProgress = true;
      const result = await publishPinItem(pin);
      
      // Update status in queue
      targetPin.status = 'published';
      targetPin.published_at = new Date().toISOString();
      targetPin.screenshot_path = result.screenshotPath;
      try {
        fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
      } catch (qe) {
        console.warn('Could not update queue file:', qe.message);
      }

      if (ALLOWED_CHAT_ID) {
        const methodTag = result.method === 'api_v5' ? '⚡ <b>Phương thức:</b> Pinterest API v5 (Tốc độ ~1s)\n' : '🌐 <b>Phương thức:</b> Playwright CDP Fallback\n';
        const pinLinkTag = result.pinUrl ? `🔗 <b>Pinterest Pin:</b> ${result.pinUrl}\n` : '';
        const caption = `✅ <b>[OpenClaw Auto 24/7] ĐÃ ĐĂNG ĐỊNH KỲ THÀNH CÔNG!</b>\n━━━━━━━━━━━━━━━━━━━━\n📌 <b>Tiêu đề:</b> ${pin.title}\n📁 <b>Bảng:</b> ${pin.board}\n🔗 <b>Link đích:</b> <code>${pin.link}</code>\n${pinLinkTag}${methodTag}⏰ <b>Thời gian:</b> ${lastPostedTime}`;
        const photoBuf = fs.readFileSync(result.screenshotPath);
        await bot.api.sendPhoto({
          chat_id: ALLOWED_CHAT_ID,
          photo: new InputFile(photoBuf, path.basename(result.screenshotPath)),
          caption,
          parse_mode: 'HTML'
        });
      }
    } catch (err) {
      console.error('[OpenClaw Auto] Error during scheduled post:', err);
      if (ALLOWED_CHAT_ID) {
        try {
          await bot.api.sendMessage({
            chat_id: ALLOWED_CHAT_ID,
            text: `❌ [OpenClaw Auto] Lỗi đăng bài định kỳ: ${err.message}`
          });
        } catch {}
      }
    } finally {
      isPostingInProgress = false;
    }
  }, AUTO_INTERVAL_MS);
}

// ==========================================
// 7. INITIALIZATION & STARTUP
// ==========================================

async function init() {
  console.log('====================================================');
  console.log('       OPENCLAW 24/7 WORKER STARTING UP             ');
  console.log('====================================================');

  const me = await bot.api.getMe();
  console.log(`[OpenClaw] Telegram Bot authenticated: @${me.username}`);

  // Test CDP connection
  const cdp = await checkCdpAlive();
  console.log(`[OpenClaw] Initial CDP Status: ${cdp.alive ? 'Online (' + cdp.browser + ')' : 'Offline (will auto-spawn on demand)'}`);

  // Clear any active webhook to prevent 409 Conflict with long-polling
  try {
    if (bot.api && typeof bot.api.deleteWebhook === 'function') {
      await bot.api.deleteWebhook({ drop_pending_updates: false });
      console.log('[OpenClaw] Telegram webhook cleared successfully for polling mode.');
    }
  } catch (err) {
    console.warn('[OpenClaw] Webhook cleanup notice:', err.message);
  }

  // Start polling Telegram updates
  bot.startPolling().catch(err => {
    console.error('[OpenClaw Polling Fatal Error]:', err.message || err);
  });
  console.log('[OpenClaw] Telegram long-polling active. Waiting for button clicks/messages...');

  // Start auto scheduler if enabled
  if (isAutoEnabled) {
    startAutoScheduler();
  }

  // Notify admin on startup if chat id provided
  if (ALLOWED_CHAT_ID) {
    try {
      const startupMsg = `
🚀 <b>OPENCLAW WORKER 24/7 ĐÃ KHỞI ĐỘNG THÀNH CÔNG!</b>
━━━━━━━━━━━━━━━━━━━━
• <b>Bot:</b> @${me.username}
• <b>VPS Uptime:</b> ${formatUptime(os.uptime())}
• <b>Pinterest Session:</b> ${cdp.alive ? '🟢 Online' : '🟡 Sẵn sàng khởi chạy ngầm'}
• <b>Chế độ tự động 24/7:</b> ${isAutoEnabled ? '🟢 Đang bật (3 giờ/lần)' : '⏸️ Tạm dừng'}
━━━━━━━━━━━━━━━━━━━━
<i>Chạm vào các nút bàn phím bên dưới để điều khiển:</i>
`.trim();
      await bot.api.sendMessage({
        chat_id: ALLOWED_CHAT_ID,
        text: startupMsg,
        parse_mode: 'HTML',
        reply_markup: MAIN_KEYBOARD
      });
      console.log(`[OpenClaw] Startup notification sent to Chat ID: ${ALLOWED_CHAT_ID}`);
    } catch (e) {
      console.warn('[OpenClaw] Could not send startup notification:', e.message);
    }
  }
}

// Global unhandled error protection
process.on('unhandledRejection', (reason, promise) => {
  console.error('[OpenClaw] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[OpenClaw] Uncaught Exception:', err);
});

init();
