'use client';

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/types';
import { useCart } from '@/components/layout/AppShell';
import { useWishlist } from '@/components/layout/WishlistContext';

interface QuickViewModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export default function QuickViewModal({ item, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [paused, setPaused] = useState(false);

  const isFav = item ? isInWishlist(item.id) : false;

  const fallbackImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&h=800&fit=crop';
  const galleryImages = (item?.images && item.images.filter(Boolean).length > 0)
    ? item.images.filter(Boolean) as string[]
    : (item?.image ? [item.image] : []);
  const activeSrc = galleryImages.length > 0 ? galleryImages[activeImg % galleryImages.length] || fallbackImage : fallbackImage;

  const goPrev = () => setActiveImg((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const goNext = () => setActiveImg((i) => (i + 1) % galleryImages.length);

  useEffect(() => {
    if (galleryImages.length <= 1 || paused) return;
    const timer = setInterval(() => setActiveImg((i) => (i + 1) % galleryImages.length), 4000);
    return () => clearInterval(timer);
  }, [galleryImages.length, paused]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const categoryLabel =
    item.category === 'cake' ? 'CAKES'
    : item.category === 'pastry' ? 'PASTRIES'
    : item.category === 'bread' ? 'BREADS'
    : 'COOKIES';

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.image || '',
        unit: item.unit,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view for ${item.name}`}
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes qvBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qvPanelIn { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes qvImgFade { from { opacity: 0.4; } to { opacity: 1; } }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20, 14, 8, 0.6)',
          backdropFilter: 'blur(5px)',
          animation: 'qvBackdropIn 0.25s ease forwards',
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 920,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-surface-raised)',
          borderRadius: 20,
          border: '1px solid rgba(245, 211, 92, 0.3)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
          animation: 'qvPanelIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
        }}
        className="qv-grid"
      >
        {/* ── Close ── */}
        <button
          onClick={onClose}
          aria-label="Close quick view"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 5,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--color-surface-muted)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-green)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* ── Image gallery ── */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 380, overflow: 'hidden', borderRadius: '20px 0 0 20px', background: 'var(--color-bg)' }} className="qv-image">
          {/* Main image */}
          <div style={{ position: 'relative', flex: 1, minHeight: 240, overflow: 'hidden' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <img
              key={activeSrc}
              src={activeSrc}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, animation: 'qvImgFade 0.25s ease forwards' }}
            />
            {/* Prev / Next arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Previous image"
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255, 253, 245, 0.92)', border: '1.5px solid rgba(255, 253, 245, 0.6)',
                    color: 'var(--color-green)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)', zIndex: 3,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-green)'; e.currentTarget.style.color = '#F5D35C'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 253, 245, 0.92)'; e.currentTarget.style.color = 'var(--color-green)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next image"
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255, 253, 245, 0.92)', border: '1.5px solid rgba(255, 253, 245, 0.6)',
                    color: 'var(--color-green)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)', zIndex: 3,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-green)'; e.currentTarget.style.color = '#F5D35C'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 253, 245, 0.92)'; e.currentTarget.style.color = 'var(--color-green)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                {/* counter pill */}
                <span style={{
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 3,
                  background: 'rgba(20,14,8,0.55)', color: '#FFFDF5',
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.5px',
                  padding: '4px 12px', borderRadius: 9999, backdropFilter: 'blur(4px)',
                  whiteSpace: 'nowrap',
                }}>{activeImg + 1} / {galleryImages.length}</span>
              </>
            )}
          </div>

          {/* Badge */}
          {item.badge && (
            <span style={{
              position: 'absolute', top: 18, left: 18, zIndex: 3,
              background: '#F5D35C', color: 'var(--color-brown-deep)',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}>{item.badge}</span>
          )}
          <svg style={{ position: 'absolute', top: 14, right: 60, width: 30, height: 30, opacity: 0.5, zIndex: 2 }} viewBox="0 0 28 28" fill="none">
            <path d="M2 26 L2 6 Q2 2 6 2 L26 2" stroke="#F5D35C" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* ── Details ── */}
        <div style={{ padding: 'clamp(24px, 3.5vw, 40px)' }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--color-brown)',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {categoryLabel}
            <span style={{ width: 34, height: 1, background: 'currentColor', opacity: 0.4, display: 'inline-block' }} />
            <span style={{ color: 'var(--color-green)' }}>Jiri Bakes</span>
          </div>

          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
            color: 'var(--color-brown-deep)',
            lineHeight: 1.15,
            marginBottom: 10,
          }}>{item.name}</h3>

          {/* Rating */}
          {typeof item.rating === 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <span style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= item.rating ? '#F5D35C' : 'none'} stroke="#F5D35C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-tertiary)' }}>{item.rating}.0 rating</span>
            </div>
          )}

          <p style={{
            color: 'var(--color-text-tertiary)', fontSize: '0.9rem',
            lineHeight: 1.8, marginBottom: 20,
          }}>{item.description}</p>

          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', marginBottom: 20, fontSize: '0.8rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>Fresh &amp; organic.</span> Baked fresh each morning at Lokanthali, Bhaktapur. Price shown for <strong style={{ color: 'var(--color-brown-deep)' }}>{item.unit || '/whole'}</strong>.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2.4vw, 1.9rem)', color: 'var(--color-green)' }}>
              NPR {item.price.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>{item.unit}</span>

            {/* Qty stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)',
                  color: 'var(--color-brown-deep)', fontSize: '1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-green)'; e.currentTarget.style.color = '#FFFDF5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-muted)'; e.currentTarget.style.color = 'var(--color-brown-deep)'; }}
              >−</button>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, minWidth: 22, textAlign: 'center', color: 'var(--color-brown-deep)' }}>{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)',
                  color: 'var(--color-brown-deep)', fontSize: '1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-green)'; e.currentTarget.style.color = '#FFFDF5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-muted)'; e.currentTarget.style.color = 'var(--color-brown-deep)'; }}
              >+</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1,
                minWidth: 170,
                padding: '13px 26px',
                borderRadius: 'var(--radius-full)',
                background: added ? 'var(--color-orange)' : 'var(--color-green)',
                color: '#FFFDF5',
                fontSize: '0.86rem',
                fontWeight: 700,
                letterSpacing: '0.3px',
                fontFamily: 'var(--font-body)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.3s var(--motion-ease)',
                boxShadow: '0 4px 16px rgba(40, 85, 28, 0.25)',
              }}
            >
              {added
                ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added · NPR {(item.price * qty).toLocaleString()}</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Add to Cart</>
              }
            </button>

            <button
              onClick={() => toggleWishlist({ id: item.id, name: item.name, price: item.price, img: item.image || '', description: item.description, category: item.category })}
              title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
              style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: isFav ? 'rgba(231, 76, 60, 0.2)' : 'var(--color-surface-muted)',
                border: `1.5px solid ${isFav ? '#e74c3c' : 'var(--color-border)'}`,
                color: isFav ? '#e74c3c' : 'var(--color-brown)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? '#e74c3c' : 'none'} stroke={isFav ? '#e74c3c' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .qv-grid { grid-template-columns: 1fr !important; }
          .qv-image { min-height: 260px !important; border-radius: 20px 20px 0 0 !important; }
        }
      `}</style>
    </div>
  );
}