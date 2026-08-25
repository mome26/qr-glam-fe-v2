import React, { useState } from 'react';
import { X, Loader2, Layout } from 'lucide-react';
import { useTemplates } from '../../hooks/use-templates';

interface BulkAssignTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  selectedCount: number;
  onAssign: (templateId: string | null) => Promise<void>;
}

export const BulkAssignTemplateModal: React.FC<BulkAssignTemplateModalProps> = ({
  isOpen,
  onClose,
  eventId,
  selectedCount,
  onAssign,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  const { data: templatesResponse, isLoading: isLoadingTemplates } = useTemplates(
    eventId,
    { limit: 100 }
  );
  const templates = templatesResponse?.data || [];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await onAssign(selectedTemplateId || null);
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
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-info" />
            <h3 className="text-xl font-semibold text-foreground">Bulk Assign Template</h3>
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
                {templates.map((t) => {
                  const displayName = t.name.length > 45 ? `${t.name.slice(0, 45)}...` : t.name;
                  return (
                    <option key={t.id} value={t.id}>
                      {displayName} {t.isDefault ? '(Default)' : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              Update the visual appearance of <span className="font-bold text-foreground">{selectedCount}</span> selected QR codes.
            </p>
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
              disabled={isPending || isLoadingTemplates}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-info rounded-lg hover:bg-info/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign to {selectedCount} items
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
