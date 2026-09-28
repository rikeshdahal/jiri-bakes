'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../layout/ThemeContext';

const FALLBACK = {
  whatsapp: '9779841234567',
  instagram: 'https://www.instagram.com/jiri_bakes',
  facebook: 'https://www.facebook.com/deepiel',
};

export default function FloatingActions() {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState(FALLBACK);
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const hubRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(Math.max((currentScroll / totalScroll) * 100, 0), 100));
      }
      setVisible(currentScroll > 320);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load workable profile links from site settings (admin-editable), fallback to defaults
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.data) return;
        const map: Record<string, string> = {};
        for (const row of d.data) map[row.key] = row.value ?? '';
        setLinks({
          whatsapp: (map.whatsapp_phone || FALLBACK.whatsapp).replace(/\D/g, ''),
          instagram: map.instagram_url || FALLBACK.instagram,
          facebook: map.facebook_url || FALLBACK.facebook,
        });
      })
      .catch(() => {});
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (hubRef.current && !hubRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const whatsappHref = `https://wa.me/${links.whatsapp}?text=${encodeURIComponent(
    'Hello Jiri Bakes! I would like to inquire about your fresh artisan bakery items.'
  )}`;

  const socials = [
    {
      id: 'whatsapp',
      label: 'Chat on WhatsApp',
      sub: `wa.me/${links.whatsapp}`,
      href: whatsappHref,
      bg: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      shadow: '0 8px 24px rgba(18, 140, 126, 0.45)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      label: 'Follow on Instagram',
      sub: '@jiri_bakes',
      href: links.instagram,
      bg: 'linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 55%, #962FBF 80%, #4F5BD5 100%)',
      shadow: '0 8px 24px rgba(214, 41, 118, 0.45)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.71 3.71 0 0 1-1.38-.9 3.71 3.71 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.13.63c-.79.3-1.47.71-2.14 1.37A5.63 5.63 0 0 0 .62 4.13C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.92.3.79.71 1.47 1.37 2.14.66.66 1.34 1.06 2.13 1.37.77.3 1.65.5 2.92.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.92-.56a5.9 5.9 0 0 0 2.13-1.37c.66-.66 1.06-1.34 1.37-2.13.3-.77.5-1.65.56-2.92.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.92a5.9 5.9 0 0 0-1.37-2.13A5.9 5.9 0 0 0 19.87.63c-.77-.3-1.65-.5-2.92-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      label: 'Like on Facebook',
      sub: 'Jiri Bakes',
      href: links.facebook,
      bg: 'linear-gradient(135deg, #2b8aff 0%, #1877F2 55%, #0d5dcf 100%)',
      shadow: '0 8px 24px rgba(24, 119, 242, 0.45)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.1 24 12.07z" />
        </svg>
      ),
    },
  ];

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <style>{`
        @keyframes vgPulseRing {
          0% { transform: scale(1); opacity: 0.55; }
          80%, 100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes vgGentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .vg-float-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          z-index: 999;
        }
        .vg-float-btn {
          cursor: pointer;
          border: none;
          outline: none;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, opacity 0.3s ease;
        }
        .vg-float-btn:hover { transform: scale(1.1) translateY(-2px); }
        .vg-float-btn:active { transform: scale(0.92); }

        .vg-social-item {
          display: flex;
          align-items: center;
          gap: 12px;
          transition: opacity 0.38s cubic-bezier(0.34, 1.56, 0.64, 1),
                      transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform, opacity;
        }
        .vg-social-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 8px 7px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.2px;
          white-space: nowrap;
          text-decoration: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .vg-social-pill:hover { transform: translateX(-3px); }
        .vg-social-pill .vg-visit {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.22);
          border: 1px solid rgba(255,255,255,0.35);
        }
        .vg-social-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
          border: 2px solid rgba(255, 255, 255, 0.45);
          flex-shrink: 0;
        }
        .vg-main-pulse::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(245, 211, 92, 0.7);
          animation: vgPulseRing 2.2s ease-out infinite;
          pointer-events: none;
        }
        @media (max-width: 600px) {
          .vg-float-container { bottom: 20px; right: 16px; gap: 12px; }
          .vg-social-pill span.vg-sub { display: none; }
        }
      `}</style>

      <div className="vg-float-container" ref={hubRef}>
        {/* ─── Expandable social stack ─── */}
        {socials.map((s, i) => {
          const stagger = open ? (socials.length - 1 - i) * 70 : 0;
          return (
            <div
              key={s.id}
              className="vg-social-item"
              style={{
                opacity: open ? 1 : 0,
                transform: open
                  ? 'translateY(0) scale(1)'
                  : 'translateY(18px) scale(0.6)',
                pointerEvents: open ? 'auto' : 'none',
                transitionDelay: open ? `${stagger}ms` : '0ms',
              }}
            >
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} — opens in new tab`}
                className="vg-social-pill"
                tabIndex={open ? 0 : -1}
                style={{
                  background: isNight ? 'rgba(18,29,54,0.82)' : 'rgba(28,44,25,0.86)',
                  color: '#FFFDF5',
                  border: '1px solid rgba(245, 211, 92, 0.3)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
                }}
              >
                <span>{s.label}</span>
                <span className="vg-sub" style={{ opacity: 0.65, fontWeight: 600 }}>
                  {s.sub}
                </span>
                <span className="vg-visit">
                  Visit
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </a>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label} — opens in new tab`}
                className="vg-float-btn vg-social-circle"
                tabIndex={open ? 0 : -1}
                style={{ background: s.bg, boxShadow: s.shadow }}
              >
                {s.icon}
              </a>
            </div>
          );
        })}

        {/* ─── Main social toggle FAB ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              background: isNight ? 'rgba(18,29,54,0.85)' : '#1C2C19',
              color: '#FFFDF5',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(245, 211, 92, 0.3)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
              opacity: open ? 1 : 0,
              transform: open ? 'translateX(0)' : 'translateX(8px)',
              transition: 'all 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            {open ? 'Tap a profile to visit' : ''}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`vg-float-btn ${!open ? 'vg-main-pulse' : ''}`}
            aria-label={open ? 'Close social links' : 'Open social links — WhatsApp, Instagram, Facebook'}
            aria-expanded={open}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: open
                ? isNight ? '#F5D35C' : '#1C2C19'
                : 'linear-gradient(135deg, #28551C 0%, #1C3314 100%)',
              color: open ? (isNight ? '#1C2C19' : '#F5D35C') : '#FFFDF5',
              boxShadow: open
                ? '0 10px 28px rgba(0,0,0,0.35)'
                : '0 10px 28px rgba(40, 85, 28, 0.45)',
              border: '2px solid rgba(245, 211, 92, 0.55)',
              animation: !open ? 'vgGentleFloat 4s infinite ease-in-out' : 'none',
            }}
          >
            {/* Chat / close morph icon */}
            <span
              style={{
                display: 'flex',
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {open ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  <circle cx="9" cy="11.5" r="0.6" fill="currentColor" />
                  <circle cx="12" cy="11.5" r="0.6" fill="currentColor" />
                  <circle cx="15" cy="11.5" r="0.6" fill="currentColor" />
                </svg>
              )}
            </span>
            {/* Mini brand dots */}
            {!open && (
              <span style={{ position: 'absolute', bottom: 8, display: 'flex', gap: 3 }}>
                {['#25D366', '#D62976', '#1877F2'].map((c) => (
                  <span key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c, border: '1px solid #fff' }} />
                ))}
              </span>
            )}
          </button>
        </div>

        {/* ─── Circular Scroll Progress Back-to-Top Button ─── */}
        <button
          onClick={scrollToTop}
          className="vg-float-btn"
          aria-label="Scroll back to top"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: isNight ? '#121D36' : '#FFFDF5',
            boxShadow: isNight ? '0 8px 24px rgba(0, 0, 0, 0.5)' : '0 8px 24px rgba(43, 29, 16, 0.15)',
            border: isNight ? '1.5px solid rgba(245, 211, 92, 0.25)' : '1.5px solid #E8DFCE',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.7) translateY(20px)',
            pointerEvents: visible ? 'all' : 'none',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
            <circle cx="24" cy="24" r={radius} fill="none" stroke={isNight ? 'rgba(245, 211, 92, 0.12)' : 'rgba(40, 85, 28, 0.08)'} strokeWidth="3.5" />
            <circle cx="24" cy="24" r={radius} fill="none" stroke="#F5D35C" strokeWidth="3.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.15s ease-out' }} />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isNight ? '#F5D35C' : 'var(--color-green)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 2 }}>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
