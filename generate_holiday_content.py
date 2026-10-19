#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenClaw / Aesthetic Haven Studio - Q4 Holiday Season Content Generator for Pinterest
Generates high-converting Pinterest Titles, Descriptions, and Hashtags for:
- Cozy Bedroom Essentials for Winter
- Aesthetic Holiday Gift Guide
- Warm & Cozy Living Room Makeover
- Minimalist Christmas Gifts
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Fix UTF-8 encoding for Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE_DIR = Path(__file__).resolve().parent
ENV_FILE = WORKSPACE_DIR / ".env"

# Load .env if present
if ENV_FILE.exists():
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

MANDATORY_HASHTAGS = [
    "#cozydecor",
    "#holidaygifts",
    "#homedecorideas",
    "#warmminimalism",
    "#christmasgiftideas"
]

BASE_DESTINATION_URL = "https://agentwell.agency"

# Q4 Holiday Core Campaigns Configuration
Q4_PRIORITY_TOPICS = [
    {
        "id": "q4_holiday_01",
        "theme": "Cozy Bedroom Essentials for Winter",
        "niche": "Room Decor & Lighting",
        "board": "Aesthetic Room Decor & Lighting",
        "image": str(WORKSPACE_DIR / "pin1.jpg"),
        "destination_link": f"{BASE_DESTINATION_URL}#decor",
        "default_title": "Cozy Bedroom Essentials for Winter | Warm Minimalist Holiday Sanctuary",
        "default_desc": "Transform your winter bedroom into the ultimate cozy haven with layered warm amber lighting, plush textures, and calming bedside essentials. Discover restorative evening sanctuary styling tips at Aesthetic Haven Studio.",
        "extra_tags": ["#winterbedroom", "#bedroommakeover", "#amberlight", "#hyggedecor"]
    },
    {
        "id": "q4_holiday_02",
        "theme": "Aesthetic Holiday Gift Guide",
        "niche": "Smart Kitchen Finds",
        "board": "Smart Kitchen Gadgets & Hacks",
        "image": str(WORKSPACE_DIR / "pin2.jpg"),
        "destination_link": f"{BASE_DESTINATION_URL}#smart-kitchen",
        "default_title": "Aesthetic Holiday Gift Guide | Curated Warm Kitchen & Home Finds Under $50",
        "default_desc": "Gift something they will actually cherish and use daily. From matte gooseneck kettles to minimalist stone organizers, explore our curated holiday gift guide for lovers of intentional, warm aesthetic living.",
        "extra_tags": ["#holidaygiftguide", "#kitchengifts", "#giftguide2026", "#aestheticfinds"]
    },
    {
        "id": "q4_holiday_03",
        "theme": "Minimalist Christmas Gifts",
        "niche": "Digital Planners & iPad",
        "board": "Digital Planners & iPad Aesthetics",
        "image": str(WORKSPACE_DIR / "pin3.jpg"),
        "destination_link": f"{BASE_DESTINATION_URL}#digital-planners",
        "default_title": "Minimalist Christmas Gifts | Digital Planner & Mindful Lifestyle Dashboard",
        "default_desc": "Give the gift of peace, intentionality, and calm organization. Our warm aesthetic digital daily planner for iPad & GoodNotes helps reset daily routines ahead of the new year. Download your copy instantly at Aesthetic Haven Studio.",
        "extra_tags": ["#digitalgifts", "#ipadplanner", "#mindfulliving", "#goodnotesplanner"]
    },
    {
        "id": "q4_holiday_04",
        "theme": "Warm & Cozy Living Room Makeover",
        "niche": "Printable Wall Art",
        "board": "Printable Wall Art & Decor",
        "image": str(WORKSPACE_DIR / "pin4.jpg"),
        "destination_link": f"{BASE_DESTINATION_URL}#wall-art",
        "default_title": "Warm & Cozy Living Room Makeover | Scandinavian Holiday Art & Neutral Decor",
        "default_desc": "Give your living room walls an instant festive winter glow with neutral printable wall art gallery sets and subtle organic ceramics. Simple, clutter-free Scandinavian holiday styling made effortless at Aesthetic Haven Studio.",
        "extra_tags": ["#livingroomdecor", "#cozyhome", "#neutralchristmas", "#wallartprints"]
    }
]

