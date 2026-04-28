import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Trash2, Plus } from 'lucide-react';
import Header from '../components/Header';

// Описуємо структуру наших даних
interface OptionState {
    content: string;
    is_correct: boolean;
}

interface QuestionState {
    content: string;
    options: OptionState[];
}

export default function TestEditor() {
    const navigate = useNavigate();

    // 1. СТАН ТЕСТУ (Налаштування)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [showCorrect, setShowCorrect] = useState(false);

    // Для часу використовуємо допоміжний стан: чи ввімкнено обмеження, і скільки хвилин
    const [hasTimeLimit, setHasTimeLimit] = useState(false);
    const [timeMinutes, setTimeMinutes] = useState(10);

    // 2. СТАН ЗАПИТАНЬ (Динамічний масив)
    const [questions, setQuestions] = useState<QuestionState[]>([
        {
            content: '',
            options: [
                { content: '', is_correct: true }, // За замовчуванням один правильний
                { content: '', is_correct: false },
            ],
        },
    ]);

    // --- ЛОГІКА ДЛЯ ЗАПИТАНЬ ---
    const addQuestion = () => {
        setQuestions([
            ...questions,
            { content: '', options: [{ content: '', is_correct: true }, { content: '', is_correct: false }] },
        ]);
    };

    const removeQuestion = (qIndex: number) => {
        setQuestions(questions.filter((_, i) => i !== qIndex));
    };

    const updateQuestionContent = (qIndex: number, content: string) => {
        const newQs = [...questions];
        newQs[qIndex].content = content;
        setQuestions(newQs);
    };

    // --- ЛОГІКА ДЛЯ ВАРІАНТІВ ---
    const addOption = (qIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].options.push({ content: '', is_correct: false });
        setQuestions(newQs);
    };

    const updateOptionContent = (qIndex: number, oIndex: number, content: string) => {
        const newQs = [...questions];
        newQs[qIndex].options[oIndex].content = content;
        setQuestions(newQs);
    };

    const setCorrectOption = (qIndex: number, correctOIndex: number) => {
        const newQs = [...questions];
        // Робимо всі варіанти в цьому запитанні неправильними...
        newQs[qIndex].options.forEach((opt, idx) => {
            opt.is_correct = idx === correctOIndex; // ...крім того, який обрав користувач
        });
        setQuestions(newQs);
    };

    // --- ВІДПРАВКА НА СЕРВЕР ---
    const createTestMutation = useMutation({
        mutationFn: async (testData: any) => {
            const res = await apiClient.post('/tests', testData);
            return res.data;
        },
        onSuccess: () => {
            // Якщо успішно зберегли, повертаємось на головну
            navigate('/tests');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Формуємо фінальний об'єкт для нашого бекенду
        const finalData = {
            title,
            description,
            is_public: isPublic,
            show_correct: showCorrect,
            // Переводимо хвилини в секунди, якщо обмеження ввімкнено
            time_limit_sec: hasTimeLimit ? timeMinutes * 60 : null,
            questions,
        };

        createTestMutation.mutate(finalData);
    };

    return (
        <>
            <Header />
            <div className="pb-20">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Новий тест</h1>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/tests')}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-[#333] rounded-lg"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={createTestMutation.isPending}
                            className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {createTestMutation.isPending ? 'Збереження...' : 'Зберегти тест'}
                        </button>
                    </div>
                </div>

                {createTestMutation.isError && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
                        Помилка при збереженні тесту. Перевірте всі поля.
                    </div>
                )}

                <div className="space-y-8">
                    {/* БЛОК 1: ОСНОВНА ІНФОРМАЦІЯ */}
                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Назва тесту</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Наприклад, Контрольна з алгоритмів"
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-green"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Опис (необов'язково)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Коротко опишіть тему..."
                                    rows={2}
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-green resize-none"
                                />
                            </div>
                        </div>

                        <hr className="border-[#2a2a2a] my-6" />

                        {/* НАЛАШТУВАННЯ */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Налаштування</h3>

                            {/* Публічний доступ */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-medium">Публічний доступ</div>
                                    <div className="text-sm text-gray-400">Видно всім зареєстрованим</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                                </label>
                            </div>

                            {/* Обмеження часу */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-white font-medium">Обмеження часу</div>
                                        <div className="text-sm text-gray-400">Тест буде автоматично завершено</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={hasTimeLimit} onChange={() => setHasTimeLimit(!hasTimeLimit)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                                    </label>
                                </div>
                                {hasTimeLimit && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={timeMinutes}
                                            onChange={(e) => setTimeMinutes(Number(e.target.value))}
                                            className="w-20 bg-[#151515] border border-[#333] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand-green text-center"
                                        />
                                        <span className="text-gray-400">хвилин</span>
                                    </div>
                                )}
                            </div>

                            {/* Показувати правильну відповідь */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-medium">Показувати правильну відповідь</div>
                                    <div className="text-sm text-gray-400">Відразу після відповіді користувача</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={showCorrect} onChange={() => setShowCorrect(!showCorrect)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* БЛОК 2: РЕДАКТОР ЗАПИТАНЬ */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Запитання</h3>

                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6 relative group">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-400 text-sm font-medium">Запитання {qIndex + 1}</span>
                                    {questions.length > 1 && (
                                        <button
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 text-sm border border-transparent hover:border-red-400/30 px-2 py-1 rounded"
                                        >
                                            <Trash2 size={16} /> Видалити
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    value={q.content}
                                    onChange={(e) => updateQuestionContent(qIndex, e.target.value)}
                                    placeholder="Введіть запитання..."
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green mb-4 text-lg"
                                />

                                <div className="space-y-2">
                                    {q.options.map((opt, oIndex) => (
                                        <div
                                            key={oIndex}
                                            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                                                opt.is_correct ? 'border-brand-green bg-brand-green/10' : 'border-[#333] bg-[#151515]'
                                            }`}
                                        >
                                            {/* Радіокнопка для вибору правильної відповіді */}
                                            <button
                                                type="button"
                                                onClick={() => setCorrectOption(qIndex, oIndex)}
                                                className={`w-5 h-5 rounded-full flex-shrink-0 border flex items-center justify-center transition-colors ${
                                                    opt.is_correct ? 'border-brand-green bg-brand-green' : 'border-gray-500'
                                                }`}
                                            >
                                                {opt.is_correct && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </button>

                                            <input
                                                type="text"
                                                value={opt.content}
                                                onChange={(e) => updateOptionContent(qIndex, oIndex, e.target.value)}
                                                placeholder={`Варіант ${oIndex + 1}`}
                                                className="w-full bg-transparent text-white focus:outline-none"
                                            />

                                            {opt.is_correct && (
                                                <span className="text-brand-green text-sm pr-2 whitespace-nowrap flex items-center gap-1">
                          <Check size={16} /> правильна
                        </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => addOption(qIndex)}
                                    className="mt-4 text-sm text-gray-400 hover:text-white flex items-center gap-1 px-3 py-1.5 border border-[#333] rounded-md transition-colors"
                                >
                                    <Plus size={16} /> Додати варіант
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={addQuestion}
                            className="w-full py-4 border-2 border-dashed border-[#333] text-gray-400 rounded-xl hover:border-brand-green hover:text-brand-green transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus size={20} /> Додати нове запитання
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// Допоміжний компонент іконки (щоб не тягнути зайвого, якщо не встановлено lucide повністю)
function Check({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
}