import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 5 Curated High-Res Unsplash Base Photos (Warm Minimalist / Japandi / Warm Lighting)
PINS_CONFIG = [
    {
        "filename": "pin1_3light_rule.jpg",
        "url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&h=1800&q=85",
        "badge": "BEDROOM SANCTUARY FORMULA",
        "title": "The 3-Light\nSanctuary Rule",
        "subtitle": "How to layer ambient, task & accent glow to transform any room into a cozy haven.",
        "cta": "Tap to get the free guide →",
        "category_badge": "✨ WARM LIGHTING TIPS"
    },
    {
        "filename": "pin2_winddown_ritual.jpg",
        "url": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&h=1800&q=85",
        "badge": "EVENING COZY RITUALS",
        "title": "Bedside\nWind-Down Ritual",
        "subtitle": "Intentional nightstand essentials & warm low-light settings for peaceful sleep.",
        "cta": "Tap to get the free guide →",
        "category_badge": "🌙 NIGHTSTAND FINDS"
    },
    {
        "filename": "pin3_reading_nook.jpg",
        "url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&h=1800&q=85",
        "badge": "CORNER INSPIRATION",
        "title": "Minimalist\nReading Nook",
        "subtitle": "Warm boucle textures, sculptural arched lamps & quiet intentional corners.",
        "cta": "Tap to get the free guide →",
        "category_badge": "📖 JAPANDI LIVING"
    },
    {
        "filename": "pin4_ceiling_vs_ambient.jpg",
        "url": "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&h=1800&q=85",
        "badge": "LIGHTING DESIGN CHEATSHEET",
        "title": "Ceiling Light vs.\nAmbient Light",
        "subtitle": "Why turning off the harsh overhead bulb changes your evening mood completely.",
        "cta": "Tap to get the free guide →",
        "category_badge": "💡 AMBIENT MOOD"
    },
    {
        "filename": "pin5_free_checklist.jpg",
        "url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&h=1800&q=85",
        "badge": "FREE DOWNLOADABLE GUIDE",
        "title": "Free Sanctuary\nLighting Checklist",
        "subtitle": "Kelvin temperature guide, warm bulb specs & room-by-room glow placement map.",
        "cta": "Tap to claim free guide →",
        "category_badge": "🎁 FREE PDF GUIDE"
    }
]

# Fonts setup (using Windows system fonts)
FONT_DIR = "C:/Windows/Fonts"
font_title = ImageFont.truetype(os.path.join(FONT_DIR, "georgiab.ttf"), 68)
font_subtitle = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 28)
font_badge = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 20)
font_brand = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 22)
font_cta = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 26)
font_url = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 20)

TARGET_SIZE = (1000, 1500)

