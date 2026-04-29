import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface Option {
    id: string;
    content: string;
    position: number;
}

interface Question {
    id: string;
    content: string;
    position: number;
    options: Option[];
}

export default function TakeTest() {
    const { testId } = useParams();
    const navigate = useNavigate();

    // Перевірка авторизації та стан гостя
    const isLoggedIn = !!localStorage.getItem('token');
    const [guestInfo, setGuestInfo] = useState({ firstName: '', lastName: '' });

    // Основні стани тесту
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Стани для назви та таймера, отримані з бекенду
    const [testTitle, setTestTitle] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Мутація початку тесту
    const createAttemptMutation = useMutation({
        mutationFn: async (data: { test_id: string, guest_first_name?: string, guest_last_name?: string }) => {
            const res = await apiClient.post('/attempts', data);
            return res.data;
        },
        onSuccess: (data) => {
            setAttemptId(data.attempt.id);
            setQuestions(data.questions);
            if (data.test_title) setTestTitle(data.test_title);
            if (data.time_limit_sec) setTimeLeft(data.time_limit_sec);
        }
    });

    // Мутація завершення тесту
    const submitTestMutation = useMutation({
        mutationFn: async () => {
            const formattedAnswers = Object.entries(answers).map(([question_id, option_id]) => ({
                question_id,
                option_id
            }));

            const res = await apiClient.put(`/attempts/${attemptId}/submit`, { answers: formattedAnswers });
            return res.data;
        },
        onSuccess: () => {
            navigate(`/results/${attemptId}`);
        }
    });

    // Окремий чистий useEffect для роботи таймера
    useEffect(() => {
        // Якщо таймера немає, або час вийшов, або спроба не створена — нічого не робимо
        if (timeLeft === null || timeLeft <= 0 || !attemptId) return;

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timerId);
                    // Якщо час вийшов - автоматично завершуємо тест
                    if (!submitTestMutation.isPending) {
                        submitTestMutation.mutate();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, attemptId, submitTestMutation]);

    // Запуск гостем
    const handleGuestStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestInfo.firstName.trim() || !guestInfo.lastName.trim()) {
            alert("Будь ласка, введіть ім'я та прізвище");
            return;
        }
        createAttemptMutation.mutate({
            test_id: testId as string,
            guest_first_name: guestInfo.firstName,
            guest_last_name: guestInfo.lastName
        });
    };

    // Запуск авторизованим користувачем
    const handleUserStart = () => {
        createAttemptMutation.mutate({ test_id: testId as string });
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) setCurrentStep(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = () => {
        if (window.confirm('Ви впевнені, що хочете завершити тест?')) {
            submitTestMutation.mutate();
        }
    };

    // ЕКРАН 1: До початку тесту (спроба ще не створена)
    if (!attemptId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                {isLoggedIn ? (
                    // Форма для авторизованого
                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-8 rounded-xl max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Готові розпочати?</h2>
                        <p className="text-gray-400 mb-8">Час піде відразу після натискання кнопки.</p>
                        <button
                            onClick={handleUserStart}
                            disabled={createAttemptMutation.isPending}
                            className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            {createAttemptMutation.isPending ? 'Завантаження...' : 'Почати тест'}
                        </button>
                    </div>
                ) : (
                    // Форма для гостя
                    <form onSubmit={handleGuestStart} className="bg-[#1e1e1e] border border-[#2a2a2a] p-8 rounded-xl max-w-md w-full">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Представтеся</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Ваше ім'я</label>
                                <input
                                    type="text"
                                    required
                                    value={guestInfo.firstName}
                                    onChange={e => setGuestInfo({...guestInfo, firstName: e.target.value})}
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-brand-green outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Ваше прізвище</label>
                                <input
                                    type="text"
                                    required
                                    value={guestInfo.lastName}
                                    onChange={e => setGuestInfo({...guestInfo, lastName: e.target.value})}
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-brand-green outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={createAttemptMutation.isPending}
                                className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-medium py-3 rounded-lg transition-colors mt-4"
                            >
                                {createAttemptMutation.isPending ? 'Завантаження...' : 'Розпочати тест'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    }

    // ЕКРАН 2: Тест порожній
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-8 rounded-xl max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Упс, цей тест порожній 🪹</h2>
                    <p className="text-gray-400 mb-8">Автор ще не додав жодного запитання до цього тесту.</p>
                    <Link
                        to="/tests"
                        className="w-full inline-block bg-brand-green hover:bg-brand-green-hover text-white font-medium py-3 rounded-lg transition-colors"
                    >
                        Повернутися до списку
                    </Link>
                </div>
            </div>
        );
    }

    // ЕКРАН 3: Проходження тесту
    const currentQuestion = questions[currentStep];
    const progressPercentage = ((currentStep + 1) / questions.length) * 100;
    const isLastQuestion = currentStep === questions.length - 1;
    const isTimeRunningOut = timeLeft !== null && timeLeft <= 60;

    return (
        <div className="max-w-3xl mx-auto py-6 px-4">
            <div className="flex items-center justify-between mb-8">
                <Link to="/tests" className="text-xl font-bold text-white hover:opacity-80 transition-opacity block">
                    навч<span className="text-brand-green">тести</span>
                </Link>

                {timeLeft !== null && (
                    <div className={`font-bold px-4 py-1.5 rounded-full text-sm transition-colors shadow-sm ${
                        isTimeRunningOut
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                            : 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/50'
                    }`}>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6 md:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-2">
                    <h1 className="text-xl text-white font-medium">{testTitle || 'Проходження тесту'}</h1>
                    <span className="text-sm text-gray-400">
                        Запитання {currentStep + 1} з {questions.length}
                    </span>
                </div>

                <div className="w-full bg-[#2a2a2a] h-1.5 rounded-full mb-8 overflow-hidden">
                    <div
                        className="bg-brand-green h-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                <div className="mb-8">
                    <h2 className="text-lg text-white mb-6 leading-relaxed">
                        {currentQuestion?.content}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion?.options.map((option) => {
                            const isSelected = answers[currentQuestion.id] === option.id;

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-4 ${
                                        isSelected
                                            ? 'border-brand-green bg-brand-green/10'
                                            : 'border-[#333] hover:border-gray-500 bg-transparent'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'border-brand-green bg-brand-green' : 'border-gray-500'
                                    }`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>

                                    <span className={`text-base ${isSelected ? 'text-brand-green font-medium' : 'text-gray-300'}`}>
                                        {option.content}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-10 gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="px-4 sm:px-6 py-2 border border-[#333] text-gray-300 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                        &larr; Назад
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitTestMutation.isPending}
                            className="bg-brand-green hover:bg-brand-green-hover text-white px-6 sm:px-8 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                        >
                            {submitTestMutation.isPending ? 'Обробка...' : 'Завершити тест'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-brand-green hover:bg-brand-green-hover text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                        >
                            Наступне &rarr;
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}