def generate_pin_content_gemini(topic_info, api_key):
    """Attempt generation via Google Gemini API if API key is configured."""
    try:
        import urllib.request
        prompt = f"""
You are an expert Pinterest SEO copywriter and interior aesthetic stylist for "Aesthetic Haven Studio".
Create a high-performing Pinterest Pin for the Q4 Holiday & Winter Season.

TOPIC: "{topic_info['theme']}"
CATEGORY/NICHE: "{topic_info['niche']}"
DESTINATION DOMAIN: "{topic_info['destination_link']}"

REQUIREMENTS:
1. Title: Under 90 characters. Aesthetic, highly searchable, include power keywords for winter/holiday/cozy, separated by '|' or '•'.
2. Description: 200 to 320 characters. Evoke warm cozy feelings (hygge, warm glow, winter sanctuary, thoughtful gift). End with a clear call-to-action mentioning Aesthetic Haven Studio.
3. Must append these exact hashtags: #cozydecor #holidaygifts #homedecorideas #warmminimalism #christmasgiftideas

Respond ONLY with valid JSON with this exact schema:
{{
  "title": "Title here",
  "description": "Description here (including the hashtags)"
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300}
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        
        with urllib.request.urlopen(req, timeout=12) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean markdown codeblocks
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text.rsplit("\n", 1)[0]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:].strip()
            result = json.loads(raw_text)
            
            # Ensure mandatory hashtags are present in description
            desc = result.get("description", "").strip()
            for ht in MANDATORY_HASHTAGS:
                if ht.lower() not in desc.lower():
                    desc += f" {ht}"
            result["description"] = desc
            return result
    except Exception as e:
        # Fallback to high-converting curated template
        print(f"[*] Note: Gemini API dynamic generation skipped ({e}), using curated Q4 template engine.")
        return None

def build_q4_campaigns():
    """Build the list of full Q4 Pin campaign objects."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    campaigns = []

    for item in Q4_PRIORITY_TOPICS:
        ai_generated = None
        if api_key and not api_key.startswith("your_"):
            ai_generated = generate_pin_content_gemini(item, api_key)

        if ai_generated and ai_generated.get("title") and ai_generated.get("description"):
            title = ai_generated["title"]
            desc = ai_generated["description"]
        else:
            title = item["default_title"]
            all_tags = MANDATORY_HASHTAGS + item["extra_tags"]
            desc = f"{item['default_desc']}\n\n{' '.join(all_tags)}"

        campaign = {
            "id": item["id"],
            "theme": item["theme"],
            "niche": item["niche"],
            "board": item["board"],
            "title": title,
            "description": desc,
            "destination_link": item["destination_link"],
            "image_path": str(Path(item["image"]).relative_to(WORKSPACE_DIR)).replace("\\", "/"),
            "image_full_path": item["image"],
            "cta_text": "Tap to explore the holiday collection →",
            "tags": [ht.replace("#", "") for ht in MANDATORY_HASHTAGS + item["extra_tags"]],
            "status": "ready"
        }
        campaigns.append(campaign)

    return campaigns

def update_queue_file(campaigns):
    """Prepend or update Q4 campaigns into pinterest_queue.json."""
    queue_file = WORKSPACE_DIR / "pinterest_queue.json"
    existing_queue = []
    if queue_file.exists():
        try:
            with open(queue_file, "r", encoding="utf-8") as f:
                existing_queue = json.load(f)
        except Exception as e:
            print(f"[!] Warning reading existing queue: {e}")

    # Remove previous versions of these q4 IDs if any
    q4_ids = {c["id"] for c in campaigns}
    filtered_queue = [p for p in existing_queue if p.get("id") not in q4_ids]

    # Prepend new Q4 campaigns so they are ready first
    new_queue = campaigns + filtered_queue

    # Ensure EVERY single item in the entire queue has destination_link pointing to agentwell.agency
    for item in new_queue:
        link = item.get("destination_link") or item.get("link") or ""
        if "agentwell.vercel.app" in link:
            link = link.replace("agentwell.vercel.app", "agentwell.agency")
        elif not link or not link.startswith("https://agentwell.agency"):
            link = BASE_DESTINATION_URL
        item["destination_link"] = link
        if "link" in item:
            item["link"] = link

    with open(queue_file, "w", encoding="utf-8") as f:
        json.dump(new_queue, f, indent=2, ensure_ascii=False)

    print(f"✅ Đã cập nhật thành công {len(campaigns)} chiến dịch Q4 vào {queue_file.name} (Tổng queue: {len(new_queue)})")

def update_campaigns_file(campaigns):
    """Update data/pinterest_campaigns.json with Q4 campaigns."""
    campaigns_file = WORKSPACE_DIR / "data" / "pinterest_campaigns.json"
    campaigns_file.parent.mkdir(parents=True, exist_ok=True)
    
    existing = []
    if campaigns_file.exists():
        try:
            with open(campaigns_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            pass

    q4_ids = {c["id"] for c in campaigns}
    filtered = [p for p in existing if p.get("id") not in q4_ids]

    data_items = []
    for c in campaigns:
        data_items.append({
            "id": c["id"],
            "category": c["niche"],
            "board": c["board"],
            "title": c["title"],
            "description": c["description"],
            "link": c["destination_link"],
            "tags": MANDATORY_HASHTAGS,
            "season": "Q4 Holiday & Winter"
        })

    full_data = data_items + filtered
    # Strict link check
    for item in full_data:
        if "agentwell.vercel.app" in item.get("link", ""):
            item["link"] = item["link"].replace("agentwell.vercel.app", "agentwell.agency")
        elif not item.get("link", "").startswith("https://agentwell.agency"):
            item["link"] = BASE_DESTINATION_URL

    with open(campaigns_file, "w", encoding="utf-8") as f:
        json.dump(full_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Đã đồng bộ chiến dịch Q4 vào {campaigns_file.relative_to(WORKSPACE_DIR)}")

def main():
    print("=" * 65)
    print("🎄 OPENCLAW PINTEREST - Q4 HOLIDAY CONTENT GENERATOR")
    print("   Thương hiệu: Aesthetic Haven Studio")
    print("   Domain đích: https://agentwell.agency")
    print("=" * 65)

    campaigns = build_q4_campaigns()
    for idx, c in enumerate(campaigns, 1):
        print(f"\n[{idx}/4] CHỦ ĐỀ: {c['theme']}")
        print(f"  • Tiêu đề: {c['title']}")
        print(f"  • Bảng:    {c['board']}")
        print(f"  • Link:    {c['destination_link']}")
        print(f"  • Hashtags: {', '.join(MANDATORY_HASHTAGS)}")

    update_queue_file(campaigns)
    update_campaigns_file(campaigns)
    print("\n✨ Tạo nội dung mùa lễ hội Q4 hoàn tất 100%!")

if __name__ == "__main__":
    main()
