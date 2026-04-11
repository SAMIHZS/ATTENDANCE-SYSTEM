import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string; // Material Symbols
  rightIcon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, className, id, ...rest }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'block w-full h-14 bg-surface-container-high border-none rounded-xl',
              'text-on-surface font-body text-sm',
              'placeholder:text-on-surface-variant/50',
              'focus:ring-2 focus:ring-secondary/40 focus:outline-none',
              'transition-all duration-150',
              icon ? 'pl-12' : 'pl-4',
              rightIcon ? 'pr-12' : 'pr-4',
              error && 'ring-2 ring-error/50 focus:ring-error',
              className
            )}
            {...rest}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-xl">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="text-error text-xs font-label ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-on-surface-variant text-xs font-label ml-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
