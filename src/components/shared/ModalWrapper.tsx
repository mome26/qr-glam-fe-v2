import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  headerClassName?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  icon,
  headerClassName = '',
  children,
  size = 'md',
}: ModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-background rounded-xl shadow-xl border border-border w-full ${sizeClasses[size]} overflow-hidden animate-in fade-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b border-border flex justify-between items-center bg-accent/30 ${headerClassName}`}>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
