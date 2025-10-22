import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    pageSize: 10,
    total: 100,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays correct result count', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText('1–10 of 100 results')).toBeInTheDocument();
  });

  test('displays correct result count for last page', () => {
    render(<Pagination {...defaultProps} page={10} total={95} />);
    expect(screen.getByText('91–95 of 95 results')).toBeInTheDocument();
  });

  test('renders page size selector', () => {
    render(<Pagination {...defaultProps} />);
    const select = screen.getByLabelText('Show:');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('10');
  });

  test('calls onPageSizeChange when page size is changed', () => {
    const onPageSizeChange = jest.fn();
    render(<Pagination {...defaultProps} onPageSizeChange={onPageSizeChange} />);
    
    const select = screen.getByLabelText('Show:');
    fireEvent.change(select, { target: { value: '25' } });
    
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  test('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} page={1} />);
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  test('disables next button on last page', () => {
    render(<Pagination {...defaultProps} page={10} />);
    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  test('calls onPageChange when previous button is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} page={2} onPageChange={onPageChange} />);
    
    const prevButton = screen.getByLabelText('Previous page');
    fireEvent.click(prevButton);
    
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  test('calls onPageChange when next button is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} page={1} onPageChange={onPageChange} />);
    
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('renders page numbers correctly', () => {
    render(<Pagination {...defaultProps} page={3} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('highlights current page', () => {
    render(<Pagination {...defaultProps} page={3} />);
    
    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-yellow-500', 'text-white');
  });

  test('calls onPageChange when page number is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} page={1} onPageChange={onPageChange} />);
    
    const pageButton = screen.getByText('3');
    fireEvent.click(pageButton);
    
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test('shows ellipsis and last page for large page counts', () => {
    render(<Pagination {...defaultProps} page={1} total={1000} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('does not render when total is 0', () => {
    const { container } = render(<Pagination {...defaultProps} total={0} />);
    expect(container.firstChild).toBeNull();
  });

  test('handles single page correctly', () => {
    render(<Pagination {...defaultProps} total={5} />);
    
    const prevButton = screen.getByLabelText('Previous page');
    const nextButton = screen.getByLabelText('Next page');
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(screen.getByText('1–5 of 5 results')).toBeInTheDocument();
  });
});
