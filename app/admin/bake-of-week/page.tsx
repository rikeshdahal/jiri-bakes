'use client';

import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, ChangeEvent } from 'react';
import type { BakeOfWeek, MenuItem } from '@/types';

const DEFAULT_ACCENT_URL = 'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&auto=format&fit=crop&q=80';

interface ProductOption {
  id: string;
  name: string;
  price: number;
  image?: string;
  unit?: string;
  description?: string;
}

export default function AdminBakeOfWeekPage() {
  const [items, setItems] = useState<BakeOfWeek[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productId, setProductId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [image, setImage] = useState('');
  const [secondaryImage, setSecondaryImage] = useState(DEFAULT_ACCENT_URL);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Uploading states
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch('/api/bake-of-week')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.data || []);
      })
      .catch(() => {});
  };

  const loadProducts = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        setProducts((d.data || []).map((p: MenuItem) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          unit: p.unit,
          description: p.description,
        })));
      })
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([load(), loadProducts()]).finally(() => setLoading(false));
  }, []);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const openNew = () => {
    setEditingId(null);
    setProductId('');
    setTitle('');
    setSubtitle('Bake of the Week');
    setPrice('');
    setUnit('/whole');
    setImage('');
    setSecondaryImage(DEFAULT_ACCENT_URL);
    setDescription('');
    setActive(true);
    setFormOpen(true);
  };

  const openEdit = (item: BakeOfWeek) => {
    setEditingId(item.id);
    setProductId(item.product_id || '');
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setPrice(String(item.price));
    setUnit(item.unit);
    setImage(item.image || '');
    setSecondaryImage(
      item.secondary_image !== undefined && item.secondary_image !== null
        ? item.secondary_image
        : DEFAULT_ACCENT_URL
    );
    setDescription(item.description || '');
    setActive(Boolean(item.active));
    setFormOpen(true);
  };

  const handleProductSelect = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setTitle(p.name);
      setPrice(String(p.price));
      setUnit(p.unit || '/whole');
      if (p.image) setImage(p.image);
      if (p.description) setDescription(p.description);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'main' | 'secondary') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      flash('error', 'Please select a valid image file (JPG, PNG, WebP, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      flash('error', 'Image is too large. Maximum size is 5 MB.');
      return;
    }

    if (target === 'main') setUploadingMain(true);
    else setUploadingSecondary(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        flash('error', data.error || 'Failed to upload image');
        return;
      }
      const uploadedUrl = data?.data?.url || data?.url || '';
      if (!uploadedUrl) {
        flash('error', 'Upload failed: Server did not return image URL.');
        return;
      }
      if (target === 'main') {
        setImage(uploadedUrl);
      } else {
        setSecondaryImage(uploadedUrl);
      }
      flash('success', `${target === 'main' ? 'Main cake' : 'Accent'} photo uploaded successfully.`);
    } catch (err: unknown) {
      flash('error', err instanceof Error ? err.message : 'Error uploading image.');
    } finally {
      if (target === 'main') setUploadingMain(false);
      else setUploadingSecondary(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !price) {
      flash('error', 'Title and price are required.');
      return;
    }
    setSaving(true);
    const payload = {
      product_id: productId || null,
      title: title.trim(),
      subtitle: subtitle.trim(),
      price: Number(price),
      unit: unit || '/whole',
      image: (image || '').trim(),
      secondary_image: (secondaryImage || '').trim(),
      description: (description || '').trim(),
      active,
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/bake-of-week/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          flash('success', 'Bake of the Week updated.');
        } else {
          const e = await res.json().catch(() => ({}));
          flash('error', e.error || 'Update failed.');
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch('/api/bake-of-week', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          flash('success', 'Bake of the Week created.');
        } else {
          const e = await res.json().catch(() => ({}));
          flash('error', e.error || 'Creation failed.');
          setSaving(false);
          return;
        }
      }
      setFormOpen(false);
      load();
    } catch {
      flash('error', 'Something went wrong.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Bake of the Week?')) return;
    setDeleting(id);
    await fetch(`/api/bake-of-week/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
    flash('success', 'Bake of the Week deleted.');
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading Bake of the Week...
      </div>
    );
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    fontSize: '0.88rem',
    fontFamily: 'var(--font-body)',
    border: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.06)',
    color: '#FFFDF5',
    boxSizing: 'border-box',
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: 'var(--color-text-tertiary)',
    display: 'block',
    marginBottom: 8,
  };

  return (
    <div>
      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 9999,
          padding: '14px 22px',
          borderRadius: 12,
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          color: '#FFFDF5',
          background: message.type === 'success' ? '#1E7A3C' : '#C0392B',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: 'var(--color-brown-deep)', marginBottom: 4 }}>
            Bake of the Week
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-tertiary)' }}>
            Manage the hero floating card and featured showcase shown on the homepage ({items.length} total)
          </p>
        </div>
        <button
          onClick={openNew}
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
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 14px rgba(40, 85, 28, 0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span>+</span>
          <span>Add Bake of Week</span>
        </button>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 8, 16, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 680,
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#0F1A32',
            borderRadius: 20,
            border: '1px solid rgba(245, 211, 92, 0.25)',
            padding: 28,
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#FFFDF5' }}>
                {editingId ? 'Edit Bake of the Week' : 'New Bake of the Week'}
              </h2>
              <button onClick={() => setFormOpen(false)} aria-label="Close"
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1 }}>
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Or pick from existing product (auto-fill)</label>
                <select style={inputStyle} value={productId} onChange={(e) => handleProductSelect(e.target.value)}>
                  <option value="" style={{ background: '#0F1A32', color: '#FFFDF5' }}>— Choose a product to auto-fill —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: '#0F1A32', color: '#FFFDF5' }}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunflower Cream Cake" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Event / Badge Tag (e.g. Teej Special Offer)</label>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Shown on Hero Card &amp; Homepage Section</span>
                </div>
                <input
                  style={inputStyle}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Teej Special Offer, Bake of the Week, Festive Deal"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['Bake of the Week', 'Teej Special Offer', 'Dashain Special', 'Festive Offer', "Chef's Special", 'Weekend Deal'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSubtitle(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: '0.72rem',
                        background: subtitle === preset ? 'rgba(245, 211, 92, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: subtitle === preset ? '#F5D35C' : 'rgba(255, 253, 245, 0.75)',
                        border: subtitle === preset ? '1px solid #F5D35C' : '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Price (NPR) *</label>
                  <input style={inputStyle} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1800" />
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
                  <select style={inputStyle} value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {['/whole', '/piece', '/loaf', '/dozen'].map((u) => (
                      <option key={u} value={u} style={{ background: '#0F1A32', color: '#FFFDF5' }}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ─── Main Cake Image Section ─── */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(245, 211, 92, 0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0, color: '#F5D35C' }}>
                    1. Main Cake Photo (Hero Floating Card & Homepage Section)
                  </label>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Delete Image
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1.5px solid rgba(245, 211, 92, 0.3)',
                    background: 'rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {image ? (
                      <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', padding: 8 }}>No image</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        ref={mainFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'main')}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => mainFileInputRef.current?.click()}
                        disabled={uploadingMain}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 9999,
                          background: 'rgba(245, 211, 92, 0.15)',
                          color: '#F5D35C',
                          border: '1px solid rgba(245, 211, 92, 0.4)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        📁 {uploadingMain ? 'Uploading...' : 'Upload From Device'}
                      </button>
                    </div>

                    <input
                      style={{ ...inputStyle, padding: '9px 12px', fontSize: '0.82rem' }}
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Or paste cake image URL (https://...)"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Accent Photo Section ─── */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 14,
                padding: 16,
                border: '1px solid rgba(245, 211, 92, 0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0, color: '#F5D35C' }}>
                    2. Accent Photo (Overlapping Frame)
                  </label>
                  {secondaryImage && (
                    <button
                      type="button"
                      onClick={() => setSecondaryImage('')}
                      style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{
                    width: 90,
                    height: 90,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1.5px solid rgba(245, 211, 92, 0.3)',
                    background: 'rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {secondaryImage ? (
                      <img src={secondaryImage} alt="accent preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'center', padding: 8 }}>No image</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        ref={secondaryFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'secondary')}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => secondaryFileInputRef.current?.click()}
                        disabled={uploadingSecondary}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 9999,
                          background: 'rgba(245, 211, 92, 0.15)',
                          color: '#F5D35C',
                          border: '1px solid rgba(245, 211, 92, 0.4)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {uploadingSecondary ? 'Uploading...' : 'Upload Accent Photo'}
                      </button>
                    </div>

                    <input
                      style={{ ...inputStyle, padding: '9px 12px', fontSize: '0.82rem' }}
                      value={secondaryImage}
                      onChange={(e) => setSecondaryImage(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description (Shown on Homepage Bake of Week Section)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this week's bake, delicate layers, cream, flavors..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  id="bow-active"
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="bow-active" style={{ fontSize: '0.85rem', color: '#FFFDF5', cursor: 'pointer' }}>
                  Active (shown as this week&apos;s spotlight pick on the homepage)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 26 }}>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                style={{ padding: '12px 24px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)', border: '1px solid var(--color-border)', background: 'transparent', color: '#FFFDF5', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploadingMain || uploadingSecondary}
                style={{ padding: '12px 24px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-body)', border: 'none', background: 'var(--color-green)', color: '#FFFDF5', cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div style={{
          background: 'var(--color-card-bg)',
          borderRadius: 20,
          border: '1px solid var(--color-border)',
          padding: 60,
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '0.9rem',
        }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>🍰</div>
          No Bake of the Week item yet. Click &quot;Add Bake of Week&quot; to create your first one.
        </div>
      ) : (
        <div style={{
          background: 'var(--color-card-bg)',
          borderRadius: 20,
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ overflowX: 'auto' }} className="bow-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Main Item', 'Accent', 'Price', 'Status', 'Active', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '14px 24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-tertiary)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} style={{ borderBottom: '1px solid rgba(245, 211, 92, 0.1)' }}>
                    {/* Main Item */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--color-border)', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                          {i.image ? (
                            <img src={i.image} alt={i.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>🍰</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brown-deep)' }}>{i.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{i.subtitle || 'Bake of the Week'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Accent Thumbnail */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          overflow: 'hidden',
                          border: '1.5px solid rgba(245, 211, 92, 0.3)',
                          flexShrink: 0,
                          background: 'rgba(255,255,255,0.05)',
                        }}>
                          {i.secondary_image ? (
                            <img src={i.secondary_image} alt="accent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#94A3B8' }}>
                              None
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                          {i.secondary_image ? 'Custom' : 'Hidden'}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '16px 24px', fontSize: '0.92rem', fontFamily: 'var(--font-display)', color: 'var(--color-brown-deep)', fontWeight: 600 }}>
                      NPR {i.price.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>{i.unit}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 24px' }}>
                      {i.active ? (
                        <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(39, 174, 96, 0.18)', color: '#52B788', border: '1px solid rgba(39, 174, 96, 0.4)' }}>
                          Active
                        </span>
                      ) : (
                        <span style={{ padding: '4px 12px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Active toggle */}
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        onClick={async () => {
                          await fetch(`/api/bake-of-week/${i.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ active: !i.active }),
                          });
                          load();
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600,
                          border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.08)', color: '#FFFDF5', cursor: 'pointer',
                        }}
                      >
                        {i.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openEdit(i)}
                          style={{ padding: '6px 16px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--color-border)', color: '#FFFDF5', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(i.id)}
                          disabled={deleting === i.id}
                          style={{ padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(192,57,43,0.3)', color: 'var(--color-error)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
                        >
                          {deleting === i.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="bow-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: 12 }}>
            {items.map((i) => (
              <div key={i.id} style={{ background: '#111C38', borderRadius: 14, border: '1px solid rgba(245,211,92,0.15)', padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ position: 'relative', width: 56, height: 56 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#1a2744' }}>
                      {i.image ? <img src={i.image} alt={i.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>🍰</div>
                      )}
                    </div>
                    {i.secondary_image && (
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 6, overflow: 'hidden', border: '1.5px solid #fff' }}>
                        <img src={i.secondary_image} alt="accent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFDF5' }}>{i.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{i.subtitle || 'Bake of the Week'}</div>
                    <div style={{ fontFamily: 'var(--font-display)', color: '#F5D35C', fontWeight: 600, marginTop: 4 }}>NPR {i.price.toLocaleString()}</div>
                  </div>
                  <span style={i.active ? { fontSize: '0.68rem', color: '#52B788', fontWeight: 600 } : { fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                    {i.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(i)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(245,211,92,0.12)', color: '#F5D35C', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(245,211,92,0.2)', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(i.id)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(192,57,43,0.15)', color: '#e74c3c', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(192,57,43,0.25)', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
@media (max-width: 768px) {
  .bow-table-wrapper { display: none !important; }
  .bow-mobile-cards { display: flex !important; }
}
@media (min-width: 769px) {
  .bow-mobile-cards { display: none !important; }
}
      `}</style>
    </div>
  );
}
