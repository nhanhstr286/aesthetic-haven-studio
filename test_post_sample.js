const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const CDP_HOST = process.env.CDP_HOST || '127.0.0.1';
const CDP_PORT = process.env.CDP_PORT || 9222;
const STATE_FILE = path.join(__dirname, 'pinterest_storage_state.json');
const QUEUE_FILE = path.join(__dirname, 'pinterest_queue.json');

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

async function runSampleTest() {
  console.log('======================================================');
  console.log('🎄 CHẠY THỬ NGHIỆM ĐĂNG PIN MÙA LỄ HỘI Q4 LÊN PINTEREST');
  console.log('======================================================');

  // 1. Đọc dữ liệu Pin từ hàng đợi (Pin đầu tiên thuộc Q4)
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const pin = queue.find(p => p.id === 'q4_holiday_01') || queue[0];

  console.log(`📌 Pin được chọn: [${pin.id}] ${pin.theme || pin.title}`);
  console.log(`📝 Tiêu đề:       ${pin.title}`);
  console.log(`🔗 Link đích:     ${pin.destination_link}`);
  console.log(`📁 Bảng:          ${pin.board}`);
  console.log(`🖼️ Ảnh:           ${pin.image_path}`);

  const imageFullPath = path.isAbsolute(pin.image_path)
    ? pin.image_path
    : path.resolve(__dirname, pin.image_path);

  if (!fs.existsSync(imageFullPath)) {
    throw new Error(`Không tìm thấy file ảnh: ${imageFullPath}`);
  }

  // 2. Khởi tạo trình duyệt (CDP nếu đang mở, hoặc Chromium tự động với Storage State Cookies)
  let browser = null;
  let context = null;
  const cdp = await checkCdpAlive();

  if (cdp.alive) {
    console.log(`🌐 [1/6] Đang kết nối CDP tới trình duyệt Chrome (cổng ${CDP_PORT})...`);
    browser = await chromium.connectOverCDP(`http://${CDP_HOST}:${CDP_PORT}`);
    context = browser.contexts()[0] || await browser.newContext();
  } else {
    console.log(`🌐 [1/6] CDP không mở, khởi chạy Chromium với authenticated cookies...`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    });
  }

  // Nạp session Pinterest cookies
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (state.cookies && state.cookies.length > 0) {
      await context.addCookies(state.cookies);
      console.log(`   Đã nạp ${state.cookies.length} cookies Pinterest từ storage state.`);
    }
  }

  const page = await context.newPage();
  page.setDefaultTimeout(40000);

  try {
    // 3. Mở trang tạo Pin
    console.log('[2/6] Đang mở trang tạo Pin: https://www.pinterest.com/pin-creation-tool/...');
    await page.goto('https://www.pinterest.com/pin-creation-tool/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    console.log(`      URL hiện tại: ${currentUrl}`);

    // Kiểm tra đăng nhập
    const loginBtn = await page.$('[data-test-id="simple-login-button"], button:has-text("Đăng nhập"), button:has-text("Log in")');
    if (loginBtn) {
      const errPath = path.join(__dirname, 'pinterest_login_required.png');
      await page.screenshot({ path: errPath });
      throw new Error(`Phiên đăng nhập Pinterest yêu cầu xác thực lại (Đã chụp ảnh: ${errPath})`);
    }

    // 4. Upload ảnh Pin
    console.log(`[3/6] Upload ảnh: ${path.basename(imageFullPath)}...`);
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 15000 });
    await fileInput.setInputFiles(imageFullPath);
    await page.waitForTimeout(3000);

    // 5. Điền Title
    console.log('[4/6] Điền Tiêu đề, Mô tả và Link...');
    const titleSelectors = [
      '[data-test-id="pin-draft-title"] input',
      'input[id*="title"]',
      'textarea[id*="title"]',
      'input[placeholder*="title" i]',
      'input[placeholder*="tiêu đề" i]',
      'textarea[placeholder*="title" i]',
      'textarea[placeholder*="tiêu đề" i]'
    ];
    let titleFilled = false;
    for (const sel of titleSelectors) {
      const el = await page.$(sel);
      if (el && await el.isVisible()) {
        await el.click();
        await el.fill(pin.title);
        titleFilled = true;
        console.log('      ✓ Đã điền Tiêu đề.');
        break;
      }
    }
    if (!titleFilled) {
      const firstInput = await page.$('input[type="text"], textarea');
      if (firstInput) {
        await firstInput.click();
        await firstInput.fill(pin.title);
        console.log('      ✓ Đã điền Tiêu đề (fallback).');
      }
    }

    // 6. Điền Description
    const descSelectors = [
      '[data-test-id="pin-draft-description"]',
      'div[contenteditable="true"][aria-label*="description" i]',
      'div[contenteditable="true"][aria-label*="mô tả" i]',
      'div[contenteditable="true"]',
      'textarea[id*="description"]',
      'textarea[placeholder*="description" i]'
    ];
    for (const sel of descSelectors) {
      const el = await page.$(sel);
      if (el && await el.isVisible()) {
        await el.click();
        try {
          await el.fill(pin.description);
        } catch {
          await page.keyboard.type(pin.description);
        }
        console.log('      ✓ Đã điền Mô tả & Hashtags Q4.');
        break;
      }
    }

    // 7. Điền Link Đích (đảm bảo https://agentwell.agency)
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
        await el.fill(pin.destination_link);
        console.log(`      ✓ Đã điền Link đích: ${pin.destination_link}`);
        break;
      }
    }

    // 8. Chọn hoặc tạo Bảng (Board)
    console.log(`[5/6] Chọn bảng: "${pin.board}"...`);
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
        await searchInput.fill(pin.board);
        await page.waitForTimeout(1200);
      }

      const boardItem = await page.$(
        `div[title="${pin.board}"], div:has-text("${pin.board}")`
      );
      if (boardItem && await boardItem.isVisible()) {
        await boardItem.click();
        console.log(`      ✓ Đã chọn bảng: "${pin.board}"`);
      } else {
        const createBtn = await page.$(
          '[data-test-id="create-board-button"], button:has-text("Create board"), button:has-text("Tạo bảng")'
        );
        if (createBtn) {
          await createBtn.click();
          await page.waitForTimeout(1000);
          const nameInput = await page.$('[data-test-id="board-name-input"] input, input[id*="board-name"]');
          if (nameInput) await nameInput.fill(pin.board);
          const submitBtn = await page.$('[data-test-id="create-board-submit-button"], button:has-text("Create"), button:has-text("Tạo")');
          if (submitBtn) await submitBtn.click();
          console.log(`      ✓ Đã tạo và chọn bảng mới: "${pin.board}"`);
        }
      }
    }

    await page.waitForTimeout(2000);
    const preScreenshot = path.join(__dirname, 'sample_q4_pin_preview.png');
    await page.screenshot({ path: preScreenshot });
    console.log(`      📸 Đã chụp ảnh preview trước khi đăng: ${preScreenshot}`);

    // 9. Bấm nút Publish / Xuất bản
    console.log('[6/6] Bấm nút Xuất bản (Publish)...');
    const publishBtn = await page.$(
      '[data-test-id="board-dropdown-save-button"], button[data-test-id="publish-button"], button:has-text("Publish"), button:has-text("Xuất bản"), button:has-text("Save"), button:has-text("Lưu")'
    );
    if (publishBtn) {
      await publishBtn.click();
      console.log('      Đang đợi Pinterest xử lý đăng bài...');
      await page.waitForTimeout(7000);

      const postScreenshot = path.join(__dirname, 'sample_q4_pin_published.png');
      await page.screenshot({ path: postScreenshot });
      console.log(`      📸 Đã chụp ảnh xác nhận sau khi đăng: ${postScreenshot}`);

      // Cập nhật trạng thái trong hàng đợi
      pin.status = 'published';
      pin.published_at = new Date().toISOString();
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');

      console.log('\n======================================================');
      console.log(`🎉 CHÚC MỪNG! ĐÃ ĐĂNG THÀNH CÔNG BÀI MẪU Q4: [${pin.id}]`);
      console.log(`   Tiêu đề: ${pin.title}`);
      console.log(`   Link:    ${pin.destination_link}`);
      console.log('======================================================\n');
    } else {
      console.log('⚠️ Không tìm thấy nút Publish trên trang tạo pin.');
    }

  } finally {
    if (page) await page.close();
    if (browser && !cdp.alive) await browser.close();
  }
}

runSampleTest().catch(err => {
  console.error('\n❌ Lỗi:', err.message);
  process.exit(1);
});
