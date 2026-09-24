import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getDashboardData);

export default router;