def create_pin_image(config):
    filename = config["filename"]
    out_path = os.path.join(OUTPUT_DIR, filename)
    print(f"Creating Pin: {filename}...")

    # 1. Download image
    req = urllib.request.Request(config["url"], headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw_img = Image.open(resp).convert("RGB")
    except Exception as e:
        print(f"Failed to fetch {config['url']}, using fallback canvas: {e}")
        raw_img = Image.new("RGB", TARGET_SIZE, color=(240, 235, 226))

    # 2. Resize and Center-Crop to exact 1000x1500
    img = ImageOps.fit(raw_img, TARGET_SIZE, Image.Resampling.LANCZOS)

    # 3. Apply soft warm overlay gradient for readability
    # Gradient overlay: dark gradient at top and bottom, clean center
    overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)

    # Top gradient (dark charcoal/espresso fade)
    for y in range(450):
        alpha = int(140 * (1.0 - (y / 450.0) ** 1.3))
        draw_overlay.line([(0, y), (1000, y)], fill=(20, 18, 16, alpha))

    # Bottom gradient (warm espresso shadow for CTA card contrast)
    for y in range(1500 - 350, 1500):
        factor = (y - (1500 - 350)) / 350.0
        alpha = int(170 * (factor ** 1.2))
        draw_overlay.line([(0, y), (1000, y)], fill=(18, 16, 14, alpha))

    # Center card tint (subtle glassmorphism container for text)
    # White card at top with rounded corners
    card_top = 100
    card_left = 60
    card_right = 940
    card_bottom = 580

    card_overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    draw_card = ImageDraw.Draw(card_overlay)

    # Warm cream editorial card with soft border
    draw_card.rounded_rectangle(
        [(card_left, card_top), (card_right, card_bottom)],
        radius=28,
        fill=(250, 248, 245, 230),  # #FAF8F5 with 90% opacity
        outline=(234, 230, 223, 240), # #EAE6DF
        width=2
    )

    # Merge overlays
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img = Image.alpha_composite(img, card_overlay)

    # 4. Draw Typography & Badges
    draw = ImageDraw.Draw(img)

    # A. Top Brand Watermark
    brand_text = "AESTHETIC HAVEN STUDIO"
    draw.text((card_left + 40, card_top + 36), brand_text, fill=(140, 130, 120), font=font_brand)

    # B. Category Pill Badge
    badge_text = config["category_badge"]
    badge_bbox = font_badge.getbbox(badge_text)
    bw = badge_bbox[2] - badge_bbox[0] + 28
    bh = badge_bbox[3] - badge_bbox[1] + 16
    bx = card_right - 40 - bw
    by = card_top + 30
    draw.rounded_rectangle(
        [(bx, by), (bx + bw, by + bh)],
        radius=12,
        fill=(192, 112, 83, 35), # terracotta light
        outline=(192, 112, 83, 160),
        width=1
    )
    draw.text((bx + 14, by + 6), badge_text, fill=(160, 80, 55), font=font_badge)

    # Thin separator line inside card
    draw.line([(card_left + 40, card_top + 78), (card_right - 40, card_top + 78)], fill=(234, 230, 223), width=1)

    # C. Main Editorial Headline (Serif Georgia Bold)
    title_y = card_top + 105
    for line in config["title"].split("\n"):
        draw.text((card_left + 40, title_y), line, fill=(31, 31, 31), font=font_title)
        title_y += 76

    # D. Subtitle (Sans-serif Segoe UI)
    subtitle_y = title_y + 16
    # Word wrap subtitle within max width
    words = config["subtitle"].split(" ")
    curr_line = ""
    for w in words:
        test_line = f"{curr_line} {w}".strip()
        bbox = font_subtitle.getbbox(test_line)
        if (bbox[2] - bbox[0]) < (card_right - card_left - 80):
            curr_line = test_line
        else:
            draw.text((card_left + 40, subtitle_y), curr_line, fill=(90, 85, 80), font=font_subtitle)
            subtitle_y += 38
            curr_line = w
    if curr_line:
        draw.text((card_left + 40, subtitle_y), curr_line, fill=(90, 85, 80), font=font_subtitle)

    # E. Bottom Floating CTA Badge (High-converting Pinterest element)
    cta_bottom = 1420
    cta_top = 1330
    cta_left = 80
    cta_right = 920

    # Draw bottom glassmorphic CTA pill
    cta_overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    draw_cta = ImageDraw.Draw(cta_overlay)
    draw_cta.rounded_rectangle(
        [(cta_left, cta_top), (cta_right, cta_bottom)],
        radius=26,
        fill=(31, 31, 31, 235), # Dark charcoal #1F1F1F
        outline=(240, 235, 225, 60),
        width=1
    )
    img = Image.alpha_composite(img, cta_overlay)
    draw = ImageDraw.Draw(img)

    # Text inside CTA pill
    cta_str = config["cta"]
    draw.text((cta_left + 40, cta_top + 28), cta_str, fill=(250, 248, 245), font=font_cta)

    domain_str = "agentwell.agency"
    d_bbox = font_url.getbbox(domain_str)
    dw = d_bbox[2] - d_bbox[0]
    draw.text((cta_right - 40 - dw, cta_top + 33), domain_str, fill=(180, 175, 170), font=font_url)

    # 5. Convert back to RGB and save high quality JPEG
    final_img = img.convert("RGB")
    final_img.save(out_path, "JPEG", quality=92, optimize=True)
    print(f"Saved: {out_path} ({os.path.getsize(out_path)} bytes)")

for pin in PINS_CONFIG:
    create_pin_image(pin)

print("\nAll 5 Pinterest Pins generated successfully!")
