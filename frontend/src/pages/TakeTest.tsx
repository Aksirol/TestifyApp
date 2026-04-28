import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // НОВЕ: Стан для таймера (в секундах)
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const startTestMutation = useMutation({
        mutationFn: async () => {
            // Щоб отримати time_limit_sec, нам потрібно зробити додатковий запит за інформацією про тест
            // (оскільки наш бекенд /attempts його не повертає)
            const testInfoRes = await apiClient.get(`/tests`);
            const currentTest = testInfoRes.data.find((t: any) => t.id === testId);

            const res = await apiClient.post('/attempts', { test_id: testId });

            return {
                attemptData: res.data,
                timeLimit: currentTest?.time_limit_sec || null
            };
        },
        onSuccess: (data) => {
            setAttemptId(data.attemptData.attempt.id);
            setQuestions(data.attemptData.questions);

            // НОВЕ: Встановлюємо початковий час, якщо в тесті є ліміт
            if (data.timeLimit) {
                setTimeLeft(data.timeLimit);
            }
        }
    });

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

    // НОВЕ: Ефект таймера
    useEffect(() => {
        // Якщо таймер не встановлено, або час вийшов, або тест ще не почався — нічого не робимо
        if (timeLeft === null || timeLeft <= 0 || !attemptId) return;

        // Запускаємо інтервал, який щосекунди віднімає 1
        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev !== null && prev <= 1) {
                    // ЧАС ВИЙШОВ! Очищаємо інтервал і автоматично відправляємо тест
                    clearInterval(timerId);
                    submitTestMutation.mutate();
                    return 0;
                }
                return prev !== null ? prev - 1 : null;
            });
        }, 1000);

        // Очищення інтервалу при видаленні компонента з екрану
        return () => clearInterval(timerId);
    }, [timeLeft, attemptId, submitTestMutation]);

    // НОВЕ: Функція для форматування секунд у вигляд ХХ:ХХ (наприклад, 09:32)
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

    if (!attemptId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-8 rounded-xl max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Готові розпочати?</h2>
                    <p className="text-gray-400 mb-8">Час піде відразу після натискання кнопки.</p>
                    <button
                        onClick={() => startTestMutation.mutate()}
                        disabled={startTestMutation.isPending}
                        className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-medium py-3 rounded-lg transition-colors"
                    >
                        {startTestMutation.isPending ? 'Завантаження...' : 'Почати тест'}
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentStep];
    const progressPercentage = ((currentStep + 1) / questions.length) * 100;
    const isLastQuestion = currentStep === questions.length - 1;

    // НОВЕ: Змінюємо колір таймера, якщо залишилося менше 1 хвилини (щоб попередити користувача)
    const isTimeRunningOut = timeLeft !== null && timeLeft <= 60;

    return (
        <div className="max-w-3xl mx-auto py-6">
            <div className="flex items-center justify-between mb-8">
                <div className="text-xl font-bold text-white">
                    навч<span className="text-brand-green">тести</span>
                </div>

                {/* НОВЕ: Динамічний рендер таймера */}
                {timeLeft !== null && (
                    <div className={`font-bold px-4 py-1.5 rounded-full text-sm transition-colors ${
                        isTimeRunningOut
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50' // Червоний, якщо < 1 хв
                            : 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/50' // Жовтий в іншому випадку
                    }`}>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-8 shadow-xl">
                <div className="flex justify-between items-end mb-4">
                    <h1 className="text-xl text-white font-medium">Проходження тесту</h1>
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

                <div className="flex justify-between items-center mt-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="px-6 py-2 border border-[#333] text-gray-300 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                        &larr; Назад
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitTestMutation.isPending}
                            className="bg-brand-green hover:bg-brand-green-hover text-white px-8 py-2 rounded-lg font-medium transition-colors"
                        >
                            {submitTestMutation.isPending ? 'Обробка...' : 'Завершити тест'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Наступне &rarr;
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}