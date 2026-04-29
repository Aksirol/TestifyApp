import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import Header from '../components/Header';
import { ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';
// ДОДАНО: Імпорти для графіків
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface Attempt {
    id: string;
    score: number;
    max_score: number;
    finished_at: string;
    guest_first_name: string | null;
    guest_last_name: string | null;
    user_first_name: string | null;
    user_last_name: string | null;
}

interface TestStatsData {
    test_title: string;
    attempts: Attempt[];
}

type SortKey = 'name' | 'score' | 'percentage' | 'finished_at';
type SortDirection = 'asc' | 'desc';

export default function TestStats() {
    const { testId } = useParams();

    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'finished_at',
        direction: 'desc'
    });

    const { data, isLoading, isError } = useQuery<TestStatsData>({
        queryKey: ['testStats', testId],
        queryFn: async () => {
            const res = await apiClient.get(`/tests/${testId}/stats`);
            return res.data;
        }
    });

    // Логіка сортування для ТАБЛИЦІ
    const sortedAttempts = useMemo(() => {
        if (!data?.attempts) return [];

        const items = [...data.attempts];
        items.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortConfig.key) {
                case 'name':
                    aValue = `${a.user_first_name || a.guest_first_name || ''} ${a.user_last_name || a.guest_last_name || ''}`.trim().toLowerCase();
                    bValue = `${b.user_first_name || b.guest_first_name || ''} ${b.user_last_name || b.guest_last_name || ''}`.trim().toLowerCase();
                    break;
                case 'percentage':
                    aValue = a.max_score > 0 ? (a.score / a.max_score) : 0;
                    bValue = b.max_score > 0 ? (b.score / b.max_score) : 0;
                    break;
                case 'score':
                    aValue = a.score;
                    bValue = b.score;
                    break;
                case 'finished_at':
                    aValue = new Date(a.finished_at).getTime();
                    bValue = new Date(b.finished_at).getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return items;
    }, [data?.attempts, sortConfig]);

    // ДОДАНО: Підготовка даних спеціально для ГРАФІКА (завжди хронологічно)
    const chartData = useMemo(() => {
        if (!data?.attempts) return [];

        // Для графіка краще показувати від найстарішого до найновішого
        const chronologicallySorted = [...data.attempts].sort((a, b) =>
            new Date(a.finished_at).getTime() - new Date(b.finished_at).getTime()
        );

        return chronologicallySorted.map((attempt, index) => {
            const firstName = attempt.user_first_name || attempt.guest_first_name || 'Анонім';
            const percentage = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;

            return {
                name: `${firstName} (#${index + 1})`, // Коротке ім'я для підпису осі X
                percentage: percentage,
                score: attempt.score,
                max: attempt.max_score,
                fullName: `${firstName} ${attempt.user_last_name || attempt.guest_last_name || ''}`.trim()
            };
        });
    }, [data?.attempts]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    };

    // ДОДАНО: Кастомний тултип для красивого відображення при наведенні на графік
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[#1e1e1e] border border-[#333] p-3 rounded-lg shadow-xl">
                    <p className="text-white font-medium mb-1">{data.fullName}</p>
                    <p className="text-gray-400 text-sm">
                        Оцінка: <span className="text-white">{data.score} з {data.max}</span>
                    </p>
                    <p className="text-sm mt-1">
                        Результат: <span className={data.percentage >= 50 ? 'text-brand-green' : 'text-red-400 font-medium'}>
                            {data.percentage}%
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) return <><Header /><div className="text-center mt-20 text-gray-400">Завантаження статистики...</div></>;
    if (isError || !data) return <><Header /><div className="text-center mt-20 text-red-400">Помилка доступу. Можливо, це не ваш тест.</div></>;

    return (
        <>
            <Header />
            <div className="pb-12">
                <div className="mb-8">
                    <Link to="/tests/my" className="text-sm text-brand-green hover:underline flex items-center gap-1 mb-2">
                        <ArrowLeft size={14} /> Назад до моїх тестів
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-2">
                        Статистика: <span className="text-gray-400 font-normal">{data.test_title}</span>
                    </h1>
                </div>

                {/* ДОДАНО: Секція з графіком */}
                {data.attempts.length > 0 && (
                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6 mb-8 shadow-xl">
                        <h2 className="text-base font-medium text-gray-300 mb-6 uppercase tracking-wider">Динаміка успішності (%)</h2>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#555"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#333' }}
                                    />
                                    <YAxis
                                        stroke="#555"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                        tickLine={false}
                                        axisLine={{ stroke: '#333' }}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#252525' }} />
                                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.percentage >= 50 ? '#10b981' : '#f87171'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Секція з таблицею */}
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
                    {data.attempts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Цей тест ще ніхто не проходив.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                {/* ... таблиця залишилася без змін з минулого кроку ... */}
                                <thead>
                                <tr className="bg-[#151515] border-b border-[#2a2a2a]">
                                    <th className="p-4">
                                        <button
                                            onClick={() => requestSort('name')}
                                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            Учасник {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="p-4">
                                        <button
                                            onClick={() => requestSort('score')}
                                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            Оцінка {getSortIcon('score')}
                                        </button>
                                    </th>
                                    <th className="p-4">
                                        <button
                                            onClick={() => requestSort('percentage')}
                                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            Результат {getSortIcon('percentage')}
                                        </button>
                                    </th>
                                    <th className="p-4">
                                        <button
                                            onClick={() => requestSort('finished_at')}
                                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            Дата {getSortIcon('finished_at')}
                                        </button>
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedAttempts.map((attempt) => {
                                    const firstName = attempt.user_first_name || attempt.guest_first_name || 'Анонім';
                                    const lastName = attempt.user_last_name || attempt.guest_last_name || '';
                                    const fullName = `${firstName} ${lastName}`.trim();
                                    const isGuest = !attempt.user_first_name;

                                    const percentage = attempt.max_score > 0
                                        ? Math.round((attempt.score / attempt.max_score) * 100)
                                        : 0;

                                    return (
                                        <tr key={attempt.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors">
                                            <td className="p-4">
                                                <div className="text-white font-medium">{fullName}</div>
                                                {isGuest && <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-tighter">Гість</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-white font-medium">{attempt.score}</span>
                                                <span className="text-gray-500 text-sm"> / {attempt.max_score}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                        <span className={`min-w-[40px] ${percentage >= 50 ? 'text-brand-green' : 'text-red-400'}`}>
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
                                                {new Date(attempt.finished_at).toLocaleString('uk-UA', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
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