import { Router } from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  startCampaign,
  pauseCampaign,
  duplicateCampaign,
  triggerQueueRun,
} from '../controllers/campaignController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', createCampaign);
router.post('/:id/start', startCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/duplicate', duplicateCampaign);
router.post('/process-queue', triggerQueueRun);

export default router;
