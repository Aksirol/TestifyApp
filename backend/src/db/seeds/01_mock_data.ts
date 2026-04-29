import { Knex } from "knex";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export async function seed(knex: Knex): Promise<void> {
    // 1. Очищення існуючих даних (у правильному порядку, щоб не порушити зовнішні ключі)
    await knex('attempt_answers').del();
    await knex('test_attempts').del();
    await knex('options').del();
    await knex('questions').del();
    await knex('tests').del();
    await knex('users').del();

    // 2. Створення користувачів
    const passwordHash = await bcrypt.hash('password123', 10);

    const [admin] = await knex('users').insert({
        email: 'admin@testify.com',
        password_hash: passwordHash,
        first_name: 'Олександр',
        last_name: 'Адміненко'
    }).returning('*');

    const [teacher] = await knex('users').insert({
        email: 'teacher@testify.com',
        password_hash: passwordHash,
        first_name: 'Марія',
        last_name: 'Вчителька'
    }).returning('*');

    // 3. Створення тестів
    const [test1] = await knex('tests').insert({
        creator_id: admin.id,
        title: 'Основи JavaScript',
        description: 'Перевірте свої знання базового синтаксису JS',
        is_public: true,
        time_limit_sec: 600, // 10 хвилин
        show_correct: true
    }).returning('*');

    const [test2] = await knex('tests').insert({
        creator_id: teacher.id,
        title: 'Історія України (Приватний)',
        description: 'Контрольна робота для 11-А класу',
        is_public: false,
        invite_code: uuidv4(),
        time_limit_sec: 900, // 15 хвилин
        show_correct: false
    }).returning('*');

    const [test3] = await knex('tests').insert({
        creator_id: admin.id,
        title: 'Загальна ерудиція',
        description: 'Тест без обмеження в часі',
        is_public: true,
        time_limit_sec: null,
        show_correct: true
    }).returning('*');

    // 4. Створення запитань та варіантів для Тесту 1 (JS)
    const [q1] = await knex('questions').insert({ test_id: test1.id, content: 'Який метод додає елемент в кінець масиву?', position: 1 }).returning('*');
    await knex('options').insert([
        { question_id: q1.id, content: 'push()', is_correct: true, position: 1 },
        { question_id: q1.id, content: 'pop()', is_correct: false, position: 2 },
        { question_id: q1.id, content: 'shift()', is_correct: false, position: 3 },
    ]);

    const [q2] = await knex('questions').insert({ test_id: test1.id, content: 'Що поверне typeof null?', position: 2 }).returning('*');
    await knex('options').insert([
        { question_id: q2.id, content: '"null"', is_correct: false, position: 1 },
        { question_id: q2.id, content: '"object"', is_correct: true, position: 2 },
        { question_id: q2.id, content: '"undefined"', is_correct: false, position: 3 },
    ]);

    // Створення запитань та варіантів для Тесту 2 (Історія)
    const [q3] = await knex('questions').insert({ test_id: test2.id, content: 'В якому році прийнято Конституцію незалежної України?', position: 1 }).returning('*');
    const histOpts1 = await knex('options').insert([
        { question_id: q3.id, content: '1991', is_correct: false, position: 1 },
        { question_id: q3.id, content: '1996', is_correct: true, position: 2 },
        { question_id: q3.id, content: '2004', is_correct: false, position: 3 },
    ]).returning('*'); // Отримуємо ID варіантів для імітації відповідей нижче

    // 5. Імітація проходжень (Статистика)
    // Успішне проходження тесту 2 гостем
    const [attempt1] = await knex('test_attempts').insert({
        test_id: test2.id,
        user_id: null,
        guest_first_name: 'Іван',
        guest_last_name: 'Школяр',
        score: 1,
        max_score: 1,
        finished_at: knex.fn.now()
    }).returning('*');

    // Гість відповів правильно (1996)
    await knex('attempt_answers').insert({
        attempt_id: attempt1.id,
        question_id: q3.id,
        option_id: histOpts1.find(o => o.content === '1996')?.id
    });

    // Невдале проходження тесту 2 користувачем "admin"
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // Проходив 2 дні тому

    const [attempt2] = await knex('test_attempts').insert({
        test_id: test2.id,
        user_id: admin.id,
        score: 0,
        max_score: 1,
        finished_at: pastDate
    }).returning('*');

    // Адмін відповів неправильно (1991)
    await knex('attempt_answers').insert({
        attempt_id: attempt2.id,
        question_id: q3.id,
        option_id: histOpts1.find(o => o.content === '1991')?.id
    });

    console.log('✅ База даних успішно заповнена тестовими даними!');
}