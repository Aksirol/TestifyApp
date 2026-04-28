import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // 1. Створення таблиці USERS
    await knex.schema.createTable('users', (table) => {
        // Використовуємо gen_random_uuid() для автоматичної генерації UUID в PostgreSQL
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email').notNullable().unique();
        table.string('password_hash').notNullable();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // 2. Створення таблиці TESTS
    await knex.schema.createTable('tests', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        // Зовнішній ключ (Foreign Key) на таблицю users
        table.uuid('creator_id').references('id').inTable('users').onDelete('CASCADE');

        table.string('title').notNullable();
        table.text('description');
        table.boolean('is_public').defaultTo(false);
        table.integer('time_limit_sec'); // NULL означає, що ліміту немає
        table.boolean('show_correct').defaultTo(false);

        // Унікальний код для приватних тестів
        table.string('invite_code').unique();

        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

// Функція down потрібна для скасування міграції (rollback)
export async function down(knex: Knex): Promise<void> {
    // Видаляємо спочатку tests, бо вона залежить від users
    await knex.schema.dropTableIfExists('tests');
    await knex.schema.dropTableIfExists('users');
}