'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('card', className)}
        style={{
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
          transition: `all var(--motion-normal) var(--motion-ease)`,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (hover) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }
        }}
        onMouseLeave={(e) => {
          if (hover) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card-header', className)}
      style={{ marginBottom: 'var(--space-5)', ...props.style }}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, style, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('card-title', className)}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        ...style,
      }}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, style, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('card-description', className)}
      style={{
        color: 'var(--color-text-tertiary)',
        fontSize: 'var(--text-sm)',
        marginTop: 'var(--space-2)',
        ...style,
      }}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('card-content', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}
const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('card-footer', className)}
      style={{
        marginTop: 'var(--space-5)',
        paddingTop: 'var(--space-5)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        ...style,
      }}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
