'use client';

import { useEffect, useRef, useState } from 'react';
import type { BakeOfWeek, MenuItem, Testimonial } from '@/types';
import Button from '@/components/buttons/Button';
import { useCart } from '@/components/layout/AppShell';
import { useWishlist } from '@/components/layout/WishlistContext';
import HeroSection from '@/components/layout/HeroSection';
import LoadingScreen from '@/components/layout/LoadingScreen';
import QuickViewModal from '@/components/layout/QuickViewModal';

const fallbackProducts: MenuItem[] = [
  { id: 'c1', name: 'Sunflower Cream Cake', description: 'A light layered sponge kissed with organic cream and sunflower honey, decorated with seasonal blooms.', price: 1800, unit: '/whole', category: 'cake', badge: 'Fresh Today', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=500&fit=crop'], rating: 5 },
  { id: 'c2', name: 'Chocolate Hazelnut Tart', description: 'Rich dark chocolate ganache poured into a hand-pressed pastry shell, crowned with roasted hazelnuts.', price: 950, unit: '/piece', category: 'pastry', badge: 'Organic', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=500&fit=crop'], rating: 5 },
  { id: 'c3', name: 'Heritage Sourdough Loaf', description: '72-hour cold-fermented sourdough made with heritage wheat and a century-old starter culture.', price: 650, unit: '/loaf', category: 'bread', badge: 'Organic', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&h=500&fit=crop'], rating: 5 },
  { id: 'c4', name: 'Butter Croissant', description: 'Flaky golden layers of French-style buttery pastry, hand-laminated and baked fresh each morning.', price: 180, unit: '/piece', category: 'pastry', badge: 'Fresh Today', image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1623334044303-241021148842?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=600&h=500&fit=crop'], rating: 5 },
  { id: 'c5', name: 'Strawberry Tart', description: 'Crisp pastry shell filled with vanilla custard and topped with fresh Himalayan strawberries.', price: 650, unit: '/piece', category: 'pastry', badge: 'Seasonal', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=500&fit=crop'], rating: 4 },
  { id: 'c6', name: 'Cinnamon Roll', description: 'Soft dough rolled with Ceylon cinnamon and topped with tangy cream cheese glaze.', price: 220, unit: '/piece', category: 'pastry', badge: 'Popular', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&h=500&fit=crop'], rating: 5 },
  { id: 'c7', name: 'Rustic Country Loaf', description: 'Stone-ground whole wheat with a deep caramelized crust and nutty interior crumb.', price: 480, unit: '/loaf', category: 'bread', badge: 'Organic', image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop'], rating: 5 },
  { id: 'c8', name: 'Chocolate Hazelnut Cake', description: 'Dark Belgian chocolate layered with roasted hazelnut praline and velvety ganache.', price: 2200, unit: '/whole', category: 'cake', badge: 'Best Seller', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&h=500&fit=crop', 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=600&h=500&fit=crop'], rating: 5 },
];

const fallbackTestimonials: Testimonial[] = [
  { name: 'Anita Shrestha', initials: 'AS', role: 'Regular Customer', text: 'The sourdough here is on another level. I drive 30 minutes just for their bread. The crust, the flavor, the texture — absolute perfection every single time.', rating: 5 },
  { name: 'Rajesh Patel', initials: 'RP', role: 'Birthday Order', text: 'Ordered a custom birthday cake and it was stunning. Not only did it look beautiful, but every slice was moist and delicious. Everyone at the party was amazed.', rating: 5 },
  { name: 'Sunita Gurung', initials: 'SG', role: 'Food Blogger', text: 'Their croissants remind me of the ones I had in Paris. Flaky, buttery, and absolutely heavenly. Jiri Bakes has become my weekend ritual.', rating: 5 },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function useMultiReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function HomePage() {
  useMultiReveal();
  const [collectionItems, setCollectionItems] = useState<MenuItem[]>(fallbackProducts);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [booting, setBooting] = useState(true);
  const [hidingLoader, setHidingLoader] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<MenuItem | null>(null);
  const [bakeOfWeek, setBakeOfWeek] = useState<BakeOfWeek | null>(null);

  useEffect(() => {
    const productsP = fetch('/api/products').then((r) => r.json()).then((d) => {
      if (d.data && d.data.length > 0) setCollectionItems(d.data);
    }).catch(() => { });
    const testimonialsP = fetch('/api/testimonials').then((r) => r.json()).then((d) => {
      if (d.data) {
        const approved = d.data.filter((t: Testimonial) => t.approved !== false);
        if (approved.length > 0) setTestimonials(approved);
      }
    }).catch(() => { });
    const bakeOfWeekP = fetch('/api/bake-of-week').then((r) => r.json()).then((d) => {
      const active = (d.data || []).find((b: BakeOfWeek) => b.active);
      if (active) setBakeOfWeek(active);
    }).catch(() => { });
    // keep the loader visible long enough for the intro animation to play
    const minDelay = new Promise((res) => setTimeout(res, 1500));
    Promise.all([productsP, testimonialsP, bakeOfWeekP, minDelay]).finally(() => {
      setHidingLoader(true);
      setTimeout(() => setBooting(false), 500);
    });
  }, []);

  const heroBakeOfWeek: MenuItem | null = bakeOfWeek
    ? {
        id: bakeOfWeek.product_id || bakeOfWeek.id,
        name: bakeOfWeek.title,
        description: bakeOfWeek.description || '',
        price: bakeOfWeek.price,
        unit: bakeOfWeek.unit,
        category: 'cake',
        badge: bakeOfWeek.subtitle || 'Bake of the Week',
        image: bakeOfWeek.image,
        images: bakeOfWeek.image ? [bakeOfWeek.image] : undefined,
        rating: 5,
      }
    : null;

  // Full product for the hero quick-view modal: prefer the real product
  // behind this week's pick (gallery, rating, category), so the modal
  // opens with the same rich details as collection quick views.
  const heroQuickViewItem: MenuItem | undefined =
    (bakeOfWeek?.product_id
      ? collectionItems.find((p) => String(p.id) === String(bakeOfWeek.product_id))
      : undefined) ??
    heroBakeOfWeek ??
    collectionItems.find((p) => p.is_bake_of_week) ??
    collectionItems.find((p) => p.featured) ??
    collectionItems[0];

  return (
    <>
      {booting && <LoadingScreen hiding={hidingLoader} />}
      <HeroSection
        bakeOfTheWeek={heroBakeOfWeek || collectionItems.find((p) => p.is_bake_of_week) || collectionItems.find((p) => p.featured) || collectionItems[0]}
        onQuickView={heroQuickViewItem ? () => setQuickViewItem(heroQuickViewItem) : undefined}
      />
      <FeaturedCakeSection featured={collectionItems.find((p) => p.featured) || collectionItems[0]} />
      <CollectionSection items={collectionItems} quickViewItem={quickViewItem} onQuickView={setQuickViewItem} onCloseQuickView={() => setQuickViewItem(null)} />
      <OurStorySection />
      <WeCareSection />
      <TestimonialsSection items={testimonials} />
      <VisitUsSection />
      <FooterSection />
    </>
  );
}

function FeaturedCakeSection({ featured }: { featured: MenuItem }) {
  const ref = useReveal();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [ordered, setOrdered] = useState(false);

  const isFav = featured ? isInWishlist(featured.id) : false;

  const handleOrder = () => {
    if (!featured) return;
    addItem({
      id: featured.id,
      name: featured.name,
      price: featured.price,
      img: featured.image || '',
      unit: featured.unit,
    });
    setOrdered(true);
    setTimeout(() => setOrdered(false), 1500);
  };

  return (
    <section
      id="featured"
      ref={ref}
      className="reveal"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(165deg, #1e3a12 0%, #234018 30%, #1a3210 60%, #1c3714 100%)',
        padding: 'clamp(64px, 10vw, 110px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* â”€â”€â”€ Background Decoration System â”€â”€â”€ */}
      <div style={{ position: 'absolute', top: '5%', right: '8%', width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(245, 211, 92, 0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', right: '12%', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255, 253, 245, 0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '8%', left: '4%', width: 350, height: 350, borderRadius: '50%', border: '1px solid rgba(245, 211, 92, 0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '20%', width: 160, height: 160, borderRadius: '48% 52% 50% 50%', border: '1px solid rgba(255, 253, 245, 0.03)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '25%', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(245, 211, 92, 0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 211, 92, 0.03) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '0', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 253, 245, 0.02) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {/* â”€â”€â”€ Two-Column Layout â”€â”€â”€ */}
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        gap: 'clamp(40px, 6vw, 96px)',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }} className="featured-grid">

        {/* â”€â”€â”€ LEFT: Product Image â”€â”€â”€ */}
        <div className="featured-image-col" style={{ position: 'relative' }}>

          {/* Sunflower/radiating decoration behind image â€” upper-left */}
          <div style={{
            position: 'absolute', top: '-4%', left: '-6%', width: 140, height: 140,
            zIndex: 0, pointerEvents: 'none',
          }}>
            <svg viewBox="0 0 140 140" fill="none" style={{ width: '100%', height: '100%', opacity: 0.45 }}>
              {[0, 28, 56, 84, 112, 140, 168, 196, 224, 252, 280, 308, 336].map((angle) => (
                <line
                  key={angle}
                  x1="70" y1="70"
                  x2={70 + 56 * Math.cos((angle * Math.PI) / 180)}
                  y2={70 + 56 * Math.sin((angle * Math.PI) / 180)}
                  stroke="#C4A83A"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              ))}
              <circle cx="70" cy="70" r="18" stroke="#C4A83A" strokeWidth="0.8" fill="none" opacity="0.35" />
              <circle cx="70" cy="70" r="8" fill="#C4A83A" opacity="0.15" />
            </svg>
          </div>

          {/* Main product image card */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '88%', marginLeft: '8%',
            aspectRatio: '3/4.2',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '2px solid rgba(196, 168, 58, 0.3)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)',
            transform: 'rotate(-0.5deg)',
          }}>
            <img
              src={featured.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=650&h=880&fit=crop'}
              alt={featured.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Floating yellow badge â€” bottom-right edge */}
          <div style={{
            position: 'absolute', bottom: '6%', right: '0%',
            background: 'linear-gradient(135deg, #F5D35C 0%, #E8C845 100%)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 18px',
            zIndex: 3,
            transform: 'rotate(3deg)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            maxWidth: 170,
          }}>
            <div style={{
              fontSize: '0.5rem', fontWeight: 700, letterSpacing: '2.5px',
              textTransform: 'uppercase' as const, color: '#1e3a12',
              lineHeight: 1.3,
            }}>LIMITED· FRESH TODAY</div>
          </div>
        </div>

        {/* â”€â”€â”€ RIGHT: Product Content â”€â”€â”€ */}
        <div className="featured-content-col">

          {/* Category badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px',
            background: 'transparent',
            border: '1px solid rgba(196, 168, 58, 0.4)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 28,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5D35C" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, color: '#F5D35C',
              letterSpacing: '2.5px', textTransform: 'uppercase' as const,
            }}>BAKE OF THE WEEK</span>
          </div>

          {/* Product title */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
            fontWeight: 400,
            color: 'var(--color-cream)',
            lineHeight: 1.08,
            marginBottom: 12,
            letterSpacing: '-0.5px',
            maxWidth: 480,
          }}>
            {featured.name || 'Featured Product'}
          </h2>

          {/* Hand-drawn underline */}
          <div style={{ position: 'relative', height: 12, marginBottom: 28, width: 140 }}>
            <svg viewBox="0 0 140 12" fill="none" style={{ width: '100%', height: '100%' }}>
              <path
                d="M2 8 C 20 3, 40 2, 60 5 C 80 8, 100 3, 120 5 C 130 6, 136 4, 138 6"
                stroke="#F5D35C"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                style={{
                  strokeDasharray: 200,
                  strokeDashoffset: 200,
                  animation: 'drawLine 1.5s ease forwards 0.4s',
                }}
              />
            </svg>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(0.92rem, 1.3vw, 1.02rem)',
            color: 'rgba(255, 253, 245, 0.7)',
            maxWidth: 440,
            lineHeight: 1.8,
            marginBottom: 12,
            fontWeight: 400,
          }}>
            {featured.description || 'A light layered sponge kissed with organic cream and sunflower honey, decorated with seasonal blooms. Each slice is a delicate balance of flavour and artistry.'}
          </p>

          {/* Ingredients / secondary detail */}
          <p style={{
            fontSize: '0.78rem',
            color: 'rgba(255, 253, 245, 0.45)',
            lineHeight: 1.7,
            marginBottom: 36,
            letterSpacing: '0.2px',
            maxWidth: 400,
          }}>
            Organic flour, free-range eggs, sunflower honey, fresh cream, seasonal flowers
          </p>

          {/* Price + CTA row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              color: '#F5D35C',
              fontWeight: 400,
              lineHeight: 1,
            }}>NPR {featured.price.toLocaleString()}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleOrder}
                style={{
                  padding: '14px 36px',
                  borderRadius: 'var(--radius-full)',
                  background: ordered ? 'var(--color-green)' : 'linear-gradient(135deg, #F5D35C 0%, #E8C845 100%)',
                  color: ordered ? '#FFFDF5' : '#1e3a12',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.3px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 16px rgba(245, 211, 92, 0.2)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(245, 211, 92, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 211, 92, 0.2)'; }}
              >
                {ordered ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12" /></svg> Added to Bag</> : 'Order Now'}
              </button>

              <button
                onClick={() => featured && toggleWishlist({ id: featured.id, name: featured.name, price: featured.price, img: featured.image || '', description: featured.description, category: featured.category })}
                title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isFav ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: `1.5px solid ${isFav ? '#e74c3c' : 'rgba(245, 211, 92, 0.4)'}`,
                  color: isFav ? '#e74c3c' : '#F5D35C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? '#e74c3c' : 'none'} stroke={isFav ? '#e74c3c' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ Responsive â”€â”€â”€ */}
      <style>{`
        @media (max-width: 1024px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
            text-align: center;
          }
          .featured-image-col { max-width: 400px; margin: 0 auto; }
          .featured-content-col { display: flex; flex-direction: column; align-items: center; }
          .featured-content-col > div:last-child { justify-content: center; }
        }
        @media (max-width: 600px) {
          .featured-image-col { max-width: 300px !important; }
          .featured-content-col > div:last-child { flex-direction: column; gap: 16px !important; }
        }
      `}</style>
    </section>
  );
}

const COLLECTION_PAGE_SIZE = 9; // max 9 cards (3 lines of 3) per page

function CollectionSection({ items, quickViewItem, onQuickView, onCloseQuickView }: { items: MenuItem[]; quickViewItem: MenuItem | null; onQuickView: (item: MenuItem) => void; onCloseQuickView: () => void }) {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();

  const filters = ['all', 'cake', 'pastry', 'bread', 'cookie'];
  const filterLabels: Record<string, string> = { all: 'All', cake: 'Cakes', pastry: 'Pastries', bread: 'Breads', cookie: 'Cookies' };
  const filtered = filter === 'all' ? items : items.filter((m) => m.category === filter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / COLLECTION_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * COLLECTION_PAGE_SIZE, safePage * COLLECTION_PAGE_SIZE);

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    // Scroll back to the top of the collection grid on page change
    const el = document.getElementById('collection');
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const pickFilter = (f: string) => {
    setFilter(f);
    setPage(1);
  };

  const handleAdd = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      img: item.image || '',
      unit: item.unit,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section
      id="collection"
      className="section"
      style={{ background: 'var(--color-bg)', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: '8%', right: '4%', width: 280, height: 280,
        borderRadius: '50%', border: '1px solid rgba(245, 211, 92, 0.18)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '12%', left: '3%', width: 180, height: 180,
        borderRadius: '45% 55% 50% 50%', border: '1px solid rgba(40, 85, 28, 0.06)', pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-block', marginBottom: 16 }}>
          <svg width="60" height="12" viewBox="0 0 60 12" fill="none">
            <path d="M2 10 C 15 2, 30 2, 40 6 S 55 10, 58 4" stroke="var(--color-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <h2 className="section-title reveal" style={{ marginBottom: 8 }}>
          The <span style={{ color: 'var(--color-green)' }}>Collection</span>
        </h2>
        <p className="section-subtitle reveal" style={{ maxWidth: 480, margin: '0 auto 52px' }}>
          Each piece baked fresh, displayed gallery-style. Take home a masterpiece.
        </p>
      </div>

      <div className="reveal" style={{
        display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 56, flexWrap: 'wrap',
        position: 'relative', zIndex: 1,
      }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => pickFilter(f)}
            style={{
              padding: '10px 26px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 500,
              letterSpacing: '0.3px',
              fontFamily: 'var(--font-body)',
              background: filter === f ? 'var(--color-green)' : 'transparent',
              color: filter === f ? 'var(--color-cream)' : 'var(--color-text-tertiary)',
              border: `1.5px solid ${filter === f ? 'var(--color-green)' : '#D8C9A4'}`,
              transition: 'all 0.3s var(--motion-ease)',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (filter !== f) {
                e.currentTarget.style.borderColor = 'var(--color-green)';
                e.currentTarget.style.color = 'var(--color-green)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(40, 85, 28, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f) {
                e.currentTarget.style.borderColor = '#D8C9A4';
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        maxWidth: 1140, margin: '0 auto', position: 'relative', zIndex: 1,
      }} className="collection-grid">
        {paged.map((item) => (
          <CollectionCard key={item.id} item={item} added={addedId === item.id} onAdd={handleAdd} onQuickView={onQuickView} />
        ))}
      </div>

      {/* ── Pagination (max 9 cards per page) ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginTop: 44, flexWrap: 'wrap', position: 'relative', zIndex: 1,
        }}>
          <button
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Previous page"
            style={{
              minWidth: 44, height: 44, padding: '0 16px', borderRadius: 9999,
              fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: safePage === 1 ? 'not-allowed' : 'pointer',
              border: '1.5px solid var(--color-border)',
              background: 'transparent',
              color: safePage === 1 ? 'var(--color-text-tertiary)' : 'var(--color-brown-deep)',
              opacity: safePage === 1 ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === safePage ? 'page' : undefined}
              style={{
                minWidth: 44, height: 44, borderRadius: '50%',
                fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                border: `1.5px solid ${p === safePage ? 'var(--color-green)' : 'var(--color-border)'}`,
                background: p === safePage ? 'var(--color-green)' : 'transparent',
                color: p === safePage ? '#FFFDF5' : 'var(--color-brown-deep)',
                boxShadow: p === safePage ? '0 4px 14px rgba(40,85,28,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage === totalPages}
            aria-label="Next page"
            style={{
              minWidth: 44, height: 44, padding: '0 16px', borderRadius: 9999,
              fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
              border: '1.5px solid var(--color-border)',
              background: 'transparent',
              color: safePage === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-brown-deep)',
              opacity: safePage === totalPages ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            Next →
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--color-text-tertiary)', marginTop: totalPages > 1 ? 14 : 28 }}>
          Showing {(safePage - 1) * COLLECTION_PAGE_SIZE + 1}–{Math.min(safePage * COLLECTION_PAGE_SIZE, filtered.length)} of {filtered.length} treats
        </p>
      )}

      <QuickViewModal key={quickViewItem?.id ?? 'none'} item={quickViewItem} onClose={onCloseQuickView} />

      <style>{`
        @keyframes fadeCard {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .collection-card { animation: fadeCard 0.4s ease forwards; }
        @media (max-width: 900px) {
          .collection-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .collection-grid { grid-template-columns: 1fr !important; max-width: 400px !important; }
        }
      `}</style>
    </section>
  );
}

function CollectionCard({ item, added, onAdd, onQuickView }: { item: MenuItem; added: boolean; onAdd: (item: MenuItem) => void; onQuickView: (item: MenuItem) => void }) {
  const [hovered, setHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFav = isInWishlist(item.id);

  return (
    <div
      className="collection-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-card-bg, var(--color-cream))',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        boxShadow: hovered ? '0 12px 32px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img
          src={item.images?.[0] || item.image}
          alt={item.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
          }}
        />

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist({
              id: item.id,
              name: item.name,
              price: item.price,
              img: item.image || '',
              description: item.description,
              category: item.category,
            });
          }}
          title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isFav ? '#FFFDF5' : 'rgba(255, 253, 245, 0.9)',
            border: isFav ? '1.5px solid #e74c3c' : '1px solid rgba(245, 211, 92, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
            zIndex: 6,
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            color: isFav ? '#e74c3c' : '#8A7654',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#e74c3c' : 'none'} stroke={isFav ? '#e74c3c' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Badge */}
        {item.badge && (
          <span style={{
            position: 'absolute', top: 14, left: 14,
            background: '#F5D35C', color: 'var(--color-brown-deep)',
            padding: '5px 14px', borderRadius: 'var(--radius-full)',
            fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 3,
          }}>{item.badge}</span>
        )}
        {/* Decorative corner lines */}
        <svg style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, opacity: 0.4 }} viewBox="0 0 28 28" fill="none">
          <path d="M2 26 L2 6 Q2 2 6 2 L26 2" stroke="#F5D35C" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
        <svg style={{ position: 'absolute', bottom: 8, left: 8, width: 28, height: 28, opacity: 0.4 }} viewBox="0 0 28 28" fill="none">
          <path d="M26 2 L26 22 Q26 26 22 26 L2 26" stroke="#F5D35C" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>

        {/* Quick View overlay */}
        <div
          onClick={() => onQuickView(item)}
          onKeyDown={(e) => { if (e.key === 'Enter') onQuickView(item); }}
          role="button"
          tabIndex={0}
          aria-label={`Quick view ${item.name}`}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 10,
            paddingBottom: 18,
            background: hovered ? 'rgba(20, 14, 8, 0.32)' : 'rgba(20, 14, 8, 0)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s var(--motion-ease), background 0.3s var(--motion-ease)',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView(item); }}
            aria-label={`Quick view ${item.name}`}
            title="Quick View"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(255, 253, 245, 0.94)',
              color: 'var(--color-green)',
              border: '1.5px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: hovered ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            aria-label={`Add ${item.name} to cart`}
            title="Add to Cart"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'var(--color-green)',
              color: '#FFFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: hovered ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 6px 20px rgba(40, 85, 28, 0.4)',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px 22px' }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 600, letterSpacing: '2px',
          textTransform: 'uppercase' as const, color: 'var(--color-brown)',
          marginBottom: 8,
        }}>{item.category === 'cake' ? 'CAKES' : item.category === 'pastry' ? 'PASTRIES' : item.category === 'bread' ? 'BREADS' : 'COOKIES'}</div>

        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.2rem',
          color: 'var(--color-brown-deep)', marginBottom: 8, lineHeight: 1.25,
        }}>{item.name}</h3>

        <p style={{
          color: 'var(--color-text-tertiary)', fontSize: '0.82rem',
          lineHeight: 1.65, marginBottom: 18,
        }}>{item.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.2rem',
            color: 'var(--color-green)', fontWeight: 400,
          }}>
            NPR {item.price.toLocaleString()}
          </span>
          <button
            onClick={() => onAdd(item)}
            style={{
              padding: '9px 22px',
              borderRadius: 'var(--radius-full)',
              background: added ? 'var(--color-orange)' : 'var(--color-green)',
              color: 'var(--color-cream)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.4px',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.3s var(--motion-ease)',
              transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
              boxShadow: hovered ? '0 4px 12px rgba(40, 85, 28, 0.2)' : 'none',
            }}
            onMouseEnter={(e) => { if (!added) e.currentTarget.style.background = 'var(--color-green-light)'; }}
            onMouseLeave={(e) => { if (!added) e.currentTarget.style.background = 'var(--color-green)'; }}
          >
            {added ? 'Added \u2713' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OurStorySection() {
  const ref = useReveal();
  return (
    <section id="about" className="section" style={{ background: 'var(--color-cream)' }}>
      <div
        ref={ref}
        className="reveal"
        style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center',
        }}
      >
        <div className="about-images" style={{ position: 'relative', height: 'clamp(340px, 40vw, 480px)' }}>
          <div style={{
            position: 'absolute', width: '72%', height: '82%', top: 0, left: 0,
            borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
          }}>
            <img src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&h=500&fit=crop" alt="Baker at work" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="about-overlay-img" style={{
            position: 'absolute', width: '50%', height: '50%', bottom: 0, right: 0,
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            border: '3px solid var(--color-cream)', boxShadow: 'var(--shadow-md)',
          }}>
            <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" alt="Fresh bread" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="passion-badge" style={{
            position: 'absolute', bottom: '18%', left: -8, background: 'var(--color-green)',
            color: 'var(--color-cream)', borderRadius: 'var(--radius-sm)',
            padding: '14px 18px', textAlign: 'center',
            boxShadow: '0 8px 24px rgba(40, 85, 28, 0.25)',
          }}>
            <strong style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>5+</strong>
            <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>Years of<br />Passion</span>
          </div>
        </div>

        <div className="about-content">
          <h2 className="section-title" style={{ textAlign: 'left' }}>
            Our <span style={{ color: 'var(--color-green)' }}>Story</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 24px' }}>
            A legacy of organic flavors, crafted with purpose.
          </p>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.92rem', marginBottom: 20, lineHeight: 1.8, textAlign: 'left' }}>
            Jiri Bakes began with a simple belief: bread should taste the way nature intended. Started in the hills of Jiri and rooted in Lokanthali, we use only organic flour, local butter, and wild fermentation.
          </p>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.92rem', marginBottom: 32, lineHeight: 1.8, textAlign: 'left' }}>
            Every item that leaves our kitchen is hand-shaped, slow-proved, and baked with intention. No shortcuts, no artificial flavors — just honest bread and real cake.
          </p>
          <a href="#contact"><Button variant="primary">Get in Touch</Button></a>
        </div>
      </div>

      <style>{`
        .passion-badge { transition: transform 0.3s ease; }
        @media (max-width: 1024px) {
          #about .reveal { grid-template-columns: 1fr !important; gap: 48px !important; }
          .about-images { display: none !important; }
          .about-content .section-title, .about-content .section-subtitle { text-align: center !important; }
          .about-content { display: flex; flex-direction: column; align-items: center; }
          .about-content p { text-align: center !important; }
        }
      `}</style>
    </section>
  );
}

