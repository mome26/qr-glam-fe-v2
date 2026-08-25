import { useState } from 'react';
import { useEvents } from '../hooks/use-events';
import { useMedia } from '../hooks/use-media';
import { Loader2, Image as ImageIcon, Video, FileText, Search, ChevronDown, LayoutGrid, List } from 'lucide-react';

const MediaGallery = () => {
  const { data: eventsResponse, isLoading: eventsLoading } = useEvents({ limit: 100 });
  const events = eventsResponse?.data || [];
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const limit = 20;

  const currentEventId = selectedEventId || events[0]?.id;
  
  const { data: mediaResponse, isLoading: mediaLoading } = useMedia(currentEventId, {
    page,
    limit,
    search: search || undefined,
    type: type || undefined,
  });

  const media = mediaResponse?.data || [];
  const totalPages = mediaResponse?.totalPages || 1;
  const currentEvent = events.find(e => e.id === currentEventId);


  return (
    <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-semibold text-card-foreground">Media Gallery</h1>
          <p className="text-muted">View and manage all media captured across your events.</p>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[240px]">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Select Event</label>
          <div className="relative">
            <select 
              value={currentEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); setPage(1); }}
              className="w-full appearance-none bg-white border border-border rounded-xl px-4 py-3 pr-10 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all cursor-pointer shadow-sm"
            >
              {eventsLoading ? (
                <option>Loading events...</option>
              ) : events.length > 0 ? (
                events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))
              ) : (
                <option>No events available</option>
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between bg-accent/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search media..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-info/10 focus:border-info"
            />
          </div>
          <div className="flex items-center gap-3">
             <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-muted hover:bg-accent focus:outline-none transition-all cursor-pointer shadow-sm"
            >
              <option value="">All Types</option>
              <option value="photo">Photos</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
            </select>
            <div className="h-6 w-px bg-border mx-1"></div>
            <button className="p-2 text-muted-foreground hover:text-info hover:bg-white rounded-lg transition-all border border-transparent hover:border-border">
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-info hover:bg-white rounded-lg transition-all border border-transparent hover:border-border">
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {mediaLoading || eventsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-info" />
              <p className="text-muted font-medium">Loading your media library...</p>
            </div>
          ) : media.length > 0 ? (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {media.map((item) => (
                   <div key={item.id} className="group flex flex-col gap-3">
                     <div className="aspect-[4/5] bg-accent rounded-2xl border border-border overflow-hidden relative shadow-sm group-hover:shadow-md group-hover:border-info/20 transition-all cursor-zoom-in">
                       {item.type === 'photo' ? (
                         <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : item.type === 'video' && item.driveFileId ? (
                         // T016: Show Drive thumbnail for Drive-sourced videos
                         <img src={`https://lh3.googleusercontent.com/d/${item.driveFileId}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-accent">
                           {item.type === 'video' ? <Video className="w-10 h-10" /> : <FileText className="w-10 h-10" />}
                           <span className="text-xs font-bold uppercase">{item.type}</span>
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="bg-white text-foreground px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                             View Details
                          </button>
                       </div>
                     </div>
                     <div className="flex flex-col px-1">
                       <h3 className="font-bold text-card-foreground text-sm truncate">{item.title}</h3>
                       <div className="flex items-center justify-between mt-1">
                         <span className="text-[10px] text-muted-foreground font-medium">Captured at {currentEvent?.name}</span>
                         <div className={`w-2 h-2 rounded-full ${item.status === 'approved' ? 'bg-success' : 'bg-warning'}`}></div>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Showing {media.length} items (Page {page} of {totalPages})
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-accent/30 rounded-3xl border-2 border-dashed border-border">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-2">
                <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-foreground">Gallery Empty</h3>
                <p className="text-muted max-w-sm mx-auto">
                  {currentEventId ? `No media has been uploaded for "${currentEvent?.name}" yet.` : "Select an event to view its media library."}
                </p>
                {(search || type) && (
                   <button onClick={() => { setSearch(''); setType(''); }} className="mt-4 text-info font-medium hover:underline">Clear search and filters</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;
