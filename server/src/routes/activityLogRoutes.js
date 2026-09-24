import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', getActivityLogs);

export default router;
