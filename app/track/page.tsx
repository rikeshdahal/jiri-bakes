'use client';

import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TrackedItem {
  name: string;
  quantity: number;
  price: number;
}

interface TrackedOrder {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  delivery_date?: string;
  delivery_time?: string;
  payment_method?: string;
  items: TrackedItem[];
  total: number;
  status: string;
  created_at: string;
}

const STEPS = ['pending', 'baking', 'ready', 'completed'] as const;
const STEP_LABELS: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Order Received',
  preparing: 'Being Prepared',
  baking: 'Being Baked',
  ready: 'Ready for Pickup',
  delivered: 'Delivered',
  completed: 'Delivered',
  cancelled: 'Cancelled',
};

function stepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === 'cancelled') return -1;
  if (s === 'pending' || s === 'confirmed') return 0;
  if (s === 'baking' || s === 'preparing') return 1;
  if (s === 'ready') return 2;
  return 3; // delivered / completed
}

function TrackPageInner() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchTrack = useCallback(async (query: string, silent = false) => {
    const q = query.trim();
    if (!q) {
      setError('Enter your Order ID (e.g. JB-2026-XXXXXX) or phone number.');
      return;
    }
    if (!silent) {
      setLoading(true);
      setError('');
      setOrders([]);
    }
    try {
      const looksLikeId = /[a-z]/i.test(q) || q.includes('-');
      const attempt = async (qs: string) => {
        const res = await fetch(`/api/track?${qs}`);
        const json = await res.json().catch(() => ({}));
        return { res, json };
      };
      if (looksLikeId) {
        const first = await attempt(`id=${encodeURIComponent(q)}`);
        if (first.res.ok) {
          setOrders(first.json.data || []);
          setError('');
          setLastUpdated(new Date().toLocaleTimeString());
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('id', q);
            window.history.replaceState(null, '', url.toString());
          } catch {
            // ignore
          }
          return;
        }
        const second = await attempt(`phone=${encodeURIComponent(q)}`);
        if (!second.res.ok) {
          if (!silent) setError(second.json.error || first.json.error || 'No orders found.');
          return;
        }
        setOrders(second.json.data || []);
        setError('');
        setLastUpdated(new Date().toLocaleTimeString());
        return;
      }
      const { res, json } = await attempt(`phone=${encodeURIComponent(q)}`);
      if (!res.ok) {
        if (!silent) setError(json.error || 'No orders found.');
        return;
      }
      setOrders(json.data || []);
      setError('');
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      if (!silent) setError('Connection error. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Auto-fill from email link (?id=JB-...) and start live polling.
  useEffect(() => {
    const id = (searchParams.get('id') || '').trim();
    if (id) {
      setInput(id);
      setAuto(true);
      fetchTrack(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live refresh every 15s while an order is on screen.
  useEffect(() => {
    if (!auto || !input.trim() || orders.length === 0) return;
    const t = setInterval(() => fetchTrack(input, true), 15_000);
    return () => clearInterval(t);
  }, [auto, input, orders.length, fetchTrack]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAuto(true);
    fetchTrack(input);
  };

  const current = orders[0];
  const idx = current ? stepIndex(current.status) : -2;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-cream)',
        padding: 'calc(var(--header-height, 76px) + 32px) clamp(16px, 4vw, 40px) 64px',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', marginBottom: 8 }}>
          <Link href="/" style={{ fontSize: '.8rem', color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>
            ← Back to Bakery
          </Link>
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            color: 'var(--color-brown-deep)',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Track Your <span style={{ color: 'var(--color-green)' }}>Order</span>
        </h1>
        <p style={{ textAlign: 'center', fontSize: '.88rem', color: 'var(--color-text-tertiary)', marginBottom: 24, lineHeight: 1.6 }}>
          Enter your <strong>Order ID</strong> from the confirmation email, or the{' '}
          <strong>phone number</strong> used when ordering. This page refreshes live.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Order ID (JB-2026-XXXXXX) or phone number"
            style={{
              flex: 1,
              padding: '13px 16px',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '.9rem',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 24px',
              borderRadius: 12,
              background: 'var(--color-green)',
              color: '#FFFDF5',
              fontWeight: 700,
              fontSize: '.88rem',
              border: 'none',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '…' : 'Track'}
          </button>
        </form>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(192,57,43,.09)',
              color: '#c0392b',
              fontSize: '.85rem',
              border: '1px solid rgba(192,57,43,.2)',
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {orders.length > 1 && (
          <p style={{ fontSize: '.8rem', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
            {orders.length} orders found — showing live status for each:
          </p>
        )}

        {orders.map((order) => {
          const i = stepIndex(order.status);
          const cancelled = order.status.toLowerCase() === 'cancelled';
          return (
            <div
              key={order.id}
              style={{
                background: 'var(--color-card-bg)',
                borderRadius: 18,
                border: '1px solid var(--color-border)',
                padding: 'clamp(18px, 3vw, 28px)',
                marginBottom: 18,
                boxShadow: '0 8px 28px rgba(43,29,16,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.95rem', color: 'var(--color-brown-deep)' }}>
                  {order.id}
                </span>
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: 9999,
                    fontSize: '.76rem',
                    fontWeight: 700,
                    background: cancelled ? 'rgba(192,57,43,.1)' : 'rgba(40,85,28,.1)',
                    color: cancelled ? '#c0392b' : 'var(--color-green)',
                    border: `1px solid ${cancelled ? 'rgba(192,57,43,.25)' : 'rgba(40,85,28,.25)'}`,
                  }}
                >
                  {STEP_LABELS[order.status.toLowerCase()] ?? order.status}
                </span>
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--color-text-tertiary)', marginBottom: 18 }}>
                {order.customer_name} · {order.payment_method} · Ordered{' '}
                {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>

              {!cancelled && (
                <div style={{ display: 'flex', marginBottom: 22 }}>
                  {STEPS.map((s, si) => {
                    const done = si <= i;
                    return (
                      <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        {si < STEPS.length - 1 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 13,
                              left: '50%',
                              width: '100%',
                              height: 3,
                              background: si < i ? 'var(--color-green)' : 'var(--color-border)',
                              zIndex: 0,
                            }}
                          />
                        )}
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: done ? 'var(--color-green)' : 'var(--color-surface-muted)',
                            color: done ? '#FFFDF5' : 'var(--color-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '.75rem',
                            fontWeight: 700,
                            zIndex: 1,
                            border: `2px solid ${done ? 'var(--color-green)' : 'var(--color-border)'}`,
                          }}
                        >
                          {done ? '✓' : si + 1}
                        </div>
                        <div
                          style={{
                            fontSize: '.64rem',
                            fontWeight: 600,
                            color: done ? 'var(--color-green)' : 'var(--color-text-tertiary)',
                            marginTop: 6,
                            textAlign: 'center',
                            lineHeight: 1.35,
                          }}
                        >
                          {STEP_LABELS[s]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(order.delivery_date || order.delivery_time) && (
                <div
                  style={{
                    background: 'rgba(245,211,92,.1)',
                    border: '1px solid rgba(245,211,92,.25)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: '.82rem',
                    color: 'var(--color-brown-deep)',
                    marginBottom: 14,
                  }}
                >
                  Delivery slot: <strong>{order.delivery_date}</strong>
                  {order.delivery_time ? (
                    <>
                      {' '}| <strong>{order.delivery_time}</strong>
                    </>
                  ) : null}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {order.items?.map((it, k) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      fontSize: '.85rem',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ color: 'var(--color-brown-deep)', fontWeight: 600 }}>
                      {it.name} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>× {it.quantity}</span>
                    </span>
                    <span style={{ color: 'var(--color-green)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      NPR {(it.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <span style={{ fontSize: '.85rem', color: 'var(--color-text-tertiary)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-green)' }}>
                  NPR {order.total.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {orders.length > 0 && lastUpdated && (
          <p style={{ textAlign: 'center', fontSize: '.74rem', color: 'var(--color-text-tertiary)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#52B788', marginRight: 6 }} />
            Live · last updated {lastUpdated} · refreshes every 15 seconds
          </p>
        )}

        {orders.length === 0 && !error && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)', fontSize: '.88rem' }}>
            Your live order status will appear here.
          </div>
        )}
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', background: 'var(--color-cream)', padding: 80, textAlign: 'center' }}>Loading…</main>}>
      <TrackPageInner />
    </Suspense>
  );
}
