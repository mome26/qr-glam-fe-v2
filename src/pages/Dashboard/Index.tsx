import { useState } from 'react';
import { useEvents, useGlobalStatistics } from '../../hooks/use-events';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import CreateEventModal from '../../components/events/CreateEventModal';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/use-auth';

const Dashboard = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCreateEvent = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const { data: eventsResponse, isLoading: loading, refetch } = useEvents({ limit: 100 });
  const { data: globalStats } = useGlobalStatistics();

  const events = eventsResponse?.data || [];

  const stats = {
    totalEvents: globalStats?.totalEvents ?? events.length,
    activeEvents: globalStats?.activeEvents ?? events.filter(e => e.status === 'ongoing' || e.status === 'upcoming').length,
    totalQrCodes: globalStats?.totalQrCodes ?? 0,
    mediaDelivered: globalStats?.mediaDelivered ?? 0,
  };

  const handleCreateEvent = async (data: { name: string; startDate: string; description: string }) => {
    try {
      await apiClient.post('/events', {
        name: data.name,
        date: data.startDate,
        description: data.description,
        status: 'upcoming'
      });
      setModalOpen(false);
      toast.success('Event created successfully!');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create event');
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
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-display font-medium text-card-foreground">Dashboard</h1>
        {canCreateEvent && (
          <button
            className="bg-info text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-info/90 transition-all shadow-lg shadow-info/20"
            onClick={() => setModalOpen(true)}
          >
            <span className="text-lg">+</span>
            <span className="font-medium text-sm">Create Event</span>
          </button>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted mb-4">Total Events</h3>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{stats.totalEvents}</span>
            <span className="bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded text-[10px] font-bold">Live</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted mb-4">Active Events</h3>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{stats.activeEvents}</span>
            <span className="bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded text-[10px] font-bold">NOW</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted mb-4">Media Delivered</h3>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{stats.mediaDelivered}</span>
            <span className="bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded text-[10px] font-bold">TOTAL</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted mb-4">Active QR Codes</h3>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{stats.totalQrCodes}</span>
            <span className="bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded text-[10px] font-bold">QR</span>
          </div>
        </div>
      </div>

      {/* Recent Events Section */}
      <section className="bg-white rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-card-foreground">Recent Events</h2>
          <Link 
            to="/events"
            className="text-sm font-medium text-info hover:text-info/80 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted">Loading events...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-accent/30 border-b border-border">
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-center">Guests</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.slice(0, 5).map(event => (
                  <tr key={event.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{event.name}</td>
                    <td className="px-6 py-4 text-sm text-muted">{formatDate(event.date)}</td>
                    <td className="px-6 py-4 text-sm text-muted text-center">{event.registeredAttendees || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                        event.status === 'ongoing' ? 'bg-success/10 text-success border-success/20' :
                        event.status === 'upcoming' ? 'bg-info/10 text-info border-info/20' :
                        'bg-muted/10 text-muted border-muted/20'
                      }`}>
                        {event.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No events found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
