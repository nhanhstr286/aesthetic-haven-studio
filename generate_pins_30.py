import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

BASE_DIR = os.path.dirname(__file__)

# 16 Pin Configurations for Expansion to 30 Pins
PINS_16 = [
    # --- DECOR (decor_pin_06 -> 09) ---
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🌾 WABI-SABI BEDROOM",
        "title": "Wabi-Sabi Bedroom\nStyling Secrets",
        "subtitle": "Earthy linen textures, ceramic vessels & soft diffused 2700K ambient lighting.",
        "cta": "Tap to get the free guide →",
        "domain": "agentwell.agency#decor"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🌙 SUNSET AMBIENCE",
        "title": "The Sunset Glow\nEvening Routine",
        "subtitle": "Layering cordless mushroom lamps and amber glass globes for zero eyestrain.",
        "cta": "Tap to get the free guide →",
        "domain": "agentwell.agency#decor"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_08.jpg",
        "url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🌿 MINDFUL ENTRYWAY",
        "title": "Aesthetic Japandi\nEntryway Console",
        "subtitle": "Sculptural wooden consoles, ceramic catchalls & warm welcoming light.",
        "cta": "Tap to get the free guide →",
        "domain": "agentwell.agency#decor"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "decor"),
        "filename": "decor_pin_09.jpg",
        "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🏺 ORGANIC TEXTURES",
        "title": "Sculptural Ceramic\n& Travertine Decor",
        "subtitle": "How to balance stone textures, matte ceramics, and negative space effortlessly.",
        "cta": "Tap to get the free guide →",
        "domain": "agentwell.agency#decor"
    },

    # --- KITCHEN (kitchen_pin_04 -> 07) ---
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_04.jpg",
        "url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "💡 KITCHEN LIGHTING",
        "title": "Under-Cabinet\nWarm Glow Hack",
        "subtitle": "Rechargeable warm strip lights that transform counters into a luxury lounge.",
        "cta": "Tap to get the free cheatsheet →",
        "domain": "agentwell.agency#kitchen"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_05.jpg",
        "url": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🌾 PANTRY RESET",
        "title": "Aesthetic Glass\nPantry Organization",
        "subtitle": "Clean unified jars, custom minimalist waterproof labels & zero visual noise.",
        "cta": "Tap to get the free cheatsheet →",
        "domain": "agentwell.agency#kitchen"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "✨ SINK COUNTER RESET",
        "title": "Sink Area Zen\nStone Organization",
        "subtitle": "Keep sink borders dry and gorgeous with instant water-absorbing stone trays.",
        "cta": "Tap to get the free cheatsheet →",
        "domain": "agentwell.agency#kitchen"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "kitchen"),
        "filename": "kitchen_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🍵 MINDFUL TEA STATION",
        "title": "Minimalist Matcha\n& Tea Counter Station",
        "subtitle": "Handmade ceramic chawan, bamboo whisk stands & compact induction warmers.",
        "cta": "Tap to get the free cheatsheet →",
        "domain": "agentwell.agency#kitchen"
    },

    # --- PLANNERS (planner_pin_04 -> 07) ---
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_04.jpg",
        "url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "☕ MORNING JOURNALING",
        "title": "Morning Intentionality\n& Brain Dump Layout",
        "subtitle": "Clear morning anxiety in 5 minutes with structured digital journaling spreads.",
        "cta": "Tap to get free sample →",
        "domain": "agentwell.agency#planners"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_05.jpg",
        "url": "https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🎯 GOAL TRACKING",
        "title": "Project Roadmap\n& Milestone Tracker",
        "subtitle": "Break big dreams into effortless weekly sprints with clickable hyperlinked tabs.",
        "cta": "Tap to get free sample →",
        "domain": "agentwell.agency#planners"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "💳 FINANCIAL WELLNESS",
        "title": "Mindful Budget\n& Expense Reset",
        "subtitle": "Transform your relationship with money through peaceful, clutter-free budgeting.",
        "cta": "Tap to get free sample →",
        "domain": "agentwell.agency#planners"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "planners"),
        "filename": "planner_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🌿 HOLISTIC WELLNESS",
        "title": "Wellness & Sleep\nHabit Tracker Spreads",
        "subtitle": "Connect sleep quality, hydration, and daily movement in one peaceful spread.",
        "cta": "Tap to get free sample →",
        "domain": "agentwell.agency#planners"
    },

    # --- WALL ART (wallart_pin_04 -> 07) ---
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_04.jpg",
        "url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🖌️ ZEN BRUSHWORK",
        "title": "Japandi Abstract\nInk Brushwork Prints",
        "subtitle": "Minimalist sumi-e inspired brush strokes bringing organic tranquility to walls.",
        "cta": "Tap to download free print →",
        "domain": "agentwell.agency#wallart"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_05.jpg",
        "url": "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🏛️ ARCHITECTURAL ARCHES",
        "title": "Warm Terracotta\nArchitectural Curves",
        "subtitle": "Warm plaster arches, terracotta geometry & calming Mediterranean earth tones.",
        "cta": "Tap to download free print →",
        "domain": "agentwell.agency#wallart"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_06.jpg",
        "url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🍃 BOTANICAL LINE ART",
        "title": "Minimalist Botanical\nEucalyptus Line Art",
        "subtitle": "Graceful continuous line botanicals rendered on warm textured linen-tone paper.",
        "cta": "Tap to download free print →",
        "domain": "agentwell.agency#wallart"
    },
    {
        "output_dir": os.path.join(BASE_DIR, "public", "assets", "pinterest", "wallart"),
        "filename": "wallart_pin_07.jpg",
        "url": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&h=1800&q=85",
        "category_badge": "🕊️ EDITORIAL TYPOGRAPHY",
        "title": "Mindful Typography\n& Affirmation Posters",
        "subtitle": "Gentle daily mantras set in timeless editorial typography for your workspace.",
        "cta": "Tap to download free print →",
        "domain": "agentwell.agency#wallart"
    }
]