function WeCareSection() {
  const [dogImage, setDogImage] = useState('/we care.png');

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.data && Array.isArray(d.data)) {
          const map: Record<string, string> = {};
          d.data.forEach((item: { key: string; value: string }) => { map[item.key] = item.value; });
          if (map.we_care_image) setDogImage(map.we_care_image);
          else if (map.street_dog_image) setDogImage(map.street_dog_image);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section id="we-care" style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 80px)' }}>
      <style>{`
        .wc-banner-img { display:block; width:100%; height:auto; }
        .wc-ig-badge {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 9999px;
          background: rgba(255, 253, 245, 0.95);
          border: 1.5px solid #F5D35C;
          box-shadow: 0 10px 28px rgba(43, 29, 16, 0.22);
          backdrop-filter: blur(12px);
          text-decoration: none;
          color: #2B1D10;
          font-size: 0.84rem;
          font-weight: 700;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .wc-ig-badge:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(43, 29, 16, 0.28); }
        .wc-ig-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 480px) {
          .wc-ig-badge { bottom: 10px !important; right: 10px !important; padding: 8px 12px !important; gap: 6px !important; }
          .wc-ig-icon { width: 26px !important; height: 26px !important; }
          .wc-ig-icon svg { width: 14px !important; height: 14px !important; }
          .wc-ig-label { font-size: 0.7rem !important; }
          .wc-ig-handle { font-size: 0.78rem !important; }
        }
      `}</style>

      {/* Rounded frame — full image, never cropped */}
      <div style={{ position: 'relative', maxWidth: 'var(--max-width)', margin: '0 auto', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 14px 44px rgba(43, 29, 16, 0.12)' }}>
        {/* Dynamic banner — admin can change from Settings page */}
        <img
          src={dogImage}
          alt="Jiri Bakes street dog care initiative"
          className="wc-banner-img"
          onError={(e) => { (e.target as HTMLImageElement).src = '/we care.png'; }}
        />

        {/* Bottom-right Instagram link, clickable on top of image */}
        <a
          href="https://www.instagram.com/jiri_bakes"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Jiri Bakes on Instagram"
          className="wc-ig-badge"
        >
        <span className="wc-ig-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFDF5"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.71 3.71 0 01-1.38-.9 3.71 3.71 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.13.63c-.79.3-1.47.71-2.14 1.37A5.63 5.63 0 00.62 4.13C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.92.3.79.71 1.47 1.37 2.14.66.66 1.34 1.06 2.13 1.37.77.3 1.65.5 2.92.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.92-.56a5.9 5.9 0 002.13-1.37c.66-.66 1.06-1.34 1.37-2.13.3-.77.5-1.65.56-2.92.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.92a5.9 5.9 0 00-1.37-2.13A5.9 5.9 0 0019.87.63c-.77-.3-1.65-.5-2.92-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-10.85a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" /></svg>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span className="wc-ig-label" style={{ fontSize: '0.74rem', color: '#8A7654', fontWeight: 600 }}>Follow our journey</span>
          <span className="wc-ig-handle" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#DD2A7B' }}>@jiri_bakes</span>
        </span>
        </a>
      </div>
    </section>
  );
}

