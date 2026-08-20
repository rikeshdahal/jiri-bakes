'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalTestimonials: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  payment_method?: string;
  total: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/testimonials').then((r) => r.json()),
    ])
      .then(([products, orders, testimonials]) => {
        const orderList = orders.data || [];
        setStats({
          totalProducts: (products.data || []).length,
          totalOrders: orderList.length,
          pendingOrders: orderList.filter((o: RecentOrder) => o.status === 'pending').length,
          totalTestimonials: (testimonials.data || []).length,
          totalRevenue: orderList.reduce((sum: number, o: RecentOrder) => sum + (o.total || 0), 0),
        });
        setRecentOrders(orderList.slice(0, 8));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.95rem' }}>Loading Admin Dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      subtext: 'Active in catalogue',
      accent: '#28551C',
      bgAccent: 'rgba(40, 85, 28, 0.08)',
      href: '/admin/products',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28551C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      subtext: 'Awaiting preparation',
      accent: '#E87B32',
      bgAccent: 'rgba(232, 123, 50, 0.1)',
      href: '/admin/orders',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E87B32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      subtext: 'All time customer orders',
      accent: '#8A7654',
      bgAccent: 'rgba(138, 118, 84, 0.1)',
      href: '/admin/orders',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A7654" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: 'Total Revenue',
      value: `NPR ${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtext: 'From verified orders',
      accent: '#27ae60',
      bgAccent: 'rgba(39, 174, 96, 0.1)',
      href: '/admin/orders',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'rgba(232, 123, 50, 0.12)', text: '#E87B32', border: 'rgba(232, 123, 50, 0.3)' },
    baking: { bg: 'rgba(245, 211, 92, 0.2)', text: '#8A7654', border: 'rgba(245, 211, 92, 0.4)' },
    ready: { bg: 'rgba(40, 85, 28, 0.12)', text: '#28551C', border: 'rgba(40, 85, 28, 0.25)' },
    completed: { bg: 'rgba(39, 174, 96, 0.12)', text: '#27ae60', border: 'rgba(39, 174, 96, 0.25)' },
    delivered: { bg: 'rgba(39, 174, 96, 0.12)', text: '#27ae60', border: 'rgba(39, 174, 96, 0.25)' },
    cancelled: { bg: 'rgba(192, 57, 43, 0.1)', text: '#c0392b', border: 'rgba(192, 57, 43, 0.25)' },
  };

  const isVisitShop = (order: RecentOrder) => {
    return (
      order.payment_method?.toLowerCase().includes('visit') ||
      order.customer_address?.toLowerCase().includes('visit')
    );
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2B1D10 0%, #1A2818 100%)',
        borderRadius: 20,
        padding: '32px 36px',
        color: '#FFFDF5',
        marginBottom: 32,
        boxShadow: '0 8px 32px rgba(43, 29, 16, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(245, 211, 92, 0.15)', border: '1px solid rgba(245, 211, 92, 0.25)', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5D35C' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#F5D35C', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Bakery Overview
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', color: '#FFFDF5', lineHeight: 1.15, marginBottom: 8 }}>
            Welcome to Jiri Bakes Studio
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 253, 245, 0.72)', maxWidth: 500, lineHeight: 1.6 }}>
            Manage artisan bakery products, Cash on Delivery & Store Pickup orders, customer testimonials, and settings in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/admin/products/new"
            style={{
              padding: '12px 24px',
              borderRadius: 9999,
              background: '#F5D35C',
              color: '#2B1D10',
              fontSize: '0.84rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(245, 211, 92, 0.3)',
            }}
          >
            + Add Product
          </Link>
          <Link
            href="/admin/orders"
            style={{
              padding: '12px 24px',
              borderRadius: 9999,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFDF5',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.84rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 36,
      }}>
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '24px',
              background: 'var(--color-card-bg)',
              borderRadius: 18,
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#F5D35C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', color: '#FFFDF5', lineHeight: 1 }}>
                  {s.value}
                </div>
              </div>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: s.bgAccent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{s.subtext}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div style={{
        background: 'var(--color-card-bg)',
        borderRadius: 20,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#FFFDF5', marginBottom: 2 }}>
              Recent Orders
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
              Real-time incoming Cash on Delivery & Store Pickup orders
            </p>
          </div>
          <Link
            href="/admin/orders"
            style={{
              fontSize: '0.8rem',
              color: '#52B788',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(82, 183, 136, 0.14)',
            }}
          >
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.88rem' }}>
            No orders recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Order ID', 'Customer', 'Order Type', 'Phone', 'Total', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '14px 24px',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const badge = statusColors[o.status] || { bg: '#eee', text: '#666', border: '#ddd' };
                  const visitMode = isVisitShop(o);

                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid rgba(245, 211, 92, 0.1)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '16px 24px', fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                        {o.id}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.88rem', color: 'var(--color-brown-deep)', fontWeight: 600 }}>
                        {o.customer_name}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {visitMode ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(41, 128, 185, 0.12)',
                            color: '#2980b9',
                            border: '1px solid rgba(41, 128, 185, 0.3)',
                          }}>
                            🏪 Visit Shop
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(232, 123, 50, 0.12)',
                            color: '#E87B32',
                            border: '1px solid rgba(232, 123, 50, 0.3)',
                          }}>
                            💵 COD
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.82rem', color: 'var(--color-text-tertiary)' }}>
                        {o.customer_phone || '—'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.92rem', color: 'var(--color-brown-deep)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        NPR {o.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.4px',
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          textTransform: 'capitalize',
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                        {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
