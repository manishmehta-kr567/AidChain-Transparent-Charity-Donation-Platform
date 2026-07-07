import { Router } from 'express';
import { updateWallet } from '../controllers/userController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateWalletSchema } from '../utils/validators';

const router = Router();

router.patch('/wallet', protect, validate(updateWalletSchema), updateWallet);

export default router;
