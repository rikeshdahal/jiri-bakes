'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/layout/AppShell';
import { useToast } from '@/components/feedback/Toast';
import { useTheme } from '@/components/layout/ThemeContext';

interface CakeMenuItem {
  id: string | number;
  slug: string;
  name: string;
  nepaliSubtitle?: string;
  price: number;
  cat: 'popular' | 'cheesecake' | 'special';
  categoryLabel: string;
  badge?: string;
  desc: string;
  tags: string[];
  image: string;
  weight: string;
  eggless: boolean;
  available?: boolean;
}

const CAKE_MENU_ITEMS: CakeMenuItem[] = [
  {
    id: 1,
    slug: 'classic-vanilla',
    name: 'Classic Vanilla',
    price: 550,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Timeless Classic',
    desc: 'Light, airy golden sponge layered with pure Madagascar vanilla cream and delicate buttercream piping.',
    tags: ['Soft Sponge', 'Pure Vanilla', 'Bestseller'],
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 2,
    slug: 'black-forest',
    name: 'Black Forest',
    price: 650,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Crowd Favorite',
    desc: 'Rich chocolate sponge steeped in cherry infusion, filled with dark sweet cherries, whipped cream and shaved dark chocolate.',
    tags: ['Dark Cherry', 'Chocolate Shavings', 'Party Special'],
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 3,
    slug: 'strawberry-blueberry',
    name: 'Strawberry / Blueberry',
    price: 700,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Wild Berry',
    desc: 'Delicate vanilla sponge kissed with house-simmered wild strawberry and blueberry compote with a light berry chantilly.',
    tags: ['Real Fruit', 'Wild Berries', 'Spring Bloom'],
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 4,
    slug: 'pineapple-mango',
    name: 'Pineapple / Mango',
    price: 700,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Tropical Fresh',
    desc: 'Refreshing tropical sponge layered with juicy pineapple cubes, seasonal mango nectar, and velvety dairy cream.',
    tags: ['Tropical Treat', 'Juicy Fruits', 'Refreshing'],
    image: 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 5,
    slug: 'white-forest',
    name: 'White Forest',
    price: 700,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'White Chocolate',
    desc: 'Tender vanilla sponge enveloped in snow-white chocolate ribbons, centered with whole cherries and silk whipped cream.',
    tags: ['White Ganache', 'Whole Cherries', 'Celebration'],
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 6,
    slug: 'choco-vanilla',
    name: 'Choco Vanilla',
    price: 750,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Harmony Dual',
    desc: 'The best of both worlds: alternating layers of dark cocoa sponge and fragrant vanilla cream with a glossy chocolate drip.',
    tags: ['Two-in-One', 'Cocoa Fudge', 'Family Favorite'],
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 7,
    slug: 'choco-mocca',
    name: 'Choco Mocca',
    price: 800,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Barista Choice',
    desc: 'Dark chocolate sponge infused with fresh roasted espresso coffee liqueur syrup and silky mocha buttercream.',
    tags: ['Roasted Espresso', 'Mocha Ganache', 'Aromatic'],
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 8,
    slug: 'chocolate-chip-cake',
    name: 'Chocolate Chip Cake',
    price: 800,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Belgian Choc',
    desc: 'Moist Dutch-process cocoa sponge generously studded with dark chocolate morsels that melt warmly with every forkful.',
    tags: ['Choco Drops', 'Crunch & Melt', 'Kids Favorite'],
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 9,
    slug: 'butterscotch',
    name: 'Butterscotch',
    price: 800,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Caramel Crunch',
    desc: 'Golden caramel sponge filled with buttery homemade cashew praline crunch and golden butterscotch glaze.',
    tags: ['Nutty Praline', 'Rich Butterscotch', 'Crunchy'],
    image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 10,
    slug: 'chocolate',
    name: 'Chocolate Truffle Fudge',
    price: 900,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Pure Chocolate',
    desc: 'Deep dark chocolate indulgence made with pure cocoa, smooth chocolate buttercream, and a glossy cocoa mirror glaze.',
    tags: ['54% Dark Cocoa', 'Fudge Glaze', 'Decadent'],
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 11,
    slug: 'cassatto-cake',
    name: 'Cassatto Cake',
    price: 900,
    cat: 'special',
    categoryLabel: "Chef's Specials",
    badge: 'Heritage Recipe',
    desc: 'A nostalgic multi-layered celebration sponge studded with candied fruit peel, roasted pistachios, and scented orange syrup.',
    tags: ['Candied Citrus', 'Roasted Nuts', 'Traditional'],
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 12,
    slug: 'oreo-chocolate',
    name: 'Oreo Chocolate',
    price: 900,
    cat: 'popular',
    categoryLabel: 'Popular Sponges',
    badge: 'Cookies & Cream',
    desc: 'Silky cocoa sponge packed with generous mounds of crunchy crushed Oreo biscuit cream and crowned with mini Oreos.',
    tags: ['Oreo Crunch', 'Cookies & Cream', 'Bestseller'],
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 13,
    slug: 'no-bake-cake',
    name: 'No-Bake Chilled Cake',
    price: 1000,
    cat: 'cheesecake',
    categoryLabel: 'Cheesecakes',
    badge: 'Chilled Mousse',
    desc: 'Delicately set chilled cheese & mousse cake resting on a golden butter cookie crust with a jewel-toned fruit glaze.',
    tags: ['No-Bake Mousse', 'Chilled Velvet', 'Light Finish'],
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb round',
    eggless: true,
  },
  {
    id: 14,
    slug: 'red-velvet',
    name: 'Red Velvet',
    price: 1200,
    cat: 'special',
    categoryLabel: "Chef's Specials",
    badge: 'Signature Red',
    desc: 'Luxurious ruby cocoa velvet sponge paired with generous layers of tangy Philadelphia-style cream cheese frosting.',
    tags: ['Cream Cheese', 'Ruby Velvet', 'Anniversary Top'],
    image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 15,
    slug: 'khuwa-cake',
    name: 'Khuwa Cake',
    nepaliSubtitle: 'खुवा केक • Authentic Himalayan Specialty',
    price: 1400,
    cat: 'special',
    categoryLabel: "Chef's Specials",
    badge: 'Nepali Heritage',
    desc: 'Jiri Bakes pride! Hand-churned mountain khuwa simmered into a tender organic sponge with green cardamom and saffron pistachio slivers.',
    tags: ['Himalayan Khuwa', 'Nepali Fusion', 'Must Try'],
    image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 16,
    slug: 'choco-truffle',
    name: 'Choco Truffle',
    price: 1400,
    cat: 'special',
    categoryLabel: "Chef's Specials",
    badge: 'Dark Ganache',
    desc: 'The pinnacle of chocolate mastery: 65% single-origin dark cocoa truffle ganache folded over dense chocolate sponge.',
    tags: ['French Ganache', 'Truffle Melt', 'Ultra Rich'],
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    weight: '1 lb standard',
    eggless: true,
  },
  {
    id: 17,
    slug: 'ny-cheese-cake',
    name: 'NY Cheese Cake',
    price: 1800,
    cat: 'cheesecake',
    categoryLabel: 'Cheesecakes',
    badge: 'New York Style',
    desc: 'Classic dense and ultra-creamy baked New York cheesecake infused with citrus zest on a spiced whole wheat graham crust.',
    tags: ['Baked Classic', 'Cream Cheese', 'Gourmet'],
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600&auto=format&fit=crop&q=80',
    weight: '1.2 lbs whole',
    eggless: false,
  },
  {
    id: 18,
    slug: 'basque-burnt-cheesecake',
    name: 'Basque Burnt Cheesecake',
    price: 2500,
    cat: 'cheesecake',
    categoryLabel: 'Cheesecakes',
    badge: 'Master Baker Special',
    desc: 'The viral San Sebastián icon! High-heat caramelized blistered mahogany crust revealing a warm, molten custard center.',
    tags: ['Molten Center', 'Caramelized Top', 'Artisan Icon'],
    image: 'https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600&auto=format&fit=crop&q=80',
    weight: '1.5 lbs whole',
    eggless: false,
  },
];

