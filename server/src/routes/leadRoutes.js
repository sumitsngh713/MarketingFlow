import { Router } from 'express';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  checkDuplicates,
  importLeads,
} from '../controllers/leadController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getLeads);
router.post('/', createLead);
router.post('/check-duplicates', checkDuplicates);
router.post('/import', importLeads);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
