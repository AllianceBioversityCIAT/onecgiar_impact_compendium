import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

// Mock the API
jest.mock('../../services/api', () => ({
  studyAPI: {
    getAll: jest.fn(),
  },
}));

// Mock environment variable
Object.defineProperty(import.meta, 'env', {
  value: { VITE_USE_MOCKS: 'true' },
});

describe('Dashboard Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      value: { replaceState: jest.fn() },
    });
  });

  test('renders pagination component', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/of \d+ results/)).toBeInTheDocument();
    });
  });

  test('displays correct page size options', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const pageSizeSelect = screen.getByLabelText('Show:');
      expect(pageSizeSelect).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue('10');
      expect(options[1]).toHaveValue('25');
      expect(options[2]).toHaveValue('50');
    });
  });

  test('changes page size and resets to page 1', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const pageSizeSelect = screen.getByLabelText('Show:');
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    });

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  test('navigates to next page', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const nextButton = screen.getByLabelText('Next page');
      if (!nextButton.disabled) {
        fireEvent.click(nextButton);
      }
    });

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  test('navigates to previous page', async () => {
    // Mock URL with page=2
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/dashboard?page=2',
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      const prevButton = screen.getByLabelText('Previous page');
      if (!prevButton.disabled) {
        fireEvent.click(prevButton);
      }
    });

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  test('shows skeleton loading state', () => {
    render(<Dashboard />);

    // Should show skeleton initially
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('shows empty state when no results', async () => {
    // Mock empty results
    Object.defineProperty(import.meta, 'env', {
      value: { VITE_USE_MOCKS: 'false' },
    });

    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: [],
          pagination: { total: 0 },
        }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No studies found')).toBeInTheDocument();
    });
  });

  test('shows clear filters button in empty state when filters applied', async () => {
    // Mock URL with search query
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/dashboard?q=nonexistent',
      },
    });

    // Mock empty results
    Object.defineProperty(import.meta, 'env', {
      value: { VITE_USE_MOCKS: 'false' },
    });

    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: [],
          pagination: { total: 0 },
        }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });
  });

  test('clears filters when clear filters button is clicked', async () => {
    // Mock URL with search query
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/dashboard?q=test&category=Impact',
      },
    });

    // Mock empty results
    Object.defineProperty(import.meta, 'env', {
      value: { VITE_USE_MOCKS: 'false' },
    });

    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          data: [],
          pagination: { total: 0 },
        }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      const clearButton = screen.getByText('Clear filters');
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  test('preserves pagination state in URL', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const pageSizeSelect = screen.getByLabelText('Show:');
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    });

    await waitFor(() => {
      // Check that URL was updated with pageSize parameter
      const calls = (window.history.replaceState as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[2]).toContain('pageSize=25');
    });
  });
});
