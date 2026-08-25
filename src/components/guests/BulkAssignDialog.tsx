import { useState } from 'react';
import { X, UserCheck } from 'lucide-react';

const ROLES = ['VIP', 'Speaker', 'Attendee', 'Staff', 'Vendor', 'Bride', 'Groom', 'Family'];

interface BulkAssignDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (role: string) => void;
  isPending?: boolean;
}

export default function BulkAssignDialog({
  isOpen,
  selectedCount,
  onClose,
  onConfirm,
  isPending = false,
}: BulkAssignDialogProps) {
  const [selectedRole, setSelectedRole] = useState('');
  const [custom, setCustom] = useState('');

  if (!isOpen) return null;

  const role = selectedRole === '__custom__' ? custom.trim() : selectedRole;

  const handleConfirm = () => {
    if (!role) return;
    onConfirm(role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-info" />
            <h2 className="text-lg font-semibold text-foreground">Bulk Assign Role</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-muted">
            Assign a role to <span className="font-semibold text-foreground">{selectedCount}</span> selected guest{selectedCount !== 1 ? 's' : ''}.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-info focus:border-info"
            >
              <option value="">Choose a role...</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="__custom__">Custom role...</option>
            </select>
          </div>

          {selectedRole === '__custom__' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Custom Role Name</label>
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Enter role name..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-info focus:border-info"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-accent/40 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!role || isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-info rounded-md hover:bg-info/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            Assign Role
          </button>
        </div>
      </div>
    </div>
  );
}
