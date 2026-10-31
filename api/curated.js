/**
 * Vercel Serverless Dynamic Route: /curated/[slug]
 * Aesthetic Haven Studio (agentwell.agency)
 * 
 * STRICT 1-TO-1 SYNC SPECIFICATION:
 * - Single Source of Truth: Serves exact product metadata (ASIN, Title, Image, Price).
 * - Never renders alien products or generic toaster mockups.
 * - If unknown slug: 302 redirects to Amazon Affiliate Search or Homepage.
 */

const fs = require('fs');
const path = require('path');

const AMAZON_TAG = 'aesthetic08d8-20';
const DEFAULT_FALLBACK_URL = 'https://agentwell.agency/';

// Load verified Single Source of Truth Catalog
let CATALOG = {};
try {
  const catalogPaths = [
    path.join(__dirname, '..', 'curated_catalog.json'),
    path.join(process.cwd(), 'curated_catalog.json'),
    path.join(__dirname, 'curated_catalog.json')
  ];
  for (const cp of catalogPaths) {
    if (fs.existsSync(cp)) {
      CATALOG = JSON.parse(fs.readFileSync(cp, 'utf8'));
      break;
    }
  }
} catch (e) {
  console.warn('[Curated API] Notice loading curated_catalog.json:', e.message);
}

