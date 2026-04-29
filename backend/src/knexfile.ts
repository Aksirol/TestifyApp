import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config: { [key: string]: Knex.Config } = {
    development: {
        client: "postgresql",
        connection: {
            database: process.env.POSTGRES_DB,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            host: "db", // ім'я контейнера БД
            port: 5432
        },
        migrations: {
            directory: "./db/migrations",
            extension: "ts"
        },
        // ДОДАЄМО ЦЕЙ БЛОК:
        seeds: {
            directory: "./db/seeds",
            extension: "ts"
        }
    },
};

export default config;