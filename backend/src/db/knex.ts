import knex from 'knex';
import config from '../knexfile';

// Тепер підтягуємо середовище з .env або ставимо development за замовчуванням
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

export default db;