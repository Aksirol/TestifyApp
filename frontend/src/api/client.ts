import axios from 'axios';

export const apiClient = axios.create({
    // Замість 'http://localhost:5000/api' тепер просто '/api'
    // Браузер автоматично підставить поточний домен (http://localhost/api)
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);