function TestimonialsSection({ items }: { items: Testimonial[] }) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total]);

  return (
    <section className="section" style={{ background: 'var(--color-bg)' }}>
      <h2 className="section-title reveal" style={{ textAlign: 'center' }}>
        What People <span style={{ color: 'var(--color-green)' }}>Say</span>
      </h2>
      <p className="section-subtitle reveal" style={{ textAlign: 'center' }}>
        Real reviews from our happy community.
      </p>

      <div style={{ maxWidth: 700, margin: '0 auto', overflow: 'hidden' }} className="reveal">
        <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${current * 100}%)` }}>
          {items.map((t) => (
            <div key={t.name} style={{ minWidth: '100%', padding: '0 10px', boxSizing: 'border-box' as const }}>
              <div style={{
                background: 'var(--color-cream)', borderRadius: 'var(--radius-md)',
                padding: '32px 28px', border: '1px solid var(--color-border)', textAlign: 'center',
              }}>
                <div style={{ color: 'var(--color-yellow)', fontSize: '0.85rem', marginBottom: 14, letterSpacing: 3 }}>{'\u2605'.repeat(t.rating)}</div>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', background: 'var(--color-green)',
                    color: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: '0.85rem',
                  }}>{t.initials}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-brown-deep)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, alignItems: 'center' }}>
          <button onClick={() => setCurrent((c) => (c - 1 + total) % total)} aria-label="Previous"
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>&#8592;</button>
          {items.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to ${i + 1}`}
              style={{
                width: i === current ? 24 : 8, height: 8, borderRadius: 'var(--radius-full)',
                border: 'none', background: i === current ? 'var(--color-green)' : 'var(--color-border)',
                transition: 'all var(--motion-fast)',
              }} />
          ))}
          <button onClick={() => setCurrent((c) => (c + 1) % total)} aria-label="Next"
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>&#8594;</button>
        </div>
      </div>
    </section>
  );
}

