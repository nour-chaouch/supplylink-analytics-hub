
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/backend/api';

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
        // Dynamically access the API endpoint based on role and endpoint name
        if (!api[role as keyof typeof api]) {
          throw new Error(`No API endpoints available for role: ${role}`);
        }
        
        const apiFunction = api[role as keyof typeof api][endpoint as keyof typeof api[keyof typeof api]];
        
        if (!apiFunction) {
          throw new Error(`Endpoint "${endpoint}" not found for role: ${role}`);
        }
        
        const response = await apiFunction() as ApiResponse;
        
        if (response.success) {
          setData(response.data);
          if (options.onSuccess) {
            options.onSuccess(response.data);
          }
        } else {
          // Since error might not exist in the response, provide a default message
          const errorMessage = response.error || 'Failed to fetch data';
          throw new Error(errorMessage);
        }
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
      if (!api[role as keyof typeof api]) {
        throw new Error(`No API endpoints available for role: ${role}`);
      }
      
      const apiFunction = api[role as keyof typeof api][endpoint as keyof typeof api[keyof typeof api]];
      
      if (!apiFunction) {
        throw new Error(`Endpoint "${endpoint}" not found for role: ${role}`);
      }
      
      const response = await apiFunction() as ApiResponse;
      
      if (response.success) {
        setData(response.data);
        if (options.onSuccess) {
          options.onSuccess(response.data);
        }
      } else {
        // Ensure we handle the case where error might not be defined
        const errorMessage = response.error || 'Failed to fetch data';
        throw new Error(errorMessage);
      }
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
