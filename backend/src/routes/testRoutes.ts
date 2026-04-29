import { Router } from 'express';
import {
    createTest, getPublicTests, getMyTests, deleteTest, getTestStats,
    getTestById, updateTest // ДОДАНО ІМПОРТИ
} from '../controllers/testController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getPublicTests);
router.get('/my', getMyTests);
router.post('/', createTest);
router.get('/:id', getTestById); // ДОДАНО: Отримання для редагування
router.put('/:id', updateTest); // ДОДАНО: Оновлення
router.delete('/:id', deleteTest);
router.get('/:id/stats', getTestStats);

export default router;