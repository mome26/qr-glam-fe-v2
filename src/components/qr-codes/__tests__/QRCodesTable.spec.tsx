import { render, screen } from '@testing-library/react';
import { QRCodesTable } from '../QRCodesTable';
import { describe, it, expect, vi } from 'vitest';
import type { QrCode } from '../../../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextType } from '../../../context/auth-context-core';

vi.mock('../../../hooks/use-qr-codes', () => ({
  useUpdateQrCode: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../QRCodeEditModal', () => ({
  QRCodeEditModal: () => null,
}));

vi.mock('../QRCodePreviewModal', () => ({
  default: () => null,
}));

vi.mock('../AssignTemplateModal', () => ({
  AssignTemplateModal: () => null,
}));

const mockCodes: QrCode[] = [
  {
    id: '1',
    numericId: 1,
    eventId: 'e1',
    guestId: 'g1',
    qrLink: 'https://qr.example.com/1',
    createdAt: '2026-04-02',
    guest: { 
      id: 'g1', 
      name: 'John Doe', 
      status: 'Complete', 
      eventId: 'e1', 
      mediaCount: 0, 
      createdAt: '', 
      updatedAt: '' 
    }
  },
  {
    id: '2',
    numericId: 2,
    eventId: 'e1',
    guestId: '',
    qrLink: 'https://qr.example.com/2',
    createdAt: '2026-04-02',
  }
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const mockAuth: AuthContextType = {
    user: { id: 'test-user', email: 'test@test.com', name: 'Test User', role: 'ADMIN' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={mockAuth}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </AuthContext.Provider>
  );
}

describe('QRCodesTable', () => {
  it('US1: renders "Assignment" column header (should fail if named Status)', () => {
    renderWithProviders(<QRCodesTable codes={mockCodes} isLoading={false} eventId="e1" />);
    // Spec FR-001 specifically mentions "Assignment" column
    expect(screen.getByText('Assignment')).toBeDefined();
  });

  it('US1: ensures no raw QR link visible in the table structure (Assignment column)', () => {
    renderWithProviders(<QRCodesTable codes={mockCodes} isLoading={false} eventId="e1" />);
    // QR links should not be visible in raw form in the grid
    expect(screen.queryByText(mockCodes[0].qrLink)).toBeNull();
  });

  it('US1: provides explicit View QR action', () => {
    renderWithProviders(<QRCodesTable codes={mockCodes} isLoading={false} eventId="e1" />);
    const viewLinks = screen.getAllByText(/View QR/i);
    expect(viewLinks.length).toBe(mockCodes.length);
  });

  it('US1: Edit action should NOT be a link but a button/trigger for modal (should fail if link with href)', () => {
    renderWithProviders(<QRCodesTable codes={mockCodes} isLoading={false} eventId="e1" />);
    // FR-005: "trigger an in-context modal... rather than routing to a separate page"
    const editTriggers = screen.getAllByText(/Edit/i);
    editTriggers.forEach(trigger => {
        // If it's a link with a specific edit URL, it fails the "modal rather than routing" check
        expect(trigger.tagName).not.toBe('A');
    });
  });
});
