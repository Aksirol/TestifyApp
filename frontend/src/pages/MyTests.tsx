import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import Header from '../components/Header';
// ДОДАНО: Імпортуємо іконку Edit
import { Trash2, BarChart2, Link as LinkIcon, Edit } from 'lucide-react';

// ДОДАНО: Інтерфейс Test
interface Test {
    id: string;
    title: string;
    is_public: boolean;
    created_at: string;
    invite_code?: string;
    tags?: string[];
}

export default function MyTests() {
    const queryClient = useQueryClient();

    // ДОДАНО: Типізація <Test[]>
    const { data: myTests, isLoading } = useQuery<Test[]>({
        queryKey: ['myTests'],
        queryFn: async () => {
            const res = await apiClient.get('/tests/my');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/tests/${id}`);
        },
        onSuccess: () => {
            // Оновлюємо список тестів після видалення
            queryClient.invalidateQueries({ queryKey: ['myTests'] });
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Ви впевнені, що хочете видалити цей тест? Це назавжди видалить усі його запитання та результати.')) {
            deleteMutation.mutate(id);
        }
    };

    const copyInviteLink = (inviteCode?: string) => {
        if (!inviteCode) return;
        const link = `${window.location.origin}/invite/${inviteCode}`;
        navigator.clipboard.writeText(link);
        alert('Посилання скопійовано в буфер обміну!');
    };

    return (
        <>
            <Header />
            <div className="pb-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="tex t-2xl font-bold text-white">Мої тести</h1>
                    <Link
                        to="/tests/create"
                        className="bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        + Створити тест
                    </Link>
                </div>

                {isLoading ? (
                    <div className="text-center text-gray-400">Завантаження...</div>
                ) : myTests?.length === 0 ? (
                    <div className="text-center text-gray-500 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-10">
                        У вас ще немає створених тестів.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {/* ДОДАНО: Прибрали : any */}
                        {myTests?.map((test) => (
                            <div key={test.id} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6 flex flex-col md:flex-row justify-between gap-4 transition-colors hover:border-[#3a3a3a]">
                                <div>
                                    <h3 className="text-xl font-medium text-white mb-2">{test.title}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${test.is_public ? 'bg-brand-green/20 text-brand-green' : 'bg-gray-700 text-gray-300'}`}>
                                          {test.is_public ? 'Публічний' : 'Приватний'}
                                        </span>
                                        <span>Створено: {new Date(test.created_at).toLocaleDateString()}</span>
                                    </div>

                                    {/* ДОДАНО: Відображення тегів */}
                                    {test.tags && test.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {test.tags.map(tag => (
                                                <span key={tag} className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {!test.is_public && test.invite_code && (
                                        <button
                                            onClick={() => copyInviteLink(test.invite_code as string)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#333] rounded-lg text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                                        >
                                            <LinkIcon size={16} /> Посилання
                                        </button>
                                    )}
                                    <Link
                                        to={`/tests/edit/${test.id}`}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#333] rounded-lg text-gray-300 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-400/10 transition-colors"
                                    >
                                        <Edit size={16} /> Редагувати
                                    </Link>
                                    <Link
                                        to={`/tests/${test.id}/stats`}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#333] rounded-lg text-gray-300 hover:text-brand-green hover:border-brand-green/50 hover:bg-brand-green/10 transition-colors"
                                    >
                                        <BarChart2 size={16} /> Статистика
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(test.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#333] rounded-lg text-gray-300 hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/10 transition-colors"
                                    >
                                        <Trash2 size={16} /> Видалити
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}