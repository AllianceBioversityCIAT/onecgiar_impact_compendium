import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { studyAPI } from '../services/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getMockStudies } from '../mocks/studies';

interface Study {
  id: number;
  year: number;
  period: string;
  title: string;
  summary: string;
  category: string;
  contributors: string;
}

interface SearchParams {
  q: string;
  page: number;
  pageSize: number;
  sort: string;
  category: string;
}

const columns = [
  { key: 'id', label: 'ID', width: 'w-16' },
  { key: 'year', label: 'Year', sortable: true, width: 'w-20' },
  { key: 'period', label: 'Period Analyzed', width: 'w-32' },
  { key: 'title', label: 'Title', width: 'w-96' },
  { key: 'summary', label: 'Summary', width: 'w-48' },
  { key: 'category', label: 'Category', width: 'w-40' },
  { key: 'contributors', label: 'Contributing Initiatives', width: 'w-48' },
];

export const Dashboard: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [totalStudies, setTotalStudies] = useState(0);
  
  // Search and filter state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: '',
    page: 1,
    pageSize: 10,
    sort: '',
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
        const mockResponse = getMockStudies(params);
        setStudies(mockResponse.items as Study[]);
        setTotalStudies(mockResponse.total);
      } else {
        const response = await studyAPI.getAll();
        
        // Handle API response and transform data
        let studiesData = Array.isArray(response) ? response : response.studies || response.data || [];
        
        // Filter by search query
        if (params.q) {
          studiesData = studiesData.filter((study: any) =>
            study.title?.toLowerCase().includes(params.q.toLowerCase()) ||
            study.category?.toLowerCase().includes(params.q.toLowerCase()) ||
            study.summary?.toLowerCase().includes(params.q.toLowerCase())
          );
        }
        
        // Filter by category
        if (params.category) {
          studiesData = studiesData.filter((study: any) => study.category === params.category);
        }
        
        // Paginate
        const total = studiesData.length;
        const start = (params.page - 1) * params.pageSize;
        const paginatedData = studiesData.slice(start, start + params.pageSize);
        
        // Transform data
        const transformedStudies = paginatedData.map((study: any) => ({
          id: study.id || study.study_id || Math.random(),
          year: study.year_of_report || study.year || 'N/A',
          period: study.period_analyzed || `${study.period_start || ''}-${study.period_end || ''}` || 'N/A',
          title: study.title || 'No title',
          summary: study.summary || 'No summary available',
          category: study.category || 'Other',
          contributors: study.contributing_initiatives || study.contributors || 'N/A'
        }));
        
        setStudies(transformedStudies);
        setTotalStudies(total);
      }
    } catch (err: any) {
      console.error('Failed to load studies:', err);
      setError(`Failed to load studies: ${err.message}`);
      
      // Fallback to mock data
      const mockResponse = getMockStudies(params);
      setStudies(mockResponse.items as Study[]);
      setTotalStudies(mockResponse.total);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch studies when debounced query or other params change
  useEffect(() => {
    const params = { ...searchParams, q: debouncedQuery };
    fetchStudies(params);
    updateURL(params);
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

  const handleRowExpand = (row: Study) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row.id)) {
      newExpanded.delete(row.id);
    } else {
      newExpanded.add(row.id);
    }
    setExpandedRows(newExpanded);
  };

  const handleAddStudy = () => {
    window.location.href = '/studies/new/step-1';
  };

  const totalPages = Math.ceil(totalStudies / searchParams.pageSize);

  return (
    <AppLayout title="All Studies" onAddStudy={handleAddStudy}>
      <div className="space-y-6">
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
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search studies..."
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
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Loading studies...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <Table
              columns={columns}
              data={studies}
              onRowExpand={handleRowExpand}
              expandedRows={expandedRows}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing {((searchParams.page - 1) * searchParams.pageSize) + 1} to {Math.min(searchParams.page * searchParams.pageSize, totalStudies)} of {totalStudies} results
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(searchParams.page - 1)}
                    disabled={searchParams.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm rounded ${
                            page === searchParams.page
                              ? 'bg-yellow-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm rounded ${
                            totalPages === searchParams.page
                              ? 'bg-yellow-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(searchParams.page + 1)}
                    disabled={searchParams.page === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};
