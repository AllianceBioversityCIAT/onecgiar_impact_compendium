import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from '../Table';

const mockColumns = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' }
];

const mockData = [
  { id: 1, title: 'Study 1', category: 'Impact Study', summary: 'This is a test summary' },
  { id: 2, title: 'Study 2', category: 'Outcome Study', summary: 'Another test summary' }
];

describe('Table Expand Functionality', () => {
  test('renders expand chevron buttons', () => {
    render(<Table columns={mockColumns} data={mockData} />);
    
    const expandButtons = screen.getAllByLabelText(/expand row details/i);
    expect(expandButtons).toHaveLength(2);
  });

  test('expands row when chevron is clicked', () => {
    const mockOnRowExpand = jest.fn();
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        onRowExpand={mockOnRowExpand}
      />
    );
    
    const expandButton = screen.getAllByLabelText(/expand row details/i)[0];
    fireEvent.click(expandButton);
    
    expect(mockOnRowExpand).toHaveBeenCalledWith(mockData[0]);
  });

  test('shows expanded content when row is expanded', () => {
    const expandedRows = new Set([1]);
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        expandedRows={expandedRows}
      />
    );
    
    expect(screen.getByText('This is a test summary')).toBeInTheDocument();
    expect(screen.getByText('View details')).toBeInTheDocument();
  });

  test('chevron rotates when expanded', () => {
    const expandedRows = new Set([1]);
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        expandedRows={expandedRows}
      />
    );
    
    const chevron = screen.getAllByLabelText(/collapse row details/i)[0].querySelector('svg');
    expect(chevron).toHaveClass('rotate-90');
  });

  test('calls onTitleClick when title is clicked', () => {
    const mockOnTitleClick = jest.fn();
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        onTitleClick={mockOnTitleClick}
      />
    );
    
    const titleButton = screen.getByText('Study 1');
    fireEvent.click(titleButton);
    
    expect(mockOnTitleClick).toHaveBeenCalledWith(mockData[0]);
  });

  test('supports keyboard navigation', () => {
    const mockOnRowExpand = jest.fn();
    render(
      <Table 
        columns={mockColumns} 
        data={mockData} 
        onRowExpand={mockOnRowExpand}
      />
    );
    
    const expandButton = screen.getAllByLabelText(/expand row details/i)[0];
    
    // Test Enter key
    fireEvent.keyDown(expandButton, { key: 'Enter' });
    expect(mockOnRowExpand).toHaveBeenCalledWith(mockData[0]);
    
    // Test Space key
    fireEvent.keyDown(expandButton, { key: ' ' });
    expect(mockOnRowExpand).toHaveBeenCalledTimes(2);
  });

  test('truncates summary to 240 characters', () => {
    const longSummary = 'A'.repeat(300);
    const dataWithLongSummary = [
      { id: 1, title: 'Study 1', category: 'Impact Study', summary: longSummary }
    ];
    const expandedRows = new Set([1]);
    
    render(
      <Table 
        columns={mockColumns} 
        data={dataWithLongSummary} 
        expandedRows={expandedRows}
      />
    );
    
    const summaryText = screen.getByText(/A{240}\.\.\./, { exact: false });
    expect(summaryText).toBeInTheDocument();
  });
});
