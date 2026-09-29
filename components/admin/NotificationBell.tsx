'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface OrderNotification {
  id: string;
  customer_name: string;
  payment_method?: string;
  total: number;
  items: { name: string; quantity: number }[];
  created_at: string;
  seen?: boolean;
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pollOk, setPollOk] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 72, right: 16 });
  const bellWrapRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track viewport (mobile breakpoint) + anchor the desktop panel under the bell.
  // The admin header uses backdrop-filter / sticky positioning, which creates a
  // containing block for fixed children — so the panel is portalled to
  // document.body and positioned from the bell's viewport rect instead.
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth <= 640;
      setIsMobile(mobile);
      if (!mobile && bellBtnRef.current) {
        const r = bellBtnRef.current.getBoundingClientRect();
        setPanelPos({
          top: Math.round(r.bottom + 10),
          right: Math.max(12, Math.round(window.innerWidth - r.right)),
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [panelOpen]);

  // Close panel when clicking outside / pressing Escape
  useEffect(() => {
    if (!panelOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(t) &&
        bellWrapRef.current && !bellWrapRef.current.contains(t)
      ) {
        setPanelOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);

  // Lock background scroll while the sheet is open on mobile
  useEffect(() => {
    if (!panelOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelOpen, isMobile]);

  // ── Alert helpers (sound + native notification + badge pulse) ──
  const playBeep = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      [523.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + idx * 0.16;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
      setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 600);
    } catch { /* audio unavailable — badge pulse still shows */ }
  };

  const showNativeNotification = (order: OrderNotification) => {
    try {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'granted') return;
      new Notification(`New Order: ${order.customer_name}`, {
        body: `NPR ${order.total.toLocaleString()} – ${order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}`,
        icon: '/jiri logo.jpg',
      });
    } catch { /* ignore */ }
  };

  const alertForNewOrder = (order: OrderNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === order.id)) return prev;
      return [{ ...order, seen: false }, ...prev].slice(0, 50);
    });
    setPulse(true);
    setTimeout(() => setPulse(false), 3000);
    playBeep();
    showNativeNotification(order);
  };

  // ── Live connection: SSE fast-path + polling fallback ──
  // SSE alone is unreliable in production (in-memory fan-out breaks across
  // serverless instances, events are missed while the tab is closed, and the
  // list is wiped on refresh). Polling /api/orders guarantees notifications
  // still arrive no matter what.
  useEffect(() => {
    let closed = false;
    let seeded = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const knownIds = new Set<string>();

    const POLL_MS = 20_000;

    const toNotif = (o: {
      id: string;
      customer_name: string;
      payment_method?: string;
      total: number;
      items: { name: string; quantity: number }[];
      created_at: string;
    }): OrderNotification => ({
      id: String(o.id),
      customer_name: o.customer_name ?? 'Guest Customer',
      payment_method: o.payment_method,
      total: Number(o.total) || 0,
      items: Array.isArray(o.items)
        ? o.items.map((i) => ({ name: String(i.name ?? 'Item'), quantity: Number(i.quantity) || 1 }))
        : [],
      created_at: o.created_at ?? new Date().toISOString(),
    });

    const poll = async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (!res.ok) return;
        setPollOk(true);
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        if (closed) return;
        if (!seeded) {
          // First load: seed history so refresh doesn't wipe the panel.
          // Register ALL existing ids (so old orders never false-alert),
          // but display only the latest 20. Historical orders start as
          // seen — only genuinely new ones alert.
          seeded = true;
          const all = list.map((o: Parameters<typeof toNotif>[0]) => toNotif(o));
          all.forEach((n: OrderNotification) => knownIds.add(n.id));
          setNotifications(all.slice(0, 20).map((n: OrderNotification) => ({ ...n, seen: true })));
          setPollOk(true);
          return;
        }
        // Later polls: anything unknown is a new order → alert.
        for (const raw of list) {
          const n = toNotif(raw);
          if (!knownIds.has(n.id)) {
            knownIds.add(n.id);
            alertForNewOrder(n);
          }
        }
      } catch { /* network blip — next poll retries */ }
    };

    const connectSse = () => {
      if (closed) return;
      try {
        const es = new EventSource('/api/notifications');
        esRef.current = es;

        es.onopen = () => {
          if (!closed) setConnected(true);
        };

        es.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === 'new_order' && data.order?.id) {
              const n = toNotif(data.order);
              if (!knownIds.has(n.id)) {
                knownIds.add(n.id);
                alertForNewOrder(n);
              }
            }
          } catch { /* ignore parse errors */ }
        };

        es.onerror = () => {
          setConnected(false);
          try { es.close(); } catch { /* noop */ }
          if (esRef.current === es) esRef.current = null;
          // Reconnect after 5s (polling covers the gap meanwhile)
          if (!closed) {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectSse, 5000);
          }
        };
      } catch {
        if (!closed) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectSse, 5000);
        }
      }
    };

    poll(); // seed immediately
    const pollTimer = setInterval(poll, POLL_MS);
    connectSse();

    // Poll immediately when the tab becomes visible again (mobile sleeps timers)
    const onVisible = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      try { esRef.current?.close(); } catch { /* noop */ }
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unseenCount = notifications.filter((n) => !n.seen).length;

  const markAllSeen = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 74,
        left: 12,
        right: 12,
        width: 'auto',
        maxWidth: 'none',
        maxHeight: 'calc(100dvh - 96px)',
      }
    : {
        position: 'fixed',
        top: panelPos.top,
        right: panelPos.right,
        width: 340,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'min(480px, calc(100dvh - 96px))',
      };

  return (
    <div ref={bellWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <style>{`
        @keyframes bell-ring {
          0%   { transform: rotate(0deg); }
          10%  { transform: rotate(-15deg); }
          20%  { transform: rotate(15deg); }
          30%  { transform: rotate(-12deg); }
          40%  { transform: rotate(12deg); }
          50%  { transform: rotate(-8deg); }
          60%  { transform: rotate(8deg); }
          70%  { transform: rotate(-4deg); }
          80%  { transform: rotate(4deg); }
          90%  { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes notif-pop-in {
          from { opacity: 0; transform: translateY(-10px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notif-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .notif-panel-item {
          animation: notif-slide-in .25s ease forwards;
        }
        .notif-panel-portal {
          animation: notif-pop-in .22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .notif-backdrop {
          animation: notif-fade-in .2s ease forwards;
        }
        @media (max-width: 640px) {
          .notif-panel-portal {
            animation: notif-pop-in .25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          .admin-notif-bell-btn {
            width: 36px !important;
            height: 36px !important;
            border-radius: 9px !important;
          }
        }
        @media (max-width: 480px) {
          .admin-notif-bell-btn {
            width: 34px !important;
            height: 34px !important;
          }
        }
      `}</style>

      {/* Bell Button */}
      <button
        ref={bellBtnRef}
        className="admin-notif-bell-btn"
        onClick={() => {
          // Ask for browser-notification permission on user gesture
          // (browsers ignore permission requests made on page load).
          try {
            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
              Notification.requestPermission();
            }
          } catch { /* ignore */ }
          setPanelOpen((p) => !p);
        }}
        title="Order notifications"
        aria-label="Order notifications"
        aria-expanded={panelOpen}
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          background: unseenCount > 0 ? 'rgba(232,123,50,0.15)' : 'rgba(255,255,255,0.07)',
          border: unseenCount > 0 ? '1px solid rgba(232,123,50,0.35)' : '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all .2s',
        }}
      >
        <svg
          width="19" height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke={unseenCount > 0 ? '#E87B32' : '#94A3B8'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: pulse ? 'bell-ring .7s ease' : 'none' }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unseenCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9999,
            background: '#E87B32', color: '#fff',
            fontSize: '.6rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(232,123,50,.4)',
            animation: pulse ? 'bell-ring .7s ease' : 'none',
          }}>
            {unseenCount}
          </span>
        )}
      </button>

      {/* Notification Panel — portalled to body for perfect viewport positioning */}
      {mounted && panelOpen && createPortal(
        <>
          {/* Backdrop: dims content on mobile, transparent click-catcher on desktop */}
          <div
            className="notif-backdrop"
            onClick={() => setPanelOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: isMobile ? 'rgba(4, 8, 16, 0.6)' : 'transparent',
              backdropFilter: isMobile ? 'blur(2px)' : undefined,
              zIndex: 9998,
            }}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Order notifications"
            className="notif-panel-portal"
            style={{
              ...panelStyle,
              background: '#0D1A33',
              border: '1px solid rgba(245, 211, 92, 0.2)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Panel Header */}
            <div style={{
              padding: '14px 16px 14px 18px',
              borderBottom: '1px solid rgba(245, 211, 92, 0.15)',
              background: '#0A1226',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#FFFDF5' }}>Live Order Alerts</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: (connected || pollOk) ? '#27ae60' : '#555', flexShrink: 0 }} />
                  <span style={{ fontSize: '.68rem', color: (connected || pollOk) ? '#52B788' : '#666', fontWeight: 600 }}>
                    {(connected || pollOk) ? 'Listening for orders…' : 'Reconnecting…'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllSeen}
                    style={{ fontSize: '.72rem', color: '#52B788', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close notifications"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94A3B8', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, minHeight: 0, maxHeight: isMobile ? 'calc(100dvh - 220px)' : 400 }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8', fontSize: '.84rem' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:10}}><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  <div>No new orders yet. Notifications appear here instantly when a customer places an order.</div>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={`${n.id}-${i}`}
                    className="notif-panel-item"
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(245, 211, 92, 0.08)',
                      background: n.seen ? 'transparent' : 'rgba(232,123,50,0.06)',
                      transition: 'background .3s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '.86rem', color: '#FFFDF5', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-2px',marginRight:4}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> {n.customer_name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', color: '#F5D35C', fontWeight: 600, fontSize: '.9rem', whiteSpace: 'nowrap' }}>
                        NPR {n.total.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: '#94A3B8', marginBottom: 3, overflowWrap: 'break-word' }}>
                      {n.items.map((it) => `${it.name} ×${it.quantity}`).join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: '.7rem', color: '#475569', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.id}</span>
                        {n.payment_method?.toLowerCase().includes('visit') ? (
                          <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(41,128,185,0.15)', color: '#60A5FA', border: '1px solid rgba(41,128,185,0.3)', whiteSpace: 'nowrap' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Visit Shop
                          </span>
                        ) : (
                          <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(232,123,50,0.15)', color: '#E87B32', border: '1px solid rgba(232,123,50,0.3)', whiteSpace: 'nowrap' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 8v8"/></svg> COD
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '.7rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(245, 211, 92, 0.15)', background: '#0A1226', flexShrink: 0 }}>
              <a href="/admin/orders" onClick={() => setPanelOpen(false)} style={{ fontSize: '.78rem', color: '#52B788', fontWeight: 600, textDecoration: 'none' }}>
                View all orders in CMS →
              </a>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
