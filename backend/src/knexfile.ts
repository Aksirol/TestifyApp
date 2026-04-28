import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

// Завантажуємо змінні середовища з файлу .env, який лежить на два рівні вище
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config: Knex.Config = {
    client: 'postgresql',
    connection: {
        host: 'localhost',
        port: Number(process.env.DB_LOCAL_PORT) || 5433,
        database: process.env.POSTGRES_DB,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
    },
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        directory: path.resolve(__dirname, './db/migrations'),
        extension: 'ts',
    },
};

// Експортуємо об'єкт із ключем development, як того очікує Knex
export default {
    development: config
};