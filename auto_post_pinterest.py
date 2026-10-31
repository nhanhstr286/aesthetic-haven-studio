import subprocess
import time
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_DIR = Path(r'C:\Users\DELL\.gemini\antigravity\scratch\aesthetic-haven-studio')
CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
USER_DATA_DIR = str(WORKSPACE_DIR / 'chrome_user_data')

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

def wait_for_pinterest_session(page):
    page.goto('https://www.pinterest.com/', wait_until='domcontentloaded')
    time.sleep(3)
    
    # Check if login button is present
    login_btn = (
        page.query_selector('[data-test-id="simple-login-button"]') or
        page.query_selector('button:has-text("Đăng nhập")') or
        page.query_selector('button:has-text("Log in")')
    )
    
    if not login_btn:
        print("Pinterest session is active and logged in!")
        return True

    print("\n" + "="*65)
    print("⚠️  PHÁT HIỆN PINTEREST CHƯA ĐĂNG NHẬP!")
    print("Đang mở hộp thoại đăng nhập trên trình duyệt...")
    print("Vui lòng quét mã QR hoặc đăng nhập tài khoản trên cửa sổ Chrome.")
    print("Script tự động phát hiện khi đăng nhập xong và tiếp tục tạo 4 Pins.")
    print("="*65 + "\n")
    
    try:
        login_btn.click()
    except Exception:
        pass
        
    for i in range(90):
        time.sleep(2)
        # Check if user logged in
        cur_login_btn = (
            page.query_selector('[data-test-id="simple-login-button"]') or
            page.query_selector('button:has-text("Đăng nhập")')
        )
        profile_btn = (
            page.query_selector('[data-test-id="header-profile"]') or
            page.query_selector('[aria-label*="Hồ sơ" i]') or
            page.query_selector('[aria-label*="Profile" i]')
        )
        
        if not cur_login_btn or profile_btn:
            print("Đăng nhập thành công! Bắt đầu đăng bài tự động...")
            time.sleep(2)
            return True
            
        if i % 10 == 0:
            print(f"Đang chờ đăng nhập... ({i*2}s)")
            
    print("Hết thời gian chờ đăng nhập (180s).")
    return False

