'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { useWishlist } from './WishlistContext';
import type { MenuItem } from '@/types';

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
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

interface HeroSectionProps {
  bakeOfTheWeek?: MenuItem | null;
  onQuickView?: () => void;
}

export default function HeroSection({ bakeOfTheWeek, onQuickView }: HeroSectionProps) {
  const ref = useReveal();
  const { theme } = useTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isNight = theme === 'night';

  const cakeItem = bakeOfTheWeek || {
    id: 'c1',
    name: 'Sunflower Cream Cake',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    description: 'A light layered sponge kissed with organic cream and sunflower honey.',
  };

  const isFav = isInWishlist(cakeItem.id);

  return (
    <>
      {/* ─── Global Keyframes & Responsive Styles ─── */}
      <style>{`
        @keyframes hero-drawLine {
          from { stroke-dashoffset: 400; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes hero-floatUp {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-8px) rotate(-2deg); }
        }
        @keyframes hero-subtlePulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.55; }
        }
        @keyframes hero-fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes starry-swirl-slow {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.04); }
          100% { transform: rotate(360deg) scale(1); }
        }

        /* Reveal animation */
        .hero-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.75s cubic-bezier(0.4,0,0.2,1),
                      transform 0.75s cubic-bezier(0.4,0,0.2,1);
        }
        .hero-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Staggered children */
        .hero-reveal.visible .hero-stagger-1 { animation: hero-fadeInUp 0.6s ease 0.1s both; }
        .hero-reveal.visible .hero-stagger-2 { animation: hero-fadeInUp 0.6s ease 0.2s both; }
        .hero-reveal.visible .hero-stagger-3 { animation: hero-fadeInUp 0.6s ease 0.35s both; }
        .hero-reveal.visible .hero-stagger-4 { animation: hero-fadeInUp 0.6s ease 0.5s both; }
        .hero-reveal.visible .hero-stagger-5 { animation: hero-fadeInUp 0.6s ease 0.65s both; }

        /* Grid layout */
        .hero-grid {
          max-width: var(--max-width, 1240px);
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1.05fr;
          gap: clamp(32px, 5vw, 72px);
          align-items: center;
          position: relative;
          z-index: 2;
          padding: 110px clamp(24px, 5vw, 80px) 72px;
        }

        /* CTA button hover effects */
        .hero-btn-primary {
          padding: 15px 38px;
          border-radius: 9999px;
          background: var(--color-green, #28551C);
          color: #FFFDF5;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: var(--font-body, 'Inter', sans-serif);
          letter-spacing: 0.3px;
          border: none;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.3s cubic-bezier(0.4,0,0.2,1),
                      background 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 16px rgba(40,85,28,0.22);
          white-space: nowrap;
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(40,85,28,0.32);
        }

        .hero-btn-outline {
          padding: 15px 34px;
          border-radius: 9999px;
          background: transparent;
          color: var(--color-text-primary);
          font-size: 0.9rem;
          font-weight: 500;
          font-family: var(--font-body, 'Inter', sans-serif);
          letter-spacing: 0.3px;
          border: 1.5px solid var(--color-border);
          cursor: pointer;
          transition: border-color 0.3s cubic-bezier(0.4,0,0.2,1),
                      color 0.3s cubic-bezier(0.4,0,0.2,1),
                      background 0.3s cubic-bezier(0.4,0,0.2,1),
                      transform 0.3s cubic-bezier(0.4,0,0.2,1);
          white-space: nowrap;
        }
        .hero-btn-outline:hover {
          border-color: #F5D35C;
          color: #F5D35C;
          background: rgba(245, 211, 92, 0.08);
          transform: translateY(-2px);
        }

        /* Image hover effects */
        .hero-main-img {
          transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .hero-main-img-wrap:hover .hero-main-img {
          transform: scale(1.03);
        }

        .hero-croissant-wrap {
          transition: transform 0.4s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .hero-croissant-wrap:hover {
          transform: rotate(-10deg) scale(1.06) !important;
          box-shadow: 0 16px 36px rgba(43, 29, 16, 0.28) !important;
        }

        /* Responsive breakdown */
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 48px;
            padding-top: 110px;
          }
          .hero-text-col {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-visual-col {
            order: 1;
            max-width: 460px;
            margin: 0 auto;
            min-height: auto !important;
          }
          .hero-cta-row { justify-content: center !important; }
          .hero-stats-row { justify-content: center !important; }
        }

        @media (max-width: 600px) {
          .hero-visual-col { max-width: 320px !important; }
          .hero-grid { padding-top: 100px !important; padding-bottom: 48px !important; }
          .hero-btn-primary, .hero-btn-outline { padding: 13px 28px !important; font-size: 0.85rem !important; }
          .hero-qv-pill { padding: 7px 14px !important; font-size: 0.7rem !important; bottom: 10px !important; }
        }
      `}</style>

      <section
        id="home"
        aria-label="Hero — Jiri Bakes artisan bakery"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: isNight
            ? 'linear-gradient(170deg, #09101F 0%, #0F1D38 45%, #070D1A 100%)'
            : 'linear-gradient(170deg, #F8F4E8 0%, #F5EFE0 40%, #FAF6EC 100%)',
          transition: 'background 0.5s ease',
        }}
      >
        {/* ─── Van Gogh Celestial Background Swirls & Starry Rings ─── */}
        {isNight ? (
          <>
            <div aria-hidden="true" style={{ position: 'absolute', top: '-10%', right: '0%', width: 620, height: 620, borderRadius: '50%', border: '2px solid rgba(245,211,92,0.18)', animation: 'starry-swirl-slow 40s linear infinite', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '5%', right: '8%', width: 440, height: 440, borderRadius: '50%', border: '1.5px dashed rgba(245,211,92,0.22)', animation: 'starry-swirl-slow 30s linear infinite reverse', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '15%', right: '15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,211,92,0.15) 0%, rgba(19,32,62,0.3) 50%, transparent 75%)', filter: 'blur(10px)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '20%', left: '15%', width: 10, height: 10, borderRadius: '50%', background: '#F5D35C', boxShadow: '0 0 16px #F5D35C', animation: 'starry-twinkle 3s ease-in-out infinite', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '35%', left: '8%', width: 6, height: 6, borderRadius: '50%', background: '#FFFDF5', boxShadow: '0 0 10px #FFFDF5', animation: 'starry-twinkle 2.5s ease-in-out 1s infinite', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: '25%', right: '35%', width: 8, height: 8, borderRadius: '50%', background: '#FF9E00', boxShadow: '0 0 14px #FF9E00', animation: 'starry-twinkle 4s ease-in-out 0.5s infinite', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', border: '2px solid rgba(82,183,136,0.15)', pointerEvents: 'none' }} />
          </>
        ) : (
          <>
            <div aria-hidden="true" style={{ position: 'absolute', top: '-8%', right: '5%', width: 520, height: 520, borderRadius: '50%', border: '1.5px solid rgba(245,211,92,0.25)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '2%', right: '10%', width: 360, height: 360, borderRadius: '50%', border: '1px solid rgba(40,85,28,0.07)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '12%', left: '18%', width: 160, height: 160, borderRadius: '48% 52% 55% 45%', border: '1px solid rgba(232,123,50,0.1)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', bottom: '-12%', left: '-4%', width: 440, height: 440, borderRadius: '50%', border: '1.5px solid rgba(245,211,92,0.16)', pointerEvents: 'none' }} />
            <div aria-hidden="true" style={{ position: 'absolute', top: '30%', right: 0, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,211,92,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          </>
        )}

        {/* ─── Main Content Grid ─── */}
        <div ref={ref} className="hero-grid hero-reveal">

          {/* ════════════ LEFT COLUMN — Text Content ════════════ */}
          <div className="hero-text-col">

            {/* Location & Gallery Badge */}
            <div
              className="hero-stagger-1"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                padding: '9px 20px',
                background: isNight ? 'rgba(245, 211, 92, 0.15)' : 'rgba(40,85,28,0.07)',
                borderRadius: 9999, marginBottom: 32,
                border: isNight ? '1px solid rgba(245, 211, 92, 0.35)' : '1px solid rgba(40,85,28,0.08)',
                boxShadow: isNight ? '0 0 16px rgba(245, 211, 92, 0.18)' : 'none',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isNight ? '#F5D35C' : 'var(--color-green, #28551C)',
                display: 'inline-block', flexShrink: 0,
                boxShadow: isNight ? '0 0 8px #F5D35C' : 'none',
              }} />
              <span style={{
                fontSize: '0.78rem', fontWeight: 600,
                color: isNight ? '#F5D35C' : 'var(--color-green, #28551C)',
                letterSpacing: '0.4px',
              }}>
                {isNight ? 'Lokanthali, Nepal · Starry Night Bakery' : 'Lokanthali, Nepal · Simply Organic'}
              </span>
            </div>

            {/* H1 Headline */}
            <h1
              className="hero-stagger-2"
              style={{
                fontSize: 'clamp(3.2rem, 7.5vw, 5.8rem)',
                fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)',
                fontWeight: 400, lineHeight: 1.02, marginBottom: 8, letterSpacing: '-1.5px',
              }}
            >
              <span style={{ color: 'var(--color-brown-deep, #2B1D10)', display: 'block' }}>Baked</span>
              <span style={{ color: isNight ? '#F5D35C' : 'var(--color-green, #28551C)', display: 'block', marginTop: '-4px' }}>
                Like Art
                <span style={{ color: 'var(--color-orange, #E87B32)', fontSize: '0.62em', verticalAlign: 'baseline' }}>.</span>
              </span>
            </h1>

            {/* Animated hand-drawn golden Van Gogh underline */}
            <div
              className="hero-stagger-2"
              style={{ position: 'relative', display: 'block', height: 14, marginBottom: 28, width: 'min(65%, 320px)' }}
            >
              <svg
                aria-hidden="true"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 14 }}
                viewBox="0 0 320 14" fill="none" preserveAspectRatio="none"
              >
                <path
                  d="M4 11 C 30 4, 60 3, 90 6 C 120 9, 150 4, 180 5 C 210 6, 240 9, 270 5 C 290 3, 310 6, 316 8"
                  stroke="#F5D35C" strokeWidth="3.5" strokeLinecap="round" fill="none"
                  style={{
                    strokeDasharray: 400,
                    strokeDashoffset: 400,
                    animation: 'hero-drawLine 1.4s ease forwards 0.3s',
                  }}
                />
              </svg>
            </div>

            {/* Subtitle Paragraph */}
            <p
              className="hero-stagger-3"
              style={{
                fontSize: 'clamp(0.92rem, 1.4vw, 1.05rem)',
                color: 'var(--color-text-tertiary, #8A7654)',
                lineHeight: 1.82, marginBottom: 40,
                maxWidth: 480, fontWeight: 400,
              }}
            >
              Handcrafted organic breads, cakes, and morning pastries.
              Baked fresh daily at dawn in Lokanthali, Nepal &mdash; where flour meets feeling.
            </p>

            {/* CTA Buttons Row */}
            <div
              className="hero-stagger-4 hero-cta-row"
              style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 56, flexWrap: 'wrap' }}
            >
              <a href="#collection" className="hero-btn-primary">
                Shop the Gallery &rarr;
              </a>
              <a href="#about" className="hero-btn-outline">
                Explore Our Story
              </a>
            </div>

            {/* Stats Row */}
            <div
              className="hero-stagger-5 hero-stats-row"
              style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}
            >
              <div>
                <div style={{
                  fontFamily: 'var(--font-display, "DM Serif Display", serif)',
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                  color: isNight ? '#F5D35C' : 'var(--color-green, #28551C)',
                  lineHeight: 1, marginBottom: 4,
                }}>150+</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                  Recipes
                </div>
              </div>

              <div style={{ width: 1, height: 32, background: 'var(--color-border)' }} />

              <div>
                <div style={{
                  fontFamily: 'var(--font-display, "DM Serif Display", serif)',
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                  color: isNight ? '#F5D35C' : 'var(--color-green, #28551C)',
                  lineHeight: 1, marginBottom: 4,
                }}>100%</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                  Organic
                </div>
              </div>

              <div style={{ width: 1, height: 32, background: 'var(--color-border)' }} />

              <div>
                <div style={{
                  fontFamily: 'var(--font-display, "DM Serif Display", serif)',
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)',
                  color: isNight ? '#F5D35C' : 'var(--color-green, #28551C)',
                  lineHeight: 1, marginBottom: 4,
                }}>5&#9733;</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                  Reviews
                </div>
              </div>
            </div>

          </div>

          {/* ════════════ RIGHT COLUMN — Visual Composition ════════════ */}
          <div
            className="hero-visual-col"
            style={{ position: 'relative', width: '100%', minHeight: 480 }}
          >
            {/* Background Sunflower / Starburst Glow Rays */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', top: '-14%', right: '-8%',
                width: 320, height: 320, pointerEvents: 'none', zIndex: 1,
                opacity: isNight ? 0.35 : 0.6,
                animation: 'hero-subtlePulse 4s ease-in-out infinite',
              }}
            >
              <svg className="absolute -top-60 -right-8 w-36 h-36 md:-top-50 md:w-64 md:h-64 float-animate opacity-80" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="345" cy="200" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(0 345 200)"></ellipse><ellipse cx="333.96253221413656" cy="255.489097692938" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(22.5 333.96253221413656 255.489097692938)"></ellipse><ellipse cx="302.5304832720494" cy="302.5304832720494" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(45 302.5304832720494 302.5304832720494)"></ellipse><ellipse cx="255.48909769293803" cy="333.96253221413656" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(67.5 255.48909769293803 333.96253221413656)"></ellipse><ellipse cx="200" cy="345" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(90 200 345)"></ellipse><ellipse cx="144.510902307062" cy="333.96253221413656" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(112.5 144.510902307062 333.96253221413656)"></ellipse><ellipse cx="97.46951672795062" cy="302.5304832720494" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(135 97.46951672795062 302.5304832720494)"></ellipse><ellipse cx="66.03746778586343" cy="255.48909769293803" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(157.5 66.03746778586343 255.48909769293803)"></ellipse><ellipse cx="55" cy="200.00000000000003" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(180 55 200.00000000000003)"></ellipse><ellipse cx="66.03746778586338" cy="144.51090230706205" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(202.5 66.03746778586338 144.51090230706205)"></ellipse><ellipse cx="97.46951672795058" cy="97.46951672795062" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(225 97.46951672795058 97.46951672795062)"></ellipse><ellipse cx="144.51090230706203" cy="66.03746778586341" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(247.5 144.51090230706203 66.03746778586341)"></ellipse><ellipse cx="199.99999999999997" cy="55" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(270 199.99999999999997 55)"></ellipse><ellipse cx="255.48909769293806" cy="66.03746778586344" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(292.5 255.48909769293806 66.03746778586344)"></ellipse><ellipse cx="302.53048327204937" cy="97.46951672795058" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(315 302.53048327204937 97.46951672795058)"></ellipse><ellipse cx="333.96253221413656" cy="144.51090230706203" rx="18" ry="9" fill="#f5c842" opacity="0.55" transform="rotate(337.5 333.96253221413656 144.51090230706203)"></ellipse><circle cx="200" cy="200" r="115" fill="#f5c842" opacity="0.18"></circle><circle cx="200" cy="200" r="90" fill="#f5c842" opacity="0.22"></circle><circle cx="200" cy="200" r="65" fill="#f5c842" opacity="0.30"></circle><circle cx="200" cy="200" r="40" fill="#e8843a" opacity="0.35"></circle></svg>
              <svg className="absolute inset-0 w-full h-full pointer-events-none swirl-animate opacity-80" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="400" cy="400" r="300" stroke="#f5c842" strokeWidth="2" opacity="0.08"></circle><circle cx="400" cy="400" r="250" stroke="#f5c842" strokeWidth="1.5" opacity="0.06"></circle><path d="M400 100 C550 200, 700 350, 600 500 C500 650, 250 700, 150 550 C50 400, 100 180, 280 130 C380 100, 450 180, 500 280" stroke="#2d5016" strokeWidth="3" fill="none" opacity="0.07"></path><path d="M200 200 C320 150, 520 200, 600 350 C680 500, 580 680, 420 700 C260 720, 100 580, 120 420 C140 280, 260 230, 350 250" stroke="#2d5016" strokeWidth="2" fill="none" opacity="0.05"></path><path d="M300 80 C500 120, 650 300, 620 480 C590 660, 400 750, 220 680 C40 610, 40 380, 150 250 C220 170, 350 80, 400 100" stroke="#e8843a" strokeWidth="2" fill="none" opacity="0.06"></path><ellipse cx="160" cy="180" rx="60" ry="35" stroke="#f5c842" strokeWidth="2" fill="none" opacity="0.1" transform="rotate(-30 160 180)"></ellipse><ellipse cx="640" cy="600" rx="70" ry="40" stroke="#f5c842" strokeWidth="2" fill="none" opacity="0.08" transform="rotate(15 640 600)"></ellipse><path d="M120 400 C150 350, 200 380, 180 430 C160 480, 100 460, 120 400Z" fill="#2d5016" opacity="0.04"></path><path d="M620 200 C650 150, 700 180, 680 230 C660 280, 600 260, 620 200Z" fill="#f5c842" opacity="0.06"></path></svg>
            </div>

            {/* Main Artisan Showcase Card — click opens full quick view */}
            <div
              className="hero-main-img-wrap"
              role={onQuickView ? 'button' : undefined}
              tabIndex={onQuickView ? 0 : undefined}
              aria-label={onQuickView ? `Quick view ${cakeItem.name}` : undefined}
              onClick={onQuickView}
              onKeyDown={onQuickView ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onQuickView(); } } : undefined}
              style={{
                width: '88%',
                aspectRatio: '4 / 4.4',
                borderRadius: 24,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: isNight ? '0 16px 48px rgba(0, 0, 0, 0.55)' : '0 14px 44px rgba(43, 29, 16, 0.14)',
                border: '2.5px solid #F5D35C',
                zIndex: 3,
                cursor: onQuickView ? 'pointer' : 'default',
                outline: 'none',
              }}
            >
              <img
                src={cakeItem.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80'}
                alt={cakeItem.name}
                className="hero-main-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Artisan Corner Accents */}
              <svg aria-hidden="true" style={{ position: 'absolute', top: 12, left: 12, width: 32, height: 32, opacity: 0.85 }} viewBox="0 0 32 32" fill="none">
                <path d="M2 30 L2 6 Q2 2 6 2 L30 2" stroke="#F5D35C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </svg>
              <svg aria-hidden="true" style={{ position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, opacity: 0.85 }} viewBox="0 0 32 32" fill="none">
                <path d="M30 2 L30 26 Q30 30 26 30 L2 30" stroke="#F5D35C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </svg>

              {/* Quick View pill */}
              {onQuickView && (
                <span
                  className="hero-qv-pill"
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 18px',
                    borderRadius: 9999,
                    background: 'rgba(255, 253, 245, 0.95)',
                    border: '1.5px solid #F5D35C',
                    boxShadow: '0 6px 18px rgba(43, 29, 16, 0.25)',
                    color: 'var(--color-brown-deep, #2B1D10)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Quick View
                </span>
              )}
            </div>

            {/* Overlapping Tilted Croissant Photo */}
            <div
              className="hero-croissant-wrap"
              style={{
                position: 'absolute',
                bottom: '-6%',
                right: '-4%',
                width: '42%',
                aspectRatio: '1',
                borderRadius: 20,
                overflow: 'hidden',
                border: '3.5px solid #FFFFFF',
                boxShadow: '0 14px 36px rgba(43, 29, 16, 0.22)',
                transform: 'rotate(-7deg)',
                zIndex: 5,
                background: '#FAF6EE',
                cursor: 'pointer',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1623334044303-241021148842?w=600&auto=format&fit=crop&q=80"
                alt="Hand-laminated flaky French butter croissant"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Floating Dynamic "Bake of the Week" Card with Wishlist Button — click opens full quick view */}
            <div
              role={onQuickView ? 'button' : undefined}
              tabIndex={onQuickView ? 0 : undefined}
              aria-label={onQuickView ? `Quick view ${cakeItem.name}` : undefined}
              onClick={onQuickView}
              onKeyDown={onQuickView ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onQuickView(); } } : undefined}
              style={{
                position: 'absolute',
                top: '-4%',
                left: '-6%',
                padding: '16px 20px',
                background: isNight ? 'rgba(18, 29, 54, 0.94)' : 'rgba(255, 253, 245, 0.94)',
                borderRadius: 18,
                border: '1.5px solid #F5D35C',
                backdropFilter: 'blur(16px)',
                boxShadow: isNight ? '0 12px 32px rgba(0, 0, 0, 0.5)' : '0 12px 32px rgba(43, 29, 16, 0.12)',
                zIndex: 6,
                animation: 'hero-floatUp 5s ease-in-out infinite',
                minWidth: 200,
                cursor: onQuickView ? 'pointer' : 'default',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{
                  fontSize: '0.62rem',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: isNight ? '#F5D35C' : 'var(--color-green, #28551C)',
                  fontWeight: 700,
                }}>
                  Bake of the Week
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleWishlist({ id: cakeItem.id, name: cakeItem.name, price: cakeItem.price, img: cakeItem.image || '' }); }}
                  title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    color: isFav ? '#e74c3c' : 'var(--color-text-tertiary)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? '#e74c3c' : 'none'} stroke={isFav ? '#e74c3c' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              <div style={{
                fontFamily: 'var(--font-display, "DM Serif Display", serif)',
                fontSize: '1rem',
                color: 'var(--color-brown-deep, #2B1D10)',
                lineHeight: 1.2,
                marginBottom: 4,
              }}>
                {cakeItem.name}
              </div>
              <div style={{
                fontSize: '0.82rem',
                color: isNight ? '#F5D35C' : 'var(--color-orange, #E87B32)',
                fontWeight: 700,
                fontFamily: 'var(--font-display, "DM Serif Display", serif)',
              }}>
                NPR {cakeItem.price.toLocaleString()}
              </div>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}
