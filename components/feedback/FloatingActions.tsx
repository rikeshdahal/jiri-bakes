'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../layout/ThemeContext';

export default function FloatingActions() {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  const isNight = theme === 'night';

  if (pathname.startsWith('/admin')) return null;

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      if (totalScroll > 0) {
        const progress = (currentScroll / totalScroll) * 100;
        setScrollProgress(Math.min(Math.max(progress, 0), 100));
      }

      setVisible(currentScroll > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SVG Circle calculations (radius 20, perimeter ~ 125.66)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  const whatsappNumber = '9779841234567';
  const whatsappMessage = encodeURIComponent('Hello Jiri Bakes! I would like to inquire about your fresh artisan bakery items.');

  return (
    <>
      <style>{`
        @keyframes floatGlow {
          0%, 100% { transform: translateY(0px); box-shadow: 0 8px 24px rgba(40, 85, 28, 0.35); }
          50% { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(40, 85, 28, 0.5); }
        }

        @keyframes starryRingPulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(245, 211, 92, 0.5)); }
          50% { filter: drop-shadow(0 0 10px rgba(245, 211, 92, 0.9)); }
        }

        .vg-float-container {
          position: fixed;
          bottom: 28px;
          right: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          z-index: 999;
          pointer-events: none;
        }

        .vg-float-btn {
          pointer-events: all;
          cursor: pointer;
          border: none;
          outline: none;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .vg-float-btn:hover {
          transform: scale(1.1) translateY(-2px);
        }

        .vg-float-btn:active {
          transform: scale(0.92);
        }

        /* Tooltip style */
        .vg-float-tooltip {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%) translateX(6px);
          padding: 6px 14px;
          border-radius: 9999px;
          background: #1C2C19;
          color: #FFFDF5;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          white-space: nowrap;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(245, 211, 92, 0.3);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
        }

        .vg-float-btn:hover .vg-float-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        @media (max-width: 600px) {
          .vg-float-container {
            bottom: 20px;
            right: 18px;
            gap: 12px;
          }
        }
      `}</style>

      <div className="vg-float-container">
        {/* ─── 1. WhatsApp Floating Chat Button ─── */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="vg-float-btn"
          aria-label="Chat on WhatsApp"
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(18, 140, 126, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            animation: 'floatGlow 4s infinite ease-in-out',
            textDecoration: 'none',
          }}
        >
          {/* WhatsApp SVG Icon */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/>
          </svg>

          <span className="vg-float-tooltip">Chat with us on WhatsApp</span>
        </a>

        {/* ─── 2. Circular Scroll Progress Back-to-Top Button ─── */}
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
            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Circular Progress Ring SVG */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotate(-90deg)',
              pointerEvents: 'none',
            }}
          >
            {/* Background track circle */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke={isNight ? 'rgba(245, 211, 92, 0.12)' : 'rgba(40, 85, 28, 0.08)'}
              strokeWidth="3.5"
            />
            {/* Animated Golden Progress circle */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="#F5D35C"
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.15s ease-out',
                animation: scrollProgress > 10 ? 'starryRingPulse 3s infinite ease-in-out' : 'none',
              }}
            />
          </svg>

          {/* Upward Arrow Icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isNight ? '#F5D35C' : 'var(--color-green)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'relative', zIndex: 2 }}
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>

          <span className="vg-float-tooltip">
            Back to top · {Math.round(scrollProgress)}%
          </span>
        </button>
      </div>
    </>
  );
}
