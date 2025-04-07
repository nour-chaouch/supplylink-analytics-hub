import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiSlice } from '@/store/api/apiSlice';

interface UseDataOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

// Define the response type to match what our API actually returns
interface ApiResponse {
  data: any;
  success: boolean;
  error?: string; // Make error optional since it might not always be present
}

export function useDashboardData(role: string, endpoint: string = 'getDashboardData', options: UseDataOptions = {}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the apiSlice to fetch data from the backend
        const response = await fetch(`http://localhost:5001/api/${role}/${endpoint}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Unknown API error');
        }
        
        setData(result.data);
        options.onSuccess?.(result.data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        if (options.onError) {
          options.onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [role, endpoint, options, toast]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the apiSlice to fetch data from the backend
      const response = await fetch(`http://localhost:5001/api/${role}/${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }
      
      setData(result.data);
      options.onSuccess?.(result.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
}

// Additional hooks for specific data needs
export function useHistoricalData(role: string) {
  return useDashboardData(role, 'getHistoricalData');
}

export function useComplianceData() {
  return useDashboardData('regulator', 'getComplianceData');
}
