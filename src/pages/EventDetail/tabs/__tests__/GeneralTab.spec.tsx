import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GeneralTab } from '../GeneralTab';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateEventSettings, useUpdateEvent, useDeleteEvent } from '../../../../hooks/use-events';
import { useNavigate } from 'react-router-dom';

import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../hooks/use-events', () => ({
  useUpdateEventSettings: vi.fn(),
  useUpdateEvent: vi.fn(),
  useDeleteEvent: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// lucide-react icons are mocked globally in test/setup.ts — no per-file mock needed

describe('GeneralTab', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  const mockEvent = {
    id: '1',
    name: 'Test Event',
    description: 'Test Description',
    date: '2024-12-01',
    location: 'Test Location',
    status: 'draft',
    visibility: 'private',
    slug: 'test-event',
    registeredAttendees: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const mockUpdateSettings = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockUpdateEvent = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockDeleteEvent = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdateEventSettings as Mock).mockReturnValue(mockUpdateSettings);
    (useUpdateEvent as Mock).mockReturnValue(mockUpdateEvent);
    (useDeleteEvent as Mock).mockReturnValue(mockDeleteEvent);
    (useNavigate as Mock).mockReturnValue(mockNavigate);
  });

  it('renders correctly with event data', () => {
    render(<GeneralTab event={mockEvent} />, { wrapper });
    
    expect(screen.getByDisplayValue('Test Event')).toBeDefined();
    expect(screen.getByText('Event Settings')).toBeDefined();
  });

  it('US1: toggles visibility', async () => {
    render(<GeneralTab event={mockEvent} />, { wrapper });
    
    // Visibility is on the Security tab — click it first
    const securityTab = screen.getByText('URL & Security');
    fireEvent.click(securityTab);

    const publicButton = screen.getByText('Public');
    fireEvent.click(publicButton);
    
    expect(publicButton.className).toContain('text-info');
    expect(publicButton.className).toContain('shadow-xl');
  });

  it('US3: validates slug in real-time', async () => {
    render(<GeneralTab event={mockEvent} />, { wrapper });
    
    // Slug is on the Security tab
    const securityTab = screen.getByText('URL & Security');
    fireEvent.click(securityTab);

    const slugInput = screen.getByPlaceholderText('event-slug');
    fireEvent.change(slugInput, { target: { value: 'invalid slug' } });
    
    expect(screen.getByText(/Slug can only contain/)).toBeDefined();
  });

  it('US2: shows archive confirmation modal', () => {
    render(<GeneralTab event={mockEvent} />, { wrapper });
    
    const learnMoreButton = screen.getByText('Learn more');
    fireEvent.click(learnMoreButton);
    
    expect(screen.getByText(/Are you sure you want to archive/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Archive it/i })).toBeDefined();
  });

  it('US2: calls archive API and navigates on confirm', async () => {
    mockDeleteEvent.mutateAsync.mockResolvedValueOnce({});
    render(<GeneralTab event={mockEvent} />, { wrapper });
    
    fireEvent.click(screen.getByText('Learn more'));
    fireEvent.click(screen.getByRole('button', { name: /Archive it/i }));
    
    expect(mockDeleteEvent.mutateAsync).toHaveBeenCalled();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/events'));
  });
});
