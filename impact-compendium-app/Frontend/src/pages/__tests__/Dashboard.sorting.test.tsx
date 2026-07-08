import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

// Mock the API
jest.mock('../../services/api', () => ({
  studyAPI: {
    getStudies: jest.fn(),
    searchStudies: jest.fn(),
  },
}));

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_USE_MOCKS: 'true',
    VITE_API_BASE_URL: 'http://localhost:8000',
  },
});

describe('Dashboard Sorting', () => {
  beforeEach(() => {
    // Reset URL
    window.history.replaceState({}, '', '/');
  });

  it('updates URL when sort changes', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /year/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /year/i }));

    await waitFor(() => {
      expect(window.location.search).toContain('sort=year:asc');
    });
  });

  it('resets to page 1 when sorting', async () => {
    // Start on page 2
    window.history.replaceState({}, '', '/?page=2');

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /year/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /year/i }));

    await waitFor(() => {
      expect(window.location.search).toContain('page=1');
      expect(window.location.search).toContain('sort=year:asc');
    });
  });

  it('restores sort state from URL on load', () => {
    window.history.replaceState({}, '', '/?sort=year:desc');

    render(<Dashboard />);

    const yearButton = screen.getByRole('button', { name: /year/i });
    expect(yearButton).toHaveAttribute('aria-sort', 'descending');
  });

  it('combines sort with search and pagination', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    // Add search term
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(window.location.search).toContain('q=test');
    });

    // Add sorting
    fireEvent.click(screen.getByRole('button', { name: /year/i }));

    await waitFor(() => {
      expect(window.location.search).toContain('q=test');
      expect(window.location.search).toContain('sort=year:asc');
    });
  });
});
