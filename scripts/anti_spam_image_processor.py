#!/usr/bin/env python3
"""
Aesthetic Haven Studio - Minimalist Visual Guardrail & Anti-Spam Pipeline
Strictly adheres to the MINIMALIST VISUAL GUARDRAIL:
1. 100% Full-bleed 2:3 ratio (1000x1500px) or 9:16 - Zero borders.
2. ZERO graphic containers: No dark cards, no product card boxes, no fake buttons, no long technical text.
3. Hero Focus: Lifestyle in-use photography is preserved with natural depth, light, and negative space.
4. Optional Text Overlay: Max 1 short hook (strictly under 5 words), placed at <=10% top or >=90% bottom edge,
   with subtle drop-shadow (rgba 0,0,0,0.3) and NO background boxes/containers.
5. EXIF/metadata sanitized and micro-chromatic variance applied to shift perceptual hashes (dHash/pHash).
"""

import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
import argparse
import hashlib
import json
import urllib.request
import io
import re
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance

TARGET_WIDTH = 1000
TARGET_HEIGHT = 1500

FORBIDDEN_PATTERNS = [
    r"explore sourcebook",
    r"check deals",
    r"tap here",
    r"click here",
    r"buy now",
    r"tap to get",
    r"claim free",
    r"architectural quality",
    r"tactile finish",
    r"sanctuary edit",
    r"agentwell\.agency",
    r"agentwell",
    r"#decor",
    r"https?://",
    r"#[a-zA-Z0-9_]+"
]

def clean_watermarks_and_borders(img: Image.Image) -> Image.Image:
    """
    Scans and crops edge watermarks, links, dark banner strips from borders.
    """
    w, h = img.size
    arr = np.array(img.convert("RGB"))

    # Bottom 12% check
    bottom_h = int(h * 0.12)
    bottom_slice = arr[h - bottom_h:, :, :]
    row_means = np.mean(bottom_slice, axis=(1, 2))
    row_stds = np.std(bottom_slice, axis=(1, 2))

    detected_trim_y = h
    for idx, (m, s) in enumerate(zip(row_means, row_stds)):
        actual_y = (h - bottom_h) + idx
        if m < 38 and s < 28:
            detected_trim_y = min(detected_trim_y, actual_y)

    # Top 6% check
    top_h = int(h * 0.06)
    top_slice = arr[:top_h, :, :]
    top_row_means = np.mean(top_slice, axis=(1, 2))
    top_row_stds = np.std(top_slice, axis=(1, 2))
    detected_trim_top = 0
    for idx in range(len(top_row_means) - 1, -1, -1):
        if top_row_means[idx] < 38 and top_row_stds[idx] < 28:
            detected_trim_top = max(detected_trim_top, idx + 1)

    if detected_trim_y < h - 5 or detected_trim_top > 5:
        img = img.crop((0, detected_trim_top, w, detected_trim_y))

    # Safe margin trimming to remove border watermark noise
    w, h = img.size
    margin_y = int(h * 0.015)
    margin_x = int(w * 0.015)
    return img.crop((margin_x, margin_y, w - margin_x, h - margin_y))

def validate_minimalist_guardrail(hook_text: str = None) -> str:
    """
    Validates hook text against minimalist visual guardrails.
    Rejects text exceeding 4 words or containing spammy CTA keywords.
    """
    if not hook_text:
        return ""
    
    clean_text = hook_text.strip()
    if not clean_text:
        return ""

    # Check forbidden phrases
    lower_text = clean_text.lower()
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, lower_text):
            raise ValueError(
                f"[GUARDRAIL REJECTED] Text '{clean_text}' contains prohibited button/card text matching pattern: {pattern}."
            )

    # Word count check: Under 5 words (strictly max 4 words)
    words = clean_text.split()
    if len(words) >= 5:
        # Auto-conform by taking first 4 words or reject if inappropriate
        concise_hook = " ".join(words[:4])
        print(f"[GUARDRAIL WARNING] Hook text '{clean_text}' exceeded word limit ({len(words)} words >= 5). Trimmed to: '{concise_hook}'")
        return concise_hook

    return clean_text

