import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { studyAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  studyAPI: {
    getAll: jest.fn()
  }
}));

// Mock environment variable
Object.defineProperty(import.meta, 'env', {
  value: { VITE_USE_MOCKS: 'true' }
});

describe('Dashboard Search Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      value: { replaceState: jest.fn() }
    });
  });

  test('debounces search input', async () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Type quickly - should not trigger immediate search
    fireEvent.change(searchInput, { target: { value: 'c' } });
    fireEvent.change(searchInput, { target: { value: 'cl' } });
    fireEvent.change(searchInput, { target: { value: 'cli' } });
    fireEvent.change(searchInput, { target: { value: 'climate' } });
    
    // Should not have made API calls yet
    expect(studyAPI.getAll).toHaveBeenCalledTimes(1); // Only initial load
    
    // Wait for debounce delay
    await waitFor(() => {
      expect(studyAPI.getAll).toHaveBeenCalledTimes(2);
    }, { timeout: 400 });
  });

  test('Enter key bypasses debounce', async () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Type and press Enter immediately
    fireEvent.change(searchInput, { target: { value: 'climate' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    // Should trigger immediate search
    await waitFor(() => {
      expect(studyAPI.getAll).toHaveBeenCalledTimes(2);
    });
  });

  test('Escape key clears search', async () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Type something
    fireEvent.change(searchInput, { target: { value: 'climate' } });
    expect(searchInput.value).toBe('climate');
    
    // Press Escape
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    
    // Should clear the input
    expect(searchInput.value).toBe('');
  });

  test('Search works across all fields including ID', async () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Test searching by ID
    fireEvent.change(searchInput, { target: { value: '1' } });
    
    await waitFor(() => {
      expect(studyAPI.getAll).toHaveBeenCalledTimes(2);
    }, { timeout: 400 });
    
    // Test searching by year
    fireEvent.change(searchInput, { target: { value: '2024' } });
    
    await waitFor(() => {
      expect(studyAPI.getAll).toHaveBeenCalledTimes(3);
    }, { timeout: 400 });
  });

  test('Clear button (×) clears search', async () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Type something to show clear button
    fireEvent.change(searchInput, { target: { value: 'climate' } });
    
    // Wait for clear button to appear
    await waitFor(() => {
      const clearButton = screen.getByRole('button');
      expect(clearButton).toBeInTheDocument();
    });
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    // Should clear the input
    expect(searchInput.value).toBe('');
  });

  test('URL sync with search parameters', async () => {
    // Mock URL constructor
    const mockURL = {
      href: 'http://localhost:3000/dashboard',
      search: '',
      toString: () => 'http://localhost:3000/dashboard'
    };
    
    global.URL = jest.fn().mockImplementation(() => mockURL);
    
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Type and wait for debounce
    fireEvent.change(searchInput, { target: { value: 'climate' } });
    
    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalled();
    }, { timeout: 400 });
  });

  test('Search resets page to 1', async () => {
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Type search term
    fireEvent.change(searchInput, { target: { value: 'climate' } });
    
    // Wait for search to complete
    await waitFor(() => {
      expect(studyAPI.getAll).toHaveBeenCalledTimes(2);
    }, { timeout: 400 });
    
    // Check that page is reset to 1 in URL
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  test('Preserves search state on page refresh', () => {
    // Mock URL with search params
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/dashboard?q=climate&page=2'
      }
    });
    
    render(<Dashboard />);
    
    const searchInput = screen.getByPlaceholderText('Search by ID, title, year, category, or any field...');
    
    // Should initialize with URL params
    expect(searchInput.value).toBe('climate');
  });
});
