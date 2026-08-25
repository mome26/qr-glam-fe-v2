import React from 'react';
import {
  Users,
  Image as ImageIcon,
  QrCode,
  Loader2,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react';
import type { Event } from '../../../types';
import { useEventActivities } from '../../../hooks/use-event-activities';
import { useEventStatistics } from '../../../hooks/use-event-statistics';
import toast from 'react-hot-toast';

interface OverviewTabProps {
  event: Event;
  guestsCount: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  event,
  guestsCount,
}) => {
  const { data: activitiesData, isLoading: activitiesLoading } =
    useEventActivities(event.id);
  const { data: stats, isLoading: statsLoading } = useEventStatistics(event.id);

  const activities = activitiesData?.data || [];

  const statsList = [
    {
      label: 'Total Guests',
      value: stats?.totalGuests?.toString() || guestsCount.toString(),
      icon: <Users />,
    },
    {
      label: 'Media Delivered',
      value: stats?.totalMedia?.toString() || '0',
      icon: <ImageIcon />,
    },
    {
      label: 'Active QR Codes',
      value: stats?.activeQrCodes?.toString() || '0',
      icon: <QrCode />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Stat Cards */}
        {statsList.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 p-6 bg-white border border-border rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted">
                {stat.label}
              </span>
              <div className="text-muted-foreground opacity-50 w-5 h-5">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-foreground">
                {stat.value}
              </span>
              {statsLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Details Card */}
          <div className="bg-white border border-border shadow-sm rounded-lg flex flex-col w-full">
            <div className="px-6 py-4 border-b border-border/50">
              <h2 className="text-lg font-semibold text-card-foreground">
                Event Details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Calendar className="w-4 h-4" />
                  <span>Event Name</span>
                </div>
                <span className="text-base text-foreground pl-6">
                  {event.name}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Clock className="w-4 h-4" />
                  <span>Event Date</span>
                </div>
                <span className="text-base text-foreground pl-6">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <span className="text-base text-foreground pl-6">
                  {event.location || 'Not set'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted pl-6">
                  Status
                </span>
                <div className="pl-6">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'ongoing'
                        ? 'bg-success/10 text-success'
                        : event.status === 'upcoming'
                        ? 'bg-info/10 text-info'
                        : 'bg-muted/10 text-muted'
                    }`}
                  >
                    {event.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white border border-border shadow-sm rounded-lg flex flex-col w-full">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-card-foreground">
                Venue Location
              </h2>
            </div>
            <div className="p-6">
              <div className="w-full h-64 bg-accent rounded-md border border-border flex items-center justify-center text-muted-foreground italic">
                (Map view placeholder - integration in future phase)
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white border border-border shadow-sm rounded-lg flex flex-col h-fit w-full">
          <div className="px-6 py-4 border-b border-border/50">
            <h2 className="text-lg font-semibold text-card-foreground">
              Recent Activity
            </h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            {activitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-info opacity-50" />
                <span className="text-sm text-muted">Loading activity...</span>
              </div>
            ) : activities.length > 0 ? (
              <>
                {activities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-4 items-start relative">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-info rounded-full mt-1.5 z-10 shadow-sm shadow-info/20"></div>
                      {i < activities.length - 1 && (
                        <div className="absolute top-4 left-1.5 w-[2px] h-[calc(100%+0.5rem)] bg-border -z-0"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground overflow-hidden text-ellipsis line-clamp-2">
                        {activity.description}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(activity.createdAt).toLocaleString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => toast.success('Full activity history coming soon!')}
                  className="text-sm font-medium text-info hover:text-info/90 w-full text-center mt-2 transition-colors"
                >
                  View all activity
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted">No activities recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
