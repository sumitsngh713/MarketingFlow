import { Router } from 'express';
import {
  getPerformanceReport,
  getAttendanceReport,
  getMarketingReport,
} from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/performance', getPerformanceReport);
router.get('/attendance', getAttendanceReport);
router.get('/marketing', getMarketingReport);

export default router;
