import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkQRProgressProps {
  isOpen: boolean;
  current: number;
  total: number;
  status: 'generating' | 'zipping' | 'completed' | 'error';
  onClose: () => void;
}

/**
 * Progress modal for client-side bulk operations.
 * Provides real-time feedback during canvas composition and ZIP generation.
 */
export function BulkQRProgress({
  isOpen,
  current,
  total,
  status,
  onClose,
}: BulkQRProgressProps) {
  if (!isOpen) return null;

  const progress = total > 0 ? (current / total) * 100 : 0;
  const isFinished = status === 'completed' || status === 'error';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden flex flex-col items-center p-8 gap-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-2 text-center w-full">
          <div className="mb-2">
            {status === 'generating' || status === 'zipping' ? (
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-info" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-info/60">
                   {Math.round(progress)}%
                </div>
              </div>
            ) : status === 'completed' ? (
              <CheckCircle2 className="w-12 h-12 text-success shadow-success/20 animate-bounce" />
            ) : (
              <AlertCircle className="w-12 h-12 text-destructive" />
            )}
          </div>

          <h3 className="text-xl font-bold text-card-foreground">
            {status === 'generating' && `Generating QR Codes`}
            {status === 'zipping' && `Packaging Archive`}
            {status === 'completed' && `Export Finished!`}
            {status === 'error' && `Generation Failed`}
          </h3>

          <p className="text-sm text-muted font-medium min-h-[1.25rem]">
            {status === 'generating' && `Processing image ${current} of ${total}...`}
            {status === 'zipping' && `Finalizing the archive package...`}
            {status === 'completed' && `Your bulk export is ready for use.`}
            {status === 'error' && `An error occurred during batch processing.`}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full bg-accent h-2.5 rounded-full overflow-hidden border border-border/50 shadow-inner">
            <div
              className={`h-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(var(--color-info-rgb,0),0.3)] ${
                 status === 'error' ? 'bg-destructive' : status === 'completed' ? 'bg-success' : 'bg-info'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted/60">
              {status === 'completed' ? 'Done' : status === 'error' ? 'Failed' : 'Progress'}
            </span>
            <span className="text-[10px] font-black text-muted/80">
              {current} / {total}
            </span>
          </div>
        </div>

        {isFinished && (
          <button
            onClick={onClose}
            className={`w-full px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
              status === 'error'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            <X className="w-4 h-4" />
            {status === 'error' ? 'Close' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  );
}