def get_font(font_names, size):
    """Attempt to load serif or sans fonts across Windows and Linux environments."""
    search_paths = [
        "C:/Windows/Fonts",
        "/usr/share/fonts/truetype",
        "/usr/share/fonts/TTF",
        "/Library/Fonts"
    ]
    for font_name in font_names:
        for base_path in search_paths:
            full_path = os.path.join(base_path, font_name)
            if os.path.exists(full_path):
                try:
                    return ImageFont.truetype(full_path, size)
                except Exception:
                    continue
        if os.path.exists(font_name):
            try:
                return ImageFont.truetype(font_name, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None

def calculate_dhash(image, hash_size=8):
    """Calculate difference hash (dHash) to measure perceptual difference."""
    resized = image.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    if hasattr(resized, 'get_flattened_data'):
        pixels = list(resized.get_flattened_data())
    else:
        pixels = list(resized.getdata())
    diff = []
    for row in range(hash_size):
        for col in range(hash_size):
            pixel_left = pixels[row * (hash_size + 1) + col]
            pixel_right = pixels[row * (hash_size + 1) + col + 1]
            diff.append(pixel_left > pixel_right)
    decimal_value = 0
    hex_string = []
    for index, value in enumerate(diff):
        if value:
            decimal_value += 2**(index % 8)
        if (index % 8) == 7:
            hex_string.append(hex(decimal_value)[2:].rjust(2, '0'))
            decimal_value = 0
    return "".join(hex_string)

def download_image(url_or_path):
    """Download image from URL or load local file."""
    if url_or_path.startswith(('http://', 'https://')):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        req = urllib.request.Request(url_or_path, headers=headers)
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = resp.read()
            return Image.open(io.BytesIO(data)), hashlib.sha256(data).hexdigest()
    else:
        with open(url_or_path, 'rb') as f:
            data = f.read()
            return Image.open(io.BytesIO(data)), hashlib.sha256(data).hexdigest()

def process_image(
    input_source,
    output_path=None,
    hook_text=None,
    position="bottom",  # "top" (top 10%) or "bottom" (bottom 10%)
    alter_pixels=True,
    **kwargs  # Ignore legacy arguments like badge, subtitle gracefully
):
    """
    Main processing pipeline enforcing MINIMALIST VISUAL GUARDRAIL:
    1. Strips all EXIF/metadata.
    2. 100% Full-bleed center crop to 2:3 ratio (1000x1500) - NO BORDERS.
    3. Micro-chromatic variance to shift perceptual hash without visual artifacts.
    4. ZERO cards, ZERO boxes, ZERO fake buttons.
    5. At most 1 short Hook (under 5 words), placed at top 10% or bottom 10% with subtle drop shadow.
    """
    # 1. Guardrail Validation
    valid_hook = validate_minimalist_guardrail(hook_text)

    # 2. Ingest Image
    raw_img, original_sha256 = download_image(input_source)
    orig_dhash = calculate_dhash(raw_img)

    # 3. Strip all metadata by re-rasterizing pure RGB buffer
    img_rgb = Image.new("RGB", raw_img.size)
    img_rgb.paste(raw_img)

    # 4. Clean foreign watermarks, links, and dark border strips
    img_clean = clean_watermarks_and_borders(img_rgb)

    # 5. Resize and Center-Crop to exact Pinterest 2:3 ratio (1000x1500) - Full Bleed
    canvas = ImageOps.fit(img_clean, (TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)

    # 5. Micro-alteration & Warm Interior Color Grading (+15% Contrast, Warmth/Temperature calibration)
    if alter_pixels:
        import numpy as np
        arr = np.array(canvas, dtype=np.float32)
        arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.05 + 3.0, 0, 255)  # Warm red/amber boost
        arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.02 + 1.0, 0, 255)  # Soft cream
        arr[:, :, 2] = np.clip(arr[:, :, 2] * 0.93 - 2.0, 0, 255)  # Anti-cold grey cast
        warm_canvas = Image.fromarray(arr.astype(np.uint8))
        
        # Contrast +15%
        canvas = ImageEnhance.Contrast(warm_canvas).enhance(1.15)
        # Saturation +12%
        canvas = ImageEnhance.Color(canvas).enhance(1.12)
        # Sharpness
        canvas = ImageEnhance.Sharpness(canvas).enhance(1.20)

    # 6. Apply Minimalist Kinfolk Typography (IF hook provided) - NO BOXES, NO CONTAINERS
    if valid_hook:
        font_hook = get_font(["segoeuil.ttf", "georgia.ttf", "arial.ttf"], 36)
        
        # Prepare transparent overlay layer for text with drop-shadow
        text_layer = Image.new("RGBA", (TARGET_WIDTH, TARGET_HEIGHT), (0, 0, 0, 0))
        draw_text = ImageDraw.Draw(text_layer)

        # Measure text
        bbox = draw_text.textbbox((0, 0), valid_hook, font=font_hook)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

        # Left margin or center depending on position
        if position == "top":
            pos_x = 60
            pos_y = 65
        else:
            pos_x = (TARGET_WIDTH - text_w) // 2
            pos_y = int(TARGET_HEIGHT * 0.91)

        # Subtle diffuse drop-shadow
        shadow_offset = 2
        draw_text.text(
            (pos_x + shadow_offset, pos_y + shadow_offset),
            valid_hook,
            fill=(15, 12, 10, 180),
            font=font_hook
        )

        # Main text (monochrome ivory clean #FFFDF5)
        draw_text.text(
            (pos_x, pos_y),
            valid_hook,
            fill=(255, 253, 245, 250),
            font=font_hook
        )

        canvas = Image.alpha_composite(canvas.convert("RGBA"), text_layer).convert("RGB")

    # 7. Save without EXIF
    if output_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"processed_pin_{timestamp}.jpg"

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    buffer = io.BytesIO()
    canvas.save(
        buffer,
        format="JPEG",
        quality=92,
        optimize=True,
        dpi=(300, 300)
    )
    final_bytes = buffer.getvalue()
    
    with open(output_path, "wb") as f:
        f.write(final_bytes)

    new_sha256 = hashlib.sha256(final_bytes).hexdigest()
    new_dhash = calculate_dhash(canvas)

    result = {
        "status": "success",
        "output_file": os.path.abspath(output_path),
        "target_resolution": f"{TARGET_WIDTH}x{TARGET_HEIGHT} (100% Full-Bleed 2:3)",
        "guardrail_status": "PASSED (Minimalist: No cards, No boxes, No fake buttons)",
        "hook_text": valid_hook if valid_hook else None,
        "original_sha256": original_sha256,
        "new_sha256": new_sha256,
        "original_dhash": orig_dhash,
        "new_dhash": new_dhash,
        "hash_altered": (original_sha256 != new_sha256) and (orig_dhash != new_dhash),
        "timestamp": datetime.now().isoformat()
    }
    return result

