import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Check, X } from 'lucide-react'; // Іконки для правильних/неправильних відповідей

interface ResultQuestion {
    id: string;
    content: string;
    is_correct: boolean;
    user_answer: string;
    correct_answer: string;
}

interface AttemptResult {
    score: number;
    max_score: number;
    test_title: string;
    questions: ResultQuestion[];
}

export default function Results() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('token');

    const { data, isLoading, isError } = useQuery<AttemptResult>({
        queryKey: ['attemptResult', attemptId],
        queryFn: async () => {
            const res = await apiClient.get(`/attempts/${attemptId}`);
            return res.data;
        }
    });

    if (isLoading) return <div className="text-center mt-20 text-gray-400">Завантаження результатів...</div>;
    if (isError || !data) return <div className="text-center mt-20 text-red-400">Помилка завантаження результатів</div>;

    // Рахуємо відсоток успішності
    const percentage = data.max_score > 0 ? Math.round((data.score / data.max_score) * 100) : 0;

    return (
        <div className="max-w-3xl mx-auto py-10">
            {/* Шапка */}
            <div className="mb-10 text-white">
                <div className="text-xl font-bold mb-8 cursor-pointer" onClick={() => navigate('/tests')}>
                    навч<span className="text-brand-green">тести</span>
                </div>
            </div>

            {/* Головний блок з оцінкою */}
            <div className="text-center mb-12">
                <h1 className="text-7xl font-light text-brand-green mb-4">
                    {data.score}<span className="text-gray-500 text-5xl">/{data.max_score}</span>
                </h1>
                <p className="text-gray-400 text-lg">
                    {data.test_title} <span className="mx-2">•</span> {percentage}%
                </p>
            </div>

            {/* Список відповідей */}
            <div className="space-y-4 mb-10">
                {data.questions.map((q) => (
                    <div
                        key={q.id}
                        className={`p-5 rounded-xl border ${
                            q.is_correct
                                ? 'bg-[#d1fae5] border-[#a7f3d0] text-[#065f46]' // Світло-зелений (як на макеті)
                                : 'bg-[#fee2e2] border-[#fecaca] text-[#991b1b]' // Світло-червоний (як на макеті)
                        }`}
                    >
                        <div className="flex gap-3">
                            <div className="mt-1 flex-shrink-0">
                                {q.is_correct ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                            </div>
                            <div className="w-full">
                                <p className={`font-medium mb-2 ${q.is_correct ? 'text-[#065f46]' : 'text-[#991b1b]/80'}`}>
                                    {q.content}
                                </p>

                                {q.is_correct ? (
                                    <p className="text-sm">{q.user_answer}</p>
                                ) : (
                                    <p className="text-sm font-medium">
                                        Ваша відповідь: <span className="font-normal">{q.user_answer}</span>.
                                        Правильна: <span className="font-normal">{q.correct_answer}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Кнопка на головну */}
            <div className="flex justify-center">
                <button
                    onClick={() => window.location.href = isLoggedIn ? '/tests' : '/login'}
                    className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2 rounded-lg font-medium"
                >
                    {isLoggedIn ? 'Повернутися на головну' : 'Завершити та вийти'}
                </button>
            </div>
        </div>
    );
}