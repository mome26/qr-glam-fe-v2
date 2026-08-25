import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '../../api/mediaApi';
import { Loader2, LayoutGrid, Info, CheckCircle, XCircle } from 'lucide-react';

export const MediaProviderForm: React.FC = () => {
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['media-settings'],
    queryFn: mediaApi.getSettings,
  });

  const isConfigured = currentSettings?.googleApiKeyConfigured ?? false;

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-info" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Google Drive Configuration
              </h3>
              <p className="text-sm text-muted">
                API key status for public media storage access.
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              isConfigured
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error'
            }`}
          >
            {isConfigured ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Configured
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Not configured
              </>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-accent/30 rounded-lg border border-border">
          <Info className="w-5 h-5 text-info mt-0.5" />
          <div className="text-sm text-muted leading-relaxed">
            <p className="font-semibold text-foreground mb-1">
              Environment Configuration
            </p>
            {isConfigured ? (
              <p>
                The Google API key is currently configured via the{' '}
                <code className="bg-muted px-1 rounded text-foreground">
                  GOOGLE_API_KEY
                </code>{' '}
                environment variable. To change it, update your{' '}
                <code className="bg-muted px-1 rounded text-foreground">
                  .env
                </code>{' '}
                file and restart the application.
              </p>
            ) : (
              <p>
                No Google API key is configured. To enable Google Drive media
                resolution, set the{' '}
                <code className="bg-muted px-1 rounded text-foreground">
                  GOOGLE_API_KEY
                </code>{' '}
                variable in your{' '}
                <code className="bg-muted px-1 rounded text-foreground">
                .env
                </code>{' '}
                file and restart the application.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
