import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Expense from '../models/Expense';
import Campaign from '../models/Campaign';
import { uploadProofImage } from '../services/uploadService';
import { AppError } from '../utils/AppError';

// POST /api/expenses  (NGO owner only, multipart/form-data with `proofImage`)
export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId, title, amount, description } = req.body;

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError('Campaign not found', 404);

  if (campaign.ngoId.toString() !== req.user!.id) {
    throw new AppError('You can only add expenses to your own campaigns', 403);
  }

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw new AppError('Expense amount must be a positive number', 400);
  }

  // Mirror the contract's core invariant at the API layer too, so bad
  // requests fail fast with a clear message before ever reaching chain.
  const alreadySpent = await Expense.aggregate([
    { $match: { campaignId: campaign._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalSpent = alreadySpent[0]?.total || 0;

  if (totalSpent + numericAmount > campaign.raisedAmount) {
    throw new AppError(
      `Expense exceeds remaining raised funds. Raised: ${campaign.raisedAmount}, already spent: ${totalSpent}`,
      400
    );
  }

  if (!req.file) {
    throw new AppError('Proof image is required', 400);
  }

  const { url, proofHash } = await uploadProofImage(req.file.buffer);

  const expense = await Expense.create({
    campaignId: campaign._id,
    ngoId: req.user!.id,
    title,
    amount: numericAmount,
    description,
    proofImageUrl: url,
    proofHash,
  });

  res.status(201).json({ success: true, expense });
});

// GET /api/expenses/campaign/:campaignId
export const getCampaignExpenses = asyncHandler(async (req: Request, res: Response) => {
  const expenses = await Expense.find({ campaignId: req.params.campaignId }).sort('-createdAt');
  res.status(200).json({ success: true, expenses });
});
