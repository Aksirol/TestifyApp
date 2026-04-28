import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import db from '../db/knex';
import { v4 as uuidv4 } from 'uuid';

export const createTest = async (req: AuthRequest, res: Response) => {
    // Використовуємо транзакцію, щоб зберегти все або нічого
    const trx = await db.transaction();

    try {
        const { title, description, is_public, time_limit_sec, show_correct, questions } = req.body;
        const creator_id = req.user?.id;

        // 1. Створюємо запис у таблиці TESTS
        // Якщо тест приватний, генеруємо унікальний invite_code
        const invite_code = is_public ? null : uuidv4();

        const [test] = await trx('tests').insert({
            creator_id,
            title,
            description,
            is_public,
            time_limit_sec,
            show_correct,
            invite_code
        }).returning('*');

        // 2. Якщо в запиті є запитання, зберігаємо їх
        if (questions && Array.isArray(questions)) {
            for (const [qIdx, q] of questions.entries()) {
                const [question] = await trx('questions').insert({
                    test_id: test.id,
                    content: q.content,
                    position: qIdx + 1
                }).returning('*');

                // 3. Зберігаємо варіанти відповідей для кожного запитання
                if (q.options && Array.isArray(q.options)) {
                    const optionsToInsert = q.options.map((opt: any, oIdx: number) => ({
                        question_id: question.id,
                        content: opt.content,
                        is_correct: opt.is_correct,
                        position: oIdx + 1
                    }));
                    await trx('options').insert(optionsToInsert);
                }
            }
        }

        await trx.commit();
        res.status(201).json(test);
    } catch (error) {
        await trx.rollback();
        res.status(500).json({ message: 'Помилка при створенні тесту', error });
    }
};

export const getPublicTests = async (req: AuthRequest, res: Response) => {
    try {
        // Отримуємо всі публічні тести інших користувачів
        const tests = await db('tests')
            .where({ is_public: true })
            .select('tests.*', db.raw('count(questions.id) as questions_count'))
            .leftJoin('questions', 'tests.id', 'questions.test_id')
            .groupBy('tests.id')
            .orderBy('created_at', 'desc');

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні тестів', error });
    }
};

export const getMyTests = async (req: AuthRequest, res: Response) => {
    try {
        const creator_id = req.user?.id;
        const tests = await db('tests')
            .where({ creator_id })
            .orderBy('created_at', 'desc');

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні власних тестів', error });
    }
};

export const deleteTest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const creator_id = req.user?.id;

        // Видаляємо лише якщо користувач є автором
        const deletedCount = await db('tests')
            .where({ id, creator_id })
            .delete();

        if (deletedCount === 0) {
            return res.status(403).json({ message: 'Ви не маєте прав на видалення цього тесту' });
        }

        res.json({ message: 'Тест успішно видалено' });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при видаленні тесту', error });
    }
};

// Додаємо в кінець файлу testController.ts
export const getTestStats = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const creator_id = req.user?.id;

        // 1. Перевіряємо, чи існує тест і чи належить він цьому автору
        const test = await db('tests').where({ id, creator_id }).first();
        if (!test) {
            return res.status(403).json({ message: 'Доступ заборонено або тест не знайдено' });
        }

        // 2. Отримуємо всі завершені спроби для цього тесту
        const attempts = await db('test_attempts')
            .leftJoin('users', 'test_attempts.user_id', 'users.id')
            .where({ test_id: id })
            .whereNotNull('finished_at') // Беремо тільки ті, що завершилися
            .select(
                'test_attempts.id',
                'test_attempts.score',
                'test_attempts.max_score',
                'test_attempts.finished_at',
                'test_attempts.guest_first_name',
                'test_attempts.guest_last_name',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name'
            )
            .orderBy('finished_at', 'desc');

        res.json({
            test_title: test.title,
            attempts
        });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні статистики', error });
    }
};