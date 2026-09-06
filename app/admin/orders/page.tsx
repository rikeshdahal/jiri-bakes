'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#E87B32',
  confirmed: '#2980b9',
  baking: '#D9A441',
  preparing: '#9b59b6',
  ready: '#52B788',
  delivered: '#27ae60',
  completed: '#27ae60',
  cancelled: '#e74c3c',
};

const ALL_STATUSES = ['pending', 'confirmed', 'baking', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cod' | 'visit'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const isVisitShop = (order: Order) => {
    return (
      order.payment_method?.toLowerCase().includes('visit') ||
      order.customer_address?.toLowerCase().includes('visit')
    );
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchType =
      typeFilter === 'all' ||
      (typeFilter === 'visit' && isVisitShop(o)) ||
      (typeFilter === 'cod' && !isVisitShop(o));
    return matchStatus && matchType;
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading customer orders...
      </div>
    );
  }

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: 'var(--color-brown-deep)', marginBottom: 4 }}>
            Customer Orders
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-tertiary)' }}>
            Real-time management for Cash on Delivery & Store Pickup orders ({orders.length} total)
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{
            padding: '9px 18px',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--color-border)',
            color: '#FFFDF5',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{display:'inline-flex',alignItems:'center',gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> Refresh</span>
        </button>
      </div>

      {/* Order Type & Status Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {/* Type Filter Pills (COD vs Visit Shop) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginRight: 4 }}>
            Order Type:
          </span>
          {[
            { key: 'all', label: 'All Types', count: orders.length },
            { key: 'cod', label: 'Cash on Delivery', count: orders.filter((o) => !isVisitShop(o)).length },
            { key: 'visit', label: 'Visit Shop', count: orders.filter((o) => isVisitShop(o)).length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key as typeof typeFilter)}
              style={{
                padding: '7px 16px',
                minHeight: 40,
                borderRadius: 9999,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${typeFilter === t.key ? '#52B788' : 'var(--color-border)'}`,
                background: typeFilter === t.key ? 'rgba(82, 183, 136, 0.2)' : 'var(--color-card-bg)',
                color: typeFilter === t.key ? '#52B788' : 'var(--color-text-tertiary)',
                transition: 'all 0.2s',
                boxShadow: typeFilter === t.key ? '0 2px 8px rgba(40,85,28,0.2)' : 'none',
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginRight: 4 }}>
            Status:
          </span>
          {['all', ...ALL_STATUSES].map((s) => {
            const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length;
            const isSelected = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 14px',
                  minHeight: 40,
                  borderRadius: 9999,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? '#F5D35C' : 'var(--color-border)'}`,
                  background: isSelected ? 'rgba(245, 211, 92, 0.15)' : 'var(--color-card-bg)',
                  color: isSelected ? '#F5D35C' : 'var(--color-text-tertiary)',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          padding: 60,
          background: 'var(--color-card-bg)',
          borderRadius: 20,
          border: '1px solid var(--color-border)',
        }}>
          No matching orders found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredOrders.map((order) => {
            const isExpanded = expandedId === order.id;
            const statusColor = STATUS_COLORS[order.status] || '#8A7654';
            const visitMode = isVisitShop(order);

            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--color-card-bg)',
                  borderRadius: 18,
                  border: `1.5px solid ${isExpanded ? '#F5D35C' : 'var(--color-border)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="admin-order-card-header"
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 22px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                      {order.id}
                    </span>

                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFDF5' }}>
                        {order.customer_name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
                        {formatDate(order.created_at)}
                      </div>
                    </div>

                    {/* Order Type Badge: COD vs Visit Shop */}
                    {visitMode ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 12px',
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(41, 128, 185, 0.12)',
                          color: '#2980b9',
                          border: '1px solid rgba(41, 128, 185, 0.3)',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Visit Shop / Store Pickup
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 12px',
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(232, 123, 50, 0.12)',
                          color: '#E87B32',
                          border: '1px solid rgba(232, 123, 50, 0.3)',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 8v8"/></svg> Cash on Delivery
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F5D35C', fontFamily: 'var(--font-display)' }}>
                      NPR {order.total.toLocaleString()}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 9999,
                        background: `${statusColor}18`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                        textTransform: 'capitalize',
                      }}
                    >
                      {order.status}
                    </span>

                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--color-border)', background: '#0B132B' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, paddingTop: 18 }}>
                      {/* Customer & Delivery Mode Details */}
                      <div>
                        <h4 style={{ fontSize: '0.76rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 10 }}>
                          Customer & Delivery Info
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>Order Type: </span>
                            <strong style={{ color: visitMode ? '#2980b9' : '#E87B32' }}>
                              {visitMode ? 'Visit Store (Customer will pick up at Lokanthali)' : 'Cash on Delivery (Courier Delivery)'}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>Phone: </span>
                            <strong>
                              <a href={`tel:${order.customer_phone}`} style={{ color: 'var(--color-green)', textDecoration: 'none' }}>
                                {order.customer_phone || '—'}
                              </a>
                            </strong>
                          </div>
                          {(order.delivery_date || order.delivery_time) && (
                            <div style={{ display:'flex', gap:10, alignItems:'center', background: 'rgba(245, 211, 92, 0.08)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(245, 211, 92, 0.15)', marginTop: 4 }}>
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Delivery Slot: </span>
                              <span style={{ color: '#F5D35C', fontWeight: 600 }}>
                                {order.delivery_date} <span style={{ opacity: 0.6, margin: '0 4px' }}>|</span> {order.delivery_time}
                              </span>
                            </div>
                          )}

                          {order.delivery_location && (
                            <div>
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Location: </span>
                              <span style={{ color: '#CBD5E1' }}>{order.delivery_location}</span>
                            </div>
                          )}
                          {!order.delivery_location && (
                            <div>
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Address: </span>
                              <span style={{ color: '#CBD5E1' }}>{order.customer_address || '—'}</span>
                            </div>
                          )}

                          {order.variant && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Dietary Variant: </span>
                              <span style={{ color: order.variant === 'Eggless' ? '#52B788' : '#e74c3c', fontWeight: 600, background: order.variant === 'Eggless' ? 'rgba(82, 183, 136, 0.1)' : 'rgba(231, 76, 60, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                                {order.variant}
                              </span>
                            </div>
                          )}

                          {order.message_on_item && (
                            <div>
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Item Message: </span>
                              <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>&ldquo;{order.message_on_item}&rdquo;</span>
                            </div>
                          )}

                          {order.item_note && (
                            <div>
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Item Note: </span>
                              <span style={{ color: '#CBD5E1' }}>{order.item_note}</span>
                            </div>
                          )}

                          {order.notes && (
                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', marginTop: 4 }}>
                              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', display: 'block' }}>Special Instructions:</span>
                              <span style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>{order.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Ordered */}
                      <div>
                        <h4 style={{ fontSize: '0.76rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 10 }}>
                          Items Ordered
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {order.items?.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 600, color: '#FFFDF5' }}>{it.name}</span>
                              <span style={{ color: '#94A3B8' }}>
                                {it.quantity} × NPR {it.price.toLocaleString()} = <strong style={{ color: '#52B788' }}>NPR {(it.price * it.quantity).toLocaleString()}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status Workflow Action Buttons */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                        Update Order Status:
                      </span>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {ALL_STATUSES.map((st) => (
                          <button
                            key={st}
                            disabled={updatingId === order.id || order.status === st}
                            onClick={() => handleStatusChange(order.id, st)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: 9999,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: order.status === st ? 'default' : 'pointer',
                              border: `1px solid ${order.status === st ? STATUS_COLORS[st] : 'var(--color-border)'}`,
                              background: order.status === st ? STATUS_COLORS[st] : 'rgba(255,255,255,0.06)',
                              color: order.status === st ? '#fff' : '#CBD5E1',
                              opacity: updatingId === order.id ? 0.6 : 1,
                              textTransform: 'capitalize',
                              transition: 'all 0.15s',
                            }}
                          >
                            {order.status === st ? `✓ ${st}` : `Mark as ${st}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
@media (max-width: 480px) {
  .admin-order-card-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 10px !important;
  }
}
      `}</style>
    </div>
  );
}
