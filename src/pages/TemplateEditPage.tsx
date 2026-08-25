import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/use-events';
import { useTemplate, useUpdateTemplate } from '../hooks/use-templates';
import { VisualTemplateEditor } from '../components/qr-codes/VisualTemplateEditor';
import { extractIdFromSlug } from '../utils/slug';
import { Loader2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApiResponseError } from '../types';

export default function TemplateEditPage() {
  const { slugWithId, templateId } = useParams();
  const eventId = extractIdFromSlug(slugWithId);
  const navigate = useNavigate();
  
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: template, isLoading: templateLoading } = useTemplate(eventId, templateId);
  const updateTemplate = useUpdateTemplate(eventId);

  const handleSave = async (data: { name: string; backgroundImage: string; qrPositionX: number; qrPositionY: number; qrSize: number; showNumericIdBelow: boolean; numericIdSize?: number; textColor: 'black' | 'white'; customTexts: { id: string; content: string; size: number; positionX: number; positionY: number }[] }) => {
    if (!templateId) return;
    try {
      await updateTemplate.mutateAsync({
        templateId,
        payload: data,
      });
      toast.success('Template updated successfully');
      navigate(`/events/${slugWithId}?tab=Templates`);
    } catch (err: unknown) {
      const message = (err as ApiResponseError).response?.data?.message || (err as Error).message || 'Failed to update template';
      toast.error(message);
    }
  };

  const handleCancel = () => {
    navigate(`/events/${slugWithId}?tab=Templates`);
  };

  // T027: Redirect back if not found
  const hasError = !eventLoading && !templateLoading && (!event || !template);
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        navigate(`/events/${slugWithId}?tab=Templates`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasError, navigate, slugWithId]);

  if (eventLoading || templateLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-info" />
      </div>
    );
  }

  if (!event || !template) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted mb-2">{!event ? 'Event not found' : 'Template not found'}</p>
        <p className="text-xs text-muted mb-6">Redirecting back to templates in 3 seconds...</p>
        <button 
          onClick={handleCancel} 
          className="text-info hover:underline text-sm font-medium"
        >
          Back to Templates Now
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-background p-8 md:p-12 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted">
             <span>Events</span>
             <span>/</span>
             <span className="truncate max-w-[150px]">{event.name}</span>
             <span>/</span>
             <span className="text-foreground font-medium">Edit Template</span>
          </div>
          <h1 className="text-3xl font-semibold font-display text-card-foreground">
            Edit Template: {template.name}
          </h1>
        </div>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-md text-sm font-medium hover:bg-accent transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel & Exit
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
        <VisualTemplateEditor 
          key={template.id}
          initialData={{
            name: template.name,
            backgroundImage: template.backgroundImage || '',
            qrPositionX: template.qrPositionX,
            qrPositionY: template.qrPositionY,
            qrSize: template.qrSize,
            showNumericIdBelow: template.showNumericIdBelow,
            numericIdSize: template.numericIdSize,
            textColor: template.textColor,
            customTexts: template.customTexts,
          }}
          onSave={handleSave} 
          onCancel={handleCancel}
          isSaving={updateTemplate.isPending}
        />
      </div>
    </div>
  );
}
