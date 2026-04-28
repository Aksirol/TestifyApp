import axios from 'axios';

// Створюємо базовий екземпляр axios
export const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Адреса нашого бекенду
    headers: {
        'Content-Type': 'application/json',
    },
});

// Додаємо "перехоплювач" (interceptor), який спрацьовує ПЕРЕД кожним запитом
apiClient.interceptors.request.use(
    (config) => {
        // Дістаємо токен з локального сховища браузера
        const token = localStorage.getItem('token');

        // Якщо токен є, додаємо його в заголовок Authorization
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);