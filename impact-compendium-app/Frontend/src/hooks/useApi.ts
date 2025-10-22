import { useState, useEffect, useCallback } from 'react';
import ApiService from '@/services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { immediate = true, dependencies = [] } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  }, [apiCall]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate, ...dependencies]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Specific hooks for common API calls
export function useStudies(params?: any) {
  return useApi(() => ApiService.getStudies(params), {
    dependencies: [params]
  });
}

export function useStudy(id: number) {
  return useApi(() => ApiService.getStudy(id), {
    dependencies: [id],
    immediate: !!id
  });
}

export function useProfile() {
  return useApi(() => ApiService.getProfile());
}
