import { Router } from 'express';
import {
  login,
  logout,
  getMe,
  changePassword,
  checkSetupStatus,
  setupSuperAdmin,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/setup-status', checkSetupStatus);
router.post('/setup-admin', setupSuperAdmin);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);

export default router;
