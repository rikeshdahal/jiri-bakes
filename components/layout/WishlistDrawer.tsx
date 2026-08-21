'use client';

import { useWishlist } from './WishlistContext';
import { useCart } from './AppShell';

export default function WishlistDrawer() {
  const { items, isOpen, closeWishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  if (!isOpen) return null;

  const handleMoveToCart = (item: { id: string; name: string; price: number; img: string }) => {
    addItem({ id: item.id, name: item.name, price: item.price, img: item.img });
    removeFromWishlist(item.id);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`
        @keyframes slideInRightWishlist {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={closeWishlist}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(27, 20, 14, 0.65)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          height: '100%',
          background: 'var(--color-surface-raised, #FFFDF5)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          animation: 'slideInRightWishlist .3s cubic-bezier(.4,0,.2,1)',
          borderLeft: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--color-brown-deep)', lineHeight: 1.1 }}>
                My Wishlist
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
                {items.length} {items.length === 1 ? 'masterpiece' : 'masterpieces'} saved
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--color-error, #c0392b)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 8px',
                }}
              >
                Clear all
              </button>
            )}
            <button
              onClick={closeWishlist}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-primary)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Wishlist Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-tertiary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:14}}><path d="M12 2l1.09 3.41L16.5 7l-3.41 1.59L12 12l-1.09-3.41L7.5 7l3.41-1.59L12 2z"/><path d="M18 14l.73 2.37L21 17l-2.27.63L18 20l-.73-2.37L15 17l2.27-.63L18 14z"/><path d="M5 17l.55 1.81L7 19.5l-1.45.69L5 22l-.55-1.81L3 19.5l1.45-.69L5 17z"/></svg>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-brown-deep)', marginBottom: 8 }}>
                Your wishlist is empty
              </h4>
              <p style={{ fontSize: '0.85rem', maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.65 }}>
                Tap the heart icon on any bakery item to save it for later.
              </p>
              <button
                onClick={closeWishlist}
                style={{
                  padding: '12px 28px',
                  borderRadius: 9999,
                  background: 'var(--color-green)',
                  color: '#FFFDF5',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(40,85,28,.25)',
                }}
              >
                Explore Gallery
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '14px',
                    borderRadius: 16,
                    background: 'var(--color-card-bg, var(--color-bg))',
                    border: '1px solid var(--color-border)',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid var(--color-border)',
                      background: '#EEE8D5',
                    }}
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: 'var(--color-brown-deep)',
                        marginBottom: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </h4>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontFamily: 'var(--font-display)',
                        color: 'var(--color-green)',
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      NPR {item.price.toLocaleString()}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => handleMoveToCart(item)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 9999,
                          background: 'var(--color-green)',
                          color: '#FFFDF5',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: '0 2px 8px rgba(40,85,28,0.2)',
                        }}
                      >
                        <span style={{display:'inline-flex',alignItems:'center',gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> Move to Bag</span>
                      </button>

                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-tertiary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '18px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <button
              onClick={() => {
                items.forEach((it) => addItem({ id: it.id, name: it.name, price: it.price, img: it.img }));
                clearWishlist();
              }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 9999,
                background: 'var(--color-green)',
                color: '#FFFDF5',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(40,85,28,.25)',
              }}
            >
              Move All to Bag ({items.length}) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
