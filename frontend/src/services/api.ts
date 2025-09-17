import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5001/api' 
  : '/api';

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

  // Create user
  createUser: (userData: any) =>
    api.post('/admin/users', userData),

  // Elasticsearch Admin API
  getElasticsearchHealth: () =>
    api.get('/admin/elasticsearch/health'),

  getElasticsearchIndices: () =>
    api.get('/admin/elasticsearch/indices'),

  createElasticsearchIndex: (indexName: string, mapping?: any) =>
    api.post('/admin/elasticsearch/indices', { indexName, mapping }),

  createPredefinedIndices: () =>
    api.post('/admin/elasticsearch/indices/predefined'),

  deleteElasticsearchIndex: (indexName: string) =>
    api.delete(`/admin/elasticsearch/indices/${indexName}`),

  importElasticsearchData: (indexName: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/elasticsearch/indices/${indexName}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  importElasticsearchDataWithProgress: async (indexName: string, file: File, bulkSize?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (bulkSize) {
      formData.append('bulkSize', bulkSize.toString());
    }
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    console.log('Using token for SSE:', token ? 'Token found' : 'No token');
    
    // Use fetch for Server-Sent Events instead of axios
    const response = await fetch(`/api/admin/elasticsearch/indices/${indexName}/import-with-progress`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    console.log('SSE Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SSE Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return response;
  },

  getElasticsearchMappings: (indexName: string) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/mapping`),

  getElasticsearchStats: (indexName?: string) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/stats`),

  // New methods for the wizard
  getSupportedFormats: () =>
    api.get('/admin/elasticsearch/supported-formats'),

  getIndexCompatibility: (indexName: string) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/schema`),

  // Data Management API
  getDocuments: (indexName: string, params?: {
    page?: number;
    size?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    fields?: string;
  }) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/documents`, { params }),

  getDocument: (indexName: string, documentId: string) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/documents/${documentId}`),

  createDocument: (indexName: string, document: any, documentId?: string) =>
    api.post(`/admin/elasticsearch/indices/${indexName}/documents`, {
      document,
      documentId
    }),

  updateDocument: (indexName: string, documentId: string, document: any) =>
    api.put(`/admin/elasticsearch/indices/${indexName}/documents/${documentId}`, {
      document
    }),

  deleteDocument: (indexName: string, documentId: string) =>
    api.delete(`/admin/elasticsearch/indices/${indexName}/documents/${documentId}`),

  bulkDocumentOperations: (indexName: string, operations: Array<{
    action: 'index' | 'create' | 'delete';
    document?: any;
    documentId: string;
  }>) =>
    api.post(`/admin/elasticsearch/indices/${indexName}/documents/bulk`, {
      operations
    }),

  getSortFields: (indexName: string) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/sort-fields`),

  getIndexSchema: (indexName: string) =>
    api.get(`/admin/elasticsearch/indices/${indexName}/schema`),
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
