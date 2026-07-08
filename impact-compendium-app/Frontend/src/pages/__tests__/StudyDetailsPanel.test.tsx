import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudyDetailsPanel } from '../StudyDetailsPanel';
import { studyAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  studyAPI: {
    getById: jest.fn(),
  },
}));

const mockStudy = {
  study_id: 1,
  title: 'Test Study',
  summary: 'This is a test study summary',
  category: 'Impact Study',
  year: 2024,
  contributors: 'John Doe, Jane Smith',
  doi: 'https://doi.org/10.1000/test',
};

describe('StudyDetailsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when open', async () => {
    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Study Details')).toBeInTheDocument();
    });
  });

  test('does not render when closed', () => {
    render(
      <StudyDetailsPanel isOpen={false} onClose={jest.fn()} studyId={1} />
    );

    expect(screen.queryByText('Study Details')).not.toBeInTheDocument();
  });

  test('loads and displays study data', async () => {
    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Test Study')).toBeInTheDocument();
      expect(
        screen.getByText('This is a test study summary')
      ).toBeInTheDocument();
      expect(screen.getByText('Impact Study')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });
  });

  test('displays contributors as chips', async () => {
    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('displays DOI link when available', async () => {
    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    await waitFor(() => {
      const doiLink = screen.getByText('https://doi.org/10.1000/test');
      expect(doiLink).toBeInTheDocument();
      expect(doiLink.closest('a')).toHaveAttribute(
        'href',
        'https://doi.org/10.1000/test'
      );
    });
  });

  test('closes panel when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(
      <StudyDetailsPanel isOpen={true} onClose={mockOnClose} studyId={1} />
    );

    await waitFor(() => {
      const closeButton = screen.getByText('Close Panel');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('closes panel when ESC key is pressed', async () => {
    const mockOnClose = jest.fn();
    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(
      <StudyDetailsPanel isOpen={true} onClose={mockOnClose} studyId={1} />
    );

    await waitFor(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('shows loading state', () => {
    (studyAPI.getById as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  test('handles API error gracefully', async () => {
    (studyAPI.getById as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load study details.')
      ).toBeInTheDocument();
    });
  });

  test('navigates to edit page when edit button is clicked', async () => {
    const mockLocationAssign = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { href: mockLocationAssign },
      writable: true,
    });

    (studyAPI.getById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudy,
    });

    render(<StudyDetailsPanel isOpen={true} onClose={jest.fn()} studyId={1} />);

    await waitFor(() => {
      const editButton = screen.getByText('Edit Study');
      fireEvent.click(editButton);
      expect(window.location.href).toBe('/studies/edit/1');
    });
  });
});
