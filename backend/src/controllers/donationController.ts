import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Donation from '../models/Donation';
import Campaign from '../models/Campaign';
import User from '../models/User';
import { verifyStellarPayment } from '../services/stellarService';
import { AppError } from '../utils/AppError';

// POST /api/donations
// Body: { campaignId, txHash, amount }
// The donor's wallet is read from their profile (set via /api/users/wallet),
// never trusted from the request body, to prevent spoofing.
export const createDonation = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId, txHash, amount } = req.body;

  const [donor, campaign] = await Promise.all([
    User.findById(req.user!.id),
    Campaign.findById(campaignId).populate('ngoId', 'walletAddress'),
  ]);

  if (!donor) throw new AppError('Donor account not found', 404);
  if (!donor.walletAddress) throw new AppError('Connect your wallet before donating', 400);
  if (!campaign) throw new AppError('Campaign not found', 404);
  if (campaign.status !== 'active') throw new AppError('This campaign is not currently active', 400);

  const ngo = campaign.ngoId as unknown as { _id: mongoose.Types.ObjectId; walletAddress?: string };
  if (!ngo.walletAddress) {
    throw new AppError('This campaign\'s NGO has not linked a payout wallet', 400);
  }

  const existing = await Donation.findOne({ txHash });
  if (existing) {
    throw new AppError('This transaction has already been recorded', 409);
  }

  // Trust boundary: verify the payment actually happened on Stellar testnet
  // before writing anything. We never take amount/from/to from the client
  // at face value.
  const verified = await verifyStellarPayment(txHash, donor.walletAddress, ngo.walletAddress, amount);

  const session = await mongoose.startSession();
  let donation;

  try {
    await session.withTransaction(async () => {
      const created = await Donation.create(
        [
          {
            campaignId: campaign._id,
            donorId: donor._id,
            donorWallet: verified.from,
            ngoWallet: verified.to,
            amount: verified.amount,
            txHash: verified.txHash,
            network: 'testnet',
            status: 'success',
          },
        ],
        { session }
      );
      donation = created[0];

      campaign.raisedAmount += verified.amount;
      if (campaign.raisedAmount >= campaign.targetAmount) {
        campaign.status = 'completed';
      }
      await campaign.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({ success: true, donation, campaign });
});

// GET /api/donations/user
export const getUserDonations = asyncHandler(async (req: Request, res: Response) => {
  const donations = await Donation.find({ donorId: req.user!.id })
    .populate('campaignId', 'title imageUrl status')
    .sort('-createdAt');

  res.status(200).json({ success: true, donations });
});

// GET /api/donations/campaign/:campaignId
export const getCampaignDonations = asyncHandler(async (req: Request, res: Response) => {
  const donations = await Donation.find({
    campaignId: req.params.campaignId,
    status: 'success',
  })
    .populate('donorId', 'name')
    .sort('-createdAt');

  res.status(200).json({ success: true, donations });
});
