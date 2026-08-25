import { Pencil, Trash2, QrCode } from 'lucide-react';
import type { Guest } from '../../types';

interface GuestRowActionsProps {
  guest: Guest;
  onEdit: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
  onViewQr: (guest: Guest) => void;
}

export default function GuestRowActions({ guest, onEdit, onDelete, onViewQr }: GuestRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => onViewQr(guest)}
        className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-md transition-all"
        title="View QR Code"
      >
        <QrCode className="w-4 h-4" />
      </button>
      <button 
        onClick={() => onEdit(guest)}
        className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-md transition-all"
        title="Edit Guest"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button 
        onClick={() => onDelete(guest.id)}
        className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-md transition-all"
        title="Deny Guest"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
