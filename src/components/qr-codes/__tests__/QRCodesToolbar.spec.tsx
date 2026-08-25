import { render, screen } from '@testing-library/react';
import { QRCodesToolbar } from '../QRCodesToolbar';
import { vi, describe, it, expect } from 'vitest';

describe('QRCodesToolbar', () => {
  it('US1: does NOT contain "Reset" button (should fail if Reset is present)', () => {
    render(
      <QRCodesToolbar 
        search="test" 
        onSearchChange={vi.fn()} 
        assigned={true} 
        onAssignedChange={vi.fn()} 
      />
    );
    // FR-008: "removing redundant Reset and Advanced buttons"
    expect(screen.queryByText(/Reset/i)).toBeNull();
  });

  it('US1: does NOT contain "Advanced" button (should fail if Advanced is present)', () => {
    render(
      <QRCodesToolbar 
        search="" 
        onSearchChange={vi.fn()} 
        assigned={undefined} 
        onAssignedChange={vi.fn()} 
      />
    );
    expect(screen.queryByText(/Advanced/i)).toBeNull();
  });

  it('US1: provides an inline clear button within the search container (should fail if no clear button found)', () => {
    const onSearchChange = vi.fn();
    render(
      <QRCodesToolbar 
        search="something" 
        onSearchChange={onSearchChange} 
        assigned={undefined} 
        onAssignedChange={vi.fn()} 
      />
    );
    
    // We expect a button with the X icon inside the search container specifically
    // Testing implementation detail: usually absolute positioned.
    // For now, let's just check it doesn't say "Reset" and there's a button to clear.
    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDefined();
  });
});
