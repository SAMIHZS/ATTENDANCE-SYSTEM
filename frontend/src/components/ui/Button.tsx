import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string; // Material Symbols icon name
  iconPosition?: 'left' | 'right';
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-primary-container text-white hover:opacity-90 shadow-lg shadow-primary-container/20',
  secondary:
    'bg-secondary text-white hover:bg-secondary/90 shadow-md shadow-secondary/20',
  ghost:
    'bg-transparent text-on-surface hover:bg-surface-container-low border border-outline-variant',
  danger:
    'bg-error text-white hover:opacity-90 shadow-md',
  outline:
    'bg-surface-container-lowest text-primary border border-outline-variant hover:bg-surface-container-low',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-2',
  md: 'h-12 px-6 text-sm gap-2',
  lg: 'h-14 px-8 text-base gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'right',
      children,
      className,
      disabled,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          // Base
          'relative inline-flex items-center justify-center font-headline font-bold rounded-xl transition-all duration-150 active:scale-95',
          // Variant
          VARIANT_CLASSES[variant],
          // Size
          SIZE_CLASSES[size],
          // Disabled
          isDisabled && 'opacity-40 cursor-not-allowed active:scale-100',
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {loading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </span>
        )}
        <span className={clsx('flex items-center gap-2', loading && 'invisible')}>
          {icon && iconPosition === 'left' && (
            <span className="material-symbols-outlined text-lg">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5">
              {icon}
            </span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
