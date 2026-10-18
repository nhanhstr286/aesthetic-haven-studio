const { chromium } = require('playwright');

const PINS_DATA = [
  {
    title: "Cozy Aesthetic Bedroom Lighting Ideas | Warm Minimalist Decor Finds",
    description: "Transform your bedroom into a peaceful sanctuary with these warm minimalist lighting ideas and aesthetic nightstand essentials. Discover soft ambient lamps, cozy textures, and intentional bedroom decor finds to elevate your evening routine. Explore the curated collection on Aesthetic Haven Studio.",
    link: "https://agentwell.vercel.app/#room-decor",
    board: "Aesthetic Room Decor & Lighting"
  },
  {
    title: "Minimalist Smart Kitchen Gadgets | Aesthetic Countertop Essentials",
    description: "Keep your kitchen countertops clean, functional, and calming with these curated smart kitchen finds. From minimalist matte kettles to space-saving organizers, discover practical tools designed for modern daily rituals. Check out the full edit at Aesthetic Haven Studio.",
    link: "https://agentwell.vercel.app/#smart-kitchen",
    board: "Smart Kitchen Gadgets & Hacks"
  },
  {
    title: "Minimalist iPad Digital Planner Template | Daily Productivity & Routines",
    description: "Bring calm intentionality to your schedule with our warm aesthetic digital daily planner for iPad & GoodNotes. Features daily habit trackers, structured time blocks, and a clutter-free design crafted for focused living. Download yours today on Aesthetic Haven Studio.",
    link: "https://agentwell.vercel.app/#digital-planners",
    board: "Digital Planners & iPad Aesthetics"
  },
  {
    title: "Warm Neutral Wall Art Gallery Prints | Scandinavian Minimalist Posters",
    description: "Elevate your living room walls with timeless neutral wall art prints and minimalist line illustrations. Easy-to-download printable art sets that add subtle depth and elegance to any gallery wall. Explore all curated art prints at Aesthetic Haven Studio.",
    link: "https://agentwell.vercel.app/#wall-art",
    board: "Printable Wall Art & Decor"
  }
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Đang mở trang tạo Pin trên Pinterest...");
  await page.goto('https://www.pinterest.com/pin-creation-tool/');

  console.log("Trình duyệt đã mở. Vui lòng đăng nhập nếu chưa có phiên làm việc.");
})();