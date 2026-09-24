import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.patch('/:id/status', requireAdmin, toggleUserStatus);
router.post('/:id/reset-password', requireAdmin, resetUserPassword);
router.delete('/:id', requireAdmin, deleteUser);

export default router;
