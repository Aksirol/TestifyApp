import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import Header from '../components/Header';

export default function TestStats() {
    const { testId } = useParams();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['testStats', testId],
        queryFn: async () => {
            const res = await apiClient.get(`/tests/${testId}/stats`);
            return res.data;
        }
    });

    if (isLoading) return <><Header /><div className="text-center mt-20 text-gray-400">Завантаження статистики...</div></>;
    if (isError) return <><Header /><div className="text-center mt-20 text-red-400">Помилка доступу. Можливо, це не ваш тест.</div></>;

    return (
        <>
            <Header />
            <div className="pb-12">
                <div className="mb-8">
                    <Link to="/tests/my" className="text-sm text-brand-green hover:underline mb-2 inline-block">
                        &larr; Назад до моїх тестів
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-2">
                        Статистика: <span className="text-gray-400 font-normal">{data.test_title}</span>
                    </h1>
                </div>

                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden">
                    {data.attempts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Цей тест ще ніхто не проходив.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-[#151515] border-b border-[#2a2a2a]">
                                    <th className="p-4 text-sm font-medium text-gray-400">Учасник</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Оцінка</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Результат (%)</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Дата завершення</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.attempts.map((attempt: any) => {
                                    // Визначаємо ім'я (зареєстрований або гість)
                                    const firstName = attempt.user_first_name || attempt.guest_first_name || 'Анонім';
                                    const lastName = attempt.user_last_name || attempt.guest_last_name || '';
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    const isGuest = !attempt.user_first_name;

                                    // Рахуємо відсоток
                                    const percentage = attempt.max_score > 0
                                        ? Math.round((attempt.score / attempt.max_score) * 100)
                                        : 0;

                                    return (
                                        <tr key={attempt.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors">
                                            <td className="p-4">
                                                <div className="text-white font-medium">{fullName}</div>
                                                {isGuest && <div className="text-xs text-gray-500 mt-0.5">Гість</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-white font-medium">{attempt.score}</span>
                                                <span className="text-gray-500 text-sm"> / {attempt.max_score}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                            <span className={percentage >= 50 ? 'text-brand-green' : 'text-red-400'}>
                              {percentage}%
                            </span>
                                                    <div className="w-24 bg-[#2a2a2a] h-1.5 rounded-full overflow-hidden hidden sm:block">
                                                        <div
                                                            className={`h-full ${percentage >= 50 ? 'bg-brand-green' : 'bg-red-500'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {new Date(attempt.finished_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}