import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const baseURL = isLocalhost 
    ? 'http://localhost:5000' 
    : (import.meta.env.VITE_API_URL || 'https://food-management-production.up.railway.app');

const api = axios.create({
    baseURL,
});

// Add a request interceptor
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

// Add a response interceptor to handle 401/403 errors globally on protected routes
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = error.config?.url?.includes('/api/auth/');
        
        // Only trigger global auth redirect for non-auth protected routes
        if (!isAuthRoute && error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Clear invalid token from storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Force reload to login if on protected page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
