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
  const [newImageUrl, setNewImageUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '/piece',
    category: 'pastry',
    badge: '',
    image: '',
    images: [] as string[],
    rating: '5',
    featured: false,
    is_bake_of_week: false,
  });

  const update = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const setImages = (images: string[]) => setForm((prev) => ({ ...prev, images }));

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    const newUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to upload image');
          break;
        }
        if (json.data?.url) newUrls.push(json.data.url);
      }
      if (newUrls.length > 0) setImages([...form.images, ...newUrls]);
    } catch {
      setError('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  const addImageUrl = () => {
    const urls = newImageUrl.split(',').map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setImages([...form.images, ...urls]);
    setNewImageUrl('');
  };

  const makeCover = (idx: number) => {
    setImages([form.images[idx], ...form.images.filter((_, i) => i !== idx)]);
  };

  const removeImage = (idx: number) => {
    setImages(form.images.filter((_, i) => i !== idx));
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
          image: form.images[0] || form.image,
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

        {/* Multi-image upload + URL */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brown-deep)', marginBottom: 4 }}>
            Product Images
          </label>
          <p style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)', marginBottom: 10, lineHeight: 1.5 }}>
            Add as many photos as you like — <strong style={{ color: 'var(--color-green)' }}>the first image is the cover</strong> shown on the menu.
          </p>

          {/* Thumbnail grid */}
          {form.images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
              {form.images.map((url, i) => (
                <div key={i} style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: i === 0 ? '2px solid var(--color-green)' : '1px solid var(--color-border)',
                  aspectRatio: '1/1',
                  background: 'var(--color-bg)',
                }}>
                  <img src={url} alt={`Image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                  {i === 0 && (
                    <span style={{
                      position: 'absolute', top: 6, left: 6,
                      background: 'var(--color-green)', color: '#FFFDF5',
                      fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 9999, letterSpacing: '0.3px',
                    }}>Cover</span>
                  )}
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      title="Set as cover"
                      aria-label={`Set image ${i + 1} as cover`}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.92)', border: 'none',
                        color: '#8A6D3B', fontSize: '0.72rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      }}
                    >★</button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    title="Remove image"
                    aria-label={`Remove image ${i + 1}`}
                    style={{
                      position: 'absolute', bottom: 6, right: 6,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(192,57,43,0.92)', border: 'none',
                      color: '#fff', fontSize: '0.8rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {form.images.length === 0 && (
            <div style={{
              padding: '18px', borderRadius: 'var(--radius-sm)',
              border: '1.5px dashed var(--color-border)', marginBottom: 14,
              textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-tertiary)',
            }}>
              No images yet — upload photos or paste an image URL below.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
              placeholder="Paste image URL (comma-separated works too)..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                minWidth: 200,
              }}
            />
            <button type="button" onClick={addImageUrl} style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--color-brown-deep)', cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
            }}>
              Add URL
            </button>
            <label style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-green)',
              color: '#FFFDF5',
              fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)',
            }}>
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              {uploading ? 'Uploading...' : 'Upload Photos'}
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

        {form.images.length === 0 && form.image && (
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
