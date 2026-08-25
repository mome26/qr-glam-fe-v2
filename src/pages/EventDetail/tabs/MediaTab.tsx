import React, { useState } from 'react';
import { Search, Filter, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useMedia } from '../../../hooks/use-media';
import { Pagination } from '../../../components/shared/Pagination';
import { useAuth } from '../../../hooks/use-auth';

interface MediaTabProps {
  eventId: string;
}

export const MediaTab: React.FC<MediaTabProps> = ({ eventId }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const limit = 10;
  const { user } = useAuth();
  const canEditMedia = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const { data: mediaResponse, isLoading } = useMedia(eventId, {
    page,
    limit,
    search: search || undefined,
    type: type || undefined,
  });

  const media = mediaResponse?.data || [];
  const totalPages = mediaResponse?.totalPages || 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-card-foreground">Media Library</h2>
        {canEditMedia && (
          <button className="flex items-center gap-2 bg-info text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-info/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Upload Media
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-info focus:border-info bg-background"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-info bg-white text-foreground"
          >
            <option value="">All Media</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-md text-sm text-foreground hover:bg-accent transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
           <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : media.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <div key={item.id} className="group relative aspect-square bg-accent rounded-lg border border-border overflow-hidden shadow-sm flex flex-col cursor-pointer hover:border-info">
                 <div className="flex-1 w-full bg-accent/80 flex items-center justify-center text-muted-foreground text-sm overflow-hidden">
                    {item.type === 'photo' ? (
                       <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                       <span className="italic">[{item.type.toUpperCase()}]</span>
                    )}
                 </div>
                 <div className="p-2 border-t border-border bg-white flex justify-between items-center">
                    <div className="text-xs truncate font-medium text-foreground">{item.title}</div>
                    <div className={`w-2 h-2 rounded-full ${item.status === 'approved' ? 'bg-success' : 'bg-warning'}`}></div>
                 </div>
                 {canEditMedia && (
                   <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end p-2 gap-2">
                      <button className="w-6 h-6 rounded bg-white/20 hover:bg-white text-white hover:text-error flex items-center justify-center transition-colors">
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   </div>
                 )}
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
        <div className="bg-white p-12 rounded-lg border border-dashed border-border text-center">
           <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
           <p className="text-muted">No media delivered yet for this event</p>
           {(search || type) && (
             <button onClick={() => { setSearch(''); setType(''); setPage(1); }} className="mt-4 text-info font-medium hover:underline text-sm">Clear search and filters</button>
           )}
        </div>
      )}
    </div>
  );
};

// Helper component for Plus icon if not imported
const Plus = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
