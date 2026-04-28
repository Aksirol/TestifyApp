import knex from 'knex';
import config from '../knexfile';

// Беремо саме конфігурацію для development
const db = knex(config.development);

export default db;