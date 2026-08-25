import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Guest } from '../../types';

interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  group: string;
  status: string;
}

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuestFormData) => Promise<void>;
  guest?: Guest | null;
  isPending: boolean;
}

export default function GuestModal({ isOpen, onClose, onSubmit, guest, isPending }: GuestModalProps) {
  const getInitialFormData = (g: Guest | null | undefined): GuestFormData => ({
    name: g?.name || '',
    email: g?.email || '',
    phone: g?.phone || '',
    role: g?.role || '',
    group: g?.group || '',
    status: g?.status || 'Pending',
  });

  const [formData, setFormData] = useState<GuestFormData>(() => getInitialFormData(guest));

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(getInitialFormData(guest));
    }
  }, [isOpen, guest]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      ...(formData.email ? { email: formData.email } : {}),
      ...(formData.phone ? { phone: formData.phone } : {}),
      ...(formData.role ? { role: formData.role } : {}),
      ...(formData.group ? { group: formData.group } : {}),
      ...(formData.status ? { status: formData.status } : {}),
    };
    await onSubmit(payload as GuestFormData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-background rounded-xl shadow-xl border border-border w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/30">
          <h3 className="text-lg font-semibold text-card-foreground">
            {guest ? 'Edit Guest' : 'Add New Guest'}
          </h3>
          <button 
            onClick={onClose}
            className="text-muted hover:text-foreground transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-1 focus:ring-info outline-none bg-background"
              placeholder="e.g. Alice Nguyen"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-1 focus:ring-info outline-none bg-background"
                placeholder="alice@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-1 focus:ring-info outline-none bg-background"
                placeholder="+84..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-1 focus:ring-info outline-none bg-background"
                placeholder="e.g. VIP"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Group</label>
              <input
                type="text"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-1 focus:ring-info outline-none bg-background"
                placeholder="e.g. Family"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-1 focus:ring-info outline-none bg-background text-foreground"
              >
                <option value="Pending">Pending</option>
                <option value="Complete">Complete</option>
                <option value="Denied">Denied</option>
              </select>
            </div>
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
              type="submit"
              className="flex items-center gap-2 bg-info text-white rounded-md px-6 py-2 text-sm font-bold hover:bg-info/90 transition-all shadow-md disabled:opacity-50"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {guest ? 'Save Changes' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
