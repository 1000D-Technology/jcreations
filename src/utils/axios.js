import axios from 'axios';
import useAuthStore from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors and connection issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Handle unauthorized access - log the user out
      useAuthStore.getState().logout();
      window.location.href = '/adminlogin';
      return Promise.reject(error);
    }

    // Handle database connection errors more gracefully
    if (error.response?.status === 503 || 
        error.response?.data?.message?.includes('max_connections_per_hour') ||
        error.response?.data?.message?.includes('Authentication to') ||
        error.code === 'ECONNREFUSED') {
      
      // Enhance error message for better user experience
      const enhancedError = {
        ...error,
        isConnectionError: true,
        userMessage: 'Server is temporarily busy due to high traffic. Please try again in a few moments.'
      };
      
      console.warn('Database connection limit reached:', error.response?.data?.message || error.message);
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  }
);

export default api;