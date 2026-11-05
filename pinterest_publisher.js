/**
 * OpenClaw Pinterest Publisher Worker (100% Pinterest API v5)
 * Automatically publishes pins from pinterest_queue.json
 * Zero Playwright / Zero Headless Browser dependencies
 * Reports to Telegram Bot @dell_worker_notify_bot
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const QUEUE_FILE = path.join(__dirname, 'pinterest_queue.json');
const LOGS_DIR = path.join(__dirname, 'logs');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const BOARD_MAP = {
  'Smart Kitchen Gadgets & Hacks': '1145884767630864299',
  'Digital Planners & iPad Aesthetics': '1145884767630864300',
  'Printable Wall Art & Decor': '1145884767630864301',
  'Warm Luxury Home Decor': '1145884767630877138',
  'Aesthetic Room Decor & Lighting': '1145884767630864300'
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

    if (res.status === 200) {
      const data = await res.json();
      const newToken = data.access_token;
      if (newToken) {
        process.env.PINTEREST_ACCESS_TOKEN = newToken;
        updateEnvFile('PINTEREST_ACCESS_TOKEN', newToken);
        if (data.refresh_token) {
          process.env.PINTEREST_REFRESH_TOKEN = data.refresh_token;
          updateEnvFile('PINTEREST_REFRESH_TOKEN', data.refresh_token);
        }
        return newToken;
      }
    }
  } catch (err) {
    console.warn('[Pinterest API] Lỗi làm mới token OAuth:', err.message);
  }
  return null;
}

function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}="${value}"`);
  } else {
    content += `\n${key}="${value}"`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

// Telegram notifier helper using native fetch
async function sendTelegramNotification(text, photoPath = null) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    if (photoPath && fs.existsSync(photoPath)) {
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

// Publish single pin function via Pinterest API v5
async function publishPin(pinItem) {
  console.log(`\n======================================================`);
  console.log(`[*] BẮT ĐẦU ĐĂNG PIN (API V5): [${pinItem.id}] ${pinItem.title}`);
  console.log(`======================================================`);

  const imageFullPath = path.isAbsolute(pinItem.image_path)
    ? pinItem.image_path
    : path.resolve(__dirname, pinItem.image_path);

  if (!fs.existsSync(imageFullPath)) {
    throw new Error(`File ảnh không tồn tại: ${imageFullPath}`);
  }

  const token = await getValidPinterestToken();
  if (!token) {
    throw new Error('Không lấy được PINTEREST_ACCESS_TOKEN hợp lệ');
  }

  // Pre-flight check landing page
  let finalLink = pinItem.destination_link || 'https://agentwell.agency';
  try {
    const probeRes = await fetch(finalLink, { method: 'GET', redirect: 'follow' });
    if (probeRes.status === 200) {
      console.log(`      -> Link đạt HTTP 200 OK: ${finalLink}`);
    } else {
      console.warn(`      -> CẢNH BÁO: Link trả về HTTP ${probeRes.status}! Kích hoạt fallback affiliate.`);
      if (pinItem.asin) {
        finalLink = `https://www.amazon.com/dp/${pinItem.asin}?tag=aesthetic08d8-20`;
      }
    }
  } catch (probeErr) {
    if (pinItem.asin) {
      finalLink = `https://www.amazon.com/dp/${pinItem.asin}?tag=aesthetic08d8-20`;
    }
  }

  let fullDesc = pinItem.description || '';
  if (pinItem.tags && pinItem.tags.length > 0 && !fullDesc.includes('#')) {
    const hashtags = pinItem.tags.slice(0, 6).map(t => '#' + t.replace(/\s+/g, '')).join(' ');
    fullDesc += '\n\n' + hashtags;
  }

  const boardId = BOARD_MAP[pinItem.board] || '1145884767630877138';
  const imgBuffer = fs.readFileSync(imageFullPath);
  const base64Img = imgBuffer.toString('base64');
  const ext = path.extname(imageFullPath).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const payload = {
    title: pinItem.title,
    description: fullDesc,
    link: finalLink,
    board_id: boardId,
    media_source: {
      source_type: 'image_base64',
      content_type: contentType,
      data: base64Img
    }
  };

  console.log(`[API v5] Gửi yêu cầu đăng Pin lên Board ${pinItem.board} (${boardId})...`);
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
    if (!pinId || !/^\d+$/.test(pinId)) {
      throw new Error(`Pinterest API trả về HTTP ${response.status} nhưng thiếu pin_id hợp lệ: ${JSON.stringify(resData)}`);
    }
    const pinUrl = `https://www.pinterest.com/pin/${pinId}/`;
    console.log(`✅ [API v5] ĐĂNG PIN THÀNH CÔNG trong 1s! Pin ID: ${pinId} -> ${pinUrl}`);

    pinItem.status = 'published';
    pinItem.published_at = new Date().toISOString();
    pinItem.pin_id = pinId;
    pinItem.pin_url = pinUrl;

    const tgMsg =
      `🎉 <b>XUẤT BẢN PIN THÀNH CÔNG (API v5)</b>\n\n` +
      `📌 <b>ID Pin:</b> <code>${pinId}</code>\n` +
      `🏷️ <b>Tiêu đề:</b> ${pinItem.title}\n` +
      `📁 <b>Bảng:</b> ${pinItem.board}\n` +
      `🔗 <b>Link đích:</b> ${finalLink}\n` +
      `🌐 <b>Pin URL:</b> ${pinUrl}\n` +
      `🕒 <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    await sendTelegramNotification(tgMsg, imageFullPath);
    return { success: true, pinItem, pinUrl };
  } else {
    throw new Error(`Pinterest API v5 lỗi HTTP ${response.status}: ${JSON.stringify(resData)}`);
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
