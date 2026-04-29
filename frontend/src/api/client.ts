import axios from 'axios';

export const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Додаємо токен до кожного запиту
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ДОДАНО: Глобальний перехоплювач помилок сервера
apiClient.interceptors.response.use(
    (response) => response, // Якщо все добре - просто повертаємо відповідь
    (error) => {
        // Якщо сервер каже, що ми не авторизовані
        if (error.response?.status === 401) {
            localStorage.removeItem('token'); // Очищаємо зламаний/прострочений токен
            window.location.href = '/login'; // Миттєвий редирект
        }
        return Promise.reject(error);
    }
);