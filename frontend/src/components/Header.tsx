import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className="flex items-center justify-between py-6 mb-8 border-b border-[#2a2a2a]">
            <Link to="/tests" className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">
                навч<span className="text-brand-green">тести</span>
            </Link>

            <div className="flex items-center gap-6">
                <nav className="flex gap-4 text-gray-300">
                    <Link to="/tests/my" className="hover:text-white transition-colors">Мої тести</Link>
                    <Link to="/tests" className="hover:text-white transition-colors">Публічні</Link>
                </nav>

                <div className="flex items-center gap-3">
                    <Link
                        to="/tests/create"
                        className="bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                        + Створити тест
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-white border border-[#333] px-3 py-2 rounded-md hover:border-gray-500 transition-colors"
                    >
                        Вийти
                    </button>
                </div>
            </div>
        </header>
    );
}