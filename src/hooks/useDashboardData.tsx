
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/backend/api';

interface UseDataOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
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
        
        const response = await apiFunction();
        
        if (response.success) {
          setData(response.data);
          if (options.onSuccess) {
            options.onSuccess(response.data);
          }
        } else {
          throw new Error(response.error || 'Failed to fetch data');
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

  return { data, isLoading, error, refetch: () => {} };
}

// Additional hooks for specific data needs
export function useHistoricalData(role: string) {
  return useDashboardData(role, 'getHistoricalData');
}

export function useComplianceData() {
  return useDashboardData('regulator', 'getComplianceData');
}
