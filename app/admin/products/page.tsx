'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MenuItem } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter);

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading bakery products...
      </div>
    );
  }

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: 'var(--color-brown-deep)', marginBottom: 4 }}>
            Products
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-tertiary)' }}>
            Manage bakery menu items, prices, categories, and showcase items ({products.length} total)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 26px',
            borderRadius: 9999,
            background: 'var(--color-green)',
            color: '#FFFDF5',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 14px rgba(40, 85, 28, 0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>+</span>
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'cake', 'pastry', 'bread', 'cookie', 'seasonal'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px',
              borderRadius: 9999,
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: filter === f ? 'rgba(56, 142, 60, 0.25)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#52B788' : 'var(--color-text-tertiary)',
              border: `1px solid ${filter === f ? '#52B788' : 'var(--color-border)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
              boxShadow: filter === f ? '0 2px 8px rgba(40, 85, 28, 0.2)' : 'none',
            }}
          >
            {f === 'all' ? 'All Products' : f + 's'}
          </button>
        ))}
      </div>

      {/* Products Table Card */}
      <div style={{
        background: 'var(--color-card-bg)',
        borderRadius: 20,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--color-border)' }}>
                {['Item', 'Category', 'Price', 'Status Badge', 'Featured', 'Actions'].map((h) => (
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
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(245, 211, 92, 0.1)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1.5px solid var(--color-border)',
                        flexShrink: 0,
                        background: 'rgba(255,255,255,0.05)',
                      }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#999' }}>
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brown-deep)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.84rem', color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>
                    {p.category}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.92rem', fontFamily: 'var(--font-display)', color: 'var(--color-brown-deep)', fontWeight: 600 }}>
                    NPR {p.price.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>{p.unit}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {p.badge ? (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 9999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'rgba(245, 211, 92, 0.2)',
                        color: 'var(--color-brown-deep)',
                        border: '1px solid rgba(245, 211, 92, 0.5)',
                      }}>
                        {p.badge}
                      </span>
                    ) : (
                      <span style={{ color: '#ccc', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {p.featured ? (
                      <span style={{ color: '#27ae60', fontSize: '0.8rem', fontWeight: 600 }}>★ Showcase</span>
                    ) : (
                      <span style={{ color: '#bbb', fontSize: '0.75rem' }}>Standard</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/admin/products/${p.id}`}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 9999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid var(--color-border)',
                          color: '#FFFDF5',
                          background: 'rgba(255, 255, 255, 0.08)',
                          transition: 'all 0.2s',
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 9999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid rgba(192,57,43,0.3)',
                          color: 'var(--color-error)',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {deleting === p.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.88rem' }}>
                    No products found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
