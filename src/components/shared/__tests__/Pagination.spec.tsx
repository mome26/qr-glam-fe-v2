import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';
import { vi, describe, it, expect } from 'vitest';

describe('Pagination Delegation', () => {
  it('US3: emits onPageChange event when clicking next', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={onPageChange} 
      />
    );
    
    const nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('US3: emits onPageChange event when clicking previous', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={onPageChange} 
      />
    );
    
    const prevButton = screen.getByText(/Previous/i);
    fireEvent.click(prevButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('US3: does not render when totalPages <= 1', () => {
    render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.queryByText(/Page 1 of 1/i)).toBeNull();
  });

  it('US3: disables buttons appropriately at boundaries', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
    const prevBtn = screen.getByText(/Previous/i).closest('button') as HTMLButtonElement;
    const nextBtn = screen.getByText(/Next/i).closest('button') as HTMLButtonElement;
    
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);
  });
});
