import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-24 text-center flex flex-col items-center justify-center gap-6 bg-accent/30 rounded-xl border-2 border-dashed border-border ${className}`}
    >
      <div className="text-muted">{icon}</div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
