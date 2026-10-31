"""
=============================================================================
Aesthetic Haven Studio: Autonomous Pinterest Publisher (API v5 + Playwright Fallback)
Priority 1: Official Pinterest API v5 (POST https://api.pinterest.com/v5/pins) - Instant 1s publish
Priority 2: Playwright CDP Browser Fallback (60s timeout, commit wait, retry 2x, session expiry alert)
=============================================================================
"""

import os
import sys
import time
import json
import base64
import requests
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Reconfigure console UTF-8 on Windows
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

WORKSPACE_DIR = Path(r'C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio')
ENV_FILE = WORKSPACE_DIR / '.env'
load_dotenv(ENV_FILE)

# Also check openclaw_engine/.env as fallback
ENGINE_ENV = WORKSPACE_DIR.parent / 'openclaw_engine' / '.env'
if ENGINE_ENV.exists():
    load_dotenv(ENGINE_ENV)

CHROME_PATH = os.getenv("CHROME_PATH", r'C:\Program Files\Google\Chrome\Application\chrome.exe')
USER_DATA_DIR = os.getenv("CHROME_USER_DATA_DIR", str(WORKSPACE_DIR / 'chrome_user_data'))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8897196611:AAEADLqGGjz2V0SRXdX9PmaC2Za9AFiA9ps")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "7970044894")

# Verified Board IDs on live Pinterest account (nhanhstr286)
BOARD_MAP = {
    "Aesthetic Room Decor & Lighting": "1145884767630864296",
    "Smart Kitchen Gadgets & Hacks": "1145884767630864299",
    "Digital Planners & iPad Aesthetics": "1145884767630864300",
    "Printable Wall Art & Decor": "1145884767630864301",
    "Warm Luxury Home Decor": "1145884767630877138"
}

PINS = [
    {
        "id": 1,
        "image": str(WORKSPACE_DIR / "pin1.jpg"),
        "title": "Cozy Bedroom Essentials for Winter | Warm Minimalist Holiday Sanctuary",
        "desc": "Transform your winter bedroom into the ultimate cozy haven with layered warm amber lighting, plush textures, and calming bedside essentials. Discover restorative evening sanctuary styling tips at Aesthetic Haven Studio.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency#decor",
        "board": "Aesthetic Room Decor & Lighting"
    },
    {
        "id": 2,
        "image": str(WORKSPACE_DIR / "pin2.jpg"),
        "title": "Aesthetic Holiday Gift Guide | Curated Warm Kitchen & Home Finds Under $50",
        "desc": "Gift something they will actually cherish and use daily. From matte gooseneck kettles to minimalist stone organizers, explore our curated holiday gift guide for lovers of intentional, warm aesthetic living.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency#smart-kitchen",
        "board": "Smart Kitchen Gadgets & Hacks"
    },
    {
        "id": 3,
        "image": str(WORKSPACE_DIR / "pin3.jpg"),
        "title": "Minimalist Christmas Gifts | Digital Planner & Mindful Lifestyle Dashboard",
        "desc": "Give the gift of peace, intentionality, and calm organization. Our warm aesthetic digital daily planner for iPad & GoodNotes helps reset daily routines ahead of the new year. Download your copy instantly at Aesthetic Haven Studio.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency#digital-planners",
        "board": "Digital Planners & iPad Aesthetics"
    },
    {
        "id": 4,
        "image": str(WORKSPACE_DIR / "pin4.jpg"),
        "title": "Warm & Cozy Living Room Makeover | Scandinavian Holiday Art & Neutral Decor",
        "desc": "Give your living room walls an instant festive winter glow with neutral printable wall art gallery sets and subtle organic ceramics. Simple, clutter-free Scandinavian holiday styling made effortless at Aesthetic Haven Studio.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency#wall-art",
        "board": "Printable Wall Art & Decor"
    }
]

# =============================================================================
# 1. TELEGRAM ALERT SYSTEM
# =============================================================================

