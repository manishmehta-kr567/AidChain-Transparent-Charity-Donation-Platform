import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Feedback from '../models/Feedback';

// POST /api/feedback
export const submitFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { rating, message } = req.body;

  const feedback = await Feedback.create({
    userId: req.user!.id,
    rating,
    message,
  });

  res.status(201).json({ success: true, feedback });
});
