import { Router } from 'express';
import { startAttempt, submitAttempt } from '../controllers/attemptController';
import { guestOrUser } from '../middleware/authMiddleware';

const router = Router();

// Застосовуємо гнучкий захист: пускаємо і зареєстрованих, і гостей з іменами
router.use(guestOrUser);

router.post('/', startAttempt);
router.put('/:id/submit', submitAttempt);

export default router;