import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from '../Table';

const mockColumns = [
  { key: 'id', label: 'ID' },
  { key: 'year', label: 'Year', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
];

const mockData = [
  { id: 1, year: 2023, title: 'Study A', category: 'Research' },
  { id: 2, year: 2022, title: 'Study B', category: 'Analysis' },
];

describe('Table Sorting', () => {
  it('renders sortable column headers as buttons', () => {
    render(<Table columns={mockColumns} data={mockData} />);
    
    expect(screen.getByRole('button', { name: /year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /category/i })).toBeInTheDocument();
  });

  it('calls onSortChange when sortable header is clicked', () => {
    const mockOnSortChange = jest.fn();
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        onSortChange={mockOnSortChange}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /year/i }));
    expect(mockOnSortChange).toHaveBeenCalledWith({ field: 'year', dir: 'asc' });
  });

  it('toggles sort direction on repeated clicks', () => {
    const mockOnSortChange = jest.fn();
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        sort={{ field: 'year', dir: 'asc' }}
        onSortChange={mockOnSortChange}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /year/i }));
    expect(mockOnSortChange).toHaveBeenCalledWith({ field: 'year', dir: 'desc' });
  });

  it('sets aria-sort attribute correctly', () => {
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        sort={{ field: 'year', dir: 'asc' }}
      />
    );
    
    const yearButton = screen.getByRole('button', { name: /year/i });
    expect(yearButton).toHaveAttribute('aria-sort', 'ascending');
  });

  it('handles keyboard navigation', () => {
    const mockOnSortChange = jest.fn();
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        onSortChange={mockOnSortChange}
      />
    );
    
    const yearButton = screen.getByRole('button', { name: /year/i });
    fireEvent.keyDown(yearButton, { key: 'Enter' });
    expect(mockOnSortChange).toHaveBeenCalledWith({ field: 'year', dir: 'asc' });
  });
});
