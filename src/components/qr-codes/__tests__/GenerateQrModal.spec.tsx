import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenerateQrModal } from '../GenerateQrModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { qrCodeApi } from '../../../api/qrCodeApi';
import { useTemplates } from '../../../hooks/use-templates';

// Mock the API and hooks
vi.mock('../../../api/qrCodeApi', () => ({
  qrCodeApi: {
    getNextId: vi.fn(),
  },
}));

vi.mock('../../../hooks/use-templates', () => ({
  useTemplates: vi.fn(),
}));

describe('GenerateQrModal', () => {
  const mockOnGenerate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (qrCodeApi.getNextId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ nextNumericId: 100, maxBatchSize: 500 });
    (useTemplates as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { data: [{ id: 1, name: 'Template 1', isDefault: false }] },
      isLoading: false,
    });
  });

  it('renders correctly when open', async () => {
    render(
      <GenerateQrModal
        isOpen={true}
        onClose={mockOnClose}
        eventId="event-1"
        onGenerate={mockOnGenerate}
      />
    );

    expect(screen.getByText('Generate More QR Codes')).toBeDefined();
    await waitFor(() => expect(screen.getByText('#100')).toBeDefined());
  });

  it('disables generate button when count is less than 1', async () => {
    render(
      <GenerateQrModal
        isOpen={true}
        onClose={mockOnClose}
        eventId="event-1"
        onGenerate={mockOnGenerate}
      />
    );

    const input = screen.getByPlaceholderText(/Enter number/i);
    fireEvent.change(input, { target: { value: '0' } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    expect(generateBtn.hasAttribute('disabled')).toBe(true);
  });

  it('disables generate button when count exceeds maxBatchSize', async () => {
    (qrCodeApi.getNextId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ nextNumericId: 100, maxBatchSize: 200 });

    render(
      <GenerateQrModal
        isOpen={true}
        onClose={mockOnClose}
        eventId="event-1"
        onGenerate={mockOnGenerate}
      />
    );

    await waitFor(() => expect(screen.getByText('Max 200')).toBeDefined());

    const input = screen.getByPlaceholderText(/Enter number/i);
    fireEvent.change(input, { target: { value: '201' } });

    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    expect(generateBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onGenerate with correct parameters when submitted', async () => {
    render(
      <GenerateQrModal
        isOpen={true}
        onClose={mockOnClose}
        eventId="event-1"
        onGenerate={mockOnGenerate}
      />
    );

    const countInput = screen.getByPlaceholderText(/Enter number/i);
    fireEvent.change(countInput, { target: { value: '50' } });

    const templateSelect = screen.getByRole('combobox');
    fireEvent.change(templateSelect, { target: { value: '1' } });

    const form = screen.getByRole('button', { name: /Generate/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(50, 1);
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
