import { Router } from 'express';
import { getTestInfoByInviteCode } from '../controllers/inviteController';
import { optionalAuthenticateToken } from '../middleware/authMiddleware';

const router = Router();

// optionalAuthenticateToken має бути першим, щоб контролер знав про юзера
router.get('/:code', optionalAuthenticateToken, getTestInfoByInviteCode);

export default router;