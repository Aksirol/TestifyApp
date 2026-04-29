import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Додаємо колонку tags до таблиці tests
    await knex.schema.alterTable('tests', (table) => {
        // Використовуємо специфічний тип масиву для PostgreSQL з порожнім масивом за замовчуванням
        table.specificType('tags', 'text ARRAY').defaultTo('{}');
    });
}

export async function down(knex: Knex): Promise<void> {
    // Якщо будемо відкочувати міграцію — видаляємо колонку
    await knex.schema.alterTable('tests', (table) => {
        table.dropColumn('tags');
    });
}