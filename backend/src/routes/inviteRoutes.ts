import { Router } from 'express';
import { getTestInfoByInviteCode } from '../controllers/inviteController';

const router = Router();

// Обробляє GET-запити за шляхом /api/invite/:code
router.get('/:code', getTestInfoByInviteCode);

export default router;