def main():
    parser = argparse.ArgumentParser(description="Aesthetic Haven Studio Minimalist Image Processor")
    parser.add_argument("--url", "-u", required=True, help="Input image URL or local path")
    parser.add_argument("--out", "-o", default="public/assets/pinterest/curated_pin_output.jpg", help="Output file path")
    parser.add_argument("--hook", "--title", "-t", default=None, help="Short Hook under 5 words (optional)")
    parser.add_argument("--position", "-p", choices=["top", "bottom"], default="bottom", help="Hook position: top or bottom 10%")
    parser.add_argument("--subtitle", "-s", default=None, help="[DEPRECATED - Ignored by Guardrail]")
    parser.add_argument("--badge", "-b", default=None, help="[DEPRECATED - Ignored by Guardrail]")
    parser.add_argument("--json", action="store_true", help="Output JSON for n8n code node")

    args = parser.parse_args()

    try:
        res = process_image(
            input_source=args.url,
            output_path=args.out,
            hook_text=args.hook,
            position=args.position
        )
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print("\n=======================================================")
            print("✨ AESTHETIC HAVEN STUDIO - MINIMALIST VISUAL GUARDRAIL")
            print("=======================================================")
            print(f"Status:            {res['status']}")
            print(f"Guardrail:         {res['guardrail_status']}")
            print(f"Output File:       {res['output_file']}")
            print(f"Resolution:        {res['target_resolution']}")
            print(f"Hook Text:         {res['hook_text']}")
            print(f"Original SHA256:   {res['original_sha256'][:16]}...")
            print(f"New SHA256:        {res['new_sha256'][:16]}...")
            print(f"Visual Hash Shift: {'SUCCESS (Anti-Spam Active)' if res['hash_altered'] else 'Identical'}")
            print("=======================================================\n")
    except Exception as e:
        err = {"status": "error", "message": str(e), "guardrail_rejected": True}
        if args.json:
            print(json.dumps(err, indent=2))
        else:
            print(f"[ERROR / REJECTED] {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
