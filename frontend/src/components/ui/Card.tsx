import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

type CardVariant = 'default' | 'hero' | 'elevated' | 'flat';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-surface-container-lowest shadow-editorial',
  hero: 'bg-primary-container shadow-2xl',
  elevated: 'bg-surface-container-lowest shadow-xl',
  flat: 'bg-surface-container-low',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl overflow-hidden transition-colors',
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
