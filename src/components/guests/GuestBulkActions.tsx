import { Trash2, UserCheck, Download, X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GuestBulkActionsProps {
  selectedCount: number;
  onBulkAssign: () => void;
  onBulkDelete: () => void;
  onExportCsv: () => void;
  onOpenBulkDownload: () => void;
  onClearSelection: () => void;
}

export default function GuestBulkActions({
  selectedCount,
  onBulkAssign,
  onBulkDelete,
  onExportCsv,
  onOpenBulkDownload,
  onClearSelection,
}: GuestBulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (selectedCount === 0) return;
    setShowConfirm(true);
  };
  const handleConfirmDelete = () => {
    onBulkDelete();
    setShowConfirm(false);
  };
  const handleCancelDelete = () => setShowConfirm(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirm) {
        setShowConfirm(false);
      }
    };
    if (showConfirm) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showConfirm]);

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-2 border rounded-lg flex-wrap transition-all duration-300 ${
        selectedCount === 0 ? 'bg-accent/50 border-border opacity-60' : 'bg-info/10 border-info/30 opacity-100 shadow-sm'
      }`}>
        <span className="text-sm font-medium text-info shrink-0">
          {selectedCount} guest{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="h-4 w-px bg-info/30 shrink-0" />
        <button
          onClick={onBulkAssign}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-info transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserCheck className="w-4 h-4" />
          Bulk Assign Role
        </button>
        <button
          onClick={handleDeleteClick}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-error hover:opacity-80 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Deny Selected
        </button>

        <button
          onClick={onExportCsv}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-info transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={onOpenBulkDownload}
          disabled={selectedCount === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-info transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Bulk Download QR
        </button>
        <button
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          className="ml-auto flex items-center gap-1 text-xs text-info hover:text-info/80 transition-colors shrink-0 disabled:text-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-6 bg-background border border-border rounded-xl shadow-2xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4 text-error">
              <div className="p-2 bg-error/10 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">Confirm Bulk Denial</h3>
            </div>
            
            <p className="text-sm text-foreground/70 mb-6">
              Are you sure you want to deny <span className="font-bold text-foreground">{selectedCount}</span> guest{selectedCount !== 1 ? 's' : ''}? Service access will be revoked.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-accent hover:bg-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-error-foreground bg-error hover:bg-error/90 rounded-lg transition-colors shadow-lg shadow-error/20"
              >
                Deny {selectedCount}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
