'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from '@/components/admin/NotificationBell';

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  icon: (active: boolean) => ReactNode;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('admin@jiribakes.com');
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // If on login page, render clean full-page layout without sidebar
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.email) setUserEmail(d.data.email);
      })
      .catch(() => { });

    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const pending = d.data.filter((o: { status: string }) => o.status === 'pending').length;
          setPendingOrdersCount(pending);
        }
      })
      .catch(() => { });
  }, [isLoginPage, pathname]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <div data-theme="night" className="admin-root-dark">{children}</div>;
  }

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: (active) => (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#F5D35C' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      label: 'Products',
      href: '/admin/products',
      icon: (active) => (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#F5D35C' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
      icon: (active) => (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#F5D35C' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Testimonials',
      href: '/admin/testimonials',
      icon: (active) => (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#F5D35C' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: (active) => (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={active ? '#F5D35C' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      data-theme="night"
      className="admin-root-dark"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#09101F',
        color: '#FFFDF5',
        fontFamily: 'var(--font-body)',
        colorScheme: 'dark',
      }}
    >
      {/* ─── Global Admin Keyframes ─── */}
      <style>{`
        @keyframes admin-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .admin-live-dot {
          animation: admin-pulse 2s ease-in-out infinite;
        }
        .admin-nav-link {
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .admin-nav-link:hover {
          background: rgba(245, 211, 92, 0.12) !important;
          color: #F5D35C !important;
          transform: translateX(3px);
        }
      `}</style>

      {/* ─── Mobile Overlay ─── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 8, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 90,
          }}
        />
      )}

      {/* ─── Modern Permanent Dark Artisan Sidebar ─── */}
      <aside
        style={{
          width: 270,
          background: 'linear-gradient(180deg, #070D1A 0%, #0B132B 100%)',
          color: '#FAF6ED',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: '1px solid rgba(245, 211, 92, 0.16)',
          boxShadow: '4px 0 30px rgba(0, 0, 0, 0.45)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`modern-sidebar ${sidebarOpen ? 'open' : ''}`}
      >
        {/* Brand Header */}
        <div style={{ padding: '26px 22px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <img
                src="/main logo.png"
                alt="Jiri Bakes"
                style={{
                  height: 42,
                  width: 'auto',
                  borderRadius: 6,
                  objectFit: 'contain',
                }}
              />
              <span
                className="admin-live-dot"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#2ecc71',
                  border: '2px solid #070D1A',
                }}
              />
            </div>
            <div>
              <span
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#F5D35C',
                  fontWeight: 700,
                  display: 'block',
                  lineHeight: 1,
                  marginBottom: 3,
                }}
              >
                Admin CMS Studio
              </span>
              <span
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  color: '#FFFDF5',
                  lineHeight: 1.1,
                }}
              >
                Jiri Bakes
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.64rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.35)', fontWeight: 600, padding: '0 12px 6px' }}>
            Main Menu
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#F5D35C' : 'rgba(255, 253, 245, 0.75)',
                  background: isActive ? 'rgba(245, 211, 92, 0.14)' : 'transparent',
                  border: isActive ? '1px solid rgba(245, 211, 92, 0.28)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: '#E87B32',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(232, 123, 50, 0.4)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Quick Action Card */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(245, 211, 92, 0.2)',
                color: '#F5D35C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                AD
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', color: '#FFFDF5', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 120 }}>
                  {userEmail}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)' }}>Administrator</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Logout"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(192, 57, 43, 0.35)';
                e.currentTarget.style.color = '#ff7675';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.76rem',
              color: 'rgba(255, 253, 245, 0.75)',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 211, 92, 0.15)';
              e.currentTarget.style.color = '#F5D35C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'rgba(255, 253, 245, 0.75)';
            }}
          >
            <span>Preview Live Store</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* ─── Main Content Canvas (Permanent Dark Theme) ─── */}
      <div
        style={{
          flex: 1,
          marginLeft: 270,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#09101F',
        }}
        className="admin-main-canvas"
      >
        {/* Modern Dark Top Header */}
        <header
          style={{
            height: 68,
            background: 'rgba(13, 21, 39, 0.92)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(245, 211, 92, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(18px, 3.5vw, 36px)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          {/* Mobile hamburger & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="admin-hamburger-btn"
              aria-label="Open menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                color: '#FFFDF5',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
              <span style={{ color: 'rgba(255, 253, 245, 0.5)' }}>Admin Studio</span>
              <span style={{ color: 'rgba(245, 211, 92, 0.3)' }}>/</span>
              <span style={{ color: '#F5D35C', fontWeight: 600, textTransform: 'capitalize' }}>
                {pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Quick Actions & Live Status */}
          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="admin-live-badge" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(40, 85, 28, 0.25)',
              border: '1px solid rgba(82, 183, 136, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#52B788',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }} />
              <span>Live Database</span>
            </div>

            {/* Real-time order notification bell */}
            <NotificationBell />

            <Link
              href="/admin/products/new"
              className="admin-new-product-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #28551C 0%, #1e3f15 100%)',
                color: '#FFFDF5',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(245, 211, 92, 0.25)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>+</span>
              <span>New Product</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-sidebar-close"
            aria-label="Close menu"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: 'clamp(20px, 3vw, 36px)', maxWidth: 1400 }}>
          {children}
        </main>
      </div>

      {/* ─── Responsive Breakdown ─── */}
      <style>{`
        @media (max-width: 960px) {
          .modern-sidebar {
            transform: translateX(-100%) !important;
            width: 280px !important;
          }
          .modern-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-main-canvas {
            margin-left: 0 !important;
          }
          .admin-hamburger-btn {
            display: flex !important;
          }
          .admin-sidebar-close {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .modern-sidebar {
            width: 85vw !important;
            max-width: 300px !important;
          }
        }
        @media (max-width: 480px) {
          .admin-header-actions {
            gap: 6px !important;
          }
          .admin-header-actions .admin-live-badge {
            display: none !important;
          }
          .admin-header-actions .admin-new-product-link {
            padding: 8px 12px !important;
            font-size: 0.72rem !important;
          }
          .admin-header-actions .admin-new-product-link span:first-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
