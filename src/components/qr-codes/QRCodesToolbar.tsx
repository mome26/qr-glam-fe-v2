import React from 'react';
import { Search, X } from 'lucide-react';

interface QRCodesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  assigned: boolean | undefined;
  onAssignedChange: (value: boolean | undefined) => void;
}

export const QRCodesToolbar: React.FC<QRCodesToolbarProps> = ({
  search,
  onSearchChange,
  assigned,
  onAssignedChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex flex-col md:flex-row gap-4 justify-between items-center">
      <div className="relative w-full max-sm:max-w-none max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search QR codes by ID or Guest..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-10 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-info focus:border-info bg-background"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex gap-3 w-full md:w-auto items-center">
        <div className="flex bg-accent/50 p-1 rounded-lg border border-border">
          <button
            onClick={() => onAssignedChange(undefined)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              assigned === undefined ? 'bg-white text-info shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onAssignedChange(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              assigned === true ? 'bg-white text-info shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => onAssignedChange(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              assigned === false ? 'bg-white text-info shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            Unassigned
          </button>
        </div>
      </div>
    </div>
  );
};
