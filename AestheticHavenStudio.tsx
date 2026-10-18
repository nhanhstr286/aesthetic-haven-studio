'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProductCard {
  id: string;
  category: string;
  badge: string;
  badgeStyle: 'terracotta' | 'sage' | 'olive' | 'honey';
  title: string;
  description: string;
  subtext: string;
  tag?: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  isExternal: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Finds', icon: '' },
  { id: 'room-decor', label: '✨ Room Decor & Lighting', icon: '✨' },
  { id: 'smart-kitchen', label: '🍳 Smart Kitchen Finds', icon: '🍳' },
  { id: 'digital-planners', label: '📱 Digital Planners & iPad', icon: '📱' },
  { id: 'wall-art', label: '🖼️ Printable Wall Art', icon: '🖼️' },
];

const PRODUCTS: ProductCard[] = [
  // Board 01: Aesthetic Room Decor & Lighting
  {
    id: 'ceramic-mushroom-lamp',
    category: 'room-decor',
    badge: 'CURATOR\'S CHOICE',
    badgeStyle: 'terracotta',
    title: 'Retro Ceramic Mushroom Table Lamp (Warm 2700K Glow)',
    description: 'Sculptural fluted ceramic base with a soft frosted mushroom glass dome. Emits a restorative 2700K sunset ambient glow.',
    subtext: '$37.97 • Prime Available',
    tag: '★ 4.9 (1.8k)',
    ctaText: 'View on Amazon',
    ctaUrl: 'https://amzn.to/4zzEs1h',
    imageUrl: 'https://m.media-amazon.com/images/I/71VbY3g+WxL._AC_SL1500_.jpg',
    isExternal: true,
  },
  {
    id: 'sunset-lamp',
    category: 'room-decor',
    badge: 'LIGHTING',
    badgeStyle: 'terracotta',
    title: 'Sunset Projection Lamp',
    description: 'Golden hour ambient glow with 360° rotation for bedroom, desk & living sanctuaries.',
    subtext: 'Amazon Verified Find',
    tag: '★ 4.9 (2.4k)',
    ctaText: 'View on Amazon',
    ctaUrl: 'https://amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'nordic-vase',
    category: 'room-decor',
    badge: 'ACCENTS',
    badgeStyle: 'sage',
    title: 'Nordic Wabi-Sabi Ceramic Vase',
    description: 'Handcrafted matte off-white textured vessel sculpted for dried pampas & eucalyptus.',
    subtext: 'Curated Vessel',
    tag: 'Studio Favorite',
    ctaText: 'Shop Collection',
    ctaUrl: 'https://amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },

  // Board 02: Smart Kitchen Gadgets & Hacks
  {
    id: 'smart-kitchen-kettle',
    category: 'smart-kitchen',
    badge: '★ EDITOR\'S CHOICE',
    badgeStyle: 'olive',
    title: 'Retro Electric Gooseneck Kettle (Matte Cream White)',
    description: 'Precision pour-over spout, 1200W rapid boiling, auto shut-off, and minimalist matte Scandinavian finish for calm morning rituals.',
    subtext: '$49.99 • Prime Available',
    tag: '★ 4.8 (2,410+)',
    ctaText: 'View on Amazon',
    ctaUrl: 'https://amzn.to/4zzEs1h',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'gravity-grinder',
    category: 'smart-kitchen',
    badge: 'SMART KITCHEN',
    badgeStyle: 'olive',
    title: 'Rechargeable Gravity Grinder Set',
    description: 'One-handed automatic tilt operation with warm LED illumination & ceramic cores.',
    subtext: 'Type-C Fast Charge',
    tag: 'Viral TikTok / Pin',
    ctaText: 'View on Amazon',
    ctaUrl: 'https://amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'spice-rack',
    category: 'smart-kitchen',
    badge: 'ORGANIZATION',
    badgeStyle: 'honey',
    title: 'Magnetic Spice Rack Organizer',
    description: 'Heavy-duty matte carbon steel shelving attaches seamlessly to refrigerator sides.',
    subtext: 'Holds up to 15 lbs',
    tag: 'No Drilling',
    ctaText: 'Explore',
    ctaUrl: 'https://amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },

  // Board 03: Digital Planners & iPad Aesthetics
  {
    id: 'digital-planner-ipad',
    category: 'digital-planners',
    badge: '★ DIGITAL DOWNLOAD',
    badgeStyle: 'sage',
    title: 'Minimalist Life & Focus Digital Planner (Goodnotes & iPad Compatible)',
    description: 'Hyperlinked 2026 daily, weekly, and monthly lifestyle planner designed for iPad & tablet users. Minimalist aesthetic with zero clutter to organize routines, habit trackers, and personal goals effortlessly.',
    subtext: '$12.99 • Instant Access',
    tag: '★ 4.9 (1,840+)',
    ctaText: 'Get Instant Access',
    ctaUrl: 'https://gumroad.com',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'digital-planner',
    category: 'digital-planners',
    badge: 'DIGITAL DOWNLOAD',
    badgeStyle: 'sage',
    title: 'Undated Life & Wellness Planner',
    description: 'Hyperlinked 400+ page aesthetic planner for iPad, habit trackers & mindful journaling.',
    subtext: 'Instant PDF Sync',
    tag: 'GoodNotes / Notability',
    ctaText: 'Get Instant Access',
    ctaUrl: 'https://etsy.com',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'notion-dashboard',
    category: 'digital-planners',
    badge: 'NOTION TEMPLATE',
    badgeStyle: 'terracotta',
    title: 'Notion All-in-One Life Dashboard',
    description: 'Warm minimalist workspace organizing daily routines, budgets, projects & vision boards.',
    subtext: 'Free Lifetime Updates',
    tag: '1-Click Duplicate',
    ctaText: 'Get Template',
    ctaUrl: 'https://notion.so',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },

  // Board 04: Printable Wall Art & Decor
  {
    id: 'printable-wall-art-frame',
    category: 'wall-art',
    badge: '★ ESSENTIAL FIND',
    badgeStyle: 'honey',
    title: 'Solid Natural Oak Wood Frame (12x16 with Mat)',
    description: 'Crafted from 100% solid North American white oak with high-definition shatterproof plexiglass. Designed to display art prints and gallery walls seamlessly.',
    subtext: '$24.99 • Prime Available',
    tag: '★ 4.7 (980+)',
    ctaText: 'View on Amazon',
    ctaUrl: 'https://amzn.to/4zzEs1h',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'botanical-prints',
    category: 'wall-art',
    badge: 'HIGH-RES 300 DPI PDF',
    badgeStyle: 'honey',
    title: 'Neutral Botanical Gallery Trio',
    description: 'Warm earth-tone botanical line art pre-scaled for IKEA & standard frame dimensions.',
    subtext: 'Instant Digital Files',
    tag: '5 Ratio Sizes',
    ctaText: 'Download Prints',
    ctaUrl: 'https://etsy.com',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
  {
    id: 'bauhaus-poster',
    category: 'wall-art',
    badge: 'DIGITAL ART',
    badgeStyle: 'olive',
    title: 'Bauhaus Geometric Poster Set',
    description: 'Mid-century modern abstract shapes in warm terracotta, cream, olive, and charcoal.',
    subtext: 'Print-At-Home Ready',
    tag: 'Modern Gallery Look',
    ctaText: 'View Prints',
    ctaUrl: 'https://etsy.com',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    isExternal: true,
  },
];

const badgeColorClasses = {
  terracotta: 'bg-[#F8EFEA] text-[#B85D43] border-[#E8D2C7]',
  sage: 'bg-[#EEF3F0] text-[#4A6B5B] border-[#D2E2D8]',
  olive: 'bg-[#EFF2EB] text-[#556B2F] border-[#D9E2D2]',
  honey: 'bg-[#F8F3EA] text-[#9E7444] border-[#EBDDC9]',
};

export default function AestheticHavenStudio() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredProducts =
    activeCategory === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Aesthetic Haven Studio',
          text: 'Curated Living, Warm Spaces & Digital Lifestyle',
          url: window.location.href,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Link copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1F1F] font-sans flex flex-col selection:bg-[#F8EFEA] selection:text-[#B85D43]">
      {/* Top Announcement Bar */}
      <aside className="w-full bg-[#F3EFE9] border-b border-[#EAE6DF] py-2 px-4 text-center text-xs tracking-wider text-[#625E59] uppercase font-medium flex items-center justify-center gap-2">
        <span>✨ Autumn 2026 Pinterest Trend Curation</span>
        <span className="inline-block w-1 h-1 rounded-full bg-[#B85D43]"></span>
        <span className="hidden sm:inline">Handpicked for warm, intentional sanctuaries</span>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6DF] transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#1F1F1F]/20 bg-[#F4EFEA] flex items-center justify-center font-serif text-[#1F1F1F] font-semibold text-sm shadow-sm">
              AH
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-medium tracking-tight text-[#1F1F1F]">
                Aesthetic Haven
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#8C857B] font-medium">
                Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F8EFEA] text-[#B85D43] border border-[#E8D2C7] hover:bg-[#B85D43] hover:text-white transition-all shadow-sm"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.365-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12C24.017 5.367 18.644 0 12.017 0z"/>
              </svg>
              <span>Pinterest</span>
            </a>

            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full border border-[#EAE6DF] bg-white hover:bg-[#F4EFEA] flex items-center justify-center text-[#625E59] hover:text-[#1F1F1F] transition-all"
              aria-label="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#EAE6DF] bg-[#F4EFEA] text-[#1F1F1F] font-serif text-2xl sm:text-3xl mb-5 shadow-sm">
          AH
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#1F1F1F] mb-3">
          Aesthetic Haven Studio
        </h1>

        <p className="text-sm sm:text-base font-normal tracking-wide text-[#625E59] max-w-xl mx-auto leading-relaxed">
          Curated Living, Warm Spaces & Digital Lifestyle
        </p>

        <p className="mt-2 text-xs sm:text-sm text-[#8C857B] max-w-lg mx-auto">
          Handpicked essentials designed to bring tranquility, natural warmth, and intention to your daily rituals.
        </p>

        {/* Category Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm ${
                  isActive
                    ? 'bg-[#1F1F1F] text-[#FAF8F5]'
                    : 'bg-white border border-[#EAE6DF] text-[#1F1F1F] hover:bg-[#F4EFEA]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 pb-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group bg-white border border-[#EAE6DF] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#1F1F1F]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <a
                  href={product.ctaUrl}
                  target={product.isExternal ? '_blank' : undefined}
                  rel={product.isExternal ? (product.ctaUrl.includes('amzn.to') ? 'noopener noreferrer nofollow' : 'noopener noreferrer') : undefined}
                  className="block relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#EFECE6] mb-4"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold border backdrop-blur-sm shadow-xs ${
                        badgeColorClasses[product.badgeStyle]
                      }`}
                    >
                      {product.badge}
                    </span>
                  </div>
                  {product.tag && (
                    <div className="absolute bottom-3 right-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-md">
                        {product.tag}
                      </span>
                    </div>
                  )}
                </a>

                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg font-medium text-[#1F1F1F]">
                    <a
                      href={product.ctaUrl}
                      target={product.isExternal ? '_blank' : undefined}
                      rel={product.isExternal ? (product.ctaUrl.includes('amzn.to') ? 'noopener noreferrer nofollow' : 'noopener noreferrer') : undefined}
                      className="hover:underline transition-all"
                    >
                      {product.title}
                    </a>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#625E59] leading-relaxed line-clamp-1">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-[#EAE6DF]/60 flex items-center justify-between">
                <span className="text-xs text-[#8C857B] font-medium">
                  {product.subtext}
                </span>
                <a
                  href={product.ctaUrl}
                  target={product.isExternal ? '_blank' : undefined}
                  rel={product.isExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1F1F1F] text-[#FAF8F5] hover:bg-[#B85D43] transition-colors duration-200 shadow-sm"
                >
                  <span>{product.ctaText}</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#F5F2EC] border-t border-[#EAE6DF] py-10 px-4 sm:px-6 mt-auto">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#EAE6DF]/80 pb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#F4EFEA] border border-[#1F1F1F]/20 flex items-center justify-center font-serif text-xs font-semibold">
                AH
              </div>
              <span className="font-serif text-base font-medium text-[#1F1F1F]">
                Aesthetic Haven Studio
              </span>
            </div>
            <nav className="flex items-center justify-center gap-4 text-xs text-[#625E59]">
              <a href="#top" className="hover:text-[#1F1F1F]">Back to Top</a>
              <span>•</span>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#B85D43]">Pinterest</a>
            </nav>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-[11px] sm:text-xs text-[#625E59] leading-relaxed">
              <strong className="font-semibold text-[#1F1F1F]">Amazon Affiliate Disclosure:</strong> Aesthetic Haven Studio is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate, we earn from qualifying purchases at no extra cost to you.
            </p>
          </div>

          <div className="pt-2 text-xs text-[#8C857B]">
            <p>&copy; 2026 Aesthetic Haven Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1F1F] text-[#FAF8F5] text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
