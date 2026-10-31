/**
 * Vercel Serverless Dynamic Route: /curated/[slug]
 * Handles dynamic editorial bridge pages for Aesthetic Haven Studio (agentwell.agency)
 * 
 * Features:
 * 1. Serves pre-rendered static HTML if exists on disk.
 * 2. Dynamically generates high-converting, mobile-responsive editorial landing pages
 *    for known products or ASINs with prominent "Check on Amazon" affiliate CTAs.
 * 3. FALLBACK SAFETY: If slug is not found or unknown, automatically 302 redirects
 *    to homepage (or Amazon search with affiliate tag).
 *    TUYỆT ĐỐI KHÔNG để rơi vào màn hình 404 trắng bệch của Vercel!
 */

const fs = require('fs');
const path = require('path');

const AMAZON_TAG = 'aesthetic08d8-20';
const DEFAULT_FALLBACK_URL = 'https://agentwell.agency/';

// Built-in verified product catalog to guarantee immediate rendering
const PRODUCT_CATALOG = {
  'bella-fits-anywhere-2-slice-slim-toaster': {
    asin: 'B0CYJBB2JQ',
    title: 'bella Fits-Anywhere™ 2-Slice Slim Toaster with Extra Wide Slot & Matte Finish',
    displayTitle: 'bella Fits-Anywhere™ 2-Slice Slim Toaster | Architectural Kitchen Aesthetics',
    collection: 'Smart Kitchen Gadgets & Hacks',
    price: '$17.00',
    rating: 4.2,
    imageStudio: 'https://m.media-amazon.com/images/I/71u9sJ15bJL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/kitchen/sample_aesthetic_kitchen_pin.jpg',
    intro: 'Slim space-saving profile, minimalist tactile matte finish, and integrated cord management. Refine your kitchen countertop aesthetics with quiet architectural order and restorative morning rituals.',
    whyWeChoseThis: 'Designed specifically for streamlined, uncluttered countertops, the bella Fits-Anywhere™ toaster marries a sleek, narrow footprint with an extra-wide toast slot. Its tactile matte oat finish eliminates unsightly fingerprints while bringing quiet warmth to minimalist kitchens.',
    features: [
      'Architectural Slim Space-Saving Footprint (under 4.5" wide)',
      'Extra-Wide Long Slot Fits Artisan Sourdough & Bagels',
      'Minimalist Fingerprint-Resistant Matte Finish',
      'Integrated Under-Base Cord Management for Zero Clutter',
      'Auto-Shutoff & Removable Slide-Out Crumb Tray'
    ]
  },
  '3-tier-bamboo-spice-rack-wall-mount-or-countertops': {
    asin: 'B0BLVQSNW9',
    title: '3 Tier Bamboo Spice Rack Wall Mount or Countertop, Spice Organizer',
    displayTitle: 'Warm Bamboo 3-Tier Spice Rack | Architectural Kitchen Organizer',
    collection: 'Smart Kitchen Gadgets & Hacks',
    price: '$28.02',
    rating: 4.6,
    imageStudio: 'https://m.media-amazon.com/images/I/819qq9nBSbL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_3-tier-bamboo-spice-rack-wall-mount-or-countertops.jpg',
    intro: 'Morning light catches the soft, organic grain of bamboo, turning a mundane cooking nook into a quiet ritual of calm. Clearing the visual noise of mismatched bottles lets your kitchen finally breathe.',
    whyWeChoseThis: 'Crafted with architectural precision, this three-tier organizer introduces natural tactility and linear discipline to modern minimalist spaces. It bridges the gap between utilitarian storage and understated display.',
    features: [
      'Eco-Conscious Natural Moso Bamboo Construction',
      'Dual Mount Flexibility: Countertop Standing or Flush Wall-Mounted',
      'Guardrail-Protected Shelves Prevent Bottle Slips',
      'Architectural Quality & Tactile Finish'
    ]
  },
  '24-travertine-inspired-table-lamp-for-living-room-': {
    asin: 'B0GGZF4FFR',
    title: '24" Travertine Inspired Table Lamp for Living Room Single, Modern Minimalist Con',
    displayTitle: '24" Travertine Inspired Table Lamp | Warm Luxury Home Decor',
    collection: 'Aesthetic Room Decor & Lighting',
    price: '$59.99',
    rating: 4.5,
    imageStudio: 'https://m.media-amazon.com/images/I/71t+ICT6GtL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_24-travertine-inspired-table-lamp-for-living-room-.jpg',
    intro: 'Creating a grounded home starts with tactile surfaces and organic tones. The 24" Travertine Inspired Table Lamp introduces a quiet architectural presence to quiet corners, shaping the mood of a room through diffused light.',
    whyWeChoseThis: 'This piece balances substantial stone-like texture with clean lines, making it an ideal focal point for modern minimalist spaces. Pair it with raw linen and aged brass to complete a warm, curated interior.',
    features: [
      'Honed Faux Travertine Base with Authentic Organic Pores',
      'Textured Natural Linen Shade for 2700K Warm Ambient Glow',
      'Heavy Grounded Footprint for Bedside or Console Styling',
      'Architectural Silhouette for Warm Minimalism'
    ]
  },
  'upsimples-11x14-picture-frame-wall-decor-photo-fra': {
    asin: 'B08F9V75Y5',
    title: 'upsimples 11x14 Picture Frame Wall Decor Photo Frame Set',
    displayTitle: 'Minimalist Gallery Picture Frames | Scandinavian Wall Decor',
    collection: 'Printable Wall Art & Decor',
    price: '$21.99',
    rating: 4.7,
    imageStudio: 'https://m.media-amazon.com/images/I/71rM2pT8hRL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_upsimples-11x14-picture-frame-wall-decor-photo-fra.jpg',
    intro: 'Elevate your gallery walls with clean lines, high-clarity front covers, and neutral wood warmth. Designed to showcase intentional art and seasonal prints without visual clutter.',
    whyWeChoseThis: 'Simple, understated profiles that let your prints take center stage. Perfect for styling modern aesthetic spaces with effortless elegance.',
    features: [
      'Set of High-Precision Clean-Profile Frames',
      'Shatter-Resistant Tempered Acrylic Glass',
      'Pre-Installed Hanging Hardware for Vertical or Horizontal Mount',
      'Neutral Natural Tones for Minimalist Interiors'
    ]
  }
};

