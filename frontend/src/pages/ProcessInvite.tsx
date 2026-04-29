import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Header from '../components/Header';

export default function ProcessInvite() {
    const { inviteCode } = useParams(); // Дістаємо код із URL
    const navigate = useNavigate();

    useEffect(() => {
        const verifyInvite = async () => {
            try {
                // Відправляємо код на бекенд для перевірки.
                // Якщо в тебе маршрут відрізняється, можливо тут треба '/invites/' замість '/invite/'
                const res = await apiClient.get(`/invite/${inviteCode}`);

                // Бекенд має повернути дані тесту. Шукаємо його ID.
                const testId = res.data?.test_id || res.data?.id || res.data?.test?.id;

                if (testId) {
                    // Якщо все супер — перекидаємо на сторінку проходження тесту
                    navigate(`/attempt/${testId}`);
                } else {
                    throw new Error('Не вдалося отримати ID тесту з відповіді сервера');
                }
            } catch (error) {
                console.error("Помилка доступу:", error);
                alert("Це посилання недійсне, прострочене, або тест було видалено.");
                navigate('/tests'); // У разі помилки повертаємо на список тестів
            }
        };

        if (inviteCode) {
            verifyInvite();
        }
    }, [inviteCode, navigate]);

    return (
        <>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-medium text-white mb-2">Перевірка посилання...</h2>
                <p className="text-gray-400">Шукаємо потрібний тест, зачекайте хвилинку</p>
            </div>
        </>
    );
}