import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestsTab } from '../GuestsTab';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGuests } from '../../../../hooks/use-guests';

vi.mock('../../../../hooks/use-guests', () => ({
  useGuests: vi.fn(),
  useAddGuest: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateGuest: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useImportGuests: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('../../../../hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'a@b.com', name: 'Test', role: 'ADMIN' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('../../../../hooks/use-templates', () => ({
  useTemplates: vi.fn(() => ({ data: { data: [] } })),
  useTemplate: vi.fn(() => ({ data: null })),
}));

interface GuestBulkActionsProps {
  selectedCount: number;
}

// Mock related components
vi.mock('../../../../components/guests/GuestBulkActions', () => ({
  default: ({ selectedCount }: GuestBulkActionsProps) => <div>{selectedCount} guests selected</div>
}));

describe('GuestsTab Row Selection', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockGuests = [
    { id: '1', name: 'Guest 1', status: 'Complete' },
    { id: '2', name: 'Guest 2', status: 'Pending' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useGuests as Mock).mockReturnValue({
      data: { data: mockGuests, totalPages: 1 },
      isLoading: false,
      refetch: vi.fn()
    });
  });

  it('US2: clicking row checkbox updates selection count', () => {
    render(<GuestsTab eventId="e1" />, { wrapper });
    
    const checkboxes = screen.getAllByRole('checkbox');
    // checkbox[0] is Select All, checkbox[1] is Guest 1, checkbox[2] is Guest 2
    fireEvent.click(checkboxes[1]);
    
    expect(screen.getByText('1 guests selected')).toBeDefined();
  });

  it('US2: select all checkbox selects all current page guests', () => {
    render(<GuestsTab eventId="e1" />, { wrapper });
    
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    fireEvent.click(checkboxes[0]); // Select All
    
    expect(screen.getByText('2 guests selected')).toBeDefined();
    expect(checkboxes[1].checked).toBe(true);
    expect(checkboxes[2].checked).toBe(true);
  });
});
