import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface GuestImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<ImportResult>;
  isPending: boolean;
}

interface ImportResult {
  created: number;
  duplicates: number;
  skipped?: number;
  errors?: string[];
}

/**
 * T072: CSV import dialog component
 * Allows event organizers to upload CSV file with guest data
 */
export default function GuestImportModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: GuestImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      const importResult = await onSubmit(file);
      setResult(importResult);
      setFile(null);
      // Auto-close on perfect success, but maybe keep open if there were errors/duplicates
      if (
        importResult.created > 0 &&
        (!importResult.errors || importResult.errors.length === 0)
      ) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-background rounded-xl shadow-xl border border-border w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-accent/30">
          <h3 className="text-lg font-semibold text-card-foreground">
            Import Guests from CSV
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Instructions */}
          <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-sm text-info">
            <p className="font-medium mb-2">CSV Format Required:</p>
            <p className="text-xs opacity-80">
              Name, Email, Phone, Role, Group, Status
            </p>
            <p className="text-xs opacity-80 mt-2">
              Example: Alice, alice@example.com, +1-555-0001, VIP, Family,
              confirmed
            </p>
          </div>

          {/* File Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Select CSV File *
            </label>
            <div className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-info hover:bg-info/5 transition-all">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : 'Click to select CSV file'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or drag and drop
                </p>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Import Summary */}
          {result && (
            <div className="flex items-start gap-3 bg-success/10 border border-success/20 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div className="text-sm text-success">
                <p className="font-medium">Import Processed</p>
                <div className="text-xs opacity-90 mt-1 flex flex-col gap-0.5">
                  <p>• Created: {result.created} guests</p>
                  {(result.duplicates > 0 || (result.skipped ?? 0) > 0) && (
                    <p>
                      • Skipped:{' '}
                      {result.duplicates + (result.skipped ?? 0)} (duplicates/invalid)
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <p className="text-destructive font-medium mt-1">
                      • Errors encountered: {result.errors.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-info hover:bg-info/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all"
            >
              {isPending ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
