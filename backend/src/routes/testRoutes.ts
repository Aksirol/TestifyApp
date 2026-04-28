import { Router } from 'express';
import { createTest, getPublicTests, getMyTests, deleteTest } from '../controllers/testController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Усі ці маршрути будуть захищені
router.use(authenticateToken);

router.get('/', getPublicTests);
router.get('/my', getMyTests);
router.post('/', createTest);
router.delete('/:id', deleteTest);

export default router;