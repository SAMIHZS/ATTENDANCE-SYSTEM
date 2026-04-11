import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-16 px-8',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">{icon}</span>
      </div>
      <h3 className="font-headline font-bold text-lg text-on-surface mb-2">{title}</h3>
      {description && (
        <p className="font-body text-sm text-on-surface-variant max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
