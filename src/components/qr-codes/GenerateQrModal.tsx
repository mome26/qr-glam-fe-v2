import React, { useState, useEffect } from 'react';
import { X, Loader2, QrCode as QrIcon } from 'lucide-react';
import { useTemplates } from '../../hooks/use-templates';
import { qrCodeApi } from '../../api/qrCodeApi';

interface GenerateQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onGenerate: (count: number, templateId?: number) => Promise<void>;
}

export const GenerateQrModal: React.FC<GenerateQrModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onGenerate,
}) => {
  const [count, setCount] = useState<number>(10);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [nextId, setNextId] = useState<number | null>(null);
  const [maxBatchSize, setMaxBatchSize] = useState<number>(100);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingNextId, setIsLoadingNextId] = useState(false);

  const { data: templatesResponse, isLoading: isLoadingTemplates } = useTemplates(
    eventId,
    { limit: 100 }
  );
  const templates = templatesResponse?.data || [];

  useEffect(() => {
    if (isOpen && eventId) {
      setIsLoadingNextId(true);
      qrCodeApi.getNextId(eventId)
        .then((data) => {
          setNextId(data.nextNumericId);
          if (data.maxBatchSize) setMaxBatchSize(data.maxBatchSize);
        })
        .catch(() => setNextId(null))
        .finally(() => setIsLoadingNextId(false));
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (count < 1 || count > maxBatchSize) return;
    
    setIsPending(true);
    try {
      await onGenerate(count, selectedTemplateId ? Number(selectedTemplateId) : undefined);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsPending(false);
    }
  };

  const endId = nextId !== null ? nextId + count - 1 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-info" />
            <h3 className="text-xl font-semibold text-foreground">Generate More QR Codes</h3>
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
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Quantity to Generate
              </label>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/30">
                Max {maxBatchSize}
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={maxBatchSize}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all text-sm"
              placeholder={`Enter number (1-${maxBatchSize})`}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select Template
            </label>
            {isLoadingTemplates ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching available templates...
              </div>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-info/20 focus:border-info outline-none transition-all text-sm"
              >
                <option value="">No Template (Use Event Default)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-2 pb-1 px-4 bg-accent/30 rounded-lg border border-border/50">
             <div className="flex justify-between items-center text-xs py-1.5 font-medium">
                <span className="text-muted-foreground">Starting from</span>
                <span className="font-mono font-bold text-foreground">
                  {isLoadingNextId ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `#${nextId || '?'}`}
                </span>
             </div>
             <div className="flex justify-between items-center text-xs py-1.5 border-t border-border/50 font-medium">
                <span className="text-muted-foreground">Ending at</span>
                <span className="font-mono font-bold text-foreground">
                   {isLoadingNextId ? <Loader2 className="w-3 h-3 animate-spin inline" /> : `#${endId || '?'}`}
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
              disabled={isPending || isLoadingTemplates || count < 1 || count > maxBatchSize}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-info rounded-lg hover:bg-info/90 transition-colors disabled:opacity-50 shadow-sm shadow-info/10"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate {count > 0 ? count : ''} QR Codes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
