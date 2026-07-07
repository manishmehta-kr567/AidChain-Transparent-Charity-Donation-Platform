import { Router } from 'express';
import { submitFeedback } from '../controllers/feedbackController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { feedbackSchema } from '../utils/validators';

const router = Router();

router.post('/', protect, validate(feedbackSchema), submitFeedback);

export default router;
