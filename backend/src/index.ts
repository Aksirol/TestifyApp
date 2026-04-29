import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import testRoutes from './routes/testRoutes';
import inviteRoutes from './routes/inviteRoutes';
import attemptRoutes from './routes/attemptRoutes';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true // Дозволяє передавати кукі та заголовки авторизації
}));
app.use(express.json());

// Підключаємо маршрути автентифікації
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/attempts', attemptRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
});