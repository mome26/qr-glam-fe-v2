

export interface EventFilters {
  statusFilter?: 'upcoming' | 'ongoing' | 'completed';
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

const STORAGE_KEY = 'qr-glam-events-filters';

export function getFilterState(): EventFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const filters: EventFilters = {};
    if (['upcoming', 'ongoing', 'completed'].includes(parsed.statusFilter)) {
      filters.statusFilter = parsed.statusFilter;
    }
    if (parsed.dateRangeStart && typeof parsed.dateRangeStart === 'string') {
      filters.dateRangeStart = parsed.dateRangeStart;
    }
    if (parsed.dateRangeEnd && typeof parsed.dateRangeEnd === 'string') {
      filters.dateRangeEnd = parsed.dateRangeEnd;
    }
    return filters;
  } catch {
    return {};
  }
}

export function saveFilterState(filters: EventFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

export function clearFilterState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}


