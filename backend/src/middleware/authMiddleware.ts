import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Розширюємо стандартний Request, щоб додати туди розшифровані дані користувача
export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

// 1. Суворий захист: вимагає обов'язкової наявності валідного JWT
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Шукаємо заголовок Authorization (зазвичай у форматі "Bearer <токен>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Доступ заборонено. Токен відсутній.' });
    }

    // Перевіряємо, чи токен справжній і не прострочений
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Недійсний або прострочений токен.' });
        }

        // Зберігаємо дані користувача в об'єкт запиту для подальшого використання
        req.user = decoded as { id: string; email: string };
        next(); // Токен дійсний, пропускаємо запит далі
    });
};

// 2. Гнучкий захист: пропускає авторизованих користувачів АБО гостей
export const guestOrUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        // Якщо токен є, пробуємо його перевірити
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.user = decoded as { id: string; email: string };
            }
            // Пропускаємо далі в будь-якому випадку (навіть якщо токен невалідний, бо він міг просто прострочитись, а гість має право пройти)
            // Але безпечніше: якщо токен є, але невалідний - можна відхилити, або вважати гостем. Зробимо простіше:
            next();
        });
    } else {
        // Якщо токена немає, перевіряємо, чи передав фронтенд дані гостя
        const { guest_first_name, guest_last_name } = req.body;

        if (guest_first_name && guest_last_name) {
            next(); // Пропускаємо як гостя
        } else {
            return res.status(401).json({ message: 'Необхідна авторизація або вкажіть ім\'я та прізвище гостя.' });
        }
    }
};