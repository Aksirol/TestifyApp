import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
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
            // Відправляємо дані на наш бекенд
            await apiClient.post('/auth/register', formData);
            // Якщо успішно — перекидаємо на сторінку входу
            navigate('/login');
        } catch (err: any) {
            // Показуємо помилку з бекенду (наприклад, "Користувач вже існує")
            setError(err.response?.data?.message || 'Помилка при реєстрації');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-[#1e1e1e] p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#2a2a2a]">
                <h2 className="text-2xl font-bold text-center mb-6 text-white">Реєстрація</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Ім'я</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#2b8a5d] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Прізвище</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#2b8a5d] transition-colors"
                            />
                        </div>
                    </div>

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
                            minLength={6}
                            className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#2b8a5d] transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#2b8a5d] hover:bg-[#226f4a] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-6"
                    >
                        {isLoading ? 'Зачекайте...' : 'Створити акаунт'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Вже маєте акаунт?{' '}
                    <Link to="/login" className="text-[#2b8a5d] hover:text-[#3ad18a] transition-colors">
                        Увійти
                    </Link>
                </p>
            </div>
        </div>
    );
}