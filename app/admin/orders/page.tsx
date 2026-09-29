'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string>('');

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
        const json = await res.json().catch(() => ({}));
        if (json.mailSent) {
          setResendMsg(`Status email sent to customer for ${orderId}.`);
          setTimeout(() => setResendMsg(''), 4000);
        }
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResend = async (orderId: string, kind: 'confirmation' | 'status') => {
    setResendingId(`${orderId}:${kind}`);
    setResendMsg('');
    try {
      const res = await fetch(`/api/orders/${orderId}/resend?kind=${kind}`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendMsg(`Email re-sent for ${orderId} (${kind}).`);
      } else {
        setResendMsg(json.error || `Failed to resend email for ${orderId}.`);
      }
    } catch {
      setResendMsg(`Failed to resend email for ${orderId}.`);
    } finally {
      setResendingId(null);
      setTimeout(() => setResendMsg(''), 4000);
    }
  };

  const isVisitShop = (order: Order) => {
    return (
      order.payment_method?.toLowerCase().includes('visit') ||
      order.customer_address?.toLowerCase().includes('visit')
    );
  };

  const typeCounts = useMemo(() => {
    let cod = 0;
    let visit = 0;
    for (const o of orders) {
      if (isVisitShop(o)) visit++;
      else cod++;
    }
    return { all: orders.length, cod, visit };
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
    return counts;
  }, [orders]);

  const searchQuery = search.trim().toLowerCase();

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchType =
      typeFilter === 'all' ||
      (typeFilter === 'visit' && isVisitShop(o)) ||
      (typeFilter === 'cod' && !isVisitShop(o));
    if (!matchStatus || !matchType) return false;
    if (!searchQuery) return true;
    const haystack = [o.id, o.customer_name, o.customer_phone, o.customer_email]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchQuery);
  });

  const isFiltered = statusFilter !== 'all' || typeFilter !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearch('');
  };

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
          {resendMsg && (
            <p style={{ fontSize: '0.8rem', color: '#52B788', marginTop: 6 }}>{resendMsg}</p>
          )}
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
      <div className="admin-orders-filter-card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 20,
        padding: '14px 16px',
        background: 'var(--color-card-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, order ID, phone…"
              aria-label="Search orders"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 34px 9px 36px',
                borderRadius: 12,
                fontSize: '0.82rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                color: '#FFFDF5',
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#F5D35C'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#94A3B8', cursor: 'pointer', fontSize: '0.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Type segmented control */}
        <div className="admin-filter-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0, width: 44 }}>
            Type
          </span>
          <div style={{
            display: 'flex', gap: 4, padding: 4, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
            flex: 1, minWidth: 0,
          }}>
            {[
              { key: 'all', label: 'All', icon: null },
              { key: 'cod', label: 'COD', icon: '🛵' },
              { key: 'visit', label: 'Visit', icon: '🏠' },
            ].map((t) => {
              const active = typeFilter === t.key;
              const count = typeCounts[t.key as keyof typeof typeCounts] ?? 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key as typeof typeFilter)}
                  aria-pressed={active}
                  style={{
                    flex: 1, minWidth: 0,
                    padding: '7px 6px',
                    borderRadius: 9,
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: active ? 'rgba(82, 183, 136, 0.22)' : 'transparent',
                    color: active ? '#52B788' : 'var(--color-text-tertiary)',
                    transition: 'all 0.18s',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {t.icon ? `${t.icon} ` : ''}{t.label} · {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status chip rail (horizontally scrollable) */}
        <div className="admin-filter-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0, width: 44 }}>
            Status
          </span>
          <div className="admin-status-rail" style={{
            display: 'flex', gap: 6, flex: 1, minWidth: 0,
            overflowX: 'auto', paddingBottom: 2,
            scrollbarWidth: 'none',
          }}>
            {['all', ...ALL_STATUSES].map((s) => {
              const count = statusCounts[s] ?? 0;
              const isSelected = statusFilter === s;
              const dot = s === 'all' ? '#F5D35C' : (STATUS_COLORS[s] || '#8A7654');
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={isSelected}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px',
                    borderRadius: 9999,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: `1px solid ${isSelected ? dot : 'var(--color-border)'}`,
                    background: isSelected ? `${dot}22` : 'rgba(255,255,255,0.04)',
                    color: isSelected ? dot : 'var(--color-text-tertiary)',
                    textTransform: 'capitalize',
                    transition: 'all 0.18s',
                    opacity: !isSelected && count === 0 ? 0.45 : 1,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                  {s}
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    background: isSelected ? `${dot}30` : 'rgba(255,255,255,0.08)',
                    borderRadius: 9999, padding: '1px 7px',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result meta + clear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)' }}>
            Showing <strong style={{ color: '#FFFDF5' }}>{filteredOrders.length}</strong> of <strong style={{ color: '#FFFDF5' }}>{orders.length}</strong> orders
          </span>
          {isFiltered && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: '0.74rem', fontWeight: 700, color: '#F5D35C',
                background: 'rgba(245, 211, 92, 0.1)', border: '1px solid rgba(245, 211, 92, 0.3)',
                borderRadius: 9999, padding: '5px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ✕ Clear filters
            </button>
          )}
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
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 600, color: '#FFFDF5', marginBottom: 4 }}>No matching orders found</div>
          <div style={{ fontSize: '0.8rem', marginBottom: isFiltered ? 14 : 0 }}>
            {isFiltered ? 'Try a different search or clear the filters below.' : 'No orders recorded yet.'}
          </div>
          {isFiltered && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: '0.78rem', fontWeight: 700, color: '#2B1D10',
                background: '#F5D35C', border: 'none',
                borderRadius: 9999, padding: '9px 22px', cursor: 'pointer',
              }}
            >
              Clear all filters
            </button>
          )}
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Visit Shop
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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-1px',marginRight:2}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 8v8"/></svg> COD
                      </span>
                    )}
                  </div>

                  <div className="admin-order-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="admin-order-card-total" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F5D35C', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {order.status}
                    </span>

                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="admin-order-expanded" style={{ padding: '0 22px 22px', borderTop: '1px solid var(--color-border)', background: '#0B132B', minWidth: 0 }}>
                    <div className="admin-order-expanded-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 20, paddingTop: 18 }}>
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
                          <div>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>Email: </span>
                            {order.customer_email ? (
                              <a href={`mailto:${order.customer_email}`} style={{ color: 'var(--color-green)', textDecoration: 'none' }}>
                                {order.customer_email}
                              </a>
                            ) : (
                              <span style={{ color: '#CBD5E1' }}>— (no email, no confirmation sent)</span>
                            )}
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
                            <div key={idx} className="admin-order-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, padding: '7px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 600, color: '#FFFDF5', minWidth: 0, overflowWrap: 'break-word' }}>{it.name} <span style={{ color: '#94A3B8', fontWeight: 400 }}>× {it.quantity}</span></span>
                              <span style={{ color: '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                <strong style={{ color: '#52B788' }}>NPR {(it.price * it.quantity).toLocaleString()}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Resend email actions */}
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                        Emails:
                      </span>
                      {(['confirmation', 'status'] as const).map((kind) => (
                        <button
                          key={kind}
                          disabled={resendingId === `${order.id}:${kind}` || !order.customer_email}
                          onClick={() => handleResend(order.id, kind)}
                          title={!order.customer_email ? 'No customer email on this order' : `Resend ${kind} email`}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 9999,
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: !order.customer_email ? 'not-allowed' : 'pointer',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#CBD5E1',
                            opacity: resendingId === `${order.id}:${kind}` ? 0.6 : 1,
                          }}
                        >
                          {resendingId === `${order.id}:${kind}` ? 'Sending…' : `Resend ${kind}`}
                        </button>
                      ))}
                    </div>

                    {/* Status Workflow Action Buttons */}
                    <div className="admin-status-actions" style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                        Update Status <span style={{ fontWeight: 400 }}>(emails customer):</span>
                      </span>

                      <div className="admin-status-actions-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                              minHeight: 38,
                            }}
                          >
                            {order.status === st ? `✓ ${st}` : st}
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
.admin-status-rail::-webkit-scrollbar { display: none; }
.admin-status-rail { -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
@media (max-width: 640px) {
  .admin-orders-filter-card {
    padding: 12px !important;
    gap: 10px !important;
    border-radius: 14px !important;
  }
  .admin-filter-row > span:first-child {
    display: none !important;
  }
  /* Collapse expanded details to a single column — min()/minmax()
     percentages don't collapse reliably, so force it explicitly. */
  .admin-order-expanded-grid {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  .admin-order-expanded-grid > div {
    min-width: 0 !important;
  }
  .admin-order-expanded a,
  .admin-order-expanded span {
    overflow-wrap: anywhere;
  }
  .admin-order-card-header {
    padding: 14px 14px !important;
    gap: 10px !important;
    overflow-wrap: break-word;
  }
  .admin-order-card-total {
    font-size: 0.92rem !important;
  }
  .admin-order-expanded {
    padding: 0 14px 16px !important;
  }
  .admin-status-actions-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    width: 100% !important;
  }
  .admin-status-actions-grid button {
    width: 100% !important;
    min-height: 40px !important;
    padding: 9px 8px !important;
  }
}
@media (max-width: 480px) {
  .admin-order-card-header {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .admin-order-card-meta {
    justify-content: space-between !important;
    width: 100% !important;
  }
}
      `}</style>
    </div>
  );
}
