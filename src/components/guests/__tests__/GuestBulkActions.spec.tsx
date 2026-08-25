import { render, screen } from '@testing-library/react';
import GuestBulkActions from '../GuestBulkActions';
import { vi, describe, it, expect } from 'vitest';

describe('GuestBulkActions', () => {
  it('US2: contains Bulk Download button when guests are selected (should fail if button missing)', () => {
    render(
      <GuestBulkActions 
        selectedCount={5}
        onBulkAssign={vi.fn()}
        onBulkDelete={vi.fn()}
        onExportCsv={vi.fn()}
        onOpenBulkDownload={vi.fn()}
        onClearSelection={vi.fn()}
      />
    );
    // FR-004: "MUST implement the Bulk Download action"
    expect(screen.getByText(/Bulk Download/i)).toBeDefined();
  });

  it('US2: Bulk Download is disabled when no guests are selected', () => {
    const onOpenBulkDownloadMock = vi.fn();
    render(
      <GuestBulkActions
        selectedCount={0}
        onBulkAssign={vi.fn()}
        onBulkDelete={vi.fn()}
        onExportCsv={vi.fn()}
        onOpenBulkDownload={onOpenBulkDownloadMock}
        onClearSelection={vi.fn()}
      />
    );
    const downloadBtn = screen.getByText(/Bulk Download/i).closest('button') as HTMLButtonElement;
    expect(downloadBtn.disabled).toBe(true);
  });
});
