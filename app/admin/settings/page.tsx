'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import Input from '@/components/forms/Input';

const SETTINGS_KEYS = [
  { key: 'site_name', label: 'Site Name', placeholder: 'Jiri Bakes' },
  { key: 'tagline', label: 'Tagline', placeholder: 'Simply Organic' },
  { key: 'hero_headline', label: 'Hero Headline', placeholder: 'Baked Like Art.' },
  { key: 'hero_subheadline', label: 'Hero Subtitle', placeholder: 'Handcrafted organic breads, cakes, and morning pastries...' },
  { key: 'announcement_banner', label: 'Announcement / Promo Banner', placeholder: 'Fresh organic sourdough available every morning at 7:30 AM!' },
] as const;

const CONTACT_KEYS = [
  { key: 'phone', label: 'Phone', placeholder: '+977 1-4567890' },
  { key: 'whatsapp_phone', label: 'WhatsApp Number (without +)', placeholder: '9779841234567' },
  { key: 'email', label: 'Email', placeholder: 'hello@jiribakes.com.np' },
  { key: 'address', label: 'Bakery Address', placeholder: 'Lokanthali, Araniko Highway, Bhaktapur, Nepal' },
] as const;

const HOURS_KEYS = [
  { key: 'hours_weekday', label: 'Weekday Hours', placeholder: 'Mon – Sat: 7:00 AM – 8:00 PM' },
  { key: 'hours_sunday', label: 'Sunday Hours', placeholder: 'Sunday: 8:00 AM – 6:00 PM' },
  { key: 'fresh_bread_time', label: 'Fresh Bread Oven Time', placeholder: '7:30 AM' },
] as const;

const ALL_KEYS = [
  ...SETTINGS_KEYS,
  ...CONTACT_KEYS,
  ...HOURS_KEYS,
  { key: 'we_care_image' },
];

type SettingsMap = Record<string, string>;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const map: SettingsMap = {};
        if (d.data) {
          for (const row of d.data) {
            map[row.key] = row.value ?? '';
          }
        }
        setValues(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (feedback) setFeedback(null);
  };

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || 'Failed to upload image');
        return;
      }
      if (json.data?.url) {
        const newUrl = json.data.url;
        handleChange('we_care_image', newUrl);
        // Auto-save immediately so homepage reflects at once
        const allSettings = ALL_KEYS.map(({ key }) => ({ key, value: key === 'we_care_image' ? newUrl : (values[key] ?? '') }));
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: allSettings }),
        });
        setFeedback({ type: 'success', message: 'We Care banner updated and saved!' });
      }
    } catch {
      setUploadError('Failed to upload image from device.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const settings = ALL_KEYS.map(({ key }) => ({ key, value: values[key] ?? '' }));
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setFeedback({ type: 'success', message: 'Settings saved successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        Loading settings...
      </div>
    );
  }

  const renderSection = (
    title: string,
    fields: readonly { key: string; label: string; placeholder: string }[]
  ) => (
    <div style={sectionCardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {fields.map(({ key, label, placeholder }) => (
        <Input
          key={key}
          label={label}
          placeholder={placeholder}
          value={values[key] ?? ''}
          onChange={(e) => handleChange(key, e.target.value)}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-brown-deep)', marginBottom: 4 }}>
            Site Settings
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)' }}>
            Manage site branding, contact info, hours, and the We Care banner.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} style={saveButtonStyle}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 24,
            fontSize: '0.85rem',
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            background: feedback.type === 'success' ? 'rgba(82,183,136,0.12)' : 'rgba(231,76,60,0.12)',
            color: feedback.type === 'success' ? '#52B788' : 'var(--color-error)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(82,183,136,0.3)' : 'rgba(231,76,60,0.3)'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {renderSection('Brand', SETTINGS_KEYS)}
      {renderSection('Contact', CONTACT_KEYS)}
      {renderSection('Hours', HOURS_KEYS)}

      {/* ─── We Care Banner Image (device upload or URL) ─── */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>🐾 We Care Banner Image</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{
            width: 140,
            height: 90,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src={values['we_care_image'] || '/we care.png'}
              alt="We Care Banner Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/we care.png'; }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <label style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-green)',
                color: '#FFFDF5',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(40,85,28,0.2)',
                opacity: uploadingBanner ? 0.6 : 1,
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  style={{ display: 'none' }}
                />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {uploadingBanner ? 'Uploading from device...' : 'Upload Image From Device'}
              </label>

              {values['we_care_image'] && values['we_care_image'] !== '/we care.png' && (
                <button
                  type="button"
                  onClick={() => handleChange('we_care_image', '/we care.png')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(192,57,43,0.08)',
                    color: '#c0392b',
                    border: '1px solid rgba(192,57,43,0.2)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset to Default Art
                </button>
              )}
            </div>

            {uploadError && (
              <div style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: 4, marginBottom: 8 }}>
                {uploadError}
              </div>
            )}
            <p style={{ fontSize: '0.74rem', color: 'var(--color-text-tertiary)', marginBottom: 8, lineHeight: 1.5 }}>
              Device upload saves instantly. On Vercel hosting uploads can&apos;t persist — paste an image URL below instead, then press Save Changes.
            </p>

            <input
              type="text"
              value={values['we_care_image'] ?? ''}
              onChange={(e) => handleChange('we_care_image', e.target.value)}
              placeholder="Or paste image URL (e.g. /uploads/image.jpg or https://...)"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionCardStyle: React.CSSProperties = {
  background: 'var(--color-cream)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  padding: '28px 28px 8px',
  marginBottom: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.1rem',
  color: 'var(--color-brown-deep)',
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: '1px solid var(--color-border)',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '10px 28px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--color-green)',
  color: 'var(--color-cream)',
  fontSize: '0.82rem',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};
