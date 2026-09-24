import { Router } from 'express';
import { resetDemoData, purgeDemoData } from '../controllers/demoController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.post('/reset', resetDemoData);
router.post('/purge', purgeDemoData);

export default router;
