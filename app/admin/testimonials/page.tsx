'use client';

import { useState, useEffect } from 'react';
import { Testimonial } from '@/types';

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', initials: '', role: '', text: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonials = () => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((d) => setTestimonials(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const approvedCount = testimonials.filter((t) => t.approved).length;

  const toggleApproved = async (t: Testimonial) => {
    const updated = !t.approved;
    setTestimonials((prev) => prev.map((x) => (x.id === t.id ? { ...x, approved: updated } : x)));
    try {
      await fetch(`/api/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, approved: updated }),
      });
    } catch {
      setTestimonials((prev) => prev.map((x) => (x.id === t.id ? { ...x, approved: !updated } : x)));
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(null);
    const prev = testimonials;
    setTestimonials((list) => list.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setTestimonials(prev);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.data) setTestimonials((prev) => [d.data, ...prev]);
      setForm({ name: '', initials: '', role: '', text: '', rating: 5 });
      setShowForm(false);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number) => (
    <span style={{ color: 'var(--color-yellow)', fontSize: '1rem', letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (i < count ? '\u2605' : '\u2606')).join('')}
    </span>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>Loading testimonials...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--color-brown-deep)' }}>
          Testimonials
        </h1>
        <span style={{
          padding: '6px 16px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-green)', color: 'var(--color-cream)',
          fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px',
        }}>
          {approvedCount} / {testimonials.length} approved
        </span>
      </div>
      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-tertiary)', marginBottom: 36 }}>
        Manage customer testimonials and reviews.
      </p>

      {/* Table */}
      <div style={{
        background: 'var(--color-cream)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)', overflow: 'hidden',
      }}>
        {testimonials.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
            No testimonials yet.
          </div>
        ) : (
          <>
          <div style={{ overflowX: 'auto' }} className="admin-testimonials-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Role', 'Rating', 'Text', 'Approved', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem',
                      fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const,
                      color: 'var(--color-text-tertiary)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(221,210,184,0.5)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 34, height: 34, borderRadius: 'var(--radius-full)',
                          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-brown-deep)',
                          flexShrink: 0,
                        }}>
                          {t.initials || t.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-brown-deep)' }}>
                          {t.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--color-text-tertiary)' }}>
                      {t.role}
                    </td>
                    <td style={{ padding: '14px 20px' }}>{renderStars(t.rating)}</td>
                    <td style={{
                      padding: '14px 20px', fontSize: '0.82rem', color: 'var(--color-brown-deep)',
                      maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {t.text}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => toggleApproved(t)}
                        style={{
                          position: 'relative', width: 50, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                          background: t.approved ? 'var(--color-green)' : 'var(--color-border)',
                          transition: 'background 0.25s',
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 3, left: t.approved ? 25 : 3,
                          width: 22, height: 22, borderRadius: 'var(--radius-full)',
                          background: 'var(--color-cream)', transition: 'left 0.25s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => t.id && setDeletingId(t.id)}
                        style={{
                          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-error)', background: 'transparent',
                          color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-error)'; e.currentTarget.style.color = 'var(--color-cream)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-error)'; }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="admin-testimonials-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
            {testimonials.map((t) => (
              <div key={t.id} style={{
                background: '#111C38', borderRadius: 12, border: '1px solid rgba(245,211,92,0.15)',
                padding: 16, display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,211,92,0.15)', color: '#F5D35C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {t.initials || t.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#FFFDF5' }}>{t.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{t.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, fontStyle: 'italic' }}>"{t.text}"</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                  <span style={{ fontSize: '0.72rem', color: t.approved ? '#27ae60' : '#E87B32', fontWeight: 600 }}>{t.approved ? 'Approved' : 'Pending'}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleApproved(t)} style={{ padding: '6px 12px', borderRadius: 6, background: t.approved ? 'rgba(232,123,50,0.15)' : 'rgba(39,174,96,0.15)', color: t.approved ? '#E87B32' : '#27ae60', fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${t.approved ? 'rgba(232,123,50,0.3)' : 'rgba(39,174,96,0.3)'}`, cursor: 'pointer', minHeight: 36 }}>
                      {t.approved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button onClick={() => { if (t.id && confirm('Delete this testimonial?')) handleDelete(t.id); }} style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(192,57,43,0.15)', color: '#e74c3c', fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(192,57,43,0.25)', cursor: 'pointer', minHeight: 36 }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(43,29,16,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--color-cream)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', padding: '32px 36px',
            maxWidth: 380, width: '90%', textAlign: 'center',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-brown-deep)', marginBottom: 10, fontSize: '1.1rem' }}>
              Delete Testimonial?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginBottom: 28 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{
                  padding: '10px 24px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--color-border)', background: 'transparent',
                  color: 'var(--color-text-tertiary)', fontSize: '0.82rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                style={{
                  padding: '10px 24px', borderRadius: 'var(--radius-full)',
                  border: 'none', background: 'var(--color-error)',
                  color: 'var(--color-cream)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Testimonial Toggle + Form */}
      <div style={{ marginTop: 40 }}>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: '10px 28px', borderRadius: 'var(--radius-full)',
            background: showForm ? 'transparent' : 'var(--color-green)',
            color: showForm ? 'var(--color-green)' : 'var(--color-cream)',
            border: showForm ? '1.5px solid var(--color-green)' : '1.5px solid var(--color-green)',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.2s',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Testimonial'}
        </button>

        {showForm && (
          <form onSubmit={handleCreate} style={{
            marginTop: 24, padding: '28px 32px',
            background: 'var(--color-cream)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', maxWidth: 560,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Initials</label>
                <input
                  value={form.initials}
                  onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value }))}
                  style={inputStyle}
                  maxLength={3}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Role</label>
              <input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                style={inputStyle}
                placeholder="e.g. Regular Customer"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Text *</label>
              <textarea
                required
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Rating</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    style={{
                      fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer',
                      color: n <= form.rating ? 'var(--color-yellow)' : 'var(--color-border)',
                      transition: 'color 0.15s',                       padding: '0 2px',
                      minWidth: 40,
                      minHeight: 40,
                    }}
                  >
                    {n <= form.rating ? '\u2605' : '\u2606'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 28px', borderRadius: 'var(--radius-full)',
                background: 'var(--color-green)', color: 'var(--color-cream)',
                border: 'none', fontSize: '0.82rem', fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving...' : 'Create Testimonial'}
            </button>
          </form>
        )}
      </div>

      <style>{`
@media (max-width: 768px) {
  .admin-testimonials-table-wrapper { display: none !important; }
  .admin-testimonials-mobile-cards { display: flex !important; }
}
@media (min-width: 769px) {
  .admin-testimonials-mobile-cards { display: none !important; }
}
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '1px', textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  fontSize: '0.85rem', fontFamily: 'var(--font-body)',
  color: 'var(--color-brown-deep)',
  outline: 'none', boxSizing: 'border-box',
};
