import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // 1. Таблиця QUESTIONS (Запитання)
    await knex.schema.createTable('questions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('test_id').references('id').inTable('tests').onDelete('CASCADE');
        table.text('content').notNullable(); // Текст запитання
        table.integer('position').notNullable(); // Порядковий номер запитання в тесті
    });

    // 2. Таблиця OPTIONS (Варіанти відповідей)
    await knex.schema.createTable('options', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('question_id').references('id').inTable('questions').onDelete('CASCADE');
        table.text('content').notNullable(); // Текст варіанту
        table.boolean('is_correct').defaultTo(false); // Чи правильна це відповідь
        table.integer('position').notNullable(); // Порядковий номер варіанту
    });

    // 3. Таблиця TEST_ATTEMPTS (Спроби проходження)
    await knex.schema.createTable('test_attempts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('test_id').references('id').inTable('tests').onDelete('CASCADE');

        // user_id робимо NULLable для гостьових проходжень
        table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('guest_first_name').nullable();
        table.string('guest_last_name').nullable();

        table.timestamp('started_at').defaultTo(knex.fn.now());
        table.timestamp('finished_at').nullable(); // Заповниться, коли тест буде завершено
        table.integer('score').nullable(); // Набрані бали (підраховуються в кінці)
        table.integer('max_score').nullable(); // Максимально можливий бал за тест
    });

    // 4. Таблиця ATTEMPT_ANSWERS (Відповіді користувача під час спроби)
    await knex.schema.createTable('attempt_answers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('attempt_id').references('id').inTable('test_attempts').onDelete('CASCADE');
        table.uuid('question_id').references('id').inTable('questions').onDelete('CASCADE');
        // option_id показує, який саме варіант обрав користувач
        table.uuid('option_id').references('id').inTable('options').onDelete('CASCADE');
    });
}

// Функція down для відкату міграції
// ВАЖЛИВО: Видаляємо таблиці у зворотному порядку, щоб не зламати залежності зовнішніх ключів
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('attempt_answers');
    await knex.schema.dropTableIfExists('test_attempts');
    await knex.schema.dropTableIfExists('options');
    await knex.schema.dropTableIfExists('questions');
}