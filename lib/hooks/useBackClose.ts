'use client';

import { useEffect, useRef } from 'react';

/**
 * Intercepts mobile back button / swipe back gesture so that pressing
 * "Back" closes the open modal or drawer instead of navigating away and
 * exiting the entire website.
 */
export function useBackClose(isOpen: boolean, onClose: () => void, modalId: string) {
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isOpen) return;

    const stateKey = `overlay_${modalId}`;

    // Push a harmless history entry when the overlay opens
    const state = window.history.state || {};
    window.history.pushState({ ...state, [stateKey]: true }, '');

    const handlePopState = () => {
      if (isOpenRef.current) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState, { once: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // NOTE: We deliberately do NOT call window.history.back() here.
      // Calling history.back() inside effect cleanup causes React StrictMode
      // and fast-refresh to trigger premature popstate events that close modals instantly!
    };
  }, [isOpen, modalId]);
}
