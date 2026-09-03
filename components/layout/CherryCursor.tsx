'use client';

import { useEffect, useRef, useState } from 'react';

export default function CherryCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let posX = 0;
    let posY = 0;
    let mouseX = -100;
    let mouseY = -100;
    let isHovering = false;
    let isClicking = false;
    let rafId: number;

    const updatePosition = () => {
      // Smooth interpolation for fluid movement
      posX += (mouseX - posX) * 0.45;
      posY += (mouseY - posY) * 0.45;

      const scale = isClicking ? 0.88 : isHovering ? 1.25 : 1;
      const rotate = isClicking ? 10 : isHovering ? -12 : 0;

      cursor.style.transform = `translate3d(${posX - 6}px, ${posY - 11}px, 0) scale(${scale}) rotate(${rotate}deg)`;
      rafId = requestAnimationFrame(updatePosition);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('a, button, [role="button"], input, textarea, select, label, .collection-card, summary')) {
        isHovering = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('a, button, [role="button"], input, textarea, select, label, .collection-card, summary')) {
        isHovering = false;
      }
    };

    const handleMouseDown = () => {
      isClicking = true;
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [visible]);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="cherry-cursor-container"
      style={{
        opacity: visible ? 1 : 0,
      }}
    >
      <img
        src="/cherry.png"
        alt=""
        draggable={false}
        className="cherry-cursor-img"
      />
    </div>
  );
}
