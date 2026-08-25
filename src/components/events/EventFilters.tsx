import React from 'react';
import type { EventFilters as FilterState } from '../../utils/event-filters';
import { Calendar, Trash2 } from 'lucide-react';

interface EventFiltersProps {
  filters: FilterState;
  onStatusChange: (status?: 'upcoming' | 'ongoing' | 'completed') => void;
  onDateRangeChange: (start?: string, end?: string) => void;
  onClearAll: () => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onStatusChange,
  onDateRangeChange,
  onClearAll
}) => {
  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      onStatusChange(undefined);
    } else {
      onStatusChange(val as 'upcoming' | 'ongoing' | 'completed');
    }
  };

  const hasFilters = filters.statusFilter || filters.dateRangeStart || filters.dateRangeEnd;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
      <div className="flex-1 max-w-xs">
        <label className="block text-sm font-medium text-muted mb-1">Status</label>
        <select
          value={filters.statusFilter || 'all'}
          onChange={handleStatusSelect}
          className="block w-full rounded-md border-border shadow-sm focus:border-info focus:ring-info sm:text-sm border p-2 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-4 items-end flex-1">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-muted mb-1">From Date</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="date"
              value={filters.dateRangeStart || ''}
              onChange={(e) => onDateRangeChange(e.target.value || undefined, filters.dateRangeEnd)}
              className="block w-full rounded-md border-border pl-10 focus:border-info focus:ring-info sm:text-sm border p-2"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-muted mb-1">To Date</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="date"
              value={filters.dateRangeEnd || ''}
              min={filters.dateRangeStart} // end date shouldn't be before start
              onChange={(e) => {
                const newEnd = e.target.value;
                if (filters.dateRangeStart && newEnd && newEnd < filters.dateRangeStart) {
                   return; // ignore invalid end date
                }
                onDateRangeChange(filters.dateRangeStart, newEnd || undefined);
              }}
              className="block w-full rounded-md border-border pl-10 focus:border-info focus:ring-info sm:text-sm border p-2"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={!hasFilters}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            hasFilters ? 'bg-error hover:bg-error/90 focus:ring-error' : 'bg-muted cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Filters
        </button>
      </div>
    </div>
  );
};
