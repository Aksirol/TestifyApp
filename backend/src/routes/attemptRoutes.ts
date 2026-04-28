import { Router } from 'express';
import { startAttempt, submitAttempt, getAttemptResult } from '../controllers/attemptController';
import { guestOrUser } from '../middleware/authMiddleware';

const router = Router();

// Оскільки дізнатися UUID спроби неможливо без посилання, ми можемо зробити цей маршрут
// доступним для перегляду тим, хто має пряме посилання (щоб гість міг оновити сторінку)
router.get('/:id', getAttemptResult);

router.use(guestOrUser);
router.post('/', startAttempt);
router.put('/:id/submit', submitAttempt);

export default router;