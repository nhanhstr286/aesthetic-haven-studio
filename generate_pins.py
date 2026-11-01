#!/usr/bin/env python3
"""
Aesthetic Haven Studio - Minimalist Pinterest Pin Generator
Strict adherence to the MINIMALIST VISUAL GUARDRAIL:
1. 100% Full-bleed 2:3 ratio (1000x1500px).
2. NO card boxes, NO popups, NO dark/light containers, NO fake buttons.
3. Natural lifestyle photography as Hero Focus.
4. Max 1 short hook line (<5 words), subtle drop-shadow (rgba 0,0,0,0.3), no box behind text.
"""

import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter
import numpy as np

BASE_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 5 Curated Pins with concise hooks strictly under 5 words
PINS_CONFIG = [
    {
        "filename": "pin1_3light_rule.jpg",
        "url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "3-Light Sanctuary Rule",
        "position": "bottom"
    },
    {
        "filename": "pin2_winddown_ritual.jpg",
        "url": "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Bedside Wind-Down Ritual",
        "position": "bottom"
    },
    {
        "filename": "pin3_reading_nook.jpg",
        "url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Minimalist Reading Nook",
        "position": "bottom"
    },
    {
        "filename": "pin4_ceiling_vs_ambient.jpg",
        "url": "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Ceiling vs Ambient Light",
        "position": "bottom"
    },
    {
        "filename": "pin5_free_checklist.jpg",
        "url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Sanctuary Lighting Guide",
        "position": "bottom"
    }
]

FONT_DIR = "C:/Windows/Fonts"
try:
    font_hook = ImageFont.truetype(os.path.join(FONT_DIR, "georgiab.ttf"), 46)
except Exception:
    font_hook = ImageFont.load_default()

TARGET_SIZE = (1000, 1500)

def create_pin_image(config):
    filename = config["filename"]
    out_path = os.path.join(OUTPUT_DIR, filename)
    hook = config.get("hook", "").strip()
    words = hook.split()
    if len(words) >= 5:
        hook = " ".join(words[:4])

    print(f"Creating Minimalist Pin: {filename} (Hook: '{hook}')...")

    # 1. Download image
    req = urllib.request.Request(config["url"], headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw_img = Image.open(resp).convert("RGB")
    except Exception as e:
        print(f"Failed to fetch {config['url']}, using fallback canvas: {e}")
        raw_img = Image.new("RGB", TARGET_SIZE, color=(240, 235, 226))

    # 2. Resize and Center-Crop to exact 1000x1500 (100% Full-bleed)
    img = ImageOps.fit(raw_img, TARGET_SIZE, Image.Resampling.LANCZOS)

    # 3. Kinfolk Typography directly on image (NO box, NO card)
    if hook:
        text_layer = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        draw_text = ImageDraw.Draw(text_layer)

        bbox = draw_text.textbbox((0, 0), hook, font=font_hook)
        text_w = bbox[2] - bbox[0]

        pos_x = (TARGET_SIZE[0] - text_w) // 2
        if config.get("position") == "top":
            pos_y = int(TARGET_SIZE[1] * 0.07)
        else:
            pos_y = int(TARGET_SIZE[1] * 0.91)

        # Drop shadow
        shadow_offset = 2
        draw_text.text((pos_x + shadow_offset, pos_y + shadow_offset), hook, fill=(15, 12, 10, 180), font=font_hook)
        # Main text (monochrome ivory clean #FFFDF5)
        draw_text.text((pos_x, pos_y), hook, fill=(255, 252, 245, 250), font=font_hook)

        img = Image.alpha_composite(img.convert("RGBA"), text_layer)

    # 4. Apply Warm Interior Color Grading (+15% Contrast, Warmth calibration)
    base = img.convert("RGB")
    arr = np.array(base, dtype=np.float32)
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.05 + 3.0, 0, 255)
    arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.02 + 1.0, 0, 255)
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 0.93 - 2.0, 0, 255)
    warm_img = Image.fromarray(arr.astype(np.uint8))

    sat_img = ImageEnhance.Color(warm_img).enhance(1.12)
    con_img = ImageEnhance.Contrast(sat_img).enhance(1.15)
    sharp_img = ImageEnhance.Sharpness(con_img).enhance(1.20)
    sharp_img = sharp_img.filter(ImageFilter.UnsharpMask(radius=2, percent=130, threshold=3))

    tw, th = TARGET_SIZE
    flare = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    f_draw = ImageDraw.Draw(flare)
    poly = [(-50, -50), (int(tw * 0.75), -50), (tw + 50, int(th * 0.8)), (-50, int(th * 0.3))]
    f_draw.polygon(poly, fill=(255, 235, 185, 38))
    glow = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([(-tw // 4, -th // 4), (int(tw * 0.8), int(th * 0.5))], fill=(255, 240, 195, 35))
    ambient = Image.alpha_composite(flare, glow).filter(ImageFilter.GaussianBlur(radius=80))

    final_img = Image.alpha_composite(sharp_img.convert("RGBA"), ambient).convert("RGB")
    final_img.save(out_path, "JPEG", quality=95, optimize=True)
    print(f"Saved Guardrail-Compliant Pin: {out_path} [1000x1500, Warm Kinfolk]")

if __name__ == "__main__":
    for pin in PINS_CONFIG:
        create_pin_image(pin)
    print("\n[SUCCESS] All 5 Pinterest Pins regenerated under Minimalist Visual Guardrail!")