function VisitUsSection() {
  return (
    <section
      id="contact"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-cream)',
        padding: 'clamp(64px, 10vw, 110px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* â”€â”€â”€ Background Decorations â”€â”€â”€ */}
      <div style={{ position: 'absolute', top: '6%', right: '6%', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(40, 85, 28, 0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '8%', left: '4%', width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(245, 211, 92, 0.18)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '35%', left: '15%', width: 140, height: 140, borderRadius: '48% 52% 55% 45%', border: '1px solid rgba(232, 123, 50, 0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '18%', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 211, 92, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* â”€â”€â”€ Section Header â”€â”€â”€ */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', marginBottom: 16 }}>
            <svg width="60" height="12" viewBox="0 0 60 12" fill="none">
              <path d="M2 10 C 15 2, 30 2, 40 6 S 55 10, 58 4" stroke="var(--color-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <h2 className="reveal" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 400,
            color: 'var(--color-brown-deep)',
            marginBottom: 12,
          }}>
            Visit <span style={{ color: 'var(--color-green)' }}>Us</span>
          </h2>
          <p className="reveal" style={{
            fontSize: 'clamp(0.9rem, 1.3vw, 1rem)',
            color: 'var(--color-brown)',
            maxWidth: 480,
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Come experience the warmth of Jiri Bakes. We&apos;d love to welcome you.
          </p>
        </div>

        {/* Content Grid */}
        <div className="reveal contact-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(32px, 4vw, 56px)',
          alignItems: 'start',
        }}>
          {/* Left: Contact Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
                title: 'Address',
                text: 'Lokanthali, Bhaktapur, Nepal',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                title: 'Opening Hours',
                text: 'Mon – Sat: 7:00 AM – 8:00 PM\nSunday: 8:00 AM – 6:00 PM',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                ),
                title: 'Phone',
                text: '+977 1-4567890',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ),
                title: 'Email',
                text: 'hello@jiribakes.com.np',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'flex-start',
                  padding: '20px 24px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(43, 29, 16, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: 'rgba(40, 85, 28, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    color: 'var(--color-brown-deep)',
                    marginBottom: 4,
                  }}>{item.title}</h4>
                  <p style={{
                    color: 'var(--color-text-tertiary)',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.65,
                  }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Real Interactive Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Real Map Card */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1.5px solid var(--color-border)',
              background: '#FFFDF5',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(43, 29, 16, 0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Real Google Map iframe — exact Jiri Bakes pin */}
              <div style={{ width: '100%', height: 320, position: 'relative' }}>
                <iframe
                  title="Jiri Bakes Location Map"
                  src="https://maps.google.com/maps?q=Jiri+Bakes,+M9J8%2B34Q,+Madhyapur+Thimi,+Bagmati+Province+44600&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Map Footer Info */}
              <div style={{
                padding: '16px 20px',
                background: '#FAF6EE',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(40, 85, 28, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-green)',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-brown-deep)' }}>Jiri Bakes Bakery</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>M9J8+34Q, Madhyapur Thimi, Bagmati Province 44600</div>
                  </div>
                </div>

                <a
                  href="https://www.google.com/maps/dir//Jiri+Bakes,+M9J8%2B34Q,+Madhyapur+Thimi,+Bagmati+Province+44600/@27.6922368,85.327872,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x39eb1b0001fa0aff:0xb5d189b9113bca42!2m2!1d85.3654462!2d27.6802657?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 9999,
                    background: 'var(--color-green)',
                    color: '#FFFDF5',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(40,85,28,0.2)',
                  }}
                >
                  <span>Get Directions ↗</span>
                </a>
              </div>
            </div>

            {/* Quick note card */}
            <div style={{
              padding: '18px 22px',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(245, 211, 92, 0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <p style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-tertiary)',
                lineHeight: 1.6,
              }}>
                Fresh bread comes out of the oven at <strong style={{ color: 'var(--color-brown-deep)' }}>7:30 AM</strong> daily. Arrive early for the best selection!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Responsive ─── */}
      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function FooterSection() {
  return (
    <footer style={{
      background: 'linear-gradient(165deg, #1C3314 0%, #162B0F 50%, #12220C 100%)',
      color: 'rgba(255, 253, 245, 0.85)',
      padding: '72px clamp(24px, 5vw, 80px) 32px',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '2px solid rgba(245, 211, 92, 0.25)',
    }}>
      {/* Decorative background glow rings */}
      <div style={{ position: 'absolute', top: '-15%', right: '5%', width: 380, height: 380, borderRadius: '50%', border: '1px solid rgba(245, 211, 92, 0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 211, 92, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'clamp(32px, 4vw, 56px)',
          marginBottom: 56,
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img
                src="/main logo.png"
                alt="Jiri Bakes"
                style={{
                  height: 48,
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: 6,
                }}
              />
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#FFFDF5', display: 'block', lineHeight: 1.1 }}>
                  Jiri Bakes
                </span>
                <span style={{ fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#F5D35C', fontWeight: 600 }}>
                  Simply Organic
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'rgba(255, 253, 245, 0.72)', maxWidth: 280, marginBottom: 20 }}>
              Handcrafted organic breads, cakes, and pastries from the heart of Lokanthali, Nepal. Where flour meets feeling.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, background: 'rgba(245, 211, 92, 0.12)', border: '1px solid rgba(245, 211, 92, 0.25)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5D35C' }} />
              <span style={{ fontSize: '0.72rem', color: '#F5D35C', fontWeight: 600 }}>100% Organic Flours & Butter</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 style={{
              color: '#F5D35C',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 18,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}>
              Quick Links
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Home Gallery', href: '#home' },
                { label: 'Bake of the Week', href: '#featured' },
                { label: 'Browse Collection', href: '#collection' },
                { label: 'Our Story & Philosophy', href: '#about' },
                { label: 'Visit Bakery & Map', href: '#contact' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{
                      fontSize: '0.84rem',
                      color: 'rgba(255, 253, 245, 0.75)',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F5D35C';
                      e.currentTarget.style.paddingLeft = '4px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 253, 245, 0.75)';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Bakery Specialties */}
          <div>
            <h4 style={{
              color: '#F5D35C',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 18,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}>
              Artisan Menu
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Sunflower Cream Cake', href: '#collection' },
                { label: 'Chocolate Hazelnut Tart', href: '#collection' },
                { label: '72hr Heritage Sourdough', href: '#collection' },
                { label: 'French Butter Croissant', href: '#collection' },
                { label: 'Himalayan Oatmeal Cookies', href: '#collection' },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    style={{
                      fontSize: '0.84rem',
                      color: 'rgba(255, 253, 245, 0.75)',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F5D35C';
                      e.currentTarget.style.paddingLeft = '4px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 253, 245, 0.75)';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit & Contact */}
          <div>
            <h4 style={{
              color: '#F5D35C',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 18,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}>
              Lokanthali Store
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.84rem', color: 'rgba(255, 253, 245, 0.75)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> Lokanthali, Bhaktapur, Nepal</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg> +977 1-4567890</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> hello@jiribakes.com.np</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> Mon – Sat: 7:00 AM – 8:00 PM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> Sunday: 8:00 AM – 6:00 PM</div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & Admin Studio link */}
        <div style={{
          borderTop: '1px solid rgba(255, 253, 245, 0.12)',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: '0.78rem',
          color: 'rgba(255, 253, 245, 0.6)',
        }}>
          <div>&copy; {new Date().getFullYear()} Jiri Bakes. All rights reserved. Handcrafted in Nepal.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ color: 'rgba(255,253,245,0.45)', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg> Where flour meets feeling</span>
            <span style={{ color: 'rgba(255,253,245,0.6)', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Designed by <a href="https://inloopnepal.com" target="_blank" rel="noopener noreferrer" style={{ color: '#F5D35C', textDecoration: 'none', fontWeight: 700 }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>InLoop Nepal</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