def upload_pin(page, pin_data):
    print(f"\n==========================================")
    print(f"Đang xử lý Pin {pin_data['id']}: {pin_data['title']}")
    print(f"==========================================")
    
    # 1. Chuyển tới công cụ tạo Pin
    page.goto('https://www.pinterest.com/pin-creation-tool/', wait_until='domcontentloaded')
    time.sleep(4)
    
    # 2. Upload Ảnh & Guardrail Khóa Tỉ lệ 2:3 (1000x1500px)
    img_path = pin_data['image']
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Không tìm thấy file ảnh: {img_path}")
        
    from PIL import Image
    with Image.open(img_path) as im:
        if im.size != (1000, 1500):
            print(f"⚠️ Phát hiện ảnh {img_path} sai tỉ lệ ({im.size}). Đang tự động khóa 2:3 (1000x1500px)...")
            w, h = im.size
            scale = max(1000 / w, 1500 / h)
            new_w, new_h = int(round(w * scale)), int(round(h * scale))
            im_resized = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
            left = (new_w - 1000) // 2
            top = (new_h - 1500) // 2
            im_cropped = im_resized.crop((left, top, left + 1000, top + 1500))
            im_cropped.convert("RGB").save(img_path, "JPEG", quality=95)
            print(f"Đã khóa tỉ lệ 1000x1500px chuẩn: {img_path}")

    print(f"Đang tải ảnh: {img_path} (1000x1500px, 2:3 vertical)")
    file_input = page.wait_for_selector('input[type="file"]', timeout=15000)
    file_input.set_input_files(img_path)
    time.sleep(3)
    
    # 3. Điền Tiêu đề (Title)
    print("Điền Tiêu đề...")
    title_filled = False
    title_selectors = [
        '[data-test-id="pin-draft-title"] input',
        'input[id*="title"]',
        'textarea[id*="title"]',
        'input[placeholder*="title" i]',
        'input[placeholder*="tiêu đề" i]',
        'textarea[placeholder*="title" i]',
        'textarea[placeholder*="tiêu đề" i]',
        'div[contenteditable="true"][aria-label*="title" i]',
        'div[contenteditable="true"][aria-label*="tiêu đề" i]'
    ]
    for sel in title_selectors:
        el = page.query_selector(sel)
        if el and el.is_visible():
            el.click()
            el.fill(pin_data['title'])
            title_filled = True
            print(f"Đã điền Title với selector: {sel}")
            break
            
    if not title_filled:
        inputs = page.query_selector_all('input[type="text"], textarea')
        for inp in inputs:
            if inp.is_visible():
                inp.click()
                inp.fill(pin_data['title'])
                print("Đã điền Title bằng fallback")
                title_filled = True
                break

    time.sleep(1)

    # 4. Điền Mô tả (Description)
    print("Điền Mô tả...")
    desc_filled = False
    desc_selectors = [
        '[data-test-id="pin-draft-description"]',
        'div[contenteditable="true"][aria-label*="description" i]',
        'div[contenteditable="true"][aria-label*="mô tả" i]',
        'div[contenteditable="true"]',
        'textarea[id*="description"]',
        'textarea[placeholder*="description" i]',
        'textarea[placeholder*="mô tả" i]'
    ]
    for sel in desc_selectors:
        el = page.query_selector(sel)
        if el and el.is_visible():
            el.click()
            try:
                el.fill(pin_data['desc'])
            except Exception:
                page.keyboard.type(pin_data['desc'])
            desc_filled = True
            print(f"Đã điền Description với selector: {sel}")
            break

    time.sleep(1)

    # 5. Điền Liên kết (Link) với Pre-flight HTTP verification
    target_link = pin_data.get('link', 'https://agentwell.agency')
    try:
        import urllib.request
        req = urllib.request.Request(target_link, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as probe:
            if probe.status == 200:
                print(f"[PRE-FLIGHT] Link {target_link} trả về HTTP 200 OK.")
            else:
                print(f"[PRE-FLIGHT WARNING] Link trả về HTTP {probe.status}, fallback to homepage.")
                target_link = 'https://agentwell.agency'
    except Exception as e:
        print(f"[PRE-FLIGHT WARNING] Không probe được link ({e}), giữ link gốc hoặc fallback.")

    print(f"Điền Link: {target_link}...")
    link_filled = False
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
            el.fill(target_link)
            link_filled = True
            print(f"Đã điền Link với selector: {sel}")
            break

    time.sleep(1)

    # 6. Chọn hoặc Tạo Bảng (Board)
    target_board = pin_data['board']
    print(f"Chọn Bảng: '{target_board}'...")
    
    board_btn = (
        page.query_selector('[data-test-id="board-dropdown-select-button"]') or
        page.query_selector('button[aria-haspopup="listbox"]') or
        page.query_selector('button:has-text("Choose a board")') or
        page.query_selector('button:has-text("Chọn bảng")') or
        page.query_selector('button[aria-label*="bảng" i]') or
        page.query_selector('button[aria-label*="board" i]')
    )
    
    if board_btn:
        board_btn.click()
        time.sleep(2)
        
        search_input = (
            page.query_selector('[data-test-id="board-search-input"] input') or
            page.query_selector('input[placeholder*="Search" i]') or
            page.query_selector('input[placeholder*="Tìm kiếm" i]')
        )
        if search_input and search_input.is_visible():
            search_input.fill(target_board)
            time.sleep(1.5)
            
        board_item = (
            page.query_selector(f'div[title="{target_board}"]') or 
            page.query_selector(f'div:has-text("{target_board}")')
        )
        if board_item and board_item.is_visible():
            board_item.click()
            print(f"Đã chọn bảng có sẵn: {target_board}")
        else:
            create_board_btn = (
                page.query_selector('[data-test-id="create-board-button"]') or
                page.query_selector('button:has-text("Create board")') or
                page.query_selector('button:has-text("Tạo bảng")') or
                page.query_selector('div:has-text("Create board")') or
                page.query_selector('div:has-text("Tạo bảng")')
            )
            if create_board_btn:
                print(f"Chưa có bảng, đang tạo mới: '{target_board}'")
                create_board_btn.click()
                time.sleep(2)
                
                board_name_input = (
                    page.query_selector('[data-test-id="board-name-input"] input') or
                    page.query_selector('input[id*="board-name"]') or
                    page.query_selector('input[placeholder*="Name" i]') or
                    page.query_selector('input[placeholder*="Tên" i]')
                )
                if board_name_input:
                    board_name_input.fill(target_board)
                    time.sleep(1)
                    
                submit_create = (
                    page.query_selector('[data-test-id="create-board-submit-button"]') or
                    page.query_selector('button:has-text("Create")') or
                    page.query_selector('button:has-text("Tạo")')
                )
                if submit_create:
                    submit_create.click()
                    print(f"Đã tạo và chọn bảng: {target_board}")
                    time.sleep(2)
    else:
        print("Không tìm thấy nút chọn bảng, dùng bảng mặc định.")

    time.sleep(2)
    screenshot_path = str(WORKSPACE_DIR / f"pin{pin_data['id']}_filled.png")
    page.screenshot(path=screenshot_path)
    print(f"Đã chụp ảnh trước khi đăng: {screenshot_path}")

    # 7. Nhấn Publish / Xuất bản
    print("Nhấn nút Xuất bản/Publish...")
    publish_btn = (
        page.query_selector('[data-test-id="board-dropdown-save-button"]') or
        page.query_selector('button[data-test-id="publish-button"]') or
        page.query_selector('button:has-text("Publish")') or
        page.query_selector('button:has-text("Xuất bản")') or
        page.query_selector('button:has-text("Save")') or
        page.query_selector('button:has-text("Lưu")')
    )
    
    if publish_btn:
        publish_btn.click()
        print("Đã click Xuất bản. Đang chờ xác nhận từ Pinterest...")
        time.sleep(6)
        
        post_screenshot_path = str(WORKSPACE_DIR / f"pin{pin_data['id']}_published.png")
        page.screenshot(path=post_screenshot_path)
        print(f"Đã chụp ảnh xác nhận sau khi đăng: {post_screenshot_path}")
        print(f"Pin {pin_data['id']} đã đăng thành công!")
    else:
        print(f"Không tìm thấy nút Publish cho Pin {pin_data['id']}.")

def main():
    chrome_proc = ensure_chrome_running()
    
    try:
        with sync_playwright() as p:
            print("Đang kết nối Playwright qua CDP (http://localhost:9222)...")
            browser = None
            for i in range(15):
                try:
                    browser = p.chromium.connect_over_cdp('http://localhost:9222')
                    print("Đã kết nối Chrome thành công qua CDP!")
                    break
                except Exception:
                    time.sleep(1)
            
            if not browser:
                print("Lỗi: Không thể kết nối tới Chrome qua CDP.")
                return
                
            context = browser.contexts[0]
            page = context.pages[0] if context.pages else context.new_page()
            page.set_default_timeout(25000)
            
            # Kiểm tra trạng thái đăng nhập
            is_logged_in = wait_for_pinterest_session(page)
            if not is_logged_in:
                print("Vui lòng chạy lại script sau khi hoàn tất đăng nhập.")
                return
            
            # Đăng lần lượt 4 Pins
            for pin in PINS:
                try:
                    upload_pin(page, pin)
                    time.sleep(3)
                except Exception as e:
                    print(f"Lỗi khi đăng Pin {pin['id']}: {e}")
                    page.screenshot(path=str(WORKSPACE_DIR / f"pin{pin['id']}_error.png"))
                    
            print("\n Hoàn thành toàn bộ quy trình đăng 4 bài Pin lên Pinterest!")
            
    finally:
        print("Quy trình tự động hóa hoàn tất.")

if __name__ == '__main__':
    main()