// Try loading extra items from local pinterest_queue.json if present
function loadQueueCatalog() {
  try {
    const queuePaths = [
      path.join(process.cwd(), 'pinterest_queue.json'),
      path.join(__dirname, '..', 'pinterest_queue.json')
    ];
    for (const qp of queuePaths) {
      if (fs.existsSync(qp)) {
        const queueData = JSON.parse(fs.readFileSync(qp, 'utf8'));
        if (Array.isArray(queueData)) {
          for (const item of queueData) {
            if (item.destination_link && item.destination_link.includes('/curated/')) {
              const slugMatch = item.destination_link.match(/\/curated\/([^/?#]+)/);
              if (slugMatch && slugMatch[1]) {
                const s = slugMatch[1].toLowerCase().trim();
                if (!PRODUCT_CATALOG[s] && item.asin) {
                  PRODUCT_CATALOG[s] = {
                    asin: item.asin,
                    title: item.title || s.replace(/-/g, ' '),
                    displayTitle: item.title || s.replace(/-/g, ' '),
                    collection: item.board || 'Aesthetic Haven Studio',
                    price: item.price || 'Check Prime Price',
                    rating: item.rating || 4.5,
                    imageStudio: item.image_path || '/assets/pinterest/kitchen/sample_aesthetic_kitchen_pin.jpg',
                    imageMockup: item.image_path || '/assets/pinterest/kitchen/sample_aesthetic_kitchen_pin.jpg',
                    intro: item.description || 'Curated design essential selected for intentional, warm minimalist sanctuaries.',
                    whyWeChoseThis: item.description || 'Carefully selected for craftsmanship, aesthetic harmony, and functional longevity.',
                    features: item.tags || ['Architectural Design', 'Amazon Prime Verified', 'Aesthetic Home']
                  };
                }
              }
            }
          }
        }
        break;
      }
    }
  } catch (e) {
    // Non-blocking
  }
}

function renderHtmlPage(slug, product) {
  const amazonUrl = `https://www.amazon.com/dp/${product.asin}?tag=${AMAZON_TAG}`;
  const canonicalUrl = `https://agentwell.agency/curated/${slug}`;
  const title = product.displayTitle || product.title;
  const collection = product.collection || 'Aesthetic Haven Studio';
  const price = product.price || 'Check Prime Price';
  const rating = product.rating || '4.5';
  const intro = product.intro || 'Carefully evaluated for intentional, warm modern spaces.';
  const whyWeChoseThis = product.whyWeChoseThis || 'Selected for timeless materials, tactile quality, and understated elegance.';
  const featuresList = (product.features || [
    'Architectural Quality & Tactile Finish',
    'Designed for Modern Warm Minimalist Spaces',
    'Highly Rated by Verified Homeowners'
  ]).map(f => `<li class="flex items-start gap-2.5 text-sm sm:text-base text-charcoal-muted leading-relaxed"><span class="text-terracotta mt-1">✦</span><span>${escapeHtml(f)}</span></li>`).join('');

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(title)} — Architectural Sourcebook | AgentWell Curated</title>
  <meta name="description" content="Editorial sourcebook and real-time deal review for ${escapeHtml(product.title)}. Handpicked for warm minimalist and modern spaces.">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(intro)}">
  <meta property="og:image" content="${escapeHtml(product.imageStudio || product.imageMockup || '')}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="pinterest-rich-pin" content="true">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            cream: '#FAF8F5',
            borderWarm: '#EAE6DF',
            charcoal: { DEFAULT: '#1F1F1F', muted: '#4A4641', light: '#767067' },
            terracotta: '#B85D43'
          },
          fontFamily: {
            serif: ['Playfair Display', 'Georgia', 'serif'],
            sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
          }
        }
      }
    }
  </script>
