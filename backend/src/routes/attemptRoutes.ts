import { Router } from 'express';
import { startAttempt, submitAttempt, getAttemptResult, getMyAttempts } from '../controllers/attemptController';
import { optionalAuthenticateToken, authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Отримання результатів за ID (публічно)
router.get('/:id', getAttemptResult);

// Історія (тільки для юзерів)
router.get('/my', authenticateToken, getMyAttempts);

// Початок тесту (і для гостей, і для юзерів)
router.post('/', optionalAuthenticateToken, startAttempt);

// Завершення (публічно)
router.put('/:id/submit', submitAttempt);

export default router;