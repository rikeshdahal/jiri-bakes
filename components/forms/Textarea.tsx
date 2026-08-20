'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={cn('textarea-group', className)} style={{ width: fullWidth ? '100%' : undefined, marginBottom: 'var(--space-5)' }}>
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-error)', marginLeft: '2px' }} aria-hidden="true">
              *
            </span>
          )}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          style={{
            width: '100%',
            padding: '14px 18px',
            border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            background: 'var(--color-surface-raised)',
            color: 'var(--color-text-primary)',
            transition: `border-color var(--motion-instant) var(--motion-ease), box-shadow var(--motion-instant) var(--motion-ease)`,
            outline: 'none',
            resize: 'vertical',
            minHeight: '120px',
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-gold)';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(200, 145, 58, 0.1)';
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            style={{
              color: 'var(--color-error)',
              fontSize: 'var(--text-xs)',
              marginTop: 'var(--space-2)',
            }}
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            style={{
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--text-xs)',
              marginTop: 'var(--space-2)',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
