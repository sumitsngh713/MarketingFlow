import { Router } from 'express';
import {
  getFollowups,
  createFollowup,
  completeFollowup,
} from '../controllers/followupController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFollowups);
router.post('/', createFollowup);
router.patch('/:id/complete', completeFollowup);

export default router;
