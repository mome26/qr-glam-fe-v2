import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUpdateQrRedirectLink } from '../../hooks/use-qr-codes';
import { useEvent } from '../../hooks/use-events';
import { Loader2, ArrowLeft, Link as LinkIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QrCodeEditPage() {
  const { eventId, qrId } = useParams();
  const navigate = useNavigate();

  // Assuming we don't have a specific `useQrCode(id)` hook yet for single fetch, 
  // we are just building the form to patch it. Ideally, we would fetch the current link first.
  const [redirectLink, setRedirectLink] = useState('');
  const [error, setError] = useState('');

  const { data: event, isLoading: isEventLoading } = useEvent(eventId);
  const updateMutation = useUpdateQrRedirectLink(eventId);

  const validateUrl = (url: string) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'URL must start with http:// or https://';
      }
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRedirectLink(value);
    if (value) {
      setError(validateUrl(value));
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!redirectLink) {
      setError('Redirect link is required.');
      return;
    }

    const validationError = validateUrl(redirectLink);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        qrId: qrId as string,
        redirectLink,
      });
      toast.success('Redirect link updated successfully');
      navigate(`/events/${eventId}?tab=qr-codes`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update redirect link';
      toast.error(message);
    }
  };

  if (isEventLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-info" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(`/events/${eventId}?tab=qr-codes`)}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {event?.name || 'Event'}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-accent/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Edit QR Code Redirect Link</h1>
            <p className="text-sm text-muted">QR ID: #{qrId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="redirectLink">
              New Redirect Target URL
            </label>
            <input
              id="redirectLink"
              type="text"
              value={redirectLink}
              onChange={handleLinkChange}
              placeholder="https://example.com/custom-destination"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-background placeholder:text-muted/50 ${
                error 
                  ? 'border-error focus:ring-error focus:border-error' 
                  : 'border-border focus:ring-info focus:border-info text-foreground'
              }`}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-error text-sm mt-1 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <p className="text-sm text-muted mt-2 leading-relaxed">
              When users scan this QR code, they will be instantly redirected to this URL instead of the default generated page.
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}?tab=qr-codes`)}
              className="px-5 py-2.5 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !!error || !redirectLink}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-info rounded-lg hover:bg-info/90 transition-all shadow-md shadow-info/20 disabled:opacity-50"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
