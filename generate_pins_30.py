#!/usr/bin/env python3
"""
Aesthetic Haven Studio - 30 Pinterest Pin Generator
Strict adherence to the MINIMALIST VISUAL GUARDRAIL:
1. 100% Full-bleed 2:3 ratio (1000x1500px).
2. ZERO boxes, ZERO cards, ZERO fake buttons, ZERO long text blocks.
3. Lifestyle photo hero focus with natural lighting.
4. Hook strictly <= 4 words, placed at top 7% or bottom 91%, drop-shadow (rgba 0,0,0,0.3).
"""

import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter
import numpy as np

BASE_DIR = os.path.dirname(__file__)

PINS_16 = [
    # DECOR
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Wabi-Sabi Bedroom Style",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Sunset Glow Evening",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_08.jpg",
        "url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Aesthetic Japandi Console",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_09.jpg",
        "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Sculptural Ceramic Decor",
        "position": "bottom"
    },

    # KITCHEN
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_04.jpg",
        "url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Under-Cabinet Warm Glow",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_05.jpg",
        "url": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Glass Pantry Organization",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Stone Sink Organization",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Minimalist Matcha Station",
        "position": "bottom"
    },

    # PLANNERS
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_04.jpg",
        "url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Morning Intentional Journaling",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_05.jpg",
        "url": "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Digital Habit Dashboard",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Sunday Reset Checklist",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Minimalist Financial Tracker",
        "position": "bottom"
    },

    # WALLART
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_04.jpg",
        "url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Neutral Botanical Prints",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_05.jpg",
        "url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Aesthetic Gallery Grid",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Architectural Arch Art",
        "position": "bottom"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1200&h=1800&q=85",
        "hook": "Mindful Editorial Typography",
        "position": "bottom"
    }
]

FONT_DIR = "C:/Windows/Fonts"
try:
    font_hook = ImageFont.truetype(os.path.join(FONT_DIR, "georgiab.ttf"), 46)
except Exception:
    font_hook = ImageFont.load_default()

TARGET_SIZE = (1000, 1500)

def enhance_warm_interior(image: Image.Image) -> Image.Image:
    """
    Applies Warm Interior color grading:
    - Warmth/Temperature: boost red/amber tones, reduce cold grey/blue cast
    - Contrast: +15%
    - Saturation: +12%
    - Sharpness: +20% & UnsharpMask
    - Ambient 2700K sunlight glow
    """
    base = image.convert("RGB")
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

    return Image.alpha_composite(sharp_img.convert("RGBA"), ambient).convert("RGB")

def generate_single_pin(cfg):
    os.makedirs(cfg["output_dir"], exist_ok=True)
    out_path = os.path.join(cfg["output_dir"], cfg["filename"])
    hook = cfg.get("hook", "").strip()
    words = hook.split()
    if len(words) >= 5:
        hook = " ".join(words[:4])

    print(f"Generating Minimalist Pin: {cfg['filename']} (Hook: '{hook}')...")

    req = urllib.request.Request(cfg["url"], headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_img = Image.open(resp).convert("RGB")
    except Exception as e:
        print(f"  [Fallback canvas] {cfg['filename']}: {e}")
        raw_img = Image.new("RGB", TARGET_SIZE, color=(244, 240, 234))

    # 1. 100% Full-Bleed 2:3 crop (1000x1500)
    img = ImageOps.fit(raw_img, TARGET_SIZE, Image.Resampling.LANCZOS)

    # 2. Kinfolk Typography directly on image (NO box, NO card)
    if hook:
        text_layer = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        draw_text = ImageDraw.Draw(text_layer)

        bbox = draw_text.textbbox((0, 0), hook, font=font_hook)
        text_w = bbox[2] - bbox[0]

        pos_x = (TARGET_SIZE[0] - text_w) // 2
        if cfg.get("position") == "top":
            pos_y = int(TARGET_SIZE[1] * 0.07)
        else:
            pos_y = int(TARGET_SIZE[1] * 0.91)

        shadow_offset = 2
        draw_text.text((pos_x + shadow_offset, pos_y + shadow_offset), hook, fill=(15, 12, 10, 180), font=font_hook)
        draw_text.text((pos_x, pos_y), hook, fill=(255, 252, 245, 250), font=font_hook)

        img = Image.alpha_composite(img.convert("RGBA"), text_layer)

    # 3. Apply Warm Interior Color Grading (+15% Contrast, Warmth calibration)
    final_img = enhance_warm_interior(img)
    final_img.save(out_path, "JPEG", quality=95, optimize=True)
    print(f"Saved: {out_path} [1000x1500, Full-Bleed Warm Kinfolk]")

if __name__ == "__main__":
    for pin in PINS_16:
        generate_single_pin(pin)
    print("\n[SUCCESS] Expansion Pins generated under Minimalist Visual Guardrail!")
