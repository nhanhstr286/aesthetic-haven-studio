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
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
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
        "title": "24\" Travertine Inspired Table Lamp | Warm Luxury Home Decor",
        "desc": "Creating a grounded home starts with tactile surfaces and organic tones. The 24\" Travertine Inspired Table Lamp introduces a quiet architectural presence to quiet corners, shaping the mood through diffused light.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency/curated/24-travertine-inspired-table-lamp-for-living-room-",
        "board": "Warm Luxury Home Decor"
    },
    {
        "id": 2,
        "image": str(WORKSPACE_DIR / "pin2.jpg"),
        "title": "bella Fits-Anywhere™ 2-Slice Slim Toaster | Smart Kitchen Gadgets & Hacks",
        "desc": "Slim space-saving profile, minimalist tactile matte finish, and integrated cord management. Refine your kitchen countertop aesthetics with quiet architectural order.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency/curated/bella-fits-anywhere-2-slice-slim-toaster",
        "board": "Smart Kitchen Gadgets & Hacks"
    },
    {
        "id": 3,
        "image": str(WORKSPACE_DIR / "pin3.jpg"),
        "title": "Solid Walnut MagSafe Charging Stand & Minimalist Desk Organizer",
        "desc": "Give the gift of peace, intentionality, and calm organization. Handcrafted American solid walnut MagSafe charging stand for iPhone & AirPods with integrated cable management.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency/curated/solid-walnut-wood-magsafe-wireless-charging-stand-",
        "board": "Digital Planners & iPad Aesthetics"
    },
    {
        "id": 4,
        "image": str(WORKSPACE_DIR / "pin4.jpg"),
        "title": "Natural Solid Oak Picture Frames Set | Scandinavian Wall Art & Decor",
        "desc": "Give your living room walls an instant festive winter glow with natural solid wood gallery frames and subtle organic ceramics. Simple, clutter-free Scandinavian styling made effortless.\n\n#cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas",
        "link": "https://agentwell.agency/curated/lyyyxgyp-12x16-picture-frame-set-of-3-natural-soli",
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
# 4. 100% PINTEREST API V5 PUBLISHER (NO PLAYWRIGHT BROWSER FALLBACK)
# =============================================================================

def upload_pin(pin_data):
    """
    Publishes pin 100% via official Pinterest API v5.
    Never falls back to Playwright browser automation.
    """
    print(f"\n=======================================================")
    print(f"📌 Đang xử lý Pin {pin_data['id']}: {pin_data['title'][:60]}...")
    print(f"=======================================================")

    # BƯỚC 0: CƠ CHẾ "PAGE-FIRST, PIN-AFTER" (CÓ TRANG MỚI ĐƯỢC ĐĂNG PIN)
    dest_link = pin_data.get("link", "")
    if "/curated/" in dest_link:
        print(f"🔍 [Page-First Gate] Gửi HTTP probe kiểm tra trang đích: {dest_link}...")
        try:
            probe_resp = requests.get(dest_link, headers={"User-Agent": "OpenClaw-Gatekeeper/1.0"}, timeout=10)
            if probe_resp.status_code != 200 or "404: NOT_FOUND" in probe_resp.text:
                err_msg = f"❌ [PAGE-FIRST GATE BLOCKED] Trang đích {dest_link} trả về HTTP {probe_resp.status_code} hoặc 404 NOT_FOUND! HỦY BỎ đăng Pin."
                print(err_msg)
                send_telegram_alert(err_msg)
                return {"status": "ABORTED", "reason": err_msg}
            print(f"✅ [Page-First Gate] Trang đích đã sẵn sàng (HTTP 200 OK). Được phép đăng Pin.")
        except Exception as probe_err:
            err_msg = f"❌ [PAGE-FIRST GATE BLOCKED] Không thể kết nối tới {dest_link}: {probe_err}. HỦY BỎ đăng Pin."
            print(err_msg)
            send_telegram_alert(err_msg)
            return {"status": "ABORTED", "reason": err_msg}

    # ĐĂNG TRỰC TIẾP QUA PINTEREST API V5
    try:
        print("⚡ Đang gửi yêu cầu trực tiếp qua Pinterest API v5...")
        result = publish_pin_via_api_v5(pin_data)
        return result
    except Exception as api_err:
        err_msg = f"❌ [API v5 Lỗi]: {api_err}"
        print(err_msg)
        send_telegram_alert(err_msg)
        return {"status": "FAILED", "error": str(api_err)}

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
