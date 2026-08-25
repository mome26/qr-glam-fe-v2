import React, { useState, useEffect } from 'react';
import { X, Loader2, Download } from 'lucide-react';
import { qrCodeApi } from '../../api/qrCodeApi';

interface BulkDownloadRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onDownload: (from: number, to: number) => Promise<void>;
}

export const BulkDownloadRangeModal: React.FC<BulkDownloadRangeModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onDownload,
}) => {
  const [startFrom, setStartFrom] = useState<number>(1);
  const [endAt, setEndAt] = useState<number>(10);
  const [totalQrCodes, setTotalQrCodes] = useState<number>(0);
  const [isLoadingTotal, setIsLoadingTotal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      setIsLoadingTotal(true);
      qrCodeApi.getQrCodes(eventId, { page: 1, limit: 1 })
        .then((data) => {
          setTotalQrCodes(data.total || 0);
          // Default endAt to total
          if (data.total) {
            setEndAt(data.total);
          }
        })
        .catch(() => setTotalQrCodes(0))
        .finally(() => setIsLoadingTotal(false));
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startFrom < 1 || endAt < startFrom || endAt > totalQrCodes) return;

    setIsPending(true);
    try {
      await onDownload(startFrom, endAt);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsPending(false);
    }
  };

  const count = endAt >= startFrom ? endAt - startFrom + 1 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-info" />
            <h3 className="text-xl font-semibold text-foreground">Bulk Download QR Codes</h3>
          </div>
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
              Starting from
            </label>
            <input
              type="number"
              min={1}
              max={totalQrCodes}
              value={startFrom}
              onChange={(e) => setStartFrom(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all text-sm"
              placeholder="Enter starting ID"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Ending at
            </label>
            <input
              type="number"
              min={startFrom}
              max={totalQrCodes}
              value={endAt}
              onChange={(e) => setEndAt(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all text-sm"
              placeholder="Enter ending ID"
            />
          </div>

          <div className="pt-2 pb-1 px-4 bg-accent/30 rounded-lg border border-border/50">
             <div className="flex justify-between items-center text-xs py-1.5 font-medium">
                <span className="text-muted-foreground">Total QR Codes Available</span>
                <span className="font-mono font-bold text-foreground">
                  {isLoadingTotal ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `#${totalQrCodes}`}
                </span>
             </div>
             <div className="flex justify-between items-center text-xs py-1.5 border-t border-border/50 font-medium">
                <span className="text-muted-foreground">Will Download</span>
                <span className="font-mono font-bold text-foreground">
                   #{startFrom} - #{endAt} ({count} codes)
                </span>
             </div>
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
              disabled={isPending || count < 1 || startFrom < 1 || endAt > totalQrCodes}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-info rounded-lg hover:bg-info/90 transition-colors disabled:opacity-50 shadow-sm shadow-info/10"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Bulk Download {count > 0 ? `${count} QR${count > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
