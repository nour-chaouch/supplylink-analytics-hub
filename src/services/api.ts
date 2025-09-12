import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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







