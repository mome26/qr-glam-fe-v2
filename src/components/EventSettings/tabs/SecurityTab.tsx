import React from 'react';
import { Globe, Lock, Info, AlertCircle } from 'lucide-react';
import type { Event } from '../../../types';

interface SecurityTabProps {
  formData: Partial<Event>;
  setFormData: (data: Partial<Event>) => void;
  urlHash?: string;
  slugError?: string | null;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ formData, setFormData, urlHash, slugError }) => {

  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground text-left">URL & Security</h3>
        <p className="text-sm text-muted-foreground text-left">Control how users access your event and printed QR codes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Visibility */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-foreground uppercase tracking-widest text-[10px]">Event Visibility</label>
          <div className="flex p-1 bg-accent/20 border border-border rounded-xl w-full">
            <button
              onClick={() => setFormData({ ...formData, visibility: 'public' })}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                formData.visibility === 'public'
                  ? 'bg-white text-info shadow-xl shadow-info/5 border border-border/50 ring-1 ring-info/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className={`w-4 h-4 ${formData.visibility === 'public' ? 'text-info' : 'text-muted-foreground'}`} />
              Public
            </button>
            <button
              onClick={() => setFormData({ ...formData, visibility: 'private' })}
              type="button"
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                formData.visibility === 'private'
                  ? 'bg-white text-info shadow-xl shadow-info/5 border border-border/50 ring-1 ring-info/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className={`w-4 h-4 ${formData.visibility === 'private' ? 'text-info' : 'text-muted-foreground'}`} />
              Private
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground italic flex items-center gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 text-info" />
            {formData.visibility === 'public'
              ? 'Public events show up in global searches and lists.'
              : 'Private events only work via direct link or specific QR codes.'}
          </p>
        </div>

        {/* Custom Slug */}
        <div className="flex flex-col gap-4 text-left">
          <label className="text-sm font-bold text-foreground uppercase tracking-widest text-[10px]">Custom URL Slug</label>
          <div className="flex shadow-sm rounded-xl overflow-hidden group">
            <span className="inline-flex items-center px-4 py-3 border border-r-0 border-border bg-accent/40 text-muted-foreground text-[10px] font-bold uppercase tracking-tight whitespace-nowrap group-focus-within:border-info/30 group-focus-within:bg-info/5 transition-all">
              /e/
            </span>
            <input
              type="text"
              placeholder="event-slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              className={`flex-1 w-full px-5 py-3 border rounded-r-xl text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/30 ${
                slugError 
                  ? 'border-error ring-1 ring-error bg-error/5' 
                  : 'border-border bg-accent/5 focus:bg-white focus:ring-2 focus:ring-info/20 focus:border-info'
              }`}
            />
          </div>
          {slugError ? (
            <div className="flex items-center gap-2 text-error text-xs font-bold animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4" />
              {slugError}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-info" />
              Example: my-party-2024
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-border/50 my-2" />

      {/* Advanced Security - Full Width */}
      <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-foreground uppercase tracking-widest text-[10px] flex items-center gap-2">
            Advanced Security
            <span className="px-1.5 py-0.5 bg-info/10 text-info text-[9px] font-bold rounded uppercase">Recommended</span>
          </label>
          <div className="flex items-center justify-between p-4 bg-accent/10 border border-border/50 rounded-xl hover:bg-white transition-all cursor-pointer group max-w-md" onClick={() => setFormData({ ...formData, requireAuthForQrScan: !formData.requireAuthForQrScan })}>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground tracking-tight">Require Login</span>
              <span className="text-[11px] text-muted-foreground">Mandatory login to view media of scanned qr code</span>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-all outline-none ring-offset-2 focus:ring-2 focus:ring-info ${formData.requireAuthForQrScan ? 'bg-info shadow-sm shadow-info/20' : 'bg-muted/40'}`}
            >
              <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xl transition-transform duration-200 ease-out ${formData.requireAuthForQrScan ? 'translate-x-6' : 'translate-x-1.5'}`} />
            </button>
          </div>
      </div>

      <div className="h-px bg-border/50 my-2" />

      {/* Navigation Strategy - Full Width */}
      <div className="flex flex-col gap-4 text-left max-w-md">
          <label className="text-sm font-bold text-foreground uppercase tracking-widest text-[10px]">Navigation Strategy</label>
          <select
            value={formData.urlStrategy}
            onChange={(e) => setFormData({ ...formData, urlStrategy: e.target.value as Event['urlStrategy'] })}
            className="w-full px-5 py-3 border border-border rounded-xl text-sm font-semibold text-foreground bg-accent/5 focus:bg-white outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all duration-200 shadow-sm cursor-pointer"
          >
            <option value="pure-slug">Clean (Slug Only)</option>
            <option value="hash">Secure (36-char UUID)</option>
            <option value="slug-with-id">Mixed (Slug + ID)</option>
            <option value="numeric">Classic (Number only)</option>
          </select>
      </div>

      {/* Immutable Hash Warning */}
      <div className="flex flex-col gap-4 bg-info/5 p-6 rounded-2xl border border-info/10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info shadow-xl shadow-info/5">
                <Shield className="w-5 h-5" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-foreground">Permanent QR Hash (UUID v7)</h4>
                <p className="text-[11px] text-muted-foreground">This crypographic identifier is baked into all printed QR codes.</p>
             </div>
          </div>
          <div className="relative group">
              <input
                type="text"
                readOnly
                value={urlHash || 'Generating secure hash...'}
                className="w-full px-5 py-3.5 border border-info/20 rounded-xl text-sm font-mono text-info/80 bg-white/50 outline-none select-all shadow-inner tracking-tight"
              />
              <div className="absolute top-2 right-4 text-[10px] font-bold text-info/50 opacity-0 group-hover:opacity-100 transition-opacity">IMMUTABLE</div>
          </div>
          <p className="text-[11px] text-muted-foreground/70 italic leading-relaxed">
            Note: Changing the slug or URL strategy above will NOT break existing printed QR codes, as they are permanently bound to the unique UUID hash shown here.
          </p>
      </div>
    </div>
  );
};

const Shield = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .52-.88l7.15-4.14a1 1 0 0 1 .95 0L19.48 5.12A1 1 0 0 1 20 6v7z"/>
  </svg>
);
