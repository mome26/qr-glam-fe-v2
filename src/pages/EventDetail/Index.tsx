import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEvent } from '../../hooks/use-events';
import { useGuests } from '../../hooks/use-guests';
import { useAuth } from '../../hooks/use-auth';
// import { extractIdFromSlug } from '../../utils/slug';

// Extracted Tab Components
import { OverviewTab } from './tabs/OverviewTab';
import { GuestsTab } from './tabs/GuestsTab';
import { MediaTab } from './tabs/MediaTab';
import { QRCodesTab } from './tabs/QRCodesTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { GeneralTab } from './tabs/GeneralTab';

export default function EventDetail() {
  const { slugWithId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: event, isLoading: eventLoading } = useEvent(slugWithId);
  const { user } = useAuth();
  const canAccessSettings = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const { data: overallGuests } = useGuests(slugWithId, { limit: 1 });
  const guestsCount = overallGuests?.total || 0;

  const TABS = canAccessSettings
    ? ['Overview', 'Guests', 'Media', 'QR Codes', 'Templates', 'Settings']
    : ['Overview', 'Guests', 'Media', 'QR Codes', 'Templates'];

  const tabParam = searchParams.get('tab');
  const initialTab = TABS.find(t => t.toLowerCase() === tabParam?.toLowerCase()) || 'Overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab with URL search params
  const tabFromUrl = TABS.find(t => t.toLowerCase() === tabParam?.toLowerCase());
  if (tabFromUrl && tabFromUrl !== activeTab) {
    setActiveTab(tabFromUrl);
  }
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  if (eventLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-info" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <p className="text-muted mb-4">Event not found</p>
        <Link to="/events" className="text-info hover:underline">Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-background p-8 md:p-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold font-display text-card-foreground">
            {event.name}
          </h1>
          <p className="text-muted text-sm">Organized by QR Glam Team</p>
        </div>
        <Link
          to="/events"
          className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-md text-sm font-medium hover:bg-accent transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-all whitespace-nowrap ${
              activeTab.toLowerCase() === tab.toLowerCase()
                ? 'border-info text-info pb-2 -mb-[5px] bg-white '
                : 'border-transparent text-muted hover:text-foreground hover:border-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {activeTab.toLowerCase() === 'overview' && <OverviewTab event={event} guestsCount={guestsCount} />}
        {activeTab.toLowerCase() === 'guests' && <GuestsTab eventId={event.id} urlHash={event.urlHash} />}
        {activeTab.toLowerCase() === 'media' && <MediaTab eventId={event.id} />}
        {activeTab.toLowerCase() === 'qr codes' && <QRCodesTab eventId={event.id} urlHash={event.urlHash} />}
        {activeTab.toLowerCase() === 'templates' && <TemplatesTab eventId={event.id} slugWithId={slugWithId} />}
        {canAccessSettings && activeTab.toLowerCase() === 'settings' && <GeneralTab event={event} />}
      </div>
    </div>
  );
}
