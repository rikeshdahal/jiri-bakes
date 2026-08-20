import type { ReactNode } from 'react';
import Button from '@/components/buttons/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export default function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-7)',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      {icon && (
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-5)', opacity: 0.5 }}>{icon}</div>
      )}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--color-text-tertiary)',
          fontSize: 'var(--text-sm)',
          lineHeight: 1.6,
          marginBottom: actionLabel ? 'var(--space-7)' : 0,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
