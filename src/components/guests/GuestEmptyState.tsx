import { Users, Plus, Download, UserX, SearchX } from 'lucide-react';

interface GuestEmptyStateProps {
  onAddGuest?: () => void;
  onImportClick?: () => void;
  variant?: 'no-guests' | 'all-denied' | 'no-results';
  totalDenied?: number;
  onToggleDenied?: () => void;
}

export function GuestEmptyState({
  onAddGuest,
  onImportClick,
  variant = 'no-guests',
  totalDenied = 0,
  onToggleDenied,
}: GuestEmptyStateProps) {
  if (variant === 'all-denied') {
    return (
      <div className="bg-background p-12 rounded-lg shadow-sm border border-dashed border-border flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          All guests denied
        </h3>
        <p className="text-muted max-w-sm mb-6 whitespace-pre-line">
          {`All ${totalDenied} guests for this event have been denied.\nThey are currently hidden from your default views.`}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onToggleDenied}
            className="flex items-center gap-2 bg-info text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-info/90 transition-colors shadow-sm"
          >
            Show Denied Guests
          </button>
          {onAddGuest && (
            <button
              onClick={onAddGuest}
              className="flex items-center gap-2 bg-background border border-border text-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-accent transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Guest
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'no-results') {
    return (
      <div className="bg-background p-12 rounded-lg shadow-sm border border-dashed border-border flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          No matching guests
        </h3>
        <p className="text-muted max-w-sm mb-6">
          We couldn't find any guests that match your current search and
          filters.
        </p>
        {onAddGuest && (
          <div className="flex justify-center">
            <button
              onClick={onAddGuest}
              className="flex items-center gap-2 bg-info text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-info/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Guest
            </button>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT: No guests yet
  return (
    <div className="bg-white p-12 rounded-lg shadow-sm border border-dashed border-border flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-card-foreground mb-2">
        No guests yet
      </h3>
      <p className="text-muted max-w-sm mb-6">
        Start building your guest list by adding your first guest or importing
        multiple guests via CSV.
      </p>
      {(onImportClick || onAddGuest) && (
        <div className="flex justify-center gap-4">
          {onImportClick && (
            <button
              onClick={onImportClick}
              className="flex items-center gap-2 bg-background border border-border text-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-accent transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 rotate-180" />
              Import CSV
            </button>
          )}
          {onAddGuest && (
            <button
              onClick={onAddGuest}
              className="flex items-center gap-2 bg-info text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-info/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Guest
            </button>
          )}
        </div>
      )}
    </div>
  );
}

