'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import type { CakeMenuItemRecord } from '@/types';

type CategoryFilter = 'all' | 'popular' | 'cheesecake' | 'special' | 'unavailable';

export default function AdminCakeMenuPage() {
  const [items, setItems] = useState<CakeMenuItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CakeMenuItemRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nepali_subtitle: '',
    price: 650,
    cat: 'popular' as 'popular' | 'cheesecake' | 'special',
    badge: '',
    desc: '',
    tags: '',
    image: '',
    weight: '1 Pound',
    eggless: true,
    available: true,
    display_order: 1,
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const loadItems = async () => {
    try {
      const res = await fetch('/api/menu-items');
      const data = await res.json();
      if (data.data) {
        setItems(data.data);
      }
    } catch {
      showToast('Failed to load cake menu items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.display_order ?? 0)) + 1 : 1;
    setEditingItem(null);
    setFormData({
      name: '',
      nepali_subtitle: '',
      price: 700,
      cat: 'popular',
      badge: 'Popular',
      desc: '',
      tags: 'Fresh, Baked Fresh',
      image: '',
      weight: '1 Pound',
      eggless: true,
      available: true,
      display_order: nextOrder,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CakeMenuItemRecord) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nepali_subtitle: item.nepali_subtitle || '',
      price: item.price,
      cat: item.cat,
      badge: item.badge || '',
      desc: item.desc || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      image: item.image || '',
      weight: item.weight || '1 Pound',
      eggless: item.eggless !== undefined ? item.eggless : true,
      available: item.available !== undefined ? item.available : true,
      display_order: item.display_order ?? 1,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.url) {
        setFormData((prev) => ({ ...prev, image: result.url }));
        showToast('Image uploaded successfully');
      } else {
        showToast(result.error || 'Failed to upload image', 'error');
      }
    } catch {
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Cake name is required', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      nepali_subtitle: formData.nepali_subtitle.trim() || undefined,
      price: Number(formData.price),
      cat: formData.cat,
      badge: formData.badge.trim() || undefined,
      desc: formData.desc.trim() || undefined,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      image: formData.image.trim() || undefined,
      weight: formData.weight.trim() || '1 Pound',
      eggless: formData.eggless,
      available: formData.available,
      display_order: Number(formData.display_order),
    };

    try {
      if (editingItem) {
        const res = await fetch(`/api/menu-items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok && result.data) {
          setItems((prev) => prev.map((item) => (item.id === editingItem.id ? result.data : item)));
          showToast(`Updated "${payload.name}" successfully`);
          setIsModalOpen(false);
        } else {
          showToast(result.error || 'Failed to update cake item', 'error');
        }
      } else {
        const res = await fetch('/api/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok && result.data) {
          setItems((prev) => [...prev, result.data].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
          showToast(`Added "${payload.name}" to menu`);
          setIsModalOpen(false);
        } else {
          showToast(result.error || 'Failed to create cake item', 'error');
        }
      }
    } catch {
      showToast('Network error saving cake item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item: CakeMenuItemRecord) => {
    const nextState = !item.available;
    setTogglingId(item.id);
    // Optimistic update
    setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, available: nextState } : c)));

    try {
      const res = await fetch(`/api/menu-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: nextState }),
      });
      if (!res.ok) {
        // Rollback
        setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, available: !nextState } : c)));
        showToast('Failed to update availability', 'error');
      } else {
        showToast(`${item.name} is now ${nextState ? 'In Stock' : 'Marked Sold Out'}`);
      }
    } catch {
      setItems((prev) => prev.map((c) => (c.id === item.id ? { ...c, available: !nextState } : c)));
      showToast('Network error updating availability', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the cake menu?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/menu-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((c) => c.id !== id));
        showToast(`Removed "${name}" from menu`);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to delete cake item', 'error');
      }
    } catch {
      showToast('Network error deleting item', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (currentIndex: number, direction: -1 | 1) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= filteredItems.length) return;

    const current = filteredItems[currentIndex];
    const target = filteredItems[targetIndex];
    const orderA = target.display_order ?? targetIndex + 1;
    const orderB = current.display_order ?? currentIndex + 1;

    setMovingId(current.id);
    try {
      await Promise.all([
        fetch(`/api/menu-items/${current.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: orderA }),
        }),
        fetch(`/api/menu-items/${target.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: orderB }),
        }),
      ]);

      setItems((prev) =>
        prev
          .map((c) => {
            if (c.id === current.id) return { ...c, display_order: orderA };
            if (c.id === target.id) return { ...c, display_order: orderB };
            return c;
          })
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      );
    } catch {
      showToast('Failed to reorder item', 'error');
    } finally {
      setMovingId(null);
    }
  };

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (activeCategory === 'unavailable') {
          if (item.available !== false) return false;
        } else if (activeCategory !== 'all') {
          if (item.cat !== activeCategory) return false;
        }
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.nepali_subtitle?.toLowerCase().includes(q) ||
          item.desc?.toLowerCase().includes(q) ||
          item.badge?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [items, activeCategory, search]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.available !== false).length;
    const popular = items.filter((i) => i.cat === 'popular').length;
    const cheesecake = items.filter((i) => i.cat === 'cheesecake').length;
    const special = items.filter((i) => i.cat === 'special').length;
    return { total, available, popular, cheesecake, special };
  }, [items]);

  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: '#BDB49A' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>🎂</div>
        <div>Loading cake menu items...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 12,
            background: toast.type === 'error' ? '#D32F2F' : '#2D6A4F',
            color: '#FFFFFF',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.6rem' }}>🎂</span>
            <h1
              style={{
                fontFamily: 'var(--font-display, serif)',
                fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)',
                color: '#F5D35C',
                margin: 0,
                fontWeight: 700,
              }}
            >
              Cake Menu Management
            </h1>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#BDB49A', margin: 0 }}>
            Curate, price, reorder, and control availability for the public Jiri Bakes authentic cake menu.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 9999,
              background: 'rgba(245, 211, 92, 0.1)',
              color: '#F5D35C',
              border: '1px solid rgba(245, 211, 92, 0.3)',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>Live Menu</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>

          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              borderRadius: 9999,
              background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
              color: '#FFFDF5',
              fontSize: '0.86rem',
              fontWeight: 700,
              border: '1px solid rgba(82, 183, 136, 0.4)',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(45, 106, 79, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
            <span>Add Cake Item</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(245, 211, 92, 0.15)',
            borderRadius: 16,
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#BDB49A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Cakes
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#F5D35C', marginTop: 4 }}>
            {stats.total}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(82, 183, 136, 0.2)',
            borderRadius: 16,
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#BDB49A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            In Stock
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#52B788', marginTop: 4 }}>
            {stats.available} <span style={{ fontSize: '0.85rem', color: '#BDB49A', fontWeight: 500 }}>/ {stats.total}</span>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#BDB49A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Popular Sponges
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#FFFDF5', marginTop: 4 }}>
            {stats.popular}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#BDB49A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cheesecakes & Specialties
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#FFFDF5', marginTop: 4 }}>
            {stats.cheesecake + stats.special}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Cakes (${items.length})` },
            { id: 'popular', label: `Popular Sponges (${stats.popular})` },
            { id: 'cheesecake', label: `Cheesecakes (${stats.cheesecake})` },
            { id: 'special', label: `Specialties (${stats.special})` },
            { id: 'unavailable', label: `Sold Out (${items.length - stats.available})` },
          ].map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as CategoryFilter)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 9999,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(245, 211, 92, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: active ? '#F5D35C' : '#BDB49A',
                  border: `1px solid ${active ? '#F5D35C' : 'rgba(255, 255, 255, 0.08)'}`,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: 260, flex: '1 1 260px', maxWidth: 360 }}>
          <input
            type="text"
            placeholder="Search cakes by name, flavour, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 34px 9px 14px',
              borderRadius: 9999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFDF5',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#BDB49A',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderRadius: 20,
          border: '1px solid rgba(245, 211, 92, 0.15)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', color: '#BDB49A', textTransform: 'uppercase', width: 90 }}>
                  Order
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', color: '#BDB49A', textTransform: 'uppercase' }}>
                  Cake Item
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', color: '#BDB49A', textTransform: 'uppercase', width: 140 }}>
                  Category
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', color: '#BDB49A', textTransform: 'uppercase', width: 140 }}>
                  Price (1 lb)
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', color: '#BDB49A', textTransform: 'uppercase', width: 120 }}>
                  In Stock
                </th>
                <th style={{ padding: '14px 18px', fontSize: '0.72rem', color: '#BDB49A', textTransform: 'uppercase', width: 130, textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: '#BDB49A' }}>
                    No cake menu items found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const isAvailable = item.available !== false;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: !isAvailable ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Display Order & Up/Down Arrows */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              minWidth: 28,
                              textAlign: 'center',
                              padding: '2px 6px',
                              borderRadius: 6,
                              background: 'rgba(245, 211, 92, 0.12)',
                              color: '#F5D35C',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                          >
                            {item.display_order ?? index + 1}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              onClick={() => handleMove(index, -1)}
                              disabled={index === 0 || movingId === item.id}
                              title="Move up"
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 4,
                                color: '#FFFDF5',
                                cursor: index === 0 ? 'default' : 'pointer',
                                opacity: index === 0 ? 0.25 : 0.8,
                                padding: '1px 5px',
                                fontSize: '0.65rem',
                              }}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMove(index, 1)}
                              disabled={index === filteredItems.length - 1 || movingId === item.id}
                              title="Move down"
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 4,
                                color: '#FFFDF5',
                                cursor: index === filteredItems.length - 1 ? 'default' : 'pointer',
                                opacity: index === filteredItems.length - 1 ? 0.25 : 0.8,
                                padding: '1px 5px',
                                fontSize: '0.65rem',
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Cake Item Details */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 12,
                              overflow: 'hidden',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(245, 211, 92, 0.2)',
                              flexShrink: 0,
                            }}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.2rem',
                                }}
                              >
                                🎂
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.94rem',
                                  color: isAvailable ? '#FFFDF5' : '#888',
                                  textDecoration: !isAvailable ? 'line-through' : 'none',
                                }}
                              >
                                {item.name}
                              </span>
                              {item.badge && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 9999,
                                    background: 'rgba(245, 211, 92, 0.15)',
                                    color: '#F5D35C',
                                    border: '1px solid rgba(245, 211, 92, 0.3)',
                                  }}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {item.eggless !== false && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 6,
                                    background: 'rgba(82, 183, 136, 0.15)',
                                    color: '#52B788',
                                  }}
                                >
                                  Eggless
                                </span>
                              )}
                            </div>
                            {item.nepali_subtitle && (
                              <div style={{ fontSize: '0.78rem', color: '#D4A373', marginTop: 2 }}>
                                {item.nepali_subtitle}
                              </div>
                            )}
                            {item.desc && (
                              <div
                                style={{
                                  fontSize: '0.76rem',
                                  color: '#BDB49A',
                                  maxWidth: 380,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: 3,
                                }}
                              >
                                {item.desc}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background:
                              item.cat === 'cheesecake'
                                ? 'rgba(217, 119, 6, 0.15)'
                                : item.cat === 'special'
                                ? 'rgba(147, 51, 234, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)',
                            color:
                              item.cat === 'cheesecake'
                                ? '#FBBF24'
                                : item.cat === 'special'
                                ? '#C084FC'
                                : '#60A5FA',
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.cat === 'popular'
                            ? 'Popular Sponge'
                            : item.cat === 'cheesecake'
                            ? 'Cheesecake'
                            : 'Specialty'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.05rem', fontWeight: 700, color: '#F5D35C' }}>
                          NPR {item.price.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#BDB49A' }}>
                          {item.weight || '1 Pound'}
                        </div>
                      </td>

                      {/* In-Stock Toggle */}
                      <td style={{ padding: '14px 18px' }}>
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          disabled={togglingId === item.id}
                          title={isAvailable ? 'Click to mark as Sold Out' : 'Click to mark In Stock'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 9999,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            background: isAvailable ? 'rgba(82, 183, 136, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                            color: isAvailable ? '#52B788' : '#F87171',
                            border: `1px solid ${isAvailable ? 'rgba(82, 183, 136, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: isAvailable ? '#52B788' : '#F87171',
                            }}
                          />
                          <span>{isAvailable ? 'In Stock' : 'Sold Out'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#FFFDF5',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={deletingId === item.id}
                            title="Delete Item"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#F87171',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {deletingId === item.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(245, 211, 92, 0.25)',
              borderRadius: 24,
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
              padding: 28,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.45rem', color: '#F5D35C', margin: 0 }}>
                  {editingItem ? 'Edit Cake Item' : 'Add New Cake Item'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#BDB49A', margin: '4px 0 0' }}>
                  Fill in cake details to showcase on the authentic Jiri Bakes menu.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#BDB49A',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Cake Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Cake Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Classic Vanilla or Basque Burnt Cheesecake"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Nepali Subtitle */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Nepali Subtitle / Highlight (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.nepali_subtitle}
                    onChange={(e) => setFormData({ ...formData, nepali_subtitle: e.target.value })}
                    placeholder="e.g. Signature Himalayan Specialty"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Category *
                  </label>
                  <select
                    value={formData.cat}
                    onChange={(e) =>
                      setFormData({ ...formData, cat: e.target.value as 'popular' | 'cheesecake' | 'special' })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  >
                    <option value="popular">Popular Sponges</option>
                    <option value="cheesecake">Cheesecake</option>
                    <option value="special">Chef's Specialty</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Price (in NPR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={50}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="e.g. 750"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Badge */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Popular, Signature, Local Special"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Weight / Unit */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Weight / Portion
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="e.g. 1 Pound or /piece"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Image URL & File Upload */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Cake Photo
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Image URL or upload file..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFDF5',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        background: 'rgba(245, 211, 92, 0.15)',
                        border: '1px solid rgba(245, 211, 92, 0.3)',
                        color: '#F5D35C',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {uploadingImage ? 'Uploading...' : 'Browse File'}
                    </button>
                  </div>
                  {formData.image && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={formData.image}
                        alt="Preview"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          border: '1px solid rgba(245, 211, 92, 0.3)',
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#52B788' }}>✓ Image ready for menu</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    placeholder="e.g. Fluffy vanilla sponge infused with fresh mountain berry coulis..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Tags */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#BDB49A', marginBottom: 6 }}>
                    Flavour Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. Vanilla, Whipped Cream, Classic"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFDF5',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Checkbox Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="eggless-check"
                    checked={formData.eggless}
                    onChange={(e) => setFormData({ ...formData, eggless: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#52B788', cursor: 'pointer' }}
                  />
                  <label htmlFor="eggless-check" style={{ fontSize: '0.84rem', color: '#FFFDF5', cursor: 'pointer' }}>
                    100% Eggless Available
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="available-check"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#52B788', cursor: 'pointer' }}
                  />
                  <label htmlFor="available-check" style={{ fontSize: '0.84rem', color: '#FFFDF5', cursor: 'pointer' }}>
                    Currently In Stock
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 9999,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#BDB49A',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 9999,
                    background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
                    border: '1px solid rgba(82, 183, 136, 0.4)',
                    color: '#FFFDF5',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(45, 106, 79, 0.35)',
                  }}
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Cake Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
