import { Request, Response } from 'express';
import db from '../db/knex';

export const getTestInfoByInviteCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        // 1. Шукаємо тест за унікальним кодом
        const test = await db('tests')
            .where({ invite_code: code })
            // Вибираємо лише безпечні поля (без id автора, налаштувань відповідей тощо)
            .select('id', 'title', 'description', 'time_limit_sec')
            .first();

        // Якщо тест не знайдено, повертаємо помилку 404 (Not Found)
        if (!test) {
            return res.status(404).json({ message: 'Тест за цим посиланням не знайдено або він був видалений' });
        }

        // 2. Рахуємо кількість запитань у цьому тесті для відображення на UI
        const questionsCountResult = await db('questions')
            .where({ test_id: test.id })
            .count('id as count')
            .first();

        // Оскільки count може повернути рядок, безпечно перетворюємо його на число
        const questionsCount = questionsCountResult ? Number(questionsCountResult.count) : 0;

        // 3. Відправляємо дані на фронтенд
        res.json({
            ...test,
            questions_count: questionsCount
        });

    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні інформації про тест', error });
    }
};