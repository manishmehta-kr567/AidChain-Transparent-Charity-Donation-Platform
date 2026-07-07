import { Router } from 'express';
import {
  createDonation,
  getUserDonations,
  getCampaignDonations,
} from '../controllers/donationController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDonationSchema } from '../utils/validators';

const router = Router();

router.post('/', protect, restrictTo('donor'), validate(createDonationSchema), createDonation);
router.get('/user', protect, restrictTo('donor'), getUserDonations);
router.get('/campaign/:campaignId', getCampaignDonations);

export default router;
