import { Router } from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  approveCampaign,
  rejectCampaign,
} from '../controllers/campaignController';
import { flagCampaign } from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCampaignSchema, approveCampaignSchema, rejectCampaignSchema } from '../utils/validators';

const router = Router();

router.get('/', getCampaigns);
router.get('/:id', getCampaignById);

router.post('/', protect, restrictTo('ngo'), validate(createCampaignSchema), createCampaign);
router.patch('/:id', protect, restrictTo('ngo'), updateCampaign);

router.patch(
  '/:id/approve',
  protect,
  restrictTo('admin'),
  validate(approveCampaignSchema),
  approveCampaign
);
router.patch(
  '/:id/reject',
  protect,
  restrictTo('admin'),
  validate(rejectCampaignSchema),
  rejectCampaign
);
router.patch('/:id/flag', protect, restrictTo('admin'), flagCampaign);

export default router;
