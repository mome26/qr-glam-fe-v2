import React, { useState } from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    startDate: string; 
    endDate: string; 
    type: string;
    description: string;
    primaryColor: string;
  }) => void;
}

const CreateEventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Wedding');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#171717');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-accent">
          <h2 className="text-xl font-display font-medium text-card-foreground">Create Event</h2>
          <button onClick={onClose} className="text-muted hover:text-card-foreground transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, startDate, endDate, type, description, primaryColor });
        }}>
          <div>
            <label className="block text-sm font-semibold text-muted mb-1 uppercase tracking-tight text-[10px]">Event Information</label>
            <div className="space-y-3 mt-2">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Event Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Smith-Johnson Wedding"
                  className="w-full bg-accent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">Start Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-accent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">End Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-accent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Event Type</label>
                <select 
                  className="w-full bg-accent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option>Wedding</option>
                  <option>Conference</option>
                  <option>Party</option>
                  <option>Exhibition</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Description (Optional)</label>
                <textarea 
                  placeholder="Brief description of your event"
                  className="w-full bg-accent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all h-20 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="block text-sm font-semibold text-muted mb-1 uppercase tracking-tight text-[10px]">Event Branding</label>
            <div className="space-y-3 mt-2">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    className="w-10 h-10 border-0 p-0 overflow-hidden cursor-pointer bg-transparent"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input 
                    type="text" 
                    className="flex-1 bg-accent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-info text-white rounded-lg text-sm font-medium hover:bg-info/90 transition-opacity shadow-lg shadow-info/20"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
