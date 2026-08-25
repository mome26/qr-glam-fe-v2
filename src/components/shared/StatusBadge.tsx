import type { ReactNode } from 'react';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'muted';

interface StatusBadgeProps {
  variant: StatusType;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantClasses: Record<StatusType, string> = {
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-error/10 text-error border-error/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
  muted: 'bg-muted/5 text-muted-foreground border-muted/20',
};

export default function StatusBadge({
  variant,
  children,
  icon,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variantClasses[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
