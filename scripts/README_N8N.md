# Aesthetic Haven Studio — Visual Anti-Spam & Curation Pipeline Guide

## Overview

Pinterest aggressively suppresses images that trigger its perceptual duplicate detection algorithms (pHash/dHash similarity checks and reused EXIF/IPTC tags). When scaling automated pin pipelines with n8n, raw affiliate product images or stock photography often get flagged as "Spam / Duplicate Content", resulting in near-zero impressions.

This module provides a complete anti-spam pipeline that:
1. **Normalizes to Pinterest 2:3 Ratio**: Standardizes any input image to `1000x1500px` using high-fidelity Lanczos resampling.
2. **Applies an Editorial Warm Border**: Frames the asset with `#FAF8F5` cream borders and a 1px `#EAE6DF` hairline contour.
3. **Overlays Minimalist Serif Typography**: Renders high-converting editorial titles in serif fonts (e.g. *Playfair Display* / *Georgia*).
4. **Strips EXIF & Injects Clean Signatures**: Eliminates all camera, Adobe, or Canva metadata footprint.
5. **Shifts Visual Hash (Perceptual Difference)**: Applies micro-chromatic warmth and subtle tonal calibration so Pinterest's neural network sees an authentic, unique creative pin.

---

## 1. Integration in n8n

### Option A: Using n8n Code Node (JavaScript)

1. Open your n8n workflow.
2. Add a **Code** node.
3. Set **Language** to `JavaScript` and **Mode** to `Run Once for All Items`.
4. Paste the content of [`scripts/n8n_code_node.js`](file:///C:/Users/DELL/.gemini/antigravity/scratch/aesthetic-haven-studio/scripts/n8n_code_node.js).

#### Input Payload Example (from prior Webhook or Google Sheet node):
```json
[
  {
    "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    "title": "Warm Living Setup",
    "subtitle": "Curated Living & Warm Spaces • Aesthetic Haven Studio",
    "badge": "SANCTUARY EDIT",
    "destination_url": "https://agentwell.agency/collections/living-room-decor",
    "board_name": "Warm Minimalist Living"
  }
]
```

#### Output Payload (passed to Pinterest API or Post Publisher node):
```json
{
  "success": true,
  "pinterest_payload": {
    "title": "Warm Living Setup",
    "description": "Warm Living Setup — Handpicked warm minimalist decor essentials. Discover our full editorial lookbook and tactile curation at Aesthetic Haven Studio.",
    "link": "https://agentwell.agency/collections/living-room-decor",
    "media_source": {
      "source_type": "image_url",
      "url": "public/assets/pinterest/n8n_warm-living-setup_1729511453000.jpg"
    },
    "board_name": "Warm Minimalist Living",
    "compliance": {
      "ratio": "2:3 (1000x1500px)",
      "affiliate_disclosure_present": true,
      "amazon_bridge_url": "https://agentwell.agency/collections/living-room-decor",
      "exif_stripped": true,
      "perceptual_hash_shifted": true
    }
  },
  "processor_meta": {
    "status": "success",
    "target_resolution": "1000x1500 (2:3 Pinterest Ratio)",
    "original_sha256": "612a349c8c0889c0...",
    "new_sha256": "905ae1762afbd4ad...",
    "original_dhash": "82099362b0d430f0",
    "new_dhash": "010911633155c080",
    "hash_altered": true
  }
}
```

---

### Option B: Direct CLI Execution (Terminal or n8n Execute Command)

Run directly in terminal or VPS:
```bash
python scripts/anti_spam_image_processor.py \
  --url "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85" \
  --out "public/assets/pinterest/sample_curated_pin.jpg" \
  --title "Warm Living Setup" \
  --subtitle "Curated Living & Warm Spaces" \
  --badge "SANCTUARY EDIT" \
  --json
```

---

## 2. Amazon & Pinterest Compliance Architecture

To maintain strict compliance with both Amazon Associates Operating Agreement and Pinterest Merchant Guidelines:

1. **Pinterest Pins never link directly to raw affiliate links**: Pins always route to high-value editorial bridge pages (`https://agentwell.agency/collections/living-room-decor` or `/curated/[slug]`).
2. **Strict Bridge Page Link Compliance**:
   - `rel="sponsored nofollow noopener noreferrer"` on all Amazon product buttons.
   - `target="_blank"` on external outbound links.
3. **Prominent Affiliate Disclosures**:
   - Immediately below each CTA button: *"As an Amazon Associate, we earn from qualifying purchases at no extra cost to you."*
   - Sitewide disclosure in the unified footer.
4. **High-Value Editorial Content**:
   - Every collection page contains a 150–200 word editorial lifestyle curation explaining materials, lighting Kelvin temperature (2700K), and tactile rationale ("Why We Chose This"), preventing search engine "Thin Content" flags.
