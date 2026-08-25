import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Image as ImageIcon, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTemplates, useSetDefaultTemplate, useDeleteTemplate, useDuplicateTemplate } from '../../../hooks/use-templates';
import { useEvent } from '../../../hooks/use-events';
import type { QrTemplate } from '../../../types';
import TemplateCardMenu from '../../../components/qr-codes/TemplateCardMenu';
import { Pagination } from '../../../components/shared/Pagination';
import { useAuth } from '../../../hooks/use-auth';

interface TemplatesTabProps {
  eventId: string;
  slugWithId: string | undefined;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ eventId, slugWithId }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [previewTemplate, setPreviewTemplate] = useState<QrTemplate | null>(null);
  const limit = 10;

  const { data: templatesResponse, isLoading } = useTemplates(eventId, {
    page,
    limit,
  });

  const templates = templatesResponse?.data || [];
  const totalPages = templatesResponse?.totalPages || 1;

  const setDefault = useSetDefaultTemplate(eventId);
  const deleteTemplate = useDeleteTemplate(eventId);
  const duplicateTemplate = useDuplicateTemplate(eventId);
  const { data: event } = useEvent(slugWithId);
  const { user } = useAuth();
  const canEditTemplates = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const handleCreateNew = () => {
    navigate(`/events/${slugWithId}/templates/designer`);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast.success('Default template updated');
    } catch {
      toast.error('Failed to update default template');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTemplate.mutateAsync(id);
      toast.success('Template duplicated successfully');
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    const warning = isDefault 
      ? 'This is the default template for this event. Deleting it will leave the event without a default template. Continue?'
      : 'Are you sure you want to delete this template?';
    
    if (!confirm(warning)) return;
    
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Template deleted');
    } catch {
       toast.error('Failed to delete template');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-card-foreground">Templates</h2>
        {canEditTemplates && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-info text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-info/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
           <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {templates.map((template: QrTemplate) => (
              <div key={template.id} className={`group bg-white rounded-xl border-2 transition-all p-3 flex flex-col gap-3 shadow-sm ${
                  event?.defaultTemplateId === template.id ? 'border-info ring-1 ring-info/20' : 'border-border hover:border-muted'
              }`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                       <span className="text-sm font-bold text-foreground truncate">{template.name}</span>
                       <span className="text-xs text-muted">Created {new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {event?.defaultTemplateId === template.id && (
                        <span className="bg-info text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide">Default</span>
                      )}
                      {canEditTemplates && (
                        <TemplateCardMenu
                          template={template}
                          slugWithId={slugWithId}
                          onDuplicate={handleDuplicate}
                          onDelete={handleDelete}
                          isDuplicating={duplicateTemplate.isPending}
                          isDeleting={deleteTemplate.isPending}
                        />
                      )}
                    </div>
                 </div>

                 <div 
                   className="aspect-square bg-accent rounded-lg border border-border overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-info transition-all shadow-inner"
                   onClick={() => setPreviewTemplate(template)}
                 >
                    {template.backgroundImage ? (
                      <img 
                        src={template.backgroundImage} 
                        className="w-full h-full object-cover" 
                        alt={template.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.removeAttribute('hidden');
                        }}
                      />
                    ) : null}
                    <div 
                      hidden={!!template.backgroundImage}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground"
                    >
                      <ImageIcon className="w-8 h-8 opacity-30" />
                      <span className="text-xs font-medium opacity-50">No Preview</span>
                    </div>
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <Search className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                 </div>

                 <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/50">
                    <div className="flex gap-2">
                       {canEditTemplates && (
                         <button
                            onClick={() => handleSetDefault(template.id)}
                            disabled={event?.defaultTemplateId === template.id || setDefault.isPending}
                            className="text-xs font-bold text-info hover:underline disabled:opacity-30 disabled:no-underline"
                         >
                            Set Default
                         </button>
                       )}
                    </div>
                     <div className="flex gap-2 invisible group-hover:visible transition-all">
                        <button
                           onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                           className="text-xs font-bold text-muted hover:text-foreground transition-colors"
                        >
                           Preview
                        </button>
                     </div>
                 </div>
              </div>
            ))}
          </div>

          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <div className="bg-white p-16 rounded-xl border border-dashed border-border text-center flex flex-col items-center gap-4">
           <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
           <div className="flex flex-col gap-1">
              <p className="text-lg font-medium text-foreground">No templates created yet</p>
              <p className="text-sm text-muted">Create your first QR template to start generating guests</p>
           </div>
           {canEditTemplates && (
             <button
               onClick={handleCreateNew}
               className="mt-4 flex items-center gap-2 bg-info text-white rounded-md px-6 py-2.5 text-sm font-bold hover:bg-info/90 shadow-lg shadow-info/20"
             >
                Create First Template
             </button>
           )}
        </div>
      )}

      {previewTemplate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewTemplate(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {canEditTemplates && (
                <button
                  onClick={() => {
                    setPreviewTemplate(null);
                    navigate(`/events/${slugWithId}/templates/${previewTemplate.id}/edit`);
                  }}
                  className="bg-info text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-info/90 shadow-lg"
                >
                  Edit Template
                </button>
              )}
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 rounded-full bg-black/20 text-white hover:bg-black/50 backdrop-blur-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[300px] min-w-[300px] flex items-center justify-center bg-accent/30 overflow-auto">
              {previewTemplate.backgroundImage ? (
                <img 
                  src={previewTemplate.backgroundImage} 
                  className="max-w-full max-h-[70vh] object-contain shadow-lg"
                  alt={previewTemplate.name}
                />
              ) : (
                <div className="p-20 flex flex-col items-center gap-4 text-muted-foreground/30">
                  <ImageIcon className="w-24 h-24" />
                  <span className="text-sm font-medium">No background image set</span>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col gap-1 w-full md:w-auto">
                <h3 className="text-xl font-bold text-foreground">{previewTemplate.name}</h3>
                <p className="text-sm text-muted">Created on {new Date(previewTemplate.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="bg-accent/40 rounded-xl p-4 flex gap-6 items-center flex-wrap justify-center text-xs font-medium text-muted-foreground w-full md:w-auto border border-border/50">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider opacity-60">QR Usage</span>
                  <span className="text-foreground font-bold">{previewTemplate.qrCount || 0} Codes</span>
                </div>
                <div className="w-px h-6 bg-border hidden sm:block" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider opacity-60">Position (X, Y)</span>
                  <span className="text-foreground font-bold">{previewTemplate.qrPositionX}px, {previewTemplate.qrPositionY}px</span>
                </div>
                <div className="w-px h-6 bg-border hidden sm:block" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider opacity-60">QR Size</span>
                  <span className="text-foreground font-bold">{previewTemplate.qrSize}px</span>
                </div>
              </div>

              {canEditTemplates && (
                <div className="flex gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleSetDefault(previewTemplate.id)}
                    disabled={event?.defaultTemplateId === previewTemplate.id || setDefault.isPending}
                    className="w-full md:w-auto px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50 transition-all"
                  >
                    {event?.defaultTemplateId === previewTemplate.id ? 'Current Default' : 'Set as Default'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