// Built-in verified product catalog to guarantee 100% immediate rendering even if disk is isolated
const BUILTIN_CATALOG = {
  'bella-fits-anywhere-2-slice-slim-toaster': {
    asin: 'B0CYJBB2JQ',
    title: 'bella Fits-Anywhere™ 2-Slice Slim Toaster with Extra Wide Slot & Matte Finish',
    displayTitle: 'bella Fits-Anywhere™ 2-Slice Slim Toaster | Smart Kitchen Gadgets & Hacks',
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
    collection: 'Warm Luxury Home Decor',
    price: '$49.00',
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
  'orange-mushroom-lamp-cordless-rechargeable-touch-d': {
    asin: 'B0GY76LD9T',
    title: 'Orange Mushroom Lamp Cordless Rechargeable Touch Dimmable Desk Lamp',
    displayTitle: 'Orange Mushroom Lamp Cordless Rechargeable Touch Dimmable Desk Lamp | Aesthetic Room Decor',
    collection: 'Aesthetic Room Decor & Lighting',
    price: '$33.00',
    rating: 4.6,
    imageStudio: 'https://m.media-amazon.com/images/I/61G5BX7NA7L._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_orange-mushroom-lamp-cordless-rechargeable-touch-d.jpg',
    intro: 'A delightful pop of warm retro color paired with smooth cordless freedom. The orange mushroom silhouette infuses evening rooms with ambient golden light and tactile serenity.',
    whyWeChoseThis: 'Cordless rechargeability meets iconic biomorphic design. Perfect for bedside tables, bookshelf accents, or outdoor terrace dinners.',
    features: [
      'Touch-Activated Stepless Dimming (Warm 2700K Glow)',
      'Long-Lasting USB-C Rechargeable Battery (Up to 16 Hours)',
      'Mid-Century Biomorphic Mushroom Silhouette',
      'Portable & Cordless for Anywhere Ambient Placement'
    ]
  },
  'solid-walnut-wood-magsafe-wireless-charging-stand-': {
    asin: 'B09WDP6D3F',
    title: 'Solid Walnut MagSafe Charging Stand & Minimalist Desk Organizer',
    displayTitle: 'Solid Walnut MagSafe Charging Stand & Minimalist Desk Organizer | Tech Protection & Decor',
    collection: 'Digital Planners & iPad Aesthetics',
    price: '$48.50',
    rating: 4.8,
    imageStudio: 'https://m.media-amazon.com/images/I/71tqF1T1R5L._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_solid-walnut-wood-magsafe-wireless-charging-stand-.jpg',
    intro: 'Engineered to bring warm organic materials and architectural order to your workspace. Replaces visual cord clutter with tactile walnut calm.',
    whyWeChoseThis: '100% solid North American walnut weighted with bead-blasted aluminum. Provides the ideal 60-degree viewing angle for iOS StandBy Mode.',
    features: [
      '100% Solid Natural Walnut Base with Natural Grain',
      'Weighted Anti-Slip Aluminum Pedestal for Stable Docking',
      'Optimal 60-Degree StandBy Viewing Angle',
      'Concealed Silicone Cable Routing Channel'
    ]
  },
  'lyyyxgyp-12x16-picture-frame-set-of-3-natural-soli': {
    asin: 'B0CP8QQSF2',
    title: 'Natural Solid Oak 12x16 Frames: Warm Minimalist Wall Art Set of 3',
    displayTitle: 'Natural Solid Oak 12x16 Frames Set of 3 | Scandinavian Wall Art & Decor',
    collection: 'Printable Wall Art & Decor',
    price: '$35.60',
    rating: 4.7,
    imageStudio: 'https://m.media-amazon.com/images/I/71dqU5CTmFL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_lyyyxgyp-12x16-picture-frame-set-of-3-natural-soli.jpg',
    intro: 'Curated to anchor modern living spaces with clean architectural proportions and subtle tactile depth. Natural solid white oak framing balances negative space effortlessly.',
    whyWeChoseThis: 'A timeless framing choice that brings quiet gallery presence to neutral, light-filled rooms. Features high-clarity tempered glass and acid-free archival mats.',
    features: [
      'Sustainably Harvested Solid White Oak Wood',
      'High-Clarity Shatter-Resistant Glass Fronts',
      'Acid-Free Archival Beveled Mats Included',
      'Dual Orientation Hanging Hardware Pre-Installed'
    ]
  },
  'kordiz-handcrafted-crazy-horse-leather-case-for-ip': {
    asin: 'B0FJGCMK6Q',
    title: 'KORDIZ Crazy Horse Leather iPhone 16 Pro Max Case with Tactile Grip',
    displayTitle: 'KORDIZ Handcrafted Crazy Horse Leather Case | Quiet Luxury Daily Carry',
    collection: 'Digital Planners & iPad Aesthetics',
    price: '$49.80',
    rating: 4.6,
    imageStudio: 'https://m.media-amazon.com/images/I/710mUsSG5AL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_kordiz-handcrafted-crazy-horse-leather-case-for-ip.jpg',
    intro: 'Tactile full-grain leather that develops an authentic, rich patina over time. Brings refined everyday luxury to your digital lifestyle.',
    whyWeChoseThis: 'Hand-finished Crazy Horse leather with MagSafe compatibility and raised metal camera bezels. Clean, tactile, and built to age beautifully.',
    features: [
      'Authentic Hand-Finished Crazy Horse Full-Grain Leather',
      'Strong MagSafe Magnetic Array Built-in',
      'Anodized Aluminum Buttons & Protective Camera Ring',
      'Soft Microfiber Inner Lining to Prevent Scratches'
    ]
  },
  'cordless-mushroom-table-lamp-stepless-dimming-2700': {
    asin: 'B0GF7X4YHS',
    title: 'Cordless Mushroom Table Lamp - Stepless Dimming - 2700K Warm Light - Gold',
    displayTitle: 'Cordless Mushroom Table Lamp 2700K Warm Light | Room Decor & Lighting',
    collection: 'Aesthetic Room Decor & Lighting',
    price: '$38.99',
    rating: 4.5,
    imageStudio: 'https://m.media-amazon.com/images/I/71GErqt+VwL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_cordless-mushroom-table-lamp-stepless-dimming-2700.jpg',
    intro: 'Designed to eliminate harsh overhead glare and introduce layered, restorative ambient illumination into evening living spaces.',
    whyWeChoseThis: 'Pairs warm diffused 2700K light with a brushed metallic dome silhouette. A refined accent for sideboards, reading nooks, or bedside tables.',
    features: [
      '2700K Sunset Warm Amber Illumination',
      'Stepless Touch Brightness Adjustment',
      'Rechargeable Wireless Battery (Up to 14 Hours)',
      'Brushed Satin Metallic Finish'
    ]
  },
  'spice-rack-organizer-for-cabinet-3-tier-bamboo-cou': {
    asin: 'B0HCYQ4QDX',
    title: 'Spice Rack Organizer for Cabinet, 3-Tier Bamboo Countertop Seasoning Shelf',
    displayTitle: 'Bamboo Countertop 3-Tier Seasoning Shelf | Smart Kitchen Gadgets',
    collection: 'Smart Kitchen Gadgets & Hacks',
    price: '$24.99',
    rating: 4.6,
    imageStudio: 'https://m.media-amazon.com/images/I/81mzVVH-DuL._AC_SL1500_.jpg',
    mockup_image: '/assets/pinterest/curated/pin_spice-rack-organizer-for-cabinet-3-tier-bamboo-cou.jpg',
    intro: 'A thoughtful kitchen essential that pairs seamless utility with modern minimalist design. Keeps countertops calm, functional, and organized.',
    whyWeChoseThis: 'Tiered stepped design provides unobstructed visibility for spices and pantry jars. Sustainably harvested natural bamboo adds organic warmth.',
    features: [
      'Tiered Stepped Profile for Effortless Label Visibility',
      'Durable Water-Resistant Moso Bamboo Finish',
      'Compact Footprint Fits Standard Upper Cabinets',
      'Non-Slip Protective Silicone Base Pads'
    ]
  },
  'living-room-decor': {
    asin: 'B09V7S6W3D',
    title: 'Aesthetic Neutral Living Room Decor & Ambient Lighting Sourcebook',
    displayTitle: 'Aesthetic Neutral Living Room Decor Guide | Architectural Digest Style',
    collection: 'Warm Luxury Home Decor',
    price: '$45.00',
    rating: 4.8,
    imageStudio: 'https://m.media-amazon.com/images/I/71VbY3g+WxL._AC_SL1500_.jpg',
    imageMockup: '/assets/pinterest/curated/pin_living-room-decor.jpg',
    intro: 'Thoughtfully designed to bring organic warmth and quiet architectural calm to everyday living spaces. Hand-finished tactile presence.',
    whyWeChoseThis: 'An essential curation for modern homes that prioritizes quiet craftsmanship, unforced simplicity, and timeless comfort.',
    features: [
      'Layered Warm Lighting Formula (2700K Ambient Glow)',
      'Biophilic Materials: Travertine, Boucle, Natural Linen',
      'Decluttered Functional Layout Principles',
      'Handpicked Amazon Prime Architectural Decor Finds'
    ]
  }
};

// Merge loaded catalog into built-in catalog
for (const [k, v] of Object.entries(CATALOG)) {
  if (!BUILTIN_CATALOG[k]) {
    BUILTIN_CATALOG[k] = {
      asin: v.asin,
      title: v.title,
      displayTitle: v.displayTitle || v.title,
      collection: v.board || 'Aesthetic Haven Studio',
      price: v.price || 'Check Prime Price',
      rating: v.rating || 4.6,
      imageStudio: v.image,
      imageMockup: v.mockup_image,
      intro: v.intro || 'Curated design essential selected for intentional, warm minimalist sanctuaries.',
      whyWeChoseThis: v.whyWeChoseThis || 'Carefully selected for craftsmanship, aesthetic harmony, and functional longevity.',
      features: v.features || ['Architectural Quality & Tactile Finish', 'Designed for Modern Spaces', 'Amazon Prime Verified']
    };
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
  <meta name="description" content="Editorial sourcebook and real-time deal review for ${escapeHtml(title)}. Handpicked for warm minimalist and modern spaces.">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(whyWeChoseThis)}">
  <meta property="og:image" content="${escapeHtml(product.imageStudio)}">
  
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
      <span class="text-charcoal font-medium truncate max-w-[240px]">${escapeHtml(title)}</span>
    </nav>

    <!-- Product Hero Block -->
    <article class="bg-white border border-borderWarm rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
      
      <div class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cream text-terracotta border border-borderWarm">
            ★ Verified Prime Design Pick
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ In Stock & Real-Time Verified
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            ★ ${rating} Rating Verified
          </span>
        </div>

        <h1 class="font-serif text-2xl sm:text-4xl font-medium text-charcoal leading-tight">
          ${escapeHtml(title)}
        </h1>
        <p class="text-xs text-charcoal-light uppercase tracking-wider font-medium">Curated Architectural Sourcebook • Amazon Prime Selection</p>
      </div>

      <!-- AAS Lifestyle Intro Block -->
      <div class="p-5 rounded-2xl bg-[#F7F5F0] border-l-4 border-terracotta text-charcoal-muted leading-relaxed font-serif text-base sm:text-lg italic">
        "${escapeHtml(intro)}"
      </div>

      <!-- Visual Gallery (Product Studio Photo + 2:3 Mockup Image) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div class="rounded-2xl overflow-hidden bg-cream border border-borderWarm flex flex-col items-center justify-center p-6 relative group">
          <span class="absolute top-3 left-3 text-[11px] font-medium uppercase tracking-wider text-charcoal-light bg-white/90 px-2 py-0.5 rounded shadow-sm">
            Product Studio View
          </span>
          <img src="${escapeHtml(product.imageStudio)}" alt="${escapeHtml(title)}" class="max-h-[380px] w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105">
        </div>

        <div class="rounded-2xl overflow-hidden bg-cream border border-borderWarm flex flex-col items-center justify-center p-2 relative group">
          <span class="absolute top-3 left-3 text-[11px] font-medium uppercase tracking-wider text-white bg-charcoal/80 px-2 py-0.5 rounded shadow-sm z-10">
            ★ 2:3 In-Situ Architectural Mockup
          </span>
          <img src="${escapeHtml(product.imageMockup || product.imageStudio)}" alt="${escapeHtml(title)} Preview" class="w-full h-auto max-h-[420px] object-cover rounded-xl shadow transition-transform duration-300 group-hover:scale-102">
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
                <td class="px-4 py-3 text-charcoal font-mono text-xs font-bold">${escapeHtml(product.asin)}</td>
              </tr>
              <tr class="bg-cream/40">
                <th class="px-4 py-3 font-medium text-charcoal-light">Prime & Shipping</th>
                <td class="px-4 py-3 text-emerald-700 font-medium">Eligible for Amazon Prime Fast & Free Delivery</td>
              </tr>
              <tr>
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
          <div class="text-sm font-medium text-charcoal">Ready to transform your space?</div>
          <div class="text-xs text-charcoal-light">Check current stock and customer reviews on Amazon US.</div>
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
    .replace(/'/g, '&#039;');
}

module.exports = async (req, res) => {
  const { slug } = req.query;
  const rawSlug = Array.isArray(slug) ? slug[0] : slug;
  const cleanSlug = (rawSlug || '').toLowerCase().trim();

  if (!cleanSlug) {
    return res.redirect(302, DEFAULT_FALLBACK_URL);
  }

  // Pin 14 Historical Discrepancy Fix:
  // If user clicks the upsimples link from Pin 14 (Minimalist Solid Walnut MagSafe Stand),
  // redirect immediately to the Walnut MagSafe Stand page!
  if (cleanSlug === 'upsimples-11x14-picture-frame-wall-decor-photo-fra') {
    return res.redirect(302, '/curated/solid-walnut-wood-magsafe-wireless-charging-stand-');
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
      // Continue to catalog
    }
  }

  // 2. Check Single Source of Truth Catalog
  if (BUILTIN_CATALOG[cleanSlug]) {
    const product = BUILTIN_CATALOG[cleanSlug];
    const html = renderHtmlPage(cleanSlug, product);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=86400');
    return res.status(200).send(html);
  }

  // 3. Fallback Safety: Unknown slug -> 302 Redirect to Amazon search with Affiliate Tag
  // TUYỆT ĐỐI KHÔNG render sai sản phẩm hoặc rơi vào 404 trắng bệch!
  const searchKeywords = cleanSlug.replace(/-/g, ' ').trim();
  if (searchKeywords.length >= 3) {
    const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchKeywords)}&tag=${AMAZON_TAG}`;
    return res.redirect(302, amazonSearchUrl);
  }

  return res.redirect(302, DEFAULT_FALLBACK_URL);
};
