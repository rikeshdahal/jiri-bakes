'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--color-green)', color: 'var(--color-cream)' },
  secondary: { border: '1.5px solid var(--color-green)', color: 'var(--color-green)', background: 'transparent' },
  ghost: { background: 'transparent', color: 'var(--color-green)' },
  danger: { background: 'var(--color-error)', color: 'var(--color-cream)' },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '8px 20px', fontSize: '0.8rem' },
  md: { padding: '12px 30px', fontSize: '0.85rem' },
  lg: { padding: '14px 36px', fontSize: '0.95rem' },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn('btn-root', className)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 'var(--radius-full)',
          fontWeight: 600,
          letterSpacing: '0.4px',
          transition: 'all var(--motion-normal) var(--motion-ease)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          fontFamily: 'var(--font-body)',
          ...variantStyles[variant],
          ...sizeStyles[size],
        }}
        {...props}
      >
        {loading && (
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
            aria-hidden="true"
          />
        )}
        <span style={{ opacity: loading ? 0.6 : 1 }}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
