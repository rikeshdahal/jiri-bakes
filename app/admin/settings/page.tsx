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

const STREET_DOG_KEYS = [
  { key: 'street_dog_title', label: 'Charity Banner Title', placeholder: '5% of Total Sales Goes to Street Dog Charity' },
  { key: 'street_dog_percent', label: 'Charity Contribution %', placeholder: '5%' },
  { key: 'street_dog_social_url', label: 'Social Media URL (Proof & Stories of Contributions)', placeholder: 'https://www.instagram.com/jiribakes' },
] as const;

const ALL_KEYS = [
  ...SETTINGS_KEYS,
  ...CONTACT_KEYS,
  ...HOURS_KEYS,
  ...STREET_DOG_KEYS,
  { key: 'street_dog_image' },
  { key: 'street_dog_desc' },
  { key: 'street_dog_qr_image' },
];

type SettingsMap = Record<string, string>;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDogImg, setUploadingDogImg] = useState(false);
  const [uploadingQrImg, setUploadingQrImg] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [qrUploadError, setQrUploadError] = useState('');
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

  const handleDogImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDogImg(true);
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
        // Update local state
        handleChange('street_dog_image', newUrl);
        // Auto-save immediately so homepage reflects at once
        const allSettings = ALL_KEYS.map(({ key }) => ({ key, value: key === 'street_dog_image' ? newUrl : (values[key] ?? '') }));
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: allSettings }),
        });
        setFeedback({ type: 'success', message: 'Banner image updated and saved!' });
      }
    } catch {
      setUploadError('Failed to upload image from device.');
    } finally {
      setUploadingDogImg(false);
    }
  };

  const handleQrImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQrImg(true);
    setQrUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) { setQrUploadError(json.error || 'Failed to upload'); return; }
      if (json.data?.url) {
        const newUrl = json.data.url;
        handleChange('street_dog_qr_image', newUrl);
        const allSettings = ALL_KEYS.map(({ key }) => ({ key, value: key === 'street_dog_qr_image' ? newUrl : (values[key] ?? '') }));
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: allSettings }),
        });
        setFeedback({ type: 'success', message: 'Custom QR image uploaded and saved!' });
      }
    } catch {
      setQrUploadError('Failed to upload QR image.');
    } finally {
      setUploadingQrImg(false);
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

  const currentDogImg = values['street_dog_image'] || '/we care.png';
  const socialUrl = values['street_dog_social_url'] || 'https://www.instagram.com/jiribakes';
  const customQrImg = values['street_dog_qr_image'] || '';
  const autoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(socialUrl)}`;
  const qrCodeUrl = customQrImg || autoQrUrl;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-brown-deep)', marginBottom: 4 }}>
            Site Settings
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)' }}>
            Manage site branding, contact info, street dog charity, and hours.
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
            background: feedback.type === 'success' ? 'rgba(40,85,28,0.08)' : 'rgba(192,57,43,0.08)',
            color: feedback.type === 'success' ? 'var(--color-green)' : 'var(--color-error)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(40,85,28,0.2)' : 'rgba(192,57,43,0.2)'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* ─── NEW: Street Dog Charity Section ─── */}
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ ...sectionTitleStyle, borderBottom: 'none', paddingBottom: 0, marginBottom: 4 }}>
              🐾 We Care — Street Dog Charity Initiative
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
              5% of total bakery sales directly supports street dogs. Upload banner images directly from your device and configure your social media proof link.
            </p>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 9999, background: 'rgba(82, 183, 136, 0.15)', color: '#28551C', fontSize: '0.75rem', fontWeight: 700 }}>
            {values['street_dog_percent'] || '5%'} Sales Contribution
          </span>
        </div>

        {/* Device Image Uploader */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brown-deep)', marginBottom: 8 }}>
            Street Dog Banner Image (Change from your device)
          </label>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Image Preview Box */}
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
                src={currentDogImg}
                alt="Street Dog Banner Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/we care.png'; }}
              />
            </div>

            {/* Upload Button from Device */}
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
                  opacity: uploadingDogImg ? 0.6 : 1,
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDogImageUpload}
                    disabled={uploadingDogImg}
                    style={{ display: 'none' }}
                  />
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploadingDogImg ? 'Uploading from device...' : 'Upload Image From Device'}
                </label>

                {values['street_dog_image'] && values['street_dog_image'] !== '/we care.png' && (
                  <button
                    type="button"
                    onClick={() => handleChange('street_dog_image', '/we care.png')}
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
                <div style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: 4 }}>
                  {uploadError}
                </div>
              )}

              {/* Or manual URL input */}
              <input
                type="text"
                value={values['street_dog_image'] ?? ''}
                onChange={(e) => handleChange('street_dog_image', e.target.value)}
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

        {/* Text Fields */}
        {STREET_DOG_KEYS.map(({ key, label, placeholder }) => (
          <Input
            key={key}
            label={label}
            placeholder={placeholder}
            value={values[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        ))}

        {/* Description Textarea */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brown-deep)', marginBottom: 6 }}>
            Charity Description / Story
          </label>
          <textarea
            rows={3}
            value={values['street_dog_desc'] ?? ''}
            onChange={(e) => handleChange('street_dog_desc', e.target.value)}
            placeholder="At Jiri Bakes, 5% of all purchases directly funds daily meals, medical care, and shelter for street dogs in Lokanthali..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-primary)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* QR Code — Dynamic: upload custom or auto-generate from social URL */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brown-deep)', marginBottom: 6 }}>
            📱 QR Code Image
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 12, lineHeight: 1.5 }}>
            Upload a custom QR code image (e.g., from Instagram, TikTok, Facebook) or leave blank to auto-generate from the social URL above.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            {/* QR Preview */}
            <div style={{ background: '#fff', padding: 8, borderRadius: 10, border: '1.5px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', flexShrink: 0 }}>
              <img src={qrCodeUrl} alt="QR Code Preview" width={100} height={100} style={{ display: 'block', borderRadius: 6 }} />
              <div style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>
                {customQrImg ? 'Custom QR' : 'Auto-generated'}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              {/* Upload from device */}
              <label style={{ padding: '9px 18px', borderRadius: 'var(--radius-full)', background: 'var(--color-green)', color: '#FFFDF5', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(40,85,28,0.2)', opacity: uploadingQrImg ? 0.6 : 1, marginBottom: 8 }}>
                <input type="file" accept="image/*" onChange={handleQrImageUpload} disabled={uploadingQrImg} style={{ display: 'none' }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {uploadingQrImg ? 'Uploading...' : 'Upload Custom QR from Device'}
              </label>

              {customQrImg && (
                <button type="button" onClick={() => handleChange('street_dog_qr_image', '')} style={{ display: 'block', padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(192,57,43,0.09)', color: '#c0392b', border: '1px solid rgba(192,57,43,0.2)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
                  ✕ Remove Custom QR (use auto-generated)
                </button>
              )}

              {qrUploadError && <div style={{ color: '#c0392b', fontSize: '0.76rem', marginBottom: 6 }}>{qrUploadError}</div>}

              {/* Or paste URL manually */}
              <input
                type="text"
                value={values['street_dog_qr_image'] ?? ''}
                onChange={(e) => handleChange('street_dog_qr_image', e.target.value)}
                placeholder="Or paste QR image URL (leave blank to auto-generate)"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '0.8rem', fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <a href={socialUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.76rem', color: 'var(--color-green)', fontWeight: 600, textDecoration: 'none' }}>
            Test Social Link ↗ ({socialUrl})
          </a>
        </div>
      </div>

      {renderSection('Brand', SETTINGS_KEYS)}
      {renderSection('Contact', CONTACT_KEYS)}
      {renderSection('Hours', HOURS_KEYS)}
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