# Fonts setup (Windows system fonts)
FONT_DIR = "C:/Windows/Fonts"
font_title = ImageFont.truetype(os.path.join(FONT_DIR, "georgiab.ttf"), 66)
font_subtitle = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 28)
font_badge = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 20)
font_brand = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 22)
font_cta = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 26)
font_url = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 20)

TARGET_SIZE = (1000, 1500)

def generate_single_pin(cfg):
    os.makedirs(cfg["output_dir"], exist_ok=True)
    out_path = os.path.join(cfg["output_dir"], cfg["filename"])
    print(f"Generating Pin: {cfg['filename']} -> {out_path}...")

    # 1. Fetch Image with Fallback
    req = urllib.request.Request(cfg["url"], headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_img = Image.open(resp).convert("RGB")
    except Exception as e:
        print(f"  [Notice] Fallback canvas for {cfg['filename']}: {e}")
        raw_img = Image.new("RGB", TARGET_SIZE, color=(244, 240, 234))

    # 2. Resize and Center-Crop
    img = ImageOps.fit(raw_img, TARGET_SIZE, Image.Resampling.LANCZOS)

    # 3. Soft Warm Gradient Overlays
    overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)

    # Top dark gradient
    for y in range(450):
        alpha = int(140 * (1.0 - (y / 450.0) ** 1.3))
        draw_overlay.line([(0, y), (1000, y)], fill=(20, 18, 16, alpha))

    # Bottom dark gradient
    for y in range(1500 - 350, 1500):
        factor = (y - (1500 - 350)) / 350.0
        alpha = int(170 * (factor ** 1.2))
        draw_overlay.line([(0, y), (1000, y)], fill=(18, 16, 14, alpha))

    # Center card (Glassmorphic Warm Editorial)
    card_top = 100
    card_left = 60
    card_right = 940
    card_bottom = 580

    card_overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    draw_card = ImageDraw.Draw(card_overlay)
    draw_card.rounded_rectangle(
        [(card_left, card_top), (card_right, card_bottom)],
        radius=28,
        fill=(250, 248, 245, 230), # #FAF8F5 with 90% opacity
        outline=(234, 230, 223, 240),
        width=2
    )

    # Merge overlays
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    img = Image.alpha_composite(img, card_overlay)

    # 4. Draw Typography & Badges
    draw = ImageDraw.Draw(img)

    # Brand watermark
    draw.text((card_left + 40, card_top + 36), "AESTHETIC HAVEN STUDIO", fill=(140, 130, 120), font=font_brand)

    # Category Pill Badge
    badge_text = cfg["category_badge"]
    badge_bbox = font_badge.getbbox(badge_text)
    bw = badge_bbox[2] - badge_bbox[0] + 28
    bh = badge_bbox[3] - badge_bbox[1] + 16
    bx = card_right - 40 - bw
    by = card_top + 30
    draw.rounded_rectangle(
        [(bx, by), (bx + bw, by + bh)],
        radius=12,
        fill=(192, 112, 83, 35),
        outline=(192, 112, 83, 160),
        width=1
    )
    draw.text((bx + 14, by + 6), badge_text, fill=(160, 80, 55), font=font_badge)

    # Separator line
    draw.line([(card_left + 40, card_top + 78), (card_right - 40, card_top + 78)], fill=(234, 230, 223), width=1)

    # Headline (Georgia Bold)
    title_y = card_top + 105
    for line in cfg["title"].split("\n"):
        draw.text((card_left + 40, title_y), line, fill=(31, 31, 31), font=font_title)
        title_y += 76

    # Subtitle (Segoe UI)
    subtitle_y = title_y + 16
    words = cfg["subtitle"].split(" ")
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

    # Floating CTA Badge
    cta_bottom = 1420
    cta_top = 1330
    cta_left = 80
    cta_right = 920

    cta_overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    draw_cta = ImageDraw.Draw(cta_overlay)
    draw_cta.rounded_rectangle(
        [(cta_left, cta_top), (cta_right, cta_bottom)],
        radius=26,
        fill=(31, 31, 31, 235),
        outline=(240, 235, 225, 60),
        width=1
    )
    img = Image.alpha_composite(img, cta_overlay)
    draw = ImageDraw.Draw(img)

    # CTA text & domain
    draw.text((cta_left + 40, cta_top + 28), cfg["cta"], fill=(250, 248, 245), font=font_cta)

    domain_str = cfg.get("domain", "agentwell.agency")
    d_bbox = font_url.getbbox(domain_str)
    dw = d_bbox[2] - d_bbox[0]
    draw.text((cta_right - 40 - dw, cta_top + 33), domain_str, fill=(180, 175, 170), font=font_url)

    # 5. Save JPEG
    final_img = img.convert("RGB")
    final_img.save(out_path, "JPEG", quality=92, optimize=True)
    print(f"  Successfully saved: {out_path} ({os.path.getsize(out_path):,} bytes)")

if __name__ == "__main__":
    print(f"Starting batch generation of {len(PINS_16)} Pins...")
    for idx, pin_cfg in enumerate(PINS_16, 1):
        print(f"[{idx}/{len(PINS_16)}]")
        generate_single_pin(pin_cfg)
    print("\nAll 16 Pins generated successfully!")