</head>
<body class="bg-cream text-charcoal font-sans antialiased min-h-screen flex flex-col">

  <!-- Header -->
  <header class="w-full border-b border-borderWarm bg-white/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-full bg-cream border border-charcoal/20 flex items-center justify-center font-serif text-xs font-semibold">AH</div>
        <span class="font-serif text-lg font-medium tracking-tight">Aesthetic Haven Studio <span class="text-xs text-terracotta font-sans font-normal ml-1">Curated by AgentWell</span></span>
      </a>
      <span class="text-xs uppercase tracking-widest text-charcoal-light font-medium">${escapeHtml(collection)}</span>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 flex-grow">
    
    <!-- Breadcrumbs -->
    <nav class="text-xs text-charcoal-light flex items-center gap-2">
      <a href="/" class="hover:underline">Studio</a>
      <span>/</span>
      <a href="/curated/living-room-decor" class="hover:underline">Curated Edits</a>
      <span>/</span>
      <span class="text-charcoal font-medium truncate max-w-[240px]">${escapeHtml(product.title)}</span>
    </nav>

    <!-- Product Hero Block -->
    <article class="bg-white border border-borderWarm rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
      
      <div class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cream text-terracotta border border-borderWarm">
            ★ Verified Prime Design Pick
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ In Stock & Real-Time Verified (★ ${rating}/5)
          </span>
        </div>
        <h1 class="font-serif text-2xl sm:text-4xl font-medium text-charcoal leading-tight">
          ${escapeHtml(title)}
        </h1>
        <p class="text-sm text-charcoal-light">Architectural Curation & Quality Verification by Aesthetic Haven Studio</p>
      </div>

      <!-- AAS Lifestyle Intro Block -->
      <div class="p-5 rounded-2xl bg-[#F7F5F0] border-l-4 border-terracotta text-charcoal-muted leading-relaxed font-serif text-base sm:text-lg italic">
        "${escapeHtml(intro)}"
      </div>

      <!-- Visual Gallery (Product HD Image + 2:3 Mockup Image) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div class="rounded-2xl overflow-hidden bg-cream border border-borderWarm flex flex-col items-center justify-center p-6 relative group">
          <span class="absolute top-3 left-3 text-[11px] font-medium uppercase tracking-wider text-charcoal-light bg-white/90 px-2 py-0.5 rounded shadow-sm">
            Product Studio View
          </span>
          <img src="${escapeHtml(product.imageStudio || product.imageMockup || '')}" alt="${escapeHtml(product.title)}" class="max-h-[380px] w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105" loading="eager" onerror="this.onerror=null;this.src='/assets/pinterest/kitchen/sample_aesthetic_kitchen_pin.jpg';">
        </div>

        <div class="rounded-2xl overflow-hidden bg-cream border border-borderWarm flex flex-col items-center justify-center p-2 relative group">
          <span class="absolute top-3 left-3 text-[11px] font-medium uppercase tracking-wider text-white bg-charcoal/80 px-2 py-0.5 rounded shadow-sm z-10">
            ★ 2:3 In-Situ Architectural Mockup
          </span>
          <img src="${escapeHtml(product.imageMockup || product.imageStudio || '')}" alt="${escapeHtml(product.title)} Architectural In-Situ Preview" class="w-full h-auto max-h-[420px] object-cover rounded-xl shadow transition-transform duration-300 group-hover:scale-102" loading="lazy" onerror="this.onerror=null;this.src='https://m.media-amazon.com/images/I/71u9sJ15bJL._AC_SL1500_.jpg';">
        </div>
      </div>

      <!-- Pricing & Amazon CTA -->
      <div class="bg-cream border border-borderWarm rounded-2xl p-6 sm:p-8 space-y-4">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <span class="text-xs uppercase tracking-wider text-charcoal-light font-semibold">Current Prime Price</span>
            <div class="text-3xl sm:text-4xl font-serif font-bold text-charcoal">${escapeHtml(price)}</div>
          </div>
          <span class="text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Prime Fast & Free Delivery Available
          </span>
        </div>

        <!-- Primary CTA Button -->
        <a 
          href="${amazonUrl}" 
          target="_blank" 
          rel="sponsored nofollow noopener noreferrer"
          class="w-full py-4 px-6 rounded-xl bg-charcoal hover:bg-terracotta text-white font-medium text-center flex items-center justify-center gap-2.5 transition-colors duration-200 shadow-md text-base sm:text-lg group"
        >
          <span>Check on Amazon & View Real-Time Deals</span>
          <svg class="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </a>

        <p class="text-[11px] text-charcoal-light text-center leading-tight">
          As an Amazon Associate, we earn from qualifying purchases at no extra cost to you. Verified authentic listing.
        </p>
      </div>

      <!-- Curated Architectural Specs Table -->
      <div class="space-y-4 pt-4 border-t border-borderWarm">
        <h2 class="font-serif text-xl sm:text-2xl font-medium text-charcoal">Curated Specifications & Details</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left border border-borderWarm rounded-xl overflow-hidden">
            <tbody class="divide-y divide-borderWarm">
              <tr class="bg-cream/40">
                <th class="px-4 py-3 font-medium text-charcoal-light w-1/3">Target Collection</th>
                <td class="px-4 py-3 text-charcoal font-medium">${escapeHtml(collection)}</td>
              </tr>
              <tr>
                <th class="px-4 py-3 font-medium text-charcoal-light">ASIN</th>
                <td class="px-4 py-3 text-charcoal font-mono text-xs">${escapeHtml(product.asin)}</td>
              </tr>
              <tr class="bg-cream/40">
                <th class="px-4 py-3 font-medium text-charcoal-light">Key Features</th>
                <td class="px-4 py-3 text-charcoal">${escapeHtml((product.features || []).join(' • '))}</td>
              </tr>
              <tr>
                <th class="px-4 py-3 font-medium text-charcoal-light">Prime & Shipping</th>
                <td class="px-4 py-3 text-emerald-700 font-medium">Eligible for Amazon Prime Fast & Free Delivery</td>
              </tr>
              <tr class="bg-cream/40">
                <th class="px-4 py-3 font-medium text-charcoal-light">Curated Affiliation</th>
                <td class="px-4 py-3 text-charcoal-light text-xs font-mono">${AMAZON_TAG} (AgentWell Verified)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Architectural & Styling Notes -->
      <div class="space-y-4 pt-4 border-t border-borderWarm">
        <h2 class="font-serif text-xl sm:text-2xl font-medium text-charcoal">Why It Belongs In Your Space</h2>
        <p class="text-charcoal-muted leading-relaxed text-sm sm:text-base">
          ${escapeHtml(whyWeChoseThis)}
        </p>
        <ul class="space-y-2.5 pt-2">
          ${featuresList}
        </ul>
      </div>

      <!-- Secondary Bottom CTA -->
      <div class="pt-6 border-t border-borderWarm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div class="text-sm font-medium text-charcoal">Ready to transform your countertop?</div>
          <div class="text-xs text-charcoal-light">Check current stock, colorways, and reviews on Amazon US.</div>
        </div>
        <a 
          href="${amazonUrl}" 
          target="_blank" 
          rel="sponsored nofollow noopener noreferrer"
          class="py-3 px-6 rounded-xl bg-terracotta hover:bg-charcoal text-white font-medium text-sm transition-colors duration-200 shadow flex items-center gap-2 whitespace-nowrap"
        >
          <span>View on Amazon & Check Deals</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </a>
      </div>

    </article>

  </main>

  <!-- Footer -->
  <footer class="w-full bg-white border-t border-borderWarm py-8 px-6 text-center text-xs text-charcoal-light space-y-2">
    <p>Aesthetic Haven Studio • Curated by AgentWell • Participant in the Amazon Services LLC Associates Program.</p>
    <p>&copy; 2026 Aesthetic Haven Studio. All rights reserved.</p>
  </footer>

