import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { AppLayout } from '../layouts/AppLayout';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { StudyDetailsPanel } from './StudyDetailsPanel';
import { studyAPI } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getMockStudies } from '../mocks/studies';

interface Study {
  id: string; // Changed to string to support ICD-001 format
  year: number;
  period: string;
  title: string;
  impact_areas: string;
  regions: string;
  countries: string;
  center: string;
  category: string;
  contributors: string;
  summary: string;
}

interface SearchParams {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  category: string;
}

const columns = [
  { key: 'id', label: 'Study ID', sortable: true, width: 'w-24' },
  { key: 'title', label: 'Title', sortable: true, width: 'w-80', className: 'truncate' },
  { key: 'year', label: 'Year', sortable: true, width: 'w-20' },
  { key: 'category', label: 'Category', sortable: true, width: 'w-32' },
  { key: 'doi', label: 'DOI', width: 'w-32' },
  { key: 'actions', label: 'Actions', width: 'w-24' },
];

export const Dashboard: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [totalStudies, setTotalStudies] = useState(0);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Search and filter state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: '',
    page: 1,
    pageSize: 10,
    sort: 'id:desc',  // Default sort by ID descending
    category: ''
  });

  // Get debounced search value
  const debouncedQuery = useDebouncedValue(searchParams.q, 300);

  // Update URL with search params
  const updateURL = useCallback((params: SearchParams) => {
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams();
    
    if (params.q) searchParams.set('q', params.q);
    if (params.page > 1) searchParams.set('page', params.page.toString());
    if (params.pageSize !== 10) searchParams.set('pageSize', params.pageSize.toString());
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.category) searchParams.set('category', params.category);
    
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParams = new URLSearchParams(url.search);
    
    setSearchParams({
      q: urlParams.get('q') || '',
      page: parseInt(urlParams.get('page') || '1'),
      pageSize: parseInt(urlParams.get('pageSize') || '10'),
      sort: urlParams.get('sort') || '',
      category: urlParams.get('category') || ''
    });
  }, []);

  const fetchStudies = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setError('');
    
    try {
      const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
      
      if (useMocks) {
        const mockResponse = getMockStudies({
          ...params
        });
        const transformedMockStudies = mockResponse.items.map((study: any) => ({
          id: `ICD-${study.id || Math.random()}`,
          year: study.year || 2024,
          period: '2023-2024',
          title: study.title ? study.title.charAt(0).toUpperCase() + study.title.slice(1).toLowerCase() : 'No title',
          impact_areas: study.impact_areas || 'N/A',
          regions: study.regions || 'N/A',
          countries: study.countries || 'N/A',
          center: study.center || 'N/A',
          category: study.category || 'Other',
          contributors: study.authors?.join(', ') || 'N/A',
          summary: study.description || 'No summary available'
        }));
        setStudies(transformedMockStudies);
        setTotalStudies(mockResponse.total);
      } else {
        // Always use search endpoint when there's a query, otherwise use regular endpoint
        const queryParams = new URLSearchParams();
        queryParams.set('page', params.page.toString());
        queryParams.set('pageSize', params.pageSize.toString());
        if (params.sort) queryParams.set('sort', params.sort);
        if (params.category) queryParams.set('category', params.category);
        if (params.q) queryParams.set('q', params.q);
        
        // Always use the main studies endpoint
        const endpoint = `/studies?${queryParams}`;
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${endpoint}`);
        const data = await response.json();
        
        // Handle new backend response format
        let studiesData = [];
        let total = 0;
        
        if (data.success && data.data) {
          studiesData = data.data;
          total = data.pagination?.total || data.data.length;
        } else if (Array.isArray(data)) {
          studiesData = data;
          total = data.length;
        } else {
          studiesData = data.studies || data.data || [];
          total = studiesData.length;
        }
        
        // Transform data to match table format - use actual API data
        const transformedStudies = studiesData.map((study: any) => ({
          id: study.id,
          title: study.title || 'No title',
          year: study.year || 'N/A',
          category: study.category?.name || 'Research',
          doi: study.doi || 'N/A',
          summary: study.summary || 'No summary available'  // Keep for expanded view
        }));
        
        setStudies(transformedStudies);
        setTotalStudies(total);
      }
    } catch (err: any) {
      console.error('Failed to load studies:', err);
      
      // Fallback to mock data with full search functionality
      const mockResponse = getMockStudies(params);
      const transformedMockStudies = mockResponse.items.map((study: any) => ({
        id: `ICD-${study.id || Math.random()}`,
        year: study.year || 2024,
        period: '2023-2024',
        title: study.title ? study.title.charAt(0).toUpperCase() + study.title.slice(1).toLowerCase() : 'No title',
        impact_areas: study.impact_areas || 'N/A',
        regions: study.regions || 'N/A',
        countries: study.countries || 'N/A',
        center: study.center || 'N/A',
        category: study.category || 'Other',
        contributors: study.authors?.join(', ') || 'N/A',
        summary: study.description || 'No summary available'
      }));
      setStudies(transformedMockStudies);
      setTotalStudies(mockResponse.total);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch studies when search params change
  useEffect(() => {
    const paramsWithDebouncedQuery = { ...searchParams, q: debouncedQuery };
    fetchStudies(paramsWithDebouncedQuery);
    updateURL(paramsWithDebouncedQuery);
  }, [debouncedQuery, searchParams.page, searchParams.pageSize, searchParams.sort, searchParams.category, fetchStudies, updateURL]);

  const handleSearchChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, q: value, page: 1 }));
  };

  const handleSearchSubmit = () => {
    const params = { ...searchParams, page: 1 };
    fetchStudies(params);
    updateURL(params);
  };

  const handleSearchClear = () => {
    setSearchParams(prev => ({ ...prev, q: '', page: 1 }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      handleSearchClear();
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams(prev => ({ ...prev, pageSize, page: 1 }));
  };

  const handleSortChange = (sort: { field: string; dir: 'asc' | 'desc' }) => {
    setSearchParams(prev => ({ 
      ...prev, 
      sort: `${sort.field}:${sort.dir}`, 
      page: 1 
    }));
  };

  const handleClearFilters = () => {
    setSearchParams({
      q: '',
      page: 1,
      pageSize: 10,
      sort: 'id:desc',  // Default sort by ID descending
      category: ''
    });
  };

  const handleDownloadExcel = () => {
    const exportData = studies.map(study => ({
      'ID': study.id,
      'Year': study.year,
      'Period Analyzed': study.period,
      'Title': study.title,
      'Impact Areas': study.impact_areas,
      'Regions': study.regions,
      'Category': study.category,
      'Contributing Initiatives': study.contributors,
      'Summary': study.summary
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Studies');
    
    const fileName = `impact-studies-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleRowExpand = (row: Study) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row.id)) {
      newExpanded.delete(row.id);
    } else {
      newExpanded.clear(); // Only one row expanded at a time
      newExpanded.add(row.id);
    }
    setExpandedRows(newExpanded);
  };

  const handleTitleClick = (row: Study) => {
    setSelectedStudyId(row.id);
    setIsDetailsPanelOpen(true);
  };

  const handleClosePanelDetails = () => {
    setIsDetailsPanelOpen(false);
    setSelectedStudyId(null);
  };

  const handleAddStudy = () => {
    // Clear any existing form data
    localStorage.removeItem('studyFormStep1');
    localStorage.removeItem('studyFormStep2');
    localStorage.removeItem('studyFormStep3');
    window.location.href = '/studies/new/step-1';
  };

  const handleEditStudy = (study: Study) => {
    window.location.href = `/studies/edit/${study.id}`;
  };

  const handleDeleteStudy = (study: Study) => {
    setStudyToDelete(study);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!studyToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/studies/${studyToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh the studies list
        fetchStudies(searchParams);
      } else {
        alert('Failed to delete study');
      }
    } catch (error) {
      console.error('Error deleting study:', error);
      alert('Error deleting study');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setStudyToDelete(null);
    }
  };

  return (
    <AppLayout title="All Studies" onAddStudy={handleAddStudy}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Studies</h2>
            <p className="text-gray-600 mt-1">
              {loading ? 'Loading...' : `${totalStudies} studies found`}
            </p>
          </div>
          <Button variant="secondary" onClick={() => fetchStudies(searchParams)} disabled={loading}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Study ID or Title..."
              value={searchParams.q}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
              style={{
                '--ic-color-neutral': '#6b7280',
                '--ic-color-mustard': '#eab308'
              } as React.CSSProperties}
            />
            {searchParams.q && (
              <button
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <Button
            onClick={handleDownloadExcel}
            disabled={studies.length === 0}
            variant="outline"
            className="flex items-center gap-2 !bg-green-600 hover:!bg-green-700 !text-white !border-green-600 hover:!border-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Excel
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-700">{error} (Showing sample data)</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <TableSkeleton rows={searchParams.pageSize} />
        ) : studies.length === 0 ? (
          <EmptyState
            title="No studies found"
            description={searchParams.q || searchParams.category ? 
              "No studies match your current search criteria." : 
              "No studies are available at the moment."
            }
            actionLabel={searchParams.q || searchParams.category ? "Clear filters" : undefined}
            onAction={searchParams.q || searchParams.category ? handleClearFilters : undefined}
          />
        ) : (
          <>
            {/* Table */}
            <Table
              columns={columns}
              data={studies}
              onRowExpand={handleRowExpand}
              expandedRows={expandedRows}
              expandRender={(row) => (
                <div className="p-4 bg-gray-50 border-t">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Summary</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {row.summary || 'No summary available'}
                    </p>
                  </div>
                </div>
              )}
              onTitleClick={handleTitleClick}
              sort={searchParams.sort ? {
                field: searchParams.sort.split(':')[0],
                dir: searchParams.sort.split(':')[1] as 'asc' | 'desc'
              } : undefined}
              onSortChange={handleSortChange}
              onEdit={handleEditStudy}
              onDelete={handleDeleteStudy}
            />

            {/* Pagination */}
            <Pagination
              page={searchParams.page}
              pageSize={searchParams.pageSize}
              total={totalStudies}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>

      {/* Study Details Panel */}
      <StudyDetailsPanel
        isOpen={isDetailsPanelOpen}
        onClose={handleClosePanelDetails}
        studyId={selectedStudyId}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && studyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Study</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-medium">"{studyToDelete.title}"</span>? This action cannot be undone and all associated data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={confirmDelete} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 flex items-center justify-center gap-2 transition-all duration-200"
                disabled={deleting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Deleting...' : 'Delete Study'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setStudyToDelete(null);
                }} 
                className="flex-1 font-medium py-3 flex items-center justify-center gap-2 transition-all duration-200"
                disabled={deleting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
