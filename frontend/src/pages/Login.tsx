import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/auth/login', formData);

            // Зберігаємо токен і дані користувача у локальне сховище браузера
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Перекидаємо на головну сторінку зі списком тестів
            navigate('/tests');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Невірний email або пароль');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#2a2a2a]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        навч<span className="text-[#2b8a5d]">тести</span>
                    </h1>
                    <p className="text-gray-400">Увійдіть до свого акаунту</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#2b8a5d] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Пароль</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#2b8a5d] transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#2b8a5d] hover:bg-[#226f4a] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-6"
                    >
                        {isLoading ? 'Вхід...' : 'Увійти'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Ще не зареєстровані?{' '}
                    <Link to="/register" className="text-[#2b8a5d] hover:text-[#3ad18a] transition-colors">
                        Створити акаунт
                    </Link>
                </p>
            </div>
        </div>
    );
}