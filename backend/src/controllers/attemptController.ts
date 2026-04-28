import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import db from '../db/knex';

export const startAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const { test_id, guest_first_name, guest_last_name } = req.body;
        const user_id = req.user?.id || null; // Якщо токена немає, буде null (гість)

        // 1. Перевіряємо, чи існує тест
        const test = await db('tests').where({ id: test_id }).first();
        if (!test) {
            return res.status(404).json({ message: 'Тест не знайдено' });
        }

        // 2. Створюємо запис про нову спробу
        const [attempt] = await db('test_attempts').insert({
            test_id,
            user_id,
            guest_first_name: user_id ? null : guest_first_name,
            guest_last_name: user_id ? null : guest_last_name,
            // started_at встановиться автоматично завдяки базі даних
        }).returning('*');

        // 3. Дістаємо запитання
        const questions = await db('questions')
            .where({ test_id })
            .orderBy('position', 'asc');

        // 4. Дістаємо варіанти відповідей (БЕЗ поля is_correct, щоб уникнути шахрайства)
        for (let q of questions) {
            const options = await db('options')
                .where({ question_id: q.id })
                .select('id', 'content', 'position') // Зверни увагу: is_correct тут немає!
                .orderBy('position', 'asc');

            q.options = options;
        }

        res.status(201).json({ attempt, questions });
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