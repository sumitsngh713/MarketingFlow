import { Router } from 'express';
import {
  getEmailAccounts,
  createEmailAccount,
  deleteEmailAccount,
  getWhatsAppAccounts,
  createWhatsAppAccount,
  getLinkedInQueue,
  handleUpdateLinkedInStatus,
  handleUnsubscribe,
  handleTrackOpen,
} from '../controllers/outreachController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

// Public webhook and tracking endpoints
router.get('/email/unsubscribe', handleUnsubscribe);
router.get('/email/track/open/:trackingId', handleTrackOpen);

// Protected routes
router.use(requireAuth);

// Email accounts (Admin only)
router.get('/email/accounts', requireAdmin, getEmailAccounts);
router.post('/email/accounts', requireAdmin, createEmailAccount);
router.delete('/email/accounts/:id', requireAdmin, deleteEmailAccount);

// WhatsApp accounts (Admin only)
router.get('/whatsapp/accounts', requireAdmin, getWhatsAppAccounts);
router.post('/whatsapp/accounts', requireAdmin, createWhatsAppAccount);

// LinkedIn queue (User-assisted outreach)
router.get('/linkedin/queue', getLinkedInQueue);
router.patch('/linkedin/queue/:id', handleUpdateLinkedInStatus);

export default router;
