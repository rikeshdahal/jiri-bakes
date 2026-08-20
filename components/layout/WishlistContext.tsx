'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useToast } from '@/components/feedback/Toast';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  img: string;
  description?: string;
  category?: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  isOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  count: 0,
  isOpen: false,
  openWishlist: () => {},
  closeWishlist: () => {},
  isInWishlist: () => false,
  toggleWishlist: () => {},
  removeFromWishlist: () => {},
  clearWishlist: () => {},
});

export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { showToast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jiri_wishlist');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('jiri_wishlist', JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }, [items, isLoaded]);

  const openWishlist = useCallback(() => setIsOpen(true), []);
  const closeWishlist = useCallback(() => setIsOpen(false), []);

  const isInWishlist = useCallback(
    (id: string) => {
      return items.some((it) => it.id === id);
    },
    [items]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      const exists = items.some((it) => it.id === item.id);
      if (exists) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        showToast?.(`Removed "${item.name}" from your wishlist`, 'info');
      } else {
        setItems((prev) => [...prev, item]);
        showToast?.(`Added "${item.name}" to your wishlist ❤️`, 'success');
      }
    },
    [items, showToast]
  );

  const removeFromWishlist = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        isOpen,
        openWishlist,
        closeWishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
