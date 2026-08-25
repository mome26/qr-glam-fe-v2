import React from 'react';
import type { Event } from '../../../types';
import { EventSettingsTabs } from '../../../components/EventSettings/EventSettingsTabs';

interface SettingsTabProps {
  event: Event;
}

export const GeneralTab: React.FC<SettingsTabProps> = ({ event }) => {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      <EventSettingsTabs event={event} />
    </div>
  );
};