export default function MenuPage() {
  const { theme } = useTheme();
  const { addItem, items: cartItems, updateQty, openCart } = useCart();
  const { showToast } = useToast();

  const [items, setItems] = useState<CakeMenuItem[]>(CAKE_MENU_ITEMS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'popular' | 'cheesecake' | 'special'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'paper' | 'grid'>('paper');

  const isNight = theme === 'night';

  useEffect(() => {
    fetch('/api/menu-items')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: CakeMenuItem[] = data.data.map((c: any, index: number) => ({
            id: c.id || index + 1,
            slug: (c.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            name: c.name,
            nepaliSubtitle: c.nepali_subtitle || undefined,
            price: Number(c.price),
            cat: c.cat || 'popular',
            categoryLabel:
              c.cat === 'cheesecake'
                ? 'Cheesecakes'
                : c.cat === 'special'
                ? "Chef's Specials"
                : 'Popular Sponges',
            badge: c.badge || undefined,
            desc: c.desc || '',
            tags: Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : ['Handcrafted', 'Fresh'],
            image: c.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&fit=crop',
            weight: c.weight || '1 lb standard',
            eggless: c.eggless !== undefined ? Boolean(c.eggless) : true,
            available: c.available !== false,
          }));
          setItems(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.cat === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      popular: items.filter((i) => i.cat === 'popular').length,
      cheesecake: items.filter((i) => i.cat === 'cheesecake').length,
      special: items.filter((i) => i.cat === 'special').length,
    };
  }, [items]);

  // Check how many of each item are currently in cart
  const getItemCartQty = (cakeName: string) => {
    const found = cartItems.find((ci) => ci.name === cakeName);
    return found ? found.qty : 0;
  };

  const handleAddToCart = (item: CakeMenuItem) => {
    addItem({
      id: `cake-${item.id}`,
      name: item.name,
      price: item.price,
      img: item.image,
      unit: '/1 lb',
    });
  };

  const handleWhatsAppCustomOrder = () => {
    const text = encodeURIComponent(
      `Hello Jiri Bakes! 🎂 I'm looking at your Cake Menu and would like to order a custom cake:\n\n• Preferred Flavor:\n• Weight (lbs):\n• Message on Cake:\n• Delivery Date:\n\nPlease share details and confirm my order!`
    );
    window.open(`https://wa.me/9779801234567?text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isNight
          ? 'radial-gradient(ellipse at top, #131E38 0%, #09101F 70%)'
          : 'radial-gradient(ellipse at top, #FBF8EE 0%, #F5EEDC 60%, #EFE5CE 100%)',
        color: 'var(--color-text-primary)',
        paddingTop: 'calc(var(--header-height, 72px) + 24px)',
        paddingBottom: '80px',
        transition: 'background 0.4s ease, color 0.4s ease',
      }}
    >
      {/* ─── Main Content Container ─── */}
      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '16px 20px 40px' }} className="menu-main-container">

        {/* ─── Search & Category Filter Header ─── */}
        <div
          style={{
            marginTop: 8,
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Top row: Search input & View Toggle & Bag */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '1 1 280px',
                maxWidth: '420px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.5,
                  fontSize: '0.95rem',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cake flavor (e.g. Khuwa, Truffle, Mango)..."
                style={{
                  width: '100%',
                  padding: '11px 36px 11px 40px',
                  borderRadius: 9999,
                  border: '1.5px solid var(--color-border)',
                  background: isNight ? 'rgba(19, 29, 56, 0.85)' : '#FFFDF5',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.6,
                    fontSize: '0.9rem',
                    color: 'inherit',
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* View Mode Switcher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isNight ? 'rgba(255, 255, 255, 0.06)' : 'rgba(43, 29, 16, 0.06)',
                  padding: 3,
                  borderRadius: 9999,
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => setViewMode('paper')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: viewMode === 'paper' ? (isNight ? '#F5D35C' : 'var(--color-green)') : 'transparent',
                    color: viewMode === 'paper' ? (isNight ? '#09101F' : '#FFFDF5') : 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span>📜</span>
                  <span>Paper</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: viewMode === 'grid' ? (isNight ? '#F5D35C' : 'var(--color-green)') : 'transparent',
                    color: viewMode === 'grid' ? (isNight ? '#09101F' : '#FFFDF5') : 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span>🖼️</span>
                  <span>Cards</span>
                </button>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={openCart}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 9999,
                    background: isNight ? '#F5D35C' : 'var(--color-green)',
                    color: isNight ? '#09101F' : '#FFFDF5',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(40,85,28,0.25)',
                  }}
                >
                  <span>🛍️ Bag</span>
                  <span
                    style={{
                      background: isNight ? '#09101F' : '#FFFDF5',
                      color: isNight ? '#F5D35C' : 'var(--color-green)',
                      padding: '1px 7px',
                      borderRadius: 9999,
                      fontSize: '0.75rem',
                    }}
                  >
                    {cartItems.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}
          >
            {[
              { id: 'all', label: 'All Items', count: counts.all },
              { id: 'popular', label: 'Popular Sponges', count: counts.popular },
              { id: 'cheesecake', label: 'Cheesecakes', count: counts.cheesecake },
              { id: 'special', label: "Chef's Specials", count: counts.special },
            ].map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 9999,
                    border: isSelected
                      ? '1.5px solid transparent'
                      : '1.5px solid var(--color-border)',
                    background: isSelected
                      ? (isNight ? '#F5D35C' : 'var(--color-green)')
                      : (isNight ? 'rgba(19, 29, 56, 0.6)' : '#FFFDF5'),
                    color: isSelected
                      ? (isNight ? '#09101F' : '#FFFDF5')
                      : 'var(--color-text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 3px 10px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      opacity: isSelected ? 0.9 : 0.6,
                      background: isSelected
                        ? (isNight ? 'rgba(9,16,31,0.2)' : 'rgba(255,255,255,0.25)')
                        : 'rgba(0,0,0,0.06)',
                      padding: '1px 6px',
                      borderRadius: 9999,
                    }}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CLASSIC PAPER MENU SHEET VIEW (Reference faithful to menu.html & menu eg.png) ─── */}
        {viewMode === 'paper' ? (
          <div className="paper-menu-card">
            {/* Background Hand-drawn Sketches (Using actual PNG assets matching menu eg.png) */}
            {/* Top-Left: Cake sketch from public/top side cake.png */}
            <div className="paper-sketch paper-sketch-top-left">
              <Image
                src="/top side cake.png"
                alt="Top side birthday cake sketch"
                width={120}
                height={120}
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Top-Right: Pastry cake slice sketch */}
            <div className="paper-sketch paper-sketch-top-right">
              <Image
                src="/pastry svg.png"
                alt="Pastry slice sketch"
                width={185}
                height={145}
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Mid/Bottom-Left: Donut sketch */}
            <div className="paper-sketch paper-sketch-donut">
              <Image
                src="/donought.png"
                alt="Donut sketch"
                width={145}
                height={145}
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Bottom-Right: Stacked cookies sketch */}
            <div className="paper-sketch paper-sketch-cookies">
              <Image
                src="/cookies.png"
                alt="Stacked cookies sketch"
                width={175}
                height={175}
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Menu Header Section (Faithful to menu eg.png) */}
            <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 34px', position: 'relative', zIndex: 2 }}>
              {/* Main Jiri Bakes Logo from public/main-logo.png */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <Image
                  src="/main-logo.png"
                  alt="Jiri Bakes - Simply Organic"
                  width={185}
                  height={120}
                  className="menu-logo-img"
                  style={{
                    objectFit: 'contain',
                    filter: isNight ? 'brightness(1.1) drop-shadow(0 2px 10px rgba(0,0,0,0.5))' : 'none',
                  }}
                  priority
                />
              </div>

              {/* Center Candle Birthday Cake Illustration from public/cake main svg.png */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
                <Image
                  src="/cake main svg.png"
                  alt="Birthday Cake Emblem"
                  width={80}
                  height={86}
                  className="menu-cake-center"
                  style={{
                    objectFit: 'contain',
                    filter: isNight ? 'invert(1) brightness(0.85) sepia(0.6)' : 'none',
                  }}
                />
              </div>

              {/* Thin Divider Line */}
              <div
                style={{
                  borderBottom: isNight ? '1px solid rgba(245, 211, 92, 0.3)' : '1px solid #D5C9B3',
                  width: '55%',
                  margin: '0 auto 16px',
                }}
              />

              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.75rem, 4vw, 2.3rem)',
                  fontWeight: 500,
                  color: isNight ? '#F5D35C' : '#3E342B',
                  letterSpacing: '1px',
                  margin: 0,
                }}
              >
                Cake Menu
              </h1>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: isNight ? 'rgba(255,255,255,0.7)' : 'var(--color-brown)',
                  marginTop: 6,
                }}
              >
                Handcrafted fresh daily • Standard 1 lb & 2 lbs pricing • 100% Pure Organic Ingredients
              </p>
            </div>

            {/* Menu Items List with Dotted Leader Lines */}
            <div
              style={{
                maxWidth: '740px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.7 }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}>🎂</span>
                  <p style={{ fontWeight: 600 }}>No cake flavor matches your search.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    style={{
                      marginTop: 12,
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      padding: '6px 14px',
                      borderRadius: 9999,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      color: 'inherit',
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const cartQty = getItemCartQty(item.name);
                  return (
                    <div
                      key={item.id}
                      className="paper-menu-row"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        transition: 'background 0.2s ease, transform 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 6,
                          width: '100%',
                        }}
                      >
                        {/* Cake Name & Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto', minWidth: 0, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: 'clamp(0.95rem, 2.7vw, 1.15rem)',
                              fontWeight: 600,
                              color: isNight ? '#FFFDF5' : '#2B1D10',
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: item.cat === 'special'
                                  ? (isNight ? 'rgba(232, 123, 50, 0.25)' : '#FCEAD9')
                                  : (isNight ? 'rgba(245, 211, 92, 0.18)' : '#F5EDD5'),
                                color: item.cat === 'special'
                                  ? (isNight ? '#FFA726' : '#C05621')
                                  : (isNight ? '#F5D35C' : '#8A5D18'),
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Classic Dotted Leader Line */}
                        <div
                          className="paper-dotted-line"
                          style={{
                            flexGrow: 1,
                            borderBottom: isNight
                              ? '2px dotted rgba(245, 211, 92, 0.3)'
                              : '2px dotted rgba(90, 75, 60, 0.35)',
                            margin: '0 6px',
                            height: '1em',
                            minWidth: 8,
                          }}
                        />

                        {/* Price and Add Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 'clamp(0.95rem, 2.5vw, 1.18rem)',
                              fontWeight: 700,
                              color: isNight ? '#F5D35C' : 'var(--color-brown-deep)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            NPR {item.price}
                          </span>

                          {item.available === false ? (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: isNight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                                color: isNight ? '#F87171' : '#DC2626',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                              }}
                            >
                              Sold Out
                            </span>
                          ) : cartQty > 0 ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: isNight ? 'rgba(245, 211, 92, 0.2)' : '#E8F5E9',
                                border: '1px solid var(--color-green)',
                                borderRadius: 8,
                                padding: '2px 6px',
                              }}
                            >
                              <button
                                onClick={() => updateQty(`cake-${item.id}`, -1)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  padding: '0 4px',
                                  color: 'inherit',
                                }}
                                title="Reduce quantity"
                              >
                                -
                              </button>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  minWidth: 16,
                                  textAlign: 'center',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {cartQty}
                              </span>
                              <button
                                onClick={() => handleAddToCart(item)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  padding: '0 4px',
                                  color: 'inherit',
                                }}
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 8,
                                border: 'none',
                                background: isNight ? '#F5D35C' : 'var(--color-green)',
                                color: isNight ? '#09101F' : '#FFFDF5',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                transition: 'transform 0.15s ease, opacity 0.15s ease',
                              }}
                            >
                              <span>+</span>
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Item Description line */}
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: isNight ? 'rgba(255, 255, 255, 0.65)' : 'var(--color-brown)',
                          marginTop: 3,
                          paddingLeft: 2,
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Card Notes */}
            <div
              style={{
                marginTop: 36,
                paddingTop: 20,
                borderTop: '1px dashed var(--color-border)',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: isNight ? 'rgba(255,255,255,0.65)' : 'var(--color-brown)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              🌱 <em>Eggless variation available for all sponges upon request. Custom cake messages included free of charge!</em>
            </div>
          </div>
        ) : (
          /* ─── VISUAL SHOWCASE GRID VIEW ─── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {filteredItems.map((item) => {
              const cartQty = getItemCartQty(item.name);
              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 18,
                    background: isNight ? 'rgba(19, 29, 56, 0.9)' : '#FFFDF5',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isNight
                      ? '0 10px 30px rgba(0,0,0,0.4)'
                      : '0 8px 24px rgba(80, 60, 40, 0.08)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                >
                  {/* Cake Image Container */}
                  <div style={{ position: 'relative', width: '100%', height: 180 }}>
                    <Image
                      src={item.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&fit=crop'}
                      alt={item.name}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 320px"
                      style={{ objectFit: 'cover' }}
                    />
                    {item.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: isNight ? '#F5D35C' : 'var(--color-green)',
                          color: isNight ? '#09101F' : '#FFFDF5',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 9999,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFDF5',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {item.weight}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <h3
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          color: isNight ? '#FFFDF5' : 'var(--color-brown-deep)',
                          margin: 0,
                        }}
                      >
                        {item.name}
                      </h3>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: isNight ? '#F5D35C' : 'var(--color-green)',
                        }}
                      >
                        NPR {item.price}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: isNight ? 'rgba(255,255,255,0.7)' : 'var(--color-brown)',
                        lineHeight: 1.45,
                        marginBottom: 12,
                        flexGrow: 1,
                      }}
                    >
                      {item.desc}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(43,29,16,0.05)',
                            color: isNight ? 'rgba(255,255,255,0.8)' : 'var(--color-brown)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.74rem', opacity: 0.7 }}>
                        {item.eggless ? '🥚 Egg & Eggless' : '🥚 Fresh Egg Base'}
                      </span>

                      {item.available === false ? (
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: 9999,
                            background: isNight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                            color: isNight ? '#F87171' : '#DC2626',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Sold Out
                        </span>
                      ) : cartQty > 0 ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: isNight ? 'rgba(245, 211, 92, 0.2)' : '#E8F5E9',
                            border: '1.5px solid var(--color-green)',
                            borderRadius: 9999,
                            padding: '3px 10px',
                          }}
                        >
                          <button
                            onClick={() => updateQty(`cake-${item.id}`, -1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: 'inherit',
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                            {cartQty}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: 'inherit',
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 9999,
                            border: 'none',
                            background: isNight ? '#F5D35C' : 'var(--color-green)',
                            color: isNight ? '#09101F' : '#FFFDF5',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                        >
                          <span>+ Add to Bag</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Custom Tier & WhatsApp Order Banner ─── */}
        <div
          style={{
            marginTop: 40,
            padding: '28px 24px',
            borderRadius: 20,
            background: isNight
              ? 'linear-gradient(135deg, rgba(245, 211, 92, 0.12) 0%, rgba(19, 29, 56, 0.95) 100%)'
              : 'linear-gradient(135deg, #FFF8E7 0%, #F5EDD5 100%)',
            border: '1.5px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ maxWidth: '580px' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 6 }}>🎂✨</span>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.45rem',
                fontWeight: 700,
                color: isNight ? '#F5D35C' : 'var(--color-brown-deep)',
                marginBottom: 6,
              }}
            >
              Need a Custom Celebration or Wedding Cake?
            </h3>
            <p
              style={{
                fontSize: '0.86rem',
                color: isNight ? 'rgba(255,255,255,0.75)' : 'var(--color-brown)',
                lineHeight: 1.5,
              }}
            >
              Whether you want a two-tier floral theme, custom photo print, fondant figurines, or unique flavor blends — our master baker crafts your dream cake fresh in Lokanthali!
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleWhatsAppCustomOrder}
              style={{
                padding: '12px 24px',
                borderRadius: 9999,
                border: 'none',
                background: '#25D366',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.54 1.761.821 2.796.821h.005c3.18 0 5.767-2.587 5.767-5.766.001-3.182-2.585-5.808-5.772-5.808zm7.39 5.768c0 4.076-3.315 7.391-7.392 7.391-1.239 0-2.435-.316-3.504-.912l-4.525 1.187 1.208-4.409c-.663-1.129-1.021-2.434-1.021-3.257 0-4.076 3.316-7.391 7.393-7.391 4.077 0 7.391 3.315 7.391 7.391zm-4.321 2.052c-.179-.09-1.059-.523-1.224-.583-.164-.06-.284-.09-.404.09-.12.18-.464.583-.568.703-.104.12-.208.135-.388.045-.179-.09-.757-.279-1.442-.89-.533-.476-.893-1.064-.998-1.244-.105-.18-.011-.277.079-.366.081-.081.179-.21.269-.315.09-.105.12-.18.179-.3.06-.12.03-.225-.015-.315-.045-.09-.404-.973-.554-1.333-.146-.351-.295-.303-.404-.309-.104-.005-.224-.007-.344-.007-.12 0-.314.045-.479.225-.165.18-.629.615-.629 1.5 0 .885.644 1.74 1.734 1.83.09.015.18.015.269.015 1.004 0 2.22-.614 2.504-1.064.285-.45.285-.84.24-1.065-.045-.225-.165-.345-.344-.435z" />
              </svg>
              <span>Chat & Order on WhatsApp</span>
            </button>

            <button
              onClick={openCart}
              style={{
                padding: '12px 22px',
                borderRadius: 9999,
                border: '1.5px solid var(--color-border)',
                background: isNight ? 'rgba(255,255,255,0.06)' : '#FFFDF5',
                color: 'var(--color-text-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View My Order Bag ({cartItems.length})
            </button>
          </div>
        </div>

        {/* ─── Store Information & Promise ─── */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: 14,
              background: isNight ? 'rgba(255,255,255,0.03)' : '#FFFDF5',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🌾</div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 4px' }}>100% Organic Flours</h4>
            <p style={{ fontSize: '0.76rem', opacity: 0.75, margin: 0 }}>Unbleached, natural heritage grains and pure Himalayan dairy.</p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 14,
              background: isNight ? 'rgba(255,255,255,0.03)' : '#FFFDF5',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>⏰</div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 4px' }}>Freshly Baked on Order</h4>
            <p style={{ fontSize: '0.76rem', opacity: 0.75, margin: 0 }}>No stale shelves — every cake is prepared just hours before your event.</p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 14,
              background: isNight ? 'rgba(255,255,255,0.03)' : '#FFFDF5',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🚚</div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 4px' }}>Store Pickup & Delivery</h4>
            <p style={{ fontSize: '0.76rem', opacity: 0.75, margin: 0 }}>Lokanthali bakery counter pickup or prompt Kathmandu Valley delivery.</p>
          </div>
        </div>

      </main>

      {/* Floating sketch animation, paper sheet styling, and responsive mobile layout */}
      <style>{`
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .paper-menu-card {
          position: relative;
          border-radius: 24px;
          background-color: #FDFBF7;
          background-image: radial-gradient(rgba(140, 115, 80, 0.12) 1px, transparent 1px);
          background-size: 24px 24px;
          box-shadow: 0 20px 50px rgba(80, 60, 40, 0.12), 0 0 0 1px #E8DFC8;
          padding: 40px 24px 48px;
          overflow: hidden;
          transition: all 0.4s ease;
        }

        [data-theme="night"] .paper-menu-card {
          background-color: rgba(19, 29, 56, 0.9);
          background-image: radial-gradient(rgba(245, 211, 92, 0.08) 1px, transparent 1px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 211, 92, 0.2);
        }

        .paper-sketch {
          position: absolute;
          pointer-events: none;
          user-select: none;
          animation: subtleFloat 6s ease-in-out infinite;
          filter: contrast(1.2);
        }

        [data-theme="night"] .paper-sketch {
          filter: brightness(0.9) drop-shadow(0 0 6px rgba(245, 211, 92, 0.25));
        }

        .paper-sketch-top-left {
          top: 14px;
          left: 14px;
          width: 120px;
          height: 120px;
          opacity: 0.75;
        }
        [data-theme="night"] .paper-sketch-top-left { opacity: 0.35; }

        .paper-sketch-top-right {
          top: 24px;
          right: 20px;
          width: 185px;
          height: 145px;
          opacity: 0.7;
        }
        [data-theme="night"] .paper-sketch-top-right { opacity: 0.35; }

        .paper-sketch-donut {
          top: 48%;
          left: 12px;
          width: 145px;
          height: 145px;
          opacity: 0.65;
        }
        [data-theme="night"] .paper-sketch-donut { opacity: 0.3; }

        .paper-sketch-cookies {
          bottom: 110px;
          right: 18px;
          width: 175px;
          height: 175px;
          opacity: 0.7;
        }
        [data-theme="night"] .paper-sketch-cookies { opacity: 0.35; }

        .paper-menu-row:hover {
          background: rgba(74, 55, 36, 0.05) !important;
          transform: translateX(3px);
        }

        [data-theme="night"] .paper-menu-row:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        @media (max-width: 640px) {
          .menu-main-container {
            padding: 8px 10px 40px !important;
          }

          /* Paper Card padding on mobile */
          .paper-menu-card {
            padding: 24px 10px 30px !important;
            border-radius: 16px !important;
          }

          /* Floating sketches proportional sizing on mobile */
          .paper-sketch-top-left {
            width: 70px !important;
            height: 70px !important;
            top: 6px !important;
            left: 6px !important;
            opacity: 0.45 !important;
          }
          [data-theme="night"] .paper-sketch-top-left { opacity: 0.25 !important; }

          .paper-sketch-top-right {
            width: 90px !important;
            height: 72px !important;
            top: 8px !important;
            right: 6px !important;
            opacity: 0.5 !important;
          }
          [data-theme="night"] .paper-sketch-top-right { opacity: 0.28 !important; }

          .paper-sketch-donut {
            width: 65px !important;
            height: 65px !important;
            left: 2px !important;
            top: 48% !important;
            opacity: 0.42 !important;
          }
          [data-theme="night"] .paper-sketch-donut { opacity: 0.22 !important; }

          .paper-sketch-cookies {
            width: 78px !important;
            height: 78px !important;
            bottom: 70px !important;
            right: 6px !important;
            opacity: 0.5 !important;
          }
          [data-theme="night"] .paper-sketch-cookies { opacity: 0.28 !important; }

          /* Compact item row on mobile */
          .paper-menu-row {
            padding: 8px 4px !important;
          }

          .paper-dotted-line {
            margin: 0 4px !important;
            min-width: 6px !important;
          }

          /* Responsive Logo and Center Cake */
          .menu-logo-img {
            width: 145px !important;
            height: 95px !important;
          }

          .menu-cake-center {
            width: 62px !important;
            height: 66px !important;
          }
        }

        @media (max-width: 400px) {
          .paper-dotted-line {
            display: none !important;
          }
          .paper-menu-card {
            padding: 20px 8px 26px !important;
          }
        }
      `}</style>
    </div>
  );
}
