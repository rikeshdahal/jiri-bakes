'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ToastProvider, useToast } from '@/components/feedback/Toast';
import CartDrawer from './CartDrawer';
import { ThemeProvider } from './ThemeContext';
import { WishlistProvider } from './WishlistContext';
import WishlistDrawer from './WishlistDrawer';
import FloatingActions from '@/components/feedback/FloatingActions';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  img: string;
  unit?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: { id?: string; name: string; price: number; img: string; unit?: string }) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  subtotal: 0,
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  addItem: () => {},
  updateQty: () => {},
  removeItem: () => {},
  clearCart: () => {},
});

export const useCart = () => useContext(CartContext);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { showToast } = useToast();

  // Initialize cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jiri_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('jiri_cart', JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }, [items, isLoaded]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (item: { id?: string; name: string; price: number; img: string; unit?: string }) => {
      const itemId = item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setItems((prev) => {
        const existing = prev.find((c) => c.id === itemId || c.name === item.name);
        if (existing) {
          return prev.map((c) =>
            c.id === existing.id ? { ...c, qty: c.qty + 1 } : c
          );
        }
        return [
          ...prev,
          {
            id: itemId,
            name: item.name,
            price: item.price,
            qty: 1,
            img: item.img || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop',
            unit: item.unit,
          },
        ];
      });

      showToast?.(`Added "${item.name}" to your bag`, 'success');
    },
    [showToast]
  );

  const updateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <WishlistDrawer />
            <FloatingActions />
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
