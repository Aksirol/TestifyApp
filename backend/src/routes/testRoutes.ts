import { Router } from 'express';
import { createTest, getPublicTests, getMyTests, deleteTest, getTestStats } from '../controllers/testController'; // Додали getTestStats
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getPublicTests);
router.get('/my', getMyTests);
router.post('/', createTest);
router.delete('/:id', deleteTest);
router.get('/:id/stats', getTestStats); // Новий маршрут для статистики

export default router;