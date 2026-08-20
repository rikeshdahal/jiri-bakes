'use client';

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import type { ToastType } from '@/types';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const typeColors: Record<ToastType, string> = {
    success: '#27ae60',
    error: 'var(--color-error)',
    info: 'var(--color-gold)',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none',
          width: 'max-content',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              padding: '12px 20px',
              borderRadius: 50,
              background: '#1C2C19',
              color: '#FFFDF5',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              border: `1.5px solid ${typeColors[toast.type]}`,
              fontSize: '0.86rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              maxWidth: '400px',
              animation: 'toastSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              style={{ background: 'none', border: 'none', color: 'rgba(255,253,245,0.55)', fontSize: '1rem', padding: '2px 0', cursor: 'pointer', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
