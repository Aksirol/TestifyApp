import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import db from '../db/knex';
import { v4 as uuidv4 } from 'uuid';

export const createTest = async (req: AuthRequest, res: Response) => {
    // Використовуємо транзакцію, щоб зберегти все або нічого
    const trx = await db.transaction();

    try {
        const { title, description, is_public, time_limit_sec, show_correct, questions, tags } = req.body;
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
            invite_code,
            tags: tags || []
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

// Отримання тесту з усіма запитаннями для редактора
export const getTestById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const creator_id = req.user?.id;

        const test = await db('tests').where({ id, creator_id }).first();
        if (!test) return res.status(404).json({ message: 'Тест не знайдено або доступ заборонено' });

        const questions = await db('questions').where({ test_id: test.id }).orderBy('position', 'asc');

        // ДОДАНО: Виправлення N+1. Дістаємо всі варіанти одним запитом!
        const questionIds = questions.map(q => q.id);
        const allOptions = questionIds.length > 0
            ? await db('options')
                .whereIn('question_id', questionIds)
                .select('id', 'question_id', 'content', 'position', 'is_correct')
                .orderBy('position', 'asc')
            : [];

        for (let q of questions) {
            // Фільтруємо варіанти в пам'яті сервера (це в 100 разів швидше, ніж запити до БД)
            q.options = allOptions.filter(opt => opt.question_id === q.id);
        }

        res.json({ ...test, questions });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні тесту', error });
    }
};

// Оновлення існуючого тесту
export const updateTest = async (req: AuthRequest, res: Response) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const creator_id = req.user?.id;
        const { title, description, is_public, time_limit_sec, show_correct, questions, tags } = req.body;

        // 1. Перевіряємо, чи належить тест користувачу
        const test = await trx('tests').where({ id, creator_id }).first();
        if (!test) {
            await trx.rollback();
            return res.status(403).json({ message: 'Ви не маєте прав на редагування цього тесту' });
        }

        // 2. Оновлюємо базову інформацію тесту (додано обробку тегів)
        const invite_code = is_public ? null : (test.invite_code || uuidv4());
        await trx('tests').where({ id }).update({
            title, description, is_public, time_limit_sec, show_correct, invite_code, tags: tags || []
        });

        // ПРАВИЛЬНИЙ ПОРЯДОК ВИДАЛЕННЯ СТАРИХ ДАНИХ (знизу-вгору)

        // 3. Знаходимо всі спроби проходження цього тесту
        const attempts = await trx('test_attempts').where({ test_id: id }).select('id');
        const attemptIds = attempts.map(a => a.id);

        // Якщо тест хтось проходив, спочатку видаляємо їхні відповіді, а потім самі спроби
        if (attemptIds.length > 0) {
            await trx('attempt_answers').whereIn('attempt_id', attemptIds).delete();
            await trx('test_attempts').where({ test_id: id }).delete();
        }

        // 4. Знаходимо всі старі запитання
        const oldQuestions = await trx('questions').where({ test_id: id }).select('id');
        const oldQuestionIds = oldQuestions.map(q => q.id);

        // Видаляємо старі варіанти відповідей, а потім самі запитання
        if (oldQuestionIds.length > 0) {
            await trx('options').whereIn('question_id', oldQuestionIds).delete();
            await trx('questions').where({ test_id: id }).delete();
        }

        // 5. Записуємо нові запитання
        if (questions && Array.isArray(questions)) {
            for (const [qIdx, q] of questions.entries()) {
                const [question] = await trx('questions').insert({
                    test_id: id, content: q.content, position: qIdx + 1
                }).returning('*');

                if (q.options && Array.isArray(q.options)) {
                    const optionsToInsert = q.options.map((opt: any, oIdx: number) => ({
                        question_id: question.id, content: opt.content, is_correct: opt.is_correct, position: oIdx + 1
                    }));
                    await trx('options').insert(optionsToInsert);
                }
            }
        }

        await trx.commit();
        res.json({ message: 'Тест успішно оновлено' });
    } catch (error) {
        await trx.rollback();
        res.status(500).json({ message: 'Помилка при оновленні тесту', error });
    }
};

export const deleteTest = async (req: AuthRequest, res: Response) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const creator_id = req.user?.id;

        // 1. Перевіряємо, чи існує тест і чи належить він автору
        const test = await trx('tests').where({ id, creator_id }).first();
        if (!test) {
            await trx.rollback();
            return res.status(403).json({ message: 'Ви не маєте прав на видалення цього тесту' });
        }

        // ПРАВИЛЬНИЙ ПОРЯДОК ВИДАЛЕННЯ СТАРИХ ДАНИХ (знизу-вгору)

        // 2. Видаляємо відповіді та спроби учасників
        const attempts = await trx('test_attempts').where({ test_id: id }).select('id');
        const attemptIds = attempts.map(a => a.id);
        if (attemptIds.length > 0) {
            await trx('attempt_answers').whereIn('attempt_id', attemptIds).delete();
            await trx('test_attempts').where({ test_id: id }).delete();
        }

        // 3. Видаляємо варіанти та запитання
        const questions = await trx('questions').where({ test_id: id }).select('id');
        const questionIds = questions.map(q => q.id);
        if (questionIds.length > 0) {
            await trx('options').whereIn('question_id', questionIds).delete();
            await trx('questions').where({ test_id: id }).delete();
        }

        // 4. І лише тепер безпечно видаляємо сам тест
        await trx('tests').where({ id }).delete();

        await trx.commit();
        res.json({ message: 'Тест успішно видалено' });
    } catch (error) {
        await trx.rollback();
        res.status(500).json({ message: 'Помилка при видаленні тесту', error });
    }
};