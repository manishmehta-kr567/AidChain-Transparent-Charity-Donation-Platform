import { Router } from 'express';
import { getAdminStats } from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.get('/stats', protect, restrictTo('admin'), getAdminStats);

export default router;