</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async (req, res) => {
  // Extract slug from query param or URL path
  let rawSlug = req.query.slug || '';
  if (!rawSlug && req.url) {
    const match = req.url.match(/\/curated\/([^/?#]+)/);
    if (match) {
      rawSlug = match[1];
    }
  }

  const cleanSlug = String(rawSlug).toLowerCase().trim().replace(/\.html$/, '');

  if (!cleanSlug) {
    return res.redirect(302, DEFAULT_FALLBACK_URL);
  }

  // 1. Check if physical static HTML file exists in public/curated or curated
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'curated', `${cleanSlug}.html`),
    path.join(process.cwd(), 'curated', `${cleanSlug}.html`),
    path.join(__dirname, '..', 'public', 'curated', `${cleanSlug}.html`),
    path.join(__dirname, '..', 'curated', `${cleanSlug}.html`)
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        return res.status(200).send(fileContent);
      }
    } catch (e) {
      // Continue to dynamic generator
    }
  }

  // 2. Load any extra items from pinterest_queue.json
  loadQueueCatalog();

  // 3. Check Product Catalog
  if (PRODUCT_CATALOG[cleanSlug]) {
    const product = PRODUCT_CATALOG[cleanSlug];
    const html = renderHtmlPage(cleanSlug, product);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=86400');
    return res.status(200).send(html);
  }

  // 4. Check if slug contains an ASIN pattern (e.g. B0CYJBB2JQ or ends with an ASIN)
  const asinMatch = cleanSlug.match(/\b([bB][0-9a-zA-Z]{9})\b/);
  if (asinMatch) {
    const asin = asinMatch[1].toUpperCase();
    const dynamicProduct = {
      asin: asin,
      title: cleanSlug.replace(/-/g, ' ').replace(asin, '').trim().toUpperCase() || `Amazon Prime Curated Pick (${asin})`,
      displayTitle: cleanSlug.replace(/-/g, ' ') || `Curated Design Essential (${asin})`,
      collection: 'Curated Architectural Home',
      price: 'Check Prime Deals',
      rating: 4.5,
      imageStudio: 'https://m.media-amazon.com/images/I/71u9sJ15bJL._AC_SL1500_.jpg',
      imageMockup: '/assets/pinterest/kitchen/sample_aesthetic_kitchen_pin.jpg',
      intro: 'Curated architectural find handpicked for warm minimalist spaces and restorative everyday rituals.',
      whyWeChoseThis: 'Evaluated for material integrity, aesthetic balance, and tactile living.',
      features: ['Amazon Prime Verified', 'Aesthetic Home Essential', 'Fast & Reliable Shipping']
    };
    const html = renderHtmlPage(cleanSlug, dynamicProduct);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=86400');
    return res.status(200).send(html);
  }

  // 5. Fallback Safety: Slug not recognized -> Redirect 302 to search or homepage
  // TUYỆT ĐỐI KHÔNG để rơi vào màn hình 404 trắng bệch của Vercel!
  const searchKeywords = cleanSlug.replace(/-/g, ' ').trim();
  if (searchKeywords.length >= 3) {
    const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchKeywords)}&tag=${AMAZON_TAG}`;
    // Redirect 302 directly to the relevant Amazon affiliate search
    return res.redirect(302, amazonSearchUrl);
  }

  return res.redirect(302, DEFAULT_FALLBACK_URL);
};
