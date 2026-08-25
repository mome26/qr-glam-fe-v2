import { UserX, Loader2 } from 'lucide-react';

interface GuestDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  name: string;
  isPending: boolean;
}

export default function GuestDeleteConfirm({ isOpen, onClose, onConfirm, name, isPending }: GuestDeleteConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl border border-border w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-error/10">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-error" />
            <h3 className="text-lg font-semibold text-error">Deny Guest</h3>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-foreground">
              Are you sure you want to deny <span className="font-bold">{name}</span>?
            </p>
            <p className="text-xs text-muted font-medium">
              This will set their status to Denied and hide them from default views.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 bg-error text-white rounded-md px-6 py-2 text-sm font-bold hover:bg-error/90 transition-all shadow-md disabled:opacity-50"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Deny Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
