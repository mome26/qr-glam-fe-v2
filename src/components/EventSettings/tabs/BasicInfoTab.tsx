import React from 'react';
import type { Event } from '../../../types';

interface BasicInfoTabProps {
  formData: Partial<Event>;
  setFormData: (data: Partial<Event>) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ formData, setFormData }) => {
  return (
    <div className="flex flex-col gap-10 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground">General Settings</h3>
        <p className="text-sm text-muted-foreground">The public face of your event.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-foreground tracking-tight">Event Name</label>
          <input
            type="text"
            value={formData.name}
            placeholder="Official event title"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-5 py-3 border border-border rounded-xl text-sm text-foreground bg-accent/5 focus:bg-white outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all duration-200 shadow-sm"
          />
          <p className="text-[11px] text-muted-foreground italic">Displayed on all public guest-facing pages.</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-foreground tracking-tight">Current Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Event['status'] })}
            className="w-full px-5 py-3 border border-border rounded-xl text-sm text-foreground bg-accent/5 focus:bg-white outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all duration-200 shadow-sm cursor-pointer"
          >
            <option value="draft">Draft (Private setup)</option>
            <option value="upcoming">Upcoming (Not yet live)</option>
            <option value="ongoing">Ongoing (Active now)</option>
            <option value="completed">Completed</option>
          </select>
          <p className="text-[11px] text-muted-foreground italic">Determines if team members can view/upload media.</p>
        </div>
      </div>

       <div className="p-1 px-4 bg-info/5 border border-info/10 rounded-lg text-[11px] text-info font-medium italic">
         Pro-tip: Set status to Ongoing only when you are ready for team members to start scanning.
       </div>
    </div>
  );
};
