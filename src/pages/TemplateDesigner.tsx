import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/use-events';
import { useAddTemplate } from '../hooks/use-templates';
import { VisualTemplateEditor } from '../components/qr-codes/VisualTemplateEditor';
import { extractIdFromSlug } from '../utils/slug';
import { Loader2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TemplateDesigner() {
  const { slugWithId } = useParams();
  const eventId = extractIdFromSlug(slugWithId);
  const navigate = useNavigate();
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const addTemplate = useAddTemplate(eventId);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      await addTemplate.mutateAsync(data);
      toast.success('Template saved successfully');
      navigate(`/events/${slugWithId}?tab=Templates`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save template';
      toast.error(message);
    }
  };

  const handleCancel = () => {
    navigate(`/events/${slugWithId}?tab=Templates`);
  };

  if (eventLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-info" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted mb-4">Event not found</p>
        <button 
          onClick={() => navigate('/events')} 
          className="text-info hover:underline"
        >
          Back to Events
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
             <span className="text-foreground font-medium">Template Designer</span>
          </div>
          <h1 className="text-3xl font-semibold font-display text-card-foreground">
            Template Designer
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
          onSave={handleSave} 
          onCancel={handleCancel}
          isSaving={addTemplate.isPending}
        />
      </div>
    </div>
  );
}
