'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/components/layout/AppShell';
import { useWishlist } from '@/components/layout/WishlistContext';
import { useTheme } from '@/components/layout/ThemeContext';

const navLinks = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'collection', label: 'Shop', href: '#collection' },
  { id: 'about', label: 'About Us', href: '#about' },
  { id: 'contact', label: 'Contact', href: '#contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const navListRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const pathname = usePathname();
  const { count, openCart } = useCart();
  const { count: wishlistCount, openWishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();

  // Scroll Spy for smooth section detection
  useEffect(() => {
    let ticking = false;

    const updateActiveSection = () => {
      setScrolled(window.scrollY > 25);

      const sectionOrder = ['contact', 'about', 'collection', 'home'];
      const scrollY = window.scrollY + 200;

      if (window.scrollY < 180) {
        setActiveSection('home');
        return;
      }

      for (const id of sectionOrder) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollY >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Update sliding indicator position smoothly
  useEffect(() => {
    const activeEl = linkRefs.current[activeSection];
    const parentEl = navListRef.current;

    if (activeEl && parentEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const parentRect = parentEl.getBoundingClientRect();
      const left = activeRect.left - parentRect.left + 4;
      const width = activeRect.width - 8;

      setIndicatorStyle({
        left,
        width: Math.max(width, 24),
        opacity: 1,
      });
    }
  }, [activeSection]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isNight = theme === 'night';

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.getElementById(id);
      if (target) {
        const headerOffset = 76;
        const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = id === 'home' ? 0 : elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
      setActiveSection(id);
      setMobileOpen(false);
    }
  };

  return (
    <>
      <style>{`
        /* ─── Van Gogh Painterly Navbar Animations ─── */
        @keyframes strokeGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(245, 211, 92, 0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(245, 211, 92, 0.8)); }
        }

        @keyframes celestialSpin {
          0% { transform: rotate(0deg) scale(0.85); opacity: 0.4; }
          50% { transform: rotate(180deg) scale(1.1); opacity: 1; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }

        @keyframes starryAuraPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(245, 211, 92, 0.25), inset 0 0 8px rgba(245, 211, 92, 0.15); }
          50% { box-shadow: 0 0 20px rgba(245, 211, 92, 0.55), inset 0 0 14px rgba(245, 211, 92, 0.35); }
        }

        .vg-nav-link {
          position: relative;
          padding: 8px 12px;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          letter-spacing: 0.25px;
          color: var(--color-text-primary);
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease;
          cursor: pointer;
          border-radius: 9999px;
        }

        .vg-nav-link:hover {
          color: #F5D35C !important;
          transform: translateY(-2px);
          text-shadow: 0 0 12px rgba(245, 211, 92, 0.5);
        }

        .vg-nav-link.active {
          color: #F5D35C !important;
          font-weight: 600;
        }

        .vg-nav-link:active {
          transform: scale(0.94);
        }

        /* Sliding magnetic brushstroke underline */
        .vg-sliding-indicator {
          position: absolute;
          bottom: 2px;
          height: 7px;
          pointer-events: none;
          transition: left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                      width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.3s ease;
          animation: strokeGlow 3s infinite ease-in-out;
        }

        /* Theme & Action buttons */
        .vg-theme-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1.5px solid var(--color-border);
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .vg-theme-btn:hover {
          transform: rotate(25deg) scale(1.1);
          border-color: #F5D35C;
          box-shadow: 0 0 18px rgba(245, 211, 92, 0.45);
        }

        .vg-theme-btn:active {
          transform: scale(0.92);
        }

        /* Cart button hover */
        .vg-cart-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid var(--color-border);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .vg-cart-btn:hover {
          transform: translateY(-2px);
          border-color: #F5D35C;
          box-shadow: 0 6px 18px rgba(245, 211, 92, 0.3);
          color: #F5D35C;
        }

        .vg-cart-btn:active {
          transform: scale(0.94);
        }

        .vg-logo-wrap {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .vg-logo-wrap:hover {
          transform: scale(1.05) rotate(-1.5deg);
        }

        .vg-logo-wrap:active {
          transform: scale(0.96);
        }
      `}</style>

      <nav
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? 'var(--header-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: scrolled ? '1.5px solid var(--color-border)' : '1px solid transparent',
          transition: 'all var(--motion-normal) var(--motion-ease)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            padding: '0 clamp(20px, 4vw, 60px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 'var(--header-height)',
          }}
        >
          {/* Logo with Van Gogh artistic hover animation */}
          <Link
            href="#home"
            onClick={(e) => handleNavClick(e, '#home', 'home')}
            className="vg-logo-wrap"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <img
              src="/main logo.png"
              alt="Jiri Bakes"
              style={{
                height: 52,
                width: 'auto',
                objectFit: 'contain',
                borderRadius: 8,
                display: 'block',
              }}
            />
          </Link>

          {/* Desktop Nav Links with Magnetic Sliding Van Gogh Brushstroke Underline */}
          <ul
            ref={navListRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              position: 'relative',
              padding: '6px 4px',
            }}
            className="nav-links-desktop"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <li key={link.id}>
                  <a
                    ref={(el) => { linkRefs.current[link.id] = el; }}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href, link.id)}
                    className={`vg-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span>{link.label}</span>
                  </a>
                </li>
              );
            })}

            {/* Smooth Sliding Magnetic Van Gogh Brushstroke Underline */}
            <div
              className="vg-sliding-indicator"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            >
              <svg width="100%" height="7" viewBox="0 0 60 7" fill="none" preserveAspectRatio="none">
                <path
                  d="M2 4.5 C 16 1, 30 7, 44 2.5 S 57 5.5, 59 3.5"
                  stroke="#F5D35C"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </ul>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* ─── Day / Night Theme Toggle Switch (ICON ONLY) ─── */}
            <button
              onClick={toggleTheme}
              className="vg-theme-btn"
              aria-label={`Switch to ${isNight ? 'Golden Day' : 'Starry Night'} Mode`}
              title={`Switch to ${isNight ? 'Golden Day Mode' : 'Starry Night Mode (Van Gogh)'}`}
              style={{
                background: isNight ? 'rgba(245, 211, 92, 0.14)' : 'rgba(40, 85, 28, 0.08)',
                color: isNight ? '#F5D35C' : 'var(--color-green)',
                animation: isNight ? 'starryAuraPulse 3s infinite ease-in-out' : 'none',
              }}
            >
              {isNight ? (
                /* ── Van Gogh Starry Night Moon & Twinkle Star SVG ── */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'celestialSpin 0.5s ease-out' }}>
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    fill="#F5D35C"
                    stroke="#F5D35C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="17" cy="6" r="1.5" fill="#FFFDF5" />
                  <circle cx="19" cy="9" r="1" fill="#F5D35C" />
                </svg>
              ) : (
                /* ── Van Gogh Sunflower / Sunburst Sun SVG ── */
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" style={{ animation: 'celestialSpin 0.5s ease-out' }}>
                  <circle cx="12" cy="12" r="5" fill="#F5D35C" stroke="var(--color-green)" strokeWidth="1.5" />
                  <line x1="12" y1="1" x2="12" y2="3.5" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="20.5" x2="12" y2="23" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="4.22" x2="6" y2="6" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18" y1="18" x2="19.78" y2="19.78" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="3.5" y2="12" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="20.5" y1="12" x2="23" y2="12" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="19.78" x2="6" y2="18" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18" y1="6" x2="19.78" y2="4.22" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {/* ─── Wishlist Heart Button ─── */}
            <button
              onClick={openWishlist}
              className="vg-theme-btn"
              aria-label={`Wishlist, ${wishlistCount} items`}
              title="My Wishlist"
              style={{
                background: wishlistCount > 0 ? 'rgba(231, 76, 60, 0.14)' : (isNight ? 'rgba(255,255,255,0.06)' : 'rgba(40, 85, 28, 0.08)'),
                color: wishlistCount > 0 ? '#e74c3c' : 'var(--color-text-primary)',
                position: 'relative',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill={wishlistCount > 0 ? '#e74c3c' : 'none'} stroke={wishlistCount > 0 ? '#e74c3c' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#e74c3c',
                    color: '#FFFDF5',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(231, 76, 60, 0.45)',
                    border: '2px solid var(--color-surface-raised, #FFFDF5)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* ─── Cart Bag Button ─── */}
            <button
              onClick={openCart}
              className="vg-cart-btn"
              aria-label={`Cart, ${count} items`}
              style={{
                background: count > 0 ? 'rgba(245, 211, 92, 0.22)' : (isNight ? 'rgba(255,255,255,0.06)' : 'rgba(40, 85, 28, 0.08)'),
                color: 'var(--color-text-primary)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                {count > 0 ? `${count} items` : 'Bag'}
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              style={{
                display: 'none',
                flexDirection: 'column',
                gap: 5,
                padding: 4,
              }}
            >
              <span style={{
                display: 'block', width: 22, height: 2, borderRadius: 2,
                background: 'var(--color-text-primary)',
                transition: 'all var(--motion-fast)',
                transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : undefined,
              }} />
              <span style={{
                display: 'block', width: 22, height: 2, borderRadius: 2,
                background: 'var(--color-text-primary)',
                transition: 'all var(--motion-fast)',
                opacity: mobileOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block', width: 22, height: 2, borderRadius: 2,
                background: 'var(--color-text-primary)',
                transition: 'all var(--motion-fast)',
                transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : undefined,
              }} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div
            style={{
              padding: '24px',
              background: 'var(--header-bg)',
              borderBottom: '1.5px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, link.id)}
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: activeSection === link.id ? '#F5D35C' : 'var(--color-text-primary)',
                  padding: '8px 0',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
