import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, adminAPI, agriculturalAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const data = response.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      queryClient.setQueryData(['user'], data.data)
      toast.success('Login successful!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed')
    }
  })
}

export const useRegister = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: authAPI.register,
    onSuccess: (response) => {
      const data = response.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      queryClient.setQueryData(['user'], data.data)
      toast.success('Registration successful!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed')
    }
  })
}

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getProfile,
    enabled: !!localStorage.getItem('token'),
    retry: false
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Profile update failed')
    }
  })
}

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: authAPI.refreshToken,
    onSuccess: (response) => {
      const data = response.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
    },
    onError: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.replace('/login')
    }
  })
}

export const useVerifyToken = () => {
  return useQuery({
    queryKey: ['verify-token'],
    queryFn: authAPI.verifyToken,
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Admin hooks
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getStats,
    enabled: !!localStorage.getItem('token'),
    retry: false
  })
}

export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => adminAPI.getUsers(params),
    enabled: !!localStorage.getItem('token'),
    retry: false
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => adminAPI.getUser(id),
    enabled: !!id && !!localStorage.getItem('token'),
    retry: false
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: any }) => 
      adminAPI.updateUser(id, userData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      toast.success('User updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'User update failed')
    }
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'User deletion failed')
    }
  })
}

// Agricultural data hooks
export const useProducerPrices = (params = {}) => {
  return useQuery({
    queryKey: ['producer-prices', params],
    queryFn: () => agriculturalAPI.getProducerPrices(params),
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCropsLivestock = (params = {}) => {
  return useQuery({
    queryKey: ['crops-livestock', params],
    queryFn: () => agriculturalAPI.getCropsLivestock(params),
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useSearch = (params = {}) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => agriculturalAPI.search(params),
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => agriculturalAPI.getAnalytics(params),
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useFilters = () => {
  return useQuery({
    queryKey: ['filters'],
    queryFn: agriculturalAPI.getFilters,
    enabled: !!localStorage.getItem('token'),
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => import('@/services/api').then(api => api.healthCheck()),
    retry: 3,
    retryDelay: 1000,
    staleTime: 30 * 1000, // 30 seconds
  })
}
