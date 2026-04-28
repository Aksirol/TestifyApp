import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/knex';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name } = req.body;

        // Перевірка, чи користувач вже існує
        const existingUser = await db('users').where({ email }).first();
        if (existingUser) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
        }

        // Хешування пароля
        const password_hash = await bcrypt.hash(password, 10);

        // Збереження в БД
        const [newUser] = await db('users').insert({
            email,
            password_hash,
            first_name,
            last_name
        }).returning(['id', 'email', 'first_name', 'last_name']);

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: 'Помилка при реєстрації', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await db('users').where({ email }).first();
        if (!user) {
            return res.status(401).json({ message: 'Невірний email або пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Невірний email або пароль' });
        }

        // Генерація JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при вході', error });
    }
};