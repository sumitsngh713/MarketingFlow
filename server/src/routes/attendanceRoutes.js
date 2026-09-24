import { Router } from 'express';
import {
  handleCheckIn,
  handleCheckOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  modifyAttendance,
} from '../controllers/attendanceController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = Router();

router.use(requireAuth);

router.post('/check-in', handleCheckIn);
router.post('/check-out', handleCheckOut);
router.get('/today', getTodayAttendance);
router.get('/my', getMyAttendance);

// Admin-only views & manual modification
router.get('/', requireAdmin, getAllAttendance);
router.put('/:id', requireAdmin, modifyAttendance);

export default router;
