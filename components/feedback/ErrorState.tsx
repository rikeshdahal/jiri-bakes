'use client';

import Button from '@/components/buttons/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-7)',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-5)' }}>&#9888;</div>
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
          marginBottom: onRetry ? 'var(--space-7)' : 0,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
