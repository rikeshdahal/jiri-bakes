import type { ReactNode } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-xs)',
  className,
}: SkeletonProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        background: `linear-gradient(90deg, var(--color-surface-muted) 25%, var(--color-cream-dark) 50%, var(--color-surface-muted) 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-raised)' }}>
      <Skeleton height="200px" borderRadius="var(--radius-sm)" />
      <div style={{ marginTop: 'var(--space-5)' }}>
        <Skeleton height="18px" width="70%" />
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Skeleton height="14px" width="100%" />
          <div style={{ marginTop: 'var(--space-2)' }}>
            <Skeleton height="14px" width="85%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-raised)', textAlign: 'center' }}>
      <Skeleton height="32px" width="80px" borderRadius="var(--radius-md)" />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <Skeleton height="14px" width="100px" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
      <Skeleton width="64px" height="64px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton height="18px" width="180px" />
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Skeleton height="14px" width="240px" />
        </div>
      </div>
    </div>
  );
}
