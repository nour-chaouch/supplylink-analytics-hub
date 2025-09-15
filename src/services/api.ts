import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      // Use window.location.replace to avoid adding to history
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Login user
  login: (credentials: { email: string; password: string }) =>
    api.post('/users/signin', credentials),

  // Register user
  register: (userData: { name: string; email: string; password: string; role: string }) =>
    api.post('/users/signup', userData),

  // Get user profile
  getProfile: () =>
    api.get('/users/profile'),

  // Update user profile
  updateProfile: (userData: any) =>
    api.put('/users/profile', userData),

  // Refresh token
  refreshToken: (refreshToken: string) =>
    api.post('/users/refresh', { refreshToken }),

  // Verify token
  verifyToken: () =>
    api.get('/users/verify'),
};

// Admin API
export const adminAPI = {
  // Get admin stats
  getStats: () =>
    api.get('/admin/stats'),

  // Get all users
  getUsers: (params = {}) =>
    api.get('/admin/users', { params }),

  // Get user by ID
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),

  // Update user
  updateUser: (id: string, userData: any) =>
    api.put(`/admin/users/${id}`, userData),

  // Delete user
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
};

// Agricultural Data API
export const agriculturalAPI = {
  // Get producer prices
  getProducerPrices: (params = {}) => 
    api.get('/agricultural/producer-prices', { params }),

  // Get crops and livestock data
  getCropsLivestock: (params = {}) => 
    api.get('/agricultural/crops-livestock', { params }),

  // Search across both datasets
  search: (params = {}) => 
    api.get('/agricultural/search', { params }),

  // Get analytics data
  getAnalytics: (params = {}) => 
    api.get('/agricultural/analytics', { params }),

  // Get filter options
  getFilters: () => 
    api.get('/agricultural/filters'),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;









