'use client';

import React from 'react';

interface BakeryPatternProps {
  /** 0-1 opacity override (default uses CSS). */
  opacity?: number;
  /** Tile size in px (responsive fallback in CSS still applies if omitted). */
  size?: number | { desktop?: number; tablet?: number; mobile?: number };
  /** Show a readability wash gradient on top of pattern. */
  wash?: boolean | 'cream';
  /** Extra className for wrapper. */
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * BakeryPattern — realistic hand-drawn bakery doodle background.
 * Wraps any section to give it the Image-1 style seamless pattern
 * (donuts, croissants, cupcakes, rolling pins, whisks...) while
 * keeping content readable and fully responsive.
 *
 * Usage:
 * <BakeryPattern wash>
 *   <YourSectionContent />
 * </BakeryPattern>
 *
 * Or as an absolute layer:
 * <BakeryPattern absolute opacity={0.1} size={320} />
 */
export default function BakeryPattern({
  opacity,
  size,
  wash = true,
  className = '',
  style,
  children,
}: BakeryPatternProps) {
  const isAbsoluteLayer = !children;

  const tileSize =
    typeof size === 'number'
      ? `${size}px`
      : size?.desktop
        ? `${size.desktop}px`
        : undefined;

  if (isAbsoluteLayer) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/bakery-pattern.svg')",
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            backgroundSize: tileSize ?? 'clamp(200px, 32vw, 420px)',
            opacity: opacity ?? 0.11,
          }}
        />
        {wash && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                wash === 'cream'
                  ? 'linear-gradient(180deg, rgba(255,253,245,0.72) 0%, rgba(255,253,245,0.5) 50%, rgba(255,253,245,0.72) 100%)'
                  : 'linear-gradient(180deg, rgba(248,244,232,0.7) 0%, rgba(248,244,232,0.5) 50%, rgba(248,244,232,0.7) 100%)',
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`bakery-pattern ${wash ? (wash === 'cream' ? 'bakery-pattern-wash cream-wash' : 'bakery-pattern-wash') : ''} ${className}`}
      style={style}
    >
      {/* Inline override layer for custom size/opacity (still responsive) */}
      {(opacity !== undefined || tileSize) && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: "url('/bakery-pattern.svg')",
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            backgroundSize: tileSize ?? 'clamp(200px, 32vw, 420px)',
            opacity: opacity ?? 0.11,
          }}
        />
      )}
      {children}
    </div>
  );
}
