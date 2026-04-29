import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import Header from '../components/Header';

// Описуємо типи даних, щоб TypeScript нам допомагав
interface Test {
    id: string;
    title: string;
    is_public: boolean;
    time_limit_sec: number | null;
    questions_count: number;
    invite_code?: string;
    tags?: string[];
}

export default function Dashboard() {
    // Запит для "Мої тести"
    const { data: myTests, isLoading: isLoadingMy } = useQuery<Test[]>({
        queryKey: ['myTests'],
        queryFn: async () => {
            const res = await apiClient.get('/tests/my');
            return res.data;
        }
    });

    // Запит для "Публічні тести"
    const { data: publicTests, isLoading: isLoadingPublic } = useQuery<Test[]>({
        queryKey: ['publicTests'],
        queryFn: async () => {
            const res = await apiClient.get('/tests');
            return res.data;
        }
    });

    const isLoading = isLoadingMy || isLoadingPublic;

    // Функція копіювання інвайт-коду
    const copyInviteLink = (inviteCode?: string) => {
        if (!inviteCode) return;
        const link = `${window.location.origin}/invite/${inviteCode}`;
        navigator.clipboard.writeText(link);
        alert('Посилання скопійовано в буфер обміну!');
    };

    if (isLoading) return <div className="text-center mt-20 text-gray-400">Завантаження...</div>;

    return (
        <>
            <Header />

            <div className="space-y-10 pb-12">
                {/* Секція: МОЇ ТЕСТИ */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Мої тести</h2>
                    <div className="space-y-4">
                        {myTests?.length === 0 ? (
                            <p className="text-gray-500">У вас ще немає створених тестів.</p>
                        ) : (
                            myTests?.map((test) => (
                                <div key={test.id} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
                                    <h3 className="text-lg font-medium text-white mb-3">{test.title}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${test.is_public ? 'bg-brand-green/20 text-brand-green' : 'bg-gray-700 text-gray-300'}`}>
                                            {test.is_public ? 'Публічний' : 'Приватний'}
                                        </span>
                                        {test.time_limit_sec && <span>{Math.round(test.time_limit_sec / 60)} хв</span>}
                                    </div>

                                    {/* ДОДАНО: Відображення тегів для моїх тестів */}
                                    {test.tags && test.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {test.tags.map(tag => (
                                                <span key={tag} className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            to={`/tests/edit/${test.id}`}
                                            className="px-3 py-1.5 text-sm border border-[#333] rounded-md text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                                        >
                                            Редагувати
                                        </Link>
                                        <Link
                                            to={`/tests/${test.id}/stats`}
                                            className="px-3 py-1.5 text-sm border border-[#333] rounded-md text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                                        >
                                            Статистика
                                        </Link>
                                        {!test.is_public && test.invite_code && (
                                            <button
                                                onClick={() => copyInviteLink(test.invite_code)}
                                                className="px-3 py-1.5 text-sm border border-[#333] rounded-md text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                                            >
                                                Копіювати посилання
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Секція: ПУБЛІЧНІ ТЕСТИ ІНШИХ КОРИСТУВАЧІВ */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Публічні тести інших користувачів</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {publicTests?.length === 0 ? (
                            <p className="text-gray-500">Поки що немає публічних тестів.</p>
                        ) : (
                            publicTests?.map((test) => (
                                <div key={test.id} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
                                    <h3 className="text-lg font-medium text-white mb-2">{test.title}</h3>

                                    {/* ДОДАНО: Відображення тегів для публічних тестів */}
                                    {test.tags && test.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {test.tags.map(tag => (
                                                <span key={tag} className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-400 mb-5">
                                        {test.questions_count} запитань
                                    </p>
                                    <Link
                                        to={`/attempt/${test.id}`}
                                        className="inline-block bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                                    >
                                        Пройти
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}