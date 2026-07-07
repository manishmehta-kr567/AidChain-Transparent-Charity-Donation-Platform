import { Router } from 'express';
import { createExpense, getCampaignExpenses } from '../controllers/expenseController';
import { protect, restrictTo } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', protect, restrictTo('ngo'), upload.single('proofImage'), createExpense);
router.get('/campaign/:campaignId', getCampaignExpenses);

export default router;
