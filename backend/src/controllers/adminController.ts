import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import Campaign from '../models/Campaign';
import Donation from '../models/Donation';
import Expense from '../models/Expense';
import Feedback from '../models/Feedback';

// GET /api/admin/stats  (admin only)
export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalUsers,
    totalDonors,
    totalNgos,
    pendingCampaigns,
    activeCampaigns,
    completedCampaigns,
    donationAgg,
    expenseAgg,
    feedbackAgg,
    uniqueDonorWallets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'donor' }),
    User.countDocuments({ role: 'ngo' }),
    Campaign.countDocuments({ status: 'pending' }),
    Campaign.countDocuments({ status: 'active' }),
    Campaign.countDocuments({ status: 'completed' }),
    Donation.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    Donation.distinct('donorWallet'),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      users: { total: totalUsers, donors: totalDonors, ngos: totalNgos },
      campaigns: {
        pending: pendingCampaigns,
        active: activeCampaigns,
        completed: completedCampaigns,
      },
      donations: {
        totalAmount: donationAgg[0]?.total || 0,
        totalCount: donationAgg[0]?.count || 0,
        uniqueWallets: uniqueDonorWallets.length,
      },
      expenses: {
        totalAmount: expenseAgg[0]?.total || 0,
      },
      feedback: {
        averageRating: feedbackAgg[0]?.avgRating || 0,
        totalResponses: feedbackAgg[0]?.count || 0,
      },
    },
  });
});

// PATCH /api/campaigns/:id/flag  (admin only) - risk flagging
export const flagCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { flagged, reason } = req.body;

  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { riskFlagged: flagged, riskFlagReason: flagged ? reason : undefined },
    { new: true }
  );

  res.status(200).json({ success: true, campaign });
});
