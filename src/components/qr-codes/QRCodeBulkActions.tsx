import React from 'react';
import { Layout, Download, X } from 'lucide-react';

interface QRCodeBulkActionsProps {
  selectedCount: number;
  onBulkAssign: () => void;
  onOpenBulkDownload: () => void;
  onClearSelection: () => void;
}

export const QRCodeBulkActions: React.FC<QRCodeBulkActionsProps> = ({
  selectedCount,
  onBulkAssign,
  onOpenBulkDownload,
  onClearSelection,
}) => {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 border rounded-lg flex-wrap transition-all duration-300 mb-4 ${
      selectedCount === 0 
        ? 'bg-accent/50 border-border opacity-60' 
        : 'bg-info/10 border-info/30 opacity-100 shadow-sm'
    }`}>
      <span className="text-sm font-medium text-info shrink-0">
        {selectedCount} QR code{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="h-4 w-px bg-info/30 shrink-0" />
      
      <button
        onClick={onBulkAssign}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-info transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Layout className="w-4 h-4" />
        Assign Template
      </button>

      <button
        onClick={onOpenBulkDownload}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-info transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        Bulk Download
      </button>

      <button
        onClick={onClearSelection}
        disabled={selectedCount === 0}
        className="ml-auto flex items-center gap-1 text-xs text-info hover:text-info/80 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-3.5 h-3.5" />
        Clear
      </button>
    </div>
  );
};
