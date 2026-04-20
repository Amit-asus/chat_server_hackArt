import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import {
  registerHandler, loginHandler, logoutHandler,
  getSessionsHandler, revokeSessionHandler,
  changePasswordHandler, deleteAccountHandler, meHandler,
} from './auth.controller';
import { AuthenticatedRequest } from '../../types';

const router = Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 6 }),
], registerHandler); 

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], loginHandler);

router.post('/logout', authMiddleware as any, (req, res, next) => logoutHandler(req as AuthenticatedRequest, res, next));
router.get('/me', authMiddleware as any, (req, res, next) => meHandler(req as AuthenticatedRequest, res, next));
router.get('/sessions', authMiddleware as any, (req, res, next) => getSessionsHandler(req as AuthenticatedRequest, res, next));
router.delete('/sessions/:sessionId', authMiddleware as any, (req, res, next) => revokeSessionHandler(req as unknown as AuthenticatedRequest, res, next));
router.put('/password', authMiddleware as any, [
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], (req: any, res: any, next: any) => changePasswordHandler(req as AuthenticatedRequest, res, next));
router.delete('/account', authMiddleware as any, (req, res, next) => deleteAccountHandler(req as AuthenticatedRequest, res, next));

export default router;
