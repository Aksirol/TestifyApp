import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import db from '../db/knex';

export const startAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const { test_id, guest_first_name, guest_last_name } = req.body;
        const user_id = req.user?.id || null;

        const test = await db('tests').where({ id: test_id }).first();
        if (!test) return res.status(404).json({ message: 'Тест не знайдено' });

        const [attempt] = await db('test_attempts').insert({
            test_id,
            user_id,
            guest_first_name: user_id ? null : guest_first_name,
            guest_last_name: user_id ? null : guest_last_name,
        }).returning('*');

        const questions = await db('questions').where({ test_id }).orderBy('position', 'asc');
        const questionIds = questions.map(q => q.id);

        // ВИПРАВЛЕНО N+1: Отримуємо всі варіанти ОДНИМ запитом замість циклу
        const allOptions = questionIds.length > 0
            ? await db('options')
                .whereIn('question_id', questionIds)
                .select('id', 'question_id', 'content', 'position')
                .orderBy('position', 'asc')
            : [];

        for (let q of questions) {
            q.options = allOptions.filter(opt => opt.question_id === q.id);
        }

        // ВИПРАВЛЕНО БАГ 3: Повертаємо таймер та назву тесту на фронтенд
        res.status(201).json({
            attempt,
            questions,
            test_title: test.title,
            time_limit_sec: test.time_limit_sec
        });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при початку тесту', error });
    }
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
    const trx = await db.transaction(); // Використовуємо транзакцію для збереження відповідей

    try {
        const { id } = req.params; // ID самої спроби
        const { answers } = req.body; // Масив об'єктів { question_id, option_id }

        // 1. Шукаємо спробу
        const attempt = await trx('test_attempts').where({ id }).first();
        if (!attempt) {
            return res.status(404).json({ message: 'Спробу не знайдено' });
        }

        // ДОДАНО: Якщо спроба належить зареєстрованому юзеру, ніхто інший не може її завершити
        if (attempt.user_id !== null && attempt.user_id !== req.user?.id) {
            await trx.rollback();
            return res.status(403).json({ message: 'Ви не маєте прав на збереження цієї спроби' });
        }

        if (attempt.finished_at) {
            return res.status(400).json({ message: 'Ця спроба вже завершена' });
        }

        // 2. Рахуємо максимальний бал (кількість запитань у тесті)
        const questionsCountResult = await trx('questions')
            .where({ test_id: attempt.test_id })
            .count('id as count')
            .first();
        const max_score = questionsCountResult ? Number(questionsCountResult.count) : 0;

        // 3. Отримуємо всі ПРАВИЛЬНІ варіанти для цього тесту з бази даних
        const correctOptions = await trx('options')
            .join('questions', 'options.question_id', 'questions.id')
            .where('questions.test_id', attempt.test_id)
            .andWhere('options.is_correct', true)
            .select('options.id');

        // Створюємо масив ID правильних варіантів для швидкої перевірки
        const correctOptionIds = correctOptions.map(opt => opt.id);

        // 4. Перевіряємо відповіді користувача та зберігаємо їх
        let score = 0;
        const answersToInsert = [];

        if (answers && Array.isArray(answers)) {
            for (const ans of answers) {
                // Якщо обраний варіант є в списку правильних — додаємо бал
                if (correctOptionIds.includes(ans.option_id)) {
                    score++;
                }

                // Готуємо запис для історії
                answersToInsert.push({
                    attempt_id: attempt.id,
                    question_id: ans.question_id,
                    option_id: ans.option_id
                });
            }
        }

        // Зберігаємо всі відповіді в БД
        if (answersToInsert.length > 0) {
            await trx('attempt_answers').insert(answersToInsert);
        }

        // 5. Оновлюємо статус спроби (час завершення та бали)
        const [finishedAttempt] = await trx('test_attempts')
            .where({ id })
            .update({
                finished_at: trx.fn.now(),
                score,
                max_score
            })
            .returning('*');

        await trx.commit(); // Підтверджуємо транзакцію

        // Повертаємо результат
        res.json({
            message: 'Тест успішно завершено',
            result: finishedAttempt
        });

    } catch (error) {
        await trx.rollback(); // Якщо помилка — відміняємо зміни
        res.status(500).json({ message: 'Помилка при збереженні результатів', error });
    }
};

export const getAttemptResult = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Отримуємо спробу
        const attempt = await db('test_attempts').where({ id }).first();
        if (!attempt) {
            return res.status(404).json({ message: 'Результати не знайдено' });
        }

        // 2. Отримуємо інформацію про тест
        const test = await db('tests').where({ id: attempt.test_id }).first();

        // 3. Отримуємо всі запитання для цього тесту
        const questions = await db('questions').where({ test_id: test.id }).orderBy('position', 'asc');

        // 4. Отримуємо відповіді користувача
        const attemptAnswers = await db('attempt_answers').where({ attempt_id: id });

        // 5. Отримуємо всі варіанти відповідей
        const options = await db('options').whereIn('question_id', questions.map(q => q.id));

        // 6. Формуємо детальний масив для фронтенду
        const detailedQuestions = questions.map(q => {
            // Шукаємо, що відповів користувач
            const userAnswerRecord = attemptAnswers.find(a => a.question_id === q.id);
            const userAnswer = options.find(o => o.id === userAnswerRecord?.option_id);

            // Шукаємо правильну відповідь
            const correctAnswer = options.find(o => o.question_id === q.id && o.is_correct);

            return {
                id: q.id,
                content: q.content,
                is_correct: userAnswer?.id === correctAnswer?.id,
                user_answer: userAnswer ? userAnswer.content : 'Немає відповіді',
                correct_answer: correctAnswer ? correctAnswer.content : 'Не вказано'
            };
        });

        res.json({
            score: attempt.score,
            max_score: attempt.max_score,
            test_title: test.title,
            questions: detailedQuestions
        });

    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні результатів', error });
    }
};

export const getMyAttempts = async (req: AuthRequest, res: Response) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: 'Необхідна авторизація' });
        }

        // Шукаємо всі спроби цього користувача та приєднуємо назву тесту
        const attempts = await db('test_attempts')
            .join('tests', 'test_attempts.test_id', 'tests.id')
            .where({ 'test_attempts.user_id': user_id })
            .select('test_attempts.*', 'tests.title as test_title')
            .orderBy('test_attempts.started_at', 'desc');

        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні історії спроб', error });
    }
};