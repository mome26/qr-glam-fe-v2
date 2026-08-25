import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { EventFilters } from '../../components/events/EventFilters';
import { getFilterState, saveFilterState, clearFilterState } from '../../utils/event-filters';
import type { EventFilters as FilterState } from '../../utils/event-filters';
import { useEvents, useCreateEvent } from '../../hooks/use-events';
import CreateEventModal from '../../components/events/CreateEventModal';
import { Loader2, Plus, Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/use-auth';


const Events = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => getFilterState());
  const [currentPage, setCurrentPage] = useState(1);
  const { data: eventsResponse, isLoading } = useEvents({
    page: currentPage,
    limit: 10,
    status: filters.statusFilter,
    dateRangeStart: filters.dateRangeStart,
    dateRangeEnd: filters.dateRangeEnd
  });

  const events = eventsResponse?.data || [];
  const totalPages = eventsResponse?.totalPages || 1;
  const isFiltersActive = filters.statusFilter || filters.dateRangeStart || filters.dateRangeEnd;
  const createEvent = useCreateEvent();
  const { user } = useAuth();
  const canCreateEvent = user?.role === 'ADMIN' || user?.role === 'STAFF';

  useEffect(() => {
    saveFilterState(filters);
  }, [filters]);

  const handleStatusChange = (status?: 'upcoming' | 'ongoing' | 'completed') => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
    setCurrentPage(1);
  };

  const handleDateRangeChange = (start?: string, end?: string) => {
    setFilters(prev => ({ ...prev, dateRangeStart: start, dateRangeEnd: end }));
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    clearFilterState();
    setCurrentPage(1);
  };



  const handleCreateEvent = async (data: { name: string; startDate: string; description: string }) => {
    const toastId = toast.loading('Creating event...');
    try {
      await createEvent.mutateAsync({
        name: data.name,
        date: data.startDate,
        description: data.description,
        status: 'upcoming'
      });
      toast.success('Event created successfully!', { id: toastId });
      setModalOpen(false);
    } catch {
      toast.error('Failed to create event', { id: toastId });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full">
      {canCreateEvent && (
        <CreateEventModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      <header className="flex items-center justify-between mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-display font-semibold text-card-foreground">Events</h1>
          <p className="text-sm text-muted">Manage and track all your glamorous events.</p>
        </div>
        {canCreateEvent && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-info text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-info/90 transition-all shadow-md shadow-info/20 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </header>
      
      <EventFilters 
        filters={filters}
        onStatusChange={handleStatusChange}
        onDateRangeChange={handleDateRangeChange}
        onClearAll={handleClearAll}
      />

      <div className="grid gap-4 transition-opacity duration-300">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-info" />
            <span className="text-muted font-medium">Fetching events...</span>
          </div>
        ) : events.length === 0 && isFiltersActive ? (
          <div className="py-24 text-center">
             <p className="text-muted text-lg font-medium">No events match your filters</p>
             <button onClick={handleClearAll} className="mt-4 text-info font-medium hover:underline">Clear filters</button>
          </div>
        ) : events.length > 0 ? (
          events.map((event) => (
            <Link 
              to={event.slug ? `/events/${event.slug}-${event.id}` : `/events/${event.id}`}
              key={event.id} 
              className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center justify-between hover:border-info/30 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-card-foreground group-hover:text-info transition-colors">{event.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    event.status === 'ongoing' ? 'bg-success/10 text-success border-success/20' :
                    event.status === 'upcoming' ? 'bg-info/10 text-info border-info/20' :
                    'bg-muted/10 text-muted border-muted/20'
                  }`}>
                    {event.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {event.registeredAttendees || 0} guests
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground group-hover:bg-info/10 group-hover:text-info transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border-2 border-dashed border-border/50">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-2">
              <Calendar className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-foreground">No events yet</h3>
              <p className="text-muted max-w-xs mx-auto">Create your first event to start capturing glamorous moments.</p>
            </div>
            {canCreateEvent && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 text-info font-semibold hover:text-info/90 underline underline-offset-4"
              >
                Start by creating an event
              </button>
            )}
          </div>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent bg-white shadow-sm"
          >
            Previous
          </button>
          
          <span className="text-sm font-medium text-muted">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent bg-white shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Events;
