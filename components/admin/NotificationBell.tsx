'use client';

import { useEffect, useState, useRef } from 'react';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // SSE connection
  useEffect(() => {
    const connect = () => {
      const es = new EventSource('/api/notifications');
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'new_order') {
            const newNotif: OrderNotification = { ...data.order, seen: false };
            setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
            setPulse(true);
            setTimeout(() => setPulse(false), 3000);

            // Native browser notification (if permission granted)
            if (Notification.permission === 'granted') {
              new Notification(`New Order: ${data.order.customer_name}`, {
                body: `NPR ${data.order.total.toLocaleString()} – ${data.order.items.map((i: { name: string; quantity: number }) => `${i.name} ×${i.quantity}`).join(', ')}`,
                icon: '/jiri logo.jpg',
              });
            }
          }
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    };

    connect();

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      esRef.current?.close();
    };
  }, []);

  const unseenCount = notifications.filter((n) => !n.seen).length;

  const markAllSeen = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
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
        .notif-panel-item {
          animation: notif-slide-in .25s ease forwards;
        }
      `}</style>

      {/* Bell Button */}
      <button
        onClick={() => { setPanelOpen((p) => !p); if (!panelOpen) markAllSeen(); }}
        title="Order notifications"
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 10,
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

      {/* Notification Panel */}
      {panelOpen && (
        <div style={{
          position: 'absolute',
          top: 48,
          right: 0,
          width: 'min(340px, calc(100vw - 32px))',
          maxWidth: 340,
          maxHeight: 480,
          background: '#0D1A33',
          border: '1px solid rgba(245, 211, 92, 0.2)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          zIndex: 200,
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(245, 211, 92, 0.15)',
            background: '#0A1226',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#FFFDF5' }}>Live Order Alerts</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#27ae60' : '#555' }} />
                <span style={{ fontSize: '.68rem', color: connected ? '#52B788' : '#666', fontWeight: 600 }}>
                  {connected ? 'Listening for orders…' : 'Reconnecting…'}
                </span>
              </div>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllSeen}
                style={{ fontSize: '.72rem', color: '#52B788', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8', fontSize: '.84rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:10}}><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                No new orders yet. Notifications appear here instantly when a customer places an order.
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={`${n.id}-${i}`}
                  className="notif-panel-item"
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid rgba(245, 211, 92, 0.08)',
                    background: n.seen ? 'transparent' : 'rgba(232,123,50,0.06)',
                    transition: 'background .3s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '.86rem', color: '#FFFDF5' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-2px',marginRight:4}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> {n.customer_name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', color: '#F5D35C', fontWeight: 600, fontSize: '.9rem' }}>
                      NPR {n.total.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#94A3B8', marginBottom: 3 }}>
                    {n.items.map((it) => `${it.name} ×${it.quantity}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '.7rem', color: '#475569', fontFamily: 'monospace' }}>{n.id}</span>
                      {n.payment_method?.toLowerCase().includes('visit') ? (
                        <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(41,128,185,0.15)', color: '#60A5FA', border: '1px solid rgba(41,128,185,0.3)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Visit Shop
                        </span>
                      ) : (
                        <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(232,123,50,0.15)', color: '#E87B32', border: '1px solid rgba(232,123,50,0.3)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 8v8"/></svg> COD
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '.7rem', color: '#475569' }}>
                      {new Date(n.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(245, 211, 92, 0.15)', background: '#0A1226' }}>
            <a href="/admin/orders" style={{ fontSize: '.78rem', color: '#52B788', fontWeight: 600, textDecoration: 'none' }}>
              View all orders in CMS →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
