import { Link } from 'react-router-dom';
import { useEvents } from '../../hooks/use-events';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Loader2, QrCode as QrIcon, Search, Filter, Download, Trash2, ExternalLink, ChevronDown } from 'lucide-react';
import type { QrCode } from '../../types';

const QRCodes = () => {
  const { data: eventsResponse } = useEvents({ limit: 100 });
  const events = eventsResponse?.data || [];

  const { data: qrs = [], isLoading: loading } = useQuery({
    queryKey: ['all-qr-codes', events.length],
    queryFn: async () => {
      if (events.length === 0) return [];
      const promises = events.map(event => apiClient.get<QrCode[]>(`/events/${event.id}/qr-codes`));
      const results = await Promise.all(promises);
      return results.flatMap(res => res.data);
    },
    enabled: events.length > 0,
  });

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unassigned';
  };

  return (
    <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold font-display text-card-foreground">QR Inventory</h1>
          <p className="text-muted">Manage and track all QR codes across your organization.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-info text-white px-6 py-2.5 rounded-xl hover:bg-info/90 transition-all shadow-lg hover:shadow-info/20 text-sm font-bold">
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-border/50 flex flex-col md:flex-row gap-4 justify-between bg-accent/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search QR codes or events..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-info/10 focus:border-info outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
               <select className="appearance-none bg-white border border-border rounded-lg pl-4 pr-10 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-info/10 focus:border-info transition-all cursor-pointer">
                  <option>All Statuses</option>
                  <option>Assigned</option>
                  <option>Reserved</option>
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-muted hover:bg-accent transition-all shadow-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-info" />
            <p className="text-muted font-medium tracking-tight">Syncing your QR library...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {qrs.map((qr) => (
                <div key={qr.id} className="group relative bg-white border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-accent/50 hover:border-info/40 transition-all flex flex-col items-center text-center gap-4 cursor-pointer">
                  <div className="w-full aspect-square bg-accent rounded-xl flex items-center justify-center group-hover:bg-info/10 transition-colors border border-border/50">
                    <QrIcon className="w-12 h-12 text-muted-foreground/30 group-hover:text-info/60 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1 w-full text-left ml-1">
                    <h3 className="font-bold text-card-foreground text-sm tracking-tight truncate">QR #{qr.numericId}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider truncate">{getEventName(qr.eventId)}</p>
                    <p className="text-[9px] text-muted-foreground truncate w-full" title={qr.qrLink}>{qr.qrLink}</p>
                    
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          qr.guestId ? 'bg-info/10 text-info border-info/20' :
                          'bg-accent text-muted border-border'
                       }`}>
                          {qr.guestId ? 'ASSIGNED' : 'UNASSIGNED'}
                       </span>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button className="p-1.5 bg-white border border-border rounded-lg text-muted-foreground hover:text-error hover:border-error/20 shadow-sm transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <a 
                      href={qr.qrLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white border border-border rounded-lg text-muted-foreground hover:text-info hover:border-info/20 shadow-sm transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
              
              {qrs.length === 0 && (
                <div className="col-span-full py-24 text-center flex flex-col items-center justify-center gap-6 bg-accent/30 rounded-3xl border-2 border-dashed border-border">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <QrIcon className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-foreground">Inventory Empty</h3>
                    <p className="text-muted max-w-sm mx-auto">
                      QR codes are now generated automatically when you add guests to an event.
                    </p>
                  </div>
                  <Link 
                    to="/events"
                    className="bg-info text-white px-8 py-3 rounded-xl hover:bg-info/90 transition-all font-bold text-sm shadow-lg shadow-info/10"
                  >
                    Go to Events
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodes;
