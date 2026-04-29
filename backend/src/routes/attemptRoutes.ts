import { Router } from 'express';
import { startAttempt, submitAttempt, getAttemptResult, getMyAttempts } from '../controllers/attemptController';
import { optionalAuthenticateToken, authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 1. КОНКРЕТНІ маршрути (завжди зверху!)
router.get('/my', authenticateToken, getMyAttempts);

// 2. ДИНАМІЧНІ маршрути (з параметрами :id)
router.get('/:id', getAttemptResult);

// 3. Інші дії
router.post('/', optionalAuthenticateToken, startAttempt);
router.put('/:id/submit', submitAttempt);

export default router;