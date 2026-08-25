import React, { useState } from 'react';
import { Save, Loader2, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useUpdateEventSettings, useDeleteEvent, useUpdateEvent } from '../../hooks/use-events';
import { validateSlug } from '../../utils/slug';
import type { Event } from '../../types';
import { SETTINGS_TABS, type TabId } from './constants';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { SecurityTab } from './tabs/SecurityTab';
import { MediaTab } from './tabs/MediaTab';
import { ScanPageTab } from './tabs/ScanPageTab';

interface EventSettingsTabsProps {
  event: Event;
}

export const EventSettingsTabs: React.FC<EventSettingsTabsProps> = ({ event }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const updateSettings = useUpdateEventSettings(event.id);
  const updateEvent = useUpdateEvent(event.id);
  const deleteEvent = useDeleteEvent(event.id);

  const [formData, setFormData] = useState<Partial<Event>>(() => ({
    name: event.name,
    status: event.status,
    visibility: event.visibility || 'private',
    slug: event.slug || '',
    mediaSourceUrl: event.mediaSourceUrl || '',
    urlStrategy: event.urlStrategy || 'pure-slug',
    requireAuthForQrScan: event.requireAuthForQrScan || false,
  }));


  const slugError = formData.slug !== event.slug ? validateSlug(formData.slug || '') : null;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    if (slugError) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name: _, ...settingsPayload } = formData;
      
      // Update event name separately via the general event endpoint
      if (formData.name && formData.name !== event.name) {
        await updateEvent.mutateAsync({ name: formData.name });
      }
      
      // Update settings via the settings endpoint
      await updateSettings.mutateAsync(settingsPayload);
      toast.success('Event settings updated successfully');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = apiError?.response?.data?.message || apiError.message || 'Failed to update settings';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };


  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync();
      toast.success('Event archived successfully');
      navigate('/events');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to archive event');
      setShowDeleteConfirm(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <BasicInfoTab formData={formData} setFormData={setFormData} />;
      case 'security':
        return <SecurityTab formData={formData} setFormData={setFormData} urlHash={event.urlHash} slugError={slugError} />;
      case 'media':
        return <MediaTab formData={formData} setFormData={setFormData} mediaFolderId={event.mediaFolderId} />;
      case 'scan-page':
        return <ScanPageTab eventId={event.id} scanPageTemplate={event.scanPageTemplate} scanPageTemplateId={event.scanPageTemplateId} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 w-full">
      {/* Header with Save button moved to TOP stickily */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background/95 backdrop-blur-sm sticky top-0 z-20 py-2">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight text-card-foreground">Event Settings</h2>
          <p className="text-sm text-muted-foreground">Configure how your event appears and behaves.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <button
             onClick={handleSave}
             disabled={(updateSettings.isPending || updateEvent.isPending) || !!slugError || activeTab === 'scan-page'}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-info text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-info/90 transition-all shadow-lg shadow-info/10 disabled:opacity-50"
           >
             {(updateSettings.isPending || updateEvent.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Save Changes
           </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-accent/20 border border-border rounded-xl w-full overflow-x-auto no-scrollbar scroll-smooth">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-white text-info shadow-sm border border-border ring-1 ring-info/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-info' : 'text-muted-foreground'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] animate-in fade-in duration-300">
        <div className="p-6 md:p-8">
           {renderTabContent()}
        </div>
      </div>

      {/* Bottom Danger Zone Alert if scrolling is long (only shown in General) */}
      {activeTab === 'general' && (
        <div className="mt-4 p-4 border border-error/20 bg-error/5 rounded-xl flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
               <AlertCircle className="w-5 h-5" />
             </div>
             <div>
               <p className="text-sm font-bold text-foreground">Critical Action Window</p>
               <p className="text-xs text-muted-foreground">Archiving hides all data. Use with caution.</p>
             </div>
           </div>
           <button 
             onClick={() => setShowDeleteConfirm(true)}
             className="text-error text-xs font-bold hover:underline"
           >
             Learn more
           </button>
        </div>
      )}

      {/* Inline Modal for Archive Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col gap-6">
              <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">Archive Event</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Are you sure you want to archive <span className="font-bold text-foreground">"{event.name}"</span>?
                  This will remove it from active visibility.
                </p>
              </div>
            </div>
            <div className="px-8 py-6 bg-accent/20 border-t border-border flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="order-2 sm:order-1 px-6 py-3 text-sm font-bold text-muted hover:text-foreground transition-colors"
                disabled={deleteEvent.isPending}
              >
                No, cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
                className="order-1 sm:order-2 px-8 py-3 bg-error text-white rounded-xl text-sm font-bold hover:bg-error/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-error/20 disabled:opacity-50"
              >
                {deleteEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Archive it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
