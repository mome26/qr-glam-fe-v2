import { Search, X } from 'lucide-react';

export interface GuestFiltersProps {
  search: string;
  status: string;
  role: string;
  group: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onReset: () => void;
}

export function GuestFilters({
  search,
  status,
  role,
  group,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onGroupChange,
  onReset
}: GuestFiltersProps) {
  const hasActiveFilters = !!search || !!status || !!role || !!group;

  return (
    <div className="bg-background p-4 rounded-lg shadow-sm border border-border flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-info focus:border-info bg-background text-foreground"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-info bg-background text-foreground"
          >
            <option value="">All Roles</option>
            <option value="VIP">VIP</option>
            <option value="Speaker">Speaker</option>
            <option value="Staff">Staff</option>
            <option value="Attendee">Attendee</option>
            <option value="Sponsor">Sponsor</option>
          </select>
          
          <select
            value={group}
            onChange={(e) => onGroupChange(e.target.value)}
            className="border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-info bg-background text-foreground"
          >
            <option value="">All Groups</option>
            <option value="Family">Family</option>
            <option value="Friends">Friends</option>
            <option value="Colleagues">Colleagues</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-info bg-background text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Complete">Complete</option>
            <option value="Denied">Denied</option>
          </select>

          <button
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="flex items-center gap-1 px-3 py-2 border border-info/20 bg-info/10 text-info hover:bg-info/20 disabled:bg-accent/50 disabled:text-muted-foreground disabled:border-border disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-all shadow-sm"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
      

    </div>
  );
}
