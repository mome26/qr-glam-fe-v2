import { MediaProviderForm } from '../components/media-provider/MediaProviderForm';
import { LayoutGrid, Database, Link as LinkIcon } from 'lucide-react';

export default function MediaAdminPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info shadow-sm">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-card-foreground">Media Provider</h1>
            <p className="text-sm text-muted">Manage global storage provider configuration and credentials.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Database className="w-5 h-5" />
              Primary Configuration
            </h2>
            <MediaProviderForm />
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 relative z-10 text-foreground">
              <LinkIcon className="w-5 h-5" />
              Quick Info
            </h3>
            <ul className="space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 shrink-0"></div>
                <p><strong>Database Priority:</strong> Configuration saved here will override environment variables in the backend.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 shrink-0"></div>
                <p><strong>Data Sanitization:</strong> All credentials are stored securely and never exposed in public scan logs.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 shrink-0"></div>
                <p><strong>Media Fallback:</strong> Correct configuration ensures QR scans reliably find guest assets on Google Drive.</p>
              </li>
            </ul>
          </div>
          
          <div className="bg-info rounded-xl p-6 text-white shadow-lg shadow-info/20">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <LayoutGrid className="w-5 h-5" />
              Pro Tip
            </h4>
            <p className="text-sm text-white/80 leading-relaxed">
              Use a Google Cloud project dedicated specifically to QR Glam to ensure optimal quota and API rate limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