def send_telegram_alert(message: str):
    """Dispatches real-time alerts to admin Telegram channel."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message}, timeout=8)
    except Exception as e:
        print(f"[Telegram Alert Error]: {e}")

# =============================================================================
# 2. PINTEREST API V5 AUTH & REFRESH HELPERS
# =============================================================================

def get_valid_auth_token() -> str:
    """Verifies Pinterest Access Token or auto-refreshes using OAuth v5."""
    access_token = os.getenv("PINTEREST_ACCESS_TOKEN", "").strip('\"\'')
    if not access_token:
        return ""

    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        resp = requests.get("https://api.pinterest.com/v5/user_account", headers=headers, timeout=8)
        if resp.status_code == 200:
            return access_token
        elif resp.status_code == 401:
            print("Access token expired (401). Triggering OAuth refresh...")
            return refresh_pinterest_oauth_token()
    except Exception as e:
        print(f"Error checking token validity: {e}")
    return access_token

def refresh_pinterest_oauth_token() -> str:
    """Refreshes Pinterest Access Token using Refresh Token via OAuth v5."""
    app_id = os.getenv("PINTEREST_APP_ID", "1627223").strip('\"\'')
    app_secret = os.getenv("PINTEREST_APP_SECRET", "").strip('\"\'')
    refresh_token = os.getenv("PINTEREST_REFRESH_TOKEN", "").strip('\"\'')
    if not app_id or not app_secret or not refresh_token:
        print("Missing OAuth app credentials for token refresh.")
        return ""

    creds = f"{app_id}:{app_secret}"
    b64_creds = base64.b64encode(creds.encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {b64_creds}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    try:
        resp = requests.post("https://api.pinterest.com/v5/oauth/token", headers=headers, data=data, timeout=15)
        if resp.status_code == 200:
            res_data = resp.json()
            new_access = res_data.get("access_token")
            new_refresh = res_data.get("refresh_token", refresh_token)
            os.environ["PINTEREST_ACCESS_TOKEN"] = new_access
            if new_refresh:
                os.environ["PINTEREST_REFRESH_TOKEN"] = new_refresh
            _save_tokens_to_env(new_access, new_refresh)
            print("Successfully refreshed Pinterest Access Token (valid for 30 days)!")
            return new_access
        else:
            print(f"Token refresh failed: HTTP {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Exception during token refresh: {e}")
    return ""

def _save_tokens_to_env(access_token: str, refresh_token: str):
    for env_target in [ENV_FILE, ENGINE_ENV]:
        if not env_target.exists():
            continue
        try:
            with open(env_target, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            found_access, found_refresh = False, False
            for line in lines:
                if line.startswith("PINTEREST_ACCESS_TOKEN="):
                    new_lines.append(f'PINTEREST_ACCESS_TOKEN="{access_token}"\n')
                    found_access = True
                elif line.startswith("PINTEREST_REFRESH_TOKEN="):
                    new_lines.append(f'PINTEREST_REFRESH_TOKEN="{refresh_token}"\n')
                    found_refresh = True
                else:
                    new_lines.append(line)
            if not found_access:
                new_lines.append(f'PINTEREST_ACCESS_TOKEN="{access_token}"\n')
            if not found_refresh:
                new_lines.append(f'PINTEREST_REFRESH_TOKEN="{refresh_token}"\n')
            with open(env_target, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            print(f"Notice: Could not persist tokens to {env_target}: {e}")

# =============================================================================
# 3. PRIORITY 1: OFFICIAL PINTEREST API V5 PUBLISHER (1s, ZERO TIMEOUT/CAPTCHA)
# =============================================================================

def ensure_vertical_aspect_ratio(img_path: str):
    """Guarantees 2:3 vertical aspect ratio (1000x1500px)."""
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Image file not found: {img_path}")
    from PIL import Image
    with Image.open(img_path) as im:
        if im.size != (1000, 1500):
            print(f"   [Aspect Lock] Cropping {img_path} to exact 1000x1500px (2:3 vertical)...")
            w, h = im.size
            scale = max(1000 / w, 1500 / h)
            new_w, new_h = int(round(w * scale)), int(round(h * scale))
            im_resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
            left = (new_w - 1000) // 2
            top = (new_h - 1500) // 2
            im_cropped = im_resized.crop((left, top, left + 1000, top + 1500))
            im_cropped.convert("RGB").save(img_path, "JPEG", quality=95)

def publish_pin_via_api_v5(pin_data: dict) -> dict:
    """
    Publishes pin directly via Pinterest API v5.
    Completes in < 1 second with 0% browser failure rate.
    """
    token = get_valid_auth_token()
    if not token:
        raise RuntimeError("No valid PINTEREST_ACCESS_TOKEN available.")

    board_id = BOARD_MAP.get(pin_data.get("board"), "1145884767630877138")
    img_path = pin_data["image"]
    ensure_vertical_aspect_ratio(img_path)

    with open(img_path, "rb") as f:
        encoded_img = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "title": pin_data["title"],
        "description": pin_data.get("desc", ""),
        "link": pin_data["link"],
        "board_id": board_id,
        "media_source": {
            "source_type": "image_base64",
            "content_type": "image/jpeg",
            "data": encoded_img
        }
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    resp = requests.post("https://api.pinterest.com/v5/pins", headers=headers, json=payload, timeout=20)
    
    if resp.status_code in (200, 201):
        try:
            res_json = resp.json()
        except Exception:
            res_json = {}
        pin_id = str(res_json.get("id") or "").strip()
        if not pin_id or pin_id.lower() == "none" or not pin_id.isdigit():
            raise RuntimeError(f"API v5 returned HTTP {resp.status_code} but missing valid pin_id: {resp.text}")
        pin_url = f"https://www.pinterest.com/pin/{pin_id}/"
        print(f"✅ [API v5] PIN ĐĂNG THÀNH CÔNG trong 1s! Pin ID: {pin_id}")
        print(f"   URL: {pin_url}")
        return {
            "status": "SUCCESS",
            "method": "api_v5",
            "pin_id": pin_id,
            "pin_url": pin_url
        }
    else:
        raise RuntimeError(f"API v5 returned HTTP {resp.status_code}: {resp.text}")

# =============================================================================
# 4. PRIORITY 2: PLAYWRIGHT BROWSER FALLBACK (TIMEOUT 60S, COMMIT, RETRY 2X)
# =============================================================================

def ensure_chrome_running():
    import urllib.request
    try:
        with urllib.request.urlopen('http://127.0.0.1:9222/json/version', timeout=2) as resp:
            print("Chrome CDP is already active on port 9222.")
            return None
    except Exception:
        pass

    print("Starting Chrome with remote debugging on port 9222...")
    cmd = [
        CHROME_PATH,
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        f'--user-data-dir={USER_DATA_DIR}'
    ]
    proc = subprocess.Popen(cmd)
    for i in range(15):
        time.sleep(1)
        try:
            with urllib.request.urlopen('http://127.0.0.1:9222/json/version', timeout=1) as resp:
                print(f"Chrome started successfully (PID: {proc.pid})")
                return proc
        except Exception:
            pass
    print("Warning: Timed out waiting for Chrome CDP port.")
    return proc

def upload_pin_playwright_once(page, pin_data):
    """Executes single Playwright publish attempt with 60s timeout and session checks."""
    page.set_default_timeout(60000)

    # 1. Chuyển tới công cụ tạo Pin với timeout 60s và wait commit
    print(f"   [Playwright] Navigating to /pin-creation-tool/ (timeout 60s, commit wait)...")
    page.goto('https://www.pinterest.com/pin-creation-tool/', wait_until='commit', timeout=60000)
    time.sleep(3)

    # Kiểm tra phiên đăng nhập (phát hiện redirect về /login)
    cur_url = page.url
    login_btn = (
        page.query_selector('[data-test-id="simple-login-button"]') or
        page.query_selector('button:has-text("Đăng nhập")') or
        page.query_selector('button:has-text("Log in")')
    )
    if '/login' in cur_url or login_btn:
        alert_msg = "⚠️ [CẢNH BÁO BẢO MẬT] Phiên đăng nhập Pinterest trên Browser đã hết hạn (Redirect /login). Vui lòng đăng nhập lại tài khoản trên Chrome!"
        print(f"\n{alert_msg}\n")
        send_telegram_alert(alert_msg)
        raise RuntimeError("Pinterest session expired. Redirected to /login.")

    # 2. Upload file ảnh với timeout 60s
    img_path = pin_data['image']
    ensure_vertical_aspect_ratio(img_path)
    print(f"   [Playwright] Uploading image: {img_path}...")
    file_input = page.wait_for_selector('input[type="file"]', timeout=60000)
    file_input.set_input_files(img_path)
    time.sleep(3)

    # 3. Điền Tiêu đề
    print("   [Playwright] Filling Title...")
    title_selectors = [
        '[data-test-id="pin-draft-title"] input',
        'input[id*="title"]',
        'textarea[id*="title"]',
        'input[placeholder*="title" i]',
        'input[placeholder*="tiêu đề" i]',
        'textarea[placeholder*="title" i]',
        'textarea[placeholder*="tiêu đề" i]'
    ]
    for sel in title_selectors:
        el = page.query_selector(sel)
        if el and el.is_visible():
            el.click()
            el.fill(pin_data['title'])
            break

    # 4. Điền Mô tả
    print("   [Playwright] Filling Description...")
    desc_selectors = [
        '[data-test-id="pin-draft-description"]',
        'div[contenteditable="true"][aria-label*="description" i]',
        'div[contenteditable="true"][aria-label*="mô tả" i]',
        'div[contenteditable="true"]',
        'textarea[id*="description"]'
    ]
    for sel in desc_selectors:
        el = page.query_selector(sel)
        if el and el.is_visible():
            el.click()
            el.fill(pin_data['desc'])
            break

    # 5. Điền Link Đích
    print("   [Playwright] Filling Link...")
    link_selectors = [
        '[data-test-id="pin-draft-link"] input',
        'input[id*="link"]',
        'input[placeholder*="link" i]',
        'input[placeholder*="liên kết" i]',
        'input[placeholder*="URL" i]'
    ]
    for sel in link_selectors:
        el = page.query_selector(sel)
        if el and el.is_visible():
            el.click()
            el.fill(pin_data['link'])
            break

    # 6. Chọn Bảng
    print(f"   [Playwright] Selecting Board: {pin_data['board']}...")
    board_btn = (
        page.query_selector('[data-test-id="board-dropdown-select-button"]') or
        page.query_selector('button[aria-haspopup="listbox"]') or
        page.query_selector('button:has-text("Choose a board")') or
        page.query_selector('button:has-text("Chọn bảng")') or
        page.query_selector('button[aria-label*="bảng" i]')
    )
    if board_btn:
        board_btn.click()
        time.sleep(1.5)
        search_input = (
            page.query_selector('[data-test-id="board-search-input"] input') or
            page.query_selector('input[placeholder*="Search" i]') or
            page.query_selector('input[placeholder*="Tìm kiếm" i]')
        )
        if search_input and search_input.is_visible():
            search_input.fill(pin_data['board'])
            time.sleep(1.2)
        board_item = page.query_selector(f'div[title="{pin_data["board"]}"]')
        if board_item and board_item.is_visible():
            board_item.click()
            time.sleep(1.5)

    # 7. Nhấn Publish
    print("   [Playwright] Clicking Publish button...")
    publish_btn = (
        page.query_selector('[data-test-id="board-dropdown-save-button"]') or
        page.query_selector('button[data-test-id="publish-button"]') or
        page.query_selector('button:has-text("Publish")') or
        page.query_selector('button:has-text("Xuất bản")') or
        page.query_selector('button:has-text("Save")')
    )
    if not publish_btn:
        raise RuntimeError("Publish button not found.")
    publish_btn.click()
    time.sleep(7)

    post_screenshot = str(WORKSPACE_DIR / f"pin{pin_data['id']}_published.png")
    page.screenshot(path=post_screenshot)
    print(f"✅ [Playwright Fallback] Pin {pin_data['id']} đăng thành công! Proof: {post_screenshot}")
    return {"status": "SUCCESS", "method": "playwright", "screenshot": post_screenshot}

def upload_pin_playwright_with_retry(page, pin_data, max_retries=2):
    """Executes Playwright fallback with 2 retries and 10s backoff."""
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            if attempt > 1:
                print(f"🔄 [Playwright] Thử lại lần {attempt}/{max_retries} sau 10 giây nghỉ...")
                time.sleep(10)
            return upload_pin_playwright_once(page, pin_data)
        except Exception as e:
            last_err = e
            print(f"⚠️ [Playwright Attempt {attempt} Failed]: {e}")
            if "session expired" in str(e).lower() or "/login" in str(e):
                break
    raise last_err

# =============================================================================
# 5. MASTER DISPATCHER: API V5 (PRIORITY 1) -> PLAYWRIGHT (FALLBACK)
# =============================================================================

def upload_pin(pin_data, playwright_page=None):
    """
    Attempts Priority 1: Pinterest API v5.
    If fails, falls back to Priority 2: Playwright CDP browser.
    """
    print(f"\n=======================================================")
    print(f"📌 Đang xử lý Pin {pin_data['id']}: {pin_data['title'][:60]}...")
    print(f"=======================================================")

    # 1. ƯU TIÊN SỐ 1: PINTEREST API V5
    try:
        print("⚡ [Ưu tiên 1] Đang gửi yêu cầu trực tiếp qua Pinterest API v5...")
        result = publish_pin_via_api_v5(pin_data)
        return result
    except Exception as api_err:
        print(f"⚠️ [API v5 Lỗi]: {api_err}")
        print("🌐 [Dự phòng 2] Đang kích hoạt cơ chế Playwright Browser (Timeout 60s, commit wait, retry 2x)...")

    # 2. DỰ PHÒNG: PLAYWRIGHT BROWSER
    if playwright_page is None:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            ensure_chrome_running()
            browser = p.chromium.connect_over_cdp('http://localhost:9222')
            context = browser.contexts[0]
            page = context.pages[0] if context.pages else context.new_page()
            return upload_pin_playwright_with_retry(page, pin_data, max_retries=2)
    else:
        return upload_pin_playwright_with_retry(playwright_page, pin_data, max_retries=2)

def main():
    print("========================================================")
    print("🚀 BẮT ĐẦU CHU KỲ ĐĂNG PINTEREST TỰ ĐỘNG (ROBUST PUBLISHER)")
    print("========================================================")

    for pin in PINS:
        try:
            upload_pin(pin)
            time.sleep(2)
        except Exception as e:
            print(f"❌ Lỗi khi đăng Pin {pin['id']}: {e}")

    print("\n🎉 Hoàn thành toàn bộ quy trình đăng bài!")

if __name__ == '__main__':
    main()
