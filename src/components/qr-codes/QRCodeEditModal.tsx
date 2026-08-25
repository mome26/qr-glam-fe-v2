import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { QrCode } from '../../types';

interface QRCodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: QrCode | null;
  onUpdate: (redirectLink: string) => Promise<void>;
}

export const QRCodeEditModal: React.FC<QRCodeEditModalProps> = ({
  isOpen,
  onClose,
  qrCode,
  onUpdate,
}) => {
  const [redirectLink, setRedirectLink] = useState(qrCode?.redirectLink || '');
  const [isPending, setIsPending] = useState(false);

  React.useEffect(() => {
    if (qrCode) {
      setRedirectLink(qrCode.redirectLink || '');
    }
  }, [qrCode]);

  if (!isOpen || !qrCode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await onUpdate(redirectLink);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">Edit QR Redirect</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Redirect URL
            </label>
            <input
              type="url"
              placeholder="https://example.com (leave empty to remove redirect)"
              value={redirectLink}
              onChange={(e) => setRedirectLink(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all"
            />
            <p className="text-xs text-muted-foreground">
              This link will be used when scanning the QR code #{qrCode.numericId}.
            </p>
            {redirectLink ? (
              <p className="text-xs text-warning">
                This override Media &amp; Storage
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Empty: QR will fall back to Media &amp; Storage
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-info rounded-lg hover:bg-info/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
