import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'danger' | 'live' | 'info' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-container text-on-surface-variant',
  success: 'bg-secondary-container text-on-secondary-container',
  danger: 'bg-error-container text-on-error-container',
  live: 'bg-tertiary-fixed text-on-tertiary-fixed',
  info: 'bg-primary-fixed text-on-primary-fixed',
  warning: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
};

export function Badge({
  variant = 'default',
  dot = false,
  children,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full',
        'text-[10px] font-bold uppercase tracking-wider font-label',
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'live' ? 'bg-on-tertiary-fixed' : 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
}
