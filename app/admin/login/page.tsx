'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/forms/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@jiribakes.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1C2C19 0%, #131E11 100%)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient glow rings */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,211,92,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(40,85,28,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#0F1D38',
        borderRadius: 24,
        padding: 'clamp(36px, 5vw, 48px)',
        border: '1.5px solid rgba(245, 211, 92, 0.3)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            margin: '0 auto 16px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <img src="/main logo.png" alt="Jiri Bakes" style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.65rem',
            color: '#FFFDF5',
            marginBottom: 4,
          }}>
            Jiri Bakes Studio
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#52B788', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            Admin CMS Portal
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(192, 57, 43, 0.08)',
            border: '1px solid rgba(192, 57, 43, 0.2)',
            color: 'var(--color-error)',
            fontSize: '0.82rem',
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@jiribakes.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: '15px 0',
              borderRadius: 9999,
              background: 'var(--color-green)',
              color: '#FFFDF5',
              fontSize: '0.92rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.25s',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(40, 85, 28, 0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(245, 211, 92, 0.2)' }}>
          <a
            href="/"
            style={{
              fontSize: '0.82rem',
              color: '#94A3B8',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>←</span>
            <span>Return to Bakery Website</span>
          </a>
        </div>
      </div>
    </div>
  );
}
