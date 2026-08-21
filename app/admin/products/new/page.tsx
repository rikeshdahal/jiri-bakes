'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Textarea from '@/components/forms/Textarea';

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '/piece',
    category: 'pastry',
    badge: '',
    image: '',
    rating: '5',
    featured: false,
    is_bake_of_week: false,
  });

  const update = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to upload image');
        return;
      }
      if (json.data?.url) {
        update('image', json.data.url);
      }
    } catch {
      setError('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      setError('Product name is required');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseInt(form.price) || 0,
          rating: parseInt(form.rating) || 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product');
        return;
      }
      router.push('/admin/products');
    } catch {
      setError('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-brown-deep)', marginBottom: 28 }}>
        Add New Product
      </h1>

      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', color: 'var(--color-error)', fontSize: '0.82rem', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: 'var(--color-cream)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: 'clamp(24px, 3vw, 36px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <Input label="Product Name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Honey Glazed Brioche" required />
        <Textarea label="Description" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Detailed description of the artisan ingredients, notes, etc." />

        <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Price (NPR)" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="e.g. 650" required />
          <Input label="Unit" value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="/piece, /loaf, /whole" />
        </div>

        <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            options={[
              { value: 'cake', label: 'Cakes' },
              { value: 'pastry', label: 'Pastries' },
              { value: 'bread', label: 'Breads' },
              { value: 'cookie', label: 'Cookies' },
              { value: 'seasonal', label: 'Seasonal' },
            ]}
          />
          <Input label="Badge" value={form.badge} onChange={(e) => update('badge', e.target.value)} placeholder="e.g. Fresh Today, Organic" />
        </div>

        {/* Image upload + URL */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brown-deep)', marginBottom: 6 }}>
            Product Image
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={form.image}
              onChange={(e) => update('image', e.target.value)}
              placeholder="Paste URL or upload image below..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
              }}
            />
            <label style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-brown-deep)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </label>
          </div>
        </div>

        <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select
            label="Rating"
            value={form.rating}
            onChange={(e) => update('rating', e.target.value)}
            options={[
              { value: '5', label: '5 Stars' },
              { value: '4', label: '4 Stars' },
              { value: '3', label: '3 Stars' },
              { value: '2', label: '2 Stars' },
              { value: '1', label: '1 Star' },
            ]}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-brown-deep)' }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update('featured', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--color-green)' }}
              />
              ⭐ Featured in Homepage Showcase
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-brown-deep)' }}>
              <input
                type="checkbox"
                checked={form.is_bake_of_week}
                onChange={(e) => update('is_bake_of_week', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#F5D35C' }}
              />
              Bake of the Week (Hero Floating Card)
            </label>
          </div>
        </div>

        {form.image && (
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)', maxHeight: 180, position: 'relative' }}>
            <img src={form.image} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, paddingTop: 8, flexWrap: 'wrap' }}>
          <button type="submit" disabled={saving || uploading} style={{
            padding: '12px 32px', borderRadius: 'var(--radius-full)',
            background: 'var(--color-green)', color: 'var(--color-cream)',
            fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)',
          }}>
            {saving ? 'Creating...' : 'Create Product'}
          </button>
          <button type="button" onClick={() => router.push('/admin/products')} style={{
            padding: '12px 32px', borderRadius: 'var(--radius-full)',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text-tertiary)', fontSize: '0.85rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Cancel
          </button>
        </div>
      </form>
      <style>{`
        @media (max-width: 600px) {
          .admin-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
