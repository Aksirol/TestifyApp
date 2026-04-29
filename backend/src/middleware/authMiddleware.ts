import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

// 1. Суворий захист (тільки для залогінених)
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Доступ заборонено. Токен відсутній.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Недійсний токен.' });
        req.user = decoded as { id: string; email: string };
        next();
    });
};

// 2. М'який захист (пропускає і гостей, і юзерів)
export const optionalAuthenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) req.user = decoded as { id: string; email: string };
        next();
    });
};