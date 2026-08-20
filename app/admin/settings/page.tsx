'use client';

import { useState, useEffect } from 'react';
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

const ALL_KEYS = [...SETTINGS_KEYS, ...CONTACT_KEYS, ...HOURS_KEYS];

type SettingsMap = Record<string, string>;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Something went wrong.' });
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
            Manage your site&apos;s branding, contact info, and hours.
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
