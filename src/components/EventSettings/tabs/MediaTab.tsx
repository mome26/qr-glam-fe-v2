import React from 'react';
import { FolderGit2, Info, AlertTriangle } from 'lucide-react';
import type { Event } from '../../../types';

interface MediaTabProps {
  formData: Partial<Event>;
  setFormData: (data: Partial<Event>) => void;
  mediaFolderId?: string;
}

const isDriveUrlLike = (url: string): boolean => {
  if (!url) return true;
  return /drive\.google\.com\/drive\/folders\//.test(url);
};

export const MediaTab: React.FC<MediaTabProps> = ({
  formData,
  setFormData,
  mediaFolderId,
}) => {
  const handleMediaSourceUrlChange = (url: string) => {
    setFormData({ ...formData, mediaSourceUrl: url });
  };

  const showUrlWarning =
    !!formData.mediaSourceUrl && !isDriveUrlLike(formData.mediaSourceUrl);

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground text-left">Media & Storage</h3>
        <p className="text-sm text-muted-foreground text-left">Configure where guest photos and videos are stored.</p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Google Drive Folder URL */}
        <div className="flex flex-col gap-4 text-left">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info shadow-lg shadow-info/5">
                <FolderGit2 className="w-5 h-5" />
             </div>
             <div className="flex flex-col">
                <label className="text-sm font-bold text-foreground tracking-tight">Google Drive Folder URL</label>
                <span className="text-[11px] text-muted-foreground italic">Paste the full Drive folder link</span>
             </div>
           </div>
           <div className="flex gap-4">
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={formData.mediaSourceUrl || ''}
                onChange={(e) => handleMediaSourceUrlChange(e.target.value)}
                className="flex-1 px-5 py-3.5 border border-border rounded-xl text-sm text-foreground bg-accent/5 focus:bg-white outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all"
              />
           </div>
           {showUrlWarning && (
             <p className="text-[11px] text-warning flex items-center gap-2">
               <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
               This doesn't look like a valid Google Drive folder URL
             </p>
           )}
           <p className="text-[11px] text-muted-foreground italic flex items-center gap-2">
             <Info className="w-3.5 h-3.5 shrink-0 text-info" />
             Example: https://drive.google.com/drive/folders/1a2b3c4d-5e6f-7g8h
           </p>
        </div>

        <div className="h-px bg-border/40" />

        {/* Extracted Folder ID (Read-only) */}
        <div className="flex flex-col gap-4 text-left">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success shadow-lg shadow-success/5">
                <FolderGit2 className="w-5 h-5" />
             </div>
             <div className="flex flex-col">
                <label className="text-sm font-bold text-foreground tracking-tight">Extracted Folder ID</label>
                <span className="text-[11px] text-muted-foreground italic">Auto-extracted from URL above</span>
             </div>
           </div>
           <div className="flex gap-4">
              <input
                type="text"
                value={mediaFolderId || ''}
                readOnly
                placeholder="ID will appear here..."
                className="flex-1 px-5 py-3.5 border border-border rounded-xl text-sm font-mono text-foreground bg-muted/20 outline-none opacity-75 cursor-not-allowed"
              />
           </div>
           <p className="text-[11px] text-muted-foreground italic flex items-center gap-2">
             <Info className="w-3.5 h-3.5 shrink-0 text-info" />
             This folder ID is used internally to resolve guest media. Update the URL above to refresh this field.
           </p>
        </div>
      </div>

       <div className="mt-4 p-5 bg-accent/20 border border-border rounded-2xl flex flex-col sm:flex-row items-center gap-6">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full border-4 border-white bg-info/20 p-2"><FolderGit2 className="w-full h-full text-info" /></div>
             <div className="w-10 h-10 rounded-full border-4 border-white bg-success/20 p-2"><FolderGit2 className="w-full h-full text-success" /></div>
          </div>
          <div className="flex flex-col gap-1 text-center sm:text-left">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Media Sync Active</h4>
             <p className="text-[11px] text-muted-foreground leading-relaxed">Guest photos will be automatically routed to your connected folders.</p>
          </div>
       </div>
    </div>
  );
};
